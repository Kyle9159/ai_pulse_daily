// app/sitemap.ts – Dynamic sitemap including all post URLs

import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.aipulsedaily.news"
).replace(/\/$/, "");

interface PostItem {
  id: string;
  published_at: string | null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const statics: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1.0,
    },
  ];

  try {
    const res = await fetch(`${BASE}/api/posts?limit=1000`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return statics;

    const data = await res.json();
    const posts: PostItem[] = data.items ?? [];

    const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
      url: `${SITE_URL}/post/${p.id}`,
      lastModified: p.published_at ? new Date(p.published_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...statics, ...postEntries];
  } catch {
    return statics;
  }
}
