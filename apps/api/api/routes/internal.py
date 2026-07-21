"""
Internal server-to-server endpoints for the Next.js dashboard (BFF).

Guarded by `authenticate_internal` (INTERNAL_SERVICE_TOKEN, or the master key
as a dev fallback). NEVER called from the browser.

Phase 8.2 — provisioning + access scope.
Phase 8.3 — self-serve project & API-key management (create / list / rotate /
delete), all authorized by org membership.
"""
from __future__ import annotations

import hashlib
import logging
import re
import secrets

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel

from api.deps import authenticate_internal, get_db, get_redis_dep
from realtime.tokens import mint_realtime_token

router = APIRouter(prefix="/v1/internal", tags=["internal"])
logger = logging.getLogger(__name__)


# ─── Schemas ─────────────────────────────────────────────────────────────────

class ProvisionRequest(BaseModel):
    email: str
    name: str | None = None


class CreateProjectRequest(BaseModel):
    email: str
    name: str


class EmailBody(BaseModel):
    email: str


class ProjectBrief(BaseModel):
    id: str
    name: str
    org_id: str


class ProjectDetail(BaseModel):
    id: str
    name: str
    org_id: str
    api_key_masked: str
    created_at: str
    status_page_enabled: bool
    public_slug: str | None


class ProvisionResponse(BaseModel):
    user_id: str
    org_id: str
    projects: list[ProjectBrief]
    new_api_key: str | None = None


class AccessResponse(BaseModel):
    user_id: str | None
    projects: list[ProjectBrief]


class CreatedProjectResponse(BaseModel):
    project: ProjectBrief
    new_api_key: str


class RotatedKeyResponse(BaseModel):
    project_id: str
    new_api_key: str


class StatusPageToggleRequest(BaseModel):
    email: str
    enabled: bool


