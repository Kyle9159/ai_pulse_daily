// lib/api.ts – Typed API client for the FastAPI backend.

import type {
  PostCard,
  PostDetail,
  PostFilters,
  PostsResponse,
  RatingResponse,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────
// Posts
// ─────────────────────────────────────────────

export async function fetchPosts(
  filters: PostFilters = {},
  limit = 20,
  before?: string,
): Promise<PostsResponse> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (before) params.set("before", before);
  if (filters.category) params.set("category", filters.category);
  if (filters.source) params.set("source", filters.source);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.q) params.set("q", filters.q);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  if (filters.min_rating !== undefined)
    params.set("min_rating", String(filters.min_rating));

  return apiFetch<PostsResponse>(`/api/posts?${params.toString()}`);
}

export async function fetchPost(id: string): Promise<PostDetail> {
  return apiFetch<PostDetail>(`/api/posts/${id}`);
}

// ─────────────────────────────────────────────
// Ratings
// ─────────────────────────────────────────────

export async function ratePost(
  postId: string,
  rating: number,
): Promise<RatingResponse> {
  return apiFetch<RatingResponse>(`/api/rate/${postId}`, {
    method: "POST",
    body: JSON.stringify({ rating }),
  });
}

// ─────────────────────────────────────────────
// Admin
// ─────────────────────────────────────────────

export async function triggerRefresh(
  password: string,
  sinceHours = 48,
): Promise<{ ok: boolean; new_posts: number; errors: number }> {
  return apiFetch(`/api/admin/refresh?since_hours=${sinceHours}`, {
    method: "POST",
    headers: { "x-admin-password": password },
  });
}
