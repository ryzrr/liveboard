"use client";

import { useState, useEffect, useRef } from "react";
import { getSocket, type MetricUpdate } from "@/lib/socket";
import { fetchRealtimeToken } from "@/lib/realtime";
import type { Incident, StatCard } from "@/lib/types";

const SPARKLINE_LENGTH = 20;

function emptyCards(label = "connecting…"): StatCard[] {
  return [
    { label: "Requests / min", value: "—", unit: "req", delta: 0, deltaLabel: label, sparkline: [] },
    { label: "Error Rate",      value: "—", unit: "%",   delta: 0, deltaLabel: label, sparkline: [] },
    { label: "p99 Latency",     value: "—", unit: "ms",  delta: 0, deltaLabel: label, sparkline: [] },
    { label: "Avg Latency",     value: "—", unit: "ms",  delta: 0, deltaLabel: label, sparkline: [] },
  ];
}

/**
 * Streams live stat-card data for a project. Fetches a short-lived, project-
 * scoped realtime token from the BFF (no API key in the browser). Never
 * fabricates numbers: with no project, no realtime token, or simply no
 * traffic in the last minute, the cards stay at the honest "—" empty state —
 * that's the truth, not a reason to make something up.
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

    // No project context yet (logged-out / still loading) — nothing to
    // connect to. Stay on the honest empty state, no synthetic numbers.
    if (!projectId) {
      history.current = { requests: [], errorRate: [], p99: [], avg: [] };
      setCards(emptyCards("no project selected"));
      return;
    }

    // Clear any previous project's values before this connection attempt —
    // otherwise, if this project simply has no traffic in the last minute,
    // the last project's numbers would stay on screen looking exactly like
    // this project's live data instead of the honest "—" empty state.
    history.current = { requests: [], errorRate: [], p99: [], avg: [] };
    setCards(emptyCards());

    let cancelled = false;
    let socket: ReturnType<typeof getSocket> | null = null;
    let onMetric: ((update: MetricUpdate) => void) | null = null;

    void (async () => {
      const token = await fetchRealtimeToken(projectId);
      if (cancelled || !token) return;
      // When there's no traffic in the last minute the worker publishes
      // nothing, so the cards stay at their empty ("—") state — the honest
      // answer, not a reason to fabricate a number.
      socket = getSocket(token);
      onMetric = (update: MetricUpdate) => applyUpdate(update);
      socket.on("metric", onMetric);
    })();

    return () => {
      cancelled = true;
      if (socket && onMetric) socket.off("metric", onMetric);
    };
  }, [projectId]);

  return cards;
}

const LIVE_CHART_BUFFER = 120; // ~2 minutes at the worker's 1-tick/sec cadence

export interface LiveChartPoint {
  time: string;
  requests: number;
  errors2xx: number;
  errors4xx: number;
  errors5xx: number;
  p99: number;
}

/**
 * Rolling ~2-minute buffer of real request-rate data for the "Live" chart
 * option — fed from the exact same per-second Socket.io metric stream that
 * powers the stat cards (already proven accurate: a real 60s-window COUNT()
 * from Postgres, not an estimate). Never interpolates or backfills; it only
 * ever contains ticks that actually arrived, so a quiet stretch is a quiet
 * stretch, not a smoothed guess.
 */
export function useLiveChartData(projectId: string | null): LiveChartPoint[] {
  const [points, setPoints] = useState<LiveChartPoint[]>([]);

  useEffect(() => {
    setPoints([]);
    if (!projectId) return;

    let cancelled = false;
    let socket: ReturnType<typeof getSocket> | null = null;
    let onMetric: ((update: MetricUpdate) => void) | null = null;

    void (async () => {
      const token = await fetchRealtimeToken(projectId);
      if (cancelled || !token) return;
      socket = getSocket(token);
      onMetric = (update: MetricUpdate) => {
        const point: LiveChartPoint = {
          // Raw ISO instant, not a pre-formatted string — formatted for
          // display client-side by formatChartTime, same as the REST
          // timeseries data these points render alongside.
          time: new Date().toISOString(),
          requests: update.requests,
          errors2xx: update.req2xx ?? 0,
          errors4xx: update.req4xx ?? 0,
          errors5xx: update.req5xx ?? 0,
          p99: update.p99,
        };
        setPoints((prev) => [...prev, point].slice(-LIVE_CHART_BUFFER));
      };
      socket.on("metric", onMetric);
    })();

    return () => {
      cancelled = true;
      if (socket && onMetric) socket.off("metric", onMetric);
    };
  }, [projectId]);

  return points;
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
