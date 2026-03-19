"""
app/config.py – Centralised settings loaded from environment variables.
Uses pydantic-settings so every value is typed and validated at startup.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str
    sync_database_url: str

    # xAI / Grok
    xai_api_key: str
    xai_base_url: str = "https://api.x.ai/v1"
    xai_model: str = "grok-3-mini-fast"

    # Admin
    admin_password: str = "changeme"

    # CORS
    frontend_origin: str = "http://localhost:3000"

    # Scheduler
    scheduler_timezone: str = "America/Boise"

    # Rate limiting – max ratings per IP per hour per post
    rating_rate_limit: int = 1


@lru_cache
def get_settings() -> Settings:
    return Settings()
