"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { formatMs, getMethodColor } from "@/lib/utils";
import type { Endpoint } from "@/lib/types";

interface EndpointComparisonProps {
  endpoints: [Endpoint, Endpoint];
  onClose: () => void;
}

function generateLatencyHistory(p99: number) {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    value: Math.max(10, p99 + Math.round((Math.random() - 0.5) * p99 * 0.4)),
  }));
}

const COLORS = ["#378ADD", "#A855F7"] as const;

export function EndpointComparison({ endpoints, onClose }: EndpointComparisonProps) {
  const [a, b] = endpoints;

  const chartData = useMemo(() => {
    const aHistory = generateLatencyHistory(a.p99);
    const bHistory = generateLatencyHistory(b.p99);
    return aHistory.map((pt, i) => ({
      hour: pt.hour,
      [a.route]: pt.value,
      [b.route]: bHistory[i]!.value,
    }));
  }, [a, b]);

  const metrics: { label: string; aVal: string; bVal: string; winner: "a" | "b" | "tie" }[] = [
    {
      label: "p50",
      aVal: formatMs(a.p50),
      bVal: formatMs(b.p50),
      winner: a.p50 < b.p50 ? "a" : b.p50 < a.p50 ? "b" : "tie",
    },
    {
      label: "p99",
      aVal: formatMs(a.p99),
      bVal: formatMs(b.p99),
      winner: a.p99 < b.p99 ? "a" : b.p99 < a.p99 ? "b" : "tie",
    },
    {
      label: "Error Rate",
      aVal: `${a.errorRate.toFixed(1)}%`,
      bVal: `${b.errorRate.toFixed(1)}%`,
      winner: a.errorRate < b.errorRate ? "a" : b.errorRate < a.errorRate ? "b" : "tie",
    },
    {
      label: "Health",
      aVal: String(a.healthScore),
      bVal: String(b.healthScore),
      winner: a.healthScore > b.healthScore ? "a" : b.healthScore > a.healthScore ? "b" : "tie",
    },
  ];

  return (
    <div className="rounded-lg border border-[#1E1E1E] bg-[#111] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {endpoints.map((ep, i) => (
            <div key={ep.id} className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
              <span className="text-[10px] font-bold font-mono" style={{ color: getMethodColor(ep.method) }}>
                {ep.method}
              </span>
              <span className="text-xs font-mono text-[#F5F5F5]">{ep.route}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="text-[#808080] hover:text-[#888] transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Metric comparison grid */}
      <div className="grid grid-cols-4 gap-2">
        {metrics.map((m) => (
          <div key={m.label} className="rounded border border-[#1A1A1A] bg-[#0D0D0D] p-3">
            <p className="text-[10px] text-[#808080] uppercase tracking-wider mb-2">{m.label}</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#949494]">A</span>
                <span
                  className="text-xs font-mono font-semibold"
                  style={{ color: m.winner === "a" ? "#22C55E" : "#F5F5F5" }}
                >
                  {m.aVal}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#949494]">B</span>
                <span
                  className="text-xs font-mono font-semibold"
                  style={{ color: m.winner === "b" ? "#22C55E" : "#F5F5F5" }}
                >
                  {m.bVal}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* p99 Latency chart */}
      <div>
        <p className="text-[10px] text-[#808080] uppercase tracking-wider mb-3">p99 Latency — 24h</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#808080" }} interval={5} />
              <YAxis tick={{ fontSize: 9, fill: "#808080" }} tickFormatter={(v) => `${v}ms`} width={45} />
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid #1E1E1E", borderRadius: 6 }}
                labelStyle={{ color: "#949494", fontSize: 10 }}
                itemStyle={{ fontSize: 11 }}
                formatter={(v) => `${String(v)}ms`}
              />
              <Legend wrapperStyle={{ fontSize: 10, color: "#949494" }} />
              <Line dataKey={a.route} stroke={COLORS[0]} dot={false} strokeWidth={1.5} />
              <Line dataKey={b.route} stroke={COLORS[1]} dot={false} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
