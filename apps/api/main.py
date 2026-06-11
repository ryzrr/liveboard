import asyncio
import logging
from contextlib import asynccontextmanager

from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import ingest, projects
from core.database import close_pool, get_pool
from core.redis_client import close_redis

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


async def _run_migrations() -> None:
    """Run alembic migrations synchronously in a thread — runs once at startup."""
    def _upgrade():
        cfg = Config("alembic.ini")
        command.upgrade(cfg, "head")

    await asyncio.to_thread(_upgrade)
    logger.info("Database migrations up to date")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await _run_migrations()
    await get_pool()
    logger.info("LiveBoard Ingest API ready")
    yield
    await close_pool()
    await close_redis()
    logger.info("LiveBoard Ingest API shutdown complete")


app = FastAPI(
    title="LiveBoard Ingest API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(ingest.router)
app.include_router(projects.router)


@app.get("/health", tags=["infra"])
async def health():
    return {"status": "ok", "version": "0.1.0"}
