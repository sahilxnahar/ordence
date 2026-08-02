"use client";

import { useCallback, useRef, useState } from "react";
import { useReducedMotion, useInView } from "framer-motion";
import SceneCanvas from "./scene-canvas";
import ParticleField, { FIELD_CONTROLS, defaultParams } from "./particle-field";
import { SceneControls } from "./scene-controls";
import { Container } from "@/components/ui/container";

/**
 * The magnetosphere band — one core, many workspaces.
 *
 * A single boiling core with fifty field lines arcing out through five
 * shells is a truer picture of multi-tenancy than any diagram we could
 * draw: the core is the platform, the shells are tenants, and every arc
 * returns to the same centre. It is also the most restrained of the three
 * scenes — near-monochrome plasma with the accent reserved for flares,
 * which is the same discipline the rest of the site follows.
 *
 * `accent` is a prop rather than a token read because this component is
 * reused on tenant workspace pages, where it is painted in the customer's
 * own brand colour. Their subdomain opens with a scene that is *theirs*.
 */

export default function MagnetosphereBand({
  accent = "#8563ee",
  secondary = "#ff5c5c",
  eyebrow = "Multi-tenant by design",
  title = "One core. Every workspace in orbit.",
  body = "Each customer gets their own subdomain, their own colours and their own module set — served from one platform at the edge, so a new workspace goes live in about a minute.",
  height = "tall",
}: {
  accent?: string;
  secondary?: string;
  eyebrow?: string;
  title?: string;
  body?: string;
  height?: "tall" | "compact";
}) {
  const reduce = useReducedMotion();
  const wrapper = useRef<HTMLElement>(null);
  const inView = useInView(wrapper, { margin: "200px" });

  // Control state lives here, not in the scene: the shader reads uniforms
  // every frame anyway, so a slider move is a number assignment, never a
  // React re-render of the WebGL tree.
  const [params, setParams] = useState(() => defaultParams("magnetosphere"));
  const setParam = useCallback(
    (key: string, value: number) => setParams((p) => ({ ...p, [key]: value })),
    [],
  );
  const resetParams = useCallback(
    () => setParams(defaultParams("magnetosphere")),
    [],
  );

  return (
    <section
      ref={wrapper}
      aria-label={title}
      className="relative isolate overflow-hidden bg-[#080c14]"
    >
      <div
        className={
          height === "tall"
            ? "relative h-[560px] lg:h-[720px]"
            : "relative h-[420px] lg:h-[520px]"
        }
      >
        <div className="absolute inset-0" aria-hidden="true">
          <SceneCanvas
            frameloop={inView ? "always" : "never"}
            camera={{ position: [0, 18, 150], fov: 50 }}
            lookAt={[0, 0, 0]}
            fallback={
              <div className="size-full bg-[radial-gradient(40%_40%_at_50%_50%,rgba(133,99,238,0.3),transparent_70%)]" />
            }
          >
            <ParticleField
              field="magnetosphere"
              count={reduce ? 6000 : 14000}
              colors={[accent, secondary, "#eef1f8"]}
              still={!!reduce}
              size={1.9}
              offset={[26, 0]}
              params={params}
            />
          </SceneCanvas>
        </div>

        {/* Copy sits to one side so the core is never behind text. */}
        <Container className="pointer-events-none relative flex h-full items-end pb-14 lg:items-center lg:pb-0">
          <div className="max-w-md">
            <p className="font-mono text-[11px] tracking-[0.24em] text-white/50 uppercase">
              {eyebrow}
            </p>
            <h2 className="type-h2 mt-4 text-white">{title}</h2>
            <p className="mt-5 text-white/60">{body}</p>
          </div>
        </Container>

        <SceneControls
          controls={FIELD_CONTROLS.magnetosphere}
          values={params}
          onChange={setParam}
          onReset={resetParams}
        />
      </div>
    </section>
  );
}
