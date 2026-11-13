import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import (
    branch_scope,
    get_current_user,
    require_csrf,
    require_permissions,
    require_roles,
    require_tenant_user,
)
from app.errors import ApiError, conflict, forbidden, not_found
from app.models import (
    AccessProfile,
    Branch,
    Company,
    Department,
    JobTitle,
    Permission,
    Role,
    SupplierConnection,
    User,
)
from app.schemas import (
    AccessProfileInput,
    AccessProfileOut,
    AccessProfileUpdate,
    BranchInput,
    BranchOut,
    BranchUpdate,
    CompanyOut,
    CompanyUpdate,
    DepartmentInput,
    DepartmentOut,
    DepartmentUpdate,
    JobTitleInput,
    JobTitleOut,
    JobTitleUpdate,
    MatrixOut,
    Page,
    UserInput,
    UserOut,
    UserUpdate,
)
from app.security import hash_password
from app.services import (
    assert_company_quota,
    audit,
    company_payload,
    department_code,
    department_user_count,
    job_title_code,
    user_payload,
)

router = APIRouter(tags=["Management"])
write_access = [Depends(require_csrf)]


def _page(page: int, page_size: int) -> tuple[int, int]:
    return (page - 1) * page_size, page_size


def _visible_for_branch(entity_branch_id: uuid.UUID | None, branch_id: uuid.UUID | None) -> bool:
    return entity_branch_id is None or entity_branch_id == branch_id


def _load_department(db: Session, company_id: uuid.UUID, department_id: uuid.UUID) -> Department:
    department = db.scalar(
        select(Department).where(Department.id == department_id, Department.company_id == company_id)
    )
    if not department or department.status != "active":
        raise not_found("Department")
    return department


def _load_job_title(db: Session, company_id: uuid.UUID, job_title_id: uuid.UUID) -> JobTitle:
    title = db.scalar(
        select(JobTitle).where(JobTitle.id == job_title_id, JobTitle.company_id == company_id)
    )
    if not title or title.status != "active":
        raise not_found("Job title")
    return title


def _load_access_profile(db: Session, company_id: uuid.UUID, access_profile_id: uuid.UUID) -> AccessProfile:
    profile = db.scalar(
        select(AccessProfile).where(
            AccessProfile.id == access_profile_id, AccessProfile.company_id == company_id
        )
    )
    if not profile or profile.status != "active":
        raise not_found("Access profile")
    return profile


def _validate_user_org_links(
    db: Session,
    company_id: uuid.UUID,
    branch_id: uuid.UUID,
    department_id: uuid.UUID,
    job_title_id: uuid.UUID,
    access_profile_id: uuid.UUID,
) -> tuple[Department, JobTitle, AccessProfile]:
    branch = db.scalar(
        select(Branch).where(
            Branch.id == branch_id, Branch.company_id == company_id, Branch.status == "active"
        )
    )
    if not branch:
        raise not_found("Branch")
    department = _load_department(db, company_id, department_id)
    if not _visible_for_branch(department.branch_id, branch_id):
        raise ApiError(400, "Invalid department", "Department is not available for the selected branch.")
    job_title = _load_job_title(db, company_id, job_title_id)
    if not _visible_for_branch(job_title.branch_id, branch_id):
        raise ApiError(400, "Invalid job title", "Job title is not available for the selected branch.")
    access_profile = _load_access_profile(db, company_id, access_profile_id)
    if not _visible_for_branch(access_profile.branch_id, branch_id):
        raise ApiError(
            400, "Invalid access profile", "Access profile is not available for the selected branch."
        )
    return department, job_title, access_profile


def _access_profile_out(profile: AccessProfile) -> dict:
    return AccessProfileOut(
        id=profile.id,
        name=profile.name,
        description=profile.description,
        branch_id=profile.branch_id,
        status=profile.status,
        preset_key=profile.preset_key,
        permission_keys=sorted(permission.key for permission in profile.permissions),
        created_at=profile.created_at,
    ).model_dump(by_alias=True)


def _resolve_permissions(db: Session, keys: list[str]) -> list[Permission]:
    if not keys:
        return []
    rows = db.scalars(select(Permission).where(Permission.key.in_(keys))).all()
    found = {row.key for row in rows}
    missing = sorted(set(keys) - found)
    if missing:
        raise ApiError(400, "Invalid permissions", f"Unknown permission keys: {', '.join(missing)}")
    return list(rows)


