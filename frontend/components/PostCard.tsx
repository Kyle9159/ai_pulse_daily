// components/PostCard.tsx – Feed card with infinite scroll support

"use client";

import Link from "next/link";
import { Clock, ExternalLink, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, timeAgo } from "@/lib/utils";
import type { PostCard as PostCardType } from "@/lib/types";

interface Props {
  post: PostCardType;
  index?: number;
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Star className="h-3.5 w-3.5 fill-pulse-400 text-pulse-400" />
      <span className="text-foreground font-medium">{rating.toFixed(1)}</span>
      <span className="text-muted-foreground">({count})</span>
    </span>
  );
}

export function PostCard({ post, index = 0 }: Props) {
  const delay = `${(index % 6) * 60}ms`;

  return (
    <article
      className="group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-5 transition-all duration-200 hover:border-border/80 hover:bg-card/80 hover:shadow-lg animate-fade-up"
      style={{ animationDelay: delay, animationFillMode: "both" }}
    >
      {/* Sponsored flag */}
      {post.is_sponsored && (
        <Badge variant="sponsored" className="absolute right-4 top-4">
          Sponsored
        </Badge>
      )}

      {/* Source + date row */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-secondary-foreground">{post.source}</span>
        <span>·</span>
        <Clock className="h-3 w-3" />
        <span>{timeAgo(post.published_at)}</span>
      </div>

      {/* Title */}
      <Link href={`/post/${post.id}`} className="block">
        <h2 className="text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h2>
      </Link>

      {/* Teaser */}
      {post.teaser && (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {post.teaser}
        </p>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="default" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-1">
        {post.rating_count > 0 ? (
          <StarRating rating={post.average_rating} count={post.rating_count} />
        ) : (
          <span className="text-xs text-muted-foreground">No ratings yet</span>
        )}
        <div className="flex items-center gap-2">
          <Link
            href={`/post/${post.id}`}
            className="text-xs text-primary font-medium hover:underline"
          >
            AI Summary →
          </Link>
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Open original article"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}

// ── Loading skeleton ────────────────────────────────────────────
export function PostCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
      <div className="skeleton h-3 w-24 rounded" />
      <div className="skeleton h-5 w-full rounded" />
      <div className="skeleton h-5 w-3/4 rounded" />
      <div className="skeleton h-4 w-full rounded" />
      <div className="flex gap-1.5">
        <div className="skeleton h-4 w-14 rounded" />
        <div className="skeleton h-4 w-16 rounded" />
        <div className="skeleton h-4 w-12 rounded" />
      </div>
    </div>
  );
}
