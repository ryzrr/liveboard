"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { LatencyHistogram } from "@/components/charts/latency-histogram";
import { getMethodColor, getHealthColor, getErrorRateColor, formatMs, formatNumber } from "@/lib/utils";
import type { Endpoint } from "@/lib/types";

interface EndpointDrawerProps {
  endpoint: Endpoint | null;
  onClose: () => void;
}

export function EndpointDrawer({ endpoint, onClose }: EndpointDrawerProps) {
  return (
    <AnimatePresence>
      {endpoint && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed right-0 top-12 h-[calc(100vh-48px)] w-[380px] border-l border-[#1E1E1E] bg-[#0D0D0D] overflow-y-auto no-scrollbar z-30"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-4 border-b border-[#1E1E1E] sticky top-0 bg-[#0D0D0D]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-bold font-mono"
                  style={{ color: getMethodColor(endpoint.method) }}
                >
                  {endpoint.method}
                </span>
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: getHealthColor(endpoint.healthScore) }}
                />
              </div>
              <p className="text-sm font-mono text-[#F5F5F5]">{endpoint.route}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-[#1E1E1E] text-[#808080] hover:text-[#888] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 space-y-5">
            {/* Health Score */}
            <div className="rounded-lg border border-[#1E1E1E] bg-[#111] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[#808080] uppercase tracking-wider">Health Score</span>
                <span
                  className="text-xl font-bold tabular-nums"
                  style={{ color: getHealthColor(endpoint.healthScore) }}
                >
                  {endpoint.healthScore}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#1E1E1E]">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${endpoint.healthScore}%`,
                    backgroundColor: getHealthColor(endpoint.healthScore),
                  }}
                />
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Requests 24h", value: formatNumber(endpoint.requests24h) },
                {
                  label: "Error Rate",
                  value: `${endpoint.errorRate.toFixed(1)}%`,
                  color: getErrorRateColor(endpoint.errorRate),
                },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-[#1E1E1E] bg-[#111] p-3">
                  <p className="text-[10px] text-[#808080] uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-lg font-semibold tabular-nums" style={{ color: stat.color || "#F5F5F5" }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Latency */}
            <div className="rounded-lg border border-[#1E1E1E] bg-[#111] p-3">
              <p className="text-[10px] text-[#808080] uppercase tracking-wider mb-3">Latency Distribution</p>
              <LatencyHistogram p50={endpoint.p50} p95={endpoint.p95} p99={endpoint.p99} />
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  { label: "p50", value: formatMs(endpoint.p50), color: "#22C55E" },
                  { label: "p95", value: formatMs(endpoint.p95), color: "#F59E0B" },
                  { label: "p99", value: formatMs(endpoint.p99), color: "#EF4444" },
                ].map((p) => (
                  <div key={p.label} className="text-center">
                    <p className="text-[10px] text-[#808080] mb-0.5">{p.label}</p>
                    <p className="text-xs font-semibold font-mono" style={{ color: p.color }}>
                      {p.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top errors */}
            <div className="rounded-lg border border-[#1E1E1E] bg-[#111] p-3">
              <p className="text-[10px] text-[#808080] uppercase tracking-wider mb-3">Top Errors</p>
              {endpoint.errorRate > 0 ? (
                <div className="space-y-2">
                  {[
                    { code: 422, msg: "Validation failed: required field missing", count: Math.floor(endpoint.requests24h * 0.008) },
                    { code: 500, msg: "Internal server error: database timeout", count: Math.floor(endpoint.requests24h * 0.004) },
                  ].map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-red font-mono font-bold flex-shrink-0">{err.code}</span>
                      <span className="text-[#949494] flex-1 truncate">{err.msg}</span>
                      <span className="text-[#808080] flex-shrink-0">{err.count}x</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#808080]">No errors in selected window</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
