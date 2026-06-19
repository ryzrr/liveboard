import { Reveal } from "@/components/landing/reveal";
import { SpotlightCard } from "@/components/landing/spotlight-card";

const STEPS = [
  {
    n: "01",
    title: "Install the SDK",
    body: "Pick your language. The JS SDK supports Express and Fastify; the Python SDK supports FastAPI, Django, and Flask.",
    code: "npm install liveboard-sdk",
  },
  {
    n: "02",
    title: "Add one line",
    body: "Wire the middleware with your project's API key. No restart-the-world config, no separate collector to deploy.",
    code: "app.use(liveboard.middleware({ apiKey }))",
  },
  {
    n: "03",
    title: "Watch it live",
    body: "Requests start streaming into your dashboard within seconds. Anomalies get flagged and summarized automatically.",
    code: "→ liveboard.dev/overview",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-[#1E1E1E] bg-[#0C0C0C]">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Reveal className="max-w-xl">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-blue">Setup</span>
          <h2 className="mt-3 text-3xl font-display font-bold tracking-tight text-[#F5F5F5] sm:text-4xl">
            From zero to live data in under a minute
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={i * 0.1} className="relative">
              <SpotlightCard className="rounded-xl">
                <div className="rounded-xl p-1">
                  <span className="font-display text-5xl font-bold text-[#1E1E1E] transition-colors group-hover:text-blue-dim">
                    {step.n}
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-[#F5F5F5]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#777]">{step.body}</p>
                  <div className="mt-4 rounded-lg border border-[#1E1E1E] bg-[#111111] px-3 py-2">
                    <code className="text-[11px] font-mono text-[#666] break-all">{step.code}</code>
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
