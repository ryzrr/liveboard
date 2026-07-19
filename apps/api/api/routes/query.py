"""
Read-only analytics query endpoints.
All use x-api-key header auth via resolve_project_id dependency.
"""
from __future__ import annotations

import datetime
import json
import logging

import asyncpg
from fastapi import APIRouter, Depends, Query

from api.deps import resolve_project_id, scoped_conn
from api.schemas import (
    EndpointStat,
    IncidentOut,
    ServiceStatusOut,
    SpanOut,
    TimeseriesPoint,
    TraceOut,
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
    """Request volume and status-code breakdown bucketed over time."""
    # asyncpg encodes interval params from datetime.timedelta (not str).
    bucket = (
        datetime.timedelta(minutes=5) if hours <= 6
        else datetime.timedelta(minutes=15) if hours <= 24
        else datetime.timedelta(hours=1)
    )
    fmt = "%H:%M" if hours <= 24 else "%b %d"

    rows = await conn.fetch(
        """
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
        ORDER BY t
        """,
        bucket,
        project_id,
        hours,
    )

    return [
        TimeseriesPoint(
            time=row["t"].strftime(fmt),
            requests=row["requests"],
            errors2xx=row["req_2xx"],
            errors4xx=row["req_4xx"],
            errors5xx=row["req_5xx"],
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

@router.get("/incidents", response_model=list[IncidentOut])
async def get_incidents(
    project_id: str = Depends(resolve_project_id),
    conn: asyncpg.Connection = Depends(scoped_conn),
) -> list[IncidentOut]:
    """Recent incidents from the AI anomaly detection worker (Phase 5)."""
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


# ─── Traces ──────────────────────────────────────────────────────────────────

@router.get("/traces", response_model=list[TraceOut])
async def get_traces(
    project_id: str = Depends(resolve_project_id),
    conn: asyncpg.Connection = Depends(scoped_conn),
) -> list[TraceOut]:
    """
    Recent distributed traces assembled from the spans table.
    Returns an empty list until Phase 6 (span ingest) is wired up.
    """
    rows = await conn.fetch(
        """
        WITH recent_traces AS (
            SELECT DISTINCT trace_id
            FROM spans
            WHERE project_id = $1
              AND start_time >= now() - INTERVAL '24 hours'
            LIMIT 20
        )
        SELECT
            s.span_id,
            s.trace_id,
            s.parent_id,
            s.service_name,
            s.operation,
            s.start_time,
            s.duration_ms,
            s.status_code,
            s.tags,
            MIN(s.start_time)   OVER (PARTITION BY s.trace_id) AS trace_start,
            SUM(s.duration_ms)  OVER (PARTITION BY s.trace_id) AS total_duration,
            BOOL_OR(s.status_code >= 500) OVER (PARTITION BY s.trace_id) AS has_error
        FROM spans s
        JOIN recent_traces rt ON rt.trace_id = s.trace_id
        WHERE s.project_id = $1
        ORDER BY trace_start DESC, s.start_time
        """,
        project_id,
    )

    # Group spans into traces
    traces: dict[str, dict] = {}
    for row in rows:
        tid = str(row["trace_id"])
        if tid not in traces:
            traces[tid] = {
                "id": tid,
                "trace_start": row["trace_start"],
                "total_duration": int(row["total_duration"] or 0),
                "has_error": bool(row["has_error"]),
                "spans": [],
            }
        trace_start_ms = int(row["trace_start"].timestamp() * 1000)
        span_start_ms = (
            int(row["start_time"].timestamp() * 1000) if row["start_time"] else trace_start_ms
        )
        traces[tid]["spans"].append(
            SpanOut(
                id=str(row["span_id"]),
                trace_id=tid,
                parent_id=str(row["parent_id"]) if row["parent_id"] else None,
                service=row["service_name"] or "unknown",
                name=row["operation"] or "unknown",
                start_time=max(0, span_start_ms - trace_start_ms),
                duration=int(row["duration_ms"] or 0),
                status="error" if (row["status_code"] and row["status_code"] >= 500) else "ok",
                # asyncpg returns JSONB as a string — parse it back to a dict.
                tags=(json.loads(row["tags"]) if isinstance(row["tags"], str) else (row["tags"] or {})),
            )
        )

    result: list[TraceOut] = []
    for t in traces.values():
        spans = t["spans"]
        root = next((s for s in spans if s.parent_id is None), spans[0] if spans else None)
        if not root:
            continue
        result.append(
            TraceOut(
                id=t["id"],
                root_span=root.id,
                service=root.service,
                endpoint=root.name,
                total_duration=t["total_duration"],
                timestamp=t["trace_start"].isoformat(),
                status="error" if t["has_error"] else "ok",
                spans=spans,
            )
        )
    return result


# ─── Services ────────────────────────────────────────────────────────────────

def _service_name(prefix: str) -> str:
    """Map a route prefix to a human-readable service name."""
    segment = prefix.strip("/").split("/")[-1].lower()
    _map = {
        "auth": "Authentication",
        "users": "User Service",
        "user": "User Service",
        "products": "Product Catalog",
        "product": "Product Catalog",
        "orders": "Order Management",
        "order": "Order Management",
        "payments": "Payments",
        "payment": "Payments",
        "search": "Search",
        "webhooks": "Webhooks",
        "analytics": "Analytics",
    }
    return _map.get(segment, prefix or "API")


@router.get("/services", response_model=list[ServiceStatusOut])
async def get_services(
    project_id: str = Depends(resolve_project_id),
    conn: asyncpg.Connection = Depends(scoped_conn),
) -> list[ServiceStatusOut]:
    """
    Service health derived from route-prefix groups in event data.
    Uptime bars represent up to 90 days; missing days default to 'up'.
    """
    rows = await conn.fetch(
        """
        SELECT
            '/' || split_part(route, '/', 2)                                         AS prefix,
            time_bucket('1 day', time)                                                AS day,
            AVG(duration_ms)::float                                                   AS avg_latency,
            (SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END)::float / COUNT(*))  AS error_rate
        FROM events
        WHERE project_id = $1
          AND time >= now() - INTERVAL '90 days'
          AND route IS NOT NULL
          AND route != ''
        GROUP BY prefix, day
        ORDER BY prefix, day
        """,
        project_id,
    )

    if not rows:
        return []

    by_prefix: dict[str, list[dict]] = {}
    for row in rows:
        p = row["prefix"] or "/unknown"
        if p not in by_prefix:
            by_prefix[p] = []
        by_prefix[p].append(
            {
                "day": row["day"].date(),
                "latency": row["avg_latency"] or 0.0,
                "error_rate": row["error_rate"] or 0.0,
            }
        )

    today = datetime.date.today()
    result: list[ServiceStatusOut] = []

    for i, (prefix, days) in enumerate(by_prefix.items()):
        bar_map: dict[datetime.date, str] = {
            d["day"]: (
                "down" if d["error_rate"] > 0.1
                else "degraded" if d["error_rate"] > 0.02
                else "up"
            )
            for d in days
        }

        uptime_bars: list[str] = [
            bar_map.get(today - datetime.timedelta(days=89 - j), "up")
            for j in range(90)
        ]

        up_count = sum(1 for b in uptime_bars if b == "up")
        uptime_pct = round(up_count / 90 * 100, 2)

        latest_bar = bar_map.get(today) or bar_map.get(today - datetime.timedelta(days=1), "up")
        current_status = {"up": "operational", "degraded": "degraded", "down": "major_outage"}[
            latest_bar
        ]

        recent = sorted(days, key=lambda d: d["day"], reverse=True)
        response_time = round(recent[0]["latency"], 1) if recent else 0.0

        result.append(
            ServiceStatusOut(
                id=f"svc_{i:02d}",
                name=_service_name(prefix),
                uptime90d=uptime_pct,
                current_status=current_status,
                response_time=response_time,
                uptime_bars=uptime_bars,
            )
        )

    return result[:10]
