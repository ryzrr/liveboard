"""
Django middleware for LiveBoard observability.

Usage — settings.py:

    MIDDLEWARE = [
        ...
        "liveboard.django.LiveBoardMiddleware",
    ]

    LIVEBOARD = {
        "API_KEY": "lb_live_...",          # required
        "INGEST_URL": "http://localhost:8000",
        "SAMPLE_RATE": 1.0,
        "IGNORE_ROUTES": ["/health", "/healthz", "/ping", "/favicon.ico"],
        "FLUSH_INTERVAL": 0.5,
        "BATCH_SIZE": 100,
    }
"""
from __future__ import annotations

import random
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Optional

from ._buffer import SyncEventBuffer
from ._config import LiveBoardConfig
from ._normalise import extract_user_id, normalise_django_pattern, normalise_url
from ._version import SDK_VERSION


def _load_config() -> LiveBoardConfig:
    """Read LIVEBOARD dict from Django settings at first request."""
    from django.conf import settings  # type: ignore[import-untyped]

    cfg: dict[str, Any] = getattr(settings, "LIVEBOARD", {})
    api_key: str = cfg.get("API_KEY", "")
    return LiveBoardConfig(
        api_key=api_key,
        ingest_url=cfg.get("INGEST_URL", "http://localhost:8000"),
        sample_rate=float(cfg.get("SAMPLE_RATE", 1.0)),
        ignore_routes=cfg.get(
            "IGNORE_ROUTES", ["/health", "/healthz", "/ping", "/favicon.ico"]
        ),
        flush_interval=float(cfg.get("FLUSH_INTERVAL", 0.5)),
        batch_size=int(cfg.get("BATCH_SIZE", 100)),
    )


class LiveBoardMiddleware:
    """
    Sync Django middleware. Add to MIDDLEWARE in settings.py.
    Config is read from the LIVEBOARD dict in settings.
    """

    def __init__(self, get_response: Callable) -> None:
        self._get_response = get_response
        self._config: Optional[LiveBoardConfig] = None
        self._buffer: Optional[SyncEventBuffer] = None

    def _ensure_init(self) -> None:
        if self._config is None:
            self._config = _load_config()
            self._buffer = SyncEventBuffer(
                self._config.ingest_url,
                self._config.api_key,
                self._config.batch_size,
                self._config.flush_interval,
            )

    def __call__(self, request: Any) -> Any:
        self._ensure_init()
        assert self._config is not None
        assert self._buffer is not None

        if self._config.sample_rate < 1.0 and random.random() >= self._config.sample_rate:
            return self._get_response(request)

        start_ns = time.perf_counter_ns()
        # Propagate incoming trace ID from upstream service, or start a new trace
        # Django exposes headers as HTTP_X_TRACE_ID in request.META
        trace_id = request.META.get("HTTP_X_TRACE_ID") or str(uuid.uuid4())

        response = self._get_response(request)

        duration_ms = int((time.perf_counter_ns() - start_ns) / 1_000_000)

        # Django sets resolver_match after URL resolution (inside get_response)
        route = self._get_route(request)

        if self._should_ignore(route, request.path):
            return response

        user_id: Optional[str] = (
            self._config.get_user_id(request)
            if self._config.get_user_id
            else extract_user_id(request.META.get("HTTP_AUTHORIZATION"))
        )

        # Inject trace ID header
        response["X-Trace-Id"] = trace_id

        self._buffer.add({
            "method": request.method.upper(),
            "route": route,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
            "trace_id": trace_id,
            "user_id": user_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "error_msg": None,
            "sdk_version": SDK_VERSION,
        })

        return response

    def _get_route(self, request: Any) -> str:
        resolver_match = getattr(request, "resolver_match", None)
        if resolver_match and hasattr(resolver_match, "route") and resolver_match.route:
            return normalise_django_pattern(resolver_match.route)
        return normalise_url(request.path)

    def _should_ignore(self, route: str, path: str) -> bool:
        assert self._config is not None
        for pattern in self._config.ignore_routes:
            if isinstance(pattern, str):
                if pattern == route or pattern == path:
                    return True
            else:
                if pattern.search(route) or pattern.search(path):
                    return True
        return False
