"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Pause, Play, WifiOff } from "lucide-react";
import { useLiveLog } from "@/hooks/use-live-metrics";
import { getMethodColor, getStatusColor, formatMs } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_DOT = {
  "no-project":   "bg-[#555]",
  connecting:     "bg-yellow animate-pulse",
  reconnecting:   "bg-yellow animate-pulse",
  live:           "bg-green animate-pulse",
} as const;

const STATUS_LABEL = {
  "no-project": "No project",
  connecting:   "Connecting…",
  reconnecting: "Reconnecting…",
  live:         "Live Request Log",
} as const;

export function LiveLogTable() {
  const { logs, paused, setPaused, status } = useLiveLog(40);

  return (
    <div className="rounded-lg border border-[#1E1E1E] bg-[#111111] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1E1E1E]">
        <div className="flex items-center gap-2">
          <div className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
          <span className="text-xs font-medium text-[#888888] uppercase tracking-wider">
            {status === "live" ? "Live Request Log" : STATUS_LABEL[status]}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setPaused(!paused)} disabled={status !== "live"}>
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
          <span key={h} className="text-[10px] font-medium text-[#808080] uppercase tracking-wider">
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="h-[280px] overflow-y-auto no-scrollbar">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center px-6">
            {status === "no-project" ? (
              <>
                <WifiOff className="h-4 w-4 text-[#555]" />
                <p className="text-xs text-[#808080]">Select a project to see its live requests.</p>
              </>
            ) : status === "connecting" ? (
              <>
                <Loader2 className="h-4 w-4 text-[#808080] animate-spin" />
                <p className="text-xs text-[#808080]">Connecting to the live stream…</p>
              </>
            ) : status === "reconnecting" ? (
              <>
                <WifiOff className="h-4 w-4 text-yellow" />
                <p className="text-xs text-[#808080]">Connection dropped — reconnecting…</p>
              </>
            ) : (
              <p className="text-xs text-[#808080]">
                No requests yet — they&apos;ll show up here as soon as your API gets traffic.
              </p>
            )}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-[80px_60px_1fr_60px_70px_90px] px-4 py-1.5 border-b border-[#161616] hover:bg-[#151515] transition-colors items-center"
              >
                <span className="text-[10px] text-[#808080] font-mono tabular-nums">
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

                <span className="text-xs text-[#949494] font-mono tabular-nums">
                  {formatMs(log.latency)}
                </span>

                <span className="text-[10px] text-[#808080] font-mono truncate">
                  {log.userId}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
