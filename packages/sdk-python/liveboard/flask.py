"""
Flask extension for LiveBoard observability.

Usage:
    from liveboard.flask import init_liveboard

    app = Flask(__name__)
    init_liveboard(app, api_key="lb_live_...")
"""
from __future__ import annotations

import random
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from ._buffer import SyncEventBuffer
from ._config import LiveBoardConfig
from ._normalise import extract_user_id, normalise_flask_rule, normalise_url
from ._version import SDK_VERSION

# Flask request context globals — imported lazily to avoid a hard dep at module load
_flask_g: Any = None
_flask_request: Any = None


def _get_flask_globals() -> tuple[Any, Any]:
    global _flask_g, _flask_request
    if _flask_g is None:
        from flask import g, request  # type: ignore[import-untyped]
        _flask_g = g
        _flask_request = request
    return _flask_g, _flask_request


def init_liveboard(app: Any, *, api_key: str, **kwargs: Any) -> None:
    """
    Register LiveBoard hooks on a Flask application.

    All keyword arguments map 1-to-1 to LiveBoardConfig fields:
        ingest_url     default: http://localhost:8000
        sample_rate    default: 1.0
        ignore_routes  default: ['/health', '/healthz', '/ping', '/favicon.ico']
        get_user_id    default: JWT sub-claim extraction
        flush_interval default: 0.5s
        batch_size     default: 100
    """
    config = LiveBoardConfig(api_key=api_key, **kwargs)
    buffer = SyncEventBuffer(
        config.ingest_url,
        config.api_key,
        config.batch_size,
        config.flush_interval,
    )

    @app.before_request
    def _before() -> None:
        g, _ = _get_flask_globals()
        g._lb_skip = (
            config.sample_rate < 1.0 and random.random() >= config.sample_rate
        )
        if not g._lb_skip:
            g._lb_start_ns = time.perf_counter_ns()
            g._lb_trace_id = str(uuid.uuid4())

    @app.after_request
    def _after(response: Any) -> Any:
        g, request = _get_flask_globals()

        if getattr(g, "_lb_skip", True):
            return response

        duration_ms = int(
            (time.perf_counter_ns() - g._lb_start_ns) / 1_000_000
        )
        trace_id: str = g._lb_trace_id

        route = _get_flask_route(request)

        if _should_ignore(route, request.path, config):
            return response

        user_id: Optional[str] = (
            config.get_user_id(request)
            if config.get_user_id
            else extract_user_id(request.headers.get("Authorization"))
        )

        response.headers["X-Trace-Id"] = trace_id

        buffer.add({
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


def _get_flask_route(request: Any) -> str:
    """Prefer Flask's matched URL rule; fall back to regex normalisation."""
    rule = getattr(request, "url_rule", None)
    if rule is not None:
        return normalise_flask_rule(str(rule))
    return normalise_url(request.path)


def _should_ignore(route: str, path: str, config: LiveBoardConfig) -> bool:
    for pattern in config.ignore_routes:
        if isinstance(pattern, str):
            if pattern == route or pattern == path:
                return True
        else:
            if pattern.search(route) or pattern.search(path):
                return True
    return False
