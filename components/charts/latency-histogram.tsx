"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

interface LatencyHistogramProps {
  p50: number;
  p95: number;
  p99: number;
}

interface TooltipPayload {
  value: number;
  payload: { label: string };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#2A2A2A] bg-[#161616] p-2 shadow-xl">
      <p className="text-[10px] text-[#888]">{payload[0].payload.label}</p>
      <p className="text-xs font-semibold text-[#F5F5F5]">{payload[0].value}ms</p>
    </div>
  );
}

export function LatencyHistogram({ p50, p95, p99 }: LatencyHistogramProps) {
  const data = [
    { label: "p50", value: p50, color: "#22C55E" },
    { label: "p95", value: p95, color: "#F59E0B" },
    { label: "p99", value: p99, color: "#EF4444" },
  ];

  return (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fill: "#555", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#444", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={40}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
