"use client";

import { useCallback, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import SceneCanvas from "./scene-canvas";
import ParticleField, { defaultParams, FIELD_CONTROLS } from "./particle-field";
import { SceneControls } from "./scene-controls";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { WordRotate } from "@/components/motion/word-rotate";

/**
 * HeroStage — the object comes out of the page.
 *
 * The trick is one line of CSS, not a second renderer: the canvas is
 * layered *above* the headline and blends additively. Additive blending
 * cannot darken, so the type is never occluded — particles pass in front
 * of the words as light, and the swarm reads as occupying the space
 * between the screen and the reader rather than sitting behind a window.
 *
 * Two modes:
 *   · resting — the field drifts, tracks the cursor, and the copy leads
 *   · play    — the visitor grabs the swarm and turns it, controls open,
 *               and the copy steps back so the object is the subject
 *
 * The mode is explicit rather than automatic. A hero that hijacks drag
 * on first touch fights the visitor who only meant to scroll; one that
 * announces "Play with it" hands over the keys deliberately.
 */

const FIELD = "convergence" as const;

export default function HeroStage() {
  const reduce = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [params, setParams] = useState(() => defaultParams(FIELD));
  const [spin, setSpin] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; sx: number; sy: number } | null>(
    null,
  );

  const setParam = useCallback(
    (key: string, value: number) => setParams((p) => ({ ...p, [key]: value })),
    [],
  );
  const reset = useCallback(() => {
    setParams(defaultParams(FIELD));
    setSpin({ x: 0, y: 0 });
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!playing) return;
      (e.target as Element).setPointerCapture?.(e.pointerId);
      drag.current = { x: e.clientX, y: e.clientY, sx: spin.x, sy: spin.y };
    },
    [playing, spin],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setSpin({
      x: d.sx + (e.clientY - d.y) * 0.005,
      y: d.sy + (e.clientX - d.x) * 0.005,
    });
  }, []);

  const endDrag = useCallback(() => {
    drag.current = null;
  }, []);

  return (
    <section
      aria-label="Ordence — the operating system for ambitious businesses"
      className="relative isolate overflow-hidden bg-[#08090c]"
    >
      <div className="relative flex min-h-[88svh] flex-col justify-center">
        {/* Copy sits underneath. It is readable through the swarm because
            additive blending only ever adds light. */}
        <Container className="relative z-0 flex flex-col items-start gap-7 py-24">
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: playing ? 0.35 : 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-mono text-[11px] tracking-[0.24em] text-white/55 uppercase"
          >
            CRM · ERP · Web · AI
          </motion.span>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: playing ? 0.28 : 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06 }}
            className="type-display max-w-4xl text-white"
          >
            The operating system for ambitious{" "}
            <WordRotate
              words={["businesses.", "founders.", "brands.", "teams."]}
              className="text-gradient-brand"
            />
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: playing ? 0.25 : 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="max-w-xl text-lg text-white/60"
          >
            Ordence unifies your customers, operations and intelligence on one
            enterprise-grade platform — under your brand, on your domain.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: playing ? 0.25 : 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="pointer-events-auto relative z-20 flex flex-wrap items-center gap-3"
          >
            <Button variant="accent" size="lg" href="/get-started">
              Start building <span aria-hidden="true">→</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              href="/#demo"
              className="border-white/25 bg-transparent text-white hover:border-white/45 hover:bg-white/10"
            >
              See it in action
            </Button>
          </motion.div>
        </Container>

        {/*
          The swarm, layered over the copy. `mix-blend-screen` is what sells
          the depth: the particles are lit *onto* the type rather than
          composited over it, so nothing is hidden and the object reads as
          nearer to you than the page is.
        */}
        <div
          aria-hidden={!playing}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={`absolute inset-0 z-10 mix-blend-screen ${
            playing
              ? "cursor-grab touch-none active:cursor-grabbing"
              : "pointer-events-none"
          }`}
        >
          <SceneCanvas
            frameloop="always"
            camera={{ position: [0, 0, 132], fov: 62 }}
            fallback={
              <div className="size-full bg-[radial-gradient(46%_46%_at_66%_50%,rgba(133,99,238,0.4),transparent_70%)]" />
            }
          >
            <ParticleField
              field={FIELD}
              count={reduce ? 6000 : 15000}
              colors={["#7d5bf0", "#ff8d7a", "#f2f4f8"]}
              size={2.6}
              offset={[34, 2]}
              params={params}
              spin={spin}
              still={!!reduce}
            />
          </SceneCanvas>
        </div>

        {/* Mode switch. Sits above the canvas so it stays clickable. */}
        <Container className="pointer-events-none relative z-20 pb-10">
          <div className="pointer-events-auto flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-pressed={playing}
              className="press inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/5 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-xl transition-colors hover:border-white/50 hover:bg-white/10"
            >
              <span
                aria-hidden="true"
                className={`size-2 rounded-full transition-colors ${
                  playing ? "bg-[#5eead4]" : "bg-[#a186f3]"
                }`}
              />
              {playing ? "Done playing" : "Play with it"}
            </button>
            <p className="font-mono text-[11px] tracking-[0.18em] text-white/40 uppercase">
              {playing ? "Drag to turn · tune it below" : "Scroll to continue"}
            </p>
          </div>
        </Container>

        {playing && (
          <SceneControls
            controls={FIELD_CONTROLS[FIELD]}
            values={params}
            onChange={setParam}
            onReset={reset}
            label="Tune it"
          />
        )}
      </div>
    </section>
  );
}
