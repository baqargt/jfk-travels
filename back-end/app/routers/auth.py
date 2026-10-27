from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user, require_csrf
from app.errors import ApiError
from app.models import RefreshSession, User
from app.schemas import LoginInput, UserOut
from app.security import (
    create_access_token,
    new_csrf_token,
    new_refresh_token,
    token_hash,
    verify_password,
)
from app.services import audit, user_payload

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _set_cookies(response: Response, access: str, refresh: str, csrf: str) -> None:
    common = {"secure": settings.cookie_secure, "samesite": "lax"}
    response.set_cookie(
        "jfk_access",
        access,
        max_age=settings.access_token_minutes * 60,
        httponly=True,
        path="/",
        **common,
    )
    response.set_cookie(
        "jfk_refresh",
        refresh,
        max_age=settings.refresh_token_days * 86400,
        httponly=True,
        path=f"{settings.api_prefix}/auth",
        **common,
    )
    response.set_cookie(
        "jfk_csrf",
        csrf,
        max_age=settings.refresh_token_days * 86400,
        httponly=False,
        path="/",
        **common,
    )


@router.post("/login", response_model=UserOut)
def login(data: LoginInput, request: Request, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == data.email.lower()))
    if not user or not verify_password(data.password, user.password_hash):
        raise ApiError(401, "Sign in failed", "Invalid email or password.")
    if user.status != "active":
        raise ApiError(403, "Account unavailable", "This account is inactive or suspended.")

    raw_refresh = new_refresh_token()
    session = RefreshSession(
        user_id=user.id,
        token_hash=token_hash(raw_refresh),
        user_agent=request.headers.get("user-agent", "")[:500],
        ip_address=request.client.host if request.client else "",
        expires_at=datetime.now(UTC) + timedelta(days=settings.refresh_token_days),
    )
    db.add(session)
    db.flush()
    user.last_login_at = datetime.now(UTC)
    audit(db, request, user, "auth.login", "user", user.id)
    db.commit()

    _set_cookies(response, create_access_token(str(user.id), str(session.id)), raw_refresh, new_csrf_token())
    return user_payload(user)


@router.post("/refresh", response_model=UserOut)
def refresh(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    raw_refresh = request.cookies.get("jfk_refresh")
    if not raw_refresh:
        raise ApiError(401, "Session expired", "Please sign in again.")
    session = db.scalar(select(RefreshSession).where(RefreshSession.token_hash == token_hash(raw_refresh)))
    now = datetime.now(UTC)
    if not session or session.revoked_at is not None or session.expires_at <= now:
        raise ApiError(401, "Session expired", "Please sign in again.")
    user = db.get(User, session.user_id)
    if not user or user.status != "active":
        raise ApiError(401, "Session expired", "Please sign in again.")

    session.revoked_at = now
    replacement_token = new_refresh_token()
    replacement = RefreshSession(
        user_id=user.id,
        token_hash=token_hash(replacement_token),
        user_agent=request.headers.get("user-agent", "")[:500],
        ip_address=request.client.host if request.client else "",
        expires_at=now + timedelta(days=settings.refresh_token_days),
    )
    db.add(replacement)
    db.flush()
    db.commit()
    _set_cookies(
        response,
        create_access_token(str(user.id), str(replacement.id)),
        replacement_token,
        new_csrf_token(),
    )
    return user_payload(user)


@router.post("/logout", status_code=204, dependencies=[Depends(require_csrf)])
def logout(
    request: Request,
    response: Response,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    token = request.cookies.get("jfk_refresh")
    if token:
        session = db.scalar(select(RefreshSession).where(RefreshSession.token_hash == token_hash(token)))
        if session:
            session.revoked_at = datetime.now(UTC)
    audit(db, request, user, "auth.logout", "user", user.id)
    db.commit()
    response.delete_cookie("jfk_access", path="/")
    response.delete_cookie("jfk_refresh", path=f"{settings.api_prefix}/auth")
    response.delete_cookie("jfk_csrf", path="/")


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user_payload(user)
