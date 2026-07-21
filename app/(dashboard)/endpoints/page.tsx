"use client";

import { useState, useMemo } from "react";
import { Search, GitCompare, X } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { TimeRangePicker } from "@/components/layout/time-range-picker";
import { EndpointTable } from "@/components/endpoints/endpoint-table";
import { EndpointDrawer } from "@/components/endpoints/endpoint-drawer";
import { EndpointComparison } from "@/components/endpoints/endpoint-comparison";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTimeRange } from "@/hooks/use-time-range";
import { useEndpoints } from "@/hooks/use-data";
import { useProjects } from "@/components/providers/project-provider";
import type { Endpoint } from "@/lib/types";

const METHODS = ["ALL", "GET", "POST", "PUT", "DELETE", "PATCH"] as const;

const STATUS_RANGES = [
  { label: "2xx", min: 200, max: 299 },
  { label: "4xx", min: 400, max: 499 },
  { label: "5xx", min: 500, max: 599 },
] as const;

export default function EndpointsPage() {
  const { activeProject } = useProjects();
  const { range, setRange } = useTimeRange("24h");
  const [selected, setSelected] = useState<Endpoint | null>(null);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [maxLatency, setMaxLatency] = useState<string>("");

  // Comparison mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<Endpoint[]>([]);

  const { data: endpoints } = useEndpoints(range === "7d" ? 168 : range === "24h" ? 24 : range === "6h" ? 6 : 1);

  const filtered = useMemo(() => {
    return endpoints.filter((ep) => {
      if (!ep.route.toLowerCase().includes(search.toLowerCase())) return false;
      if (methodFilter !== "ALL" && ep.method !== methodFilter) return false;
      if (statusFilter.size > 0) {
        const matched = [...statusFilter].some((label) => {
          const range = STATUS_RANGES.find((r) => r.label === label);
          return range && ep.errorRate >= 0; // status filter is approximate via errorRate
        });
        // For mock data we don't have exact status, use errorRate as proxy
        // 5xx → errorRate > 5, 4xx → 1–5%, 2xx → < 1%
        if (statusFilter.has("2xx") && !statusFilter.has("4xx") && !statusFilter.has("5xx")) {
          if (ep.errorRate >= 1) return false;
        }
        if (statusFilter.has("4xx") && !statusFilter.has("2xx") && !statusFilter.has("5xx")) {
          if (ep.errorRate < 1 || ep.errorRate >= 5) return false;
        }
        if (statusFilter.has("5xx") && !statusFilter.has("2xx") && !statusFilter.has("4xx")) {
          if (ep.errorRate < 5) return false;
        }
        void matched;
      }
      if (maxLatency !== "") {
        const threshold = parseInt(maxLatency, 10);
        if (!isNaN(threshold) && ep.p99 > threshold) return false;
      }
      return true;
    });
  }, [endpoints, search, methodFilter, statusFilter, maxLatency]);

  const summary = useMemo(() => ({
    healthy: endpoints.filter((e) => e.healthScore >= 80).length,
    warning: endpoints.filter((e) => e.healthScore >= 50 && e.healthScore < 80).length,
    critical: endpoints.filter((e) => e.healthScore < 50).length,
  }), [endpoints]);

  function toggleStatusFilter(label: string) {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(label)) { next.delete(label); } else { next.add(label); }
      return next;
    });
  }

  function handleCompareSelect(ep: Endpoint) {
    setCompareSelection((prev) => {
      if (prev.some((e) => e.id === ep.id)) return prev.filter((e) => e.id !== ep.id);
      if (prev.length >= 2) return [prev[1]!, ep];
      return [...prev, ep];
    });
  }

  function exitCompare() {
    setCompareMode(false);
    setCompareSelection([]);
  }

  const showingComparison = compareMode && compareSelection.length === 2;

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        breadcrumb={[{ label: "Projects" }, { label: activeProject?.name ?? "—" }, { label: "Endpoints" }]}
        actions={<TimeRangePicker value={range} onChange={setRange} />}
      />

      <div className="p-5 space-y-4">
        {/* Summary badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="green" dot>{summary.healthy} Healthy</Badge>
            <Badge variant="yellow" dot>{summary.warning} Warning</Badge>
            <Badge variant="red" dot>{summary.critical} Critical</Badge>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-[#808080]">{filtered.length} endpoints</span>
            <Button
              variant={compareMode ? "primary" : "ghost"}
              size="sm"
              onClick={() => (compareMode ? exitCompare() : setCompareMode(true))}
            >
              <GitCompare className="h-3 w-3" />
              {compareMode ? "Exit Compare" : "Compare"}
            </Button>
          </div>
        </div>

        {/* Compare mode hint */}
        {compareMode && !showingComparison && (
          <div className="flex items-center gap-2 text-xs text-[#949494] bg-blue-dim border border-blue/20 rounded px-3 py-2">
            <GitCompare className="h-3 w-3 text-blue" />
            {compareSelection.length === 0
              ? "Select 2 endpoints to compare"
              : `${compareSelection.length}/2 selected — pick one more`}
            {compareSelection.length > 0 && (
              <button onClick={() => setCompareSelection([])} className="ml-auto text-[#808080] hover:text-[#888]">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Comparison panel */}
        {showingComparison && (
          <EndpointComparison
            endpoints={compareSelection as [Endpoint, Endpoint]}
            onClose={exitCompare}
          />
        )}

        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Route search */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#1E1E1E] bg-[#111] flex-1 max-w-xs hover:border-[#2A2A2A] transition-colors">
            <Search className="h-3 w-3 text-[#808080] flex-shrink-0" />
            <input
              type="text"
              placeholder="Filter by route..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs text-[#F5F5F5] placeholder-[#808080] outline-none flex-1"
            />
          </div>

          {/* Method filter */}
          <div className="flex items-center gap-0.5 p-0.5 rounded bg-[#111] border border-[#1E1E1E]">
            {METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                  methodFilter === m ? "bg-blue text-white" : "text-[#949494] hover:text-[#888]"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Status range filter */}
          <div className="flex items-center gap-1 p-0.5 rounded bg-[#111] border border-[#1E1E1E]">
            {STATUS_RANGES.map(({ label }) => (
              <button
                key={label}
                onClick={() => toggleStatusFilter(label)}
                className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                  statusFilter.has(label)
                    ? label === "2xx"
                      ? "bg-green/20 text-green"
                      : label === "4xx"
                      ? "bg-yellow/20 text-yellow"
                      : "bg-red/20 text-red"
                    : "text-[#949494] hover:text-[#888]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Latency threshold */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-[#1E1E1E] bg-[#111]">
            <span className="text-[10px] text-[#808080]">p99 &lt;</span>
            <input
              type="number"
              placeholder="ms"
              value={maxLatency}
              onChange={(e) => setMaxLatency(e.target.value)}
              className="bg-transparent text-xs text-[#F5F5F5] placeholder-[#808080] outline-none w-14 text-right tabular-nums"
            />
            <span className="text-[10px] text-[#808080]">ms</span>
            {maxLatency && (
              <button onClick={() => setMaxLatency("")} className="text-[#808080] hover:text-[#949494]">
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table + drawer */}
        <div className={selected && !compareMode ? "mr-[380px]" : ""}>
          <EndpointTable
            endpoints={filtered}
            selected={compareMode ? undefined : selected?.id}
            compareSelected={compareMode ? compareSelection.map((e) => e.id) : []}
            onSelect={(ep) => {
              if (compareMode) {
                handleCompareSelect(ep);
              } else {
                setSelected(ep.id === selected?.id ? null : ep);
              }
            }}
          />
        </div>
      </div>

      {!compareMode && <EndpointDrawer endpoint={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
