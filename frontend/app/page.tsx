// app/page.tsx – Public feed with infinite scroll, filters, and ads

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { PostCard, PostCardSkeleton } from "@/components/PostCard";
import { AdBannerTop, AdCardInline } from "@/components/AdBanner";
import { fetchPosts } from "@/lib/api";
import type { PostFilters } from "@/lib/types";

const PAGE_SIZE = 18;

export default function FeedPage() {
  const [filters, setFilters] = useState<PostFilters>({});
  const loaderRef = useRef<HTMLDivElement>(null);

  // Infinite query — each page keyed by cursor (published_at)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["posts", filters],
    queryFn: ({ pageParam }) =>
      fetchPosts(filters, PAGE_SIZE, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    staleTime: 60_000,
  });

  // Intersection Observer for infinite scroll trigger
  const observe = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { threshold: 0.1 },
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  const allPosts = data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = data?.pages[0]?.total ?? 0;

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Top ad slot */}
        <AdBannerTop />

        <div className="mt-8 flex gap-8">
          {/* ── Sidebar ── */}
          <div className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-20">
              <Sidebar
                filters={filters}
                onFiltersChange={(f) => setFilters(f)}
                totalCount={totalCount}
              />
            </div>
          </div>

          {/* ── Feed grid ── */}
          <div className="min-w-0 flex-1">
            {/* Mobile filter strip (future enhancement) */}

            {isError && (
              <div className="rounded-lg border border-red-800/40 bg-red-900/10 px-4 py-3 text-sm text-red-400">
                Failed to load posts:{" "}
                {error instanceof Error ? error.message : "Unknown error"}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {isLoading
                ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <PostCardSkeleton key={i} />
                  ))
                : allPosts.map((post, idx) => (
                    <>
                      {/* Inject ad every 6 posts */}
                      {idx > 0 && idx % 6 === 0 && (
                        <AdCardInline key={`ad-${idx}`} />
                      )}
                      <PostCard key={post.id} post={post} index={idx} />
                    </>
                  ))}
            </div>

            {/* Infinite scroll sentinel */}
            {!isLoading && allPosts.length > 0 && (
              <div ref={observe} className="flex justify-center py-10">
                {isFetchingNextPage ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : hasNextPage ? (
                  <span className="text-xs text-muted-foreground">
                    Scroll for more
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    You&apos;ve reached the end ·{" "}
                    {allPosts.length} posts loaded
                  </span>
                )}
              </div>
            )}

            {!isLoading && allPosts.length === 0 && !isError && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-xl font-semibold text-foreground">
                  No posts yet
                </p>
                <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                  Trigger a refresh from the{" "}
                  <a href="/admin" className="text-primary hover:underline">
                    admin panel
                  </a>{" "}
                  to fetch the latest AI news.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
