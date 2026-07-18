"""
Socket.io server — project-scoped rooms.

Clients join a room on connect by sending { api_key: "lb_live_..." }
in the Socket.io auth object. The server validates the key, resolves the
project UUID, and enters the socket into room "project:{uuid}".

The worker (separate process) publishes aggregated metrics to Redis pub/sub
channel  metrics:{project_id}.  realtime/pubsub.py bridges that channel to
the socket room so every connected client receives live metric updates.
"""
from __future__ import annotations

import hashlib
import logging

import socketio

from core.config import settings

logger = logging.getLogger(__name__)

# Async Socket.io server — wraps FastAPI via socketio.ASGIApp in main.py
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=settings.cors_origin_list,
    logger=False,
    engineio_logger=False,
)


async def _resolve_project(api_key: str) -> str | None:
    """SHA-256 key lookup — api_keys (non-revoked) first, legacy column fallback."""
    from core.database import get_pool

    hashed = hashlib.sha256(api_key.encode()).hexdigest()
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT project_id FROM api_keys WHERE key_hash = $1 AND revoked_at IS NULL",
            hashed,
        )
        if row is None:
            row = await conn.fetchrow(
                "SELECT id AS project_id FROM projects WHERE api_key = $1", hashed
            )
    return str(row["project_id"]) if row else None


@sio.event
async def connect(sid: str, environ: dict, auth: dict | None) -> None:
    auth = auth or {}
    token = auth.get("token", "")
    api_key = auth.get("api_key", "")

    project_id: str | None = None
    if token:
        # Browser path: short-lived, project-scoped realtime token (Phase 8.4).
        from core.redis_client import get_redis
        from realtime.tokens import resolve_realtime_token

        project_id = await resolve_realtime_token(await get_redis(), token)
    elif api_key:
        project_id = await _resolve_project(api_key)

    if not project_id:
        raise ConnectionRefusedError("valid token or api_key required")

    await sio.enter_room(sid, f"project:{project_id}")
    await sio.save_session(sid, {"project_id": project_id})
    logger.info("connect sid=%s project=%s", sid, project_id)


@sio.event
async def disconnect(sid: str) -> None:
    logger.debug("disconnect sid=%s", sid)


async def emit_metric(project_id: str, payload: dict) -> None:
    """Push a live metric update to all clients in the project room."""
    await sio.emit("metric", payload, room=f"project:{project_id}")


async def emit_incident(project_id: str, payload: dict) -> None:
    """Push a new incident to all clients in the project room."""
    await sio.emit("incident", payload, room=f"project:{project_id}")
