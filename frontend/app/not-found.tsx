// app/not-found.tsx

import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="flex flex-col items-center justify-center py-40 text-center px-4">
        <p className="text-7xl font-bold text-primary mb-4">404</p>
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Page not found
        </h1>
        <p className="text-muted-foreground mb-8 max-w-sm">
          This post may have been removed or the URL is incorrect.
        </p>
        <Button asChild>
          <Link href="/">Back to feed</Link>
        </Button>
      </main>
    </div>
  );
}
