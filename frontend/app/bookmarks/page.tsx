// app/bookmarks/page.tsx – View saved/bookmarked posts (client-side, localStorage)

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookmarkX, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { PostCard } from "@/components/PostCard";
import { useBookmarks } from "@/lib/useBookmarks";
import { fetchPost } from "@/lib/api";
import type { PostDetail } from "@/lib/types";

export default function BookmarksPage() {
  const { ids } = useBookmarks();
  const [posts, setPosts] = useState<PostDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(ids.map((id) => fetchPost(id).catch(() => null)))
      .then((results) =>
        setPosts(results.filter((p): p is PostDetail => p !== null)),
      )
      .finally(() => setLoading(false));
  }, [ids]);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to feed
          </Link>
          <h1 className="text-xl font-bold text-foreground">
            Saved Posts
            {ids.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({ids.length})
              </span>
            )}
          </h1>
        </div>

        {loading && (
          <div className="flex justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && ids.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <BookmarkX className="h-10 w-10 text-muted-foreground mb-4 opacity-40" />
            <p className="text-lg font-semibold text-foreground">
              No saved posts yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">
              Click the bookmark icon on any article card to save it here.
            </p>
            <Link
              href="/"
              className="mt-5 text-sm text-primary hover:underline"
            >
              Browse the feed →
            </Link>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {posts.map((post, idx) => (
              <PostCard key={post.id} post={post} index={idx} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
