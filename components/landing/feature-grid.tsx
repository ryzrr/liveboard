import { Bell, Gauge, Sparkles, Users, Zap } from "lucide-react";
import { Reveal } from "@/components/landing/reveal";
import { SpotlightCard } from "@/components/landing/spotlight-card";
import { InstallSnippet } from "@/components/landing/code-snippet";

const UPTIME_DAYS = Array.from({ length: 44 }, (_, i) => (i === 29 ? "yellow" : i === 30 ? "red" : "green"));

const TOP_USERS = [
  { id: "u_2291", reqs: "12.4k", color: "#3B82F6" },
  { id: "u_0144", reqs: "9.8k", color: "#A855F7" },
  { id: "u_3387", reqs: "7.1k", color: "#06B6D4" },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#8a8a94]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#4B9AED] animate-live" />
      {children}
    </span>
  );
}

function cardShell(extra = "") {
  return `h-full rounded-2xl hairline hairline-hover p-6 ${extra}`;
}

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-5xl px-6 py-14 lg:py-[4.5rem]">
      <Reveal className="max-w-2xl">
        <Eyebrow>Platform</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-[2.6rem] sm:leading-[1.1]">
          Everything you need to know
          <br className="hidden sm:block" /> what your API is doing
        </h2>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#8a8a94]">
          Not another generic APM dashboard — built around the questions you actually ask at 2am.
        </p>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Onboarding */}
        <Reveal delay={0.04}>
          <SpotlightCard className="h-full rounded-2xl">
            <div className={cardShell()}>
              <Zap className="h-4 w-4 text-[#4B9AED]" />
              <h3 className="mt-4 text-base font-semibold text-white">60-second onboarding</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#8a8a94]">
                One line of middleware. No agents, no sidecars, no config files to maintain.
              </p>
              <div className="mt-4 rounded-lg border border-white/[0.07] bg-black/40 px-3 py-2">
                <InstallSnippet />
              </div>
            </div>
          </SpotlightCard>
        </Reveal>

        {/* Endpoints / health */}
        <Reveal delay={0.08}>
          <SpotlightCard className="h-full rounded-2xl">
            <div className={cardShell()}>
              <Gauge className="h-4 w-4 text-[#4B9AED]" />
              <h3 className="mt-4 text-base font-semibold text-white">Per-endpoint health</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#8a8a94]">
                p50 / p95 / p99, error rate and a rolling health score for every route you serve.
              </p>
              <div className="mt-4 space-y-2">
                {[
                  { r: "/checkout", p: 92, c: "#22C55E" },
                  { r: "/orders", p: 68, c: "#F59E0B" },
                  { r: "/search", p: 34, c: "#EF4444" },
                ].map((e) => (
                  <div key={e.r} className="flex items-center gap-2">
                    <span className="w-16 flex-shrink-0 truncate font-mono text-[10px] text-[#7a7a82]">{e.r}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full" style={{ width: `${e.p}%`, backgroundColor: e.c }} />
                    </div>
                    <span className="w-7 text-right font-mono text-[10px] text-[#5a5a62]">{e.p}</span>
                  </div>
                ))}
              </div>
            </div>
          </SpotlightCard>
        </Reveal>

        {/* AI incident summaries — featured, tall */}
        <Reveal delay={0.12} className="md:row-span-2">
          <SpotlightCard className="h-full rounded-2xl">
            <div className={cardShell("flex flex-col border-[#4B9AED]/25")}>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#4B9AED]" />
                <span className="rounded-full border border-[#4B9AED]/30 bg-[#4B9AED]/10 px-2 py-0.5 text-[10px] font-medium text-[#7bb4f2]">
                  AI
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">AI incident summaries</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#8a8a94]">
                When error rate or p99 latency breaks 3σ from baseline, an LLM reads the surrounding
                traffic and writes the postmortem before you do.
              </p>

              <div className="mt-5 flex-1 rounded-xl border border-white/[0.07] bg-black/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-[#EF4444]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#EF6B6B]">
                    Critical
                  </span>
                  <span className="font-mono text-[10px] text-[#4a4a52]">2m ago</span>
                </div>
                <p className="mt-3 text-sm font-medium text-white">
                  p99 latency spike on <span className="font-mono text-[#9a9aa4]">/api/checkout</span>
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-[#7a7a82]">
                  Latency jumped 6.4× starting 14:02 UTC, correlated with a downstream timeout from the
                  payments provider. 312 requests affected. Recommend a circuit breaker around the
                  payment client.
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-live" />
                  <span className="text-[10px] font-medium text-[#22C55E]">Resolved in 4m</span>
                </div>
              </div>
            </div>
          </SpotlightCard>
        </Reveal>

        {/* User-centric */}
        <Reveal delay={0.16}>
          <SpotlightCard className="h-full rounded-2xl">
            <div className={cardShell()}>
              <Users className="h-4 w-4 text-[#4B9AED]" />
              <h3 className="mt-4 text-base font-semibold text-white">User-centric observability</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#8a8a94]">
                Every event carries a user ID. Know exactly who an incident hits, not just which route.
              </p>
              <div className="mt-4 space-y-2">
                {TOP_USERS.map((u) => (
                  <div key={u.id} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: u.color }} />
                    <span className="flex-1 font-mono text-xs text-[#8a8a94]">{u.id}</span>
                    <span className="font-mono text-xs text-[#5a5a62]">{u.reqs} req</span>
                  </div>
                ))}
              </div>
            </div>
          </SpotlightCard>
        </Reveal>

        {/* Alerts + status page combined-ish */}
        <Reveal delay={0.2}>
          <SpotlightCard className="h-full rounded-2xl">
            <div className={cardShell()}>
              <Bell className="h-4 w-4 text-[#4B9AED]" />
              <h3 className="mt-4 text-base font-semibold text-white">Alerts + status page</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#8a8a94]">
                Route anomalies to Slack, PagerDuty or a webhook — and ship a public status page for free.
              </p>
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] text-[#5a5a62]">99.97% uptime</span>
                  <span className="text-[10px] text-[#4a4a52]">44 days</span>
                </div>
                <div className="flex gap-[2px]">
                  {UPTIME_DAYS.map((color, i) => (
                    <span
                      key={i}
                      className="h-4 flex-1 rounded-[1px]"
                      style={{
                        backgroundColor: color === "green" ? "#22C55E" : color === "yellow" ? "#F59E0B" : "#EF4444",
                        opacity: color === "green" ? 0.45 : 0.9,
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
