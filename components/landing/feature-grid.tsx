import { Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/landing/reveal";
import { SpotlightCard } from "@/components/landing/spotlight-card";

const FLAME_SPANS = [
  { service: "gateway", width: "100%", color: "#3B82F6", indent: 0 },
  { service: "auth", width: "22%", color: "#A855F7", indent: 1 },
  { service: "orders-api", width: "74%", color: "#06B6D4", indent: 1 },
  { service: "postgres", width: "58%", color: "#F59E0B", indent: 2 },
  { service: "payments", width: "31%", color: "#F43F5E", indent: 2 },
];

const UPTIME_DAYS = Array.from({ length: 48 }, (_, i) => (i === 31 ? "yellow" : i === 32 ? "red" : "green"));

const TOP_USERS = [
  { id: "u_2291", reqs: "12.4k", color: "#3B82F6" },
  { id: "u_0144", reqs: "9.8k", color: "#A855F7" },
  { id: "u_3387", reqs: "7.1k", color: "#06B6D4" },
];

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <Reveal className="max-w-xl">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-blue">Platform</span>
        <h2 className="mt-3 text-3xl font-display font-bold tracking-tight text-[#F5F5F5] sm:text-4xl">
          Everything you need to know what your API is doing
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-[#888]">
          Not another generic APM dashboard — built around the questions you actually
          ask at 2am.
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Onboarding — small */}
        <Reveal delay={0.04}>
          <SpotlightCard className="h-full rounded-xl">
            <div className="h-full rounded-xl border border-[#1E1E1E] bg-[#111111] p-6 transition-colors group-hover:border-[#2A2A2A]">
              <Zap className="h-4 w-4 text-blue" />
              <h3 className="mt-4 text-base font-semibold text-[#F5F5F5]">60-second onboarding</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#777]">
                One line of middleware. No agents, no sidecars, no config files to maintain.
              </p>
              <div className="mt-4 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] px-3 py-2">
                <code className="text-[11px] font-mono text-[#666]">$ npm install liveboard-sdk</code>
              </div>
            </div>
          </SpotlightCard>
        </Reveal>

        {/* Distributed tracing — small with mock flame graph */}
        <Reveal delay={0.08}>
          <SpotlightCard className="h-full rounded-xl">
            <div className="h-full rounded-xl border border-[#1E1E1E] bg-[#111111] p-6 transition-colors group-hover:border-[#2A2A2A]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-blue">
                <path d="M3 13h10M3 9h7M3 5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <h3 className="mt-4 text-base font-semibold text-[#F5F5F5]">Distributed tracing</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#777]">
                Trace IDs propagate across every service automatically. See exactly where time went.
              </p>
              <div className="mt-4 space-y-1.5">
                {FLAME_SPANS.map((span, i) => (
                  <div key={i} className="flex items-center" style={{ paddingLeft: `${span.indent * 14}px` }}>
                    <div
                      className="h-2.5 rounded-sm transition-[width] duration-700"
                      style={{ width: span.width, backgroundColor: span.color, opacity: 0.85 }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </SpotlightCard>
        </Reveal>

        {/* AI incident summaries — featured, spans 2 rows on md+ */}
        <Reveal delay={0.12} className="md:row-span-2">
          <SpotlightCard className="h-full rounded-xl">
            <div className="h-full rounded-xl border border-blue-border bg-[#111111] p-6 flex flex-col">
              <Sparkles className="h-4 w-4 text-blue" />
              <h3 className="mt-4 text-base font-semibold text-[#F5F5F5]">AI incident summaries</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#777]">
                When error rate or p99 latency breaks 3 standard deviations from baseline,
                an LLM reads the surrounding traffic and writes the postmortem before you do.
              </p>

              <div className="mt-5 rounded-lg border border-[#1E1E1E] bg-[#0A0A0A] p-4 flex-1">
                <div className="flex items-center justify-between">
                  <Badge variant="red">Critical</Badge>
                  <span className="text-[10px] text-[#444] font-mono">2m ago</span>
                </div>
                <p className="mt-3 text-sm font-medium text-[#F5F5F5]">
                  p99 latency spike on <span className="font-mono text-[#999]">/api/checkout</span>
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-[#777]">
                  Latency jumped 6.4x starting 14:02 UTC, correlated with a downstream timeout
                  from the payments provider. 312 requests affected. Recommend adding a circuit
                  breaker around the payment client.
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green animate-pulse" />
                  <span className="text-[10px] text-green font-medium">Resolved in 4m</span>
                </div>
              </div>
            </div>
          </SpotlightCard>
        </Reveal>

        {/* User-centric — small */}
        <Reveal delay={0.16}>
          <SpotlightCard className="h-full rounded-xl">
            <div className="h-full rounded-xl border border-[#1E1E1E] bg-[#111111] p-6 transition-colors group-hover:border-[#2A2A2A]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-blue">
                <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M3 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <h3 className="mt-4 text-base font-semibold text-[#F5F5F5]">User-centric observability</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#777]">
                Every event carries a user ID. Know exactly who an incident hits, not just which route.
              </p>
              <div className="mt-4 space-y-2">
                {TOP_USERS.map((u) => (
                  <div key={u.id} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: u.color }} />
                    <span className="text-xs font-mono text-[#888] flex-1">{u.id}</span>
                    <span className="text-xs font-mono text-[#555]">{u.reqs} req</span>
                  </div>
                ))}
              </div>
            </div>
          </SpotlightCard>
        </Reveal>

        {/* Status page — small */}
        <Reveal delay={0.2}>
          <SpotlightCard className="h-full rounded-xl">
            <div className="h-full rounded-xl border border-[#1E1E1E] bg-[#111111] p-6 transition-colors group-hover:border-[#2A2A2A]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-blue">
                <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M5 8.5l1.8 1.8L11 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3 className="mt-4 text-base font-semibold text-[#F5F5F5]">Auto-generated status page</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#777]">
                A public, branded status page ships for free — fed by the same data, zero extra setup.
              </p>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-[#555]">99.97% uptime</span>
                  <span className="text-[10px] text-[#444]">48 days</span>
                </div>
                <div className="flex gap-[2px]">
                  {UPTIME_DAYS.map((color, i) => (
                    <span
                      key={i}
                      className="h-4 flex-1 rounded-[1px]"
                      style={{
                        backgroundColor: color === "green" ? "#22C55E" : color === "yellow" ? "#F59E0B" : "#EF4444",
                        opacity: color === "green" ? 0.5 : 0.9,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </SpotlightCard>
        </Reveal>
      </div>
    </section>
  );
}
