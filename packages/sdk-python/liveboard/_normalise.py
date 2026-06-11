from __future__ import annotations

import base64
import json
import re
from typing import Optional

_UUID = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I
)
_OBJECT_ID = re.compile(r"^[0-9a-f]{24}$", re.I)
_INTEGER = re.compile(r"^\d+$")
_MIXED_ID = re.compile(r"^[a-zA-Z0-9_-]{6,}$")

# Django: <int:pk> or <slug> → :pk / :slug
_DJANGO_PARAM = re.compile(r"<(?:[^:>]+:)?([^>]+)>")
# Flask: <int:user_id> or <user_id> → :user_id
_FLASK_PARAM = re.compile(r"<(?:[^:>]+:)?([^>]+)>")


def _is_id_segment(segment: str) -> bool:
    if _INTEGER.match(segment):
        return True
    if _UUID.match(segment):
        return True
    if _OBJECT_ID.match(segment):
        return True
    # Mixed alphanumeric IDs must contain at least one digit to avoid
    # false-positives on plain words like "users" or "posts"
    if _MIXED_ID.match(segment) and any(c.isdigit() for c in segment):
        return True
    return False


def normalise_url(raw_url: str) -> str:
    """Regex fallback: /users/12345/posts/abc123f → /users/:id/posts/:id"""
    path = raw_url.split("?")[0]
    return "/".join(
        ":id" if seg and _is_id_segment(seg) else seg for seg in path.split("/")
    )


def route_from_path_params(path: str, path_params: dict[str, str]) -> str:
    """
    Reconstruct route template from FastAPI/Starlette path + path_params.
    e.g. path=/users/42, path_params={"user_id": "42"} → /users/{user_id}
    """
    route = path
    # Longest values first to avoid partial replacements
    for key, value in sorted(path_params.items(), key=lambda kv: -len(str(kv[1]))):
        route = route.replace(f"/{value}", f"/{{{key}}}", 1)
    return route


def normalise_django_pattern(pattern: str) -> str:
    """
    Convert a Django URL pattern to a normalised route.
    users/<int:user_id>/posts/<slug:post_slug>/ → /users/:user_id/posts/:post_slug
    """
    route = pattern.rstrip("/")
    route = _DJANGO_PARAM.sub(lambda m: f":{m.group(1)}", route)
    # Catch any remaining raw regex groups
    route = re.sub(r"\([^)]+\)", ":id", route)
    return route if route.startswith("/") else f"/{route}"


def normalise_flask_rule(rule: str) -> str:
    """
    Convert a Flask URL rule to a normalised route.
    /users/<int:user_id> → /users/:user_id
    """
    return _FLASK_PARAM.sub(lambda m: f":{m.group(1)}", rule)


def extract_user_id(authorization: Optional[str]) -> Optional[str]:
    """
    Extract the `sub` claim from a Bearer JWT without verifying the signature.
    Returns None silently on any parse failure.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[7:]
    parts = token.split(".")
    if len(parts) != 3:
        return None
    try:
        # Restore base64url padding
        segment = parts[1]
        padding = 4 - len(segment) % 4
        if padding != 4:
            segment += "=" * padding
        payload: dict = json.loads(base64.urlsafe_b64decode(segment).decode("utf-8"))
        sub = payload.get("sub")
        return str(sub) if sub is not None else None
    except Exception:
        return None
