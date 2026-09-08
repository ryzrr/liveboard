"""
Read-only analytics query endpoints.
All use x-api-key header auth via resolve_project_id dependency.
"""
from __future__ import annotations

import datetime
import logging

import asyncpg
from fastapi import APIRouter, Depends, Query

from api.deps import resolve_project_id, scoped_conn
from api.schemas import (
    EndpointStat,
    IncidentOut,
    TimeseriesPoint,
)

router = APIRouter(prefix="/v1", tags=["query"])
logger = logging.getLogger(__name__)


# ─── Timeseries ──────────────────────────────────────────────────────────────

@router.get("/metrics/timeseries", response_model=list[TimeseriesPoint])
async def get_timeseries(
    hours: int = Query(24, ge=1, le=168),
    project_id: str = Depends(resolve_project_id),
    conn: asyncpg.Connection = Depends(scoped_conn),
) -> list[TimeseriesPoint]:
    """
    Request volume and status-code breakdown bucketed over time.

    Counts are normalized to a per-minute rate (divided by bucket width) —
    the bucket width varies with `hours` (5 min / 15 min / 1 hr) so a raw
    per-bucket count would jump ~12x just from switching the time range,
    with no actual traffic change.

    Buckets are generated for the *entire* requested range up front (via
    generate_series) and left-joined against the real data, rather than only
    returning rows where traffic happened. Otherwise a quiet stretch — no
    events for hours — simply has no rows, and the chart draws a straight
    line connecting the points either side of the gap as if it were one
    smooth, continuous step. Zero-filling makes a real gap look like a gap.

    `time` is returned as a raw ISO 8601 UTC instant, not a pre-formatted
    string — this endpoint has no idea what timezone the viewer is in, so
    formatting here would silently bake in the server's UTC clock. The
    frontend formats it in the viewer's local timezone, same as every other
    timestamp in the app (live log, incidents, etc.).
    """
    # asyncpg encodes interval params from datetime.timedelta (not str).
    bucket_minutes = 5 if hours <= 6 else 15 if hours <= 24 else 60
    bucket = datetime.timedelta(minutes=bucket_minutes)

    rows = await conn.fetch(
        """
        WITH buckets AS (
            SELECT generate_series(
                time_bucket($1, now() - ($3 * INTERVAL '1 hour')),
                time_bucket($1, now()),
                $1
            ) AS t
        ),
        agg AS (
            SELECT
                time_bucket($1, time)                                                    AS t,
                COUNT(*)::int                                                             AS requests,
                SUM(CASE WHEN status_code < 400               THEN 1 ELSE 0 END)::int   AS req_2xx,
                SUM(CASE WHEN status_code BETWEEN 400 AND 499 THEN 1 ELSE 0 END)::int   AS req_4xx,
                SUM(CASE WHEN status_code >= 500              THEN 1 ELSE 0 END)::int   AS req_5xx,
                COALESCE(
                    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms), 0
                )::float                                                                  AS p99
            FROM events
            WHERE project_id = $2
              AND time >= now() - ($3 * INTERVAL '1 hour')
            GROUP BY t
        )
        SELECT
            b.t,
            COALESCE(a.requests, 0) AS requests,
            COALESCE(a.req_2xx, 0)  AS req_2xx,
            COALESCE(a.req_4xx, 0)  AS req_4xx,
            COALESCE(a.req_5xx, 0)  AS req_5xx,
            COALESCE(a.p99, 0)      AS p99
        FROM buckets b
        LEFT JOIN agg a ON a.t = b.t
        ORDER BY b.t
        """,
        bucket,
        project_id,
        hours,
    )

    return [
        TimeseriesPoint(
            time=row["t"].isoformat(),
            requests=round(row["requests"] / bucket_minutes, 1),
            errors2xx=round(row["req_2xx"] / bucket_minutes, 1),
            errors4xx=round(row["req_4xx"] / bucket_minutes, 1),
            errors5xx=round(row["req_5xx"] / bucket_minutes, 1),
            p99=round(row["p99"], 1),
        )
        for row in rows
    ]


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/endpoints", response_model=list[EndpointStat])
async def get_endpoints(
    hours: int = Query(24, ge=1, le=168),
    project_id: str = Depends(resolve_project_id),
    conn: asyncpg.Connection = Depends(scoped_conn),
) -> list[EndpointStat]:
    """Per-route aggregate stats with p50/p95/p99 latency percentiles."""
    rows = await conn.fetch(
        """
        SELECT
            method,
            route,
            COUNT(*)::int                                                                     AS requests,
            (SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END)::float / COUNT(*) * 100)   AS error_rate,
            COALESCE(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY duration_ms), 0)::float   AS p50,
            COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms), 0)::float   AS p95,
            COALESCE(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms), 0)::float   AS p99,
            MAX(time)                                                                         AS last_called
        FROM events
        WHERE project_id = $1
          AND time >= now() - ($2 * INTERVAL '1 hour')
        GROUP BY method, route
        ORDER BY requests DESC
        LIMIT 50
        """,
        project_id,
        hours,
    )

    result: list[EndpointStat] = []
    for i, row in enumerate(rows):
        error_rate = row["error_rate"] or 0.0
        p99 = row["p99"] or 0.0
        # Penalty: up to 50 points for error rate, up to 40 points for high p99
        health_score = max(
            0,
            round(100 - min(50.0, error_rate * 5) - min(40.0, max(0.0, p99 - 200) / 40)),
        )
        result.append(
            EndpointStat(
                id=f"ep_{i:02d}",
                method=row["method"],
                route=row["route"],
                requests24h=row["requests"],
                error_rate=round(error_rate, 2),
                p50=round(row["p50"] or 0.0, 1),
                p95=round(row["p95"] or 0.0, 1),
                p99=round(p99, 1),
                last_called=row["last_called"].isoformat(),
                health_score=health_score,
            )
        )
    return result


# ─── Incidents ───────────────────────────────────────────────────────────────

async def fetch_incidents(conn: asyncpg.Connection, project_id: str) -> list[IncidentOut]:
    """Recent incidents written by the AI anomaly detection worker (Phase 5)."""
    rows = await conn.fetch(
        """
        SELECT id, severity, title, summary, endpoint, resolved, created_at
        FROM incidents
        WHERE project_id = $1
        ORDER BY created_at DESC
        LIMIT 20
        """,
        project_id,
    )
    return [
        IncidentOut(
            id=str(row["id"]),
            severity=row["severity"],
            title=row["title"],
            summary=row["summary"],
            endpoint=row["endpoint"] or "",
            timestamp=row["created_at"].isoformat(),
            resolved=row["resolved"],
        )
        for row in rows
    ]


@router.get("/incidents", response_model=list[IncidentOut])
async def get_incidents(
    project_id: str = Depends(resolve_project_id),
    conn: asyncpg.Connection = Depends(scoped_conn),
) -> list[IncidentOut]:
    return await fetch_incidents(conn, project_id)
