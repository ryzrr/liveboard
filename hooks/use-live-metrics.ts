"use client";

import { useState, useEffect, useRef } from "react";
import type { LogEntry } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const LOG_BUFFER = 200;

export function useLiveLog(maxEntries = LOG_BUFFER) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [connected, setConnected] = useState(false);

  const pausedRef  = useRef(paused);
  const retryDelay = useRef(1_000);
  const esRef      = useRef<EventSource | null>(null);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_LIVEBOARD_API_KEY ?? "";

    function connect() {
      if (!apiKey) return;

      const url = `${API_URL}/v1/stream/logs?api_key=${encodeURIComponent(apiKey)}`;
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
        setConnected(true);
        retryDelay.current = 1_000;
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        esRef.current = null;
        // Exponential back-off: 1 s → 2 s → 4 s → 8 s
        const delay = retryDelay.current;
        retryDelay.current = Math.min(delay * 2, 8_000);
        timerRef.current = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxEntries]);

  return { logs, paused, setPaused, connected };
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