@router.get("/company", response_model=CompanyOut)
def get_company(user: User = Depends(require_tenant_user), db: Session = Depends(get_db)):
    company = db.get(Company, user.company_id)
    if not company:
        raise not_found("Company")
    return company_payload(company, db)


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
    # Tenant admins cannot change platform-managed quotas or status.
    updates = data.model_dump(
        exclude_unset=True,
        exclude={"max_sub_companies", "max_users", "max_travellers", "status"},
    )
    for key, value in updates.items():
        setattr(company, key, value.upper() if key == "base_currency" else value)
    audit(db, request, user, "company.update", "company", company.id)
    db.commit()
    db.refresh(company)
    return company_payload(company, db)


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
    assert_company_quota(db, user.company_id, "sub_companies")
    branch = Branch(company_id=user.company_id, **data.model_dump())
    db.add(branch)
    audit(db, request, user, "branch.create", "branch", branch.id)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise conflict("That branch code already exists.") from exc
    return BranchOut.model_validate(branch)


@router.get("/branches/{branch_id}", response_model=BranchOut)
def get_branch(
    branch_id: uuid.UUID,
    user: User = Depends(get_current_user),
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
    payload = BranchOut.model_validate(branch).model_dump(by_alias=True)
    payload["users"] = (
        db.scalar(select(func.count()).select_from(User).where(User.branch_id == branch.id)) or 0
    )
    return payload


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


@router.get("/departments/{department_id}", response_model=DepartmentOut)
def get_department(
    department_id: uuid.UUID,
    user: User = Depends(get_current_user),
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
    payload = DepartmentOut.model_validate(department).model_dump(by_alias=True)
    payload["users"] = department_user_count(db, department.id)
    return payload


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


@router.get("/job-titles", response_model=Page)
def list_job_titles(
    search: str = "",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    user: User = Depends(require_permissions("user.manage")),
    db: Session = Depends(get_db),
):
    scope = (JobTitle.company_id == user.company_id, branch_scope(JobTitle.branch_id, user))
    query = select(JobTitle).where(*scope)
    count_query = select(func.count()).select_from(JobTitle).where(*scope)
    if search:
        term = f"%{search}%"
        clause = or_(JobTitle.name.ilike(term), JobTitle.code.ilike(term))
        query, count_query = query.where(clause), count_query.where(clause)
    offset, limit = _page(page, page_size)
    rows = db.scalars(query.order_by(JobTitle.name).offset(offset).limit(limit)).all()
    return {
        "items": [JobTitleOut.model_validate(row).model_dump(by_alias=True) for row in rows],
        "total": db.scalar(count_query) or 0,
        "page": page,
        "page_size": page_size,
    }


@router.post("/job-titles", response_model=JobTitleOut, status_code=201, dependencies=write_access)
def create_job_title(
    data: JobTitleInput,
    request: Request,
    user: User = Depends(require_permissions("user.manage")),
    db: Session = Depends(get_db),
):
    if user.branch_id and data.branch_id not in {None, user.branch_id}:
        raise forbidden("You cannot create a job title for another branch.")
    if user.branch_id and data.branch_id is None:
        data.branch_id = user.branch_id
    title = JobTitle(company_id=user.company_id, code=job_title_code(db), **data.model_dump())
    db.add(title)
    audit(db, request, user, "job_title.create", "job_title", title.id)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise conflict("A job title with that name already exists.") from exc
    return JobTitleOut.model_validate(title)


@router.get("/job-titles/{job_title_id}", response_model=JobTitleOut)
def get_job_title(
    job_title_id: uuid.UUID,
    user: User = Depends(require_permissions("user.manage")),
    db: Session = Depends(get_db),
):
    title = db.scalar(
        select(JobTitle).where(
            JobTitle.id == job_title_id,
            JobTitle.company_id == user.company_id,
            branch_scope(JobTitle.branch_id, user),
        )
    )
    if not title:
        raise not_found("Job title")
    return JobTitleOut.model_validate(title)


@router.patch("/job-titles/{job_title_id}", response_model=JobTitleOut, dependencies=write_access)
def update_job_title(
    job_title_id: uuid.UUID,
    data: JobTitleUpdate,
    request: Request,
    user: User = Depends(require_permissions("user.manage")),
    db: Session = Depends(get_db),
):
    title = db.scalar(
        select(JobTitle).where(
            JobTitle.id == job_title_id,
            JobTitle.company_id == user.company_id,
            branch_scope(JobTitle.branch_id, user),
        )
    )
    if not title:
        raise not_found("Job title")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(title, key, value)
    audit(db, request, user, "job_title.update", "job_title", title.id)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise conflict("A job title with that name already exists.") from exc
    return JobTitleOut.model_validate(title)


@router.delete("/job-titles/{job_title_id}", status_code=204, dependencies=write_access)
def deactivate_job_title(
    job_title_id: uuid.UUID,
    request: Request,
    user: User = Depends(require_permissions("user.manage")),
    db: Session = Depends(get_db),
):
    title = db.scalar(
        select(JobTitle).where(JobTitle.id == job_title_id, JobTitle.company_id == user.company_id)
    )
    if not title:
        raise not_found("Job title")
    in_use = db.scalar(select(func.count()).select_from(User).where(User.job_title_id == title.id)) or 0
    if in_use:
        raise conflict("Reassign users before deactivating this job title.")
    title.status = "inactive"
    audit(db, request, user, "job_title.deactivate", "job_title", title.id)
    db.commit()


@router.get("/access-profiles", response_model=Page)
def list_access_profiles(
    search: str = "",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    user: User = Depends(require_permissions("user.manage")),
    db: Session = Depends(get_db),
):
    scope = (AccessProfile.company_id == user.company_id, branch_scope(AccessProfile.branch_id, user))
    query = select(AccessProfile).where(*scope)
    count_query = select(func.count()).select_from(AccessProfile).where(*scope)
    if search:
        term = f"%{search}%"
        clause = or_(AccessProfile.name.ilike(term), AccessProfile.description.ilike(term))
        query, count_query = query.where(clause), count_query.where(clause)
    offset, limit = _page(page, page_size)
    rows = db.scalars(query.order_by(AccessProfile.name).offset(offset).limit(limit)).unique().all()
    return {
        "items": [_access_profile_out(row) for row in rows],
        "total": db.scalar(count_query) or 0,
        "page": page,
        "page_size": page_size,
    }


@router.post("/access-profiles", response_model=AccessProfileOut, status_code=201, dependencies=write_access)
def create_access_profile(
    data: AccessProfileInput,
    request: Request,
    user: User = Depends(require_permissions("user.manage")),
    db: Session = Depends(get_db),
):
    if user.branch_id and data.branch_id not in {None, user.branch_id}:
        raise forbidden("You cannot create an access profile for another branch.")
    if user.branch_id and data.branch_id is None:
        data.branch_id = user.branch_id
    permission_keys = list(data.permission_keys)
    if data.from_preset:
        role = db.scalar(select(Role).where(Role.name == data.from_preset))
        if not role:
            raise not_found("Preset")
        permission_keys = sorted(permission.key for permission in role.permissions)
    profile = AccessProfile(
        company_id=user.company_id,
        name=data.name,
        description=data.description,
        branch_id=data.branch_id,
        preset_key=data.from_preset,
        permissions=_resolve_permissions(db, permission_keys),
    )
    db.add(profile)
    audit(db, request, user, "access_profile.create", "access_profile", profile.id)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise conflict("An access profile with that name already exists.") from exc
    return _access_profile_out(profile)


@router.get("/access-profiles/{access_profile_id}", response_model=AccessProfileOut)
def get_access_profile(
    access_profile_id: uuid.UUID,
    user: User = Depends(require_permissions("user.manage")),
    db: Session = Depends(get_db),
):
    profile = db.scalar(
        select(AccessProfile).where(
            AccessProfile.id == access_profile_id,
            AccessProfile.company_id == user.company_id,
            branch_scope(AccessProfile.branch_id, user),
        )
    )
    if not profile:
        raise not_found("Access profile")
    return _access_profile_out(profile)


@router.patch(
    "/access-profiles/{access_profile_id}",
    response_model=AccessProfileOut,
    dependencies=write_access,
)
def update_access_profile(
    access_profile_id: uuid.UUID,
    data: AccessProfileUpdate,
    request: Request,
    user: User = Depends(require_permissions("user.manage")),
    db: Session = Depends(get_db),
):
    profile = db.scalar(
        select(AccessProfile).where(
            AccessProfile.id == access_profile_id,
            AccessProfile.company_id == user.company_id,
            branch_scope(AccessProfile.branch_id, user),
        )
    )
    if not profile:
        raise not_found("Access profile")
    changes = data.model_dump(exclude_unset=True)
    permission_keys = changes.pop("permission_keys", None)
    for key, value in changes.items():
        setattr(profile, key, value)
    if permission_keys is not None:
        profile.permissions = _resolve_permissions(db, permission_keys)
    audit(db, request, user, "access_profile.update", "access_profile", profile.id)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise conflict("An access profile with that name already exists.") from exc
    return _access_profile_out(profile)


@router.delete("/access-profiles/{access_profile_id}", status_code=204, dependencies=write_access)
def deactivate_access_profile(
    access_profile_id: uuid.UUID,
    request: Request,
    user: User = Depends(require_permissions("user.manage")),
    db: Session = Depends(get_db),
):
    profile = db.scalar(
        select(AccessProfile).where(
            AccessProfile.id == access_profile_id, AccessProfile.company_id == user.company_id
        )
    )
    if not profile:
        raise not_found("Access profile")
    in_use = (
        db.scalar(select(func.count()).select_from(User).where(User.access_profile_id == profile.id)) or 0
    )
    if in_use:
        raise conflict("Reassign users before deactivating this access profile.")
    profile.status = "inactive"
    audit(db, request, user, "access_profile.deactivate", "access_profile", profile.id)
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


@router.get("/users/matrix", response_model=MatrixOut)
def users_matrix(
    branch_type: str | None = Query(default=None, pattern="^(Branch|Franchise)$"),
    user: User = Depends(require_roles("Administrator", "Manager")),
    db: Session = Depends(get_db),
):
    branch_query = select(Branch).where(
        Branch.company_id == user.company_id,
        Branch.status == "active",
        branch_scope(Branch.id, user),
    )
    if branch_type:
        branch_query = branch_query.where(Branch.branch_type == branch_type)
    branches = db.scalars(branch_query.order_by(Branch.name)).all()
    users = db.scalars(
        select(User)
        .where(User.company_id == user.company_id, branch_scope(User.branch_id, user))
        .order_by(User.display_name)
    ).unique().all()
    return {
        "branches": [
            {"id": str(branch.id), "name": branch.name, "branchType": branch.branch_type, "code": branch.code}
            for branch in branches
        ],
        "rows": [
            {
                "id": str(row.id),
                "name": row.display_name,
                "email": row.email,
                "departmentId": str(row.department_id) if row.department_id else None,
                "jobTitleId": str(row.job_title_id) if row.job_title_id else None,
                "accessProfileId": str(row.access_profile_id) if row.access_profile_id else None,
                "cells": {str(branch.id): row.branch_id == branch.id for branch in branches},
            }
            for row in users
        ],
    }


@router.post("/users", response_model=UserOut, status_code=201, dependencies=write_access)
def create_user(
    data: UserInput,
    request: Request,
    actor: User = Depends(require_roles("Administrator")),
    db: Session = Depends(get_db),
):
    assert_company_quota(db, actor.company_id, "users")
    _validate_user_org_links(
        db,
        actor.company_id,
        data.branch_id,
        data.department_id,
        data.job_title_id,
        data.access_profile_id,
    )
    user = User(
        company_id=actor.company_id,
        email=data.email.lower(),
        display_name=data.name,
        password_hash=hash_password(data.password),
        branch_id=data.branch_id,
        department_id=data.department_id,
        job_title_id=data.job_title_id,
        access_profile_id=data.access_profile_id,
    )
    db.add(user)
    audit(
        db,
        request,
        actor,
        "user.create",
        "user",
        user.id,
        {"access_profile_id": str(data.access_profile_id)},
    )
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise conflict("That email address is already in use.") from exc
    db.refresh(user)
    return user_payload(user)


@router.get("/users/{user_id}", response_model=UserOut)
def get_user(
    user_id: uuid.UUID,
    actor: User = Depends(require_roles("Administrator", "Manager")),
    db: Session = Depends(get_db),
):
    user = db.scalar(
        select(User).where(
            User.id == user_id,
            User.company_id == actor.company_id,
            branch_scope(User.branch_id, actor),
        )
    )
    if not user:
        raise not_found("User")
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
    if "name" in changes:
        user.display_name = changes.pop("name")
    branch_id = changes.get("branch_id", user.branch_id)
    department_id = changes.get("department_id", user.department_id)
    job_title_id = changes.get("job_title_id", user.job_title_id)
    access_profile_id = changes.get("access_profile_id", user.access_profile_id)
    if None in {branch_id, department_id, job_title_id, access_profile_id}:
        raise ApiError(
            400,
            "Incomplete user links",
            "Branch, department, job title, and access profile are required.",
        )
    _validate_user_org_links(
        db, actor.company_id, branch_id, department_id, job_title_id, access_profile_id
    )
    for key, value in changes.items():
        setattr(user, key, value)
    audit(db, request, actor, "user.update", "user", user.id)
    db.commit()
    db.refresh(user)
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


@router.get("/access-profile-presets")
def list_access_profile_presets(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return list_roles(user, db)
