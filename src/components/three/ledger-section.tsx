"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import SceneCanvas from "./scene-canvas";
import LivingLedger from "./living-ledger";

/**
 * The Living Ledger scroll story — a pinned, 4-act sequence on a dark
 * ink stage (the one dark band on the white site, so the additive glow
 * reads dramatically).
 *
 * Outer wrapper is 400vh tall; the inner viewport is sticky, so the
 * visitor "scrubs" the particle morph with their scroll wheel:
 *   act 0  chaos       "Your business, before."
 *   act 1  pipeline    "Every lead, in line."   (CRM)
 *   act 2  lattice     "Every order, on time."  (ERP)
 *   act 3  orbit       "One system. Ordence."
 */

const captions = [
  { eyebrow: "Before Ordence", line: "A thousand scattered records." },
  { eyebrow: "CRM", line: "Every lead, in line." },
  { eyebrow: "ERP", line: "Every order, on time." },
  { eyebrow: "One platform", line: "One system. Ordence." },
] as const;

export default function LedgerSection() {
  const wrapper = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: wrapper,
    offset: ["start start", "end end"],
  });

  // Caption opacities: each act owns a quarter of the scroll.
  const o0 = useTransform(scrollYProgress, [0, 0.16, 0.25], [1, 1, 0]);
  const o1 = useTransform(scrollYProgress, [0.2, 0.3, 0.41, 0.5], [0, 1, 1, 0]);
  const o2 = useTransform(
    scrollYProgress,
    [0.45, 0.55, 0.66, 0.75],
    [0, 1, 1, 0],
  );
  const o3 = useTransform(scrollYProgress, [0.72, 0.85, 1], [0, 1, 1]);
  const opacities = [o0, o1, o2, o3];

  return (
    <section
      ref={wrapper}
      aria-label="From chaos to order — the Ordence story"
      className="relative h-[400vh] bg-[#0b101b]"
    >
      <div className="sticky top-0 flex h-svh flex-col overflow-hidden">
        {/* Scene */}
        <div className="absolute inset-0">
          <SceneCanvas
            frameloop={reduce ? "demand" : "always"}
            fallback={
              <div className="size-full bg-[radial-gradient(60%_60%_at_50%_45%,rgba(109,69,232,0.25),transparent_70%)]" />
            }
          >
            <LivingLedger progress={scrollYProgress} />
          </SceneCanvas>
        </div>

        {/* Captions */}
        <div className="pointer-events-none relative flex flex-1 items-end justify-center pb-24">
          {captions.map((c, i) => (
            <motion.div
              key={c.line}
              style={{ opacity: reduce ? (i === 3 ? 1 : 0) : opacities[i] }}
              className="absolute bottom-24 text-center"
            >
              <p className="text-eyebrow mb-3 text-[#8a94b8]!">{c.eyebrow}</p>
              <p className="text-display text-3xl font-semibold text-[#f2f4f8] sm:text-5xl">
                {c.line}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Scroll hint */}
        <motion.div
          style={{ opacity: o0 }}
          className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-xs tracking-[0.2em] text-[#8a94b8] uppercase"
        >
          Scroll to organize
        </motion.div>
      </div>
    </section>
  );
}
