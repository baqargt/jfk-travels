import uuid
from datetime import UTC, datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import branch_scope, get_current_user, require_csrf, require_roles
from app.errors import ApiError, not_found
from app.models import (
    Booking,
    Company,
    Customer,
    ExchangeRate,
    FileAsset,
    FinancialAccount,
    Notification,
    Refund,
    Traveller,
    User,
)
from app.schemas import FileCreateInput, Page
from app.services import audit
from app.storage import s3_client
from app.tasks import scan_file

router = APIRouter(tags=["Operations"])
write_access = [Depends(require_csrf)]


def _base_amount(
    db: Session,
    company: Company,
    currency: str,
    amount: Decimal,
    at: datetime,
) -> Decimal | None:
    if currency == company.base_currency:
        return amount
    rate = db.scalar(
        select(ExchangeRate.rate)
        .where(
            ExchangeRate.company_id == company.id,
            ExchangeRate.base_currency == company.base_currency,
            ExchangeRate.quote_currency == currency,
            ExchangeRate.effective_date <= at.date(),
        )
        .order_by(ExchangeRate.effective_date.desc())
        .limit(1)
    )
    return (amount * rate).quantize(Decimal("0.01")) if rate else None


@router.get("/dashboard/summary")
def dashboard_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = db.get(Company, user.company_id)
    booking_stats = db.execute(
        select(
            func.count(Booking.id),
            func.coalesce(func.sum(Booking.total_amount), 0),
        ).where(
            Booking.company_id == user.company_id,
            branch_scope(Booking.branch_id, user),
        )
    ).one()
    pending_refunds = (
        db.scalar(
            select(func.count())
            .select_from(Refund)
            .join(Booking, Booking.id == Refund.booking_id)
            .where(
                Booking.company_id == user.company_id,
                branch_scope(Booking.branch_id, user),
                Refund.status == "pending",
            )
        )
        or 0
    )
    accounts = db.execute(
        select(
            func.coalesce(func.sum(FinancialAccount.balance), 0),
            func.coalesce(func.sum(FinancialAccount.limit_amount), 0),
        ).where(
            FinancialAccount.company_id == user.company_id,
            branch_scope(FinancialAccount.branch_id, user),
        )
    ).one()
    return {
        "customers": db.scalar(
            select(func.count())
            .select_from(Customer)
            .where(
                Customer.company_id == user.company_id,
                branch_scope(Customer.branch_id, user),
            )
        )
        or 0,
        "travellers": db.scalar(
            select(func.count())
            .select_from(Traveller)
            .where(
                Traveller.company_id == user.company_id,
                branch_scope(Traveller.branch_id, user),
            )
        )
        or 0,
        "bookings": booking_stats[0],
        "grossSales": booking_stats[1],
        "refundsPending": pending_refunds,
        "availableBalance": accounts[0],
        "creditLimit": accounts[1],
        "currency": company.base_currency,
    }


