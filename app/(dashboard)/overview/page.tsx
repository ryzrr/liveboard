"use client";

import { useMemo } from "react";
import { Topbar } from "@/components/layout/topbar";
import { TimeRangePicker } from "@/components/layout/time-range-picker";
import { StatCardComponent } from "@/components/dashboard/stat-card";
import { RequestsChart } from "@/components/charts/requests-chart";
import { ErrorRateChart } from "@/components/charts/error-rate-chart";
import { LiveLogTable } from "@/components/dashboard/live-log-table";
import { IncidentPanel } from "@/components/dashboard/incident-panel";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useTimeRange } from "@/hooks/use-time-range";
import { useMetrics } from "@/hooks/use-websocket";
import { generateChartData, getIncidents } from "@/lib/mock-data";

const SPARK_COLORS = ["#378ADD", "#EF4444", "#F59E0B", "#22C55E"];

export default function OverviewPage() {
  const { range, setRange, hours } = useTimeRange("24h");
  const chartData = useMemo(() => generateChartData(hours), [hours]);
  const incidents = useMemo(() => getIncidents(), []);

  // Live stat cards via Socket.io — falls back to placeholder values while connecting
  const apiKey = process.env.NEXT_PUBLIC_LIVEBOARD_API_KEY ?? null;
  const cards = useMetrics(apiKey);

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        breadcrumb={[{ label: "Projects" }, { label: "My API" }, { label: "Overview" }]}
        actions={<TimeRangePicker value={range} onChange={setRange} />}
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
                <span className="text-[10px] text-[#444] font-mono">req/min</span>
              </CardHeader>
              <RequestsChart data={chartData} />
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
                      <span className="text-[10px] text-[#444]">{l.label}</span>
                    </div>
                  ))}
                </div>
              </CardHeader>
              <ErrorRateChart data={chartData} />
            </Card>
          </div>

          {/* Live log — real SSE stream */}
          <LiveLogTable />
        </div>

        {/* Incident sidebar */}
        <div className="w-[300px] flex-shrink-0 p-5 pl-0">
          <IncidentPanel incidents={incidents} />
        </div>
      </div>
    </div>
  );
}
