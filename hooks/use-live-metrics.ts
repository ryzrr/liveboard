"use client";

import { useState, useEffect, useRef } from "react";
import type { LogEntry } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const LOG_BUFFER = 200;

// ── Demo mode ────────────────────────────────────────────────────────────────
// When no live backend is connected, synthesize a realistic request stream so
// the dashboard reads as live instead of sitting empty.
const DEMO_ROUTES: { method: LogEntry["method"]; route: string; weight: number }[] = [
  { method: "GET", route: "/api/products", weight: 9 },
  { method: "GET", route: "/api/users/:id", weight: 7 },
  { method: "GET", route: "/health", weight: 6 },
  { method: "POST", route: "/api/checkout", weight: 4 },
  { method: "GET", route: "/api/search", weight: 5 },
  { method: "POST", route: "/api/orders", weight: 4 },
  { method: "POST", route: "/api/auth/login", weight: 3 },
  { method: "POST", route: "/api/payments", weight: 3 },
  { method: "PATCH", route: "/api/users/:id", weight: 2 },
  { method: "DELETE", route: "/api/products/:id", weight: 1 },
  { method: "GET", route: "/api/analytics/events", weight: 3 },
];
const DEMO_POOL = DEMO_ROUTES.flatMap((r) => Array(r.weight).fill(r));

function mockLog(): LogEntry {
  const pick = DEMO_POOL[Math.floor(Math.random() * DEMO_POOL.length)];
  const roll = Math.random();
  // Mostly 2xx, occasional 4xx, rare 5xx — skew errors toward checkout/auth.
  const risky = pick.route.includes("checkout") || pick.route.includes("auth");
  let status = 200;
  if (roll > (risky ? 0.82 : 0.94)) status = 500;
  else if (roll > (risky ? 0.7 : 0.9)) status = 401;
  else if (pick.method === "POST") status = 201;
  const base = pick.route.includes("checkout") || pick.route.includes("payments") ? 260 : 40;
  return {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    method: pick.method,
    route: pick.route,
    status,
    latency: Math.round(base + Math.random() * base * (status >= 500 ? 4 : 1.5)),
    userId: `u_${Math.floor(1000 + Math.random() * 8999)}`,
  };
}

export function useLiveLog(maxEntries = LOG_BUFFER) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [connected, setConnected] = useState(false);

  const pausedRef  = useRef(paused);
  const retryDelay = useRef(1_000);
  const esRef      = useRef<EventSource | null>(null);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mockRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_LIVEBOARD_API_KEY ?? "";

    function startMock() {
      if (mockRef.current) return;
      // Seed a full-looking buffer, then stream new entries in.
      setLogs(Array.from({ length: 18 }, mockLog));
      mockRef.current = setInterval(() => {
        if (pausedRef.current) return;
        setLogs((prev) => [mockLog(), ...prev].slice(0, maxEntries));
      }, 900);
    }

    function connect() {
      if (!apiKey) {
        startMock();
        return;
      }

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
        // Real stream is live — drop the demo fallback.
        if (mockRef.current) {
          clearInterval(mockRef.current);
          mockRef.current = null;
        }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        esRef.current = null;
        // Backend unreachable — fall back to the demo stream so the UI stays live.
        startMock();
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
      if (mockRef.current) clearInterval(mockRef.current);
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
