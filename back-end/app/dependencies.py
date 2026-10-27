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


def require_roles(*roles: str) -> Callable:
    def dependency(user: User = Depends(get_current_user)) -> User:
        names = {role.name for role in user.roles}
        if not names.intersection(roles):
            raise forbidden()
        return user

    return dependency


def permissions_for(user: User) -> list[str]:
    return sorted({permission.key for role in user.roles for permission in role.permissions})


def branch_scope(column, user: User):
    """Scope branch-owned rows; HQ administrators retain company-wide visibility."""
    role_names = {role.name for role in user.roles}
    if user.branch_id is None or "Administrator" in role_names:
        return true()
    return or_(column == user.branch_id, column.is_(None))
