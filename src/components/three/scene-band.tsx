"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import SceneCanvas from "./scene-canvas";
import ParticleField, {
  defaultParams,
  FIELD_CONTROLS,
  type FieldName,
} from "./particle-field";
import { SceneControls } from "./scene-controls";
import { Container } from "@/components/ui/container";

/**
 * SceneBand — the single choreography for every dark WebGL band.
 *
 * Before this existed, each band re-declared the same six decisions:
 * stage height, camera framing, in-view pausing, where the copy sits,
 * whether there is a scrim, and where the controls live. They drifted
 * apart immediately — which is exactly how a site stops feeling composed
 * and starts feeling assembled.
 *
 * The rules this enforces, once:
 *  · three stage heights only (compact / normal / tall), all fluid
 *  · copy is either bottom-centred or left-aligned — never anything else
 *  · a scrim under bottom-centred copy, never under left copy (where the
 *    scene has already been offset out of the way)
 *  · controls always in the bottom-right corner, always collapsed first
 *  · the render loop always pauses when the band leaves the viewport
 *
 * A band that needs something outside these rules is a signal to change
 * the rule, not to opt out of the component.
 */

const HEIGHTS = {
  compact: "h-[440px] lg:h-[540px]",
  normal: "h-[560px] lg:h-[700px]",
  tall: "h-[620px] sm:h-[680px] lg:h-[780px]",
} as const;

export interface SceneBandProps {
  field: FieldName;
  /** Bottom-centred copy gets a scrim; left copy relies on scene offset. */
  align?: "bottom" | "left";
  height?: keyof typeof HEIGHTS;
  tone?: "violet" | "amber";

  eyebrow: string;
  title: ReactNode;
  body?: string;
  /** Buttons or other interactive content under the body copy. */
  action?: ReactNode;
  /** Absolutely-positioned annotations at the rim of the scene. */
  rim?: ReactNode;

  count?: number;
  size?: number;
  colors?: [string, string, string];
  camera: { position: [number, number, number]; fov: number };
  offset?: [number, number];
  /** Scroll-scrubbed fields read this; supplied by the caller. */
  progress?: React.ComponentProps<typeof ParticleField>["progress"];
  /** Copy opacity, for bands that fade their own captions on scroll. */
  copyStyle?: React.CSSProperties;
  /** Extra content layered above the scene (motion captions, etc.). */
  children?: ReactNode;

  sectionRef?: React.Ref<HTMLElement>;
  ariaLabel: string;
}

export function SceneBand({
  field,
  align = "bottom",
  height = "normal",
  tone = "violet",
  eyebrow,
  title,
  body,
  action,
  rim,
  count,
  size = 2.2,
  colors,
  camera,
  offset = [0, 0],
  progress,
  copyStyle,
  children,
  sectionRef,
  ariaLabel,
}: SceneBandProps) {
  const local = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(local, { margin: "200px" });

  const [params, setParams] = useState(() => defaultParams(field));
  const setParam = useCallback(
    (key: string, value: number) => setParams((p) => ({ ...p, [key]: value })),
    [],
  );
  const resetParams = useCallback(
    () => setParams(defaultParams(field)),
    [field],
  );

  const bg = tone === "amber" ? "bg-[#06070a]" : "bg-[#08090c]";
  const scrimFrom = tone === "amber" ? "from-[#06070a]" : "from-[#08090c]";

  return (
    <section
      ref={mergeRefs(local, sectionRef)}
      aria-label={ariaLabel}
      className={`relative isolate overflow-hidden ${bg}`}
    >
      <div className={`relative ${HEIGHTS[height]}`}>
        <div className="absolute inset-0" aria-hidden="true">
          <SceneCanvas
            frameloop={inView ? "always" : "never"}
            camera={camera}
            lookAt={[0, 0, 0]}
            fallback={
              <div
                className={`size-full ${
                  tone === "amber"
                    ? "bg-[radial-gradient(35%_55%_at_50%_10%,rgba(255,196,120,0.28),transparent_70%)]"
                    : "bg-[radial-gradient(42%_44%_at_50%_48%,rgba(133,99,238,0.32),transparent_70%)]"
                }`}
              />
            }
          >
            <ParticleField
              field={field}
              count={count ?? (reduce ? 5000 : 13000)}
              colors={colors}
              size={size}
              offset={offset}
              params={params}
              progress={progress}
              still={!!reduce}
            />
          </SceneCanvas>
        </div>

        {rim && (
          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            {rim}
          </div>
        )}

        {align === "bottom" && (
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t ${scrimFrom} to-transparent`}
          />
        )}

        <Container
          className={`pointer-events-none relative flex h-full ${
            align === "bottom"
              ? "flex-col items-center justify-end pb-16 text-center lg:pb-20"
              : "items-end pb-14 lg:items-center lg:pb-0"
          }`}
        >
          <div
            style={copyStyle}
            className={align === "bottom" ? "max-w-2xl" : "max-w-lg"}
          >
            <p className="font-mono text-[11px] tracking-[0.24em] text-white/50 uppercase">
              {eyebrow}
            </p>
            <h2
              className={`mt-4 text-white ${align === "bottom" ? "type-h1" : "type-h2"}`}
            >
              {title}
            </h2>
            {body && (
              <p
                className={`mt-5 text-white/60 ${align === "bottom" ? "measure-narrow mx-auto" : ""}`}
              >
                {body}
              </p>
            )}
            {action && (
              <div className="pointer-events-auto mt-8 flex flex-wrap items-center justify-center gap-3">
                {action}
              </div>
            )}
          </div>
        </Container>

        {children}

        <SceneControls
          controls={FIELD_CONTROLS[field]}
          values={params}
          onChange={setParam}
          onReset={resetParams}
          tone={tone}
        />
      </div>
    </section>
  );
}

/** Lets the band own a ref for in-view detection while still exposing one. */
function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.RefObject<T | null>).current = node;
    }
  };
}
