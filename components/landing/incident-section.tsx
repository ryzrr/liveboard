import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";

interface IncidentExample {
  severity: "Critical" | "Warning" | "Info";
  color: string;
  title: string;
  time: string;
}

const EXAMPLES: IncidentExample[] = [
  { severity: "Critical", color: "bg-red", title: "p99 latency spike on /api/checkout", time: "30m ago" },
  { severity: "Warning", color: "bg-yellow", title: "Elevated 4xx rate on /api/auth", time: "1h ago" },
  { severity: "Info", color: "bg-blue", title: "Traffic anomaly on /api/search", time: "3h ago" },
];

export function IncidentSection() {
  return (
    <section id="detection" className="border-t border-border px-6 py-20 lg:py-28">
      <RevealOnScroll className="mx-auto max-w-xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[2.4rem] sm:leading-[1.15]">
          It writes the postmortem before you open the dashboard.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted">
          A rolling z-score model flags anomalies in error rate and p99 latency, then writes a plain-English summary automatically.
        </p>
      </RevealOnScroll>

      <RevealOnScroll delayMs={100} className="mx-auto mt-10 max-w-2xl border border-border">
        {EXAMPLES.map((example) => (
          <div
            key={example.title}
            className="flex items-center gap-4 border-b border-border px-5 py-4 last:border-b-0"
          >
            <span className={`h-1.5 w-1.5 flex-shrink-0 ${example.color}`} aria-hidden />
            <span className="w-16 flex-shrink-0 text-[11px] uppercase tracking-wider text-muted">
              {example.severity}
            </span>
            <span className="flex-1 text-[13.5px] text-foreground">{example.title}</span>
            <span className="flex-shrink-0 font-mono text-[12px] text-muted">{example.time}</span>
          </div>
        ))}
      </RevealOnScroll>

      <RevealOnScroll delayMs={160} className="mx-auto mt-5 max-w-2xl text-center">
        <p className="text-[12.5px] text-muted">
          Deduplicates open incidents automatically and caps at ten AI calls per project per hour.
        </p>
      </RevealOnScroll>
    </section>
  );
}
