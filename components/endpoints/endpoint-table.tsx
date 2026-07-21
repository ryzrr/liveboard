"use client";

import { useState } from "react";
import { ArrowUpDown, ChevronRight } from "lucide-react";
import { getMethodColor, getErrorRateColor, getHealthColor, formatMs, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Endpoint } from "@/lib/types";

interface EndpointTableProps {
  endpoints: Endpoint[];
  onSelect: (endpoint: Endpoint) => void;
  selected?: string;
  compareSelected?: string[];
}

type SortKey = keyof Pick<Endpoint, "requests24h" | "errorRate" | "p50" | "p95" | "p99" | "healthScore">;

export function EndpointTable({ endpoints, onSelect, selected, compareSelected = [] }: EndpointTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("requests24h");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = [...endpoints].sort((a, b) =>
    sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      className="flex items-center gap-1 text-[10px] font-medium text-[#808080] uppercase tracking-wider hover:text-[#888] transition-colors"
      onClick={() => toggleSort(k)}
    >
      {label}
      <ArrowUpDown className={cn("h-2.5 w-2.5", sortKey === k && "text-blue")} />
    </button>
  );

  return (
    <div className="rounded-lg border border-[#1E1E1E] bg-[#111111] overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_80px_36px] gap-2 px-4 py-2.5 border-b border-[#1E1E1E]">
        <span className="text-[10px] font-medium text-[#808080] uppercase tracking-wider">Endpoint</span>
        <SortBtn k="requests24h" label="Requests 24h" />
        <SortBtn k="errorRate" label="Error Rate" />
        <SortBtn k="p50" label="p50" />
        <SortBtn k="p95" label="p95" />
        <SortBtn k="p99" label="p99" />
        <span className="text-[10px] font-medium text-[#808080] uppercase tracking-wider">Health</span>
        <span />
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#161616]">
        {sorted.map((ep) => (
          <button
            key={ep.id}
            onClick={() => onSelect(ep)}
            className={cn(
              "w-full grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_80px_36px] gap-2 px-4 py-2.5 items-center text-left hover:bg-[#151515] transition-colors",
              selected === ep.id && "bg-blue-dim border-l-2 border-l-blue",
              compareSelected.includes(ep.id) && "bg-[#0D1520] border-l-2 border-l-[#A855F7]"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="text-[10px] font-bold font-mono flex-shrink-0"
                style={{ color: getMethodColor(ep.method) }}
              >
                {ep.method}
              </span>
              <span className="text-xs text-[#F5F5F5] font-mono truncate">{ep.route}</span>
            </div>

            <span className="text-xs text-[#888] tabular-nums">{formatNumber(ep.requests24h)}</span>

            <span
              className="text-xs font-medium tabular-nums"
              style={{ color: getErrorRateColor(ep.errorRate) }}
            >
              {ep.errorRate.toFixed(1)}%
            </span>

            <span className="text-xs text-[#888] tabular-nums font-mono">{formatMs(ep.p50)}</span>
            <span className="text-xs text-[#888] tabular-nums font-mono">{formatMs(ep.p95)}</span>
            <span className="text-xs text-[#888] tabular-nums font-mono">{formatMs(ep.p99)}</span>

            <div className="flex items-center gap-1.5">
              <div
                className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: getHealthColor(ep.healthScore) }}
              />
              <span
                className="text-xs font-semibold tabular-nums"
                style={{ color: getHealthColor(ep.healthScore) }}
              >
                {ep.healthScore}
              </span>
            </div>

            <ChevronRight className="h-3.5 w-3.5 text-[#808080]" />
          </button>
        ))}
        {sorted.length === 0 && (
          <div className="p-6 text-center text-[10px] text-[#808080]">
            No endpoints have received traffic in this range yet.
          </div>
        )}
      </div>
    </div>
  );
}
