"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-client";

/**
 * Generic hook for REST API data.
 * - Shows `fallback` (mock) while loading or on error.
 * - Swaps to real data once the fetch succeeds.
 * - Refetches whenever `path` or serialised `params` change.
 * - Polls every `pollMs` milliseconds if provided.
 */
export function useApiQuery<T>(
  path: string,
  params: Record<string, string>,
  fallback: T,
  transform?: (raw: unknown) => T,
  pollMs?: number,
): { data: T; loading: boolean; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  // Stable string key — avoids object-reference churn in the dependency array
  const paramKey = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const refetch = () => setTick((t) => t + 1);

  // Main fetch — runs on mount, param change, or manual refetch tick
  useEffect(() => {
    let active = true;
    // Only clear data (show fallback) when params actually changed, not on poll ticks
    if (tick === 0) {
      setData(null);
      setLoading(true);
    }

    apiFetch<unknown>(path, params)
      .then((raw) => {
        if (!active) return;
        setData(transform ? transform(raw) : (raw as T));
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, paramKey, tick]);

  // Reset tick (and clear stale data) whenever the query params change
  const prevParamKey = useRef(paramKey);
  useEffect(() => {
    if (prevParamKey.current !== paramKey) {
      prevParamKey.current = paramKey;
      setData(null);
      setTick(0);
    }
  }, [paramKey]);

  // Polling interval
  useEffect(() => {
    if (!pollMs) return;
    const id = setInterval(() => setTick((t) => t + 1), pollMs);
    return () => clearInterval(id);
  }, [pollMs]);

  return { data: data ?? fallback, loading, refetch };
}
