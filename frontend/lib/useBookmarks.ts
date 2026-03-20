// lib/useBookmarks.ts – localStorage bookmark state

"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "aipulse_bookmarks";

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function useBookmarks() {
  const [ids, setIds] = useState<string[]>([]);

  // Hydrate from localStorage after mount
  useEffect(() => {
    setIds(readIds());
  }, []);

  const isBookmarked = useCallback(
    (id: string) => ids.includes(id),
    [ids],
  );

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      writeIds(next);
      return next;
    });
  }, []);

  return { ids, count: ids.length, isBookmarked, toggle };
}
