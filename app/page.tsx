import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LandingNavbar } from "@/components/landing/navbar";
import { ScrollProgress } from "@/components/landing/scroll-progress";
import { Hero } from "@/components/landing/hero";
import { IntegrationsStrip } from "@/components/landing/integrations-strip";
import { Showcase } from "@/components/landing/showcase";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CtaSection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/footer";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/overview");

  return (
    <main className="bg-grain relative min-h-screen overflow-x-hidden bg-black">
      <ScrollProgress />
      <LandingNavbar />
      <Hero />
      <IntegrationsStrip />

      <Showcase
        id="tracing"
        index="01"
        eyebrow="Distributed tracing"
        title="Follow one request across every hop"
        body="A single slow checkout can hide a timeout three services deep. Liveboard stitches every span into one waterfall — flame or service-map view — so the culprit is obvious at a glance."
        points={[
          "Trace IDs propagate across every service automatically",
          "Flame graph and critical-path views to see where time went",
          "Errored spans bubble up to the exact downstream cause",
        ]}
        image={{ src: "/shots/traces.png", alt: "Distributed trace flame graph across gateway, auth, product and payment services", url: "app.liveboard.dev/traces", width: 3040, height: 1900 }}
      />

      <Showcase
        id="endpoints"
        index="02"
        eyebrow="Endpoints"
        title="Per-endpoint health, ranked"
        body="Every route you serve, sorted by traffic — with p50 / p95 / p99, error rate and a rolling health score. Spot the one endpoint dragging your SLO before it pages you."
        points={[
          "Latency percentiles and error rate for each route",
          "Health score surfaces degraded endpoints instantly",
          "Filter by method, status class or p99 threshold",
        ]}
        image={{ src: "/shots/endpoints.png", alt: "Endpoints table with request volume, error rate, latency percentiles and health scores", url: "app.liveboard.dev/endpoints", width: 3040, height: 1900 }}
        reversed
      />

      <Showcase
        id="alerts"
        index="03"
        eyebrow="Alerts & routing"
        title="Alerts that reach the right channel"
        body="Build a rule in seconds — metric, threshold, window, severity — and route it to Slack, PagerDuty, Discord or a webhook. Anomalies get caught, summarized and delivered where your team already is."
        points={[
          "Point-and-click rule builder, no query language",
          "Route by severity to Slack, PagerDuty, Discord or webhook",
          "Firing state and delivery history at a glance",
        ]}
        image={{ src: "/shots/alerts.png", alt: "Alert rules list and rule builder routing to Slack, PagerDuty and Discord", url: "app.liveboard.dev/alerts", width: 3040, height: 1900 }}
      />

      <FeatureGrid />

      <Showcase
        id="status-showcase"
        index="04"
        eyebrow="Status page"
        title="A public status page, for free"
        body="The same telemetry powers a branded, real-time status page with 90-day uptime history per component — no extra setup, no second tool to run."
        points={[
          "90-day uptime bars for every component",
          "Live operational / degraded / outage states",
          "Shares the data you already collect — zero config",
        ]}
        image={{ src: "/shots/status.png", alt: "Public Liveboard status page with per-component 90-day uptime history", url: "status.liveboard.dev", width: 2480, height: 2000 }}
        reversed
      />

      <HowItWorks />
      <CtaSection />
      <LandingFooter />
    </main>
  );
}
