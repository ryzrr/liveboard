"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { ScreenshotFrame } from "@/components/landing/screenshot-frame";
import { primaryButtonClass, secondaryButtonClass } from "@/components/landing/button-styles";

const EASE: [number, number, number, number] = [0.19, 1, 0.22, 1];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-28 lg:pb-28 lg:pt-24">
      <motion.div
        variants={reduceMotion ? undefined : container}
        initial={reduceMotion ? undefined : "hidden"}
        animate={reduceMotion ? undefined : "show"}
        className="mx-auto max-w-2xl text-center"
      >
        <motion.div variants={item}>
          <span className="inline-flex items-center gap-2 border border-border px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-muted">
            <span className="h-1.5 w-1.5 bg-green" aria-hidden />
            Open source and self-hostable
          </span>
        </motion.div>

        <motion.h1 variants={item} className="mt-6 text-[2.5rem] font-semibold leading-[1.08] tracking-[-0.02em] text-foreground sm:text-5xl lg:text-[3.4rem]">
          Know the moment
          <br />
          your API breaks.
        </motion.h1>

        <motion.p variants={item} className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-muted">
          Live request metrics, error tracking, and AI-written incident summaries, wired up with one line of middleware.
        </motion.p>

        <motion.div variants={item} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/auth/signin" className={primaryButtonClass("md", "w-full sm:w-auto")}>
            Start monitoring
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <a
            href="https://github.com/ryzrr/liveboard"
            target="_blank"
            rel="noreferrer"
            className={secondaryButtonClass("md", "w-full sm:w-auto")}
          >
            View on GitHub
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
        className="relative mx-auto mt-16 max-w-5xl"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 bg-blue/10 blur-[120px]"
        />
        <ScreenshotFrame
          src="/shots/overview.png"
          alt="Liveboard overview dashboard showing live request volume, error rate, and AI incident summaries"
          priority
          focusTop
          className="aspect-[3040/1900] w-full border border-border"
        />
      </motion.div>
    </section>
  );
}
