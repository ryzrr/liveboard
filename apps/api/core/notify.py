"""
Alert notification delivery — real HTTP POST to the configured channel.

Slack / Discord / generic webhooks are just JSON POSTs to an incoming-webhook
URL. PagerDuty uses its Events API v2 (webhook_url holds the routing key).
Returns (ok, detail) and never raises — a delivery failure must not crash the
evaluation loop.
"""
from __future__ import annotations

import logging

import httpx

logger = logging.getLogger(__name__)

_TIMEOUT = 8.0


async def deliver(
    channel_type: str,
    webhook_url: str | None,
    *,
    title: str,
    summary: str,
    severity: str,
) -> tuple[bool, str]:
    if not webhook_url:
        return False, "no webhook url configured"

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            if channel_type == "slack":
                r = await client.post(webhook_url, json={"text": f":rotating_light: *{title}*\n{summary}"})
            elif channel_type == "discord":
                r = await client.post(webhook_url, json={"content": f"🚨 **{title}**\n{summary}"})
            elif channel_type == "pagerduty":
                r = await client.post(
                    "https://events.pagerduty.com/v2/enqueue",
                    json={
                        "routing_key": webhook_url,
                        "event_action": "trigger",
                        "payload": {
                            "summary": f"{title} — {summary}"[:1024],
                            "severity": "critical" if severity == "critical" else "warning",
                            "source": "liveboard",
                        },
                    },
                )
            else:  # generic webhook
                r = await client.post(
                    webhook_url,
                    json={"title": title, "summary": summary, "severity": severity, "source": "liveboard"},
                )

        ok = 200 <= r.status_code < 300
        if not ok:
            logger.warning("Delivery to %s failed: HTTP %s", channel_type, r.status_code)
        return ok, f"HTTP {r.status_code}"
    except Exception as exc:  # network / timeout / bad url
        logger.warning("Delivery to %s errored: %s", channel_type, exc)
        return False, str(exc)[:160]
