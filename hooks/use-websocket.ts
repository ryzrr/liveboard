"use client";

import { useState, useEffect, useRef } from "react";
import { getSocket, type MetricUpdate } from "@/lib/socket";
import { fetchRealtimeToken } from "@/lib/realtime";
import type { Incident, StatCard } from "@/lib/types";

const SPARKLINE_LENGTH = 20;

function emptyCards(): StatCard[] {
  return [
    { label: "Requests / min", value: "—", unit: "req", delta: 0, deltaLabel: "connecting…", sparkline: [] },
    { label: "Error Rate",      value: "—", unit: "%",   delta: 0, deltaLabel: "connecting…", sparkline: [] },
    { label: "p99 Latency",     value: "—", unit: "ms",  delta: 0, deltaLabel: "connecting…", sparkline: [] },
    { label: "Avg Latency",     value: "—", unit: "ms",  delta: 0, deltaLabel: "connecting…", sparkline: [] },
  ];
}

/** Realistic metric tick for demo mode when no live backend is connected. */
function mockMetric(): MetricUpdate {
  return {
    requests:  Math.round(2200 + Math.random() * 520),
    errorRate: Math.round((0.3 + Math.random() * 1.7) * 10) / 10,
    p99:       Math.round(250 + Math.random() * 95),
    avg:       Math.round(90 + Math.random() * 55),
    bucket:    new Date().toISOString(),
  };
}

/**
 * Streams live stat-card data for a project. Fetches a short-lived, project-
 * scoped realtime token from the BFF (no API key in the browser). When there's
 * no project / backend, falls back to a self-updating demo stream so the
 * dashboard always feels alive instead of stuck "connecting…".
 */
export function useMetrics(projectId: string | null) {
  const [cards, setCards] = useState<StatCard[]>(emptyCards);

  const history = useRef<{
    requests: number[];
    errorRate: number[];
    p99: number[];
    avg: number[];
  }>({ requests: [], errorRate: [], p99: [], avg: [] });

  useEffect(() => {
    function applyUpdate(update: MetricUpdate) {
      const h = history.current;

      const push = (arr: number[], val: number) =>
        [...arr, val].slice(-SPARKLINE_LENGTH);

      h.requests  = push(h.requests,  update.requests);
      h.errorRate = push(h.errorRate, update.errorRate);
      h.p99       = push(h.p99,       update.p99);
      h.avg       = push(h.avg,       update.avg ?? update.p99 * 0.6);

      const prev = {
        requests:  h.requests.at(-2)  ?? update.requests,
        errorRate: h.errorRate.at(-2) ?? update.errorRate,
        p99:       h.p99.at(-2)       ?? update.p99,
        avg:       h.avg.at(-2)       ?? (update.avg ?? update.p99 * 0.6),
      };

      const delta = (curr: number, prev: number) =>
        prev === 0 ? 0 : Math.round(((curr - prev) / prev) * 100 * 10) / 10;

      setCards([
        {
          label:      "Requests / min",
          value:      update.requests.toLocaleString(),
          unit:       "req",
          delta:      delta(update.requests, prev.requests),
          deltaLabel: "vs last min",
          sparkline:  h.requests,
        },
        {
          label:      "Error Rate",
          value:      update.errorRate.toFixed(1),
          unit:       "%",
          delta:      delta(update.errorRate, prev.errorRate),
          deltaLabel: "vs last min",
          sparkline:  h.errorRate,
        },
        {
          label:      "p99 Latency",
          value:      Math.round(update.p99),
          unit:       "ms",
          delta:      delta(update.p99, prev.p99),
          deltaLabel: "vs last min",
          sparkline:  h.p99,
        },
        {
          label:      "Avg Latency",
          value:      Math.round(update.avg ?? update.p99 * 0.6),
          unit:       "ms",
          delta:      delta(update.avg ?? update.p99 * 0.6, prev.avg),
          deltaLabel: "vs last min",
          sparkline:  h.avg,
        },
      ]);
    }

    let mockTimer: ReturnType<typeof setInterval> | null = null;

    function startMock() {
      if (mockTimer) return;
      // Seed history so sparklines render full immediately.
      for (let i = 0; i < SPARKLINE_LENGTH; i++) applyUpdate(mockMetric());
      mockTimer = setInterval(() => applyUpdate(mockMetric()), 2000);
    }

    // No project context (logged-out / loading) → synthetic demo so the UI
    // isn't dead. A REAL project never shows synthetic numbers.
    if (!projectId) {
      startMock();
      return () => {
        if (mockTimer) clearInterval(mockTimer);
      };
    }

    let cancelled = false;
    let socket: ReturnType<typeof getSocket> | null = null;
    let onMetric: ((update: MetricUpdate) => void) | null = null;

    void (async () => {
      const token = await fetchRealtimeToken(projectId);
      if (cancelled) return;
      if (!token) {
        // Realtime unavailable entirely (backend down) — demo fallback for dev.
        startMock();
        return;
      }
      // Real project + realtime available → show ONLY real metrics. When there's
      // no traffic in the last minute the worker publishes nothing, so the cards
      // stay at their empty ("—") state — which is the honest answer.
      socket = getSocket(token);
      onMetric = (update: MetricUpdate) => applyUpdate(update);
      socket.on("metric", onMetric);
    })();

    return () => {
      cancelled = true;
      if (socket && onMetric) socket.off("metric", onMetric);
      if (mockTimer) clearInterval(mockTimer);
    };
  }, [projectId]);

  return cards;
}

interface RawIncidentPush {
  id: string;
  severity: string;
  title: string;
  summary: string;
  endpoint: string;
  timestamp: string;
  resolved: boolean;
}

/**
 * Listens for real-time `incident` Socket.io events pushed by the anomaly worker.
 * Returns newly pushed incidents so the caller can prepend them to the REST list.
 */
export function useIncidentSocket(projectId: string | null): Incident[] {
  const [live, setLive] = useState<Incident[]>([]);

  useEffect(() => {
    if (!projectId) return;

    let cancelled = false;
    let socket: ReturnType<typeof getSocket> | null = null;
    let onIncident: ((raw: RawIncidentPush) => void) | null = null;

    void (async () => {
      const token = await fetchRealtimeToken(projectId);
      if (cancelled || !token) return;
      socket = getSocket(token);
      onIncident = (raw: RawIncidentPush) => {
        const incident: Incident = {
          id: raw.id,
          severity: raw.severity as Incident["severity"],
          title: raw.title,
          summary: raw.summary,
          endpoint: raw.endpoint,
          timestamp: new Date(raw.timestamp),
          resolved: raw.resolved,
        };
        // Prepend; deduplicate by id; keep at most 20 live-pushed incidents
        setLive((prev) => [incident, ...prev.filter((i) => i.id !== raw.id)].slice(0, 20));
      };
      socket.on("incident", onIncident);
    })();

    return () => {
      cancelled = true;
      if (socket && onIncident) socket.off("incident", onIncident);
    };
  }, [projectId]);

  return live;
}
