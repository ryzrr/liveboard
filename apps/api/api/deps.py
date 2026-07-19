import hashlib
import hmac
from typing import AsyncGenerator, Optional

import asyncpg
from fastapi import Depends, Header, HTTPException

from core.database import get_pool
from core.redis_client import get_redis


async def get_db() -> AsyncGenerator[asyncpg.Connection, None]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn


async def get_redis_dep():
    return await get_redis()


# ─── Credential helpers ──────────────────────────────────────────────────────

async def _project_id_from_api_key(x_api_key: str) -> str:
    """
    Look up a project by its raw API key (stored as SHA-256).
    Checks the `api_keys` table (non-revoked) first, then falls back to the
    legacy `projects.api_key` column for keys minted before Phase 8.3.
    """
    hashed = hashlib.sha256(x_api_key.encode()).hexdigest()
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT project_id FROM api_keys WHERE key_hash = $1 AND revoked_at IS NULL",
            hashed,
        )
        if row is None:
            row = await conn.fetchrow(
                "SELECT id AS project_id FROM projects WHERE api_key = $1",
                hashed,
            )
    if row is None:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return str(row["project_id"])


def _valid_internal_token(token: str) -> bool:
    """
    Constant-time check of a trusted server-to-server token.

    Accepts a dedicated INTERNAL_SERVICE_TOKEN when configured; otherwise
    falls back to the master API_SECRET_KEY so local/dev works without an
    extra secret. Both are server-only values, never shipped to the browser.
    """
    from core.config import settings

    candidates = []
    internal = settings.internal_service_token.get_secret_value()
    if internal:
        candidates.append(internal)
    candidates.append(settings.api_secret_key.get_secret_value())

    token_b = token.encode()
    return any(hmac.compare_digest(token_b, c.encode()) for c in candidates)


# ─── Write plane (SDK ingest) ────────────────────────────────────────────────

async def authenticate_project(x_api_key: str = Header(...)) -> str:
    """
    Validate the x-api-key header and return the project's UUID.
    Used by the write plane (ingest, span ingest) — the key maps 1:1 to a
    project, so an SDK can only ever write into its own project.
    """
    return await _project_id_from_api_key(x_api_key)


# ─── Internal plane (trusted Next.js BFF) ────────────────────────────────────

async def authenticate_internal(x_internal_token: str = Header(...)) -> None:
    """Guard for /v1/internal/* — only the trusted dashboard server may call."""
    if not _valid_internal_token(x_internal_token):
        raise HTTPException(status_code=403, detail="Forbidden")


# ─── Read plane (dashboard) ──────────────────────────────────────────────────

async def resolve_project_id(
    x_api_key: Optional[str] = Header(None),
    x_internal_token: Optional[str] = Header(None),
    x_project_id: Optional[str] = Header(None),
) -> str:
    """
    Resolve the project a dashboard read is scoped to, via EITHER:

      • Trusted BFF call — a valid x-internal-token plus an explicit
        x-project-id. The Next.js server has already verified the logged-in
        user is a member of the org owning that project, so we trust it.
        (Postgres RLS in Phase 8.4 will add a DB-level backstop.)

      • Direct API key — x-api-key mapped to its project (backward-compatible
        with the pre-multi-tenant dashboard and any key-based tooling).

    Exactly one credential path must be satisfied.
    """
    if x_internal_token is not None and x_project_id is not None:
        if not _valid_internal_token(x_internal_token):
            raise HTTPException(status_code=403, detail="Forbidden")
        return x_project_id

    if x_api_key is not None:
        return await _project_id_from_api_key(x_api_key)

    raise HTTPException(status_code=401, detail="Missing project credentials")


# ─── Admin (master key) ──────────────────────────────────────────────────────

async def authenticate_admin(x_master_key: str = Header(...)) -> None:
    """
    Validate master key for admin-only endpoints.
    Uses hmac.compare_digest to prevent timing attacks.
    """
    from core.config import settings
    expected = settings.api_secret_key.get_secret_value()
    if not hmac.compare_digest(x_master_key.encode(), expected.encode()):
        raise HTTPException(status_code=403, detail="Forbidden")


# ─── RLS-scoped read connection (defense-in-depth) ───────────────────────────

async def scoped_conn(
    project_id: str = Depends(resolve_project_id),
    conn: asyncpg.Connection = Depends(get_db),
) -> AsyncGenerator[asyncpg.Connection, None]:
    """
    A DB connection for dashboard READS with Row-Level Security enforced.

    Assumes the least-privilege `dashboard_reader` role and pins the request's
    project via the `app.project_id` GUC — so Postgres itself refuses rows from
    any other tenant, even if an app query forgets its `WHERE project_id = …`.
    A read that never set the GUC sees zero rows (fail closed).

    Role + GUC are reset in `finally`; asyncpg's pool reset is a further backstop.
    """
    await conn.execute("SELECT set_config('app.project_id', $1, false)", project_id)
    await conn.execute("SET ROLE dashboard_reader")
    try:
        yield conn
    finally:
        try:
            await conn.execute("RESET ROLE")
            await conn.execute("SELECT set_config('app.project_id', '', false)")
        except Exception:  # pragma: no cover - best-effort cleanup before pool reset
            pass
