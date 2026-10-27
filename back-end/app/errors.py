class ApiError(Exception):
    def __init__(
        self,
        status: int,
        title: str,
        detail: str,
        *,
        error_type: str = "about:blank",
        errors: dict[str, list[str]] | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        self.status = status
        self.title = title
        self.detail = detail
        self.error_type = error_type
        self.errors = errors
        self.headers = headers or {}
        super().__init__(detail)


def not_found(entity: str = "Record") -> ApiError:
    return ApiError(404, "Not found", f"{entity} was not found.")


def conflict(detail: str) -> ApiError:
    return ApiError(409, "Conflict", detail)


def forbidden(detail: str = "You do not have permission to perform this action.") -> ApiError:
    return ApiError(403, "Forbidden", detail)
