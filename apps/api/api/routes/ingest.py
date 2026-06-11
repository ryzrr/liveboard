import logging

from fastapi import APIRouter, Depends

from api.deps import authenticate_project, get_redis_dep
from api.schemas import IngestRequest, IngestResponse
from streams.producer import produce_events

router = APIRouter(prefix="/v1", tags=["ingest"])
logger = logging.getLogger(__name__)


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
    await produce_events(project_id, body.events, redis)
    logger.debug("Accepted %d events for project %s", len(body.events), project_id)
    return IngestResponse(accepted=len(body.events))
