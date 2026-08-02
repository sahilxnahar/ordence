"use client";

import { useRef } from "react";
import { useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
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
  const wrapper = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  /*
    Scroll progress, measured rather than cached.

    `useScroll({ target })` caches the element's geometry when the hook
    mounts. This section mounts inside a DeferredMount, above a WebGL
    canvas, and is 400vh tall — by the time layout settled, framer's
    cached height was stale, so progress never reached 1 and the four
    caption transforms disagreed with each other about where we were.

    Reading `getBoundingClientRect` in a passive, rAF-throttled listener
    costs a few microseconds per frame and cannot go stale. `-top` over
    `height - viewport` is exactly the "start start → end end" mapping,
    written out.
  */
  const scrollYProgress = useMotionValue(0);

  useEffect(() => {
    const node = wrapper.current;
    if (!node) return;
    let queued = false;

    const measure = () => {
      queued = false;
      const rect = node.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      if (travel <= 0) return;
      const raw = -rect.top / travel;
      scrollYProgress.set(Math.min(1, Math.max(0, raw)));
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [scrollYProgress]);

  /*
    One caption exists at a time. Not four, faded.

    This was four overlapping `useTransform` opacity windows, and two of
    them could be non-zero at once — which, stacked in the same absolute
    position, rendered as one illegible smear of two headlines. Tightening
    the windows did not fix it; the transforms disagreed about the current
    scroll position, and chasing that is fighting the symptom.

    Deriving the act as a single integer and rendering only that caption
    makes overlap structurally impossible rather than arithmetically
    unlikely. AnimatePresence in `wait` mode guarantees the outgoing one
    has left before the next arrives.
  */
  const [act, setAct] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.min(captions.length - 1, Math.max(0, Math.floor(v * 4)));
    setAct((current) => (current === next ? current : next));
  });

  const hintOpacity = useTransform(scrollYProgress, [0, 0.08, 0.14], [1, 1, 0]);

  return (
    <section
      ref={wrapper}
      aria-label="From chaos to order — the Ordence story"
      className="relative h-[400vh] bg-[#08090c]"
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

        {/* Captions — exactly one in the DOM at any moment */}
        <div className="pointer-events-none relative flex flex-1 items-end justify-center pb-24">
          {/*
            No AnimatePresence.

            With `mode="wait"` the outgoing caption's exit animation gates
            the incoming one, and a fast scroll queues act changes faster
            than those pairs can complete — the component deadlocked with
            every caption at opacity 0. Keying a single element on the act
            remounts it, so React discards the old node outright: there is
            no exit to wait for, and the entry animation always runs.
          */}
          {/*
            A CSS animation, not a JS one.

            Framer's entry animation was reliable for acts 1–3 and silently
            never ran when the visitor scrolled back up to act 0, leaving
            the first caption invisible. A keyframe with `forwards` cannot
            fail that way: remounting the node on `act` restarts it, and
            the end state is opacity 1 whatever the runtime does.
          */}
          <div
            key={act}
            className="act-caption pointer-events-none absolute bottom-24 px-6 text-center"
          >
            <p className="text-eyebrow mb-3 text-[#d4a136]!">
              {captions[act].eyebrow}
            </p>
            <p className="text-display text-3xl font-semibold text-[#f4f5f7] sm:text-5xl">
              {captions[act].line}
            </p>
          </div>
        </div>

        {/* Scroll hint */}
        <motion.div
          style={{ opacity: hintOpacity }}
          className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-xs tracking-[0.2em] text-[#8d94a3] uppercase"
        >
          Scroll to organize
        </motion.div>
      </div>
    </section>
  );
}
