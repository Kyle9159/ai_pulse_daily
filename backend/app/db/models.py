"""
app/db/models.py – SQLAlchemy 2.0 ORM models for AIPulse.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List

from sqlalchemy import (
    ARRAY,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Post(Base):
    """Represents a single AI news article / paper."""

    __tablename__ = "posts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    url: Mapped[str] = mapped_column(String(2048), unique=True, nullable=False)
    source: Mapped[str] = mapped_column(String(128), nullable=False)

    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Grok-generated fields
    summary: Mapped[str | None] = mapped_column(Text)
    how_to_implement: Mapped[str | None] = mapped_column(Text)
    business_impact: Mapped[str | None] = mapped_column(Text)

    # Taxonomy
    categories: Mapped[List[str]] = mapped_column(ARRAY(String), default=list)
    tags: Mapped[List[str]] = mapped_column(ARRAY(String), default=list)

    # Ratings
    average_rating: Mapped[float] = mapped_column(Float, default=0.0)
    rating_count: Mapped[int] = mapped_column(Integer, default=0)

    # Monetisation
    is_sponsored: Mapped[bool] = mapped_column(Boolean, default=False)

    # Teaser shown on feed cards
    teaser: Mapped[str | None] = mapped_column(String(512))

    ratings: Mapped[List["Rating"]] = relationship(
        "Rating", back_populates="post", cascade="all, delete-orphan"
    )


class Rating(Base):
    """Anonymous star rating tied to a post."""

    __tablename__ = "ratings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    post_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1–5
    ip_hash: Mapped[str | None] = mapped_column(String(64))  # hashed client IP
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    post: Mapped["Post"] = relationship("Post", back_populates="ratings")
