"use client";

import { useState, useEffect, useCallback } from "react";
import { generateLogEntries } from "@/lib/mock-data";
import type { LogEntry } from "@/lib/types";

export function useLiveLog(maxEntries = 50) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setLogs(generateLogEntries(20));
  }, []);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      const newEntry = generateLogEntries(1)[0];
      setLogs((prev) => [newEntry, ...prev].slice(0, maxEntries));
    }, 1800);
    return () => clearInterval(interval);
  }, [paused, maxEntries]);

  return { logs, paused, setPaused };
}

export function useLiveCounter(base: number, variance = 0.05) {
  const [value, setValue] = useState(base);

  useEffect(() => {
    const interval = setInterval(() => {
      const delta = (Math.random() - 0.5) * 2 * variance * base;
      setValue((prev) => Math.max(0, Math.round((prev + delta) * 10) / 10));
    }, 3000);
    return () => clearInterval(interval);
  }, [base, variance]);

  return value;
}
