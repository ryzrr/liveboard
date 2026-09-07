from __future__ import annotations

import asyncio
from typing import Any, Optional

from ._client import send_batch_async


class AsyncEventBuffer:
    """
    Non-blocking event buffer for ASGI frameworks (FastAPI / Starlette).

    Uses a background asyncio task that flushes every `flush_interval` seconds.
    List operations are safe without an explicit lock because CPython's GIL
    makes list.append() and list slice-assign atomic.
    """

    def __init__(
        self,
        ingest_url: str,
        api_key: str,
        batch_size: int = 100,
        flush_interval: float = 0.5,
    ) -> None:
        self._ingest_url = ingest_url
        self._api_key = api_key
        self._batch_size = batch_size
        self._flush_interval = flush_interval
        self._queue: list[dict[str, Any]] = []
        self._task: Optional[asyncio.Task] = None  # type: ignore[type-arg]

    def _ensure_running(self) -> None:
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            return
        if self._task is None or self._task.done():
            self._task = loop.create_task(self._flush_loop())

    async def add(self, event: dict[str, Any]) -> None:
        self._ensure_running()
        self._queue.append(event)
        if len(self._queue) >= self._batch_size:
            await self._drain()

    async def _drain(self) -> None:
        if not self._queue:
            return
        # Atomic swap — takes the current queue, replaces it with empty list
        batch, self._queue = self._queue, []
        asyncio.create_task(send_batch_async(self._ingest_url, self._api_key, batch))

    async def _flush_loop(self) -> None:
        while True:
            await asyncio.sleep(self._flush_interval)
            await self._drain()

    async def flush_and_close(self) -> None:
        """Drain remaining events on app shutdown."""
        if self._task and not self._task.done():
            self._task.cancel()
        if self._queue:
            batch, self._queue = self._queue, []
            await send_batch_async(self._ingest_url, self._api_key, batch)
