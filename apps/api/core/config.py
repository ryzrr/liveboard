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

    # ── Internal service auth (BFF ↔ backend, Phase 8.2) ──────────────────────
    # Trusted token the Next.js dashboard server uses to call /v1/internal/*
    # and to make session-scoped reads. Empty in dev → the master key is
    # accepted as a fallback (see api.deps.authenticate_internal). Set a
    # dedicated strong value in production.
    internal_service_token: SecretStr = SecretStr("")

    # ── AI (Phase 5 — Cerebras) ───────────────────────────────────────────────
    cerebras_api_key: SecretStr = SecretStr("")
    # Model id must be one your key can access (see `client.models.list()`).
    cerebras_model: str = "gpt-oss-120b"

    # ── CORS / realtime origins (Phase 8.5) ──────────────────────────────────
    # Comma-separated list of allowed browser origins (dashboard + status page).
    # Only realtime (Socket.io / SSE) hits the API cross-origin — REST goes
    # through the same-origin BFF.
    cors_origins: str = "http://localhost:3000"

    # ── Per-project ingest rate limit (Phase 8.5) ─────────────────────────────
    # Max events accepted per project per minute (fixed window). 0 = unlimited.
    ingest_rate_limit_per_min: int = 120_000

    # ── Email (public status page subscriptions) ─────────────────────────────
    # Resend API key for confirmation + incident-alert emails. Empty in dev —
    # core.email.send() logs and no-ops instead of raising when unset.
    resend_api_key: SecretStr = SecretStr("")
    email_from: str = "Liveboard Status <status@liveboard.dev>"
    # Public origin used to build confirm/unsubscribe links in emails.
    public_app_url: str = "http://localhost:3000"

    # ── Environment ───────────────────────────────────────────────────────────
    environment: str = "development"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

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
