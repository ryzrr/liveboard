"""
Status-page subscriber email — confirmation + incident-alert messages, sent
via the Resend HTTP API (no SDK, same style as core/notify.deliver).

Returns (ok, detail) and never raises — a delivery failure must not crash the
subscribe endpoint or the anomaly evaluation loop.
"""
from __future__ import annotations

import logging

import httpx

from core.config import settings

logger = logging.getLogger(__name__)

_TIMEOUT = 8.0
_RESEND_URL = "https://api.resend.com/emails"


async def send(to: str, subject: str, html: str) -> tuple[bool, str]:
    api_key = settings.resend_api_key.get_secret_value()
    if not api_key:
        logger.warning("RESEND_API_KEY not set — skipping email to %s (%s)", to, subject)
        return False, "email not configured"

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            r = await client.post(
                _RESEND_URL,
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "from": settings.email_from,
                    "to": [to],
                    "subject": subject,
                    "html": html,
                },
            )
        ok = 200 <= r.status_code < 300
        if not ok:
            logger.warning("Email to %s failed: HTTP %s", to, r.status_code)
        return ok, f"HTTP {r.status_code}"
    except Exception as exc:  # network / timeout
        logger.warning("Email to %s errored: %s", to, exc)
        return False, str(exc)[:160]


def confirmation_email(confirm_url: str) -> tuple[str, str]:
    subject = "Confirm your Liveboard status alerts"
    html = (
        "<p>Click below to confirm you'd like incident alerts for this status page.</p>"
        f'<p><a href="{confirm_url}">Confirm subscription</a></p>'
        "<p style=\"color:#888;font-size:12px\">If you didn't request this, ignore this email.</p>"
    )
    return subject, html


def incident_email(title: str, summary: str, status_url: str, unsubscribe_url: str) -> tuple[str, str]:
    subject = f"Incident: {title}"
    html = (
        f"<p><strong>{title}</strong></p>"
        f"<p>{summary}</p>"
        f'<p><a href="{status_url}">View status page</a></p>'
        f'<p style="color:#888;font-size:12px"><a href="{unsubscribe_url}">Unsubscribe</a></p>'
    )
    return subject, html
