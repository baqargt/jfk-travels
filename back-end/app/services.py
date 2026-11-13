import uuid
from collections import defaultdict
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from typing import Literal

from fastapi import Request
from sqlalchemy import ColumnElement, func, select, text
from sqlalchemy.orm import Session

from app.errors import conflict
from app.models import (
    AuditLog,
    Booking,
    BookingServiceItem,
    Branch,
    Company,
    Customer,
    Department,
    FlightSegment,
    HotelStay,
    Traveller,
    User,
)

QuotaKind = Literal["sub_companies", "users", "travellers"]


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
    *,
    company_id: uuid.UUID | None = None,
) -> None:
    resolved_company_id = company_id if company_id is not None else user.company_id
    if resolved_company_id is None:
        return
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    db.add(
        AuditLog(
            company_id=resolved_company_id,
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
        "is_super_admin": bool(user.is_super_admin),
        "roles": roles,
        "permissions": permissions_for(user),
        "last_login_at": user.last_login_at,
    }


def company_usage(db: Session, company_id: uuid.UUID) -> dict[str, int]:
    sub_companies = (
        db.scalar(
            select(func.count())
            .select_from(Branch)
            .where(Branch.company_id == company_id, Branch.status == "active")
        )
        or 0
    )
    users = (
        db.scalar(
            select(func.count())
            .select_from(User)
            .where(User.company_id == company_id, User.status == "active", User.is_super_admin.is_(False))
        )
        or 0
    )
    travellers = (
        db.scalar(select(func.count()).select_from(Traveller).where(Traveller.company_id == company_id)) or 0
    )
    return {
        "sub_companies": sub_companies,
        "users": users,
        "travellers": travellers,
    }


def company_payload(company: Company, db: Session | None = None) -> dict:
    """Serialize company for API responses using camelCase aliases for the frontend."""
    from app.schemas import CompanyOut

    payload = {
        "id": company.id,
        "legal_name": company.legal_name,
        "trading_name": company.trading_name,
        "email": company.email,
        "phone": company.phone or "",
        "address": company.address or "",
        "iata_number": company.iata_number or "",
        "uic_code": company.uic_code or "",
        "business_license": company.business_license or "",
        "base_currency": company.base_currency or "USD",
        "timezone": company.timezone or "UTC",
        "status": company.status or "active",
        "max_sub_companies": company.max_sub_companies if company.max_sub_companies is not None else 5,
        "max_users": company.max_users if company.max_users is not None else 50,
        "max_travellers": company.max_travellers if company.max_travellers is not None else 500,
        "usage": company_usage(db, company.id) if db is not None else None,
    }
    return CompanyOut.model_validate(payload).model_dump(by_alias=True, mode="json")


def assert_company_quota(db: Session, company_id: uuid.UUID, kind: QuotaKind) -> None:
    company = db.get(Company, company_id)
    if not company:
        raise conflict("Company was not found.")
    usage = company_usage(db, company_id)
    limits = {
        "sub_companies": company.max_sub_companies,
        "users": company.max_users,
        "travellers": company.max_travellers,
    }
    labels = {
        "sub_companies": "sub-companies",
        "users": "users",
        "travellers": "traveller profiles",
    }
    if usage[kind] >= limits[kind]:
        raise conflict(
            f"Company has reached its maximum of {limits[kind]} {labels[kind]}."
        )


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


def _chart_since(days: int) -> datetime:
    days = max(1, min(days, 365))
    start = datetime.now(UTC).date() - timedelta(days=days - 1)
    return datetime(start.year, start.month, start.day, tzinfo=UTC)


def dashboard_sales_chart(
    db: Session,
    company_id: uuid.UUID,
    *,
    days: int = 30,
    branch_clause: ColumnElement | None = None,
) -> list[dict]:
    """Daily sales totals for a continuous date window."""
    days = max(1, min(days, 365))
    since = _chart_since(days)
    day_expr = func.date(Booking.created_at)
    conditions = [
        Booking.company_id == company_id,
        Booking.created_at >= since,
    ]
    if branch_clause is not None:
        conditions.append(branch_clause)
    rows = db.execute(
        select(day_expr, func.coalesce(func.sum(Booking.total_amount), 0))
        .where(*conditions)
        .group_by(day_expr)
        .order_by(day_expr)
    ).all()
    by_day: dict[date, Decimal] = {
        (row[0] if isinstance(row[0], date) else row[0].date()): Decimal(str(row[1] or 0))
        for row in rows
    }
    today = datetime.now(UTC).date()
    start = today - timedelta(days=days - 1)
    items: list[dict] = []
    cursor = start
    while cursor <= today:
        sales = by_day.get(cursor, Decimal("0"))
        items.append(
            {
                "date": cursor.isoformat(),
                "label": cursor.strftime("%b %d"),
                "sales": float(sales),
            }
        )
        cursor += timedelta(days=1)
    return items


def dashboard_destinations_chart(
    db: Session,
    company_id: uuid.UUID,
    *,
    days: int = 30,
    limit: int = 8,
    branch_clause: ColumnElement | None = None,
) -> list[dict]:
    """Top destinations from flight segments and hotel cities in the window."""
    days = max(1, min(days, 365))
    limit = max(1, min(limit, 50))
    since = _chart_since(days)
    booking_scope = [
        Booking.company_id == company_id,
        Booking.created_at >= since,
    ]
    if branch_clause is not None:
        booking_scope.append(branch_clause)

    flight_rows = db.execute(
        select(FlightSegment.destination, Booking.id, Booking.total_amount)
        .select_from(FlightSegment)
        .join(BookingServiceItem, FlightSegment.service_item_id == BookingServiceItem.id)
        .join(Booking, BookingServiceItem.booking_id == Booking.id)
        .where(*booking_scope, FlightSegment.destination != "")
    ).all()
    hotel_rows = db.execute(
        select(HotelStay.city, Booking.id, Booking.total_amount)
        .select_from(HotelStay)
        .join(BookingServiceItem, HotelStay.service_item_id == BookingServiceItem.id)
        .join(Booking, BookingServiceItem.booking_id == Booking.id)
        .where(*booking_scope, HotelStay.city != "")
    ).all()

    dest_bookings: dict[str, set[uuid.UUID]] = defaultdict(set)
    booking_amounts: dict[uuid.UUID, Decimal] = {}
    for name, booking_id, amount in [*flight_rows, *hotel_rows]:
        label = (name or "").strip()
        if not label:
            continue
        dest_bookings[label].add(booking_id)
        booking_amounts[booking_id] = Decimal(str(amount or 0))

    items = [
        {
            "name": name,
            "bookings": len(booking_ids),
            "amount": float(sum(booking_amounts[bid] for bid in booking_ids)),
        }
        for name, booking_ids in dest_bookings.items()
    ]
    items.sort(key=lambda row: (-row["bookings"], -row["amount"], row["name"]))
    return items[:limit]
