"""
Alert rules CRUD + alert history endpoints.
All routes require x-api-key auth via resolve_project_id dependency.
"""
from __future__ import annotations

import logging
from datetime import datetime

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Response

from api.deps import resolve_project_id, get_db, scoped_conn
from api.schemas import (
    AlertHistoryOut,
    AlertRuleOut,
    CreateAlertRuleRequest,
    UpdateAlertRuleRequest,
)

router = APIRouter(prefix="/v1", tags=["alerts"])
logger = logging.getLogger(__name__)


def _rule_row_to_out(row: asyncpg.Record) -> AlertRuleOut:
    return AlertRuleOut(
        id=str(row["id"]),
        name=row["name"],
        metric=row["metric"],
        operator=row["operator"],
        threshold=row["threshold"],
        window=row["window_min"],
        severity=row["severity"],
        channel=row["channel"],
        status=row["status"],
        enabled=row["enabled"],
        last_triggered=row["last_triggered"].isoformat() if row["last_triggered"] else None,
    )


# ─── List ────────────────────────────────────────────────────────────────────

@router.get("/alert-rules", response_model=list[AlertRuleOut])
async def list_alert_rules(
    project_id: str = Depends(resolve_project_id),
    conn: asyncpg.Connection = Depends(scoped_conn),
) -> list[AlertRuleOut]:
    rows = await conn.fetch(
        """
        SELECT id, name, metric, operator, threshold, window_min,
               severity, channel, status, enabled, last_triggered
        FROM alert_rules
        WHERE project_id = $1
        ORDER BY created_at ASC
        """,
        project_id,
    )
    return [_rule_row_to_out(r) for r in rows]


# ─── Create ──────────────────────────────────────────────────────────────────

@router.post("/alert-rules", response_model=AlertRuleOut, status_code=201)
async def create_alert_rule(
    body: CreateAlertRuleRequest,
    project_id: str = Depends(resolve_project_id),
    conn: asyncpg.Connection = Depends(get_db),
) -> AlertRuleOut:
    row = await conn.fetchrow(
        """
        INSERT INTO alert_rules
            (project_id, name, metric, operator, threshold, window_min, severity, channel)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name, metric, operator, threshold, window_min,
                  severity, channel, status, enabled, last_triggered
        """,
        project_id,
        body.name,
        body.metric,
        body.operator,
        body.threshold,
        body.window,
        body.severity,
        body.channel,
    )
    return _rule_row_to_out(row)


# ─── Update ──────────────────────────────────────────────────────────────────

@router.patch("/alert-rules/{rule_id}", response_model=AlertRuleOut)
async def update_alert_rule(
    rule_id: str,
    body: UpdateAlertRuleRequest,
    project_id: str = Depends(resolve_project_id),
    conn: asyncpg.Connection = Depends(get_db),
) -> AlertRuleOut:
    existing = await conn.fetchrow(
        "SELECT id FROM alert_rules WHERE id = $1 AND project_id = $2",
        rule_id,
        project_id,
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Alert rule not found")

    updates = body.model_dump(exclude_none=True)
    if not updates:
        row = await conn.fetchrow(
            """
            SELECT id, name, metric, operator, threshold, window_min,
                   severity, channel, status, enabled, last_triggered
            FROM alert_rules WHERE id = $1
            """,
            rule_id,
        )
        return _rule_row_to_out(row)

    # Rename window → window_min for DB column
    if "window" in updates:
        updates["window_min"] = updates.pop("window")

    set_clauses = ", ".join(f"{col} = ${i + 2}" for i, col in enumerate(updates))
    values = list(updates.values())

    row = await conn.fetchrow(
        f"""
        UPDATE alert_rules
        SET {set_clauses}, updated_at = now()
        WHERE id = $1
        RETURNING id, name, metric, operator, threshold, window_min,
                  severity, channel, status, enabled, last_triggered
        """,
        rule_id,
        *values,
    )
    return _rule_row_to_out(row)


# ─── Delete ──────────────────────────────────────────────────────────────────

@router.delete("/alert-rules/{rule_id}", status_code=204, response_model=None, response_class=Response)
async def delete_alert_rule(
    rule_id: str,
    project_id: str = Depends(resolve_project_id),
    conn: asyncpg.Connection = Depends(get_db),
) -> Response:
    result = await conn.execute(
        "DELETE FROM alert_rules WHERE id = $1 AND project_id = $2",
        rule_id,
        project_id,
    )
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Alert rule not found")
    return Response(status_code=204)


# ─── History ─────────────────────────────────────────────────────────────────

def _duration_str(fired_at: datetime, resolved_at: datetime | None) -> str:
    if resolved_at is None:
        return "ongoing"
    delta = int((resolved_at - fired_at).total_seconds())
    if delta < 60:
        return f"{delta}s"
    return f"{delta // 60} min"


@router.get("/alert-history", response_model=list[AlertHistoryOut])
async def get_alert_history(
    project_id: str = Depends(resolve_project_id),
    conn: asyncpg.Connection = Depends(scoped_conn),
) -> list[AlertHistoryOut]:
    rows = await conn.fetch(
        """
        SELECT id, rule_name, fired_at, resolved_at, channel
        FROM alert_history
        WHERE project_id = $1
        ORDER BY fired_at DESC
        LIMIT 50
        """,
        project_id,
    )
    return [
        AlertHistoryOut(
            id=str(row["id"]),
            rule_name=row["rule_name"],
            fired_at=row["fired_at"].isoformat(),
            resolved_at=row["resolved_at"].isoformat() if row["resolved_at"] else None,
            channel=row["channel"],
            resolved=row["resolved_at"] is not None,
            duration=_duration_str(row["fired_at"], row["resolved_at"]),
        )
        for row in rows
    ]
