import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(word.capitalize() for word in rest)


class ApiModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, alias_generator=to_camel)


class Problem(BaseModel):
    type: str = "about:blank"
    title: str
    status: int
    detail: str
    errors: dict[str, list[str]] | None = None
    request_id: str | None = None


class LoginInput(ApiModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    turnstile_token: str | None = None


class UserOut(ApiModel):
    id: uuid.UUID
    email: EmailStr
    name: str
    status: str
    company_id: uuid.UUID
    branch_id: uuid.UUID | None = None
    department_id: uuid.UUID | None = None
    job_title_id: uuid.UUID | None = None
    access_profile_id: uuid.UUID | None = None
    roles: list[str]
    permissions: list[str]
    last_login_at: datetime | None = None


class ProfileUpdate(ApiModel):
    name: str = Field(min_length=2, max_length=180)
    email: EmailStr


class PasswordChangeInput(ApiModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=10, max_length=128)


class CompanyOut(ApiModel):
    id: uuid.UUID
    legal_name: str
    trading_name: str
    email: EmailStr
    phone: str
    address: str
    iata_number: str
    uic_code: str
    business_license: str
    base_currency: str
    timezone: str
    status: str


class CompanyUpdate(ApiModel):
    legal_name: str | None = Field(default=None, min_length=2, max_length=180)
    trading_name: str | None = Field(default=None, min_length=2, max_length=180)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=40)
    address: str | None = Field(default=None, max_length=1000)
    iata_number: str | None = Field(default=None, max_length=60)
    uic_code: str | None = Field(default=None, max_length=60)
    business_license: str | None = Field(default=None, max_length=120)
    base_currency: str | None = Field(default=None, min_length=3, max_length=3)
    timezone: str | None = Field(default=None, max_length=60)


class BranchInput(ApiModel):
    code: str = Field(min_length=2, max_length=30)
    name: str = Field(min_length=2, max_length=180)
    branch_type: str = Field(default="Branch", pattern="^(Branch|Franchise)$")
    location: str = Field(default="", max_length=200)
    manager_name: str = Field(default="", max_length=180)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    credit_limit: Decimal = Field(default=Decimal("0"), ge=0)
    cash_balance: Decimal = Field(default=Decimal("0"), ge=0)


class BranchUpdate(ApiModel):
    name: str | None = Field(default=None, min_length=2, max_length=180)
    branch_type: str | None = Field(default=None, pattern="^(Branch|Franchise)$")
    location: str | None = Field(default=None, max_length=200)
    manager_name: str | None = Field(default=None, max_length=180)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    status: str | None = Field(default=None, pattern="^(active|inactive|suspended)$")


class BranchOut(BranchInput):
    id: uuid.UUID
    status: str
    users: int = 0
    created_at: datetime


class DepartmentInput(ApiModel):
    name: str = Field(min_length=2, max_length=120)
    head_name: str = Field(default="", max_length=180)
    branch_id: uuid.UUID | None = None


class DepartmentUpdate(ApiModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    head_name: str | None = Field(default=None, max_length=180)
    branch_id: uuid.UUID | None = None
    status: str | None = Field(default=None, pattern="^(active|inactive)$")


class DepartmentOut(ApiModel):
    id: uuid.UUID
    code: str
    name: str
    head_name: str
    branch_id: uuid.UUID | None
    status: str
    users: int = 0
    created_at: datetime


class UserInput(ApiModel):
    name: str = Field(min_length=2, max_length=180)
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)
    branch_id: uuid.UUID
    department_id: uuid.UUID
    job_title_id: uuid.UUID
    access_profile_id: uuid.UUID


class UserUpdate(ApiModel):
    name: str | None = Field(default=None, min_length=2, max_length=180)
    branch_id: uuid.UUID | None = None
    department_id: uuid.UUID | None = None
    job_title_id: uuid.UUID | None = None
    access_profile_id: uuid.UUID | None = None
    status: str | None = Field(default=None, pattern="^(active|inactive|suspended)$")


