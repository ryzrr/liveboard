import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";
import { ScreenshotFrame } from "@/components/landing/screenshot-frame";
import { InstallSnippet } from "@/components/landing/install-snippet";

export function FeatureGrid() {
  return (
    <section id="features" className="border-t border-border px-6 py-20 lg:py-28">
      <RevealOnScroll className="mx-auto max-w-xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[2.4rem] sm:leading-[1.15]">
          Every request, instrumented.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted">
          Live request metrics, per-endpoint health scores, and AI incident summaries — from one line of middleware.
        </p>
      </RevealOnScroll>

      <RevealOnScroll delayMs={60} className="mx-auto mt-10 max-w-3xl">
        <InstallSnippet />
      </RevealOnScroll>

      <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4">
        <RevealOnScroll className="grid grid-cols-1 gap-0 border border-border md:grid-cols-[1.3fr_1fr]">
          <ScreenshotFrame
            src="/shots/overview.png"
            alt="Liveboard overview dashboard with live request volume, response code distribution, and the live request log"
            className="aspect-[3040/1900] w-full border-b border-border md:aspect-auto md:h-full md:border-b-0 md:border-r"
          />
          <div className="flex flex-col justify-center p-7 md:min-h-[320px]">
            <h3 className="text-lg font-semibold text-foreground">Live request stream</h3>
            <p className="mt-2.5 text-[14px] leading-relaxed text-muted">
              Request volume, response codes, and a tailing log of every call — pushed to the browser over Socket.io and SSE as the traffic happens, not on a refresh timer.
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <RevealOnScroll delayMs={80} className="border border-border">
            <ScreenshotFrame
              src="/shots/endpoints.png"
              alt="Endpoint explorer table with error rate, p50/p95/p99 latency, and health scores"
              focusTop
              className="aspect-[3040/1900] w-full border-b border-border"
            />
            <div className="p-6">
              <h3 className="text-base font-semibold text-foreground">Endpoint health scores</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                Sort by error rate or p99 latency and catch a regression before it pages anyone.
              </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delayMs={140} className="flex flex-col justify-between border border-border p-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Anomalies, not thresholds</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                A rolling z-score over the last 24 hours of error rate and p99 latency decides what is actually unusual for your API — no thresholds to tune, no alert fatigue.
              </p>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-3">
              {[
                { term: "Window", detail: "24 h rolling" },
                { term: "Trigger", detail: "|z| > 3" },
                { term: "Rate limit", detail: "10 / project / h" },
                { term: "Summary", detail: "llama-3.3-70b" },
              ].map((stat) => (
                <div key={stat.term} className="border border-border-subtle px-3 py-2.5">
                  <dt className="text-[11px] uppercase tracking-wider text-muted">{stat.term}</dt>
                  <dd className="mt-0.5 font-mono text-[12.5px] text-foreground">{stat.detail}</dd>
                </div>
              ))}
            </dl>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
