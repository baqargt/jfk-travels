"""Platform (super admin) company management APIs."""

import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_csrf, require_super_admin
from app.errors import conflict, not_found
from app.models import (
    Booking,
    Branch,
    Company,
    Customer,
    Department,
    FinancialAccount,
    Permission,
    Refund,
    Traveller,
    User,
)
from app.schemas import (
    BranchOut,
    CompanyOut,
    CompanyUpdate,
    Page,
    PlatformCompanyCreate,
)
from app.security import hash_password
from app.seed import ROLE_PERMISSIONS
from app.services import (
    audit,
    company_payload,
    company_usage,
    department_code,
    ensure_company_access_profiles,
    ensure_default_job_title,
    user_payload,
)

router = APIRouter(prefix="/platform", tags=["Platform"])
write_access = [Depends(require_csrf), Depends(require_super_admin)]


def _permission_rows(db: Session) -> dict[str, Permission]:
    keys = sorted({key for perms in ROLE_PERMISSIONS.values() for key in perms})
    rows = db.scalars(select(Permission).where(Permission.key.in_(keys))).all()
    return {row.key: row for row in rows}


def _load_company(db: Session, company_id: uuid.UUID) -> Company:
    company = db.get(Company, company_id)
    if not company:
        raise not_found("Company")
    return company


