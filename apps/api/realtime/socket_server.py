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

logger = logging.getLogger(__name__)

# Async Socket.io server — wraps FastAPI via socketio.ASGIApp in main.py
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)


async def _resolve_project(api_key: str) -> str | None:
    """SHA-256 key lookup — same logic as api/deps.py authenticate_project."""
    from core.database import get_pool

    hashed = hashlib.sha256(api_key.encode()).hexdigest()
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id FROM projects WHERE api_key = $1", hashed
        )
    return str(row["id"]) if row else None


@sio.event
async def connect(sid: str, environ: dict, auth: dict | None) -> None:
    api_key: str = (auth or {}).get("api_key", "")
    if not api_key:
        raise ConnectionRefusedError("api_key required")

    project_id = await _resolve_project(api_key)
    if not project_id:
        raise ConnectionRefusedError("invalid api_key")

    await sio.enter_room(sid, f"project:{project_id}")
    await sio.save_session(sid, {"project_id": project_id})
    logger.info("connect sid=%s project=%s", sid, project_id)


@sio.event
async def disconnect(sid: str) -> None:
    logger.debug("disconnect sid=%s", sid)


async def emit_metric(project_id: str, payload: dict) -> None:
    """Called by the pub/sub listener to push a metric update to all clients in the room."""
    await sio.emit("metric", payload, room=f"project:{project_id}")
