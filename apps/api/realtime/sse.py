"""
SSE log-stream endpoint  GET /v1/stream/logs

On connect:
  1. Sends the last 50 events from the Redis Stream as an initial burst.
  2. Streams every new event in real-time using XREAD BLOCK.
  3. Sends : keep-alive comments every 2 s so proxies don't close idle connections.

Reconnection:
  Each SSE event carries an `id:` equal to the Redis Stream entry ID.
  When the browser EventSource reconnects, it sends Last-Event-ID, and the
  server resumes XREAD from that exact position — zero missed events.

Auth:
  Accepts x-api-key header (SDK/programmatic) OR ?api_key= query param
  (browser EventSource which cannot set custom headers).
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import AsyncGenerator

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from fastapi.responses import StreamingResponse

from core.database import get_pool
from core.redis_client import get_redis

router = APIRouter(prefix="/v1", tags=["realtime"])
logger = logging.getLogger(__name__)

INITIAL_EVENTS = 50
BLOCK_MS = 2_000  # how long XREAD blocks before we send a keep-alive


# ─── Auth ────────────────────────────────────────────────────────────────────

async def _authenticate_sse(
    x_api_key: str | None = Header(default=None),
    api_key: str | None = Query(default=None),
    token: str | None = Query(default=None),
    redis: aioredis.Redis = Depends(get_redis),
) -> str:
    """
    Resolve project_id from, in order:
      • a short-lived realtime token (browser, Phase 8.4), or
      • an x-api-key header / ?api_key= query param (SDK/programmatic).
    """
    import hashlib

    from realtime.tokens import resolve_realtime_token

    if token:
        project_id = await resolve_realtime_token(redis, token)
        if project_id:
            return project_id
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    raw_key = x_api_key or api_key
    if not raw_key:
        raise HTTPException(status_code=401, detail="token or api_key required")

    hashed = hashlib.sha256(raw_key.encode()).hexdigest()
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
    if not row:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return str(row["project_id"])


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _decode(value: bytes | str) -> str:
    return value.decode() if isinstance(value, bytes) else str(value)


def _fields_to_log(fields: dict) -> dict:
    def s(key: bytes) -> str:
        v = fields.get(key, b"")
        return _decode(v)

    status_raw = s(b"status_code")
    duration_raw = s(b"duration_ms")

    return {
        "method": s(b"method"),
        "route": s(b"route"),
        "status_code": int(status_raw) if status_raw.isdigit() else 0,
        "duration_ms": int(duration_raw) if duration_raw.isdigit() else 0,
        "trace_id": s(b"trace_id"),
        "user_id": s(b"user_id") or None,
        "timestamp": s(b"timestamp"),
        "error_msg": s(b"error_msg") or None,
    }


# ─── Generator ───────────────────────────────────────────────────────────────

async def _event_stream(
    redis: aioredis.Redis,
    project_id: str,
    last_event_id: str | None,
) -> AsyncGenerator[str, None]:
    stream_key = f"events:{project_id}"

    # ── Initial burst ────────────────────────────────────────────────────────
    if not last_event_id:
        # New connection — send the last 50 events from the stream
        try:
            history = await redis.xrevrange(stream_key, count=INITIAL_EVENTS)
            for entry_id, fields in reversed(history):
                sid = _decode(entry_id)
                data = json.dumps(_fields_to_log(fields))
                yield f"id: {sid}\nevent: log\ndata: {data}\n\n"
            # Tell the browser to wait 1s before reconnecting
            yield "retry: 1000\n\n"
        except Exception as exc:
            logger.debug("SSE initial burst error: %s", exc)

    # ── Live tail ────────────────────────────────────────────────────────────
    # Resume from Last-Event-ID if provided; otherwise start from "now"
    cursor = last_event_id or "$"

    while True:
        try:
            results = await redis.xread(
                {stream_key: cursor}, count=20, block=BLOCK_MS
            )
            if results:
                for _, entries in results:
                    for entry_id, fields in entries:
                        sid = _decode(entry_id)
                        cursor = sid
                        data = json.dumps(_fields_to_log(fields))
                        yield f"id: {sid}\nevent: log\ndata: {data}\n\n"
            else:
                # No new events — send a keep-alive comment
                yield ": keep-alive\n\n"
        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.debug("SSE stream error: %s", exc)
            await asyncio.sleep(1)


# ─── Route ───────────────────────────────────────────────────────────────────

@router.get("/stream/logs")
async def stream_logs(
    project_id: str = Depends(_authenticate_sse),
    last_event_id: str | None = Header(default=None, alias="Last-Event-ID"),
    redis: aioredis.Redis = Depends(get_redis),
) -> StreamingResponse:
    """
    SSE endpoint. Browser EventSource connects here to receive live log entries.
    Sends the last 50 events immediately, then tails the Redis Stream in real-time.
    """
    return StreamingResponse(
        _event_stream(redis, project_id, last_event_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # disable nginx buffering
            "Connection": "keep-alive",
        },
    )
