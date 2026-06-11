import hashlib
import hmac
from typing import AsyncGenerator

import asyncpg
from fastapi import Header, HTTPException

from core.database import get_pool
from core.redis_client import get_redis


async def get_db() -> AsyncGenerator[asyncpg.Connection, None]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn


async def get_redis_dep():
    return await get_redis()


async def authenticate_project(x_api_key: str = Header(...)) -> str:
    """
    Validate x-api-key header and return the project's UUID.
    Key is stored as SHA-256 — the raw key never touches the DB.
    """
    hashed = hashlib.sha256(x_api_key.encode()).hexdigest()
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id FROM projects WHERE api_key = $1",
            hashed,
        )
    if row is None:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return str(row["id"])


async def authenticate_admin(x_master_key: str = Header(...)) -> None:
    """
    Validate master key for admin-only endpoints.
    Uses hmac.compare_digest to prevent timing attacks.
    """
    from core.config import settings
    expected = settings.api_secret_key.get_secret_value()
    if not hmac.compare_digest(x_master_key.encode(), expected.encode()):
        raise HTTPException(status_code=403, detail="Forbidden")
