"use client";

import { cn } from "@/lib/utils";
import type { TimeRange } from "@/lib/types";

interface TimeRangePickerProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const RANGES: TimeRange[] = ["1h", "6h", "24h", "7d"];

export function TimeRangePicker({ value, onChange }: TimeRangePickerProps) {
  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded bg-[#111] border border-[#1E1E1E]">
      {RANGES.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={cn(
            "px-2.5 py-1 text-xs rounded transition-all duration-100 font-medium",
            value === range
              ? "bg-blue text-white"
              : "text-[#555] hover:text-[#888]"
          )}
        >
          {range}
        </button>
      ))}
    </div>
  );
}
