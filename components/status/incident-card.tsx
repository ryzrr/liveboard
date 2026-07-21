"use client";

import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, timeAgo } from "@/lib/utils";
import type { Incident } from "@/lib/types";

type TimelineStep = "investigating" | "identified" | "monitoring" | "resolved";

const STEP_COLORS: Record<TimelineStep, string> = {
  investigating: "#EF4444",
  identified: "#F59E0B",
  monitoring: "#378ADD",
  resolved: "#22C55E",
};

const STEP_ORDER: TimelineStep[] = ["investigating", "identified", "monitoring", "resolved"];

function buildTimeline(incident: Incident): { step: TimelineStep; time: Date; note: string; done: boolean }[] {
  const base = incident.timestamp.getTime();
  const steps: TimelineStep[] = incident.resolved
    ? ["investigating", "identified", "monitoring", "resolved"]
    : ["investigating", "identified"];

  const offsets = [0, 8 * 60000, 22 * 60000, 35 * 60000];
  const notes: Record<TimelineStep, string> = {
    investigating: "Incident detected and engineers paged.",
    identified: `Root cause identified: elevated error rate on ${incident.endpoint}.`,
    monitoring: "Fix deployed, monitoring for stability.",
    resolved: "All systems back to normal. Post-mortem scheduled.",
  };

  return STEP_ORDER.map((step, i) => ({
    step,
    time: new Date(base + offsets[i]!),
    note: notes[step],
    done: steps.includes(step),
  }));
}

/** Incident card with an expandable status timeline. Shared by the authed
 * status preview and the public /status/[slug] page — no hooks beyond local
 * expand/collapse state, so it renders the same either side of auth. */
export function IncidentCard({ incident }: { incident: Incident }) {
  const [expanded, setExpanded] = useState(!incident.resolved);
  const timeline = useMemo(() => buildTimeline(incident), [incident]);
  const currentStep = incident.resolved ? "resolved" : timeline.filter((t) => t.done).slice(-1)[0]?.step ?? "investigating";

  return (
    <div className="rounded-lg border border-[#1E1E1E] bg-[#111] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-4 text-left hover:bg-[#151515] transition-colors"
      >
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <div className="flex items-center gap-2">
            <Badge
              variant={incident.severity === "critical" ? "red" : incident.severity === "warning" ? "yellow" : "blue"}
              size="sm"
            >
              {incident.severity}
            </Badge>
            <h3 className="text-sm font-medium text-[#F5F5F5]">{incident.title}</h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={incident.resolved ? "green" : "red"} size="sm">
              {incident.resolved ? "Resolved" : currentStep}
            </Badge>
            <ChevronDown className={cn("h-3.5 w-3.5 text-[#808080] transition-transform", expanded && "rotate-180")} />
          </div>
        </div>
        <p className="text-xs text-[#949494] leading-relaxed">{incident.summary}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] text-[#808080]">{timeAgo(incident.timestamp)}</span>
          <span className="text-[10px] text-[#808080]">·</span>
          <span className="text-[10px] font-mono text-blue">{incident.endpoint}</span>
        </div>
      </button>

      {/* Timeline */}
      {expanded && (
        <div className="border-t border-[#161616] px-4 py-3">
          <p className="text-[10px] text-[#808080] uppercase tracking-wider mb-3">Timeline</p>
          <div className="relative">
            {/* Vertical connector */}
            <div className="absolute left-[6px] top-2 bottom-2 w-px bg-[#1E1E1E]" />

            <div className="space-y-3">
              {timeline.map(({ step, time, note, done }) => (
                <div key={step} className="flex gap-3 relative">
                  {/* Step dot */}
                  <div
                    className="h-3.5 w-3.5 rounded-full flex-shrink-0 mt-0.5 border-2 transition-colors z-10"
                    style={{
                      borderColor: done ? STEP_COLORS[step] : "#1E1E1E",
                      backgroundColor: done ? `${STEP_COLORS[step]}30` : "#0A0A0A",
                    }}
                  />
                  <div className={cn("flex-1", !done && "opacity-30")}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-[10px] font-semibold capitalize"
                        style={{ color: done ? STEP_COLORS[step] : "#808080" }}
                      >
                        {step}
                      </span>
                      {done && (
                        <span className="text-[10px] text-[#808080] font-mono">{timeAgo(time)}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#949494] leading-relaxed">{note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
