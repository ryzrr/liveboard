import asyncio
import logging
from contextlib import asynccontextmanager

import socketio
from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import alerts, ingest, internal, projects, query, spans
from core.database import close_pool, get_pool
from core.redis_client import close_redis
from realtime.pubsub import listen_pubsub
from realtime.socket_server import sio
from realtime.sse import router as sse_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


async def _run_migrations() -> None:
    def _upgrade():
        cfg = Config("alembic.ini")
        command.upgrade(cfg, "head")

    await asyncio.to_thread(_upgrade)
    logger.info("Database migrations up to date")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await _run_migrations()
    await get_pool()

    # Bridge: Redis pub/sub → Socket.io rooms
    pubsub_task = asyncio.create_task(listen_pubsub(), name="pubsub-listener")

    logger.info("LiveBoard Ingest API ready")
    yield

    pubsub_task.cancel()
    await close_pool()
    await close_redis()
    logger.info("LiveBoard Ingest API shutdown complete")


_fastapi = FastAPI(
    title="LiveBoard Ingest API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url=None,
)

from core.config import settings as _settings

_fastapi.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.cors_origin_list,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

_fastapi.include_router(ingest.router)
_fastapi.include_router(projects.router)
_fastapi.include_router(internal.router)
_fastapi.include_router(query.router)
_fastapi.include_router(alerts.router)
_fastapi.include_router(spans.router)
_fastapi.include_router(sse_router)


@_fastapi.get("/health", tags=["infra"])
async def health():
    return {"status": "ok", "version": "0.1.0"}


# Outer ASGI app — Socket.io handles /socket.io/* and passes everything
# else through to FastAPI. Uvicorn runs  main:app.
app = socketio.ASGIApp(sio, other_asgi_app=_fastapi, socketio_path="socket.io")
