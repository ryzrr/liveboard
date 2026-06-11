"""LiveBoard Python SDK — implementations added in Phase 2b."""

__version__ = "0.1.0"

# Middleware classes are stubbed here; full implementations come in Phase 2b.


class LiveBoardMiddleware:
    """ASGI middleware for FastAPI / Starlette. Implemented in Phase 2b."""

    def __init__(self, app, *, api_key: str, **kwargs):
        raise NotImplementedError("ASGI middleware coming in Phase 2b")


def init_liveboard(app, *, api_key: str, **kwargs):
    """Flask integration. Implemented in Phase 2b."""
    raise NotImplementedError("Flask integration coming in Phase 2b")
