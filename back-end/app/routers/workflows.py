import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, Header, Query, Request
from fastapi.encoders import jsonable_encoder
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import branch_scope, get_current_user, require_csrf, require_roles
from app.errors import ApiError, conflict, forbidden, not_found
from app.models import (
    ApprovalRequest,
    Booking,
    BookingPassenger,
    BookingSearch,
    BookingServiceItem,
    BookingStatusHistory,
    Branch,
    Company,
    Customer,
    ExchangeRate,
    FinancialAccount,
    IdempotencyRecord,
    LedgerEntry,
    Notification,
    OutboxEvent,
    Payment,
    PricingModel,
    PricingRuleVersion,
    Quote,
    QuoteItem,
    Refund,
    Role,
    TemporaryLimit,
    Ticket,
    User,
)
from app.pricing import evaluate_price
from app.schemas import (
    ApprovalInput,
    BookingConfirmInput,
    CashAllocationInput,
    ExchangeRateInput,
    FinancialAccountInput,
    LedgerReversalInput,
    LimitAdjustmentInput,
    LimitRequestInput,
    Page,
    QuoteInput,
    RefundInput,
    SearchInput,
)
from app.services import audit, next_code
from app.suppliers import FakeSupplier

router = APIRouter(tags=["Workflows"])
write_access = [Depends(require_csrf)]
supplier = FakeSupplier()


def _ensure_finance_ready(db: Session, company_id: uuid.UUID) -> None:
    if settings.environment != "production":
        return
    privileged = (
        db.scalar(
            select(func.count(func.distinct(User.id)))
            .select_from(User)
            .join(User.roles)
            .where(
                User.company_id == company_id,
                User.status == "active",
                Role.name.in_(["Administrator", "Manager"]),
            )
        )
        or 0
    )
    if privileged < 2:
        raise ApiError(
            503,
            "Finance setup incomplete",
            "At least two active Administrator or Manager users are required.",
        )


def _approval_out(row: ApprovalRequest) -> dict:
    return {
        "id": row.id,
        "requestType": row.request_type,
        "entityType": row.entity_type,
        "entityId": row.entity_id,
        "requestedBy": row.requested_by,
        "decidedBy": row.decided_by,
        "status": row.status,
        "reason": row.reason,
        "decisionComment": row.decision_comment,
        "payload": row.payload,
        "createdAt": row.created_at,
        "decidedAt": row.decided_at,
    }


def _booking_out(row: Booking) -> dict:
    return {
        "id": row.id,
        "reference": row.reference,
        "supplierReference": row.supplier_reference,
        "serviceType": row.service_type,
        "status": row.status,
        "currency": row.currency,
        "totalAmount": row.total_amount,
        "details": row.details,
        "createdAt": row.created_at,
        "updatedAt": row.updated_at,
    }


@router.post("/pricing-models/{model_id}/submit", status_code=201, dependencies=write_access)
def submit_pricing_model(
    model_id: uuid.UUID,
    request: Request,
    reason: str = "Ready for activation",
    user: User = Depends(require_roles("Administrator", "Manager")),
    db: Session = Depends(get_db),
):
    model = db.scalar(
        select(PricingModel).where(PricingModel.id == model_id, PricingModel.company_id == user.company_id)
    )
    if not model:
        raise not_found("Pricing model")
    pending = db.scalar(
        select(ApprovalRequest).where(
            ApprovalRequest.entity_id == str(model.id), ApprovalRequest.status == "pending"
        )
    )
    if pending:
        raise conflict("This pricing model already has a pending approval request.")
    version = (
        db.scalar(
            select(func.max(PricingRuleVersion.version)).where(
                PricingRuleVersion.pricing_model_id == model.id
            )
        )
        or 1
    )
    approval = ApprovalRequest(
        company_id=user.company_id,
        branch_id=user.branch_id,
        request_type="pricing_activation",
        entity_type="pricing_model",
        entity_id=str(model.id),
        requested_by=user.id,
        reason=reason,
        payload={"version": version},
    )
    model.status = "pending"
    db.add(approval)
    audit(db, request, user, "pricing.submit", "pricing_model", model.id, {"version": version})
    db.commit()
    return _approval_out(approval)


