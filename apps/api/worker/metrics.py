"""
Metrics publisher — runs as a background task inside the worker process.

Every second it:
  1. SCANs Redis for active event streams (events:*)
  2. Queries the last 60-second window from TimescaleDB per project
  3. Publishes { requests, errorRate, p99, avg, req2xx, req4xx, req5xx, bucket }
     to metrics:{project_id} on the Redis pub/sub bus

The API process (realtime/pubsub.py) subscribes to metrics:* and forwards
each message to the correct Socket.io room.
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Optional

import asyncpg
import redis.asyncio as aioredis

from core.config import settings
from core.database import get_pool

logger = logging.getLogger(__name__)

PUBLISH_INTERVAL = 1.0  # seconds
STREAM_PATTERN = "events:*"


async def _scan_project_ids(redis: aioredis.Redis) -> list[str]:
    project_ids: list[str] = []
    cursor = 0
    while True:
        cursor, keys = await redis.scan(cursor, match=STREAM_PATTERN, count=200)
        for key in keys:
            raw = key.decode() if isinstance(key, bytes) else key
            project_ids.append(raw.split(":", 1)[1])
        if cursor == 0:
            break
    return project_ids


async def _fetch_metrics(conn: asyncpg.Connection, project_id: str) -> Optional[dict]:
    row = await conn.fetchrow(
        """
        SELECT
            COUNT(*)                                                          AS total_requests,
            ROUND(
                100.0 * SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END)
                / NULLIF(COUNT(*), 0),
                1
            )                                                                 AS error_rate,
            COALESCE(
                PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms), 0
            )                                                                 AS p99,
            COALESCE(AVG(duration_ms), 0)                                    AS avg_ms,
            SUM(CASE WHEN status_code < 400               THEN 1 ELSE 0 END) AS req_2xx,
            SUM(CASE WHEN status_code BETWEEN 400 AND 499 THEN 1 ELSE 0 END) AS req_4xx,
            SUM(CASE WHEN status_code >= 500               THEN 1 ELSE 0 END) AS req_5xx
        FROM events
        WHERE project_id = $1::uuid
          AND time > NOW() - INTERVAL '1 minute'
        """,
        project_id,
    )
    if not row or row["total_requests"] == 0:
        return None
    return {
        "requests": int(row["total_requests"]),
        "errorRate": float(row["error_rate"] or 0),
        "p99": round(float(row["p99"]), 1),
        "avg": round(float(row["avg_ms"]), 1),
        "req2xx": int(row["req_2xx"] or 0),
        "req4xx": int(row["req_4xx"] or 0),
        "req5xx": int(row["req_5xx"] or 0),
        "bucket": None,
    }


async def run() -> None:
    pool = await get_pool()
    redis = aioredis.from_url(
        settings.redis_url.get_secret_value(), decode_responses=False
    )
    logger.info("Metrics publisher started")

    while True:
        try:
            await asyncio.sleep(PUBLISH_INTERVAL)
            project_ids = await _scan_project_ids(redis)
            if not project_ids:
                continue

            async with pool.acquire() as conn:
                for project_id in project_ids:
                    metrics = await _fetch_metrics(conn, project_id)
                    if metrics:
                        await redis.publish(
                            f"metrics:{project_id}", json.dumps(metrics)
                        )

        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.error("Metrics publisher error: %s", exc, exc_info=True)

    await redis.aclose()
