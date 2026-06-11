"use client";

import { cn } from "@/lib/utils";
import type { ServiceStatus } from "@/lib/types";

interface UptimeBarProps {
  service: ServiceStatus;
}

const STATUS_LABELS = {
  operational: "Operational",
  degraded: "Degraded",
  partial_outage: "Partial Outage",
  major_outage: "Major Outage",
};

const STATUS_COLORS = {
  operational: "text-green",
  degraded: "text-yellow",
  partial_outage: "text-red",
  major_outage: "text-red",
};

const BAR_COLORS = {
  up: "bg-green/70",
  degraded: "bg-yellow/70",
  down: "bg-red/70",
};

export function UptimeBar({ service }: UptimeBarProps) {
  return (
    <div className="rounded-lg border border-[#1E1E1E] bg-[#111] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-[#F5F5F5]">{service.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                service.currentStatus === "operational" ? "bg-green" :
                service.currentStatus === "degraded" ? "bg-yellow animate-pulse" : "bg-red animate-pulse"
              )}
            />
            <span className={cn("text-xs font-medium", STATUS_COLORS[service.currentStatus])}>
              {STATUS_LABELS[service.currentStatus]}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-mono text-[#F5F5F5]">{service.uptime90d.toFixed(2)}%</p>
          <p className="text-[10px] text-[#444]">uptime (90d)</p>
        </div>
      </div>

      {/* Uptime bars */}
      <div className="flex items-end gap-[2px] h-6">
        {service.uptimeBars.map((status, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-sm transition-colors",
              BAR_COLORS[status],
              status === "up" ? "h-4" : status === "degraded" ? "h-3" : "h-2"
            )}
            title={`Day ${i + 1}: ${status}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-[#333]">90 days ago</span>
        <span className="text-[10px] text-[#333]">Today</span>
      </div>
    </div>
  );
}
