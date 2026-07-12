"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { BrowserFrame } from "@/components/landing/browser-frame";
import { CountUp } from "@/components/landing/count-up";
import { RadarField } from "@/components/landing/radar-field";

const STATS = [
  { node: <CountUp to={2.4} decimals={1} suffix="B+" />, label: "requests observed" },
  { node: <CountUp to={1} prefix="<" suffix="min" />, label: "to first live data" },
  { node: <CountUp to={99.99} decimals={2} suffix="%" />, label: "pipeline uptime" },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] } },
};

export function Hero() {
  const shotRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: shotRef, offset: ["start 0.85", "end start"] });
  // Crisp and near-flat at rest; only a whisper of depth + parallax drift.
  const shotY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const shotRotate = useTransform(scrollYProgress, [0, 0.5], [3, 0]);
  const shotScale = useTransform(scrollYProgress, [0, 0.5], [0.985, 1]);

  return (
    <section className="relative isolate overflow-hidden px-6 pt-36 sm:pt-40">
      {/* Radar backdrop */}
      <RadarField />

      <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-3xl text-center">
        <motion.div variants={item}>
          <Link
            href="#tracing"
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1 pr-3 font-mono text-[12px] text-[#b4b4bc] backdrop-blur-sm transition-colors hover:border-white/20"
          >
            <span className="flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-white">
              <Sparkles className="h-3 w-3 text-[#4B9AED]" />
              New
            </span>
            AI incident summaries are live
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        <h1 className="mt-6 font-display text-[2.7rem] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-6xl lg:text-[4.25rem]">
          <motion.span variants={item} className="block">
            <span className="gradient-text">Know the moment</span>
          </motion.span>
          <motion.span variants={item} className="block">
            <span className="gradient-text">your API </span>
            <span className="gradient-accent">breaks</span>
            <span className="gradient-text">.</span>
          </motion.span>
        </h1>

        <motion.p variants={item} className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-[#8a8a94] sm:text-base">
          Real-time observability for your APIs. Distributed traces, live error tracking,
          and AI-written incident postmortems — from a single line of middleware.
        </motion.p>

        <motion.div variants={item} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/auth/signin"
            className="group flex w-full items-center justify-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#0A0A0A] transition-transform hover:scale-[1.03] active:scale-95 sm:w-auto"
          >
            Start for free
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="https://github.com/ryzrr/liveboard"
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-[#e4e4ec] backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/[0.06] sm:w-auto"
          >
            <span className="font-mono text-[13px] text-[#8a8a94]">$</span>
            npm i liveboard-sdk
          </a>
        </motion.div>

        <motion.p variants={item} className="mt-5 font-mono text-[12px] tracking-tight text-[#5a5a62]">
          Open source · Self-hostable · Free to start
        </motion.p>
      </motion.div>

      {/* Real product shot — near-flat, subtle scroll parallax */}
      <div ref={shotRef} className="relative mx-auto mt-16 max-w-5xl [perspective:2000px]">
        {/* subtle monochrome ambient behind the frame */}
        <div className="pointer-events-none absolute -inset-x-8 -top-8 bottom-10 -z-10 rounded-[40px] bg-white/[0.03] blur-3xl" />
        <motion.div
          style={{ y: shotY, rotateX: shotRotate, scale: shotScale, transformPerspective: 2000 }}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="relative origin-top will-change-transform"
        >
          <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-xl">
            <div className="animate-frame-shine absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          </div>
          <BrowserFrame
            src="/shots/overview.png"
            alt="Liveboard overview dashboard — live request metrics, charts and streaming request log"
            url="app.liveboard.dev/overview"
            width={3040}
            height={1900}
            priority
            live
          />
        </motion.div>
        <div className="pointer-events-none absolute inset-x-0 -bottom-1 h-48 bg-gradient-to-b from-transparent to-[#08080A]" />
      </div>

      {/* Stat band with count-up */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-4 border-t border-white/[0.06] pt-10"
      >
        {STATS.map((s, i) => (
          <div key={i} className="text-center">
            <div className="font-mono text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">{s.node}</div>
            <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b6b74]">{s.label}</div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
