"use client";

import { useState } from "react";
import type { TimeRange } from "@/lib/types";

export function useTimeRange(defaultRange: TimeRange = "24h") {
  const [range, setRange] = useState<TimeRange>(defaultRange);

  const hours: Record<TimeRange, number> = {
    live: 0, // unused — "live" reads from the realtime socket stream, not this REST param
    "1h": 1,
    "6h": 6,
    "24h": 24,
    "7d": 168,
  };

  return { range, setRange, hours: hours[range] };
}
