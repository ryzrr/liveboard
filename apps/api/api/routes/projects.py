import hashlib
import secrets
import logging
from datetime import timezone

from fastapi import APIRouter, Depends
import asyncpg

from api.deps import authenticate_admin, get_db
from api.schemas import CreateProjectRequest, ProjectResponse

router = APIRouter(prefix="/v1", tags=["projects"])
logger = logging.getLogger(__name__)


def _generate_api_key() -> tuple[str, str]:
    """Return (raw_key, sha256_hash). Store hash, give raw to caller once."""
    raw = f"lb_live_{secrets.token_urlsafe(32)}"
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    return raw, hashed


@router.post("/projects", status_code=201, response_model=ProjectResponse)
async def create_project(
    body: CreateProjectRequest,
    db: asyncpg.Connection = Depends(get_db),
    _: None = Depends(authenticate_admin),
) -> ProjectResponse:
    """
    Create a new project and return its API key.
    Requires x-master-key header matching API_SECRET_KEY.
    The api_key is shown only once — store it immediately.
    """
    raw_key, hashed_key = _generate_api_key()

    row = await db.fetchrow(
        """
        INSERT INTO projects (name, api_key)
        VALUES ($1, $2)
        RETURNING id, name, created_at
        """,
        body.name,
        hashed_key,
    )

    logger.info("Created project '%s' (id=%s)", body.name, row["id"])
    return ProjectResponse(
        id=str(row["id"]),
        name=row["name"],
        api_key=raw_key,
        created_at=row["created_at"].replace(tzinfo=timezone.utc),
    )
