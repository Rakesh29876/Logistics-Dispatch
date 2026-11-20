from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "sqlite:///./logistics.db"
    database_url_unpooled: str | None = None
    readonly_database_url: str | None = None
    domo_subdomain: str = "gwcteq-partner"
    domo_token: str = ""
    domo_model: str = "domo.domo_ai.domogpt-large-v2.2:anthropic"
    cors_origins: str = "http://localhost:5173"
    data_reload_on_startup: bool = False
    data_zip_path: str = "e:/Documents/data.zip"
    delay_risk_medium_ratio: float = 0.80
    delay_risk_high_ratio: float = 1.00
    delay_risk_critical_overdue_hours: float = 24.0
    jwt_secret_key: str = "change-me-in-env-jwt-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    initial_admin_username: str | None = None
    initial_admin_password: str | None = None
    model_config = SettingsConfigDict(
        env_file=[".env", ".env.local", "../.env.local", "../../.env.local"],
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @staticmethod
    def _normalize_pg_url(url: str) -> str:
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+psycopg://", 1)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+psycopg://", 1)
        return url

    @property
    def sqlalchemy_url(self) -> str:
        return self._normalize_pg_url(self.database_url)

    @property
    def unpooled_sqlalchemy_url(self) -> str:
        return self._normalize_pg_url(self.database_url_unpooled or self.database_url)

    @property
    def readonly_sqlalchemy_url(self) -> str:
        return self._normalize_pg_url(self.readonly_database_url or self.database_url)

    @property
    def masked_database_host(self) -> str:
        if "@" in self.database_url:
            return self.database_url.split("@", 1)[1].split("?", 1)[0]
        return "local"

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
