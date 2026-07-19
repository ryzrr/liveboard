import logging
import time

from fastapi import APIRouter, Depends, HTTPException

from api.deps import authenticate_project, get_redis_dep
from api.schemas import IngestRequest, IngestResponse
from core.config import settings
from streams.producer import produce_events

router = APIRouter(prefix="/v1", tags=["ingest"])
logger = logging.getLogger(__name__)


async def _check_rate_limit(redis, project_id: str, n: int) -> None:
    """Fixed-window per-project ingest limiter (Phase 8.5). Raises 429 on overage."""
    limit = settings.ingest_rate_limit_per_min
    if limit <= 0:
        return
    window = int(time.time() // 60)
    key = f"ratelimit:ingest:{project_id}:{window}"
    current = await redis.incrby(key, n)
    if current == n:  # first write in this window — set TTL just past the minute
        await redis.expire(key, 65)
    if current > limit:
        raise HTTPException(
            status_code=429,
            detail=f"Ingest rate limit exceeded ({limit} events/min)",
        )


@router.post("/ingest", status_code=202, response_model=IngestResponse)
async def ingest_events(
    body: IngestRequest,
    project_id: str = Depends(authenticate_project),
    redis=Depends(get_redis_dep),
) -> IngestResponse:
    """
    Accept a batch of API events and push them onto the Redis stream.
    Returns 202 immediately — processing is done by the aggregation worker.
    """
    await _check_rate_limit(redis, project_id, len(body.events))
    await produce_events(project_id, body.events, redis)
    logger.debug("Accepted %d events for project %s", len(body.events), project_id)
    return IngestResponse(accepted=len(body.events))
