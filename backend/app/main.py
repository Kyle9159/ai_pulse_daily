"""
app/main.py – FastAPI application entry point.

Includes:
  - CORS middleware
  - API routers
  - APScheduler for daily 06:00 MT content refresh
  - Lifespan context for startup/shutdown
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import admin, posts, ratings
from app.config import get_settings
from app.services.refresher import run_refresh

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()
scheduler = AsyncIOScheduler(timezone=settings.scheduler_timezone)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: launch APScheduler. Shutdown: graceful stop."""
    # Daily refresh at 06:00 in configured timezone.
    # 24h window avoids re-processing posts already seen in the previous run.
    scheduler.add_job(
        run_refresh,
        trigger=CronTrigger(hour=6, minute=0),
        id="daily_refresh",
        replace_existing=True,
        max_instances=1,
        kwargs={"since_hours": 24},
    )
    scheduler.start()
    logger.info("APScheduler started – daily refresh at 06:00 %s", settings.scheduler_timezone)

    yield

    scheduler.shutdown(wait=False)
    logger.info("APScheduler stopped.")


app = FastAPI(
    title="AIPulse API",
    version="1.0.0",
    description="AI news aggregator with Grok-powered summaries.",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(posts.router)
app.include_router(ratings.router)
app.include_router(admin.router)


@app.get("/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok"}
