from __future__ import annotations

import threading
from typing import Any

import httpx

_TIMEOUT = httpx.Timeout(5.0)


async def send_batch_async(ingest_url: str, api_key: str, events: list[dict[str, Any]]) -> None:
    """Fire-and-forget async POST. Silently drops all errors."""
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            await client.post(
                f"{ingest_url}/v1/ingest",
                json={"events": events},
                headers={"x-api-key": api_key},
            )
    except Exception:
        pass


def send_batch_sync(ingest_url: str, api_key: str, events: list[dict[str, Any]]) -> None:
    """Fire-and-forget sync POST in a daemon thread. Silently drops all errors."""

    def _worker() -> None:
        try:
            with httpx.Client(timeout=_TIMEOUT) as client:
                client.post(
                    f"{ingest_url}/v1/ingest",
                    json={"events": events},
                    headers={"x-api-key": api_key},
                )
        except Exception:
            pass

    t = threading.Thread(target=_worker, daemon=True)
    t.start()
