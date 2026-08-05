"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollIndicator() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.3 });

  return (
    <motion.div
      style={{ scaleX: progress }}
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-blue"
    />
  );
}
