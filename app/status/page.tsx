"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { LiveboardIcon } from "@/components/logo";
import { UptimeBar } from "@/components/status/uptime-bar";
import { OverallBanner } from "@/components/status/overall-banner";
import { IncidentCard } from "@/components/status/incident-card";
import { SubscribeForm } from "@/components/status/subscribe-form";
import { useIncidents, useServices } from "@/hooks/use-data";
import { useProjects } from "@/components/providers/project-provider";

/**
 * Authenticated preview of *your* project's status page — this is what you,
 * signed in, see for whichever project is active. It is NOT what a visitor
 * sees; that's the public, session-free /status/[slug] route. This page just
 * lets you check the page before/after sharing its public link.
 */
export default function StatusPage() {
  const { activeProject } = useProjects();
  const { data: services } = useServices();
  const { data: incidents } = useIncidents();
  // null until mounted — computing this during the initial render would
  // differ between the server-rendered pass and the client hydration pass
  // (a few ms apart) and trip a hydration mismatch.
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  useEffect(() => {
    setLastChecked(new Date().toLocaleTimeString());
    const id = setInterval(() => setLastChecked(new Date().toLocaleTimeString()), 30_000);
    return () => clearInterval(id);
  }, []);

  const hasDegraded = services.some((s) => s.currentStatus !== "operational");

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 h-12 border-b border-[#1E1E1E]">
        <div className="flex items-center gap-2">
          <LiveboardIcon size={22} />
          <span className="text-sm font-bold text-[#F5F5F5] font-display">
            Status preview — {activeProject?.name ?? "—"}
          </span>
        </div>
        <a href="/overview" className="text-xs text-[#808080] hover:text-[#888] transition-colors">
          Back to Dashboard →
        </a>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        {activeProject?.statusPageEnabled && activeProject.publicSlug ? (
          <a
            href={`/status/${activeProject.publicSlug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue hover:underline"
          >
            View your public status page <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <p className="text-xs text-[#949494]">
            This page isn&apos;t public yet — enable it from the project switcher to get a shareable link.
          </p>
        )}

        {/* Overall status */}
        <OverallBanner hasDegraded={hasDegraded} lastChecked={lastChecked} />

        {/* Services */}
        <section>
          <h2 className="text-xs font-medium text-[#808080] uppercase tracking-wider mb-3">
            Components
          </h2>
          <div className="space-y-2">
            {services.map((service) => (
              <UptimeBar key={service.id} service={service} />
            ))}
            {services.length === 0 && (
              <p className="text-xs text-[#808080]">No traffic recorded yet — components appear here once your API receives requests.</p>
            )}
          </div>
        </section>

        {/* Incident history with timelines */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-[#808080] uppercase tracking-wider">
              Incident History
            </h2>
            <span className="text-[10px] text-[#808080]">
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
        {activeProject?.statusPageEnabled && activeProject.publicSlug ? (
          <SubscribeForm slug={activeProject.publicSlug} />
        ) : null}

        <footer className="text-center text-[10px] text-[#808080] pb-4">
          Powered by{" "}
          <span className="text-blue">LiveBoard</span> · status.liveboard.dev
        </footer>
      </main>
    </div>
  );
}
