import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";
import { ScreenshotFrame } from "@/components/landing/screenshot-frame";

export function StatusSection() {
  return (
    <section id="status" className="border-t border-border px-6 py-20 lg:py-28">
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
        <RevealOnScroll>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[2.4rem] sm:leading-[1.15]">
            A status page your users actually trust.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
            Generated from the same data you already collect: uptime, incident timelines, and component health, published automatically.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delayMs={100}>
          <ScreenshotFrame
            src="/shots/status.png"
            alt="Public status page showing component uptime bars and an active degraded-performance incident"
            focusTop
            className="aspect-[2480/2000] w-full border border-border"
          />
        </RevealOnScroll>
      </div>
    </section>
  );
}
