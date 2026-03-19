"""Initial schema – posts and ratings tables.

Revision ID: 0001_initial
Revises: 
Create Date: 2026-03-19

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ARRAY, UUID

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "posts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("title", sa.String(512), nullable=False),
        sa.Column("url", sa.String(2048), nullable=False),
        sa.Column("source", sa.String(128), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("summary", sa.Text, nullable=True),
        sa.Column("how_to_implement", sa.Text, nullable=True),
        sa.Column("business_impact", sa.Text, nullable=True),
        sa.Column("categories", ARRAY(sa.String), nullable=False, server_default="{}"),
        sa.Column("tags", ARRAY(sa.String), nullable=False, server_default="{}"),
        sa.Column("average_rating", sa.Float, nullable=False, server_default="0"),
        sa.Column("rating_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_sponsored", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("teaser", sa.String(512), nullable=True),
    )
    op.create_index("ix_posts_url", "posts", ["url"], unique=True)
    op.create_index("ix_posts_published_at", "posts", ["published_at"])
    op.create_index("ix_posts_source", "posts", ["source"])

    op.create_table(
        "ratings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column(
            "post_id",
            UUID(as_uuid=True),
            sa.ForeignKey("posts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("rating", sa.Integer, nullable=False),
        sa.Column("ip_hash", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_ratings_post_id", "ratings", ["post_id"])
    op.create_index("ix_ratings_ip_hash_created", "ratings", ["ip_hash", "created_at"])


def downgrade() -> None:
    op.drop_table("ratings")
    op.drop_table("posts")
