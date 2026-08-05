import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";
import { ScreenshotFrame } from "@/components/landing/screenshot-frame";
import { ALERT_CHANNELS, ChannelMarkIcon } from "@/components/landing/channel-marks";
import { InstallSnippet } from "@/components/landing/install-snippet";

export function FeatureGrid() {
  return (
    <section id="features" className="border-t border-border px-6 py-20 lg:py-28">
      <RevealOnScroll className="mx-auto max-w-xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[2.4rem] sm:leading-[1.15]">
          Every request, instrumented.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted">
          Distributed traces, per-endpoint health scores, and alerts routed to the tools your team already uses.
        </p>
      </RevealOnScroll>

      <RevealOnScroll delayMs={60} className="mx-auto mt-10 max-w-3xl">
        <InstallSnippet />
      </RevealOnScroll>

      <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4">
        <RevealOnScroll className="grid grid-cols-1 gap-0 border border-border md:grid-cols-[1.3fr_1fr]">
          <ScreenshotFrame
            src="/shots/traces.png"
            alt="Distributed trace flame graph showing spans across api-gateway, auth-service, product-service, and payment-service"
            className="aspect-[3040/1900] w-full border-b border-border md:aspect-auto md:h-full md:border-b-0 md:border-r"
          />
          <div className="flex flex-col justify-center p-7 md:min-h-[320px]">
            <h3 className="text-lg font-semibold text-foreground">Distributed tracing</h3>
            <p className="mt-2.5 text-[14px] leading-relaxed text-muted">
              Flame graphs and service maps for every request, down to the individual span. Trace IDs propagate across all five SDK adapters automatically.
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
              <h3 className="text-base font-semibold text-foreground">Alerts that reach your team</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                Threshold rules on error rate or latency, routed to the channel your on-call rotation actually watches.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {ALERT_CHANNELS.map((channel) => (
                <div key={channel.key} className="flex items-center gap-2 border border-border-subtle px-3 py-2.5">
                  <ChannelMarkIcon channel={channel} className="h-4 w-4 flex-shrink-0 text-muted" />
                  <span className="text-[12.5px] text-foreground">{channel.label}</span>
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
