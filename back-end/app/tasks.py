import smtplib
import uuid
from datetime import UTC, datetime
from email.message import EmailMessage

import clamd
from celery import Celery
from sqlalchemy import select

from app.config import settings
from app.database import SessionLocal
from app.models import FileAsset, FinancialAccount, Notification, TemporaryLimit, User
from app.storage import s3_client

celery_app = Celery("jfk_erp", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.beat_schedule = {
    "expire-temporary-limits-hourly": {
        "task": "app.tasks.expire_temporary_limits",
        "schedule": 3600.0,
    }
}
celery_app.conf.timezone = "UTC"


@celery_app.task(name="app.tasks.scan_file")
def scan_file(file_id: str) -> None:
    with SessionLocal() as db:
        asset = db.get(FileAsset, uuid.UUID(file_id))
        if not asset:
            return
        try:
            body = s3_client().get_object(Bucket=settings.s3_bucket, Key=asset.object_key)["Body"].read()
            scanner = clamd.ClamdNetworkSocket(settings.clamav_host, 3310, timeout=60)
            result = scanner.instream(body)
            status = next(iter(result.values()))[0] if result else "ERROR"
            asset.scan_status = "clean" if status == "OK" else "infected"
            if asset.scan_status == "infected":
                s3_client().delete_object(Bucket=settings.s3_bucket, Key=asset.object_key)
        except Exception:
            asset.scan_status = "failed"
        db.commit()


@celery_app.task(name="app.tasks.expire_temporary_limits")
def expire_temporary_limits() -> int:
    now = datetime.now(UTC)
    expired_count = 0
    emails: list[tuple[str, str]] = []
    with SessionLocal() as db:
        limits = db.scalars(
            select(TemporaryLimit).where(TemporaryLimit.status == "active", TemporaryLimit.expires_at <= now)
        ).all()
        for item in limits:
            account = db.scalar(
                select(FinancialAccount).where(FinancialAccount.id == item.account_id).with_for_update()
            )
            if not account:
                continue
            remaining = item.amount - item.used
            account.balance = max(account.balance - remaining, 0)
            item.status = "expired"
            db.add(
                Notification(
                    company_id=account.company_id,
                    title="Temporary limit expired",
                    message=f"Temporary limit {item.id} has expired.",
                    notification_type="warning",
                )
            )
            recipients = db.scalars(
                select(User.email).where(User.company_id == account.company_id, User.status == "active")
            ).all()
            emails.extend((email, str(item.id)) for email in recipients)
            expired_count += 1
        db.commit()
    for email, limit_id in emails:
        args = (
            email,
            "Temporary limit expired",
            f"Temporary limit {limit_id} expired and its unused balance was removed.",
        )
        if settings.celery_enabled:
            send_email.delay(*args)
        else:
            send_email.run(*args)
    return expired_count


@celery_app.task(name="app.tasks.send_email")
def send_email(to_address: str, subject: str, body: str) -> None:
    if not settings.smtp_host:
        return
    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = to_address
    message["Subject"] = subject
    message.set_content(body)
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as smtp:
        smtp.starttls()
        if settings.smtp_username:
            smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(message)
