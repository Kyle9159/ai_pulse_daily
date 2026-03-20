// components/Sidebar.tsx – Filters sidebar (categories, source, rating, date, search)

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Search, Star, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PostCard, PostFilters } from "@/lib/types";

const CATEGORIES = [
  "LLMs",
  "Vision",
  "Audio",
  "Robotics",
  "MLOps",
  "Research",
  "Tools",
  "Safety",
  "Business",
  "Policy",
];

const SOURCES = [
  "arXiv cs.AI",
  "arXiv cs.LG",
  "Hugging Face Blog",
  "OpenAI Blog",
  "Anthropic Blog",
  "Google DeepMind Blog",
  "MarkTechPost",
  "The Neuron",
  "Ben's Bites",
  "The Rundown AI",
  "Papers With Code",
];

const RATING_OPTIONS = [
  { label: "Any rating", value: undefined },
  { label: "4+ stars", value: 4 },
  { label: "3+ stars", value: 3 },
];

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Props {
  filters: PostFilters;
  onFiltersChange: (f: PostFilters) => void;
  totalCount: number;
  bookmarkCount?: number;
}

export function Sidebar({ filters, onFiltersChange, totalCount, bookmarkCount = 0 }: Props) {
  const [trending, setTrending] = useState<PostCard[]>([]);

  useEffect(() => {
    fetch(`${BASE}/api/posts?sort_by=rating&limit=5&min_rating=1`)
      .then((r) => r.json())
      .then((data) => setTrending(data.items ?? []))
      .catch(() => {});
  }, []);
  const set = (partial: Partial<PostFilters>) =>
    onFiltersChange({ ...filters, ...partial });

  const clearAll = () => onFiltersChange({});
  const hasFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== "",
  );

  return (
    <aside className="flex flex-col gap-6">
      {/* Search */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by title…"
            value={filters.q ?? ""}
            onChange={(e) => set({ q: e.target.value || undefined })}
            className="pl-8"
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Category
        </label>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => set({ category: undefined })}
            className={cn(
              "rounded px-2 py-1 text-left text-sm transition-colors",
              !filters.category
                ? "bg-primary/15 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            All categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                set({ category: filters.category === cat ? undefined : cat })
              }
              className={cn(
                "rounded px-2 py-1 text-left text-sm transition-colors",
                filters.category === cat
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Source */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Source
        </label>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => set({ source: undefined })}
            className={cn(
              "rounded px-2 py-1 text-left text-sm transition-colors",
              !filters.source
                ? "bg-primary/15 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            All sources
          </button>
          {SOURCES.map((src) => (
            <button
              key={src}
              onClick={() =>
                set({ source: filters.source === src ? undefined : src })
              }
              className={cn(
                "rounded px-2 py-1 text-left text-sm transition-colors truncate",
                filters.source === src
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
            >
              {src}
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Min Rating
        </label>
        <div className="flex flex-col gap-1">
          {RATING_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => set({ min_rating: opt.value })}
              className={cn(
                "rounded px-2 py-1 text-left text-sm transition-colors",
                filters.min_rating === opt.value
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date range */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Date range
        </label>
        <div className="flex flex-col gap-2">
          <Input
            type="date"
            value={filters.date_from ?? ""}
            onChange={(e) => set({ date_from: e.target.value || undefined })}
            className="text-xs"
          />
          <Input
            type="date"
            value={filters.date_to ?? ""}
            onChange={(e) => set({ date_to: e.target.value || undefined })}
            className="text-xs"
          />
        </div>
      </div>

      {/* Clear + count */}
      {hasFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearAll}
          className="gap-2"
        >
          <X className="h-3.5 w-3.5" />
          Clear filters
        </Button>
      )}

      <p className="text-xs text-muted-foreground">
        {totalCount.toLocaleString()} posts
      </p>

      {/* Bookmarks */}
      <div className="border-t border-border pt-4">
        <Link
          href="/bookmarks"
          className="inline-flex items-center gap-2 rounded px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary w-full"
        >
          <Bookmark className="h-3.5 w-3.5" />
          Saved
          {bookmarkCount > 0 && (
            <span className="ml-auto rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              {bookmarkCount}
            </span>
          )}
        </Link>
      </div>

      {/* Top Rated */}
      {trending.length > 0 && (
        <div className="border-t border-border pt-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Top Rated
          </label>
          <div className="flex flex-col gap-2">
            {trending.map((p) => (
              <Link
                key={p.id}
                href={`/post/${p.id}`}
                className="group flex flex-col gap-0.5 rounded px-2 py-1.5 transition-colors hover:bg-secondary"
              >
                <span className="line-clamp-2 text-xs text-foreground leading-snug group-hover:text-primary transition-colors">
                  {p.title}
                </span>
                {p.rating_count > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Star className="h-2.5 w-2.5 fill-pulse-400 text-pulse-400" />
                    {p.average_rating.toFixed(1)}
                    <span className="opacity-60">({p.rating_count})</span>
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
