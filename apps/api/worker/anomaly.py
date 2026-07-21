"""
Z-score anomaly detector + Cerebras incident summariser.

Runs every 60 s in the worker process:
  1. Discovers active projects via Redis SCAN (events:* streams).
  2. Queries last-24h bucketed error_rate + p99 from events_1min.
  3. Flags |z-score| > 3 on either metric.
  4. Rate-limits Cerebras calls: max 10 per project per hour (Redis counter).
  5. Deduplicates: skips if an unresolved incident already exists for the metric.
  6. Calls Cerebras (llama-3.3-70b) to generate a plain-English summary.
  7. Stores incident in DB and publishes to incidents:{project_id} Redis channel.
"""
from __future__ import annotations

import asyncio
import json
import logging
import statistics

from cerebras.cloud.sdk import AsyncCerebras

from core.config import settings
from core.database import get_pool
from core.email import incident_email, send as send_email
from core.redis_client import get_redis

logger = logging.getLogger(__name__)

# Module-level singleton — one connection pool for all calls
_cerebras_client: AsyncCerebras | None = None

def _get_cerebras_client() -> AsyncCerebras | None:
    global _cerebras_client
    api_key = settings.cerebras_api_key.get_secret_value()
    if not api_key:
        return None
    if _cerebras_client is None:
        _cerebras_client = AsyncCerebras(api_key=api_key)
    return _cerebras_client

_ZSCORE_THRESHOLD = 3.0
_MIN_BUCKETS = 10          # need at least this many data points to compute z-score
_RATE_LIMIT = 10           # max Cerebras calls per project per hour
_RATE_WINDOW = 3600        # seconds (1 hour)


# ─── Entry point ─────────────────────────────────────────────────────────────

async def run() -> None:
    logger.info("Anomaly detector started — checking every 60 s")
    while True:
        try:
            await _check_all_projects()
        except Exception:
            logger.exception("Anomaly check cycle failed")
        await asyncio.sleep(60)


# ─── Project discovery ───────────────────────────────────────────────────────

async def _check_all_projects() -> None:
    redis = await get_redis()
    pool = await get_pool()

    cursor = 0
    project_ids: set[str] = set()
    while True:
        cursor, keys = await redis.scan(cursor, match="events:*", count=100)
        for key in keys:
            k = key.decode() if isinstance(key, bytes) else key
            project_ids.add(k.split(":", 1)[1])
        if cursor == 0:
            break

    if not project_ids:
        return

    async with pool.acquire() as conn:
        for project_id in project_ids:
            await _check_project(project_id, conn, redis)


# ─── Per-project check ───────────────────────────────────────────────────────

async def _check_project(project_id: str, conn, redis) -> None:
    rows = await conn.fetch(
        """
        SELECT
            bucket,
            COALESCE(
                SUM(errors)::float / NULLIF(SUM(total_requests), 0) * 100,
                0
            ) AS error_rate,
            COALESCE(MAX(p99), 0) AS p99
        FROM events_1min
        WHERE project_id = $1
          AND bucket >= now() - INTERVAL '24 hours'
        GROUP BY bucket
        HAVING SUM(total_requests) >= 10
        ORDER BY bucket ASC
        """,
        project_id,
    )

    if len(rows) < _MIN_BUCKETS:
        return

    error_rates = [float(row["error_rate"]) for row in rows]
    p99_values  = [float(row["p99"])        for row in rows]

    for metric, values, unit in [
        ("error_rate",  error_rates, "%"),
        ("p99_latency", p99_values,  "ms"),
    ]:
        current = values[-1]
        history = values[:-1]

        mean = statistics.mean(history)
        try:
            stddev = statistics.stdev(history)
        except statistics.StatisticsError:
            continue

        if stddev == 0:
            continue

        z_score = (current - mean) / stddev

        # Only INCREASES matter for these "higher = worse" metrics. A drop in
        # error rate or p99 latency is an improvement, not an incident — never
        # page someone because things got better.
        if z_score <= _ZSCORE_THRESHOLD:
            continue

        logger.info(
            "Anomaly project=%s metric=%s current=%.2f mean=%.2f z=%.2f",
            project_id, metric, current, mean, z_score,
        )
        await _handle_anomaly(
            project_id, metric, current, mean, stddev, z_score, unit, conn, redis
        )


# ─── Anomaly handler ─────────────────────────────────────────────────────────