@router.get("/companies", response_model=Page, dependencies=[Depends(require_super_admin)])
def list_companies(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    q: str | None = None,
    db: Session = Depends(get_db),
):
    query = select(Company)
    count = select(func.count()).select_from(Company)
    if q:
        term = f"%{q.strip()}%"
        filt = or_(
            Company.legal_name.ilike(term),
            Company.trading_name.ilike(term),
            Company.email.ilike(term),
        )
        query = query.where(filt)
        count = count.where(filt)
    rows = db.scalars(
        query.order_by(Company.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return {
        "items": [company_payload(row, db) for row in rows],
        "total": db.scalar(count) or 0,
        "page": page,
        "page_size": page_size,
    }


@router.post("/companies", response_model=CompanyOut, status_code=201, dependencies=write_access)
def create_company(
    data: PlatformCompanyCreate,
    request: Request,
    actor: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    existing_admin = db.scalar(select(User).where(User.email == data.admin_email.lower()))
    if existing_admin:
        raise conflict("That admin email address is already in use.")

    company = Company(
        legal_name=data.legal_name,
        trading_name=data.trading_name,
        email=data.email.lower(),
        phone=data.phone,
        address=data.address,
        iata_number=data.iata_number,
        uic_code=data.uic_code,
        business_license=data.business_license,
        base_currency=data.base_currency.upper(),
        timezone=data.timezone,
        max_sub_companies=data.max_sub_companies,
        max_users=data.max_users,
        max_travellers=data.max_travellers,
        status="active",
    )
    db.add(company)
    db.flush()

    branch = Branch(
        company_id=company.id,
        code="HQ",
        name=f"{data.trading_name} Head Office",
        branch_type="Branch",
        location="",
        manager_name=data.admin_name,
        currency=data.base_currency.upper(),
        credit_limit=Decimal("0"),
        cash_balance=Decimal("0"),
        status="active",
    )
    db.add(branch)
    db.flush()

    department = Department(
        company_id=company.id,
        branch_id=branch.id,
        code=department_code(db),
        name="Administration",
        head_name=data.admin_name,
        status="active",
    )
    db.add(department)
    db.flush()

    permission_rows = _permission_rows(db)
    profiles = ensure_company_access_profiles(db, company.id, ROLE_PERMISSIONS, permission_rows)
    staff_title = ensure_default_job_title(db, company.id, branch.id)

    admin = User(
        company_id=company.id,
        branch_id=branch.id,
        department_id=department.id,
        job_title_id=staff_title.id,
        access_profile_id=profiles["Administrator"].id,
        email=data.admin_email.lower(),
        display_name=data.admin_name,
        password_hash=hash_password(data.admin_password),
        status="active",
        is_super_admin=False,
    )
    db.add(admin)
    audit(
        db,
        request,
        actor,
        "platform.company.create",
        "company",
        company.id,
        {"admin_email": data.admin_email.lower()},
        company_id=company.id,
    )
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise conflict("Unable to create company with the provided details.") from exc
    db.refresh(company)
    return company_payload(company, db)


@router.get(
    "/companies/{company_id}",
    response_model=CompanyOut,
    dependencies=[Depends(require_super_admin)],
)
def get_company(company_id: uuid.UUID, db: Session = Depends(get_db)):
    return company_payload(_load_company(db, company_id), db)


@router.patch(
    "/companies/{company_id}",
    response_model=CompanyOut,
    dependencies=write_access,
)
def update_company(
    company_id: uuid.UUID,
    data: CompanyUpdate,
    request: Request,
    actor: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    company = _load_company(db, company_id)
    updates = data.model_dump(exclude_unset=True)
    usage = company_usage(db, company.id) if any(
        key in updates for key in ("max_sub_companies", "max_users", "max_travellers")
    ) else None
    for key in ("max_sub_companies", "max_users", "max_travellers"):
        if key in updates and usage is not None:
            kind = {
                "max_sub_companies": "sub_companies",
                "max_users": "users",
                "max_travellers": "travellers",
            }[key]
            if updates[key] < usage[kind]:
                raise conflict(
                    f"Cannot set {key.replace('_', ' ')} below current usage ({usage[kind]})."
                )
    for key, value in updates.items():
        setattr(company, key, value.upper() if key == "base_currency" else value)
    audit(
        db,
        request,
        actor,
        "platform.company.update",
        "company",
        company.id,
        company_id=company.id,
    )
    db.commit()
    db.refresh(company)
    return company_payload(company, db)


@router.get(
    "/companies/{company_id}/users",
    response_model=Page,
    dependencies=[Depends(require_super_admin)],
)
def list_company_users(
    company_id: uuid.UUID,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    q: str | None = None,
    db: Session = Depends(get_db),
):
    _load_company(db, company_id)
    query = select(User).where(User.company_id == company_id, User.is_super_admin.is_(False))
    count = select(func.count()).select_from(User).where(
        User.company_id == company_id, User.is_super_admin.is_(False)
    )
    if q:
        term = f"%{q.strip()}%"
        filt = or_(User.display_name.ilike(term), User.email.ilike(term))
        query = query.where(filt)
        count = count.where(filt)
    rows = db.scalars(
        query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return {
        "items": [user_payload(row) for row in rows],
        "total": db.scalar(count) or 0,
        "page": page,
        "page_size": page_size,
    }


@router.get(
    "/companies/{company_id}/travellers",
    response_model=Page,
    dependencies=[Depends(require_super_admin)],
)
def list_company_travellers(
    company_id: uuid.UUID,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    q: str | None = None,
    db: Session = Depends(get_db),
):
    _load_company(db, company_id)
    query = select(Traveller).where(Traveller.company_id == company_id)
    count = select(func.count()).select_from(Traveller).where(Traveller.company_id == company_id)
    if q:
        term = f"%{q.strip()}%"
        filt = or_(
            Traveller.first_name.ilike(term),
            Traveller.last_name.ilike(term),
            Traveller.email.ilike(term),
        )
        query = query.where(filt)
        count = count.where(filt)
    rows = db.scalars(
        query.order_by(Traveller.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    ).all()
    from app.routers.records import _traveller_out

    return {
        "items": [_traveller_out(row) for row in rows],
        "total": db.scalar(count) or 0,
        "page": page,
        "page_size": page_size,
    }


@router.get(
    "/companies/{company_id}/branches",
    response_model=Page,
    dependencies=[Depends(require_super_admin)],
)
def list_company_branches(
    company_id: uuid.UUID,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    _load_company(db, company_id)
    query = select(Branch).where(Branch.company_id == company_id)
    count = select(func.count()).select_from(Branch).where(Branch.company_id == company_id)
    rows = db.scalars(
        query.order_by(Branch.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    ).all()
    items = []
    for branch in rows:
        payload = BranchOut.model_validate(branch).model_dump(by_alias=True)
        payload["users"] = (
            db.scalar(select(func.count()).select_from(User).where(User.branch_id == branch.id)) or 0
        )
        items.append(payload)
    return {
        "items": items,
        "total": db.scalar(count) or 0,
        "page": page,
        "page_size": page_size,
    }


@router.get(
    "/companies/{company_id}/dashboard/summary",
    dependencies=[Depends(require_super_admin)],
)
def company_dashboard_summary(company_id: uuid.UUID, db: Session = Depends(get_db)):
    company = _load_company(db, company_id)
    booking_stats = db.execute(
        select(
            func.count(Booking.id),
            func.coalesce(func.sum(Booking.total_amount), 0),
        ).where(Booking.company_id == company_id)
    ).one()
    pending_refunds = (
        db.scalar(
            select(func.count())
            .select_from(Refund)
            .join(Booking, Booking.id == Refund.booking_id)
            .where(Booking.company_id == company_id, Refund.status == "pending")
        )
        or 0
    )
    accounts = db.execute(
        select(
            func.coalesce(func.sum(FinancialAccount.balance), 0),
            func.coalesce(func.sum(FinancialAccount.limit_amount), 0),
        ).where(FinancialAccount.company_id == company_id)
    ).one()
    return {
        "customers": db.scalar(
            select(func.count()).select_from(Customer).where(Customer.company_id == company_id)
        )
        or 0,
        "travellers": db.scalar(
            select(func.count()).select_from(Traveller).where(Traveller.company_id == company_id)
        )
        or 0,
        "bookings": booking_stats[0],
        "grossSales": booking_stats[1],
        "refundsPending": pending_refunds,
        "availableBalance": accounts[0],
        "creditLimit": accounts[1],
        "currency": company.base_currency,
    }


@router.get(
    "/companies/{company_id}/financial-accounts",
    dependencies=[Depends(require_super_admin)],
)
def company_financial_accounts(company_id: uuid.UUID, db: Session = Depends(get_db)):
    _load_company(db, company_id)
    rows = db.scalars(
        select(FinancialAccount)
        .where(FinancialAccount.company_id == company_id)
        .order_by(FinancialAccount.account_type, FinancialAccount.currency)
    ).all()
    return [
        {
            "id": row.id,
            "branchId": row.branch_id,
            "accountType": row.account_type,
            "currency": row.currency,
            "limitAmount": row.limit_amount,
            "balance": row.balance,
            "status": row.status,
        }
        for row in rows
    ]


@router.get(
    "/companies/{company_id}/reports/dsr",
    response_model=Page,
    dependencies=[Depends(require_super_admin)],
)
def company_dsr_report(
    company_id: uuid.UUID,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    company = _load_company(db, company_id)
    from app.routers.operations import _base_amount

    query = select(Booking).where(Booking.company_id == company_id)
    count_query = select(func.count()).select_from(Booking).where(Booking.company_id == company_id)
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
    return {
        "items": items,
        "total": db.scalar(count_query) or 0,
        "page": page,
        "page_size": page_size,
    }
