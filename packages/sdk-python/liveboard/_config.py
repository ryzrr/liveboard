from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Callable, Optional, Union

RoutePattern = Union[str, "re.Pattern[str]"]


@dataclass
class LiveBoardConfig:
    api_key: str
    ingest_url: str = "http://localhost:8000"
    sample_rate: float = 1.0
    ignore_routes: list[RoutePattern] = field(
        default_factory=lambda: ["/health", "/healthz", "/ping", "/favicon.ico"]
    )
    # None → falls back to JWT sub-claim extraction
    get_user_id: Optional[Callable[..., Optional[str]]] = None
    flush_interval: float = 0.5
    batch_size: int = 100

    def __post_init__(self) -> None:
        if not self.api_key or not isinstance(self.api_key, str):
            raise ValueError("[liveboard] api_key is required")
        if not 0.0 <= self.sample_rate <= 1.0:
            raise ValueError("[liveboard] sample_rate must be between 0 and 1")
        self.ingest_url = self.ingest_url.rstrip("/")
