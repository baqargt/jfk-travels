from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    app_name: str = "JFK Travel ERP API"
    environment: str = "development"
    api_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://jfk:change-me@localhost:5432/jfk_erp"
    jwt_secret: str = "development-only-secret-change-before-production"
    field_encryption_key: str = ""
    access_token_minutes: int = 15
    refresh_token_days: int = 7
    cookie_secure: bool = False
    allowed_origins: str = "http://localhost:5173,http://localhost:8080"

    admin_email: str = "admin@jfktravel.com"
    admin_password: str = "change-me-now"
    admin_name: str = "JFK Administrator"
    manager_email: str = "manager@jfktravel.com"
    manager_password: str = "change-me-manager"

    redis_url: str = "redis://localhost:6379/0"
    s3_endpoint: str = "http://localhost:9000"
    s3_public_endpoint: str = "http://localhost:9000"
    s3_access_key: str = "jfk-minio"
    s3_secret_key: str = "change-me"
    s3_bucket: str = "jfk-documents"
    clamav_host: str = "localhost"

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@jfktravel.com"

    max_upload_bytes: int = Field(default=20 * 1024 * 1024)

    @property
    def origins(self) -> list[str]:
        return [value.strip() for value in self.allowed_origins.split(",") if value.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
