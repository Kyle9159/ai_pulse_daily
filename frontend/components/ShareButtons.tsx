// components/ShareButtons.tsx – Client-side share buttons for post detail pages

"use client";

import { useState } from "react";
import { Check, Copy, Linkedin, Twitter } from "lucide-react";

interface Props {
  title: string;
  url: string;
}

export function ShareButtons({ title, url }: Props) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}&via=aipulsedaily`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className="mt-4 flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Share:</span>

      <button
        onClick={copyLink}
        title="Copy link"
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        {copied ? (
          <>
            <Check className="h-3 w-3 text-green-500" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" />
            Copy link
          </>
        )}
      </button>

      <a
        href={tweetUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Share on X / Twitter"
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <Twitter className="h-3 w-3" />
        Tweet
      </a>

      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Share on LinkedIn"
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <Linkedin className="h-3 w-3" />
        LinkedIn
      </a>
    </div>
  );
}
