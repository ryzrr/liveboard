"""
Redis pub/sub listener — bridges the worker process to Socket.io rooms.

The aggregation worker publishes JSON metrics to channels metrics:{project_id}.
This coroutine (run as a background task in the API process) subscribes to
metrics:* and calls emit_metric() for each message, which broadcasts to the
correct Socket.io project room.
"""
from __future__ import annotations

import asyncio
import json
import logging

import redis.asyncio as aioredis

from core.config import settings
from .socket_server import emit_incident, emit_metric

logger = logging.getLogger(__name__)


async def listen_pubsub() -> None:
    client = aioredis.from_url(settings.redis_url.get_secret_value())
    pubsub = client.pubsub()
    await pubsub.psubscribe("metrics:*", "incidents:*")
    logger.info("Pub/sub listener ready — watching metrics:* incidents:*")

    try:
        async for message in pubsub.listen():
            if message["type"] != "pmessage":
                continue
            try:
                channel: str = (
                    message["channel"].decode()
                    if isinstance(message["channel"], bytes)
                    else message["channel"]
                )
                prefix, project_id = channel.split(":", 1)
                payload = json.loads(message["data"])
                if prefix == "metrics":
                    await emit_metric(project_id, payload)
                elif prefix == "incidents":
                    await emit_incident(project_id, payload)
            except Exception as exc:
                logger.debug("Pub/sub message error: %s", exc)
    except asyncio.CancelledError:
        pass
    finally:
        await pubsub.aclose()
        await client.aclose()
