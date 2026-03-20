"""
app/api/cron.py – GET /api/cron/refresh

Token-secured endpoint for external cron services (e.g. cron-job.org).
Uses a separate CRON_SECRET env var so the admin password isn't exposed
in cron service logs/configs.

Set CRON_SECRET to a long random string in Railway environment variables,
then configure cron-job.org to GET:
  https://aipulsedailybackend-production.up.railway.app/api/cron/refresh?token=<CRON_SECRET>
"""

from __future__ import annotations

import hmac

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.config import get_settings
from app.services.refresher import run_refresh

router = APIRouter(prefix="/api/cron", tags=["cron"])


class CronRefreshResponse(BaseModel):
    ok: bool
    new_posts: int
    errors: int


@router.get("/refresh", response_model=CronRefreshResponse)
async def cron_refresh(token: str = Query(...)) -> CronRefreshResponse:
    """Trigger a content refresh. Secured by CRON_SECRET token."""
    settings = get_settings()

    if not settings.cron_secret:
        raise HTTPException(status_code=503, detail="Cron trigger not configured.")

    if not hmac.compare_digest(token.encode(), settings.cron_secret.encode()):
        raise HTTPException(status_code=401, detail="Unauthorized.")

    result = await run_refresh(since_hours=24)
    return CronRefreshResponse(
        ok=True,
        new_posts=result["new_posts"],
        errors=result["errors"],
    )
