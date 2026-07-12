import { Reveal } from "@/components/landing/reveal";
import { SpotlightCard } from "@/components/landing/spotlight-card";
import { InstallSnippet, MiddlewareSnippet, DashboardUrlSnippet } from "@/components/landing/code-snippet";

const STEPS = [
  {
    n: "01",
    lang: "bash",
    title: "Install the SDK",
    body: "Pick your language. The JS SDK supports Express and Fastify; the Python SDK supports FastAPI, Django, and Flask.",
    code: <InstallSnippet />,
  },
  {
    n: "02",
    lang: "javascript",
    title: "Add one line",
    body: "Wire the middleware with your project's API key. No restart-the-world config, no separate collector to deploy.",
    code: <MiddlewareSnippet />,
  },
  {
    n: "03",
    lang: "output",
    title: "Watch it live",
    body: "Requests start streaming into your dashboard within seconds. Anomalies get flagged and summarized automatically.",
    code: <DashboardUrlSnippet />,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-white/[0.06] bg-white/[0.012]">
      <div className="mx-auto max-w-5xl px-6 py-16 lg:py-20">
        <Reveal className="max-w-xl">
          <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#8a8a94]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4B9AED] animate-live" />
            Setup
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-[2.4rem]">
            From zero to live data in under a minute
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={i * 0.1} className="relative">
              <SpotlightCard className="h-full rounded-2xl">
                <div className="h-full rounded-2xl hairline hairline-hover p-6">
                  <span className="font-display text-5xl font-bold text-white/[0.09] transition-colors group-hover:text-[#4B9AED]/40">
                    {step.n}
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#8a8a94]">{step.body}</p>
                  <div className="mt-4 overflow-hidden rounded-lg border border-white/[0.07] bg-black/50">
                    <div className="flex items-center justify-between border-b border-white/[0.05] px-3 py-1.5">
                      <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
                        <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
                        <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
                      </div>
                      <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#4a4a52]">{step.lang}</span>
                    </div>
                    <div className="break-all px-3 py-2.5">{step.code}</div>
                  </div>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
