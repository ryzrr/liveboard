"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, Zap, ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";
import type { Incident } from "@/lib/types";
import { cn } from "@/lib/utils";

interface IncidentPanelProps {
  incidents: Incident[];
}

const SEVERITY_CONFIG = {
  critical: { icon: Zap, color: "text-red", bg: "bg-red-dim", badge: "red" as const },
  warning: { icon: AlertTriangle, color: "text-yellow", bg: "bg-yellow-dim", badge: "yellow" as const },
  info: { icon: Info, color: "text-blue", bg: "bg-blue-dim", badge: "blue" as const },
};

function IncidentCard({ incident }: { incident: Incident }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[incident.severity];
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "rounded-lg border transition-colors",
        incident.severity === "critical"
          ? "border-red/20 bg-red/5"
          : incident.severity === "warning"
          ? "border-yellow/20 bg-yellow/5"
          : "border-[#1E1E1E] bg-[#111]"
      )}
    >
      <button
        className="w-full flex items-start gap-3 p-3 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={cn("h-6 w-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5", cfg.bg)}>
          <Icon className={cn("h-3 w-3", cfg.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={cfg.badge} size="sm">
              {incident.severity.toUpperCase()}
            </Badge>
            {incident.resolved && (
              <CheckCircle2 className="h-3 w-3 text-green" />
            )}
          </div>
          <p className="text-xs font-medium text-[#F5F5F5] leading-snug">{incident.title}</p>
          <p className="text-[10px] text-[#808080] mt-0.5 font-mono">{timeAgo(incident.timestamp)}</p>
        </div>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-[#808080] flex-shrink-0 mt-1" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-[#808080] flex-shrink-0 mt-1" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t border-[#1E1E1E]/50">
              <p className="text-xs text-[#888] mt-2.5 leading-relaxed">{incident.summary}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] text-[#808080]">Affected:</span>
                <span className="text-[10px] font-mono text-blue">{incident.endpoint}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function IncidentPanel({ incidents }: IncidentPanelProps) {
  const firing = incidents.filter((i) => !i.resolved);
  const resolved = incidents.filter((i) => i.resolved);

  return (
    <div className="rounded-lg border border-[#1E1E1E] bg-[#111111] p-4 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-[#888888] uppercase tracking-wider">AI Incidents</h3>
        {firing.length > 0 && (
          <Badge variant="red" dot>
            {firing.length} Active
          </Badge>
        )}
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar">
        {firing.map((i) => (
          <IncidentCard key={i.id} incident={i} />
        ))}
        {resolved.length > 0 && (
          <>
            <p className="text-[10px] text-[#808080] uppercase tracking-wider px-1 pt-1">Resolved</p>
            {resolved.map((i) => (
              <IncidentCard key={i.id} incident={i} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
