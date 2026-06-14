"""
Span ingest endpoint — POST /v1/spans

Accepts a batch of OpenTelemetry-style spans and bulk-inserts them into
the spans table. Auth is the same x-api-key header as the event ingest route.
"""
from __future__ import annotations

import json
import logging
import uuid

import asyncpg
from fastapi import APIRouter, Depends

from api.deps import authenticate_project, get_db
from api.schemas import SpanBatchRequest, SpanBatchResponse

router = APIRouter(prefix="/v1", tags=["spans"])
logger = logging.getLogger(__name__)


@router.post("/spans", response_model=SpanBatchResponse, status_code=202)
async def ingest_spans(
    body: SpanBatchRequest,
    project_id: str = Depends(authenticate_project),
    conn: asyncpg.Connection = Depends(get_db),
) -> SpanBatchResponse:
    """Bulk-insert a batch of spans. Duplicate span_ids are silently ignored."""
    records = []
    for s in body.spans:
        try:
            records.append((
                uuid.UUID(s.span_id),
                uuid.UUID(s.trace_id),
                uuid.UUID(s.parent_id) if s.parent_id else None,
                uuid.UUID(project_id),
                s.service_name,
                s.operation,
                s.start_time,
                s.duration_ms,
                s.status_code,
                json.dumps(s.tags),
            ))
        except (ValueError, AttributeError) as exc:
            logger.debug("Skipping malformed span %s: %s", s.span_id, exc)
            continue

    if not records:
        return SpanBatchResponse(accepted=0)

    await conn.executemany(
        """
        INSERT INTO spans
            (span_id, trace_id, parent_id, project_id,
             service_name, operation, start_time, duration_ms, status_code, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
        ON CONFLICT (span_id) DO NOTHING
        """,
        records,
    )

    logger.info("Accepted %d spans for project=%s", len(records), project_id)
    return SpanBatchResponse(accepted=len(records))
