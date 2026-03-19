"""
app/services/sources.py – RSS/Atom feed definitions and async fetcher.

Each source is tried in order. Only posts published in the last 48 hours are
returned (configurable). Duplicate URLs are handled at the DB layer (UNIQUE
constraint), but we also skip them early here to avoid unnecessary Grok calls.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from typing import Sequence

import feedparser
import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Feed registry
# ---------------------------------------------------------------------------

# source_type controls scraping behaviour and prompt selection:
#   "research"   – arXiv / Papers With Code: abstract in feed, skip scraping, full schema
#   "newsletter" – digest newsletters: full content in feed, skip scraping, lite schema
#   "article"    – blog posts: scrape full body, full schema
@dataclass
class FeedSource:
    name: str
    url: str
    category_hint: list[str] = field(default_factory=list)
    source_type: str = "article"  # "research" | "newsletter" | "article"


SOURCES: list[FeedSource] = [
    FeedSource("arXiv cs.AI", "https://rss.arxiv.org/rss/cs.AI", ["Research", "LLMs"], source_type="research"),
    FeedSource("arXiv cs.LG", "https://rss.arxiv.org/rss/cs.LG", ["Research"], source_type="research"),
    FeedSource(
        "Hugging Face Blog",
        "https://huggingface.co/blog/feed.xml",
        ["Tools", "LLMs"],
        source_type="article",
    ),
    FeedSource(
        "OpenAI Blog",
        "https://openai.com/news/rss.xml",
        ["LLMs", "Business"],
        source_type="article",
    ),
    FeedSource(
        "Anthropic Blog",
        "https://www.anthropic.com/rss.xml",
        ["LLMs", "Safety"],
        source_type="article",
    ),
    FeedSource(
        "Google DeepMind Blog",
        "https://deepmind.google/blog/rss.xml",
        ["Research", "LLMs"],
        source_type="article",
    ),
    FeedSource(
        "MarkTechPost",
        "https://www.marktechpost.com/feed/",
        ["Tools", "Research"],
        source_type="article",
    ),
    FeedSource(
        "The Neuron",
        "https://www.theneurondaily.com/feed.xml",
        ["Business", "LLMs"],
        source_type="newsletter",
    ),
    FeedSource(
        "Ben's Bites",
        "https://bensbites.com/feed",
        ["Business", "Tools"],
        source_type="newsletter",
    ),
    FeedSource(
        "The Rundown AI",
        "https://api.therundown.ai/api/email/rss",
        ["Business", "LLMs"],
        source_type="newsletter",
    ),
    FeedSource(
        "Papers With Code",
        "https://paperswithcode.com/rss.xml",
        ["Research", "MLOps"],
        source_type="research",
    ),
]


# ---------------------------------------------------------------------------
# Data transfer object
# ---------------------------------------------------------------------------

@dataclass
class RawPost:
    title: str
    url: str
    source: str
    published_at: datetime | None
    body_text: str  # raw scraped / summary text for Grok
    source_type: str = "article"  # propagated to xai.py for prompt selection
    category_hint: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_date(entry: feedparser.FeedParserDict) -> datetime | None:
    """Best-effort datetime parse from feedparser entry."""
    for attr in ("published_parsed", "updated_parsed"):
        val = getattr(entry, attr, None)
        if val:
            try:
                import time as _time
                return datetime(*val[:6], tzinfo=timezone.utc)
            except Exception:
                pass
    # Try string fallback
    for attr in ("published", "updated"):
        val = getattr(entry, attr, None)
        if val:
            try:
                return parsedate_to_datetime(val).astimezone(timezone.utc)
            except Exception:
                pass
    return None


def _strip_html(html: str) -> str:
    """Remove HTML tags and normalise whitespace."""
    soup = BeautifulSoup(html, "lxml")
    return " ".join(soup.get_text(separator=" ").split())


# Body char caps per source type — governs input token budget
_BODY_CAPS: dict[str, int] = {
    "research": 4_000,    # arXiv abstracts are short; feed text is sufficient
    "newsletter": 3_000,  # digest text is already condensed
    "article": 8_000,     # blog posts benefit from more context
}


async def _scrape_body(client: httpx.AsyncClient, url: str) -> str:
    """
    Attempt to scrape the article body. Falls back to empty string on any error.
    Returns at most 8 000 characters (article sources only).
    """
    try:
        resp = await client.get(url, follow_redirects=True, timeout=10.0)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")
        # Remove boilerplate
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()
        text = " ".join(soup.get_text(separator=" ").split())
        return text[:_BODY_CAPS["article"]]
    except Exception as exc:
        logger.debug("Body scrape failed for %s: %s", url, exc)
        return ""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def fetch_new_posts(
    since_hours: int = 48,
    known_urls: set[str] | None = None,
) -> list[RawPost]:
    """
    Fetch all RSS feeds concurrently and return new posts not in `known_urls`.
    Only posts published within `since_hours` are returned.
    """
    cutoff = datetime.now(tz=timezone.utc) - timedelta(hours=since_hours)
    known = known_urls or set()
    results: list[RawPost] = []

    async with httpx.AsyncClient(
        headers={"User-Agent": "AIPulseDaily/1.0 (+https://aipulsedaily.news)"},
        timeout=15.0,
        follow_redirects=True,
    ) as client:
        # Fetch all feeds concurrently
        feed_tasks = [_fetch_feed(client, src, cutoff, known) for src in SOURCES]
        feed_results = await asyncio.gather(*feed_tasks, return_exceptions=True)

        for res in feed_results:
            if isinstance(res, Exception):
                logger.warning("Feed fetch error: %s", res)
            elif isinstance(res, list):
                results.extend(res)

    logger.info("Fetched %d new raw posts across all sources.", len(results))
    return results


async def _fetch_feed(
    client: httpx.AsyncClient,
    source: FeedSource,
    cutoff: datetime,
    known_urls: set[str],
) -> list[RawPost]:
    """Fetch and parse a single RSS feed."""
    try:
        resp = await client.get(source.url, timeout=15.0, follow_redirects=True)
        resp.raise_for_status()
        feed = feedparser.parse(resp.text)
    except Exception as exc:
        logger.warning("Failed to fetch feed %s: %s", source.name, exc)
        return []

    posts: list[RawPost] = []
    for entry in feed.entries:
        url: str = getattr(entry, "link", "") or ""
        if not url or url in known_urls:
            continue

        pub_date = _parse_date(entry)
        if pub_date and pub_date < cutoff:
            continue  # too old

        title: str = getattr(entry, "title", "Untitled")

        # Use feed summary as initial body; we'll scrape full text later
        summary_html: str = ""
        for attr in ("summary", "description", "content"):
            val = getattr(entry, attr, None)
            if isinstance(val, list) and val:
                summary_html = val[0].get("value", "")
                break
            elif isinstance(val, str) and val:
                summary_html = val
                break

        body = _strip_html(summary_html)

        # Only scrape full article body for blog-type sources;
        # research feeds (arXiv) and newsletters already contain full text in-feed.
        if source.source_type == "article":
            full_body = await _scrape_body(client, url)
            if len(full_body) > len(body):
                body = full_body

        # Apply per-type character cap to bound input tokens
        cap = _BODY_CAPS.get(source.source_type, _BODY_CAPS["article"])
        body = body[:cap]

        posts.append(
            RawPost(
                title=title,
                url=url,
                source=source.name,
                source_type=source.source_type,
                published_at=pub_date,
                body_text=body,
                category_hint=source.category_hint,
            )
        )
        known_urls.add(url)  # prevent duplicates within a single run

    logger.info("Source %s: %d new posts", source.name, len(posts))
    return posts
