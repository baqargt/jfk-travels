import httpx

from app.config import settings
from app.errors import ApiError

SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


def verify_turnstile_token(token: str | None, remote_ip: str = "") -> None:
    secret = settings.turnstile_secret_key.strip()
    if not secret:
        return

    if not token or not token.strip():
        raise ApiError(400, "Captcha required", "Please complete the captcha challenge and try again.")

    payload: dict[str, str] = {
        "secret": secret,
        "response": token.strip(),
    }
    if remote_ip:
        payload["remoteip"] = remote_ip

    try:
        response = httpx.post(SITEVERIFY_URL, data=payload, timeout=10.0)
        response.raise_for_status()
        body = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise ApiError(
            503,
            "Captcha unavailable",
            "Captcha verification could not be completed. Please try again.",
        ) from exc

    if not body.get("success"):
        raise ApiError(400, "Captcha failed", "Captcha verification failed. Please try again.")
