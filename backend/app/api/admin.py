"""
app/api/admin.py – POST /api/admin/refresh

Password-protected endpoint that triggers a manual content refresh.
Password is compared using constant-time comparison to prevent timing attacks.
"""

from __future__ import annotations

import hmac
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel

from app.config import get_settings
from app.services.refresher import run_refresh

router = APIRouter(prefix="/api/admin", tags=["admin"])


class RefreshResponse(BaseModel):
    ok: bool
    new_posts: int
    errors: int


def _verify_password(provided: str, expected: str) -> bool:
    """Constant-time comparison to mitigate timing oracle attacks."""
    return hmac.compare_digest(provided.encode(), expected.encode())


@router.post("/refresh", response_model=RefreshResponse)
async def trigger_refresh(
    x_admin_password: Annotated[str | None, Header()] = None,
    since_hours: int = 48,
) -> RefreshResponse:
    settings = get_settings()

    if not x_admin_password or not _verify_password(
        x_admin_password, settings.admin_password
    ):
        raise HTTPException(status_code=401, detail="Unauthorized.")

    result = await run_refresh(since_hours=since_hours)
    return RefreshResponse(
        ok=True,
        new_posts=result["new_posts"],
        errors=result["errors"],
    )
