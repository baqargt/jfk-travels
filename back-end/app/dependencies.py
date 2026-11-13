import secrets
import uuid
from collections.abc import Callable

import jwt
from fastapi import Cookie, Depends, Header, Request
from sqlalchemy import or_, select, true
from sqlalchemy.orm import Session

from app.database import get_db
from app.errors import ApiError, forbidden
from app.models import RefreshSession, User
from app.security import decode_access_token


def get_current_user(
    access_token: str | None = Cookie(default=None, alias="jfk_access"),
    db: Session = Depends(get_db),
) -> User:
    if not access_token:
        raise ApiError(401, "Authentication required", "Please sign in to continue.")
    try:
        payload = decode_access_token(access_token)
        user_id = uuid.UUID(payload["sub"])
        session_id = uuid.UUID(payload["sid"])
    except (jwt.InvalidTokenError, KeyError, ValueError) as exc:
        raise ApiError(401, "Invalid session", "Your session is invalid or has expired.") from exc

    session = db.scalar(
        select(RefreshSession).where(
            RefreshSession.id == session_id,
            RefreshSession.user_id == user_id,
            RefreshSession.revoked_at.is_(None),
        )
    )
    user = db.get(User, user_id)
    if not session or not user or user.status != "active":
        raise ApiError(401, "Invalid session", "Your session is no longer active.")
    return user


def require_csrf(
    request: Request,
    csrf_cookie: str | None = Cookie(default=None, alias="jfk_csrf"),
    csrf_header: str | None = Header(default=None, alias="X-CSRF-Token"),
) -> None:
    if request.method in {"GET", "HEAD", "OPTIONS"}:
        return
    if not csrf_cookie or not csrf_header or not secrets.compare_digest(csrf_cookie, csrf_header):
        raise ApiError(403, "CSRF validation failed", "Refresh the page and try again.")


def role_names_for(user: User) -> set[str]:
    """Compatibility role names from Access Profile (preset/name) with legacy user_roles fallback."""
    if user.is_super_admin:
        return {"SuperAdmin"}
    names: set[str] = set()
    if user.access_profile is not None:
        if user.access_profile.preset_key:
            names.add(user.access_profile.preset_key)
        names.add(user.access_profile.name)
    names.update(role.name for role in user.roles)
    return names


def permissions_for(user: User) -> list[str]:
    if user.is_super_admin:
        return []
    if user.access_profile is not None:
        return sorted({permission.key for permission in user.access_profile.permissions})
    return sorted({permission.key for role in user.roles for permission in role.permissions})


def require_roles(*roles: str) -> Callable:
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.is_super_admin:
            raise forbidden("Platform administrators must use platform APIs.")
        if not role_names_for(user).intersection(roles):
            raise forbidden()
        return user

    return dependency


def require_permissions(*keys: str) -> Callable:
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.is_super_admin:
            raise forbidden("Platform administrators must use platform APIs.")
        granted = set(permissions_for(user))
        if not set(keys).issubset(granted):
            raise forbidden()
        return user

    return dependency


def require_super_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_super_admin:
        raise forbidden("Super administrator access is required.")
    return user


def require_tenant_user(user: User = Depends(get_current_user)) -> User:
    if user.is_super_admin or user.company_id is None:
        raise forbidden("A company-scoped account is required.")
    return user


def branch_scope(column, user: User):
    """Scope branch-owned rows; HQ administrators retain company-wide visibility."""
    if user.is_super_admin:
        return true()
    if user.branch_id is None or "Administrator" in role_names_for(user):
        return true()
    return or_(column == user.branch_id, column.is_(None))
