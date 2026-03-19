"""
lib/xai.py – Async Grok summariser via xAI API (OpenAI-compatible SDK).

Two tiered prompt schemas:
  - RESEARCH: full schema including howToImplement (arXiv, Papers With Code)
  - NEWS:     lighter schema, skips howToImplement (blogs, newsletters)

Always returns strict JSON so callers don’t need to parse prose.
"""

from __future__ import annotations

import json
import logging

from openai import AsyncOpenAI

from app.config import get_settings

logger = logging.getLogger(__name__)

# Full schema for research papers — engineers care about implementation depth
_SYSTEM_PROMPT_RESEARCH = """\
You are an expert AI research analyst. Given a paper title and abstract, output ONLY a JSON object.
Return ONLY raw JSON — no markdown fences, no prose outside the JSON.

Schema:
{
  "summary": "<One solid paragraph of plain-English overview (4-6 sentences), followed by a markdown bullet list of up to 5 key takeaways. Format: paragraph text, then a blank line, then bullets starting with '- '. Include one callout as '**Key Insight:** ...' within the paragraph.>",
  "howToImplement": "<step-by-step guide: Python code snippet, library names, difficulty (Beginner/Intermediate/Advanced), main pitfalls>",
  "businessImpact": "<concrete business value, competitive angle, recommended action (evaluate/adopt/wait)>",
  "categories": ["<from: LLMs Vision Audio Robotics MLOps Research Tools Safety Business Policy>"],
  "tags": ["<3-7 lowercase kebab tags>"],
  "teaser": "<≤120 char hook>"
}
"""

# Light schema for news and newsletters — no implementation guide needed
_SYSTEM_PROMPT_NEWS = """\
You are an expert AI industry analyst. Given a news title and content, output ONLY a JSON object.
Return ONLY raw JSON — no markdown fences, no prose outside the JSON.

Schema:
{
  "summary": "<One solid paragraph of plain-English overview (4-6 sentences), followed by a markdown bullet list of up to 5 key takeaways. Format: paragraph text, then a blank line, then bullets starting with '- '. Include one callout as '**Key Insight:** ...' within the paragraph.>",
  "businessImpact": "<concrete business value, competitive angle, recommended action (evaluate/adopt/wait)>",
  "categories": ["<from: LLMs Vision Audio Robotics MLOps Research Tools Safety Business Policy>"],
  "tags": ["<3-7 lowercase kebab tags>"],
  "teaser": "<≤120 char hook>"
}
"""


async def summarise_post(title: str, body: str, source_type: str = "article") -> dict:
    """
    Call xAI Grok to generate structured JSON for a given post.

    source_type selects the prompt schema:
      "research"   → full schema with howToImplement
      "newsletter" → light schema (no howToImplement)
      "article"    → full schema with howToImplement

    Returns a dict with keys: summary, howToImplement (may be empty),
    businessImpact, categories, tags, teaser.
    """
    settings = get_settings()
    client = AsyncOpenAI(
        api_key=settings.xai_api_key,
        base_url=settings.xai_base_url,
    )

    is_news = source_type == "newsletter"
    system_prompt = _SYSTEM_PROMPT_NEWS if is_news else _SYSTEM_PROMPT_RESEARCH

    # Body is pre-capped by the fetcher; this is a safety net
    body_caps = {"research": 4_000, "newsletter": 3_000, "article": 8_000}
    cap = body_caps.get(source_type, 8_000)
    truncated_body = body[:cap]

    user_message = f"Title: {title}\n\nContent:\n{truncated_body}"

    try:
        response = await client.chat.completions.create(
            model=settings.xai_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=0.3,
            max_tokens=1500,
        )
        raw = response.choices[0].message.content or "{}"
        # Strip accidental markdown fences
        raw = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.warning("xAI returned non-JSON response: %s", exc)
        return {
            "summary": "",
            "howToImplement": "",
            "businessImpact": "",
            "categories": [],
            "tags": [],
            "teaser": "",
        }
    except Exception as exc:
        logger.error("xAI API error: %s", exc)
        raise

