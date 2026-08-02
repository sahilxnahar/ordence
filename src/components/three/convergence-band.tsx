"use client";

import { useCallback, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useInView,
} from "framer-motion";
import SceneCanvas from "./scene-canvas";
import ParticleField, {
  FIELD_CONTROLS,
  defaultParams,
} from "./particle-field";
import { SceneControls } from "./scene-controls";
import { Container } from "@/components/ui/container";

/**
 * The convergence band — the homepage's argument, made visible.
 *
 * Every Ordence pitch reduces to one sentence: your enquiries arrive on
 * five channels and end up in one record. This section *is* that sentence.
 * Particles enter as unstable noise at the rim and are pulled into a
 * single still core, and the instability term is wired to scroll — so the
 * visitor performs the transition themselves rather than watching a loop.
 *
 * A dark full-bleed band on an otherwise white site: the additive glow
 * only reads against near-black, and the contrast is what makes the
 * moment feel like a moment.
 */

const CHANNELS = [
  { label: "WhatsApp", at: "13%", top: "16%" },
  { label: "Missed calls", at: "79%", top: "24%" },
  { label: "Website forms", at: "17%", top: "52%" },
  { label: "Inbound email", at: "81%", top: "58%" },
] as const;

export default function ConvergenceBand() {
  const wrapper = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  // A band that has scrolled away still renders every frame unless it is
  // told not to. With three bands on a page that is three idle render
  // loops competing for the same GPU.
  const inView = useInView(wrapper, { margin: "200px" });
  // Control state lives here, not in the scene: the shader reads uniforms
  // every frame anyway, so a slider move is a number assignment, never a
  // React re-render of the WebGL tree.
  const [params, setParams] = useState(() => defaultParams("convergence"));
  const setParam = useCallback(
    (key: string, value: number) => setParams((p) => ({ ...p, [key]: value })),
    [],
  );
  const resetParams = useCallback(() => setParams(defaultParams("convergence")), []);

  const { scrollYProgress } = useScroll({
    target: wrapper,
    offset: ["start end", "end start"],
  });

  // Channel labels belong to the noisy half; they fade as order arrives.
  const channelOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.28, 0.55],
    [0, 1, 0],
  );
  const coreOpacity = useTransform(scrollYProgress, [0.26, 0.44], [0, 1]);

  return (
    <section
      ref={wrapper}
      aria-label="Every channel becomes one record"
      className="relative isolate overflow-hidden bg-[#080c14]"
    >
      <div className="relative h-[520px] sm:h-[640px] lg:h-[760px]">
        <div className="absolute inset-0" aria-hidden="true">
          <SceneCanvas
            frameloop={inView ? "always" : "never"}
            camera={{ position: [0, 0, 170], fov: 55 }}
            fallback={
              <div className="size-full bg-[radial-gradient(45%_45%_at_50%_50%,rgba(109,69,232,0.35),transparent_70%)]" />
            }
          >
            <ParticleField
              field="convergence"
              count={reduce ? 5000 : 12000}
              progress={scrollYProgress}
              still={!!reduce}
              size={2.4}
              colors={["#7d5bf0", "#ff8d7a", "#f2f4f8"]}
              offset={[0, 26]}
              params={params}
            />
          </SceneCanvas>
        </div>

        {/* Channel labels, positioned out at the rim where the noise is. */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          {CHANNELS.map((c) => (
            <motion.span
              key={c.label}
              style={{
                opacity: reduce ? 0.5 : channelOpacity,
                left: c.at,
                top: c.top,
              }}
              className="absolute -translate-x-1/2 font-mono text-[11px] tracking-[0.18em] text-white/45 uppercase"
            >
              {c.label}
            </motion.span>
          ))}
        </div>

        {/* A scrim under the copy. Particles drifting across a headline is
            the difference between "cinematic" and "unreadable"; this keeps
            the type on a settled ground without dimming the scene above it. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#080c14] via-[#080c14]/85 to-transparent"
        />

        {/* Copy lives in the lower third so the core is never behind a word. */}
        <Container className="pointer-events-none relative flex h-full flex-col items-center justify-end pb-16 text-center lg:pb-20">
          <motion.p
            style={{ opacity: reduce ? 1 : coreOpacity }}
            className="font-mono text-[11px] tracking-[0.24em] text-white/50 uppercase"
          >
            One system of record
          </motion.p>
          <motion.h2
            style={{ opacity: reduce ? 1 : coreOpacity }}
            className="type-h1 mt-4 max-w-2xl text-white"
          >
            Five channels in.
            <br />
            One record out.
          </motion.h2>
          <motion.p
            style={{ opacity: reduce ? 1 : coreOpacity }}
            className="measure-narrow mt-5 text-white/60"
          >
            WhatsApp, missed calls, forms and email stop being four inboxes
            and start being one timeline — owned by a named person, seconds
            after it arrives.
          </motion.p>
        </Container>

        <SceneControls
          controls={FIELD_CONTROLS.convergence}
          values={params}
          onChange={setParam}
          onReset={resetParams}
        />
      </div>

      {/* Hairline seam back into the white page. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#080c14]"
      />
    </section>
  );
}
