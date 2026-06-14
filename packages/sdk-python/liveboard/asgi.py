"""
ASGI middleware for FastAPI and Starlette.

Usage:
    from liveboard.asgi import LiveBoardMiddleware

    app.add_middleware(LiveBoardMiddleware, api_key="lb_live_...")
"""
from __future__ import annotations

import random
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Optional

from ._buffer import AsyncEventBuffer
from ._config import LiveBoardConfig
from ._normalise import extract_user_id, normalise_url, route_from_path_params
from ._version import SDK_VERSION

# ASGI type aliases
Scope = dict[str, Any]
Receive = Callable[[], Any]
Send = Callable[[dict[str, Any]], Any]


class LiveBoardMiddleware:
    """
    Pure ASGI middleware — works with FastAPI, Starlette, and any ASGI framework.

    Constructor keyword arguments mirror LiveBoardConfig fields:
        api_key        (required)
        ingest_url     default: http://localhost:8000
        sample_rate    default: 1.0
        ignore_routes  default: ['/health', '/healthz', '/ping', '/favicon.ico']
        get_user_id    default: JWT sub-claim extraction
        flush_interval default: 0.5s
        batch_size     default: 100
    """

    def __init__(self, app: Any, *, api_key: str, **kwargs: Any) -> None:
        self._app = app
        self._config = LiveBoardConfig(api_key=api_key, **kwargs)
        self._buffer = AsyncEventBuffer(
            self._config.ingest_url,
            self._config.api_key,
            self._config.batch_size,
            self._config.flush_interval,
        )

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "lifespan":
            await self._handle_lifespan(scope, receive, send)
            return

        if scope["type"] != "http":
            await self._app(scope, receive, send)
            return

        # Apply sample rate before touching anything
        if self._config.sample_rate < 1.0 and random.random() >= self._config.sample_rate:
            await self._app(scope, receive, send)
            return

        start_ns = time.perf_counter_ns()
        # Propagate incoming trace ID from upstream service, or start a new trace
        incoming_headers = {k.decode(): v.decode() for k, v in scope.get("headers", [])}
        trace_id = incoming_headers.get("x-trace-id") or str(uuid.uuid4())
        status_holder: list[int] = [200]

        async def send_wrapper(message: dict[str, Any]) -> None:
            if message["type"] == "http.response.start":
                status_holder[0] = message.get("status", 200)
                # Inject x-trace-id into response headers
                headers = list(message.get("headers", []))
                headers.append((b"x-trace-id", trace_id.encode()))
                message = {**message, "headers": headers}
            await send(message)

        await self._app(scope, receive, send_wrapper)

        duration_ms = int((time.perf_counter_ns() - start_ns) / 1_000_000)

        # Route — Starlette/FastAPI populate path_params in scope after routing
        path: str = scope.get("path", "/")
        path_params: dict[str, str] = {
            k: str(v) for k, v in scope.get("path_params", {}).items()
        }
        route = (
            route_from_path_params(path, path_params) if path_params
            else normalise_url(path)
        )

        if self._should_ignore(route, path):
            return

        # Decode headers dict (ASGI headers are bytes tuples)
        raw_headers: dict[str, str] = {
            k.decode(): v.decode()
            for k, v in scope.get("headers", [])
        }

        user_id: Optional[str] = (
            self._config.get_user_id(scope)
            if self._config.get_user_id
            else extract_user_id(raw_headers.get("authorization"))
        )

        await self._buffer.add({
            "method": scope.get("method", "GET").upper(),
            "route": route,
            "status_code": status_holder[0],
            "duration_ms": duration_ms,
            "trace_id": trace_id,
            "user_id": user_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "error_msg": None,
            "sdk_version": SDK_VERSION,
        })

    async def _handle_lifespan(self, scope: Scope, receive: Receive, send: Send) -> None:
        """Flush the buffer on ASGI lifespan shutdown."""

        async def _send_wrapper(message: dict[str, Any]) -> None:
            if message["type"] == "lifespan.shutdown.complete":
                await self._buffer.flush_and_close()
            await send(message)

        await self._app(scope, receive, _send_wrapper)

    def _should_ignore(self, route: str, path: str) -> bool:
        for pattern in self._config.ignore_routes:
            if isinstance(pattern, str):
                if pattern == route or pattern == path:
                    return True
            else:
                if pattern.search(route) or pattern.search(path):
                    return True
        return False