class StatusPageSettingsResponse(BaseModel):
    enabled: bool
    public_slug: str | None


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _slugify(text: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return base or "workspace"


def _generate_api_key() -> tuple[str, str]:
    raw = f"lb_live_{secrets.token_urlsafe(32)}"
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    return raw, hashed


def _mask(prefix: str | None) -> str:
    return f"{prefix}{'•' * 20}" if prefix else "lb_live_" + "•" * 24


async def _ensure_user_and_org(
    db: asyncpg.Connection, email: str, name: str | None
) -> tuple[str, str]:
    """Upsert the user and guarantee they own a personal org. Returns (user_id, org_id)."""
    email = email.strip().lower()
    display = (name or email.split("@")[0]).strip()

    user = await db.fetchrow(
        """
        INSERT INTO users (email, name)
        VALUES ($1, $2)
        ON CONFLICT (email) DO UPDATE
            SET name = COALESCE(EXCLUDED.name, users.name)
        RETURNING id
        """,
        email,
        name,
    )
    user_id = user["id"]

    org = await db.fetchrow(
        """
        SELECT o.id
        FROM organizations o
        JOIN memberships m ON m.org_id = o.id
        WHERE m.user_id = $1 AND m.role = 'owner'
        ORDER BY o.created_at
        LIMIT 1
        """,
        user_id,
    )
    if org is None:
        slug = f"{_slugify(display)}-{secrets.token_hex(3)}"
        org = await db.fetchrow(
            "INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id",
            f"{display}'s workspace",
            slug,
        )
        await db.execute(
            "INSERT INTO memberships (org_id, user_id, role) VALUES ($1, $2, 'owner')",
            org["id"],
            user_id,
        )
    return str(user_id), str(org["id"])


async def _create_project(
    db: asyncpg.Connection, org_id: str, owner_id: str, name: str
) -> tuple[asyncpg.Record, str]:
    """Create a project + its first API key (stored in api_keys). Returns (row, raw_key)."""
    raw, hashed = _generate_api_key()
    proj = await db.fetchrow(
        """
        INSERT INTO projects (name, owner_id, org_id)
        VALUES ($1, $2::uuid, $3::uuid)
        RETURNING id, name, org_id
        """,
        name,
        owner_id,
        org_id,
    )
    await db.execute(
        "INSERT INTO api_keys (project_id, key_hash, name, prefix) VALUES ($1, $2, 'default', $3)",
        proj["id"],
        hashed,
        raw[:12],
    )
    return proj, raw


async def _require_member(db: asyncpg.Connection, email: str, project_id: str) -> str:
    """Ensure `email` belongs to the org owning `project_id`. Returns user_id or 403."""
    row = await db.fetchrow(
        """
        SELECT m.user_id
        FROM projects p
        JOIN memberships m ON m.org_id = p.org_id
        JOIN users u ON u.id = m.user_id
        WHERE p.id = $1::uuid AND u.email = $2
        """,
        project_id,
        email.strip().lower(),
    )
    if row is None:
        raise HTTPException(status_code=403, detail="Not a member of this project's organization")
    return str(row["user_id"])


# ─── Provisioning (Phase 8.2) ────────────────────────────────────────────────

@router.post("/provision", response_model=ProvisionResponse)
async def provision(
    body: ProvisionRequest,
    db: asyncpg.Connection = Depends(get_db),
    _: None = Depends(authenticate_internal),
) -> ProvisionResponse:
    """Idempotently ensure user + personal org + at least one project. Safe on every login."""
    async with db.transaction():
        user_id, org_id = await _ensure_user_and_org(db, body.email, body.name)
        rows = await db.fetch(
            "SELECT id, name, org_id FROM projects WHERE org_id = $1::uuid ORDER BY created_at",
            org_id,
        )
        new_key: str | None = None
        if not rows:
            proj, raw = await _create_project(db, org_id, user_id, "My API")
            new_key = raw
            rows = [proj]

    projects = [ProjectBrief(id=str(r["id"]), name=r["name"], org_id=str(r["org_id"])) for r in rows]
    logger.info("Provisioned user=%s org=%s projects=%d", body.email, org_id, len(projects))
    return ProvisionResponse(user_id=user_id, org_id=org_id, projects=projects, new_api_key=new_key)


@router.get("/access", response_model=AccessResponse)
async def access(
    email: str,
    db: asyncpg.Connection = Depends(get_db),
    _: None = Depends(authenticate_internal),
) -> AccessResponse:
    """Every project the user may read (membership scope) — the BFF's authz source of truth."""
    email = email.strip().lower()
    user = await db.fetchrow("SELECT id FROM users WHERE email = $1", email)
    if user is None:
        return AccessResponse(user_id=None, projects=[])
    rows = await db.fetch(
        """
        SELECT p.id, p.name, p.org_id
        FROM projects p
        JOIN memberships m ON m.org_id = p.org_id
        WHERE m.user_id = $1
        ORDER BY p.created_at
        """,
        user["id"],
    )
    return AccessResponse(
        user_id=str(user["id"]),
        projects=[ProjectBrief(id=str(r["id"]), name=r["name"], org_id=str(r["org_id"])) for r in rows],
    )


# ─── Project & key management (Phase 8.3) ────────────────────────────────────

@router.get("/projects", response_model=list[ProjectDetail])
async def list_projects(
    email: str,
    db: asyncpg.Connection = Depends(get_db),
    _: None = Depends(authenticate_internal),
) -> list[ProjectDetail]:
    """List the user's projects (across their orgs) with a masked key hint."""
    rows = await db.fetch(
        """
        SELECT p.id, p.name, p.org_id, p.created_at,
               p.status_page_enabled, p.public_slug,
               (SELECT k.prefix FROM api_keys k
                WHERE k.project_id = p.id AND k.revoked_at IS NULL
                ORDER BY k.created_at DESC LIMIT 1) AS prefix
        FROM projects p
        JOIN memberships m ON m.org_id = p.org_id
        JOIN users u ON u.id = m.user_id
        WHERE u.email = $1
        ORDER BY p.created_at
        """,
        email.strip().lower(),
    )
    return [
        ProjectDetail(
            id=str(r["id"]),
            name=r["name"],
            org_id=str(r["org_id"]),
            api_key_masked=_mask(r["prefix"]),
            created_at=r["created_at"].isoformat() if r["created_at"] else "",
            status_page_enabled=r["status_page_enabled"],
            public_slug=r["public_slug"],
        )
        for r in rows
    ]


@router.post("/projects", response_model=CreatedProjectResponse, status_code=201)
async def create_project(
    body: CreateProjectRequest,
    db: asyncpg.Connection = Depends(get_db),
    _: None = Depends(authenticate_internal),
) -> CreatedProjectResponse:
    """Create a project in the user's personal org and mint its first key (shown once)."""
    name = body.name.strip()
    if len(name) < 2:
        raise HTTPException(status_code=422, detail="Project name must be at least 2 characters")
    async with db.transaction():
        user_id, org_id = await _ensure_user_and_org(db, body.email, None)
        proj, raw = await _create_project(db, org_id, user_id, name)
    return CreatedProjectResponse(
        project=ProjectBrief(id=str(proj["id"]), name=proj["name"], org_id=str(proj["org_id"])),
        new_api_key=raw,
    )


@router.post("/projects/{project_id}/rotate", response_model=RotatedKeyResponse)
async def rotate_key(
    project_id: str,
    body: EmailBody,
    db: asyncpg.Connection = Depends(get_db),
    _: None = Depends(authenticate_internal),
) -> RotatedKeyResponse:
    """Revoke the project's active keys and mint a fresh one (shown once)."""
    await _require_member(db, body.email, project_id)
    raw, hashed = _generate_api_key()
    async with db.transaction():
        await db.execute(
            "UPDATE api_keys SET revoked_at = now() WHERE project_id = $1::uuid AND revoked_at IS NULL",
            project_id,
        )
        await db.execute(
            "INSERT INTO api_keys (project_id, key_hash, name, prefix) VALUES ($1::uuid, $2, 'default', $3)",
            project_id,
            hashed,
            raw[:12],
        )
        # keep the legacy column in sync (nullable) so old fallback never wins with a stale key
        await db.execute("UPDATE projects SET api_key = NULL WHERE id = $1::uuid", project_id)
    return RotatedKeyResponse(project_id=project_id, new_api_key=raw)


async def _generate_public_slug(db: asyncpg.Connection, name: str) -> str:
    """A `_slugify(name)` base is not unique enough on its own — every new
    signup defaults to a project named 'My API' (see _create_project below),
    so append a short random suffix and retry on the rare collision."""
    base = _slugify(name)
    for _ in range(5):
        candidate = f"{base}-{secrets.token_urlsafe(4).lower().rstrip('=-_')}"
        exists = await db.fetchval("SELECT 1 FROM projects WHERE public_slug = $1", candidate)
        if not exists:
            return candidate
    raise HTTPException(status_code=500, detail="Could not generate a unique status page slug")


@router.patch("/projects/{project_id}/status-page", response_model=StatusPageSettingsResponse)
async def set_status_page(
    project_id: str,
    body: StatusPageToggleRequest,
    db: asyncpg.Connection = Depends(get_db),
    _: None = Depends(authenticate_internal),
) -> StatusPageSettingsResponse:
    """
    Enable/disable the public status page for a project. Enabling mints a
    public_slug the first time only — disabling keeps it, so re-enabling
    restores the same /status/{slug} link.
    """
    await _require_member(db, body.email, project_id)

    if body.enabled:
        row = await db.fetchrow(
            "SELECT name, public_slug FROM projects WHERE id = $1::uuid", project_id
        )
        if row is None:
            raise HTTPException(status_code=404, detail="Project not found")
        slug = row["public_slug"] or await _generate_public_slug(db, row["name"])
        await db.execute(
            "UPDATE projects SET status_page_enabled = TRUE, public_slug = $2 WHERE id = $1::uuid",
            project_id,
            slug,
        )
        return StatusPageSettingsResponse(enabled=True, public_slug=slug)

    row = await db.fetchrow(
        """
        UPDATE projects SET status_page_enabled = FALSE
        WHERE id = $1::uuid
        RETURNING public_slug
        """,
        project_id,
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return StatusPageSettingsResponse(enabled=False, public_slug=row["public_slug"])


class RealtimeTokenRequest(BaseModel):
    project_id: str


class RealtimeTokenResponse(BaseModel):
    token: str
    expires_in: int


@router.post("/realtime-token", response_model=RealtimeTokenResponse)
async def realtime_token(
    body: RealtimeTokenRequest,
    redis=Depends(get_redis_dep),
    _: None = Depends(authenticate_internal),
) -> RealtimeTokenResponse:
    """Mint a short-lived, project-scoped token for the browser's realtime connections."""
    token, ttl = await mint_realtime_token(redis, body.project_id)
    return RealtimeTokenResponse(token=token, expires_in=ttl)


@router.delete("/projects/{project_id}", status_code=204, response_model=None, response_class=Response)
async def delete_project(
    project_id: str,
    email: str,
    db: asyncpg.Connection = Depends(get_db),
    _: None = Depends(authenticate_internal),
) -> Response:
    """Delete a project (cascades its api_keys). Caller must be an org member."""
    await _require_member(db, email, project_id)
    await db.execute("DELETE FROM projects WHERE id = $1::uuid", project_id)
    return Response(status_code=204)
