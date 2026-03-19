"""
app/api/posts.py – /api/posts and /api/posts/{id} endpoints.

Supports:
  - Pagination (cursor-based via `before` timestamp for infinite scroll)
  - Filters: category, source, tags, date_from, date_to, search, min_rating
  - Sort: newest (default)
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import and_, cast, func, or_, select
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.types import String

from app.db.models import Post
from app.db.session import get_db

router = APIRouter(prefix="/api/posts", tags=["posts"])


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class PostCard(BaseModel):
    id: uuid.UUID
    title: str
    url: str
    source: str
    published_at: Optional[datetime]
    teaser: Optional[str]
    categories: list[str]
    tags: list[str]
    average_rating: float
    rating_count: int
    is_sponsored: bool

    class Config:
        from_attributes = True


class PostDetail(PostCard):
    summary: Optional[str]
    how_to_implement: Optional[str]
    business_impact: Optional[str]


class PostsResponse(BaseModel):
    items: list[PostCard]
    next_cursor: Optional[str]  # ISO timestamp of last item's published_at
    total: int


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("", response_model=PostsResponse)
async def list_posts(
    db: Annotated[AsyncSession, Depends(get_db)],
    # Pagination
    limit: int = Query(20, ge=1, le=100),
    before: Optional[str] = Query(None, description="ISO timestamp cursor"),
    # Filters
    category: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    q: Optional[str] = Query(None, description="Full-text search on title"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    sponsored: Optional[bool] = Query(None),
) -> PostsResponse:
    filters = []

    if before:
        try:
            cursor_dt = datetime.fromisoformat(before)
            filters.append(Post.published_at < cursor_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid `before` cursor format.")

    if category:
        filters.append(Post.categories.any(category))

    if source:
        filters.append(Post.source == source)

    if tag:
        filters.append(Post.tags.any(tag))

    if q:
        filters.append(Post.title.ilike(f"%{q}%"))

    if date_from:
        try:
            filters.append(Post.published_at >= datetime.fromisoformat(date_from))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid `date_from` format.")

    if date_to:
        try:
            filters.append(Post.published_at <= datetime.fromisoformat(date_to))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid `date_to` format.")

    if min_rating is not None:
        filters.append(Post.average_rating >= min_rating)

    if sponsored is not None:
        filters.append(Post.is_sponsored == sponsored)

    where_clause = and_(*filters) if filters else True

    # Total count (without cursor for display)
    count_stmt = select(func.count(Post.id)).where(where_clause)
    total = (await db.execute(count_stmt)).scalar_one()

    # Paginated results
    stmt = (
        select(Post)
        .where(where_clause)
        .order_by(Post.published_at.desc().nullslast())
        .limit(limit)
    )
    rows = (await db.execute(stmt)).scalars().all()

    next_cursor: Optional[str] = None
    if len(rows) == limit and rows:
        last_pub = rows[-1].published_at
        if last_pub:
            next_cursor = last_pub.isoformat()

    return PostsResponse(
        items=[PostCard.model_validate(r) for r in rows],
        next_cursor=next_cursor,
        total=total,
    )


@router.get("/{post_id}", response_model=PostDetail)
async def get_post(
    post_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PostDetail:
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    return PostDetail.model_validate(post)
