"use client";

import { useState, useEffect, useRef } from "react";
import { getSocket, type MetricUpdate } from "@/lib/socket";
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

/**
 * Connects to the Socket.io server and returns live stat-card data.
 * Falls back to empty/placeholder cards while the connection is establishing.
 */
export function useMetrics(apiKey: string | null) {
  const [cards, setCards] = useState<StatCard[]>(emptyCards);

  const history = useRef<{
    requests: number[];
    errorRate: number[];
    p99: number[];
    avg: number[];
  }>({ requests: [], errorRate: [], p99: [], avg: [] });

  useEffect(() => {
    if (!apiKey) return;

    const socket = getSocket(apiKey);

    function onMetric(update: MetricUpdate) {
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
          value:      update.requests,
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

    socket.on("metric", onMetric);
    return () => {
      socket.off("metric", onMetric);
    };
  }, [apiKey]);

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
export function useIncidentSocket(apiKey: string | null): Incident[] {
  const [live, setLive] = useState<Incident[]>([]);

  useEffect(() => {
    if (!apiKey) return;

    const socket = getSocket(apiKey);

    function onIncident(raw: RawIncidentPush) {
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
    }

    socket.on("incident", onIncident);
    return () => {
      socket.off("incident", onIncident);
    };
  }, [apiKey]);

  return live;
}
