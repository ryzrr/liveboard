"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Activity, Mail } from "lucide-react";
import { UptimeBar } from "@/components/status/uptime-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getServiceStatuses, getIncidents } from "@/lib/mock-data";
import { timeAgo } from "@/lib/utils";

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
          <div className="h-6 w-6 rounded bg-blue flex items-center justify-center">
            <Activity className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-[#F5F5F5]">LiveBoard Status</span>
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

        {/* Incident history */}
        <section>
          <h2 className="text-xs font-medium text-[#444] uppercase tracking-wider mb-3">
            Incident History
          </h2>
          <div className="space-y-2">
            {incidents.map((incident) => (
              <div key={incident.id} className="rounded-lg border border-[#1E1E1E] bg-[#111] p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={incident.severity === "critical" ? "red" : incident.severity === "warning" ? "yellow" : "blue"}
                      size="sm"
                    >
                      {incident.severity}
                    </Badge>
                    <h3 className="text-sm font-medium text-[#F5F5F5]">{incident.title}</h3>
                  </div>
                  <Badge variant={incident.resolved ? "green" : "red"} size="sm">
                    {incident.resolved ? "Resolved" : "Ongoing"}
                  </Badge>
                </div>
                <p className="text-xs text-[#555] leading-relaxed mb-2">{incident.summary}</p>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#333]">{timeAgo(incident.timestamp)}</span>
                  <span className="text-[10px] text-[#333]">·</span>
                  <span className="text-[10px] font-mono text-blue">{incident.endpoint}</span>
                </div>
              </div>
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
