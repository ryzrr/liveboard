"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Trace, TraceSpan } from "@/lib/types";

interface FlameGraphProps {
  trace: Trace;
  onSpanClick: (span: TraceSpan) => void;
  selectedSpan?: string;
  highlightCriticalPath?: boolean;
}

function computeCriticalPath(spans: TraceSpan[]): Set<string> {
  const childMap = new Map<string | undefined, TraceSpan[]>();
  for (const span of spans) {
    const key = span.parentId;
    if (!childMap.has(key)) childMap.set(key, []);
    childMap.get(key)!.push(span);
  }

  const criticalIds = new Set<string>();

  function walk(spanId: string | undefined): number {
    const children = childMap.get(spanId) ?? [];
    if (children.length === 0) {
      if (spanId) criticalIds.add(spanId);
      return 0;
    }
    let maxChildDuration = -1;
    let bestChild: TraceSpan | null = null;
    for (const child of children) {
      const subtreeDuration = child.duration + walk(child.id);
      if (subtreeDuration > maxChildDuration) {
        maxChildDuration = subtreeDuration;
        bestChild = child;
      }
    }
    if (bestChild) criticalIds.add(bestChild.id);
    if (spanId) criticalIds.add(spanId);
    return maxChildDuration;
  }

  const roots = spans.filter((s) => !s.parentId);
  for (const root of roots) walk(root.id);
  return criticalIds;
}

const SERVICE_COLORS: Record<string, string> = {
  "api-gateway": "#378ADD",
  "auth-service": "#A855F7",
  "product-service": "#22C55E",
  "payment-service": "#F59E0B",
  "db-postgres": "#6366F1",
  "cache-redis": "#EF4444",
};

export function FlameGraph({ trace, onSpanClick, selectedSpan, highlightCriticalPath }: FlameGraphProps) {
  const totalDuration = trace.totalDuration;
  const criticalPath = useMemo(
    () => (highlightCriticalPath ? computeCriticalPath(trace.spans) : null),
    [highlightCriticalPath, trace.spans]
  );

  return (
    <div className="rounded-lg border border-[#1E1E1E] bg-[#111] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1E1E1E]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#949494]">trace_id:</span>
          <span className="text-xs font-mono text-blue">{trace.id}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#808080]">{trace.spans.length} spans</span>
          <span
            className={cn(
              "text-xs font-mono font-bold",
              trace.status === "error" ? "text-red" : "text-green"
            )}
          >
            {trace.totalDuration}ms
          </span>
        </div>
      </div>

      {/* Time ruler */}
      <div className="px-4 py-1.5 border-b border-[#161616]">
        <div className="flex justify-between">
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
            <span key={pct} className="text-[10px] text-[#808080] font-mono">
              {Math.round(pct * totalDuration)}ms
            </span>
          ))}
        </div>
      </div>

      {/* Spans */}
      <div className="p-4 space-y-1.5">
        {trace.spans.map((span) => {
          const left = (span.startTime / totalDuration) * 100;
          const width = Math.max((span.duration / totalDuration) * 100, 0.5);
          const color = SERVICE_COLORS[span.service] || "#888";
          const isSelected = selectedSpan === span.id;
          const isError = span.status === "error";
          const isCritical = criticalPath ? criticalPath.has(span.id) : true;

          return (
            <div key={span.id} className="flex items-center gap-3">
              <div
                className="w-[120px] flex-shrink-0 text-[10px] font-mono truncate transition-colors"
                style={{ color: isCritical ? "#888" : "#808080" }}
              >
                {span.service}
              </div>
              <div className="flex-1 h-6 relative bg-[#0A0A0A] rounded">
                <button
                  onClick={() => onSpanClick(span)}
                  className={cn(
                    "absolute top-0 h-6 rounded flex items-center px-1.5 transition-all cursor-pointer",
                    isSelected ? "ring-1 ring-white/20" : "hover:brightness-110"
                  )}
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    minWidth: "3px",
                    backgroundColor: isError ? "#EF4444" : color,
                    opacity: isCritical ? (isSelected ? 1 : 0.85) : 0.2,
                  }}
                >
                  {width > 8 && (
                    <span className="text-[9px] font-medium text-white/90 truncate leading-none">
                      {span.name}
                    </span>
                  )}
                </button>
              </div>
              <div className="w-[50px] flex-shrink-0 text-[10px] text-[#808080] font-mono text-right tabular-nums">
                {span.duration}ms
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
