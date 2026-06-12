"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Mail, ChevronDown } from "lucide-react";
import { LiveboardIcon } from "@/components/logo";
import { UptimeBar } from "@/components/status/uptime-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getServiceStatuses, getIncidents } from "@/lib/mock-data";
import { timeAgo } from "@/lib/utils";
import type { Incident } from "@/lib/types";

const OVERALL_STATUS = {
  operational: {
    label: "All Systems Operational",
    color: "text-green",
    bg: "bg-green/10 border-green/20",
    icon: CheckCircle2,
  },
  degraded: {
    label: "Degraded Performance",
    color: "text-yellow",
    bg: "bg-yellow/10 border-yellow/20",
    icon: AlertTriangle,
  },
  partial_outage: {
    label: "Partial Outage",
    color: "text-red",
    bg: "bg-red/10 border-red/20",
    icon: XCircle,
  },
};

// ─── Incident timeline data ───────────────────────────────────────────────────

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

// ─── IncidentCard with expandable timeline ────────────────────────────────────

function IncidentCard({ incident }: { incident: Incident }) {
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
            <ChevronDown className={cn("h-3.5 w-3.5 text-[#444] transition-transform", expanded && "rotate-180")} />
          </div>
        </div>
        <p className="text-xs text-[#555] leading-relaxed">{incident.summary}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] text-[#333]">{timeAgo(incident.timestamp)}</span>
          <span className="text-[10px] text-[#333]">·</span>
          <span className="text-[10px] font-mono text-blue">{incident.endpoint}</span>
        </div>
      </button>

      {/* Timeline */}
      {expanded && (
        <div className="border-t border-[#161616] px-4 py-3">
          <p className="text-[10px] text-[#444] uppercase tracking-wider mb-3">Timeline</p>
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
                        style={{ color: done ? STEP_COLORS[step] : "#444" }}
                      >
                        {step}
                      </span>
                      {done && (
                        <span className="text-[10px] text-[#333] font-mono">{timeAgo(time)}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#555] leading-relaxed">{note}</p>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StatusPage() {
  const services = useMemo(() => getServiceStatuses(), []);
  const incidents = useMemo(() => getIncidents(), []);
  const [email, setEmail] = useState("");

  const hasDegraded = services.some((s) => s.currentStatus !== "operational");
  const overallKey: keyof typeof OVERALL_STATUS = hasDegraded ? "degraded" : "operational";
  const overall = OVERALL_STATUS[overallKey];
  const StatusIcon = overall.icon;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 h-12 border-b border-[#1E1E1E]">
        <div className="flex items-center gap-2">
          <LiveboardIcon size={22} />
          <span className="text-sm font-bold text-[#F5F5F5] font-display">
            Liveboard Status
          </span>
        </div>
        <a href="/overview" className="text-xs text-[#444] hover:text-[#888] transition-colors">
          Back to Dashboard →
        </a>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        {/* Overall status */}
        <div className={`rounded-xl border ${overall.bg} p-6 flex items-center gap-4`}>
          <StatusIcon className={`h-8 w-8 ${overall.color} flex-shrink-0`} />
          <div>
            <h1 className={`text-xl font-semibold ${overall.color}`}>{overall.label}</h1>
            <p className="text-xs text-[#555] mt-0.5">
              Last checked: {new Date().toLocaleTimeString()} · Updates in real time
            </p>
          </div>
        </div>

        {/* Services */}
        <section>
          <h2 className="text-xs font-medium text-[#444] uppercase tracking-wider mb-3">
            Components
          </h2>
          <div className="space-y-2">
            {services.map((service) => (
              <UptimeBar key={service.id} service={service} />
            ))}
          </div>
        </section>

        {/* Incident history with timelines */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-[#444] uppercase tracking-wider">
              Incident History
            </h2>
            <span className="text-[10px] text-[#333]">
              {incidents.filter((i) => !i.resolved).length} active
            </span>
          </div>
          <div className="space-y-2">
            {incidents.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        </section>

        {/* Subscribe */}
        <section className="rounded-xl border border-[#1E1E1E] bg-[#111] p-6">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="h-4 w-4 text-[#555]" />
            <h2 className="text-sm font-medium text-[#F5F5F5]">Get Incident Alerts</h2>
          </div>
          <p className="text-xs text-[#444] mb-4">
            Subscribe to receive email notifications for incidents and status updates.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-[#0D0D0D] border border-[#2A2A2A] rounded px-3 py-1.5 text-sm text-[#F5F5F5] placeholder-[#333] outline-none focus:border-blue transition-colors"
            />
            <Button variant="primary" size="md">
              Subscribe
            </Button>
          </div>
        </section>

        <footer className="text-center text-[10px] text-[#333] pb-4">
          Powered by{" "}
          <span className="text-blue">LiveBoard</span> · status.liveboard.dev
        </footer>
      </main>
    </div>
  );
}
