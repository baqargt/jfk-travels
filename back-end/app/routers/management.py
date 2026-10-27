import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import branch_scope, get_current_user, require_csrf, require_roles
from app.errors import conflict, forbidden, not_found
from app.models import Branch, Company, Department, Role, SupplierConnection, User
from app.schemas import (
    BranchInput,
    BranchOut,
    BranchUpdate,
    CompanyOut,
    CompanyUpdate,
    DepartmentInput,
    DepartmentOut,
    DepartmentUpdate,
    Page,
    UserInput,
    UserOut,
    UserUpdate,
)
from app.security import hash_password
from app.services import audit, department_code, department_user_count, user_payload

router = APIRouter(tags=["Management"])
write_access = [Depends(require_csrf)]


def _page(page: int, page_size: int) -> tuple[int, int]:
    return (page - 1) * page_size, page_size


@router.get("/company", response_model=CompanyOut)
def get_company(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = db.get(Company, user.company_id)
    if not company:
        raise not_found("Company")
    return company


@router.patch(
    "/company",
    response_model=CompanyOut,
    dependencies=write_access,
)
def update_company(
    data: CompanyUpdate,
    request: Request,
    user: User = Depends(require_roles("Administrator")),
    db: Session = Depends(get_db),
):
    company = db.get(Company, user.company_id)
    if not company:
        raise not_found("Company")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(company, key, value.upper() if key == "base_currency" else value)
    audit(db, request, user, "company.update", "company", company.id)
    db.commit()
    return company


@router.get("/supplier-connections")
def list_supplier_connections(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(
        select(SupplierConnection)
        .where(SupplierConnection.company_id == user.company_id)
        .order_by(SupplierConnection.provider_name)
    ).all()
    return [
        {
            "id": row.id,
            "providerName": row.provider_name,
            "services": row.services,
            "maskedKey": row.masked_key,
            "enabled": row.enabled,
            "status": row.status,
        }
        for row in rows
    ]


@router.patch("/supplier-connections/{connection_id}", dependencies=write_access)
def update_supplier_connection(
    connection_id: uuid.UUID,
    request: Request,
    enabled: bool,
    user: User = Depends(require_roles("Administrator")),
    db: Session = Depends(get_db),
):
    connection = db.scalar(
        select(SupplierConnection).where(
            SupplierConnection.id == connection_id,
            SupplierConnection.company_id == user.company_id,
        )
    )
    if not connection:
        raise not_found("Supplier connection")
    connection.enabled = enabled
    audit(db, request, user, "supplier.toggle", "supplier_connection", connection.id, {"enabled": enabled})
    db.commit()
    return {"id": connection.id, "enabled": connection.enabled, "status": connection.status}


@router.get("/branches", response_model=Page)
def list_branches(
    search: str = "",
    status: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scope = (Branch.company_id == user.company_id, branch_scope(Branch.id, user))
    query = select(Branch).where(*scope)
    count_query = select(func.count()).select_from(Branch).where(*scope)
    if search:
        term = f"%{search}%"
        clause = or_(Branch.name.ilike(term), Branch.code.ilike(term), Branch.location.ilike(term))
        query, count_query = query.where(clause), count_query.where(clause)
    if status:
        query, count_query = query.where(Branch.status == status), count_query.where(Branch.status == status)
    offset, limit = _page(page, page_size)
    rows = db.scalars(query.order_by(Branch.created_at.desc()).offset(offset).limit(limit)).all()
    items = []
    for row in rows:
        payload = BranchOut.model_validate(row).model_dump(by_alias=True)
        payload["users"] = (
            db.scalar(select(func.count()).select_from(User).where(User.branch_id == row.id)) or 0
        )
        items.append(payload)
    return {"items": items, "total": db.scalar(count_query) or 0, "page": page, "page_size": page_size}


@router.post("/branches", response_model=BranchOut, status_code=201, dependencies=write_access)
def create_branch(
    data: BranchInput,
    request: Request,
    user: User = Depends(require_roles("Administrator")),
    db: Session = Depends(get_db),
):
    branch = Branch(company_id=user.company_id, **data.model_dump())
    db.add(branch)
    audit(db, request, user, "branch.create", "branch", branch.id)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise conflict("That branch code already exists.") from exc
    return BranchOut.model_validate(branch)


@router.patch("/branches/{branch_id}", response_model=BranchOut, dependencies=write_access)
def update_branch(
    branch_id: uuid.UUID,
    data: BranchUpdate,
    request: Request,
    user: User = Depends(require_roles("Administrator", "Manager")),
    db: Session = Depends(get_db),
):
    branch = db.scalar(
        select(Branch).where(
            Branch.id == branch_id,
            Branch.company_id == user.company_id,
            branch_scope(Branch.id, user),
        )
    )
    if not branch:
        raise not_found("Branch")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(branch, key, value)
    audit(db, request, user, "branch.update", "branch", branch.id)
    db.commit()
    return BranchOut.model_validate(branch)


@router.delete("/branches/{branch_id}", status_code=204, dependencies=write_access)
def deactivate_branch(
    branch_id: uuid.UUID,
    request: Request,
    user: User = Depends(require_roles("Administrator")),
    db: Session = Depends(get_db),
):
    branch = db.scalar(select(Branch).where(Branch.id == branch_id, Branch.company_id == user.company_id))
    if not branch:
        raise not_found("Branch")
    branch.status = "inactive"
    audit(db, request, user, "branch.deactivate", "branch", branch.id)
    db.commit()


@router.get("/departments", response_model=Page)
def list_departments(
    search: str = "",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scope = (Department.company_id == user.company_id, branch_scope(Department.branch_id, user))
    query = select(Department).where(*scope)
    count_query = select(func.count()).select_from(Department).where(*scope)
    if search:
        term = f"%{search}%"
        clause = or_(
            Department.name.ilike(term), Department.head_name.ilike(term), Department.code.ilike(term)
        )
        query, count_query = query.where(clause), count_query.where(clause)
    offset, limit = _page(page, page_size)
    rows = db.scalars(query.order_by(Department.name).offset(offset).limit(limit)).all()
    items = []
    for row in rows:
        payload = DepartmentOut.model_validate(row).model_dump(by_alias=True)
        payload["users"] = department_user_count(db, row.id)
        items.append(payload)
    return {"items": items, "total": db.scalar(count_query) or 0, "page": page, "page_size": page_size}


@router.post("/departments", response_model=DepartmentOut, status_code=201, dependencies=write_access)
def create_department(
    data: DepartmentInput,
    request: Request,
    user: User = Depends(require_roles("Administrator", "Manager")),
    db: Session = Depends(get_db),
):
    if user.branch_id and data.branch_id not in {None, user.branch_id}:
        raise forbidden("You cannot create a department for another branch.")
    if user.branch_id and data.branch_id is None:
        data.branch_id = user.branch_id
    department = Department(company_id=user.company_id, code=department_code(db), **data.model_dump())
    db.add(department)
    audit(db, request, user, "department.create", "department", department.id)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise conflict("A department with that name already exists.") from exc
    return DepartmentOut.model_validate(department)


@router.patch("/departments/{department_id}", response_model=DepartmentOut, dependencies=write_access)
def update_department(
    department_id: uuid.UUID,
    data: DepartmentUpdate,
    request: Request,
    user: User = Depends(require_roles("Administrator", "Manager")),
    db: Session = Depends(get_db),
):
    department = db.scalar(
        select(Department).where(
            Department.id == department_id,
            Department.company_id == user.company_id,
            branch_scope(Department.branch_id, user),
        )
    )
    if not department:
        raise not_found("Department")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(department, key, value)
    audit(db, request, user, "department.update", "department", department.id)
    db.commit()
    return DepartmentOut.model_validate(department)


@router.delete("/departments/{department_id}", status_code=204, dependencies=write_access)
def deactivate_department(
    department_id: uuid.UUID,
    request: Request,
    user: User = Depends(require_roles("Administrator")),
    db: Session = Depends(get_db),
):
    department = db.scalar(
        select(Department).where(Department.id == department_id, Department.company_id == user.company_id)
    )
    if not department:
        raise not_found("Department")
    if department_user_count(db, department.id):
        raise conflict("Reassign this department's users before deactivating it.")
    department.status = "inactive"
    audit(db, request, user, "department.deactivate", "department", department.id)
    db.commit()


@router.get("/users", response_model=Page)
def list_users(
    search: str = "",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    user: User = Depends(require_roles("Administrator", "Manager")),
    db: Session = Depends(get_db),
):
    scope = (User.company_id == user.company_id, branch_scope(User.branch_id, user))
    query = select(User).where(*scope)
    count_query = select(func.count()).select_from(User).where(*scope)
    if search:
        term = f"%{search}%"
        clause = or_(User.display_name.ilike(term), User.email.ilike(term))
        query, count_query = query.where(clause), count_query.where(clause)
    offset, limit = _page(page, page_size)
    rows = db.scalars(query.order_by(User.display_name).offset(offset).limit(limit)).unique().all()
    return {
        "items": [user_payload(row) for row in rows],
        "total": db.scalar(count_query) or 0,
        "page": page,
        "page_size": page_size,
    }


@router.post("/users", response_model=UserOut, status_code=201, dependencies=write_access)
def create_user(
    data: UserInput,
    request: Request,
    actor: User = Depends(require_roles("Administrator")),
    db: Session = Depends(get_db),
):
    role = db.scalar(select(Role).where(Role.name == data.role))
    if not role:
        raise not_found("Role")
    user = User(
        company_id=actor.company_id,
        email=data.email.lower(),
        display_name=data.name,
        password_hash=hash_password(data.password),
        branch_id=data.branch_id,
        department_id=data.department_id,
        roles=[role],
    )
    db.add(user)
    audit(db, request, actor, "user.create", "user", user.id, {"role": data.role})
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise conflict("That email address is already in use.") from exc
    return user_payload(user)


@router.patch("/users/{user_id}", response_model=UserOut, dependencies=write_access)
def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    request: Request,
    actor: User = Depends(require_roles("Administrator")),
    db: Session = Depends(get_db),
):
    user = db.scalar(select(User).where(User.id == user_id, User.company_id == actor.company_id))
    if not user:
        raise not_found("User")
    changes = data.model_dump(exclude_unset=True)
    if "role" in changes:
        role = db.scalar(select(Role).where(Role.name == changes.pop("role")))
        if not role:
            raise not_found("Role")
        user.roles = [role]
    if "name" in changes:
        user.display_name = changes.pop("name")
    for key, value in changes.items():
        setattr(user, key, value)
    audit(db, request, actor, "user.update", "user", user.id)
    db.commit()
    return user_payload(user)


@router.delete("/users/{user_id}", status_code=204, dependencies=write_access)
def deactivate_user(
    user_id: uuid.UUID,
    request: Request,
    actor: User = Depends(require_roles("Administrator")),
    db: Session = Depends(get_db),
):
    if actor.id == user_id:
        raise conflict("You cannot deactivate your own account.")
    user = db.scalar(select(User).where(User.id == user_id, User.company_id == actor.company_id))
    if not user:
        raise not_found("User")
    user.status = "inactive"
    audit(db, request, actor, "user.deactivate", "user", user.id)
    db.commit()


@router.get("/roles")
def list_roles(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    del user
    roles = db.scalars(select(Role).order_by(Role.name)).unique().all()
    return [
        {
            "id": role.id,
            "name": role.name,
            "permissions": sorted(permission.key for permission in role.permissions),
        }
        for role in roles
    ]
