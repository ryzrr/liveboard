"""
Public, unauthenticated status-page surface.

Deliberately outside the resolve_project_id / scoped_conn read plane used by
the rest of api/routes/*.py — there is no signed-in caller here, only a
project's own public_slug. A project only becomes reachable through this
router once its owner flips status_page_enabled on (see
api.routes.internal.set_status_page).
"""
from __future__ import annotations

import logging
import secrets
from datetime import datetime, timedelta, timezone

import asyncpg
from fastapi import APIRouter, Depends, HTTPException

from api.deps import get_db
from api.schemas import (
    PublicStatusOut,
    SubscribeRequest,
    SubscribeResponse,
    SubscriptionStatusOut,
)
from api.routes.query import fetch_incidents, fetch_services
from core.config import settings
from core.email import confirmation_email, send

router = APIRouter(prefix="/v1/public", tags=["public-status"])
logger = logging.getLogger(__name__)

_RESEND_COOLDOWN = timedelta(seconds=60)


async def _resolve_public_project(conn: asyncpg.Connection, slug: str) -> asyncpg.Record:
    row = await conn.fetchrow(
        "SELECT id, name FROM projects WHERE public_slug = $1 AND status_page_enabled = TRUE",
        slug,
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Status page not found")
    return row


@router.get("/status/{slug}", response_model=PublicStatusOut)
async def public_status(
    slug: str,
    conn: asyncpg.Connection = Depends(get_db),
) -> PublicStatusOut:
    project = await _resolve_public_project(conn, slug)
    project_id = str(project["id"])
    services = await fetch_services(conn, project_id)
    incidents = await fetch_incidents(conn, project_id)
    return PublicStatusOut(project_name=project["name"], services=services, incidents=incidents)


@router.post("/status/{slug}/subscribe", response_model=SubscribeResponse)
async def subscribe(
    slug: str,
    body: SubscribeRequest,
    conn: asyncpg.Connection = Depends(get_db),
) -> SubscribeResponse:
    """
    Double opt-in: creates/refreshes an unconfirmed row and emails a confirm
    link. Never reveals whether the address was already subscribed — always
    returns {ok: true} — so this can't be used to enumerate subscribers.
    """
    project = await _resolve_public_project(conn, slug)

    existing = await conn.fetchrow(
        "SELECT confirmed_at, unsubscribed_at, created_at "
        "FROM status_subscribers WHERE project_id = $1 AND email = $2",
        project["id"],
        body.email,
    )
    already_active = bool(existing and existing["confirmed_at"] and not existing["unsubscribed_at"])
    recently_issued = bool(
        existing
        and existing["confirmed_at"] is None
        and (datetime.now(timezone.utc) - existing["created_at"]) < _RESEND_COOLDOWN
    )
    if already_active or recently_issued:
        return SubscribeResponse(ok=True)

    token = secrets.token_urlsafe(24)
    await conn.execute(
        """
        INSERT INTO status_subscribers (project_id, email, confirm_token)
        VALUES ($1, $2, $3)
        ON CONFLICT (project_id, email) DO UPDATE
            SET confirm_token = $3, confirmed_at = NULL, unsubscribed_at = NULL, created_at = now()
        """,
        project["id"],
        body.email,
        token,
    )

    confirm_url = f"{settings.public_app_url}/status/confirm/{token}"
    subject, html = confirmation_email(confirm_url)
    ok, detail = await send(body.email, subject, html)
    if not ok:
        logger.warning("Confirmation email to subscriber failed: %s", detail)
    return SubscribeResponse(ok=True)


@router.get("/status/subscriptions/{token}/confirm", response_model=SubscriptionStatusOut)
async def confirm_subscription(
    token: str,
    conn: asyncpg.Connection = Depends(get_db),
) -> SubscriptionStatusOut:
    row = await conn.fetchrow(
        """
        UPDATE status_subscribers SET confirmed_at = now()
        WHERE confirm_token = $1 AND unsubscribed_at IS NULL
        RETURNING email
        """,
        token,
    )
    if row is None:
        return SubscriptionStatusOut(ok=False, detail="This confirmation link is invalid or expired.")
    return SubscriptionStatusOut(ok=True, detail=f"Subscribed — you'll get incident alerts at {row['email']}.")


@router.get("/status/subscriptions/{token}/unsubscribe", response_model=SubscriptionStatusOut)
async def unsubscribe(
    token: str,
    conn: asyncpg.Connection = Depends(get_db),
) -> SubscriptionStatusOut:
    row = await conn.fetchrow(
        """
        UPDATE status_subscribers SET unsubscribed_at = now()
        WHERE confirm_token = $1
        RETURNING email
        """,
        token,
    )
    if row is None:
        return SubscriptionStatusOut(ok=False, detail="This unsubscribe link is invalid.")
    return SubscriptionStatusOut(ok=True, detail=f"Unsubscribed {row['email']}.")
