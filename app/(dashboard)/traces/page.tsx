"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { FlameGraph } from "@/components/traces/flame-graph";
import { SpanDetail } from "@/components/traces/span-detail";
import { Badge } from "@/components/ui/badge";
import { cn, formatMs, timeAgo } from "@/lib/utils";
import { getTraces } from "@/lib/mock-data";
import type { Trace, TraceSpan } from "@/lib/types";

export default function TracesPage() {
  const traces = useMemo(() => getTraces(), []);
  const [selectedTrace, setSelectedTrace] = useState<Trace>(traces[0]);
  const [selectedSpan, setSelectedSpan] = useState<TraceSpan | null>(null);
  const [search, setSearch] = useState("");

  const filtered = traces.filter((t) =>
    t.id.includes(search) || t.endpoint.includes(search)
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar breadcrumb={[{ label: "Projects" }, { label: "My API" }, { label: "Traces" }]} />

      <div className="flex flex-1 gap-0">
        {/* Trace list */}
        <div className="w-[280px] flex-shrink-0 border-r border-[#1E1E1E] flex flex-col">
          <div className="p-3 border-b border-[#1E1E1E]">
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-[#1E1E1E] bg-[#111]">
              <Search className="h-3 w-3 text-[#444]" />
              <input
                type="text"
                placeholder="Search trace ID or endpoint..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-[10px] text-[#F5F5F5] placeholder-[#333] outline-none flex-1"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-[#161616]">
            {filtered.map((trace) => (
              <button
                key={trace.id}
                onClick={() => { setSelectedTrace(trace); setSelectedSpan(null); }}
                className={cn(
                  "w-full p-3 text-left hover:bg-[#151515] transition-colors",
                  selectedTrace?.id === trace.id && "bg-blue-dim border-l-2 border-l-blue"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-[#555]">{trace.id}</span>
                  <Badge variant={trace.status === "error" ? "red" : "green"} size="sm">
                    {trace.status}
                  </Badge>
                </div>
                <p className="text-xs text-[#F5F5F5] font-mono truncate mb-1">{trace.endpoint}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#444]">{timeAgo(trace.timestamp)}</span>
                  <span className={cn(
                    "text-[10px] font-mono font-semibold",
                    trace.totalDuration > 1000 ? "text-red" : trace.totalDuration > 500 ? "text-yellow" : "text-green"
                  )}>
                    {formatMs(trace.totalDuration)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Flame graph + detail */}
        <div className="flex-1 p-5 space-y-4 min-w-0">
          {selectedTrace ? (
            <>
              {/* Trace metadata */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#444] uppercase tracking-wider">Trace</span>
                  <span className="text-xs font-mono text-blue">{selectedTrace.id}</span>
                </div>
                <div className="h-3 w-px bg-[#1E1E1E]" />
                <span className="text-xs text-[#444]">{selectedTrace.spans.length} spans</span>
                <span className="text-xs text-[#444]">{timeAgo(selectedTrace.timestamp)}</span>
                <Badge
                  variant={selectedTrace.status === "error" ? "red" : "green"}
                  size="sm"
                >
                  {selectedTrace.status}
                </Badge>
              </div>

              <FlameGraph
                trace={selectedTrace}
                onSpanClick={setSelectedSpan}
                selectedSpan={selectedSpan?.id}
              />

              <SpanDetail span={selectedSpan} onClose={() => setSelectedSpan(null)} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#333] text-sm">
              Select a trace to view the flame graph
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
