"""
alembic/env.py – Alembic migration environment.
Uses the SYNC_DATABASE_URL for migrations (psycopg2 driver).
"""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# Import all models so Alembic detects them for autogenerate
from app.db.models import Base  # noqa: F401  # registers all tables with metadata
from app.config import get_settings

config = context.config
settings = get_settings()

# Use attributes dict to bypass ConfigParser's % interpolation, which chokes
# on URL-encoded passwords containing percent signs.
config.attributes["sqlalchemy.url"] = settings.sync_database_url

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.attributes.get("sqlalchemy.url") or config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    url = config.attributes.get("sqlalchemy.url")
    if url:
        from sqlalchemy import create_engine
        connectable = create_engine(url, poolclass=pool.NullPool)
    else:
        connectable = engine_from_config(
            config.get_section(config.config_ini_section, {}),
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
