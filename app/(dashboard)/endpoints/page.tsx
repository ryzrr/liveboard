"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { TimeRangePicker } from "@/components/layout/time-range-picker";
import { EndpointTable } from "@/components/endpoints/endpoint-table";
import { Badge } from "@/components/ui/badge";
import { useTimeRange } from "@/hooks/use-time-range";
import { useEndpoints } from "@/hooks/use-data";
import { useProjects } from "@/components/providers/project-provider";

const METHODS = ["ALL", "GET", "POST", "PUT", "DELETE", "PATCH"] as const;

export default function EndpointsPage() {
  const { activeProject } = useProjects();
  const { range, setRange } = useTimeRange("24h");
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");

  const { data: endpoints } = useEndpoints(
    range === "7d" ? 168 : range === "24h" ? 24 : range === "6h" ? 6 : 1
  );

  const filtered = useMemo(() => {
    return endpoints.filter((ep) => {
      if (!ep.route.toLowerCase().includes(search.toLowerCase())) return false;
      if (methodFilter !== "ALL" && ep.method !== methodFilter) return false;
      return true;
    });
  }, [endpoints, search, methodFilter]);

  const summary = useMemo(
    () => ({
      healthy: endpoints.filter((e) => e.healthScore >= 80).length,
      warning: endpoints.filter((e) => e.healthScore >= 50 && e.healthScore < 80).length,
      critical: endpoints.filter((e) => e.healthScore < 50).length,
    }),
    [endpoints]
  );

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
          <span className="ml-auto text-xs text-[#808080]">{filtered.length} endpoints</span>
        </div>

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
        </div>

        <EndpointTable endpoints={filtered} />
      </div>
    </div>
  );
}
