import Link from "next/link";
import { ArrowUpRight, Activity, Container } from "lucide-react";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";

export function CtaSection() {
  return (
    <section className="border-t border-border px-6 py-20 lg:py-28">
      <RevealOnScroll className="mx-auto max-w-xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[2.4rem] sm:leading-[1.15]">
          One line of middleware. Zero blind spots.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted">
          Self-host the whole stack, or sign in and start right here.
        </p>
      </RevealOnScroll>

      <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
        <RevealOnScroll>
          <Link
            href="/auth/signin"
            className="group relative flex h-[280px] flex-col justify-between overflow-hidden border border-border p-7 transition-colors hover:border-muted"
          >
            <div>
              <h3 className="text-lg font-semibold text-foreground">Start monitoring</h3>
              <p className="mt-2 max-w-[26ch] text-[13.5px] leading-relaxed text-muted">
                Create a project, copy your API key, install the SDK.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
              Start monitoring
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
            <Activity className="pointer-events-none absolute -bottom-8 -right-8 h-48 w-48 text-blue/10" strokeWidth={0.75} aria-hidden />
          </Link>
        </RevealOnScroll>

        <RevealOnScroll delayMs={80}>
          <a
            href="https://github.com/ryzrr/liveboard"
            target="_blank"
            rel="noreferrer"
            className="group relative flex h-[280px] flex-col justify-between overflow-hidden border border-border p-7 transition-colors hover:border-muted"
          >
            <div>
              <h3 className="text-lg font-semibold text-foreground">Self-host with Docker Compose</h3>
              <p className="mt-2 max-w-[26ch] text-[13.5px] leading-relaxed text-muted">
                Docker Compose spins up Postgres, Redis, the API, and the worker in one command.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
              View on GitHub
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
            <Container className="pointer-events-none absolute -bottom-8 -right-8 h-48 w-48 text-foreground/[0.06]" strokeWidth={0.75} aria-hidden />
          </a>
        </RevealOnScroll>
      </div>
    </section>
  );
}
