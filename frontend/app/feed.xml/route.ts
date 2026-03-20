// app/feed.xml/route.ts – RSS 2.0 feed of latest posts

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.aipulsedaily.news"
).replace(/\/$/, "");

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface PostItem {
  id: string;
  title: string;
  teaser: string | null;
  published_at: string | null;
  source: string;
  url: string;
  categories: string[];
}

export async function GET() {
  try {
    const res = await fetch(`${BASE}/api/posts?limit=50`);
    if (!res.ok) throw new Error(`Backend responded ${res.status}`);

    const data = await res.json();
    const posts: PostItem[] = data.items ?? [];

    const items = posts
      .map(
        (p) => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${SITE_URL}/post/${p.id}</link>
      <guid isPermaLink="true">${SITE_URL}/post/${p.id}</guid>
      <pubDate>${p.published_at ? new Date(p.published_at).toUTCString() : ""}</pubDate>
      <description><![CDATA[${p.teaser ?? ""}]]></description>
      <dc:creator>${esc(p.source)}</dc:creator>
      ${p.categories.map((c) => `<category>${esc(c)}</category>`).join("\n      ")}
    </item>`,
      )
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>AIPulse Daily</title>
    <link>${SITE_URL}</link>
    <description>Curated AI research and news with Grok-powered summaries, implementation guides, and business impact analysis.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>60</ttl>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
      },
    });
  } catch {
    return new NextResponse("Failed to generate RSS feed", { status: 500 });
  }
}
