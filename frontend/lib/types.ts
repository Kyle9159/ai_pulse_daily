// lib/types.ts – Shared TypeScript types matching the FastAPI response schemas.

export interface PostCard {
  id: string;
  title: string;
  url: string;
  source: string;
  published_at: string | null;
  teaser: string | null;
  categories: string[];
  tags: string[];
  average_rating: number;
  rating_count: number;
  is_sponsored: boolean;
}

export interface PostDetail extends PostCard {
  summary: string | null;
  how_to_implement: string | null;
  business_impact: string | null;
}

export interface PostsResponse {
  items: PostCard[];
  next_cursor: string | null;
  total: number;
}

export interface RatingResponse {
  average_rating: number;
  rating_count: number;
}

export interface PostFilters {
  category?: string;
  source?: string;
  tag?: string;
  q?: string;
  date_from?: string;
  date_to?: string;
  min_rating?: number;
}
