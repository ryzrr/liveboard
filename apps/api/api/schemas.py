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


# ─── Query responses ──────────────────────────────────────────────────────────

class TimeseriesPoint(BaseModel):
    time: str
    requests: float   # per-minute rate, normalized by bucket width — never a raw bucket count
    errors2xx: float
    errors4xx: float
    errors5xx: float
    p99: float


class EndpointStat(BaseModel):
    id: str
    method: str
    route: str
    requests24h: int
    error_rate: float
    p50: float
    p95: float
    p99: float
    last_called: str
    health_score: int


class IncidentOut(BaseModel):
    id: str
    severity: str
    title: str
    summary: str
    endpoint: str
    timestamp: str
    resolved: bool


class ServiceStatusOut(BaseModel):
    id: str
    name: str
    uptime90d: float
    current_status: str
    response_time: float
    uptime_bars: list[str]


# ─── Public status page ───────────────────────────────────────────────────────

class PublicStatusOut(BaseModel):
    project_name: str
    services: list[ServiceStatusOut]
    incidents: list[IncidentOut]


class SubscribeRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=254)

    @field_validator("email", mode="after")
    @classmethod
    def _basic_shape(cls, v: str) -> str:
        v = v.strip().lower()
        if "@" not in v or " " in v or v.startswith("@") or v.endswith("@"):
            raise ValueError("not a valid email address")
        return v


class SubscribeResponse(BaseModel):
    ok: bool


class SubscriptionStatusOut(BaseModel):
    ok: bool
    detail: str
