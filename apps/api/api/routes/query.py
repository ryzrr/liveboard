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
    """Recent incidents from the AI anomaly detection worker (Phase 5). Shared by the
    authenticated dashboard route and the public status-page route."""
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


# ─── Traces ──────────────────────────────────────────────────────────────────

@router.get("/traces", response_model=list[TraceOut])
async def get_traces(
    hours: int = Query(24, ge=1, le=168),
    project_id: str = Depends(resolve_project_id),
    conn: asyncpg.Connection = Depends(scoped_conn),
) -> list[TraceOut]:
    """
    Recent distributed traces assembled from the spans table, within the
    last `hours` (default 24, matching Endpoints/Overview's picker). This
    used to hardcode 24h with no way to widen it and no indication to the
    viewer that a window even existed — a project with real spans older than
    a day would just show an empty page with no explanation.
    """
    rows = await conn.fetch(
        """
        WITH recent_traces AS (
            SELECT DISTINCT trace_id
            FROM spans
            WHERE project_id = $1
              AND start_time >= now() - ($2 * INTERVAL '1 hour')
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
        hours,
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


async def fetch_services(conn: asyncpg.Connection, project_id: str) -> list[ServiceStatusOut]:
    """
    Service health derived from route-prefix groups in event data.
    Uptime bars represent up to 90 days; missing days default to 'up'.
    Shared by the authenticated dashboard route and the public status-page route.
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


@router.get("/services", response_model=list[ServiceStatusOut])
async def get_services(
    project_id: str = Depends(resolve_project_id),
    conn: asyncpg.Connection = Depends(scoped_conn),
) -> list[ServiceStatusOut]:
    return await fetch_services(conn, project_id)
