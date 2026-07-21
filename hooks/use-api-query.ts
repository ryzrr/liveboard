"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useProjects } from "@/components/providers/project-provider";

// Stable empty-array reference — reused across renders so consumers depending
// on the result don't see a new [] each render (which would loop any effect
// keyed on it). Exported so callers can pass the same reference as `empty`.
export const EMPTY_LIST: readonly never[] = [];

/**
 * Generic hook for REST API data.
 *
 * Never fabricates data. `data` is `empty` while loading, with no active
 * project, or on a fetch error — real data only ever comes from a real,
 * successful fetch. Callers render their own honest empty/loading state from
 * `loading` + an empty `data`, rather than this hook ever guessing at numbers.
 *
 * - Refetches whenever `path` or serialised `params` change.
 * - Polls every `pollMs` milliseconds if provided.
 */
export function useApiQuery<T>(
  path: string,
  params: Record<string, string>,
  empty: T,
  transform?: (raw: unknown) => T,
  pollMs?: number,
): { data: T; loading: boolean; refetch: () => void } {
  const { activeProject } = useProjects();
  const projectId = activeProject?.id ?? null;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  // Scope every request to the active project (the BFF verifies membership).
  const effectiveParams = projectId ? { ...params, project: projectId } : params;

  // Stable string key — avoids object-reference churn in the dependency array
  const paramKey = Object.entries(effectiveParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const refetch = () => setTick((t) => t + 1);

  // Main fetch — runs on mount, param change, or manual refetch tick
  useEffect(() => {
    let active = true;
    // Only clear data (show empty) when params actually changed, not on poll ticks
    if (tick === 0) {
      setData(null);
      setLoading(true);
    }

    // No active project yet (still loading auth/project state) — nothing to
    // fetch. Stay on the honest empty state rather than a scopeless call.
    if (!projectId) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    apiFetch<unknown>(path, effectiveParams)
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
  }, [path, paramKey, tick, projectId]);

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

  return { data: data ?? empty, loading, refetch };
}
