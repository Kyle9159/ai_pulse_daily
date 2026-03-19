"""
app/services/refresher.py – Orchestrates feed fetch → Grok summarise → DB upsert.

Called by both the APScheduler daily job and the /api/admin/refresh endpoint.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Post
from app.db.session import AsyncSessionLocal
from app.lib.xai import summarise_post
from app.services.sources import RawPost, fetch_new_posts

logger = logging.getLogger(__name__)

# Max concurrent Grok calls to avoid rate-limit bursts
_GROK_CONCURRENCY = 5


async def run_refresh(since_hours: int = 48) -> dict:
    """
    Full refresh pipeline:
    1. Load all existing URLs from DB.
    2. Fetch new posts from RSS sources.
    3. Summarise with Grok (rate-limited concurrency).
    4. Upsert into DB.
    Returns a summary dict for the admin endpoint response.
    """
    async with AsyncSessionLocal() as session:
        known_urls = await _load_known_urls(session)

    raw_posts = await fetch_new_posts(since_hours=since_hours, known_urls=known_urls)

    if not raw_posts:
        logger.info("Refresh: no new posts found.")
        return {"new_posts": 0, "errors": 0}

    semaphore = asyncio.Semaphore(_GROK_CONCURRENCY)
    tasks = [_process_post(post, semaphore) for post in raw_posts]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    successes = [r for r in results if isinstance(r, dict)]
    errors = [r for r in results if isinstance(r, Exception)]

    if successes:
        async with AsyncSessionLocal() as session:
            await _bulk_upsert(session, successes)

    logger.info(
        "Refresh complete: %d new, %d errors.", len(successes), len(errors)
    )
    return {"new_posts": len(successes), "errors": len(errors)}


async def _load_known_urls(session: AsyncSession) -> set[str]:
    result = await session.execute(select(Post.url))
    return {row[0] for row in result.all()}


async def _process_post(raw: RawPost, sem: asyncio.Semaphore) -> dict:
    """Summarise one post via Grok; return a dict ready for DB insert."""
    async with sem:
        grok = await summarise_post(title=raw.title, body=raw.body_text, source_type=raw.source_type)

    return {
        "title": raw.title,
        "url": raw.url,
        "source": raw.source,
        "published_at": raw.published_at or datetime.now(tz=timezone.utc),
        "summary": grok.get("summary", ""),
        "how_to_implement": grok.get("howToImplement", ""),
        "business_impact": grok.get("businessImpact", ""),
        "categories": grok.get("categories", raw.category_hint or []),
        "tags": grok.get("tags", []),
        "teaser": grok.get("teaser", raw.title[:120]),
        "is_sponsored": False,
    }


async def _bulk_upsert(session: AsyncSession, posts: list[dict]) -> None:
    """PostgreSQL ON CONFLICT DO NOTHING upsert (duplicate URLs are skipped)."""
    stmt = (
        pg_insert(Post)
        .values(posts)
        .on_conflict_do_nothing(index_elements=["url"])
    )
    await session.execute(stmt)
    await session.commit()
