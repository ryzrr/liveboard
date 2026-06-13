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
    requests: int
    errors2xx: int
    errors4xx: int
    errors5xx: int
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


class SpanOut(BaseModel):
    id: str
    trace_id: str
    parent_id: Optional[str]
    service: str
    name: str
    start_time: int
    duration: int
    status: str
    tags: dict


class TraceOut(BaseModel):
    id: str
    root_span: str
    service: str
    endpoint: str
    total_duration: int
    timestamp: str
    status: str
    spans: list[SpanOut]


class ServiceStatusOut(BaseModel):
    id: str
    name: str
    uptime90d: float
    current_status: str
    response_time: float
    uptime_bars: list[str]


# ─── Alert rules ─────────────────────────────────────────────────────────────

class AlertRuleOut(BaseModel):
    id: str
    name: str
    metric: str
    operator: str
    threshold: float
    window: int
    severity: str
    channel: str
    status: str
    enabled: bool
    last_triggered: Optional[str]


class CreateAlertRuleRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    metric: str = Field(..., min_length=1, max_length=100)
    operator: Literal[">", "<", "=", "!="]
    threshold: float
    window: int = Field(..., ge=1, le=60)
    severity: Literal["critical", "warning", "info"] = "warning"
    channel: str = Field(default="", max_length=200)


class UpdateAlertRuleRequest(BaseModel):
    name: Optional[str] = None
    metric: Optional[str] = None
    operator: Optional[Literal[">", "<", "=", "!="]] = None
    threshold: Optional[float] = None
    window: Optional[int] = Field(default=None, ge=1, le=60)
    severity: Optional[Literal["critical", "warning", "info"]] = None
    channel: Optional[str] = None
    enabled: Optional[bool] = None


class AlertHistoryOut(BaseModel):
    id: str
    rule_name: str
    fired_at: str
    resolved_at: Optional[str]
    channel: str
    resolved: bool
    duration: str
