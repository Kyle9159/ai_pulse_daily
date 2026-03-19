// app/error.tsx – Global error boundary (client component)

"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="flex flex-col items-center justify-center py-40 text-center px-4">
        <p className="text-5xl font-bold text-red-400 mb-4">⚠</p>
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mb-8 max-w-sm text-sm">
          {error.message ?? "An unexpected error occurred."}
        </p>
        <Button onClick={reset}>Try again</Button>
      </main>
    </div>
  );
}
