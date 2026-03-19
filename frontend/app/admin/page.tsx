// app/admin/page.tsx – Password-protected admin panel to trigger manual refresh

"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, RefreshCw, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { triggerRefresh } from "@/lib/api";

// Messages shown at different elapsed-time thresholds
const STAGES: { after: number; label: string }[] = [
  { after: 0,  label: "Fetching RSS feeds…" },
  { after: 8,  label: "Scraping article content…" },
  { after: 20, label: "Summarising with Grok…" },
  { after: 60, label: "Still summarising — Grok is working hard…" },
  { after: 120, label: "Almost there…" },
];

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [sinceHours, setSinceHours] = useState(48);
  const [result, setResult] = useState<{
    new_posts: number;
    errors: number;
  } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mutation = useMutation({
    mutationFn: () => triggerRefresh(password, sinceHours),
    onMutate: () => {
      setResult(null);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    },
    onSuccess: (data) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setResult(data);
      setPassword("");
    },
    onError: () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
  });

  // Clean up on unmount
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const stageLabel = mutation.isPending
    ? [...STAGES].reverse().find((s) => elapsed >= s.after)?.label ?? STAGES[0].label
    : null;

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-1 text-base font-semibold text-foreground">
            Trigger content refresh
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Fetches new posts from all RSS sources and runs them through Grok
            for summarisation.
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Admin password
              </label>
              <Input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Fetch posts published in last N hours
              </label>
              <Input
                type="number"
                min={1}
                max={720}
                value={sinceHours}
                onChange={(e) => setSinceHours(Number(e.target.value))}
              />
            </div>

            <Button
              onClick={() => mutation.mutate()}
              disabled={!password || mutation.isPending}
              className="gap-2"
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {mutation.isPending
                ? `Refreshing… ${formatElapsed(elapsed)}`
                : "Run refresh"}
            </Button>
          </div>

          {/* Stage progress indicator */}
          {stageLabel && (
            <div className="mt-4 flex items-center gap-2 rounded-md bg-muted/40 border border-border px-3 py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{stageLabel}</span>
            </div>
          )}

          {mutation.isError && (
            <div className="mt-4 rounded-md bg-red-900/20 border border-red-800/40 px-3 py-2 text-sm text-red-400">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Refresh failed."}
            </div>
          )}

          {result && (
            <div className="mt-4 flex items-start gap-2 rounded-md bg-green-900/20 border border-green-800/40 px-3 py-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
              <span className="text-sm text-green-400">
                Refresh complete — {result.new_posts} new post
                {result.new_posts !== 1 ? "s" : ""} added
                {result.errors > 0 && `, ${result.errors} error(s)`}.
              </span>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          The daily automatic refresh runs at 06:00 MT via APScheduler.
        </p>
      </main>
    </div>
  );
}

