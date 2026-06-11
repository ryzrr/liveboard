"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { useLiveLog } from "@/hooks/use-live-metrics";
import { getMethodColor, getStatusColor, formatMs } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function LiveLogTable() {
  const { logs, paused, setPaused } = useLiveLog(40);

  return (
    <div className="rounded-lg border border-[#1E1E1E] bg-[#111111] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1E1E1E]">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-green animate-pulse" />
          <span className="text-xs font-medium text-[#888888] uppercase tracking-wider">
            Live Request Log
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPaused(!paused)}
        >
          {paused ? (
            <><Play className="h-3 w-3" /> Resume</>
          ) : (
            <><Pause className="h-3 w-3" /> Pause</>
          )}
        </Button>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[80px_60px_1fr_60px_70px_90px] px-4 py-1.5 border-b border-[#1A1A1A]">
        {["Time", "Method", "Route", "Status", "Latency", "User"].map((h) => (
          <span key={h} className="text-[10px] font-medium text-[#444] uppercase tracking-wider">
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="h-[280px] overflow-y-auto no-scrollbar">
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-[80px_60px_1fr_60px_70px_90px] px-4 py-1.5 border-b border-[#161616] hover:bg-[#151515] transition-colors items-center"
            >
              <span className="text-[10px] text-[#444] font-mono tabular-nums">
                {log.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>

              <span
                className="text-[10px] font-bold font-mono"
                style={{ color: getMethodColor(log.method) }}
              >
                {log.method}
              </span>

              <span className="text-xs text-[#888] font-mono truncate pr-2">
                {log.route}
              </span>

              <span
                className="text-xs font-mono font-semibold tabular-nums"
                style={{ color: getStatusColor(log.status) }}
              >
                {log.status}
              </span>

              <span className="text-xs text-[#555] font-mono tabular-nums">
                {formatMs(log.latency)}
              </span>

              <span className="text-[10px] text-[#444] font-mono truncate">
                {log.userId}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
