import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import branch_scope, get_current_user, require_csrf, require_roles
from app.errors import conflict, not_found
from app.models import Customer, PricingModel, PricingRuleVersion, Traveller, User
from app.schemas import (
    CustomerInput,
    CustomerOut,
    Page,
    PricingModelInput,
    PricingModelOut,
    TravellerInput,
)
from app.security import encrypt_sensitive
from app.services import audit, customer_agent_code

router = APIRouter(tags=["Business records"])
write_access = [Depends(require_csrf)]


@router.get("/customers", response_model=Page)
def list_customers(
    search: str = "",
    status: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scope = (Customer.company_id == user.company_id, branch_scope(Customer.branch_id, user))
    query = select(Customer).where(*scope)
    count = select(func.count()).select_from(Customer).where(*scope)
    if search:
        term = f"%{search}%"
        clause = or_(
            Customer.name.ilike(term),
            Customer.email.ilike(term),
            Customer.account_code.ilike(term),
            Customer.agent_code.ilike(term),
        )
        query, count = query.where(clause), count.where(clause)
    if status:
        query, count = query.where(Customer.status == status), count.where(Customer.status == status)
    rows = db.scalars(
        query.order_by(Customer.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return {
        "items": [CustomerOut.model_validate(row).model_dump(by_alias=True) for row in rows],
        "total": db.scalar(count) or 0,
        "page": page,
        "page_size": page_size,
    }


@router.post("/customers", response_model=CustomerOut, status_code=201, dependencies=write_access)
def create_customer(
    data: CustomerInput,
    request: Request,
    user: User = Depends(require_roles("Administrator", "Manager", "Agent")),
    db: Session = Depends(get_db),
):
    customer = Customer(
        company_id=user.company_id,
        branch_id=user.branch_id,
        agent_code=customer_agent_code(db),
        **data.model_dump(),
    )
    db.add(customer)
    audit(db, request, user, "customer.create", "customer", customer.id)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise conflict("The account code or generated agent code already exists.") from exc
    return customer


@router.get("/customers/{customer_id}", response_model=CustomerOut)
def get_customer(
    customer_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    customer = db.scalar(
        select(Customer).where(
            Customer.id == customer_id,
            Customer.company_id == user.company_id,
            branch_scope(Customer.branch_id, user),
        )
    )
    if not customer:
        raise not_found("Customer")
    return customer


@router.put("/customers/{customer_id}", response_model=CustomerOut, dependencies=write_access)
def update_customer(
    customer_id: uuid.UUID,
    data: CustomerInput,
    request: Request,
    user: User = Depends(require_roles("Administrator", "Manager", "Agent")),
    db: Session = Depends(get_db),
):
    customer = db.scalar(
        select(Customer).where(
            Customer.id == customer_id,
            Customer.company_id == user.company_id,
            branch_scope(Customer.branch_id, user),
        )
    )
    if not customer:
        raise not_found("Customer")
    for key, value in data.model_dump().items():
        setattr(customer, key, value)
    audit(db, request, user, "customer.update", "customer", customer.id)
    db.commit()
    return customer


@router.delete("/customers/{customer_id}", status_code=204, dependencies=write_access)
def deactivate_customer(
    customer_id: uuid.UUID,
    request: Request,
    user: User = Depends(require_roles("Administrator", "Manager")),
    db: Session = Depends(get_db),
):
    customer = db.scalar(
        select(Customer).where(
            Customer.id == customer_id,
            Customer.company_id == user.company_id,
            branch_scope(Customer.branch_id, user),
        )
    )
    if not customer:
        raise not_found("Customer")
    customer.status = "inactive"
    audit(db, request, user, "customer.deactivate", "customer", customer.id)
    db.commit()


def _traveller_out(row: Traveller) -> dict:
    return {
        "id": row.id,
        "branchId": row.branch_id,
        "firstName": row.first_name,
        "lastName": row.last_name,
        "email": row.email,
        "phone": row.phone,
        "city": row.city,
        "country": row.country,
        "dateOfBirth": row.date_of_birth,
        "passportMasked": f"••••{row.passport_last4}" if row.passport_last4 else "",
        "passportExpiry": row.passport_expiry,
        "customerId": row.customer_id,
        "preferences": row.preferences,
        "status": row.status,
        "createdAt": row.created_at,
    }


@router.get("/travellers", response_model=Page)
def list_travellers(
    search: str = "",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scope = (Traveller.company_id == user.company_id, branch_scope(Traveller.branch_id, user))
    query = select(Traveller).where(*scope)
    count = select(func.count()).select_from(Traveller).where(*scope)
    if search:
        term = f"%{search}%"
        clause = or_(
            Traveller.first_name.ilike(term), Traveller.last_name.ilike(term), Traveller.email.ilike(term)
        )
        query, count = query.where(clause), count.where(clause)
    rows = db.scalars(
        query.order_by(Traveller.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return {
        "items": [_traveller_out(row) for row in rows],
        "total": db.scalar(count) or 0,
        "page": page,
        "page_size": page_size,
    }


@router.post("/travellers", status_code=201, dependencies=write_access)
def create_traveller(
    data: TravellerInput,
    request: Request,
    user: User = Depends(require_roles("Administrator", "Manager", "Agent", "Sub Agent")),
    db: Session = Depends(get_db),
):
    values = data.model_dump(exclude={"passport_number"})
    traveller = Traveller(
        company_id=user.company_id,
        branch_id=user.branch_id,
        passport_encrypted=encrypt_sensitive(data.passport_number),
        passport_last4=data.passport_number[-4:] if data.passport_number else "",
        **values,
    )
    db.add(traveller)
    audit(db, request, user, "traveller.create", "traveller", traveller.id)
    db.commit()
    return _traveller_out(traveller)


@router.put("/travellers/{traveller_id}", dependencies=write_access)
def update_traveller(
    traveller_id: uuid.UUID,
    data: TravellerInput,
    request: Request,
    user: User = Depends(require_roles("Administrator", "Manager", "Agent", "Sub Agent")),
    db: Session = Depends(get_db),
):
    traveller = db.scalar(
        select(Traveller).where(
            Traveller.id == traveller_id,
            Traveller.company_id == user.company_id,
            branch_scope(Traveller.branch_id, user),
        )
    )
    if not traveller:
        raise not_found("Traveller")
    for key, value in data.model_dump(exclude={"passport_number"}).items():
        setattr(traveller, key, value)
    if data.passport_number:
        traveller.passport_encrypted = encrypt_sensitive(data.passport_number)
        traveller.passport_last4 = data.passport_number[-4:]
    audit(db, request, user, "traveller.update", "traveller", traveller.id)
    db.commit()
    return _traveller_out(traveller)


@router.get("/pricing-models", response_model=Page)
def list_pricing_models(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    where = PricingModel.company_id == user.company_id
    rows = db.scalars(
        select(PricingModel)
        .where(where)
        .order_by(PricingModel.priority, PricingModel.name)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return {
        "items": [PricingModelOut.model_validate(row).model_dump(by_alias=True) for row in rows],
        "total": db.scalar(select(func.count()).select_from(PricingModel).where(where)) or 0,
        "page": page,
        "page_size": page_size,
    }


@router.get("/pricing-templates")
def list_pricing_templates(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    models = db.scalars(select(PricingModel).where(PricingModel.company_id == user.company_id)).all()
    templates: list[dict] = []
    for model in models:
        version = db.scalar(
            select(PricingRuleVersion)
            .where(PricingRuleVersion.pricing_model_id == model.id)
            .order_by(PricingRuleVersion.version.desc())
        )
        if not version:
            continue
        configured = version.rules.get("templates", {})
        for category, template in configured.items():
            if template:
                templates.append(
                    {
                        "pricingModelId": model.id,
                        "pricingModel": model.name,
                        "category": category,
                        **template,
                    }
                )
    return templates


@router.post("/pricing-models", response_model=PricingModelOut, status_code=201, dependencies=write_access)
def create_pricing_model(
    data: PricingModelInput,
    request: Request,
    user: User = Depends(require_roles("Administrator", "Manager")),
    db: Session = Depends(get_db),
):
    values = data.model_dump(exclude={"rules"})
    model = PricingModel(company_id=user.company_id, **values)
    db.add(model)
    db.flush()
    db.add(PricingRuleVersion(pricing_model_id=model.id, version=1, rules=data.rules, created_by=user.id))
    audit(db, request, user, "pricing.create", "pricing_model", model.id)
    db.commit()
    return model