async def _handle_anomaly(
    project_id: str,
    metric: str,
    current: float,
    mean: float,
    stddev: float,
    z_score: float,
    unit: str,
    conn,
    redis,
) -> None:
    # 1. Rate limit
    rate_key = f"anomaly:rate:{project_id}"
    count = await redis.incr(rate_key)
    if count == 1:
        await redis.expire(rate_key, _RATE_WINDOW)
    if count > _RATE_LIMIT:
        logger.debug("Rate limited — project=%s", project_id)
        return

    # 2. Dedup: skip if open incident for same metric within last hour
    existing = await conn.fetchrow(
        """
        SELECT id FROM incidents
        WHERE project_id = $1 AND metric = $2 AND resolved = FALSE
          AND created_at > now() - INTERVAL '1 hour'
        """,
        project_id,
        metric,
    )
    if existing:
        return

    # 3. Pull context: top routes from last 10 minutes
    context_rows = await conn.fetch(
        """
        SELECT
            method,
            route,
            status_code,
            COUNT(*)::int                                               AS cnt,
            AVG(duration_ms)::int                                       AS avg_ms,
            COUNT(*) FILTER (WHERE error_msg IS NOT NULL)::int          AS err_count
        FROM events
        WHERE project_id = $1
          AND time >= now() - INTERVAL '10 minutes'
        GROUP BY method, route, status_code
        ORDER BY cnt DESC
        LIMIT 8
        """,
        project_id,
    )

    # 4. Generate summary via Cerebras
    summary = await _generate_summary(
        metric, current, mean, stddev, z_score, unit, context_rows
    )

    # 5. Build incident fields
    severity   = "critical" if z_score > 4.0 else "warning"
    title      = _anomaly_title(metric, current, z_score, unit)
    top_route  = (
        f"{context_rows[0]['method']} {context_rows[0]['route']}"
        if context_rows else ""
    )

    # 6. Persist
    row = await conn.fetchrow(
        """
        INSERT INTO incidents
            (project_id, severity, title, summary, endpoint, metric, z_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, created_at
        """,
        project_id,
        severity,
        title,
        summary,
        top_route,
        metric,
        round(z_score, 2),
    )

    # 7. Push via Redis → pubsub → Socket.io
    payload = {
        "id":        str(row["id"]),
        "severity":  severity,
        "title":     title,
        "summary":   summary,
        "endpoint":  top_route,
        "metric":    metric,
        "z_score":   round(z_score, 2),
        "timestamp": row["created_at"].isoformat(),
        "resolved":  False,
    }
    await redis.publish(f"incidents:{project_id}", json.dumps(payload))
    logger.info("Incident created id=%s project=%s", row["id"], project_id)

    await _notify_subscribers(conn, project_id, title, summary)


async def _notify_subscribers(conn, project_id: str, title: str, summary: str) -> None:
    """
    Email confirmed, active status-page subscribers about a new incident.
    Best-effort — a delivery failure must not break the anomaly loop, same as
    the alert-channel worker's notify.deliver.
    """
    rows = await conn.fetch(
        """
        SELECT s.email, s.confirm_token, p.public_slug
        FROM status_subscribers s
        JOIN projects p ON p.id = s.project_id
        WHERE s.project_id = $1 AND s.confirmed_at IS NOT NULL AND s.unsubscribed_at IS NULL
        """,
        project_id,
    )
    if not rows or not rows[0]["public_slug"]:
        return

    status_url = f"{settings.public_app_url}/status/{rows[0]['public_slug']}"
    for row in rows:
        unsubscribe_url = f"{settings.public_app_url}/status/unsubscribe/{row['confirm_token']}"
        subject, html = incident_email(title, summary, status_url, unsubscribe_url)
        ok, detail = await send_email(row["email"], subject, html)
        if not ok:
            logger.warning("Incident email to %s failed: %s", row["email"], detail)


# ─── Cerebras summariser ─────────────────────────────────────────────────────

async def _generate_summary(
    metric: str,
    current: float,
    mean: float,
    stddev: float,
    z_score: float,
    unit: str,
    context_rows,
) -> str:
    client = _get_cerebras_client()
    if client is None:
        return _fallback_summary(metric, current, mean, z_score, unit)

    metric_label = {"error_rate": "Error Rate", "p99_latency": "p99 Latency"}.get(
        metric, metric
    )
    context_lines = [
        f"  {r['method']} {r['route']} → HTTP {r['status_code']} "
        f"({r['cnt']} reqs, avg {r['avg_ms']} ms, {r['err_count']} errors)"
        for r in context_rows
    ] or ["  No recent traffic data available"]

    prompt = (
        f"You are an SRE assistant. An API anomaly was detected. Write a tight "
        f"incident briefing for the on-call engineer.\n\n"
        f"Anomaly:\n"
        f"  Metric: {metric_label}\n"
        f"  Current value: {current:.1f}{unit}\n"
        f"  Normal range: {mean:.1f} ± {stddev:.1f}{unit}\n"
        f"  Z-score: {z_score:.1f} (threshold +3.0; the metric spiked ABOVE normal)\n\n"
        f"Recent traffic (last 10 min):\n"
        + "\n".join(context_lines)
        + "\n\nIn 3-4 sentences, plain prose (no markdown, no bullets, no headers): "
        "(1) state what changed and by how much, (2) name the specific endpoint(s) "
        "most likely responsible from the traffic above, (3) give the most likely "
        "cause, and (4) recommend one concrete next step the engineer should take "
        "right now."
    )

    try:
        response = await client.chat.completions.create(
            model=settings.cerebras_model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=260,
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:
        logger.warning("Cerebras call failed: %s — using fallback summary", exc)
        return _fallback_summary(metric, current, mean, z_score, unit)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _anomaly_title(metric: str, current: float, z_score: float, unit: str) -> str:
    direction = "spike" if z_score > 0 else "drop"
    labels = {"error_rate": "Error rate", "p99_latency": "p99 latency"}
    label = labels.get(metric, metric.replace("_", " ").title())
    return f"{label} {direction} — {current:.1f}{unit}"


def _fallback_summary(
    metric: str, current: float, mean: float, z_score: float, unit: str
) -> str:
    direction = "spike" if z_score > 0 else "drop"
    label = {"error_rate": "error rate", "p99_latency": "p99 latency"}.get(
        metric, metric
    )
    return (
        f"Anomaly detected: {label} {direction} to {current:.1f}{unit} "
        f"(normal baseline {mean:.1f}{unit}, z-score {z_score:.1f}). "
        "Review recent deployments and upstream dependencies."
    )
