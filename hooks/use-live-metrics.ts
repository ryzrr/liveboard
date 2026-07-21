"use client";

import { useState, useEffect, useRef } from "react";
import { useProjects } from "@/components/providers/project-provider";
import { fetchRealtimeToken } from "@/lib/realtime";
import type { LogEntry } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const LOG_BUFFER = 200;

export type LiveLogStatus = "no-project" | "connecting" | "live" | "reconnecting";

/**
 * Streams real request-log entries over SSE for a project. Never fabricates
 * rows: with no project, no realtime token, or a dropped connection, `logs`
 * simply stays whatever real entries have arrived (possibly empty) and
 * `status` tells the caller what's actually going on, so the UI can show an
 * honest "connecting…" / "reconnecting…" / "no requests yet" state instead
 * of a fake-but-convincing feed.
 */
export function useLiveLog(maxEntries = LOG_BUFFER) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState<LiveLogStatus>("connecting");

  const pausedRef  = useRef(paused);
  const retryDelay = useRef(1_000);
  const esRef      = useRef<EventSource | null>(null);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { activeProject } = useProjects();
  const projectId = activeProject?.id ?? null;

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    let cancelled = false;
    let hasConnectedOnce = false;

    async function connect() {
      if (cancelled) return;
      if (!projectId) {
        setStatus("no-project");
        return;
      }
      // Short-lived, project-scoped realtime token (Phase 8.4) — refetched on
      // each (re)connect so an expired token self-heals.
      const token = await fetchRealtimeToken(projectId);
      if (cancelled) return;
      if (!token) {
        setStatus(hasConnectedOnce ? "reconnecting" : "connecting");
        const delay = retryDelay.current;
        retryDelay.current = Math.min(delay * 2, 8_000);
        timerRef.current = setTimeout(connect, delay);
        return;
      }

      const url = `${API_URL}/v1/stream/logs?token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);
      esRef.current = es;

      es.addEventListener("log", (e: MessageEvent) => {
        if (pausedRef.current) return;
        try {
          const raw = JSON.parse(e.data);
          const entry: LogEntry = {
            id:        e.lastEventId || crypto.randomUUID(),
            timestamp: new Date(raw.timestamp ?? Date.now()),
            method:    raw.method ?? "GET",
            route:     raw.route ?? "/",
            status:    raw.status_code ?? 200,
            latency:   raw.duration_ms ?? 0,
            userId:    raw.user_id ?? "—",
          };
          setLogs((prev) => [entry, ...prev].slice(0, maxEntries));
          retryDelay.current = 1_000;
        } catch {
          // ignore parse errors
        }
      });

      es.onopen = () => {
        hasConnectedOnce = true;
        setStatus("live");
        retryDelay.current = 1_000;
      };

      es.onerror = () => {
        setStatus(hasConnectedOnce ? "reconnecting" : "connecting");
        es.close();
        esRef.current = null;
        // Exponential back-off: 1 s → 2 s → 4 s → 8 s. No fake data in the
        // meantime — the log just stops growing until the stream recovers.
        const delay = retryDelay.current;
        retryDelay.current = Math.min(delay * 2, 8_000);
        timerRef.current = setTimeout(connect, delay);
      };
    }

    setLogs([]);
    void connect();

    return () => {
      cancelled = true;
      esRef.current?.close();
      esRef.current = null;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxEntries, projectId]);

  return { logs, paused, setPaused, status, connected: status === "live" };
}

export function useLiveCounter(base: number, variance = 0.05) {
  const [value, setValue] = useState(base);

  useEffect(() => {
    const interval = setInterval(() => {
      const delta = (Math.random() - 0.5) * 2 * variance * base;
      setValue((prev) => Math.max(0, Math.round((prev + delta) * 10) / 10));
    }, 3_000);
    return () => clearInterval(interval);
  }, [base, variance]);

  return value;
}
