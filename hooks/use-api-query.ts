"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

/**
 * Generic hook for REST API data.
 * - Shows `fallback` (mock) while loading or on error.
 * - Swaps to real data once the fetch succeeds.
 * - Refetches whenever `path` or serialised `params` change.
 */
export function useApiQuery<T>(
  path: string,
  params: Record<string, string>,
  fallback: T,
  transform?: (raw: unknown) => T,
): { data: T; loading: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  // Stable string key — avoids object-reference churn in the dependency array
  const paramKey = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  useEffect(() => {
    let active = true;
    setLoading(true);

    apiFetch<unknown>(path, params)
      .then((raw) => {
        if (!active) return;
        setData(transform ? transform(raw) : (raw as T));
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false); // keep `data` as-is → fallback is served
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, paramKey]);

  return { data: data ?? fallback, loading };
}
