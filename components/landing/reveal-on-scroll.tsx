"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";

const EASE: Transition["ease"] = [0.19, 1, 0.22, 1];

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  fromY?: number;
}

export function RevealOnScroll({ children, className, delayMs = 0, fromY = 14 }: RevealOnScrollProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: fromY }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
      transition={{ duration: 0.5, delay: delayMs / 1000, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
