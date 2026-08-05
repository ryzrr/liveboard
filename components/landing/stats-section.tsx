import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";
import { AnimatedCounter } from "@/components/landing/animated-counter";

const STATS = [
  { target: 2, label: "official SDKs" },
  { target: 5, label: "framework adapters" },
  { target: 4, label: "alert channels" },
];

export function StatsSection() {
  return (
    <section className="border-t border-border px-6 py-20 lg:py-28">
      <RevealOnScroll className="mx-auto max-w-xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[2.4rem] sm:leading-[1.15]">
          Built to be adopted in an afternoon.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted">
          No agents, no sidecars, no new infrastructure to run. Two SDKs, five adapters, and a status page for free.
        </p>
      </RevealOnScroll>

      <RevealOnScroll delayMs={100} className="mx-auto mt-12 grid max-w-4xl grid-cols-2 divide-x divide-y divide-border border border-border sm:grid-cols-4 sm:divide-y-0">
        {STATS.map((stat) => (
          <div key={stat.label} className="px-6 py-8 text-center">
            <div className="font-mono text-3xl font-semibold text-foreground sm:text-4xl">
              <AnimatedCounter target={stat.target} />
            </div>
            <div className="mt-2 text-[12.5px] leading-snug text-muted">{stat.label}</div>
          </div>
        ))}
        <div className="px-6 py-8 text-center">
          <div className="font-mono text-3xl font-semibold text-foreground sm:text-4xl">
            <AnimatedCounter target={90} prefix="<" suffix="s" />
          </div>
          <div className="mt-2 text-[12.5px] leading-snug text-muted">target time to first event</div>
        </div>
      </RevealOnScroll>

      <RevealOnScroll delayMs={160} className="mx-auto mt-6 max-w-xl text-center">
        <p className="text-[12.5px] text-muted">
          Self-host with Docker Compose. Multi-tenant by design, with Postgres row-level security keeping every org&apos;s data isolated on the same instance.
        </p>
      </RevealOnScroll>
    </section>
  );
}
