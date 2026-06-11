from __future__ import annotations

import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import redis.asyncio as aioredis
    from api.schemas import EventPayload

logger = logging.getLogger(__name__)

# Batch all XADDs into one pipeline call — avoids per-event round-trips
async def produce_events(
    project_id: str,
    events: list[EventPayload],
    redis: aioredis.Redis,
) -> None:
    stream_key = f"events:{project_id}"
    pipe = redis.pipeline(transaction=False)

    for event in events:
        fields = {
            b"project_id": project_id,
            b"method": event.method,
            b"route": event.route,
            b"status_code": str(event.status_code),
            b"duration_ms": str(event.duration_ms),
            b"trace_id": event.trace_id or "",
            b"user_id": event.user_id or "",
            b"timestamp": event.timestamp.isoformat(),
            b"error_msg": event.error_msg or "",
            b"sdk_version": event.sdk_version or "",
        }
        pipe.xadd(stream_key, fields, maxlen=100_000, approximate=True)

    await pipe.execute()
    logger.debug("Produced %d events to %s", len(events), stream_key)
