"use client";

import { useCallback, useRef, useState } from "react";
import { useReducedMotion, useInView } from "framer-motion";
import SceneCanvas from "./scene-canvas";
import ParticleField, {
  FIELD_CONTROLS,
  defaultParams,
} from "./particle-field";
import { SceneControls } from "./scene-controls";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

/**
 * The lamp band — the quiet one, and therefore the last one.
 *
 * A filament, a cone of light, the pool it casts and dust drifting
 * through it. It is the only scene here that isn't trying to impress you,
 * which is exactly why it closes pages instead of opening them: after
 * three screens of capability, the final note should be human.
 *
 * Warm amber against the site's violet is deliberate. This is the one
 * place the brand palette steps aside.
 */

export default function LampBand({
  eyebrow = "Talk to a human",
  title = "Someone is actually here.",
  body = "No chatbot maze, no lead-scoring purgatory. Tell us what you're building and a person replies — usually the same day.",
  primaryHref = "/contact",
  primaryLabel = "Start a conversation",
  secondaryHref = "/get-started",
  secondaryLabel = "Request a workspace",
}: {
  eyebrow?: string;
  title?: string;
  body?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  const reduce = useReducedMotion();
  const wrapper = useRef<HTMLElement>(null);
  const inView = useInView(wrapper, { margin: "200px" });

  // Control state lives here, not in the scene: the shader reads uniforms
  // every frame anyway, so a slider move is a number assignment, never a
  // React re-render of the WebGL tree.
  const [params, setParams] = useState(() => defaultParams("lamp"));
  const setParam = useCallback(
    (key: string, value: number) => setParams((p) => ({ ...p, [key]: value })),
    [],
  );
  const resetParams = useCallback(() => setParams(defaultParams("lamp")), []);


  return (
    <section
      ref={wrapper}
      aria-label={title}
      className="relative isolate overflow-hidden bg-[#07090f]"
    >
      <div className="relative h-[600px] lg:h-[700px]">
        <div className="absolute inset-0" aria-hidden="true">
          <SceneCanvas
            frameloop={inView ? "always" : "never"}
            camera={{ position: [0, 0, 163], fov: 48 }}
            fallback={
              <div className="size-full bg-[radial-gradient(35%_55%_at_50%_10%,rgba(255,196,120,0.28),transparent_70%)]" />
            }
          >
            <ParticleField
              field="lamp"
              count={reduce ? 5000 : 13000}
              still={!!reduce}
              size={2.9}
              offset={[0, 22]}
              params={params}
            />
          </SceneCanvas>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#07090f] via-[#07090f]/85 to-transparent"
        />
        <Container className="relative flex h-full flex-col items-center justify-end pb-16 text-center">
          <p className="font-mono text-[11px] tracking-[0.24em] text-white/45 uppercase">
            {eyebrow}
          </p>
          <h2 className="type-h2 mt-4 max-w-xl text-white">{title}</h2>
          <p className="measure-narrow mt-5 text-white/60">{body}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button href={primaryHref} variant="accent">
              {primaryLabel} <span aria-hidden="true">→</span>
            </Button>
            <Button
              href={secondaryHref}
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:border-white/40 hover:bg-white/10"
            >
              {secondaryLabel}
            </Button>
          </div>
        </Container>

        <SceneControls
          controls={FIELD_CONTROLS.lamp}
          values={params}
          onChange={setParam}
          onReset={resetParams}
          tone="amber"
        />
      </div>
    </section>
  );
}
