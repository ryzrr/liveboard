"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TraceSpan } from "@/lib/types";

interface SpanDetailProps {
  span: TraceSpan | null;
  onClose: () => void;
}

const SERVICE_COLORS: Record<string, string> = {
  "api-gateway": "#378ADD",
  "auth-service": "#A855F7",
  "product-service": "#22C55E",
  "payment-service": "#F59E0B",
  "db-postgres": "#6366F1",
  "cache-redis": "#EF4444",
};

export function SpanDetail({ span, onClose }: SpanDetailProps) {
  return (
    <AnimatePresence>
      {span && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15 }}
          className="rounded-lg border border-[#2A2A2A] bg-[#111] overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1E1E1E]">
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: SERVICE_COLORS[span.service] || "#888" }}
              />
              <span className="text-xs font-medium text-[#F5F5F5]">{span.name}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-[#1E1E1E] text-[#444] hover:text-[#888] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-3">
            {[
              { label: "Span ID", value: span.id, mono: true },
              { label: "Service", value: span.service, mono: true },
              { label: "Start Time", value: `+${span.startTime}ms`, mono: true },
              { label: "Duration", value: `${span.duration}ms`, mono: true },
              { label: "Status", value: span.status, color: span.status === "error" ? "#EF4444" : "#22C55E" },
              { label: "Parent", value: span.parentId || "root", mono: true },
            ].map((field) => (
              <div key={field.label}>
                <p className="text-[10px] text-[#444] uppercase tracking-wider mb-0.5">{field.label}</p>
                <p
                  className={cn("text-xs", field.mono ? "font-mono" : "font-medium")}
                  style={{ color: field.color || "#888" }}
                >
                  {field.value}
                </p>
              </div>
            ))}
          </div>

          {Object.keys(span.tags).length > 0 && (
            <div className="px-4 pb-4">
              <p className="text-[10px] text-[#444] uppercase tracking-wider mb-2">Tags</p>
              <div className="space-y-1">
                {Object.entries(span.tags).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-blue">{k}</span>
                    <span className="text-[#333]">=</span>
                    <span className="text-[#888]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
