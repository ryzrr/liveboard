import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import { Reveal } from "@/components/landing/reveal";
import { NetworkGraph } from "@/components/landing/network-graph";

export function Hero() {
  return (
    <section className="relative isolate">
      {/* Misty ambient glow — built from the Liveboard mark's own palette */}
      <div
        className="animate-drift pointer-events-none absolute -top-24 left-1/2 -z-10 h-[480px] w-[820px] rounded-full opacity-[0.32] blur-[100px]"
        style={{ background: "conic-gradient(from 90deg, #06B6D4, #F59E0B, #F43F5E, #3B82F6, #A855F7, #06B6D4)" }}
      />
      <div
        className="pointer-events-none absolute -top-10 left-1/2 -z-10 h-[300px] w-[460px] -translate-x-1/2 rounded-full opacity-[0.18] blur-[90px]"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.6), transparent 70%)" }}
      />

      <NetworkGraph />

      <div className="relative mx-auto flex max-w-2xl flex-col items-center px-6 pt-10 pb-16 text-center lg:pt-16">
        <Reveal className="flex flex-col items-center">
          <Link
            href="#how-it-works"
            aria-label="See how Liveboard works"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F5F5] transition-transform hover:scale-105"
          >
            <Play className="h-5 w-5 fill-[#0A0A0A] text-[#0A0A0A]" />
          </Link>

          <Link
            href="#features"
            className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-[#262626] bg-[#121212]/90 px-3.5 py-1.5 text-[12px] text-[#aaa] backdrop-blur-sm transition-colors hover:border-blue-border hover:text-[#F5F5F5]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green animate-pulse" />
            Real-time API observability
            <ArrowUpRight className="h-3 w-3" />
          </Link>

          <h1 className="mt-6 text-[2.9rem] leading-[1.05] font-display font-bold tracking-tight text-[#F5F5F5] sm:text-6xl lg:text-[4.2rem]">
            Know the moment
            <br />
            your API <span className="text-blue">breaks.</span>
          </h1>

          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-[#999]">
            One line of middleware. Real-time traces, error tracking, and AI incident summaries.
          </p>

          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/auth/signin"
              className="flex items-center gap-1.5 rounded-full border border-[#262626] bg-[#141414] px-5 py-2.5 text-sm font-medium text-[#F5F5F5] transition-transform hover:scale-[1.03] hover:border-[#333] active:scale-[0.98]"
            >
              Open dashboard
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="#how-it-works"
              className="flex items-center rounded-full bg-[#F5F5F5] px-5 py-2.5 text-sm font-medium text-[#0A0A0A] transition-transform hover:scale-[1.03] hover:bg-white active:scale-[0.98]"
            >
              See how it works
            </Link>

            {/* Falling light rays */}
            <div className="pointer-events-none absolute left-1/2 top-full hidden -translate-x-1/2 gap-7 pt-2 sm:flex">
              <span className="h-16 w-px bg-gradient-to-b from-[#333] to-transparent" />
              <span className="h-24 w-px bg-gradient-to-b from-[#333] to-transparent" />
              <span className="h-10 w-px bg-gradient-to-b from-[#333] to-transparent" />
            </div>
          </div>
        </Reveal>
      </div>

      <div className="absolute bottom-6 left-6 hidden items-center gap-2.5 lg:flex">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F5F5F5] text-[#0A0A0A]">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1v8M1.5 5.5L5 9l3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="text-[11px] text-[#666]">01 / 03 &middot; Scroll down</span>
      </div>

      <div className="absolute bottom-6 right-6 hidden flex-col items-end gap-2 lg:flex">
        <span className="text-[11px] text-[#666]">Service map</span>
        <div className="flex gap-1">
          <span className="h-1 w-6 rounded-full bg-blue" />
          <span className="h-1 w-6 rounded-full bg-[#262626]" />
          <span className="h-1 w-6 rounded-full bg-[#262626]" />
        </div>
      </div>
    </section>
  );
}
