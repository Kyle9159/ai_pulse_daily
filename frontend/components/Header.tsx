// components/Header.tsx – Site header with logo and nav

import Link from "next/link";
import { Bookmark, Rss, Zap } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <Zap className="h-4 w-4 text-white" />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">
            AIPulse<span className="text-primary"> Daily</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-0.5">
          {/* "Feed" text – hide on xs, show on sm+ */}
          <Link
            href="/"
            className="hidden rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors sm:block"
          >
            Feed
          </Link>
          <Link
            href="/bookmarks"
            className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Saved posts"
          >
            <Bookmark className="h-4 w-4" />
          </Link>
          <a
            href="/feed.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="RSS feed"
          >
            <Rss className="h-4 w-4" />
          </a>
          {/* "Admin" link intentionally removed from public nav.
              Navigate to /admin directly when needed. */}
        </nav>
      </div>
    </header>
  );
}
