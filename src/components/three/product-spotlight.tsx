"use client";

import { useCallback, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import SceneCanvas from "./scene-canvas";
import ParticleField, {
  defaultParams,
  FIELD_CONTROLS,
  type FieldName,
} from "./particle-field";
import { SceneControls } from "./scene-controls";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

/**
 * ProductSpotlight — one engine, pointed at one product at a time.
 *
 * The alternative was what we had: a different scene decorating each
 * page, three canvases arguing nothing in particular. This inverts it.
 * A single band on the homepage that the visitor aims — pick ERP and the
 * field becomes modules orbiting one ledger; pick CRM and it becomes five
 * channels collapsing into one record.
 *
 * The reason this works is that each field already *means* something
 * structurally, and those meanings map cleanly onto the product lines:
 *
 *   convergence   many inputs resolving to one record   → CRM, AI
 *   magnetosphere one core with satellites in orbit     → ERP, Platform
 *   lamp          a made thing, lit, with care          → Web
 *
 * So switching product is not a costume change. It is picking the
 * geometry that happens to be the right argument for that product.
 *
 * Cost: one WebGL context, one page. Switching recompiles a shader —
 * a few milliseconds, once per click.
 */

interface Spot {
  key: string;
  tab: string;
  field: FieldName;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  tone: "violet" | "amber";
  colors: [string, string, string];
  camera: { position: [number, number, number]; fov: number };
  offset: [number, number];
  size: number;
  /** Per-product tuning of the shared field. */
  params?: Record<string, number>;
  stat: string;
}

const SPOTS: Spot[] = [
  {
    key: "crm",
    tab: "CRM",
    field: "convergence",
    eyebrow: "Customer OS",
    title: "Five channels in. One record out.",
    body: "WhatsApp, missed calls, web forms and email stop being four inboxes and become one timeline — routed to a named owner in under a second.",
    href: "/crm",
    cta: "Explore the CRM",
    tone: "violet",
    colors: ["#7d5bf0", "#ff8d7a", "#f2f4f8"],
    camera: { position: [0, 0, 170], fov: 55 },
    offset: [34, 4],
    size: 2.4,
    stat: "Lead to first human touch, measured in seconds",
  },
  {
    key: "erp",
    tab: "ERP",
    field: "magnetosphere",
    eyebrow: "Operations OS",
    title: "Every module on one ledger.",
    body: "Procurement, production, inventory and invoicing orbit the same core — so a dispatch booked in one module is true in all of them the moment it happens.",
    href: "/erp",
    cta: "Explore the ERP",
    tone: "violet",
    colors: ["#8563ee", "#5eead4", "#eef1f8"],
    camera: { position: [0, 16, 148], fov: 50 },
    offset: [30, 0],
    size: 1.9,
    params: { uFieldStrength: 4.2, uScale: 26, uFlare: 1.6, uSpeed: 0.85 },
    stat: "One system of record, no month-end archaeology",
  },
  {
    key: "ai",
    tab: "AI",
    field: "convergence",
    eyebrow: "Intelligence layer",
    title: "Signal in. Decision out.",
    body: "Every message, event and record is pulled into one context — so the model reasons over your whole business rather than a fragment of it, always under human approval.",
    href: "/ai",
    cta: "Explore AI services",
    tone: "violet",
    colors: ["#5eead4", "#a186f3", "#f2f4f8"],
    camera: { position: [0, 0, 165], fov: 55 },
    offset: [34, 4],
    size: 2.2,
    params: { uSpeed: 0.85, uChaos: 8, uCore: 4 },
    stat: "Grounded in your data, explainable by default",
  },
  {
    key: "web",
    tab: "Web",
    field: "lamp",
    eyebrow: "Ordence Studio",
    title: "A site built like furniture.",
    body: "Your marketing site, engineered by the same team that runs the platform — on your own domain, wired into the CRM from day one rather than bolted on later.",
    href: "/services",
    cta: "See the studio work",
    tone: "amber",
    colors: ["#6d45e8", "#ff5c5c", "#f2f4f8"],
    camera: { position: [0, 0, 168], fov: 48 },
    offset: [30, 20],
    size: 2.6,
    params: { uSpread: 0.5, uReach: 54, uHaze: 1.0 },
    stat: "Launch on you.ordence.com, move to your domain later",
  },
];

export default function ProductSpotlight() {
  const wrapper = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(wrapper, { margin: "200px" });
  const [index, setIndex] = useState(0);
  const spot = SPOTS[index];

  // Params are per-product: switching resets to that product's tuning, so
  // a visitor who has been dragging sliders on ERP does not carry a
  // half-collapsed field over to CRM.
  const [params, setParams] = useState(() => ({
    ...defaultParams(SPOTS[0].field),
    ...SPOTS[0].params,
  }));
  const setParam = useCallback(
    (key: string, value: number) => setParams((p) => ({ ...p, [key]: value })),
    [],
  );

  const select = useCallback((i: number) => {
    setIndex(i);
    setParams({ ...defaultParams(SPOTS[i].field), ...SPOTS[i].params });
  }, []);

  const reset = useCallback(() => {
    setParams({ ...defaultParams(spot.field), ...spot.params });
  }, [spot]);

  return (
    <section
      ref={wrapper}
      aria-label="What Ordence does"
      className={`relative isolate overflow-hidden ${
        spot.tone === "amber" ? "bg-[#06070a]" : "bg-[#08090c]"
      } transition-colors duration-700`}
    >
      <div className="relative h-[700px] lg:h-[780px]">
        <div className="absolute inset-0" aria-hidden="true">
          <SceneCanvas
            key={spot.field}
            frameloop={inView ? "always" : "never"}
            camera={spot.camera}
            lookAt={[0, 0, 0]}
            fallback={
              <div className="size-full bg-[radial-gradient(42%_44%_at_62%_48%,rgba(133,99,238,0.32),transparent_70%)]" />
            }
          >
            <ParticleField
              field={spot.field}
              count={reduce ? 5000 : 13000}
              colors={spot.colors}
              size={spot.size}
              offset={spot.offset}
              params={params}
              still={!!reduce}
            />
          </SceneCanvas>
        </div>

        {/* Scene sits right, copy sits left — so the two never fight. */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 left-0 w-full lg:w-3/5 ${
            spot.tone === "amber"
              ? "bg-gradient-to-r from-[#06070a] via-[#06070a]/85 to-transparent"
              : "bg-gradient-to-r from-[#08090c] via-[#08090c]/85 to-transparent"
          }`}
        />

        <Container className="relative flex h-full flex-col justify-center gap-9">
          {/* The aimer. Tabs rather than a slider: four discrete claims,
              not a continuum. */}
          <div
            role="tablist"
            aria-label="Product"
            className="flex flex-wrap gap-2"
          >
            {SPOTS.map((s, i) => (
              <button
                key={s.key}
                role="tab"
                type="button"
                aria-selected={i === index}
                onClick={() => select(i)}
                className={`press rounded-full border px-5 py-2.5 text-sm font-medium transition-colors ${
                  i === index
                    ? "border-white/70 bg-white text-[#08090c]"
                    : "border-white/25 text-white/70 hover:border-white/50 hover:text-white"
                }`}
              >
                {s.tab}
              </button>
            ))}
          </div>

          <div className="max-w-xl">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={spot.key}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -10 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="font-mono text-[11px] tracking-[0.24em] text-white/50 uppercase">
                  {spot.eyebrow}
                </p>
                <h2 className="type-h1 mt-4 text-white">{spot.title}</h2>
                <p className="mt-5 text-white/60">{spot.body}</p>
                <p className="mt-6 font-mono text-[11px] tracking-wider text-white/40">
                  {spot.stat}
                </p>
                <div className="mt-8">
                  <Button href={spot.href} variant="accent">
                    {spot.cta} <span aria-hidden="true">→</span>
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </Container>

        <SceneControls
          controls={FIELD_CONTROLS[spot.field]}
          values={params}
          onChange={setParam}
          onReset={reset}
          tone={spot.tone}
          label="Tune this scene"
        />
      </div>
    </section>
  );
}
