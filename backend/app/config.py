from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_SECRET = "cambia-esto"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    database_url: str = "sqlite+aiosqlite:///./peticiones.db"
    admin_password: str = _DEFAULT_SECRET
    jwt_secret: str = _DEFAULT_SECRET
    jwt_expire_minutes: int = 60 * 24
    cors_origins: str = "http://localhost:5173"

    @model_validator(mode="after")
    def _no_defaults_in_production(self):
        if self.environment == "production" and _DEFAULT_SECRET in (
            self.admin_password,
            self.jwt_secret,
        ):
            raise ValueError(
                "ADMIN_PASSWORD y JWT_SECRET deben cambiarse en producción"
            )
        return self


settings = Settings()
