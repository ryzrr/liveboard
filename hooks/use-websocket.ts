"use client";

import { useState, useEffect, useRef } from "react";
import { getSocket, type MetricUpdate } from "@/lib/socket";
import type { StatCard } from "@/lib/types";

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

  // Rolling history for sparklines — kept in a ref so state updates don't
  // reset it on every render
  const history = useRef<{
    requests: number[];
    errorRate: number[];
    p99: number[];
  }>({ requests: [], errorRate: [], p99: [] });

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

      const prev = {
        requests:  h.requests.at(-2)  ?? update.requests,
        errorRate: h.errorRate.at(-2) ?? update.errorRate,
        p99:       h.p99.at(-2)       ?? update.p99,
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
          value:      Math.round(update.p99 * 0.6), // approximation until avg is in payload
          unit:       "ms",
          delta:      0,
          deltaLabel: "estimated",
          sparkline:  h.p99.map((v) => v * 0.6),
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
