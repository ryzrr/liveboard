"""
LiveBoard Python SDK — zero-config API observability.

Quick start
-----------
FastAPI / Starlette (ASGI):
    from liveboard.asgi import LiveBoardMiddleware
    app.add_middleware(LiveBoardMiddleware, api_key="lb_live_...")

Django:
    # settings.py
    MIDDLEWARE = [..., "liveboard.django.LiveBoardMiddleware"]
    LIVEBOARD = {"API_KEY": "lb_live_..."}

Flask:
    from liveboard.flask import init_liveboard
    init_liveboard(app, api_key="lb_live_...")
"""

from ._version import SDK_VERSION
from ._config import LiveBoardConfig

__version__ = SDK_VERSION

__all__ = [
    "SDK_VERSION",
    "LiveBoardConfig",
    # Framework adapters are imported from their own submodules to avoid
    # pulling in framework-specific code when only one framework is installed:
    #   from liveboard.asgi   import LiveBoardMiddleware
    #   from liveboard.django import LiveBoardMiddleware
    #   from liveboard.flask  import init_liveboard
]
