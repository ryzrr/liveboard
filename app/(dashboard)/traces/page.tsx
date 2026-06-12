"use client";

import { useState, useMemo } from "react";
import { Search, GitBranch, Map } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { FlameGraph } from "@/components/traces/flame-graph";
import { SpanDetail } from "@/components/traces/span-detail";
import { ServiceMap } from "@/components/traces/service-map";
import { Badge } from "@/components/ui/badge";
import { cn, formatMs, timeAgo } from "@/lib/utils";
import { getTraces } from "@/lib/mock-data";
import type { Trace, TraceSpan } from "@/lib/types";

type DurationFilter = "any" | "<100" | "100-500" | "500-1000" | ">1000";

const DURATION_OPTIONS: { label: string; value: DurationFilter }[] = [
  { label: "Any", value: "any" },
  { label: "< 100ms", value: "<100" },
  { label: "100–500ms", value: "100-500" },
  { label: "500ms–1s", value: "500-1000" },
  { label: "> 1s", value: ">1000" },
];

function matchesDuration(ms: number, filter: DurationFilter): boolean {
  switch (filter) {
    case "<100": return ms < 100;
    case "100-500": return ms >= 100 && ms < 500;
    case "500-1000": return ms >= 500 && ms < 1000;
    case ">1000": return ms >= 1000;
    default: return true;
  }
}

type ViewMode = "flamegraph" | "servicemap";

export default function TracesPage() {
  const traces = useMemo(() => getTraces(), []);
  const [selectedTrace, setSelectedTrace] = useState<Trace>(traces[0]);
  const [selectedSpan, setSelectedSpan] = useState<TraceSpan | null>(null);
  const [search, setSearch] = useState("");
  const [durationFilter, setDurationFilter] = useState<DurationFilter>("any");
  const [criticalPath, setCriticalPath] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("flamegraph");

  const filtered = useMemo(() => traces.filter((t) => {
    const matchSearch = t.id.includes(search) || t.endpoint.includes(search) || t.service.includes(search);
    const matchDuration = matchesDuration(t.totalDuration, durationFilter);
    return matchSearch && matchDuration;
  }), [traces, search, durationFilter]);

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar breadcrumb={[{ label: "Projects" }, { label: "My API" }, { label: "Traces" }]} />

      <div className="flex flex-1 gap-0">
        {/* Trace list */}
        <div className="w-[280px] flex-shrink-0 border-r border-[#1E1E1E] flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-[#1E1E1E] space-y-2">
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-[#1E1E1E] bg-[#111]">
              <Search className="h-3 w-3 text-[#444]" />
              <input
                type="text"
                placeholder="Search trace ID, endpoint..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-[10px] text-[#F5F5F5] placeholder-[#333] outline-none flex-1"
              />
            </div>
            {/* Duration filter */}
            <div className="flex flex-wrap gap-1">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDurationFilter(opt.value)}
                  className={cn(
                    "px-2 py-0.5 text-[9px] rounded border transition-colors",
                    durationFilter === opt.value
                      ? "border-blue bg-blue/10 text-blue"
                      : "border-[#1E1E1E] text-[#444] hover:text-[#888] hover:border-[#2A2A2A]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
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
            {filtered.length === 0 && (
              <div className="p-6 text-center text-[10px] text-[#333]">No traces match</div>
            )}
          </div>
        </div>

        {/* Flame graph + detail */}
        <div className="flex-1 p-5 space-y-4 min-w-0">
          {selectedTrace ? (
            <>
              {/* Trace header + toolbar */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#444] uppercase tracking-wider">Trace</span>
                  <span className="text-xs font-mono text-blue">{selectedTrace.id}</span>
                </div>
                <div className="h-3 w-px bg-[#1E1E1E]" />
                <span className="text-xs text-[#444]">{selectedTrace.spans.length} spans</span>
                <span className="text-xs text-[#444]">{timeAgo(selectedTrace.timestamp)}</span>
                <Badge variant={selectedTrace.status === "error" ? "red" : "green"} size="sm">
                  {selectedTrace.status}
                </Badge>

                {/* View toggles */}
                <div className="ml-auto flex items-center gap-2">
                  {/* Critical path toggle (only for flame graph) */}
                  {viewMode === "flamegraph" && (
                    <button
                      onClick={() => setCriticalPath((v) => !v)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] transition-colors",
                        criticalPath
                          ? "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F59E0B]"
                          : "border-[#1E1E1E] text-[#444] hover:text-[#888] hover:border-[#2A2A2A]"
                      )}
                    >
                      <GitBranch className="h-3 w-3" />
                      Critical Path
                    </button>
                  )}

                  {/* Flame / Map toggle */}
                  <div className="flex items-center gap-0.5 p-0.5 rounded bg-[#111] border border-[#1E1E1E]">
                    <button
                      onClick={() => setViewMode("flamegraph")}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 text-[10px] rounded transition-colors",
                        viewMode === "flamegraph" ? "bg-blue text-white" : "text-[#555] hover:text-[#888]"
                      )}
                    >
                      <GitBranch className="h-3 w-3" />
                      Flame
                    </button>
                    <button
                      onClick={() => setViewMode("servicemap")}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 text-[10px] rounded transition-colors",
                        viewMode === "servicemap" ? "bg-blue text-white" : "text-[#555] hover:text-[#888]"
                      )}
                    >
                      <Map className="h-3 w-3" />
                      Map
                    </button>
                  </div>
                </div>
              </div>

              {viewMode === "flamegraph" ? (
                <FlameGraph
                  trace={selectedTrace}
                  onSpanClick={setSelectedSpan}
                  selectedSpan={selectedSpan?.id}
                  highlightCriticalPath={criticalPath}
                />
              ) : (
                <ServiceMap trace={selectedTrace} />
              )}

              {viewMode === "flamegraph" && (
                <SpanDetail span={selectedSpan} onClose={() => setSelectedSpan(null)} />
              )}
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
