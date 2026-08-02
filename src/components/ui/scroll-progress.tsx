"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Hairline brand-gradient scroll progress bar under the header. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    restDelta: 0.001,
  });
  return (
    <motion.div
      aria-hidden="true"
      className="bg-gradient-brand fixed inset-x-0 top-0 z-50 h-0.5 origin-left"
      style={{ scaleX }}
    />
  );
}
