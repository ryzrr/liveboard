"""
LiveBoard Python SDK — zero-config API observability.

Quick start
-----------
FastAPI / Starlette (ASGI):
    from liveboard.asgi import LiveBoardMiddleware
    app.add_middleware(LiveBoardMiddleware, api_key="lb_live_...")
"""

from ._version import SDK_VERSION
from ._config import LiveBoardConfig

__version__ = SDK_VERSION

__all__ = [
    "SDK_VERSION",
    "LiveBoardConfig",
    # The ASGI adapter lives in its own submodule so importing this package
    # never pulls in framework-specific code:
    #   from liveboard.asgi import LiveBoardMiddleware
]
