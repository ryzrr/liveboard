from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator


# ─── Ingest ──────────────────────────────────────────────────────────────────

class EventPayload(BaseModel):
    method: Literal["GET", "POST", "PUT", "DELETE", "PATCH"]
    route: str = Field(..., min_length=1, max_length=500)
    status_code: int = Field(..., ge=100, le=599)
    duration_ms: int = Field(..., ge=0)
    trace_id: Optional[str] = None
    user_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    error_msg: Optional[str] = Field(default=None, max_length=500)
    sdk_version: Optional[str] = Field(default=None, max_length=50)

    @field_validator("timestamp", mode="before")
    @classmethod
    def ensure_utc(cls, v: datetime) -> datetime:
        if isinstance(v, datetime) and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v


class IngestRequest(BaseModel):
    events: list[EventPayload] = Field(..., min_length=1, max_length=1000)


class IngestResponse(BaseModel):
    accepted: int
    message: str = "accepted"


# ─── Projects ────────────────────────────────────────────────────────────────

class CreateProjectRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class ProjectResponse(BaseModel):
    id: str
    name: str
    api_key: str
    created_at: datetime
