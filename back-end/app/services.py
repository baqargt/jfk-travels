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
    from app.dependencies import permissions_for, role_names_for

    roles = sorted(role_names_for(user))
    return {
        "id": user.id,
        "email": user.email,
        "name": user.display_name,
        "status": user.status,
        "company_id": user.company_id,
        "branch_id": user.branch_id,
        "department_id": user.department_id,
        "job_title_id": user.job_title_id,
        "access_profile_id": user.access_profile_id,
        "roles": roles,
        "permissions": permissions_for(user),
        "last_login_at": user.last_login_at,
    }


def job_title_code(db: Session) -> str:
    from app.models import JobTitle

    return next_code(db, JobTitle, JobTitle.code, "JT", 3)


def ensure_company_access_profiles(
    db: Session, company_id, role_permissions: dict[str, list[str]], permission_rows: dict
):
    """Seed Access Profiles from Role presets for a company; return map preset_key -> AccessProfile."""
    from app.models import AccessProfile

    profiles: dict = {}
    for role_name, keys in role_permissions.items():
        profile = db.scalar(
            select(AccessProfile).where(
                AccessProfile.company_id == company_id,
                AccessProfile.preset_key == role_name,
            )
        )
        if not profile:
            profile = db.scalar(
                select(AccessProfile).where(
                    AccessProfile.company_id == company_id,
                    AccessProfile.name == role_name,
                )
            )
        if not profile:
            profile = AccessProfile(
                company_id=company_id,
                name=role_name,
                description=f"Preset {role_name} access profile",
                preset_key=role_name,
                status="active",
            )
            db.add(profile)
            db.flush()
        profile.preset_key = role_name
        profile.permissions = [permission_rows[key] for key in keys if key in permission_rows]
        profiles[role_name] = profile
    return profiles


def ensure_default_job_title(db: Session, company_id, branch_id=None):
    from app.models import JobTitle

    title = db.scalar(
        select(JobTitle).where(JobTitle.company_id == company_id, JobTitle.name == "Staff")
    )
    if not title:
        title = JobTitle(
            company_id=company_id,
            branch_id=branch_id,
            code=job_title_code(db),
            name="Staff",
            status="active",
        )
        db.add(title)
        db.flush()
    return title


def department_user_count(db: Session, department_id: uuid.UUID) -> int:
    return db.scalar(select(func.count()).select_from(User).where(User.department_id == department_id)) or 0


def customer_agent_code(db: Session) -> str:
    return next_code(db, Customer, Customer.agent_code, "AGT", 6)


def department_code(db: Session) -> str:
    return next_code(db, Department, Department.code, "DEP", 3)


def customer_payload(customer) -> dict:
    return {
        "id": customer.id,
        "branch_id": customer.branch_id,
        "branch_ids": [branch.id for branch in customer.branches],
        "pricing_model_id": customer.pricing_model_id,
        "supplier_connection_ids": [supplier.id for supplier in customer.suppliers],
        "account_code": customer.account_code,
        "agent_code": customer.agent_code,
        "name": customer.name,
        "email": customer.email,
        "telephone": customer.telephone,
        "mobile": customer.mobile,
        "website": customer.website,
        "default_currency": customer.default_currency,
        "status": customer.status,
        "profile": customer.profile or {},
        "created_at": customer.created_at,
    }


def utcnow() -> datetime:
    return datetime.now(UTC)