@router.get("/reports/{report_type}", response_model=Page)
def report(
    report_type: str,
    status: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    user: User = Depends(require_roles("Administrator", "Manager", "Agent", "Accounts")),
    db: Session = Depends(get_db),
):
    company = db.get(Company, user.company_id)
    allowed = {"dsr", "air", "hotel", "misc", "refunds"}
    if report_type not in allowed:
        raise not_found("Report")
    if report_type == "refunds":
        query = (
            select(Refund, Booking.reference)
            .join(Booking, Booking.id == Refund.booking_id)
            .where(
                Booking.company_id == user.company_id,
                branch_scope(Booking.branch_id, user),
            )
        )
        if status:
            query = query.where(Refund.status == status)
        rows = db.execute(
            query.order_by(Refund.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        ).all()
        items = [
            {
                "id": refund.id,
                "bookingReference": reference,
                "amount": refund.amount,
                "penalty": refund.penalty,
                "netRefund": refund.amount - refund.penalty,
                "currency": refund.currency,
                "baseAmount": _base_amount(
                    db, company, refund.currency, refund.amount - refund.penalty, refund.created_at
                ),
                "baseCurrency": company.base_currency,
                "reason": refund.reason,
                "status": refund.status,
                "requestedOn": refund.created_at,
            }
            for refund, reference in rows
        ]
        count_query = (
            select(func.count())
            .select_from(Refund)
            .join(Booking, Booking.id == Refund.booking_id)
            .where(
                Booking.company_id == user.company_id,
                branch_scope(Booking.branch_id, user),
            )
        )
        if status:
            count_query = count_query.where(Refund.status == status)
        count = db.scalar(count_query) or 0
    else:
        service_filter = {"air": "flights", "hotel": "hotels"}.get(report_type)
        scope = (Booking.company_id == user.company_id, branch_scope(Booking.branch_id, user))
        query = select(Booking).where(*scope)
        count_query = select(func.count()).select_from(Booking).where(*scope)
        if service_filter:
            query, count_query = (
                query.where(Booking.service_type == service_filter),
                count_query.where(Booking.service_type == service_filter),
            )
        elif report_type == "misc":
            query, count_query = (
                query.where(Booking.service_type.not_in(["flights", "hotels"])),
                count_query.where(Booking.service_type.not_in(["flights", "hotels"])),
            )
        if status:
            query, count_query = (
                query.where(Booking.status == status),
                count_query.where(Booking.status == status),
            )
        rows = db.scalars(
            query.order_by(Booking.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        ).all()
        items = [
            {
                "id": row.id,
                "reference": row.reference,
                "service": row.service_type,
                "amount": row.total_amount,
                "currency": row.currency,
                "baseAmount": _base_amount(db, company, row.currency, row.total_amount, row.created_at),
                "baseCurrency": company.base_currency,
                "status": row.status,
                "date": row.created_at,
                "supplierReference": row.supplier_reference,
            }
            for row in rows
        ]
        count = db.scalar(count_query) or 0
    return {"items": items, "total": count, "page": page, "page_size": page_size}


@router.get("/notifications", response_model=Page)
def list_notifications(
    unread_only: bool = False,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scope = Notification.company_id == user.company_id
    visible = (Notification.user_id == user.id) | (Notification.user_id.is_(None))
    query = select(Notification).where(scope, visible)
    count = select(func.count()).select_from(Notification).where(scope, visible)
    if unread_only:
        query, count = (
            query.where(Notification.read_at.is_(None)),
            count.where(Notification.read_at.is_(None)),
        )
    rows = db.scalars(
        query.order_by(Notification.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return {
        "items": [
            {
                "id": row.id,
                "title": row.title,
                "message": row.message,
                "type": row.notification_type,
                "unread": row.read_at is None,
                "createdAt": row.created_at,
            }
            for row in rows
        ],
        "total": db.scalar(count) or 0,
        "page": page,
        "page_size": page_size,
    }


@router.post("/notifications/{notification_id}/read", status_code=204, dependencies=write_access)
def mark_notification_read(
    notification_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.scalar(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.company_id == user.company_id,
            (Notification.user_id == user.id) | (Notification.user_id.is_(None)),
        )
    )
    if not item:
        raise not_found("Notification")
    item.read_at = datetime.now(UTC)
    db.commit()


@router.post("/files/upload-url", status_code=201, dependencies=write_access)
def create_upload_url(
    data: FileCreateInput,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.size_bytes > settings.max_upload_bytes:
        raise ApiError(413, "File too large", f"Maximum upload size is {settings.max_upload_bytes} bytes.")
    extension = {"application/pdf": ".pdf", "image/jpeg": ".jpg", "image/png": ".png"}[data.content_type]
    asset_id = uuid.uuid4()
    object_key = f"{user.company_id}/{asset_id}{extension}"
    asset = FileAsset(
        id=asset_id,
        company_id=user.company_id,
        branch_id=user.branch_id,
        uploaded_by=user.id,
        object_key=object_key,
        original_name=data.original_name,
        content_type=data.content_type,
        size_bytes=data.size_bytes,
    )
    db.add(asset)
    audit(db, request, user, "file.upload.request", "file", asset.id)
    db.commit()
    url = s3_client(public=True).generate_presigned_url(
        "put_object",
        Params={"Bucket": settings.s3_bucket, "Key": object_key, "ContentType": data.content_type},
        ExpiresIn=900,
    )
    return {"id": asset.id, "uploadUrl": url, "expiresIn": 900, "requiredContentType": data.content_type}


@router.post("/files/{file_id}/complete", status_code=202, dependencies=write_access)
def complete_upload(
    file_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    asset = db.scalar(
        select(FileAsset).where(
            FileAsset.id == file_id,
            FileAsset.company_id == user.company_id,
            branch_scope(FileAsset.branch_id, user),
        )
    )
    if not asset:
        raise not_found("File")
    if asset.scan_status != "pending":
        raise ApiError(
            409, "Upload already processed", "This upload has already been submitted for scanning."
        )
    try:
        head = s3_client().head_object(Bucket=settings.s3_bucket, Key=asset.object_key)
    except Exception as exc:
        raise ApiError(409, "Upload missing", "Upload the file before completing it.") from exc
    if head["ContentLength"] != asset.size_bytes or head.get("ContentType") != asset.content_type:
        asset.scan_status = "rejected"
        db.commit()
        raise ApiError(
            422, "Upload mismatch", "Uploaded file size or content type does not match the request."
        )
    asset.scan_status = "scanning"
    db.commit()
    scan_file.delay(str(asset.id))
    return {"id": asset.id, "scanStatus": asset.scan_status}


@router.get("/files/{file_id}/download-url")
def download_url(
    file_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    asset = db.scalar(
        select(FileAsset).where(
            FileAsset.id == file_id,
            FileAsset.company_id == user.company_id,
            branch_scope(FileAsset.branch_id, user),
        )
    )
    if not asset:
        raise not_found("File")
    if asset.scan_status != "clean":
        raise ApiError(409, "File unavailable", f"File scan status is {asset.scan_status}.")
    url = s3_client(public=True).generate_presigned_url(
        "get_object",
        Params={
            "Bucket": settings.s3_bucket,
            "Key": asset.object_key,
            "ResponseContentDisposition": f'attachment; filename="{asset.original_name}"',
        },
        ExpiresIn=300,
    )
    return {"downloadUrl": url, "expiresIn": 300}
