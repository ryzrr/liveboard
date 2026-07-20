"""
Alert-rule evaluation worker.

Every 30 s, for each ENABLED rule:
  1. Compute its metric over the rule's window from the events table.
  2. Compare against the threshold using the rule's operator.
  3. State machine:
       - breach + not already firing  -> status='firing', last_triggered=now,
         insert alert_history row, deliver to the rule's channel
       - no breach + currently firing  -> status='ok', resolve the open history row
  Owner DB connection (bypasses RLS); the worker sees every project's rules.
"""
from __future__ import annotations

import asyncio
import logging

from core.database import get_pool
from core.notify import deliver

logger = logging.getLogger(__name__)

_INTERVAL = 30  # seconds

_METRIC = {
    "error_rate":      ("Error rate", "%"),
    "p99_latency":     ("p99 latency", "ms"),
    "requests_per_min": ("Requests/min", ""),
}
_OP_WORD = {">": "exceeds", "<": "drops below", "=": "equals", "!=": "differs from"}


def _compare(value: float, operator: str, threshold: float) -> bool:
    if operator == ">":
        return value > threshold
    if operator == "<":
        return value < threshold
    if operator == "=":
        return abs(value - threshold) < 1e-6
    if operator == "!=":
        return abs(value - threshold) >= 1e-6
    return False


async def _metric_value(conn, project_id, metric: str, window_min: int) -> float | None:
    """Return the current metric value over the window, or None if not evaluable."""
    row = await conn.fetchrow(
        """
        SELECT
            COUNT(*)::int AS total,
            COALESCE(100.0 * SUM((status_code >= 400)::int) / NULLIF(COUNT(*), 0), 0)::float AS error_rate,
            COALESCE(percentile_cont(0.99) WITHIN GROUP (ORDER BY duration_ms), 0)::float AS p99
        FROM events
        WHERE project_id = $1 AND time > now() - ($2 * interval '1 minute')
        """,
        project_id,
        window_min,
    )
    total = row["total"] or 0
    if metric == "requests_per_min":
        return total / max(window_min, 1)
    if total == 0:
        return None  # can't judge error rate / latency with no traffic
    if metric == "error_rate":
        return float(row["error_rate"])
    if metric == "p99_latency":
        return float(row["p99"])
    return None  # unsupported metric (e.g. apdex) — skip


async def _deliver_for_rule(conn, project_id, rule, title: str, summary: str) -> None:
    ch = await conn.fetchrow(
        """
        SELECT id, type, webhook_url FROM alert_channels
        WHERE project_id = $1 AND name = $2 AND enabled = TRUE
        LIMIT 1
        """,
        project_id,
        rule["channel"],
    )
    if ch is None:
        return
    ok, _detail = await deliver(ch["type"], ch["webhook_url"], title=title, summary=summary, severity=rule["severity"])
    await conn.execute(
        "UPDATE alert_channels SET last_delivery_at = now(), last_delivery_ok = $2 WHERE id = $1",
        ch["id"],
        ok,
    )


async def _evaluate_all() -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rules = await conn.fetch(
            """
            SELECT id, project_id, name, metric, operator, threshold, window_min,
                   severity, channel, status
            FROM alert_rules
            WHERE enabled = TRUE
            """
        )
        for rule in rules:
            value = await _metric_value(conn, rule["project_id"], rule["metric"], rule["window_min"])
            if value is None:
                continue

            breach = _compare(value, rule["operator"], rule["threshold"])
            label, unit = _METRIC.get(rule["metric"], (rule["metric"], ""))
            op_word = _OP_WORD.get(rule["operator"], rule["operator"])

            if breach and rule["status"] != "firing":
                title = f"{label} {op_word} {rule['threshold']:g}{unit}"
                summary = (
                    f"{label} hit {value:.1f}{unit} over the last {rule['window_min']}m "
                    f"(threshold {rule['operator']} {rule['threshold']:g}{unit})."
                )
                await conn.execute(
                    "UPDATE alert_rules SET status='firing', last_triggered=now(), updated_at=now() WHERE id=$1",
                    rule["id"],
                )
                await conn.execute(
                    """
                    INSERT INTO alert_history (project_id, rule_id, rule_name, fired_at, channel)
                    VALUES ($1, $2, $3, now(), $4)
                    """,
                    rule["project_id"], rule["id"], rule["name"], rule["channel"],
                )
                await _deliver_for_rule(conn, rule["project_id"], rule, title, summary)
                logger.info("Alert FIRING rule=%s project=%s value=%.1f", rule["name"], rule["project_id"], value)

            elif not breach and rule["status"] == "firing":
                await conn.execute(
                    "UPDATE alert_rules SET status='ok', updated_at=now() WHERE id=$1",
                    rule["id"],
                )
                await conn.execute(
                    "UPDATE alert_history SET resolved_at=now() WHERE rule_id=$1 AND resolved_at IS NULL",
                    rule["id"],
                )
                logger.info("Alert RESOLVED rule=%s project=%s", rule["name"], rule["project_id"])


async def run() -> None:
    logger.info("Alert evaluator started — checking every %d s", _INTERVAL)
    while True:
        try:
            await _evaluate_all()
        except Exception:
            logger.exception("Alert evaluation cycle failed")
        await asyncio.sleep(_INTERVAL)
