// components/MarkdownSection.tsx – Renders Grok markdown with syntax highlighting

"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  emoji: string;
  content: string | null | undefined;
  accent?: boolean;
}

export function MarkdownSection({ title, emoji, content, accent }: Props) {
  if (!content) return null;

  return (
    <section
      className={cn(
        "mb-8 rounded-lg border p-6",
        accent
          ? "border-primary/20 bg-primary/5"
          : "border-border bg-card",
      )}
    >
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
        <span>{emoji}</span>
        {title}
      </h2>
      <div className="prose-aipulse">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    </section>
  );
}
