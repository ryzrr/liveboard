"use client";

import { cn } from "@/lib/utils";
import type { TimeRange } from "@/lib/types";

interface TimeRangePickerProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  /** Include the "Live" option — only meaningful where the caller actually
   * has a realtime data source wired up (e.g. Overview's socket-fed chart).
   * Off by default so REST-only consumers (like Endpoints) don't show a
   * button that quietly does nothing. */
  showLive?: boolean;
}

const RANGES: TimeRange[] = ["1h", "6h", "24h", "7d"];

export function TimeRangePicker({ value, onChange, showLive = false }: TimeRangePickerProps) {
  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded bg-[#111] border border-[#1E1E1E]">
      {showLive && (
        <button
          onClick={() => onChange("live")}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-all duration-100 font-medium",
            value === "live"
              ? "bg-blue text-white"
              : "text-[#949494] hover:text-[#888]"
          )}
        >
          <span className={cn(
            "h-1.5 w-1.5 rounded-full",
            value === "live" ? "bg-white animate-pulse" : "bg-green"
          )} />
          Live
        </button>
      )}
      {RANGES.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={cn(
            "px-2.5 py-1 text-xs rounded transition-all duration-100 font-medium",
            value === range
              ? "bg-blue text-white"
              : "text-[#949494] hover:text-[#888]"
          )}
        >
          {range}
        </button>
      ))}
    </div>
  );
}
