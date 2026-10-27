import uuid
from datetime import UTC, datetime

from fastapi import Request
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.models import AuditLog, Customer, Department, User


def next_code(db: Session, model: type, field, prefix: str, width: int) -> str:
    db.execute(text("SELECT pg_advisory_xact_lock(hashtext(:key))"), {"key": f"code:{prefix}"})
    latest = db.scalar(select(field).order_by(field.desc()).limit(1))
    try:
        number = int(str(latest).split("-")[-1]) + 1 if latest else 1
    except ValueError:
        count = db.scalar(select(func.count()).select_from(model)) or 0
        number = count + 1
    return f"{prefix}-{number:0{width}d}"


def audit(
    db: Session,
    request: Request,
    user: User,
    action: str,
    entity_type: str,
    entity_id: uuid.UUID | str,
    details: dict | None = None,
) -> None:
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    db.add(
        AuditLog(
            company_id=user.company_id,
            actor_id=user.id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            details=details or {},
            ip_address=forwarded or (request.client.host if request.client else ""),
        )
    )


def user_payload(user: User) -> dict:
    permissions = sorted({permission.key for role in user.roles for permission in role.permissions})
    return {
        "id": user.id,
        "email": user.email,
        "name": user.display_name,
        "status": user.status,
        "company_id": user.company_id,
        "branch_id": user.branch_id,
        "department_id": user.department_id,
        "roles": [role.name for role in user.roles],
        "permissions": permissions,
        "last_login_at": user.last_login_at,
    }


def department_user_count(db: Session, department_id: uuid.UUID) -> int:
    return db.scalar(select(func.count()).select_from(User).where(User.department_id == department_id)) or 0


def customer_agent_code(db: Session) -> str:
    return next_code(db, Customer, Customer.agent_code, "AGT", 6)


def department_code(db: Session) -> str:
    return next_code(db, Department, Department.code, "DEP", 3)


def utcnow() -> datetime:
    return datetime.now(UTC)
