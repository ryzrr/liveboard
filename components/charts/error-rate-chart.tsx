"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { ChartData } from "@/lib/types";
import { formatNumber, formatChartTime } from "@/lib/utils";

interface ErrorRateChartProps {
  data: ChartData[];
}

interface TooltipPayload {
  value: number;
  name: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#2A2A2A] bg-[#161616] p-2.5 shadow-xl min-w-[120px]">
      <p className="text-[10px] text-[#949494] mb-2 font-mono">{label ? formatChartTime(label) : ""}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-[#888]">{p.name}</span>
          </div>
          <span className="text-[#F5F5F5] font-medium">{formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function ErrorRateChart({ data }: ErrorRateChartProps) {
  // Labels now always carry the date ("07/20 14:30", not "14:30" — see
  // apps/api/api/routes/query.py) so fewer of them fit before overlapping;
  // target ~5 visible ticks instead of ~8.
  const xStep = Math.ceil(data.length / 3);

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 4, right: 44, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="grad2xx" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="grad4xx" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="grad5xx" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#161616" vertical={false} />
        <XAxis
          dataKey="time"
          tickFormatter={formatChartTime}
          tick={{ fill: "#808080", fontSize: 10, fontFamily: "monospace" }}
          axisLine={false}
          tickLine={false}
          interval={xStep}
        />
        <YAxis
          tick={{ fill: "#808080", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatNumber}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#2A2A2A", strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="errors2xx"
          name="2xx"
          stackId="1"
          stroke="#22C55E"
          strokeWidth={1}
          fill="url(#grad2xx)"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="errors4xx"
          name="4xx"
          stackId="2"
          stroke="#F59E0B"
          strokeWidth={1}
          fill="url(#grad4xx)"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="errors5xx"
          name="5xx"
          stackId="3"
          stroke="#EF4444"
          strokeWidth={1}
          fill="url(#grad5xx)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
