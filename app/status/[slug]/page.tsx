import { notFound } from "next/navigation";
import { LiveboardIcon } from "@/components/logo";
import { UptimeBar } from "@/components/status/uptime-bar";
import { OverallBanner } from "@/components/status/overall-banner";
import { IncidentCard } from "@/components/status/incident-card";
import { SubscribeForm } from "@/components/status/subscribe-form";
import { AutoRefresh } from "@/components/status/auto-refresh";
import type { ServiceStatus, Incident } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface ApiService {
  id: string;
  name: string;
  uptime90d: number;
  current_status: ServiceStatus["currentStatus"];
  response_time: number;
  uptime_bars: ServiceStatus["uptimeBars"];
}

interface ApiIncident {
  id: string;
  severity: Incident["severity"];
  title: string;
  summary: string;
  endpoint: string;
  timestamp: string;
  resolved: boolean;
}

interface PublicStatus {
  project_name: string;
  services: ApiService[];
  incidents: ApiIncident[];
}

function toServices(raw: ApiService[]): ServiceStatus[] {
  return raw.map((s) => ({
    id: s.id,
    name: s.name,
    uptime90d: s.uptime90d,
    currentStatus: s.current_status,
    responseTime: s.response_time,
    uptimeBars: s.uptime_bars,
  }));
}

function toIncidents(raw: ApiIncident[]): Incident[] {
  return raw.map((i) => ({
    id: i.id,
    severity: i.severity,
    title: i.title,
    summary: i.summary,
    endpoint: i.endpoint,
    timestamp: new Date(i.timestamp),
    resolved: i.resolved,
  }));
}

/**
 * The actual public status page — no session, no ProjectProvider, no
 * localStorage. Server-rendered per request straight from the FastAPI
 * public-status endpoint, scoped by `slug` alone, exactly like a real
 * status page a logged-out visitor (or your customer's customer) can open.
 */
export default async function PublicStatusPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const res = await fetch(`${API_URL}/v1/public/status/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`status API ${res.status}`);

  const data = (await res.json()) as PublicStatus;
  const services = toServices(data.services);
  const incidents = toIncidents(data.incidents);
  const hasDegraded = services.some((s) => s.currentStatus !== "operational");

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <AutoRefresh intervalMs={30_000} />

      <header className="flex items-center justify-between px-8 h-12 border-b border-[#1E1E1E]">
        <div className="flex items-center gap-2">
          <LiveboardIcon size={22} />
          <span className="text-sm font-bold text-[#F5F5F5] font-display">
            {data.project_name} Status
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <OverallBanner hasDegraded={hasDegraded} lastChecked={new Date().toLocaleTimeString()} />

        <section>
          <h2 className="text-xs font-medium text-[#808080] uppercase tracking-wider mb-3">
            Components
          </h2>
          <div className="space-y-2">
            {services.map((service) => (
              <UptimeBar key={service.id} service={service} />
            ))}
            {services.length === 0 && (
              <p className="text-xs text-[#808080]">No components to report yet.</p>
            )}
          </div>
        </section>

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

        <SubscribeForm slug={slug} />

        <footer className="text-center text-[10px] text-[#808080] pb-4">
          Powered by <span className="text-blue">LiveBoard</span> · status.liveboard.dev
        </footer>
      </main>
    </div>
  );
}
