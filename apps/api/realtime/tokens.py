"""
Short-lived, project-scoped realtime tokens (Phase 8.4).

The dashboard BFF (which knows the signed-in user's projects) asks the backend
to mint a token for a specific project; the browser then uses that opaque token
for the Socket.io handshake and the SSE stream. No API key ever reaches the
browser. Tokens live in Redis with a TTL and can be revoked by deletion.
"""
from __future__ import annotations

import secrets

RT_PREFIX = "rt:"
RT_TTL_SECONDS = 1800  # 30 minutes


async def mint_realtime_token(redis, project_id: str, ttl: int = RT_TTL_SECONDS) -> tuple[str, int]:
    token = secrets.token_urlsafe(24)
    await redis.set(f"{RT_PREFIX}{token}", project_id, ex=ttl)
    return token, ttl


async def resolve_realtime_token(redis, token: str) -> str | None:
    if not token:
        return None
    val = await redis.get(f"{RT_PREFIX}{token}")
    if val is None:
        return None
    return val.decode() if isinstance(val, (bytes, bytearray)) else str(val)