@router.get("/approval-requests", response_model=Page)
def list_approval_requests(
    status: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    user: User = Depends(require_roles("Administrator", "Manager")),
    db: Session = Depends(get_db),
):
    query = select(ApprovalRequest).where(
        ApprovalRequest.company_id == user.company_id,
        branch_scope(ApprovalRequest.branch_id, user),
    )
    count = (
        select(func.count())
        .select_from(ApprovalRequest)
        .where(
            ApprovalRequest.company_id == user.company_id,
            branch_scope(ApprovalRequest.branch_id, user),
        )
    )
    if status:
        query, count = (
            query.where(ApprovalRequest.status == status),
            count.where(ApprovalRequest.status == status),
        )
    rows = db.scalars(
        query.order_by(ApprovalRequest.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return {
        "items": [_approval_out(row) for row in rows],
        "total": db.scalar(count) or 0,
        "page": page,
        "page_size": page_size,
    }


@router.post("/approval-requests/{approval_id}/decide", dependencies=write_access)
def decide_approval(
    approval_id: uuid.UUID,
    data: ApprovalInput,
    request: Request,
    user: User = Depends(require_roles("Administrator", "Manager")),
    db: Session = Depends(get_db),
):
    approval = db.scalar(
        select(ApprovalRequest)
        .where(
            ApprovalRequest.id == approval_id,
            ApprovalRequest.company_id == user.company_id,
            branch_scope(ApprovalRequest.branch_id, user),
        )
        .with_for_update()
    )
    if not approval:
        raise not_found("Approval request")
    if approval.status != "pending":
        raise conflict("This request has already been decided.")
    if approval.requested_by == user.id:
        raise forbidden("The requester cannot approve or reject their own request.")

    approval.status = data.decision
    approval.decided_by = user.id
    approval.decision_comment = data.comment
    approval.decided_at = datetime.now(UTC)

    if approval.request_type == "pricing_activation":
        model = db.get(PricingModel, uuid.UUID(approval.entity_id))
        if model:
            model.status = "active" if data.decision == "approved" else "draft"
            if data.decision == "approved":
                model.active_version = int(approval.payload.get("version", 1))
    elif approval.request_type == "temporary_limit":
        limit = db.get(TemporaryLimit, uuid.UUID(approval.entity_id))
        if limit:
            limit.status = "active" if data.decision == "approved" else "rejected"
            if data.decision == "approved":
                account = db.scalar(
                    select(FinancialAccount).where(FinancialAccount.id == limit.account_id).with_for_update()
                )
                account.balance += limit.amount
    elif approval.request_type == "limit_adjustment" and data.decision == "approved":
        account = db.scalar(
            select(FinancialAccount)
            .where(FinancialAccount.id == uuid.UUID(approval.entity_id))
            .with_for_update()
        )
        if account:
            account.limit_amount = Decimal(str(approval.payload["new_limit"]))
    elif approval.request_type == "refund":
        refund = db.get(Refund, uuid.UUID(approval.entity_id))
        if refund:
            refund.status = data.decision
            if data.decision == "approved":
                booking = db.get(Booking, refund.booking_id)
                if booking:
                    supplier.refund(booking.supplier_reference, refund.amount)
                    previous = booking.status
                    booking.status = "refunded"
                    db.add(
                        BookingStatusHistory(
                            booking_id=booking.id,
                            from_status=previous,
                            to_status="refunded",
                            reason=data.comment,
                            changed_by=user.id,
                        )
                    )

    db.add(
        Notification(
            company_id=user.company_id,
            user_id=approval.requested_by,
            title=f"{approval.request_type.replace('_', ' ').title()} {data.decision}",
            message=data.comment,
            notification_type="success" if data.decision == "approved" else "warning",
        )
    )
    audit(db, request, user, f"approval.{data.decision}", approval.entity_type, approval.entity_id)
    db.commit()
    return _approval_out(approval)


@router.get("/financial-accounts")
def list_financial_accounts(
    user: User = Depends(require_roles("Administrator", "Manager", "Accounts")),
    db: Session = Depends(get_db),
):
    rows = db.scalars(
        select(FinancialAccount)
        .where(
            FinancialAccount.company_id == user.company_id,
            branch_scope(FinancialAccount.branch_id, user),
        )
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


@router.get("/exchange-rates", response_model=Page)
def list_exchange_rates(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    user: User = Depends(require_roles("Administrator", "Manager", "Accounts")),
    db: Session = Depends(get_db),
):
    query = select(ExchangeRate).where(ExchangeRate.company_id == user.company_id)
    rows = db.scalars(
        query.order_by(ExchangeRate.effective_date.desc()).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return {
        "items": [
            {
                "id": row.id,
                "baseCurrency": row.base_currency,
                "quoteCurrency": row.quote_currency,
                "rate": row.rate,
                "effectiveDate": row.effective_date,
            }
            for row in rows
        ],
        "total": db.scalar(
            select(func.count()).select_from(ExchangeRate).where(ExchangeRate.company_id == user.company_id)
        )
        or 0,
        "page": page,
        "page_size": page_size,
    }


@router.post("/exchange-rates", status_code=201, dependencies=write_access)
def create_exchange_rate(
    data: ExchangeRateInput,
    request: Request,
    user: User = Depends(require_roles("Administrator", "Accounts")),
    db: Session = Depends(get_db),
):
    company = db.get(Company, user.company_id)
    rate = ExchangeRate(
        company_id=user.company_id,
        base_currency=company.base_currency,
        quote_currency=data.quote_currency.upper(),
        rate=data.rate,
        effective_date=data.effective_date,
        created_by=user.id,
    )
    db.add(rate)
    audit(db, request, user, "exchange_rate.create", "exchange_rate", rate.id)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise conflict("An exchange rate already exists for that currency and date.") from exc
    return {
        "id": rate.id,
        "baseCurrency": rate.base_currency,
        "quoteCurrency": rate.quote_currency,
        "rate": rate.rate,
        "effectiveDate": rate.effective_date,
    }


@router.post("/financial-accounts", status_code=201, dependencies=write_access)
def create_financial_account(
    data: FinancialAccountInput,
    request: Request,
    user: User = Depends(require_roles("Administrator", "Accounts")),
    db: Session = Depends(get_db),
):
    _ensure_finance_ready(db, user.company_id)
    if user.branch_id and data.branch_id != user.branch_id:
        raise forbidden("You cannot create a financial account for another branch.")
    if data.branch_id and not db.scalar(
        select(Branch.id).where(Branch.id == data.branch_id, Branch.company_id == user.company_id)
    ):
        raise not_found("Branch")
    account = FinancialAccount(
        company_id=user.company_id,
        branch_id=data.branch_id,
        account_type=data.account_type,
        currency=data.currency.upper(),
        limit_amount=data.limit_amount,
        balance=data.opening_balance,
    )
    db.add(account)
    audit(db, request, user, "account.create", "financial_account", account.id)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise conflict("That financial account already exists.") from exc
    return {"id": account.id, "accountType": account.account_type, "currency": account.currency}


@router.get("/financial-accounts/{account_id}/ledger", response_model=Page)
def account_ledger(
    account_id: uuid.UUID,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    user: User = Depends(require_roles("Administrator", "Manager", "Accounts")),
    db: Session = Depends(get_db),
):
    account = db.scalar(
        select(FinancialAccount).where(
            FinancialAccount.id == account_id,
            FinancialAccount.company_id == user.company_id,
            branch_scope(FinancialAccount.branch_id, user),
        )
    )
    if not account:
        raise not_found("Financial account")
    rows = db.scalars(
        select(LedgerEntry)
        .where(LedgerEntry.account_id == account.id)
        .order_by(LedgerEntry.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    total = (
        db.scalar(select(func.count()).select_from(LedgerEntry).where(LedgerEntry.account_id == account.id))
        or 0
    )
    return {
        "items": [
            {
                "id": row.id,
                "date": row.created_at,
                "reference": row.reference,
                "description": row.description,
                "debit": row.debit,
                "credit": row.credit,
                "balance": row.balance_after,
                "currency": row.currency,
            }
            for row in rows
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/financial-accounts/{account_id}/allocate", status_code=201, dependencies=write_access)
def allocate_cash(
    account_id: uuid.UUID,
    data: CashAllocationInput,
    request: Request,
    user: User = Depends(require_roles("Administrator", "Accounts")),
    db: Session = Depends(get_db),
):
    _ensure_finance_ready(db, user.company_id)
    account = db.scalar(
        select(FinancialAccount)
        .where(
            FinancialAccount.id == account_id,
            FinancialAccount.company_id == user.company_id,
            FinancialAccount.account_type == "cash",
            branch_scope(FinancialAccount.branch_id, user),
        )
        .with_for_update()
    )
    if not account:
        raise not_found("Cash account")
    account.balance += data.amount
    entry = LedgerEntry(
        account_id=account.id,
        reference=next_code(db, LedgerEntry, LedgerEntry.reference, "CASH", 8),
        description=data.reason,
        debit=0,
        credit=data.amount,
        balance_after=account.balance,
        currency=account.currency,
        created_by=user.id,
    )
    db.add(entry)
    audit(db, request, user, "cash.allocate", "financial_account", account.id, {"amount": str(data.amount)})
    db.commit()
    return {"id": entry.id, "reference": entry.reference, "balance": account.balance}


@router.post("/ledger/{entry_id}/reverse", status_code=201, dependencies=write_access)
def reverse_ledger_entry(
    entry_id: uuid.UUID,
    data: LedgerReversalInput,
    request: Request,
    idempotency_key: str = Header(min_length=8, max_length=100, alias="Idempotency-Key"),
    user: User = Depends(require_roles("Administrator", "Accounts")),
    db: Session = Depends(get_db),
):
    _ensure_finance_ready(db, user.company_id)
    operation = f"ledger.reverse:{entry_id}"
    existing = db.scalar(
        select(IdempotencyRecord).where(
            IdempotencyRecord.user_id == user.id,
            IdempotencyRecord.operation == operation,
            IdempotencyRecord.key == idempotency_key,
        )
    )
    if existing:
        return existing.response_body
    entry = db.scalar(select(LedgerEntry).where(LedgerEntry.id == entry_id))
    if not entry:
        raise not_found("Ledger entry")
    account = db.scalar(
        select(FinancialAccount)
        .where(
            FinancialAccount.id == entry.account_id,
            FinancialAccount.company_id == user.company_id,
            branch_scope(FinancialAccount.branch_id, user),
        )
        .with_for_update()
    )
    if not account:
        raise not_found("Ledger entry")
    if entry.reversal_of_id or db.scalar(
        select(LedgerEntry.id).where(LedgerEntry.reversal_of_id == entry.id)
    ):
        raise conflict("This ledger entry is already a reversal or has already been reversed.")
    account.balance += entry.debit - entry.credit
    reversal = LedgerEntry(
        account_id=account.id,
        reference=next_code(db, LedgerEntry, LedgerEntry.reference, "REV", 8),
        description=f"Reversal of {entry.reference}: {data.reason}",
        debit=entry.credit,
        credit=entry.debit,
        balance_after=account.balance,
        currency=entry.currency,
        reversal_of_id=entry.id,
        created_by=user.id,
    )
    db.add(reversal)
    db.flush()
    response = jsonable_encoder(
        {"id": reversal.id, "reference": reversal.reference, "balance": account.balance}
    )
    db.add(
        IdempotencyRecord(
            user_id=user.id,
            operation=operation,
            key=idempotency_key,
            response_status=201,
            response_body=response,
        )
    )
    audit(db, request, user, "ledger.reverse", "ledger_entry", entry.id, {"reason": data.reason})
    db.commit()
    return response


@router.get("/limits/temporary", response_model=Page)
def list_temporary_limits(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    user: User = Depends(require_roles("Administrator", "Manager", "Accounts")),
    db: Session = Depends(get_db),
):
    scope = (
        FinancialAccount.company_id == user.company_id,
        branch_scope(FinancialAccount.branch_id, user),
    )
    query = (
        select(TemporaryLimit)
        .join(FinancialAccount, FinancialAccount.id == TemporaryLimit.account_id)
        .where(*scope)
    )
    count = (
        select(func.count())
        .select_from(TemporaryLimit)
        .join(FinancialAccount, FinancialAccount.id == TemporaryLimit.account_id)
        .where(*scope)
    )
    rows = db.scalars(
        query.order_by(TemporaryLimit.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return {
        "items": [
            {
                "id": row.id,
                "accountId": row.account_id,
                "amount": row.amount,
                "used": row.used,
                "reason": row.reason,
                "expiresAt": row.expires_at,
                "status": row.status,
                "createdAt": row.created_at,
            }
            for row in rows
        ],
        "total": db.scalar(count) or 0,
        "page": page,
        "page_size": page_size,
    }


@router.post("/limits/temporary", status_code=201, dependencies=write_access)
def request_temporary_limit(
    data: LimitRequestInput,
    request: Request,
    user: User = Depends(require_roles("Administrator", "Manager", "Accounts")),
    db: Session = Depends(get_db),
):
    _ensure_finance_ready(db, user.company_id)
    account = db.scalar(
        select(FinancialAccount).where(
            FinancialAccount.id == data.account_id,
            FinancialAccount.company_id == user.company_id,
            branch_scope(FinancialAccount.branch_id, user),
        )
    )
    if not account:
        raise not_found("Financial account")
    if data.expires_at <= datetime.now(UTC):
        raise ApiError(422, "Invalid expiry", "Temporary limit expiry must be in the future.")
    temporary = TemporaryLimit(
        account_id=account.id,
        amount=data.amount,
        expires_at=data.expires_at,
        reason=data.reason,
    )
    db.add(temporary)
    db.flush()
    approval = ApprovalRequest(
        company_id=user.company_id,
        branch_id=user.branch_id,
        request_type="temporary_limit",
        entity_type="temporary_limit",
        entity_id=str(temporary.id),
        requested_by=user.id,
        reason=data.reason,
        payload={"amount": str(data.amount), "expires_at": data.expires_at.isoformat()},
    )
    db.add(approval)
    db.flush()
    temporary.approval_request_id = approval.id
    audit(db, request, user, "limit.temporary.request", "temporary_limit", temporary.id)
    db.commit()
    return _approval_out(approval)


@router.post("/limits/adjustments", status_code=201, dependencies=write_access)
def request_limit_adjustment(
    data: LimitAdjustmentInput,
    request: Request,
    user: User = Depends(require_roles("Administrator", "Manager", "Accounts")),
    db: Session = Depends(get_db),
):
    _ensure_finance_ready(db, user.company_id)
    account = db.scalar(
        select(FinancialAccount).where(
            FinancialAccount.id == data.account_id,
            FinancialAccount.company_id == user.company_id,
            branch_scope(FinancialAccount.branch_id, user),
        )
    )
    if not account:
        raise not_found("Financial account")
    approval = ApprovalRequest(
        company_id=user.company_id,
        branch_id=user.branch_id,
        request_type="limit_adjustment",
        entity_type="financial_account",
        entity_id=str(account.id),
        requested_by=user.id,
        reason=data.reason,
        payload={"previous_limit": str(account.limit_amount), "new_limit": str(data.new_limit)},
    )
    db.add(approval)
    audit(db, request, user, "limit.adjustment.request", "financial_account", account.id)
    db.commit()
    return _approval_out(approval)


@router.post("/booking-searches/{service}")
def booking_search(
    service: str,
    data: SearchInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed = {
        "flights",
        "hotels",
        "insurance",
        "transfers",
        "holidays",
        "sightseeing",
        "fix-departure",
        "a-to-a",
    }
    if service not in allowed:
        raise not_found("Booking service")
    offers = supplier.search(service, data.filters)
    search_record = BookingSearch(
        company_id=user.company_id,
        branch_id=user.branch_id,
        service_type=service,
        filters=data.filters,
        result_count=len(offers),
        created_by=user.id,
    )
    db.add(search_record)
    db.commit()
    return {"items": offers, "provider": "fake", "searchId": search_record.id}


def _pricing(db: Session, company_id: uuid.UUID, base: Decimal) -> tuple[Decimal, dict]:
    model = db.scalar(
        select(PricingModel)
        .where(PricingModel.company_id == company_id, PricingModel.status == "active")
        .order_by(PricingModel.priority)
    )
    if not model or not model.active_version:
        return Decimal("0"), {"model": None, "version": None}
    version = db.scalar(
        select(PricingRuleVersion).where(
            PricingRuleVersion.pricing_model_id == model.id,
            PricingRuleVersion.version == model.active_version,
        )
    )
    rules = version.rules if version else {}
    try:
        markup = evaluate_price(base, rules)
    except ValueError as exc:
        raise ApiError(409, "Invalid pricing rule", str(exc)) from exc
    return markup, {"model": str(model.id), "version": model.active_version, "rules": rules}


@router.post("/quotes", status_code=201, dependencies=write_access)
def create_quote(
    data: QuoteInput,
    request: Request,
    user: User = Depends(require_roles("Administrator", "Manager", "Agent", "Sub Agent")),
    db: Session = Depends(get_db),
):
    branch_id = data.branch_id or user.branch_id
    if user.branch_id and branch_id != user.branch_id:
        raise forbidden("You cannot create a quote for another branch.")
    if branch_id and not db.scalar(
        select(Branch.id).where(Branch.id == branch_id, Branch.company_id == user.company_id)
    ):
        raise not_found("Branch")
    if data.customer_id:
        customer = db.scalar(
            select(Customer).where(
                Customer.id == data.customer_id,
                Customer.company_id == user.company_id,
                branch_scope(Customer.branch_id, user),
            )
        )
        if not customer:
            raise not_found("Customer")
    try:
        offer = supplier.reprice(data.service_type, data.offer_id, data.search)
    except ValueError as exc:
        raise ApiError(
            409, "Offer expired", "The selected offer is no longer available. Search again."
        ) from exc
    base = Decimal(str(offer["price"]))
    markup, snapshot = _pricing(db, user.company_id, base)
    quote = Quote(
        company_id=user.company_id,
        branch_id=branch_id,
        customer_id=data.customer_id,
        service_type=data.service_type,
        supplier_offer_id=data.offer_id,
        currency=offer["currency"],
        base_amount=base,
        markup_amount=markup,
        total_amount=base + markup,
        pricing_snapshot=snapshot,
        search_payload=data.search,
        offer_payload=jsonable_encoder(offer),
        expires_at=datetime.now(UTC) + timedelta(minutes=20),
        created_by=user.id,
    )
    db.add(quote)
    db.flush()
    db.add(
        QuoteItem(
            quote_id=quote.id,
            item_type=data.service_type,
            description=offer["title"],
            amount=quote.total_amount,
            currency=quote.currency,
            details=jsonable_encoder(offer["details"]),
        )
    )
    audit(db, request, user, "quote.create", "quote", quote.id)
    db.commit()
    return {
        "id": quote.id,
        "serviceType": quote.service_type,
        "currency": quote.currency,
        "baseAmount": quote.base_amount,
        "markupAmount": quote.markup_amount,
        "totalAmount": quote.total_amount,
        "expiresAt": quote.expires_at,
        "status": quote.status,
        "offer": quote.offer_payload,
    }


@router.get("/quotes/{quote_id}")
def get_quote(
    quote_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quote = db.scalar(
        select(Quote).where(
            Quote.id == quote_id,
            Quote.company_id == user.company_id,
            branch_scope(Quote.branch_id, user),
        )
    )
    if not quote:
        raise not_found("Quote")
    return {
        "id": quote.id,
        "serviceType": quote.service_type,
        "currency": quote.currency,
        "baseAmount": quote.base_amount,
        "markupAmount": quote.markup_amount,
        "totalAmount": quote.total_amount,
        "expiresAt": quote.expires_at,
        "status": quote.status,
        "offer": quote.offer_payload,
    }


@router.post("/quotes/{quote_id}/confirm", status_code=201, dependencies=write_access)
def confirm_quote(
    quote_id: uuid.UUID,
    data: BookingConfirmInput,
    request: Request,
    idempotency_key: str = Header(min_length=8, max_length=100, alias="Idempotency-Key"),
    user: User = Depends(require_roles("Administrator", "Manager", "Agent", "Sub Agent")),
    db: Session = Depends(get_db),
):
    existing = db.scalar(
        select(IdempotencyRecord).where(
            IdempotencyRecord.user_id == user.id,
            IdempotencyRecord.operation == "quote.confirm",
            IdempotencyRecord.key == idempotency_key,
        )
    )
    if existing:
        return existing.response_body
    quote = db.scalar(
        select(Quote)
        .where(
            Quote.id == quote_id,
            Quote.company_id == user.company_id,
            branch_scope(Quote.branch_id, user),
        )
        .with_for_update()
    )
    if not quote:
        raise not_found("Quote")
    if quote.status != "quoted":
        raise conflict("This quote has already been processed.")
    if quote.expires_at <= datetime.now(UTC):
        quote.status = "expired"
        db.commit()
        raise ApiError(409, "Quote expired", "Search and price the itinerary again.")

    account = None
    if data.financial_account_id:
        _ensure_finance_ready(db, user.company_id)
        account = db.scalar(
            select(FinancialAccount)
            .where(
                FinancialAccount.id == data.financial_account_id,
                FinancialAccount.company_id == user.company_id,
                FinancialAccount.status == "active",
                branch_scope(FinancialAccount.branch_id, user),
            )
            .with_for_update()
        )
        if not account:
            raise not_found("Financial account")
        if account.currency != quote.currency:
            raise conflict("Financial account and quote currencies do not match.")
        if account.balance < quote.total_amount:
            raise conflict("Insufficient available balance or credit limit.")

    provider = supplier.book(quote.offer_payload, [item.model_dump() for item in data.passengers])
    reference = next_code(db, Booking, Booking.reference, "BKG", 8)
    booking = Booking(
        company_id=user.company_id,
        branch_id=quote.branch_id,
        customer_id=quote.customer_id,
        quote_id=quote.id,
        reference=reference,
        supplier_reference=provider["supplier_reference"],
        service_type=quote.service_type,
        status="confirmed",
        currency=quote.currency,
        total_amount=quote.total_amount,
        details={"offer": quote.offer_payload, "pricing": quote.pricing_snapshot},
        created_by=user.id,
    )
    db.add(booking)
    db.flush()
    db.add(
        BookingServiceItem(
            booking_id=booking.id,
            item_type=quote.service_type,
            description=quote.offer_payload.get("title", quote.service_type),
            amount=quote.total_amount,
            currency=quote.currency,
            details=quote.offer_payload.get("details", {}),
        )
    )
    for passenger in data.passengers:
        db.add(
            BookingPassenger(
                booking_id=booking.id,
                traveller_id=passenger.traveller_id,
                passenger_type=passenger.passenger_type,
                snapshot=passenger.snapshot,
            )
        )
    db.add(
        BookingStatusHistory(
            booking_id=booking.id,
            from_status="pending_confirmation",
            to_status="confirmed",
            changed_by=user.id,
        )
    )
    if account:
        previous_balance = account.balance
        account.balance -= quote.total_amount
        temp_consumption = min(
            quote.total_amount,
            max(previous_balance - account.limit_amount, Decimal("0")),
        )
        if temp_consumption:
            active_limits = db.scalars(
                select(TemporaryLimit)
                .where(
                    TemporaryLimit.account_id == account.id,
                    TemporaryLimit.status == "active",
                    TemporaryLimit.expires_at > datetime.now(UTC),
                )
                .order_by(TemporaryLimit.expires_at)
                .with_for_update()
            ).all()
            remaining_consumption = temp_consumption
            for temporary_limit in active_limits:
                available = temporary_limit.amount - temporary_limit.used
                consumed = min(available, remaining_consumption)
                temporary_limit.used += consumed
                remaining_consumption -= consumed
                if remaining_consumption <= 0:
                    break
        db.add(
            LedgerEntry(
                account_id=account.id,
                reference=f"BOOKING-{booking.reference}",
                description=f"Booking {booking.reference}",
                debit=quote.total_amount,
                credit=0,
                balance_after=account.balance,
                currency=account.currency,
                created_by=user.id,
            )
        )
        db.add(
            Payment(
                booking_id=booking.id,
                amount=quote.total_amount,
                currency=quote.currency,
                method="financial_account",
                status="captured",
                reference=f"PAY-{booking.reference}",
            )
        )
    quote.status = "confirmed"
    response = jsonable_encoder(_booking_out(booking))
    db.add(
        IdempotencyRecord(
            user_id=user.id,
            operation="quote.confirm",
            key=idempotency_key,
            response_status=201,
            response_body=response,
        )
    )
    db.add(
        OutboxEvent(
            aggregate_type="booking",
            aggregate_id=str(booking.id),
            event_type="booking.confirmed",
            payload=response,
        )
    )
    audit(db, request, user, "booking.confirm", "booking", booking.id, {"reference": reference})
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        retry = db.scalar(
            select(IdempotencyRecord).where(
                IdempotencyRecord.user_id == user.id,
                IdempotencyRecord.operation == "quote.confirm",
                IdempotencyRecord.key == idempotency_key,
            )
        )
        if retry:
            return retry.response_body
        raise conflict(
            "Booking confirmation conflicted with another request. Retry with the same key."
        ) from exc
    return response


@router.get("/bookings", response_model=Page)
def list_bookings(
    status: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scope = (Booking.company_id == user.company_id, branch_scope(Booking.branch_id, user))
    query = select(Booking).where(*scope)
    count = select(func.count()).select_from(Booking).where(*scope)
    if status:
        query, count = query.where(Booking.status == status), count.where(Booking.status == status)
    rows = db.scalars(
        query.order_by(Booking.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return {
        "items": [_booking_out(row) for row in rows],
        "total": db.scalar(count) or 0,
        "page": page,
        "page_size": page_size,
    }


def _transition(
    db: Session,
    request: Request,
    user: User,
    booking: Booking,
    to_status: str,
    reason: str = "",
) -> None:
    previous = booking.status
    booking.status = to_status
    db.add(
        BookingStatusHistory(
            booking_id=booking.id,
            from_status=previous,
            to_status=to_status,
            reason=reason,
            changed_by=user.id,
        )
    )
    audit(db, request, user, f"booking.{to_status}", "booking", booking.id)


@router.post("/bookings/{booking_id}/ticket", dependencies=write_access)
def ticket_booking(
    booking_id: uuid.UUID,
    request: Request,
    user: User = Depends(require_roles("Administrator", "Manager", "Agent")),
    db: Session = Depends(get_db),
):
    booking = db.scalar(
        select(Booking)
        .where(
            Booking.id == booking_id,
            Booking.company_id == user.company_id,
            branch_scope(Booking.branch_id, user),
        )
        .with_for_update()
    )
    if not booking:
        raise not_found("Booking")
    if booking.status != "confirmed":
        raise conflict("Only confirmed bookings can be ticketed.")
    result = supplier.ticket(booking.supplier_reference)
    booking.details = {**booking.details, "ticket": result["ticket"]}
    db.add(
        Ticket(
            booking_id=booking.id,
            ticket_number=result["ticket"],
            status="issued",
        )
    )
    _transition(db, request, user, booking, "ticketed")
    db.commit()
    return _booking_out(booking)


@router.post("/bookings/{booking_id}/cancel", dependencies=write_access)
def cancel_booking(
    booking_id: uuid.UUID,
    request: Request,
    reason: str,
    user: User = Depends(require_roles("Administrator", "Manager", "Agent")),
    db: Session = Depends(get_db),
):
    booking = db.scalar(
        select(Booking)
        .where(
            Booking.id == booking_id,
            Booking.company_id == user.company_id,
            branch_scope(Booking.branch_id, user),
        )
        .with_for_update()
    )
    if not booking:
        raise not_found("Booking")
    if booking.status not in {"confirmed", "ticketed"}:
        raise conflict("This booking cannot be cancelled in its current state.")
    supplier.cancel(booking.supplier_reference)
    _transition(db, request, user, booking, "cancelled", reason)
    db.commit()
    return _booking_out(booking)


@router.post("/bookings/{booking_id}/void", dependencies=write_access)
def void_booking(
    booking_id: uuid.UUID,
    request: Request,
    reason: str,
    user: User = Depends(require_roles("Administrator", "Manager", "Agent")),
    db: Session = Depends(get_db),
):
    booking = db.scalar(
        select(Booking)
        .where(
            Booking.id == booking_id,
            Booking.company_id == user.company_id,
            branch_scope(Booking.branch_id, user),
        )
        .with_for_update()
    )
    if not booking:
        raise not_found("Booking")
    if booking.status != "ticketed":
        raise conflict("Only a ticketed booking can be voided.")
    supplier.cancel(booking.supplier_reference)
    _transition(db, request, user, booking, "voided", reason)
    db.commit()
    return _booking_out(booking)


@router.post("/bookings/{booking_id}/refund", status_code=201, dependencies=write_access)
def request_refund(
    booking_id: uuid.UUID,
    data: RefundInput,
    request: Request,
    user: User = Depends(require_roles("Administrator", "Manager", "Agent", "Accounts")),
    db: Session = Depends(get_db),
):
    booking = db.scalar(
        select(Booking).where(
            Booking.id == booking_id,
            Booking.company_id == user.company_id,
            branch_scope(Booking.branch_id, user),
        )
    )
    if not booking:
        raise not_found("Booking")
    if booking.status not in {"confirmed", "ticketed", "cancelled"}:
        raise conflict("This booking cannot be refunded in its current state.")
    if data.amount > booking.total_amount:
        raise ApiError(422, "Invalid refund", "Refund amount cannot exceed booking total.")
    refund = Refund(
        booking_id=booking.id,
        amount=data.amount,
        penalty=data.penalty,
        currency=booking.currency,
        reason=data.reason,
        requested_by=user.id,
    )
    db.add(refund)
    db.flush()
    approval = ApprovalRequest(
        company_id=user.company_id,
        branch_id=user.branch_id,
        request_type="refund",
        entity_type="refund",
        entity_id=str(refund.id),
        requested_by=user.id,
        reason=data.reason,
        payload={"amount": str(data.amount), "penalty": str(data.penalty), "booking": booking.reference},
    )
    db.add(approval)
    db.flush()
    refund.approval_request_id = approval.id
    _transition(db, request, user, booking, "refund_pending", data.reason)
    db.commit()
    return _approval_out(approval)