class JobTitleInput(ApiModel):
    name: str = Field(min_length=2, max_length=120)
    branch_id: uuid.UUID | None = None


class JobTitleUpdate(ApiModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    branch_id: uuid.UUID | None = None
    status: str | None = Field(default=None, pattern="^(active|inactive)$")


class JobTitleOut(ApiModel):
    id: uuid.UUID
    code: str
    name: str
    branch_id: uuid.UUID | None
    status: str
    created_at: datetime


class AccessProfileInput(ApiModel):
    name: str = Field(min_length=2, max_length=120)
    description: str = Field(default="", max_length=250)
    branch_id: uuid.UUID | None = None
    permission_keys: list[str] = Field(default_factory=list)
    from_preset: str | None = None


class AccessProfileUpdate(ApiModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=250)
    branch_id: uuid.UUID | None = None
    permission_keys: list[str] | None = None
    status: str | None = Field(default=None, pattern="^(active|inactive)$")


class AccessProfileOut(ApiModel):
    id: uuid.UUID
    name: str
    description: str
    branch_id: uuid.UUID | None
    status: str
    preset_key: str | None = None
    permission_keys: list[str] = Field(default_factory=list)
    created_at: datetime


class CustomerInput(ApiModel):
    account_code: str = Field(min_length=2, max_length=50)
    name: str = Field(min_length=2, max_length=180)
    email: EmailStr
    telephone: str = Field(default="", max_length=40)
    mobile: str = Field(default="", max_length=40)
    website: str = Field(default="", max_length=250)
    default_currency: str = Field(default="USD", min_length=3, max_length=3)
    pricing_model_id: uuid.UUID
    branch_ids: list[uuid.UUID] = Field(min_length=1)
    supplier_connection_ids: list[uuid.UUID] = Field(min_length=1)
    profile: dict[str, Any] = Field(default_factory=dict)


class CustomerOut(ApiModel):
    id: uuid.UUID
    branch_id: uuid.UUID | None
    branch_ids: list[uuid.UUID] = Field(default_factory=list)
    pricing_model_id: uuid.UUID | None = None
    supplier_connection_ids: list[uuid.UUID] = Field(default_factory=list)
    account_code: str
    agent_code: str
    name: str
    email: EmailStr
    telephone: str = ""
    mobile: str = ""
    website: str = ""
    default_currency: str
    status: str
    profile: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class MatrixOut(ApiModel):
    branches: list[dict[str, Any]]
    rows: list[dict[str, Any]]


class TravellerInput(ApiModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(default="", max_length=40)
    city: str = Field(default="", max_length=100)
    country: str = Field(default="", max_length=100)
    date_of_birth: date | None = None
    passport_number: str = Field(default="", max_length=50)
    passport_expiry: date | None = None
    customer_id: uuid.UUID | None = None
    preferences: dict[str, Any] = Field(default_factory=dict)


class TravellerOut(ApiModel):
    id: uuid.UUID
    branch_id: uuid.UUID | None
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    city: str
    country: str
    date_of_birth: date | None
    passport_masked: str
    passport_expiry: date | None
    customer_id: uuid.UUID | None
    preferences: dict[str, Any]
    status: str
    created_at: datetime


class PricingModelInput(ApiModel):
    name: str = Field(min_length=2, max_length=180)
    pricing_type: str = Field(default="Markup", pattern="^(Markup|Commission)$")
    scope: str = Field(default="Global", max_length=100)
    priority: int = Field(default=100, ge=1, le=10000)
    rules: dict[str, Any] = Field(default_factory=dict)


class PricingModelOut(ApiModel):
    id: uuid.UUID
    name: str
    pricing_type: str
    scope: str
    priority: int
    status: str
    active_version: int
    created_at: datetime
    updated_at: datetime


class PricingModelUpdate(ApiModel):
    name: str | None = Field(default=None, min_length=2, max_length=180)
    pricing_type: str | None = Field(default=None, pattern="^(Markup|Commission)$")
    scope: str | None = Field(default=None, max_length=100)
    priority: int | None = Field(default=None, ge=1, le=10000)
    rules: dict[str, Any] | None = None


class PricingModelDetailOut(PricingModelOut):
    rules: dict[str, Any] = Field(default_factory=dict)
    latest_version: int = 0


class FinancialAccountUpdate(ApiModel):
    branch_id: uuid.UUID | None = None
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    limit_amount: Decimal | None = Field(default=None, ge=0)
    status: str | None = Field(default=None, pattern="^(active|inactive)$")


class TemporaryLimitUpdate(ApiModel):
    amount: Decimal | None = Field(default=None, gt=0)
    expires_at: datetime | None = None
    reason: str | None = Field(default=None, min_length=3, max_length=1000)
    status: str | None = Field(default=None, pattern="^(pending|active|expired|rejected|cancelled)$")


class ApprovalInput(ApiModel):
    decision: str = Field(pattern="^(approved|rejected)$")
    comment: str = Field(min_length=3, max_length=1000)


class LimitRequestInput(ApiModel):
    account_id: uuid.UUID
    amount: Decimal = Field(gt=0)
    expires_at: datetime
    reason: str = Field(min_length=3, max_length=1000)


class FinancialAccountInput(ApiModel):
    branch_id: uuid.UUID | None = None
    account_type: str = Field(pattern="^(cash|credit)$")
    currency: str = Field(min_length=3, max_length=3)
    limit_amount: Decimal = Field(default=Decimal("0"), ge=0)
    opening_balance: Decimal = Field(default=Decimal("0"), ge=0)


class LimitAdjustmentInput(ApiModel):
    account_id: uuid.UUID
    new_limit: Decimal = Field(ge=0)
    reason: str = Field(min_length=3, max_length=1000)


class CashAllocationInput(ApiModel):
    amount: Decimal = Field(gt=0)
    reason: str = Field(min_length=3, max_length=1000)


class LedgerReversalInput(ApiModel):
    reason: str = Field(min_length=3, max_length=1000)


class ExchangeRateInput(ApiModel):
    quote_currency: str = Field(min_length=3, max_length=3)
    rate: Decimal = Field(gt=0)
    effective_date: date


class SearchInput(ApiModel):
    filters: dict[str, Any] = Field(default_factory=dict)


class SupplierOffer(ApiModel):
    id: str
    title: str
    subtitle: str
    currency: str
    price: Decimal
    expires_at: datetime
    details: dict[str, Any]


class QuoteInput(ApiModel):
    service_type: str
    offer_id: str
    search: dict[str, Any] = Field(default_factory=dict)
    customer_id: uuid.UUID | None = None
    branch_id: uuid.UUID | None = None


class PassengerInput(ApiModel):
    traveller_id: uuid.UUID | None = None
    passenger_type: str = "adult"
    snapshot: dict[str, Any]


class BookingConfirmInput(ApiModel):
    passengers: list[PassengerInput] = Field(min_length=1)
    financial_account_id: uuid.UUID | None = None


class RefundInput(ApiModel):
    amount: Decimal = Field(gt=0)
    penalty: Decimal = Field(default=Decimal("0"), ge=0)
    reason: str = Field(min_length=3, max_length=1000)


class FileCreateInput(ApiModel):
    original_name: str = Field(min_length=1, max_length=255)
    content_type: str = Field(max_length=120)
    size_bytes: int = Field(gt=0)

    @field_validator("content_type")
    @classmethod
    def allowed_type(cls, value: str) -> str:
        allowed = {"application/pdf", "image/jpeg", "image/png"}
        if value not in allowed:
            raise ValueError("Only PDF, JPEG and PNG files are allowed")
        return value


class Page(ApiModel):
    items: list[Any]
    total: int
    page: int
    page_size: int
