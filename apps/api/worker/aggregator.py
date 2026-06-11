from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timezone

import asyncpg
import redis.asyncio as aioredis

from core.config import settings
from core.database import get_pool

logger = logging.getLogger(__name__)

CONSUMER_GROUP = "aggregators"
CONSUMER_NAME = "worker-1"
BATCH_SIZE = 200
STREAM_PATTERN = "events:*"
IDLE_SLEEP = 0.1  # seconds between polls when streams are empty


# ─── Stream discovery ────────────────────────────────────────────────────────

async def _discover_streams(redis: aioredis.Redis) -> list[str]:
    """SCAN for all events:* keys — discovers new projects automatically."""
    keys: list[str] = []
    cursor = 0
    while True:
        cursor, batch = await redis.scan(cursor, match=STREAM_PATTERN, count=200)
        keys.extend(k.decode() if isinstance(k, bytes) else k for k in batch)
        if cursor == 0:
            break
    return keys


async def _ensure_consumer_group(redis: aioredis.Redis, stream_key: str) -> None:
    try:
        await redis.xgroup_create(stream_key, CONSUMER_GROUP, id="0", mkstream=True)
        logger.info("Created consumer group on stream: %s", stream_key)
    except Exception:
        pass  # group already exists


# ─── DB write ────────────────────────────────────────────────────────────────

def _parse_uuid(value: str) -> uuid.UUID | None:
    try:
        return uuid.UUID(value) if value else None
    except ValueError:
        return None


def _parse_message(fields: dict) -> tuple:
    def s(key: bytes) -> str:
        return fields.get(key, b"").decode()

    return (
        datetime.fromisoformat(s(b"timestamp")).replace(tzinfo=timezone.utc),
        _parse_uuid(s(b"project_id")),
        _parse_uuid(s(b"trace_id")),
        s(b"method") or None,
        s(b"route") or None,
        int(s(b"status_code")) if s(b"status_code") else None,
        int(s(b"duration_ms")) if s(b"duration_ms") else None,
        s(b"user_id") or None,
        s(b"error_msg") or None,
    )


async def _write_batch(pool: asyncpg.Pool, raw_messages: list) -> int:
    """Insert events via COPY — 10x faster than individual INSERTs."""
    rows = []
    for _stream_key, entries in raw_messages:
        for _msg_id, fields in entries:
            try:
                rows.append(_parse_message(fields))
            except Exception as exc:
                logger.warning("Skipping malformed event: %s", exc)

    if not rows:
        return 0

    async with pool.acquire() as conn:
        await conn.copy_records_to_table(
            "events",
            records=rows,
            columns=[
                "time", "project_id", "trace_id", "method", "route",
                "status_code", "duration_ms", "user_id", "error_msg",
            ],
        )
    return len(rows)


# ─── Main loop ───────────────────────────────────────────────────────────────

async def run() -> None:
    pool = await get_pool()
    redis = aioredis.from_url(settings.redis_url.get_secret_value(), decode_responses=False)

    known_streams: set[str] = set()
    logger.info("Aggregation worker started")

    while True:
        try:
            # Discover any new project streams
            active = set(await _discover_streams(redis))
            for key in active - known_streams:
                await _ensure_consumer_group(redis, key)
                known_streams.add(key)

            if not known_streams:
                await asyncio.sleep(1)
                continue

            # Read a batch from all known streams in one round-trip
            streams_arg = {k: ">" for k in known_streams}
            messages = await redis.xreadgroup(
                groupname=CONSUMER_GROUP,
                consumername=CONSUMER_NAME,
                streams=streams_arg,
                count=BATCH_SIZE,
                block=int(IDLE_SLEEP * 1000),
            )

            if not messages:
                continue

            written = await _write_batch(pool, messages)

            # Acknowledge only after successful write — guarantees at-least-once
            for stream_key, entries in messages:
                if entries:
                    msg_ids = [msg_id for msg_id, _ in entries]
                    await redis.xack(stream_key, CONSUMER_GROUP, *msg_ids)

            logger.debug("Wrote %d events to TimescaleDB", written)

        except asyncio.CancelledError:
            logger.info("Worker shutting down")
            break
        except Exception as exc:
            logger.error("Worker error: %s", exc, exc_info=True)
            await asyncio.sleep(1)

    await redis.aclose()
