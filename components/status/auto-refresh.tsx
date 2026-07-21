"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Periodically re-runs the current route's Server Component with fresh data
 * (no client-side fetch, no session) — backs the "updates in real time" claim
 * on the public status page. */
export function AutoRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
