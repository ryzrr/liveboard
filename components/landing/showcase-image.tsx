"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BrowserFrame } from "@/components/landing/browser-frame";

interface ShowcaseImageProps {
  image: { src: string; alt: string; url: string; width: number; height: number; live?: boolean };
  reversed?: boolean;
  glow?: string;
}

export function ShowcaseImage({ image, reversed, glow = "rgba(255,255,255,0.05)" }: ShowcaseImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Gentle parallax rise + settle of tilt as the panel scrolls through view.
  const y = useTransform(scrollYProgress, [0, 1], [56, -56]);
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [reversed ? 5 : -5, 0, reversed ? -3 : 3]);

  return (
    <div ref={ref} className="relative [perspective:1600px]">
      <div
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[40px] opacity-70 blur-3xl"
        style={{ background: `radial-gradient(60% 60% at 50% 40%, ${glow}, transparent 70%)` }}
      />
      <motion.div
        style={{ y, rotateY: rotate, transformPerspective: 1600 }}
        initial={{ opacity: 0, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="relative will-change-transform"
      >
        {/* Moving shine */}
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-xl">
          <div className="animate-frame-shine absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
        </div>
        <BrowserFrame {...image} />
      </motion.div>
    </div>
  );
}
