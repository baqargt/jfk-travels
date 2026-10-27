from decimal import Decimal

from sqlalchemy import select

from app.config import settings
from app.database import SessionLocal
from app.models import (
    Branch,
    Company,
    Customer,
    Department,
    FinancialAccount,
    Notification,
    Permission,
    Role,
    SupplierConnection,
    Traveller,
    User,
)
from app.security import encrypt_sensitive, hash_password

PERMISSIONS = [
    "dashboard.read",
    "booking.read",
    "booking.write",
    "company.read",
    "company.write",
    "customer.read",
    "customer.write",
    "traveller.read",
    "traveller.write",
    "pricing.read",
    "pricing.write",
    "approval.decide",
    "finance.read",
    "finance.write",
    "report.read",
    "user.manage",
]

ROLE_PERMISSIONS = {
    "Administrator": PERMISSIONS,
    "Manager": PERMISSIONS,
    "Agent": [
        "dashboard.read",
        "booking.read",
        "booking.write",
        "customer.read",
        "customer.write",
        "traveller.read",
        "traveller.write",
        "report.read",
    ],
    "Accounts": ["dashboard.read", "finance.read", "finance.write", "report.read", "approval.decide"],
    "Sub Agent": ["dashboard.read", "booking.read", "booking.write", "traveller.read", "traveller.write"],
}


def run() -> None:
    with SessionLocal() as db:
        company = db.scalar(select(Company).limit(1))
        if not company:
            company = Company(
                legal_name="JFK Travel Group LLC",
                trading_name="JFK Travel & Tours",
                email="operations@jfktravel.com",
                phone="+1 (212) 555-0199",
                address="747 Travel Plaza, Queens, New York",
                iata_number="336-4 2048 5",
                uic_code="JFK4211",
                business_license="NY-DOS 41-JFK-88231",
                base_currency="USD",
                timezone="America/New_York",
            )
            db.add(company)
            db.flush()

        permission_rows: dict[str, Permission] = {}
        for key in PERMISSIONS:
            permission = db.scalar(select(Permission).where(Permission.key == key))
            if not permission:
                permission = Permission(key=key, description=key.replace(".", " ").title())
                db.add(permission)
                db.flush()
            permission_rows[key] = permission

        roles: dict[str, Role] = {}
        for role_name, keys in ROLE_PERMISSIONS.items():
            role = db.scalar(select(Role).where(Role.name == role_name))
            if not role:
                role = Role(name=role_name, description=f"Default {role_name} role")
                db.add(role)
                db.flush()
            role.permissions = [permission_rows[key] for key in keys]
            roles[role_name] = role

        branch = db.scalar(select(Branch).where(Branch.company_id == company.id, Branch.code == "HQ"))
        if not branch:
            branch = Branch(
                company_id=company.id,
                code="HQ",
                name="JFK Travel Head Office",
                branch_type="Branch",
                location="New York",
                manager_name=settings.admin_name,
                currency="USD",
                credit_limit=Decimal("100000"),
                cash_balance=Decimal("50000"),
            )
            db.add(branch)
            db.flush()

        department = db.scalar(select(Department).where(Department.company_id == company.id))
        if not department:
            department = Department(
                company_id=company.id,
                branch_id=branch.id,
                code="DEP-001",
                name="Administration",
                head_name=settings.admin_name,
            )
            db.add(department)
            db.flush()

        admin = db.scalar(select(User).where(User.email == settings.admin_email.lower()))
        if not admin:
            db.add(
                User(
                    company_id=company.id,
                    branch_id=branch.id,
                    department_id=department.id,
                    email=settings.admin_email.lower(),
                    display_name=settings.admin_name,
                    password_hash=hash_password(settings.admin_password),
                    roles=[roles["Administrator"]],
                )
            )

        manager = db.scalar(select(User).where(User.email == settings.manager_email.lower()))
        if not manager and settings.environment == "development":
            db.add(
                User(
                    company_id=company.id,
                    branch_id=branch.id,
                    department_id=department.id,
                    email=settings.manager_email.lower(),
                    display_name="JFK Demo Manager",
                    password_hash=hash_password(settings.manager_password),
                    roles=[roles["Manager"]],
                )
            )

        cash = db.scalar(
            select(FinancialAccount).where(
                FinancialAccount.company_id == company.id,
                FinancialAccount.branch_id == branch.id,
                FinancialAccount.account_type == "cash",
                FinancialAccount.currency == "USD",
            )
        )
        if not cash:
            db.add(
                FinancialAccount(
                    company_id=company.id,
                    branch_id=branch.id,
                    account_type="cash",
                    currency="USD",
                    limit_amount=Decimal("50000"),
                    balance=Decimal("50000"),
                )
            )

        credit = db.scalar(
            select(FinancialAccount).where(
                FinancialAccount.company_id == company.id,
                FinancialAccount.branch_id == branch.id,
                FinancialAccount.account_type == "credit",
                FinancialAccount.currency == "USD",
            )
        )
        if not credit:
            db.add(
                FinancialAccount(
                    company_id=company.id,
                    branch_id=branch.id,
                    account_type="credit",
                    currency="USD",
                    limit_amount=Decimal("100000"),
                    balance=Decimal("100000"),
                )
            )

        if settings.environment == "development":
            customer = db.scalar(select(Customer).where(Customer.company_id == company.id))
            if not customer:
                customer = Customer(
                    company_id=company.id,
                    account_code="AC-1001",
                    agent_code="AGT-000001",
                    name="Atlas Corporate Travel",
                    email="travel@atlas.example",
                    telephone="+1 555 0100",
                    default_currency="USD",
                    profile={"customerTypes": ["Corporate"], "businessTypes": ["FIT"]},
                )
                db.add(customer)
                db.flush()
                db.add(
                    Traveller(
                        company_id=company.id,
                        customer_id=customer.id,
                        first_name="Jane",
                        last_name="Doe",
                        email="jane.doe@example.com",
                        phone="+1 555 0123",
                        city="New York",
                        country="United States",
                        passport_encrypted=encrypt_sensitive("DEMO1234"),
                        passport_last4="1234",
                        preferences={"seat": "Window", "meal": "Standard"},
                    )
                )
            suppliers = [
                ("Amadeus GDS", ["Flights", "PNR", "Ticketing"]),
                ("Sabre GDS", ["Flights", "Fares"]),
                ("Travelport uAPI", ["Flights", "Booking", "EMD"]),
                ("Expedia TAAP", ["Hotels"]),
                ("Hotelbeds", ["Hotels"]),
                ("TBO Holidays", ["Holidays", "Transfers"]),
            ]
            for provider_name, services in suppliers:
                exists = db.scalar(
                    select(SupplierConnection).where(
                        SupplierConnection.company_id == company.id,
                        SupplierConnection.provider_name == provider_name,
                    )
                )
                if not exists:
                    db.add(
                        SupplierConnection(
                            company_id=company.id,
                            provider_name=provider_name,
                            services=services,
                            status="sandbox",
                            masked_key="Not configured",
                        )
                    )
            if not db.scalar(select(Notification).where(Notification.company_id == company.id)):
                db.add(
                    Notification(
                        company_id=company.id,
                        title="Dynamic ERP ready",
                        message="Your PostgreSQL-backed JFK ERP workspace is ready.",
                        notification_type="success",
                    )
                )
        db.commit()


if __name__ == "__main__":
    run()
