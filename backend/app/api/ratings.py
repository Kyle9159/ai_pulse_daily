"""
app/api/ratings.py – POST /api/rate/{post_id}

Anonymous 1–5 star ratings. Rate-limited: one vote per IP per post per hour
(stored as SHA-256 of the IP address — no raw IPs persisted).
"""

from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Post, Rating
from app.db.session import get_db

router = APIRouter(prefix="/api/rate", tags=["ratings"])


class RatingIn(BaseModel):
    rating: int = Field(..., ge=1, le=5)


class RatingOut(BaseModel):
    average_rating: float
    rating_count: int


def _hash_ip(ip: str) -> str:
    """One-way hash of client IP – preserves rate-limit logic without storing PII."""
    return hashlib.sha256(ip.encode()).hexdigest()


@router.post("/{post_id}", response_model=RatingOut)
async def rate_post(
    post_id: uuid.UUID,
    body: RatingIn,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RatingOut:
    # Verify post exists
    post_result = await db.execute(select(Post).where(Post.id == post_id))
    post = post_result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    # Derive client IP (respect X-Forwarded-For from reverse proxy)
    client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
    client_ip = client_ip.split(",")[0].strip()
    ip_hash = _hash_ip(client_ip)

    # Check rate limit: 1 vote per IP per post per hour
    one_hour_ago = datetime.now(tz=timezone.utc) - timedelta(hours=1)
    existing = await db.execute(
        select(Rating).where(
            Rating.post_id == post_id,
            Rating.ip_hash == ip_hash,
            Rating.created_at >= one_hour_ago,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=429,
            detail="You have already rated this post in the last hour.",
        )

    # Insert rating
    new_rating = Rating(post_id=post_id, rating=body.rating, ip_hash=ip_hash)
    db.add(new_rating)
    await db.flush()

    # Recalculate aggregate on the post row
    agg = await db.execute(
        select(func.avg(Rating.rating), func.count(Rating.id)).where(
            Rating.post_id == post_id
        )
    )
    avg_rating, count = agg.one()

    await db.execute(
        update(Post)
        .where(Post.id == post_id)
        .values(average_rating=float(avg_rating or 0), rating_count=int(count))
    )
    await db.commit()

    return RatingOut(average_rating=float(avg_rating or 0), rating_count=int(count))
