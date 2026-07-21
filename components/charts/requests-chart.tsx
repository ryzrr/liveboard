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

interface RequestsChartProps {
  data: ChartData[];
}

interface TooltipPayload {
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#2A2A2A] bg-[#161616] p-2.5 shadow-xl">
      <p className="text-[10px] text-[#949494] mb-1.5 font-mono">{label ? formatChartTime(label) : ""}</p>
      <p className="text-xs font-semibold text-[#F5F5F5]">
        {formatNumber(payload[0].value)} req/min
      </p>
    </div>
  );
}

export function RequestsChart({ data }: RequestsChartProps) {
  // Labels now always carry the date ("07/20 14:30", not "14:30" — see
  // apps/api/api/routes/query.py) so fewer of them fit before overlapping;
  // target ~5 visible ticks instead of ~8.
  const xStep = Math.ceil(data.length / 3);

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 4, right: 44, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#378ADD" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#378ADD" stopOpacity={0} />
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
          dataKey="requests"
          stroke="#378ADD"
          strokeWidth={1.5}
          fill="url(#reqGrad)"
          dot={false}
          activeDot={{ r: 3, fill: "#378ADD", stroke: "#0A0A0A", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
