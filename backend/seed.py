#!/usr/bin/env python3
"""
Seed script – inserts a handful of sample posts so the frontend
looks populated immediately without running a live Grok refresh.

Usage:
  cd backend
  python seed.py
"""

import asyncio
import uuid
from datetime import datetime, timezone

from app.db.models import Post
from app.db.session import AsyncSessionLocal


SAMPLE_POSTS = [
    {
        "id": uuid.uuid4(),
        "title": "GPT-5 Achieves Human-Level Reasoning on ARC-AGI Benchmark",
        "url": "https://openai.com/research/gpt-5-arc-agi",
        "source": "OpenAI Blog",
        "published_at": datetime(2026, 3, 18, 9, 0, tzinfo=timezone.utc),
        "teaser": "OpenAI's newest model passes the definitive AGI reasoning test — what changes now?",
        "summary": "OpenAI announced that GPT-5 has achieved human-level performance on the ARC-AGI benchmark, scoring 87.5% compared to the human average of 85%...",
        "how_to_implement": "## Using GPT-5 via API\n\n```python\nfrom openai import OpenAI\nclient = OpenAI()\nresponse = client.chat.completions.create(\n    model='gpt-5',\n    messages=[{'role': 'user', 'content': 'Solve this reasoning task...'}]\n)\n```\n\n**Difficulty**: Intermediate\n**Estimated effort**: 1-2 days for integration",
        "business_impact": "This milestone signals that frontier AI can now match or exceed human performance on abstract reasoning. PMs should evaluate AI-assisted product features that require complex logical chains. Early adopters in legal-tech, financial analysis, and scientific research will gain significant leverage.",
        "categories": ["LLMs", "Research"],
        "tags": ["gpt-5", "agi", "benchmarks", "reasoning", "openai"],
        "average_rating": 4.7,
        "rating_count": 143,
        "is_sponsored": False,
    },
    {
        "id": uuid.uuid4(),
        "title": "Claude 4 Introduces 'Extended Thinking' with 200K Token Context",
        "url": "https://anthropic.com/research/claude-4-extended-thinking",
        "source": "Anthropic Blog",
        "published_at": datetime(2026, 3, 17, 14, 0, tzinfo=timezone.utc),
        "teaser": "Anthropic's chain-of-thought breakthrough lets Claude reason for minutes before answering.",
        "summary": "Anthropic's Claude 4 introduces Extended Thinking mode — a structured chain-of-thought process that allows the model to reason internally for up to 10 minutes before producing a final output...",
        "how_to_implement": "## Enabling Extended Thinking\n\n```python\nimport anthropic\nclient = anthropic.Anthropic()\nresponse = client.messages.create(\n    model='claude-4-opus',\n    max_tokens=8192,\n    thinking={\n        'type': 'enabled',\n        'budget_tokens': 10000\n    },\n    messages=[{'role': 'user', 'content': 'Complex legal analysis...'}]\n)\n```\n\n**Pitfall**: Thinking tokens are billed separately — monitor costs.\n**Difficulty**: Beginner | **Effort**: Half a day",
        "business_impact": "Extended Thinking dramatically improves performance on multi-step analysis. Adopt immediately for document review, financial modelling, and complex customer support escalations. ROI is strongest in workflows where human experts currently spend >2 hours per task.",
        "categories": ["LLMs", "Research"],
        "tags": ["claude", "chain-of-thought", "context-window", "anthropic", "reasoning"],
        "average_rating": 4.5,
        "rating_count": 89,
        "is_sponsored": False,
    },
    {
        "id": uuid.uuid4(),
        "title": "Google Introduces Gemini Robotics: Foundation Models for Dexterous Manipulation",
        "url": "https://deepmind.google/research/gemini-robotics",
        "source": "Google DeepMind Blog",
        "published_at": datetime(2026, 3, 16, 10, 30, tzinfo=timezone.utc),
        "teaser": "DeepMind's Gemini Robotics can fold laundry and assemble IKEA furniture out of the box.",
        "summary": "Google DeepMind released Gemini Robotics, a multimodal foundation model that enables general-purpose robotic manipulation without task-specific training...",
        "how_to_implement": "## Integrating Gemini Robotics\n\nCurrently available via Google Cloud Robotics API (private beta).\n\n```python\nfrom google.cloud import robotics_v1\nclient = robotics_v1.RoboticsClient()\npolicy = client.get_manipulation_policy(\n    robot_id='ur5-001',\n    task_description='Pick and place red cube to blue tray'\n)\n```\n\n**Difficulty**: Advanced | **Effort**: 2-4 weeks for hardware integration",
        "business_impact": "For manufacturing and logistics PMs: this eliminates the need for expensive per-task robot programming. Pilot in quality control inspection (QCI) lines first — fastest ROI with least safety risk.",
        "categories": ["Robotics", "Research"],
        "tags": ["robotics", "deepmind", "gemini", "manipulation", "foundation-models"],
        "average_rating": 4.3,
        "rating_count": 67,
        "is_sponsored": False,
    },
    {
        "id": uuid.uuid4(),
        "title": "Open-Source LLaMA 4 Beats GPT-4o on 23 of 30 Standard Benchmarks",
        "url": "https://huggingface.co/blog/llama-4-release",
        "source": "Hugging Face Blog",
        "published_at": datetime(2026, 3, 15, 8, 0, tzinfo=timezone.utc),
        "teaser": "Meta's LLaMA 4 is the new open-source SOTA — and it fits on a single A100.",
        "summary": "Meta AI released LLaMA 4, a 70B parameter model that outperforms GPT-4o on 23 out of 30 standard benchmarks while remaining fully open-source under the LLaMA Community License...",
        "how_to_implement": "## Running LLaMA 4 Locally\n\n```bash\n# Using Ollama (easiest local setup)\nbrew install ollama\nollama pull llama4:70b-instruct\nollama run llama4:70b-instruct\n```\n\n```python\n# Via Hugging Face Transformers\nfrom transformers import pipeline\npipe = pipeline('text-generation', model='meta-llama/Llama-4-70B-Instruct')\nresult = pipe('Explain transformer attention mechanisms:')\n```\n\n**Difficulty**: Intermediate | **Effort**: 1-3 days",
        "business_impact": "LLaMA 4 eliminates API costs for teams running at scale. Recommended action: immediately start a side-by-side evaluation against your current provider. Switching to self-hosted LLaMA 4 can reduce inference costs by 60-80% for high-volume applications.",
        "categories": ["LLMs", "Tools"],
        "tags": ["llama", "open-source", "meta", "fine-tuning", "self-hosted"],
        "average_rating": 4.8,
        "rating_count": 212,
        "is_sponsored": False,
    },
    {
        "id": uuid.uuid4(),
        "title": "Introducing ToolForge: Production-Grade MCP Server Builder",
        "url": "https://toolforge.dev/launch",
        "source": "MarkTechPost",
        "published_at": datetime(2026, 3, 14, 12, 0, tzinfo=timezone.utc),
        "teaser": "Build type-safe MCP tool servers in 5 minutes — ToolForge handles auth, versioning, and streaming.",
        "summary": "ToolForge is an open-source framework for building production-ready Model Context Protocol (MCP) servers with built-in authentication, tool versioning, streaming responses, and observability...",
        "how_to_implement": "## Quick Start\n\n```bash\nnpx create-toolforge-server my-tools\ncd my-tools && npm install\n```\n\n```typescript\nimport { ToolForge } from 'toolforge';\nconst server = new ToolForge({ name: 'my-tools' });\nserver.tool('search', async ({ query }) => {\n  return await vectorSearch(query);\n});\nserver.listen(3001);\n```\n\n**Difficulty**: Beginner | **Effort**: 2-4 hours for a basic server",
        "business_impact": "MCP is becoming the standard protocol for AI-tool integration. Building MCP-compatible tools now ensures your services are ready for the next generation of agentic AI systems. Recommended for any team building internal AI tooling.",
        "categories": ["Tools", "MLOps"],
        "tags": ["mcp", "tools", "agentic-ai", "typescript", "open-source"],
        "average_rating": 4.1,
        "rating_count": 34,
        "is_sponsored": True,
    },
]


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        for data in SAMPLE_POSTS:
            post = Post(**data)
            session.add(post)
        await session.commit()
    print(f"Seeded {len(SAMPLE_POSTS)} sample posts.")


if __name__ == "__main__":
    asyncio.run(seed())
