// app/post/[id]/page.tsx – Detail view with Grok summary, how-to, business impact, rating

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, ExternalLink } from "lucide-react";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { StarRatingWidget } from "@/components/StarRating";
import { MarkdownSection } from "@/components/MarkdownSection";
import { ShareButtons } from "@/components/ShareButtons";
import { fetchPost } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.aipulsedaily.news";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const post = await fetchPost(id);
    return {
      title: post.title,
      description: post.teaser ?? post.summary?.slice(0, 160),
      openGraph: {
        title: post.title,
        description: post.teaser ?? undefined,
        url: `/post/${id}`,
      },
    };
  } catch {
    return { title: "Post not found" };
  }
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params;

  let post;
  try {
    post = await fetchPost(id);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* Back */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to feed
        </Link>

        {/* Meta */}
        <header className="mb-8">
          {post.is_sponsored && (
            <Badge variant="sponsored" className="mb-3">
              Sponsored
            </Badge>
          )}

          <h1 className="text-2xl font-bold leading-tight sm:text-3xl text-foreground">
            {post.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="font-medium text-secondary-foreground">
              {post.source}
            </span>
            <span>·</span>
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(post.published_at)}</span>
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-primary hover:underline"
            >
              Read original <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}

          {/* Share buttons */}
          <ShareButtons
            title={post.title}
            url={`${SITE_URL}/post/${post.id}`}
          />
        </header>

        {/* ── Summary ── */}
        <MarkdownSection title="Summary" emoji="📝" content={post.summary} />

        {/* ── How to Implement ── */}
        <MarkdownSection
          title="How to Implement"
          emoji="⚙️"
          content={post.how_to_implement}
          accent
        />

        {/* ── Business Impact ── */}
        <MarkdownSection
          title="Business Impact"
          emoji="📊"
          content={post.business_impact}
        />

        {/* ── Rating ── */}
        <section className="mt-10 rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Rate this post
          </h2>
          <StarRatingWidget
            postId={post.id}
            initial={{
              average: post.average_rating,
              count: post.rating_count,
            }}
          />
        </section>
      </main>
    </div>
  );
}
