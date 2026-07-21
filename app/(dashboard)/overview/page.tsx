"use client";

import { Topbar } from "@/components/layout/topbar";
import { TimeRangePicker } from "@/components/layout/time-range-picker";
import { StatCardComponent } from "@/components/dashboard/stat-card";
import { RequestsChart } from "@/components/charts/requests-chart";
import { ErrorRateChart } from "@/components/charts/error-rate-chart";
import { EmptyChartState } from "@/components/charts/empty-chart-state";
import { LiveLogTable } from "@/components/dashboard/live-log-table";
import { IncidentPanel } from "@/components/dashboard/incident-panel";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useTimeRange } from "@/hooks/use-time-range";
import { useMetrics, useIncidentSocket, useLiveChartData } from "@/hooks/use-websocket";
import { useChartData, useIncidents } from "@/hooks/use-data";
import { useProjects } from "@/components/providers/project-provider";

const SPARK_COLORS = ["#378ADD", "#EF4444", "#F59E0B", "#22C55E"];

export default function OverviewPage() {
  const { range, setRange, hours } = useTimeRange("24h");
  const { activeProject } = useProjects();
  const isLive = range === "live";

  // REST: chart timeseries + incidents — real data only; empty while
  // loading, on error, or genuinely no traffic in range (never fabricated).
  // In "live" mode the REST range is irrelevant (not displayed) — pass a
  // harmless valid value rather than skipping the hook (Rules of Hooks).
  const { data: restChartData } = useChartData(isLive ? 1 : hours);
  const { data: incidents } = useIncidents();

  // Live stat cards + incidents via Socket.io — project-scoped realtime token
  // fetched from the BFF.
  const projectId = activeProject?.id ?? null;
  const cards = useMetrics(projectId);
  const liveIncidents = useIncidentSocket(projectId);
  // Rolling ~2 min buffer from the same real-time metric stream as the stat
  // cards — only actually connects while "Live" is selected below.
  const liveChartData = useLiveChartData(isLive ? projectId : null);

  const chartData = isLive ? liveChartData : restChartData;

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        breadcrumb={[{ label: "Projects" }, { label: activeProject?.name ?? "—" }, { label: "Overview" }]}
        actions={<TimeRangePicker value={range} onChange={setRange} showLive />}
      />

      <div className="flex-1 flex gap-0">
        {/* Main content */}
        <div className="flex-1 min-w-0 p-5 space-y-5">
          {/* Stat cards — animated on each Socket.io metric update */}
          <div className="grid grid-cols-4 gap-3">
            {cards.map((card, i) => (
              <StatCardComponent key={card.label} card={card} sparkColor={SPARK_COLORS[i]} />
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardHeader>
                <CardTitle>Requests Over Time</CardTitle>
                <span className="text-[10px] text-[#808080] font-mono">req/min</span>
              </CardHeader>
              {chartData.length > 0 ? (
                <RequestsChart data={chartData} />
              ) : (
                <EmptyChartState
                  message={isLive ? "Waiting for live traffic…" : "No traffic in this time range yet."}
                />
              )}
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Response Code Distribution</CardTitle>
                <div className="flex items-center gap-3">
                  {[
                    { color: "#22C55E", label: "2xx" },
                    { color: "#F59E0B", label: "4xx" },
                    { color: "#EF4444", label: "5xx" },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: l.color }} />
                      <span className="text-[10px] text-[#808080]">{l.label}</span>
                    </div>
                  ))}
                </div>
              </CardHeader>
              {chartData.length > 0 ? (
                <ErrorRateChart data={chartData} />
              ) : (
                <EmptyChartState
                  message={isLive ? "Waiting for live traffic…" : "No response data in this time range yet."}
                />
              )}
            </Card>
          </div>

          {/* Live log — real SSE stream */}
          <LiveLogTable />
        </div>

        {/* Incident sidebar */}
        <div className="w-[300px] flex-shrink-0 p-5 pl-0">
          <IncidentPanel incidents={[
          // Live socket-pushed incidents take priority, then REST-fetched list (deduped)
          ...liveIncidents,
          ...incidents.filter((i) => !liveIncidents.some((l) => l.id === i.id)),
        ]} />
        </div>
      </div>
    </div>
  );
}
