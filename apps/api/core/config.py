import sys
from pydantic import SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_INSECURE_DEFAULTS = {"dev-secret", "secret", "changeme", "password", "liveboard"}


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────────────────────
    database_url: SecretStr

    # ── Redis ─────────────────────────────────────────────────────────────────
    redis_url: SecretStr = SecretStr("redis://localhost:6379")

    # ── API ───────────────────────────────────────────────────────────────────
    api_secret_key: SecretStr
    ingest_api_port: int = 8000

    # ── AI (Phase 5 — Cerebras) ───────────────────────────────────────────────
    cerebras_api_key: SecretStr = SecretStr("")

    # ── Environment ───────────────────────────────────────────────────────────
    environment: str = "development"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("api_secret_key", mode="after")
    @classmethod
    def _strong_master_key(cls, v: SecretStr) -> SecretStr:
        val = v.get_secret_value()
        if val in _INSECURE_DEFAULTS:
            print(
                "[WARN] API_SECRET_KEY is set to an insecure default. "
                "Set a strong random value before deploying.",
                file=sys.stderr,
            )
        if len(val) < 16:
            raise ValueError("API_SECRET_KEY must be at least 16 characters")
        return v

    @model_validator(mode="after")
    def _production_checks(self) -> "Settings":
        if self.environment == "production":
            key = self.api_secret_key.get_secret_value()
            if key in _INSECURE_DEFAULTS or len(key) < 32:
                raise ValueError(
                    "API_SECRET_KEY must be a strong secret (≥32 chars) in production"
                )
        return self


settings = Settings()
