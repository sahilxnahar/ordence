"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";

/**
 * ParticleField — one harness, three fields, one WebGL context.
 *
 * The three scenes this replaces arrived as separate files, each carrying
 * its own renderer, its own EffectComposer with UnrealBloom, and a CPU
 * loop writing 20,000 instance matrices every frame. Shipping them as
 * written would mean three WebGL contexts, three bloom passes and 60,000
 * matrix writes per frame — a straight multiplication of the single
 * heaviest cost on the site.
 *
 * Two decisions collapse that:
 *
 *  1. The per-particle maths moved from JavaScript into the vertex shader.
 *     The CPU now uploads nothing per frame — it sets a uniform. This is
 *     the entire reason 12,000 particles here cost less than 20,000 there.
 *
 *  2. Bloom is gone, replaced by additive blending of soft round points.
 *     UnrealBloom is a multi-pass blur over full-resolution render targets;
 *     additive sprites give ~90% of the glow for ~5% of the fill cost, and
 *     removes the postprocessing dependency from the bundle entirely.
 *
 * The maths inside each FIELD block is a faithful port of the original
 * scenes — the shapes, flows and timings are theirs. Only the coordinate
 * scales were retuned so each composition frames correctly in a section
 * band rather than a full browser window.
 */

export type FieldName = "convergence" | "magnetosphere" | "lamp";

/**
 * The tunable surface of each field.
 *
 * These are deliberately labelled in the language of the business, not of
 * the renderer: the original scenes shipped controls called "Air Haze" and
 * "Magnetic Field Size", which tell a visitor they are looking at a graphics
 * demo. "Channel noise" and "Workspaces in orbit" tell them they are looking
 * at the product. Same float, different claim.
 */
export interface FieldControl {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  /** Optional human-readable rendering of the current value. */
  format?: (v: number) => string;
}

export const FIELD_CONTROLS: Record<FieldName, FieldControl[]> = {
  convergence: [
    {
      key: "uSpeed",
      label: "Ingest rate",
      min: 0.05,
      max: 1.6,
      step: 0.05,
      value: 0.3,
    },
    {
      key: "uChaos",
      label: "Channel noise",
      min: 0,
      max: 50,
      step: 1,
      value: 20,
    },
    {
      key: "uCore",
      label: "Core density",
      min: 0.5,
      max: 24,
      step: 0.5,
      value: 2.5,
    },
  ],
  magnetosphere: [
    {
      key: "uFieldStrength",
      label: "Workspaces in orbit",
      min: 0.5,
      max: 8,
      step: 0.1,
      value: 3,
    },
    { key: "uScale", label: "Core size", min: 12, max: 55, step: 1, value: 30 },
    {
      key: "uFlare",
      label: "Flare reach",
      min: 0,
      max: 7,
      step: 0.1,
      value: 2.6,
    },
    {
      key: "uSpeed",
      label: "Plasma flow",
      min: 0.1,
      max: 3,
      step: 0.05,
      value: 1.1,
    },
    {
      key: "uSat",
      label: "Brand tint",
      min: 0,
      max: 1,
      step: 0.02,
      value: 1,
      format: (v) => `${Math.round(v * 100)}%`,
    },
  ],
  lamp: [
    {
      key: "uSpread",
      label: "Beam spread",
      min: 0.1,
      max: 1,
      step: 0.02,
      value: 0.64,
    },
    {
      key: "uReach",
      label: "Beam reach",
      min: 20,
      max: 95,
      step: 1,
      value: 58,
    },
    { key: "uHaze", label: "Air haze", min: 0, max: 3, step: 0.05, value: 1.2 },
    {
      key: "uFlicker",
      label: "Filament flicker",
      min: 0,
      max: 1,
      step: 0.05,
      value: 0.25,
    },
    {
      key: "uWarmth",
      label: "Warmth",
      min: 0,
      max: 0.18,
      step: 0.005,
      value: 0.075,
      format: (v) => `${Math.round((1 - v / 0.18) * 100)}%`,
    },
    {
      key: "uDrift",
      label: "Mote drift",
      min: 0,
      max: 2,
      step: 0.05,
      value: 0.6,
    },
  ],
};

/** Defaults as a flat map — the reset target, and the initial state. */
export function defaultParams(field: FieldName): Record<string, number> {
  return Object.fromEntries(FIELD_CONTROLS[field].map((c) => [c.key, c.value]));
}

const COMMON_GLSL = /* glsl */ `
  const float TAU = 6.28318530718;
  const float GOLD_ANGLE = 2.39996323;
  const float PHI = 1.61803398875;

  float hash11(float p) {
    return fract(sin(p * 12.9898 + 1.0) * 43758.5453);
  }
  float hash11b(float p) {
    return fract(sin(p * 78.233 + 2.0) * 24634.6345);
  }
  float hash11c(float p) {
    return fract(sin(p * 39.425 + 3.0) * 15731.743);
  }

  // Faithful HSL→RGB so the ported colour ramps read exactly as authored.
  vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(
      abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0,
      0.0, 1.0
    );
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
  }
`;

/**
 * Omnichannel convergence — scattered signal collapsing into one core.
 * Ported from the "Dopa Architecture" field. `uProgress` is wired to
 * scroll: chaos is at full strength when the section enters the viewport
 * and is damped to near-zero by the time it leaves, so the visitor
 * *scrubs* the transition from noise to a single system of record.
 */
const FIELD_CONVERGENCE = /* glsl */ `
  float norm = aIndex / uCount;
  float speed = uSpeed + uProgress * 0.85;
  float progress = fract(norm + uTime * speed * 0.2);
  float eased = pow(progress, 1.5);

  float theta = TAU * aIndex / PHI;
  float phi = acos(clamp(1.0 - 2.0 * norm, -1.0, 1.0));

  float coreSize = uCore;
  float radius = coreSize + 112.0 * (1.0 - eased);

  // Without this the arriving particles all land on the *surface* of a
  // small sphere, which renders as a bright ring around a hole — the exact
  // opposite of the point being made. Pulling the last stretch inward by a
  // per-particle amount fills the core into a solid mass.
  radius *= mix(1.0, 0.18 + 0.82 * hash11(aIndex), smoothstep(0.72, 1.0, progress));

  // Instability is highest at the rim (raw channels) and resolves to
  // exactly zero at the core (the record). That is the whole story.
  float instability = pow(1.0 - progress, 2.0);
  float chaos = uChaos * (1.0 - uProgress * 0.9);
  vec3 wobble = vec3(
    sin(uTime * 2.0 + norm * 100.0),
    cos(uTime * 1.5 + norm * 200.0),
    sin(uTime * 3.0 - norm * 300.0)
  ) * chaos * instability;

  float sp = sin(phi);
  pos = vec3(radius * sp * cos(theta), radius * sp * sin(theta), radius * cos(phi));
  pos += wobble;

  // The core runs white-hot: a pure hue at the centre reads as a laser
  // dot, whereas bleeding toward white reads as energy arriving.
  vec3 hot = mix(uColorB, vec3(1.0), 0.55);
  vColor = mix(uColorA, hot, smoothstep(0.42, 1.0, progress));
  float corePulse = progress > 0.93 ? 0.35 * (0.5 + 0.5 * sin(uTime * 9.0)) : 0.0;
  vAlpha = 0.22 + 0.70 * progress + corePulse;
  vScale = 0.7 + 1.75 * pow(progress, 2.0);
`;

/**
 * Solar magnetosphere — a core, field lines arcing out through shells,
 * and flares. Deliberately near-monochrome (the original defaults to
 * zero saturation) with the accent reserved for flare tips, which is the
 * same discipline the rest of the site follows.
 *
 * Flare reach is cut from the original 30× radius to 2.6× — at 30× the
 * flares leave frame within a few hundred milliseconds and read as
 * nothing at all inside a page section.
 */
const FIELD_MAGNETOSPHERE = /* glsl */ `
  float n = aIndex / uCount;
  float t = uTime * uSpeed;
  float scale = uScale;
  float group = n * 3.0;

  float lit;
  float accentMix;

  if (group < 1.0) {
    // Photosphere: a boiling Fibonacci shell.
    float normIdx = group;
    float phi = acos(clamp(1.0 - 2.0 * normIdx, -1.0, 1.0));
    float theta = TAU / PHI * aIndex;
    float boil = sin(phi * 10.0 + t * 2.0) * cos(theta * 10.0 + t * 2.5) * scale * 0.05;
    float r = scale + boil;
    pos = vec3(r * sin(phi) * cos(theta), r * sin(phi) * sin(theta), r * cos(phi));
    lit = 0.55 + (boil > 0.0 ? 0.28 : 0.0);
    accentMix = 0.06;
    vScale = 0.85;
  } else if (group < 2.0) {
    // Field lines: 50 dipole arcs across 5 shells, plasma flowing along them.
    float localN = group - 1.0;
    float numLines = 50.0;
    float lineId = floor(localN * numLines);
    float posOnLine = localN * numLines - lineId;
    float flow = fract(posOnLine + t * 0.2);
    float lineAngle = (lineId / numLines) * TAU;
    float polar = 0.1 + flow * (3.14159265 - 0.2);
    float shell = mod(lineId, 5.0) / 5.0;
    float L = scale * 1.2 + shell * scale * uFieldStrength;
    float r = max(L * pow(sin(polar), 2.0), scale * 1.01);
    pos = vec3(r * sin(polar) * cos(lineAngle), r * cos(polar), r * sin(polar) * sin(lineAngle));
    lit = 0.75 * (1.0 - r / (scale * (1.2 + uFieldStrength) * 1.1));
    accentMix = 0.18 + 0.5 * shell;
    vScale = 0.7;
  } else {
    // Flares: 30 ejecta arcs, brightest at launch, fading as they climb.
    float localN = group - 2.0;
    float numFlares = 30.0;
    float flareId = floor(localN * numFlares);
    float posOnFlare = localN * numFlares - flareId;
    float flow = fract(posOnFlare + t * 0.5);
    float angleOffset = (flareId / numFlares) * TAU;
    float m = mod(flareId, 3.0);
    float basePhi = m < 1.0 ? 0.1 : (m < 2.0 ? 3.0416 : 1.5708);
    float spread = mod(flareId, 5.0) / 5.0 * 0.5;
    float polar = basePhi + spread * sin(flareId * 13.37);
    float r = scale + flow * scale * uFlare;
    float wiggle = flow * scale * 0.2;
    pos = vec3(
      r * sin(polar) * cos(angleOffset) + sin(flow * 10.0 + t * 5.0 + flareId) * wiggle,
      r * cos(polar),
      r * sin(polar) * sin(angleOffset) + cos(flow * 10.0 + t * 5.0 + flareId) * wiggle
    );
    lit = (1.0 - flow) * (1.0 - flow);
    accentMix = 0.75;
    vScale = 0.6 + 0.8 * (1.0 - flow);
  }

  // Axial spin, nudged by the pointer. This was 0.1 rad/s, which is
  // technically animated and visually indistinguishable from a still
  // image — the scene read as a static render. Tripled, plus a slow
  // nod on the other axis so the silhouette itself changes rather than
  // just the speckle pattern.
  float ry = uTime * 0.32 + uPointer.x * 0.55;
  float rx = sin(uTime * 0.11) * 0.18 + uPointer.y * 0.2;
  float cy = cos(ry), sy = sin(ry);
  pos = vec3(pos.x * cy + pos.z * sy, pos.y, -pos.x * sy + pos.z * cy);
  float cx = cos(rx), sx = sin(rx);
  pos = vec3(pos.x, pos.y * cx - pos.z * sx, pos.y * sx + pos.z * cx);

  vColor = mix(uColorC, uColorA, accentMix * clamp(uSat, 0.0, 1.0))
    * (0.55 + 0.9 * clamp(lit, 0.0, 1.0));
  vAlpha = clamp(0.05 + lit, 0.0, 1.0);
`;

/**
 * Lamp light — a filament, a volumetric cone, the pool it casts and the
 * dust drifting through it. The only calm scene of the three, so it is
 * used to close pages rather than open them.
 */
const FIELD_LAMP = /* glsl */ `
  float count = uCount;
  float reach = uReach;
  float spread = uSpread;
  float haze = uHaze;
  float warmth = uWarmth;
  float drift = uDrift;

  float apexY = reach * 0.5;
  float floorY = -reach * 0.5;

  float r1 = hash11(aIndex);
  float r2 = hash11b(aIndex);
  float r3 = hash11c(aIndex);

  // Filament flicker: three detuned sines, so it never repeats audibly.
  float flick = 1.0 + uFlicker * 0.18 * (
    sin(uTime * 13.7) + 0.6 * sin(uTime * 29.1 + 1.3) + 0.4 * sin(uTime * 7.3 + 2.1)
  );

  float nBulb  = count * 0.05;
  float nShade = count * 0.13;
  float nBeam  = count * 0.74;
  float nPool  = count * 0.88;

  vec3 hsl;

  if (aIndex < nBulb) {
    float f = (aIndex + 0.5) / max(1.0, nBulb);
    float yy = 1.0 - 2.0 * f;
    float rr = sqrt(max(0.0001, 1.0 - yy * yy));
    float a = GOLD_ANGLE * aIndex + uTime * 0.4;
    float rad = reach * 0.035 * (1.0 + 0.06 * sin(uTime * 3.0 + aIndex));
    pos = vec3(cos(a) * rr * rad, apexY - reach * 0.06 + yy * rad, sin(a) * rr * rad);
    hsl = vec3(warmth + 0.03, max(0.0, 0.35 - 0.2 * r1), clamp(0.92 * flick, 0.0, 1.0));
    vScale = 1.4;
  } else if (aIndex < nShade) {
    float f = (aIndex - nBulb) / max(1.0, nShade - nBulb);
    float a = GOLD_ANGLE * aIndex;
    float rad = reach * (0.03 + 0.14 * f);
    float y = apexY + reach * 0.10 - f * reach * 0.14;
    float rim = f * f * f;
    pos = vec3(cos(a) * rad, y, sin(a) * rad);
    hsl = vec3(warmth + 0.01, min(1.0, 0.1 + 0.5 * rim), clamp((0.05 + 0.55 * rim) * flick, 0.0, 1.0));
    vScale = 0.9;
  } else if (aIndex < nBeam) {
    // The cone itself: particles fall down the beam and recycle at the top.
    float f = (aIndex - nShade) / max(1.0, nBeam - nShade);
    float tt = fract(f + uTime * 0.045 * (0.5 + r3));
    float depth = pow(tt, 0.85);
    float coneR = max(0.001, depth * reach * spread);
    float u = pow(r1, 0.6);
    float a = GOLD_ANGLE * aIndex + uTime * (0.25 - 0.15 * depth) + r2 * TAU;
    float x = cos(a) * u * coneR + sin(uTime * 0.8 + depth * 6.0 + r2 * TAU) * haze * 0.6;
    float z = sin(a) * u * coneR + cos(uTime * 0.7 + depth * 5.0 + r1 * TAU) * haze * 0.6;
    float axial = 1.0 - depth;
    float radial = 1.0 - u * u;
    float b = pow(max(0.0, axial), 1.4) * (0.25 + 0.75 * radial);
    pos = vec3(x, apexY - depth * reach, z);
    hsl = vec3(
      warmth + 0.045 * axial,
      clamp(0.55 + 0.35 * depth - 0.2 * axial, 0.0, 1.0),
      clamp((0.06 + 0.75 * b) * flick, 0.0, 1.0)
    );
    vScale = 0.55;
  } else if (aIndex < nPool) {
    float f = (aIndex - nBeam) / max(1.0, nPool - nBeam);
    float u = sqrt(f);
    float a = GOLD_ANGLE * aIndex;
    float rad = u * reach * spread * 1.02;
    float b = pow(max(0.0, 1.0 - u), 1.8);
    pos = vec3(cos(a) * rad, floorY + 0.4 * sin(uTime * 1.2 + rad * 0.2), sin(a) * rad);
    hsl = vec3(warmth + 0.03 * b, clamp(0.75 - 0.35 * b, 0.0, 1.0), clamp((0.04 + 0.7 * b) * flick, 0.0, 1.0));
    vScale = 0.7;
  } else {
    // Motes: only visible where they pass through the cone.
    float span = reach * 0.9;
    float by = fract(r3 + uTime * 0.02 * drift);
    float y = apexY - by * reach;
    float x = (r1 - 0.5) * 2.0 * span + sin(uTime * 0.5 + r1 * TAU) * drift * 2.0;
    float z = (r2 - 0.5) * 2.0 * span + cos(uTime * 0.43 + r2 * TAU) * drift * 2.0;
    float depth = max(0.001, by);
    float coneR = max(0.001, depth * reach * spread);
    float d = sqrt(x * x + z * z) / coneR;
    float litMote = max(0.0, 1.0 - d * d);
    pos = vec3(x, y, z);
    hsl = vec3(warmth + 0.02, 0.6, clamp((0.015 + 0.85 * litMote * (1.0 - depth * 0.7)) * flick, 0.0, 1.0));
    vScale = 0.8;
  }

  pos.x += uPointer.x * 3.0;
  vColor = hsl2rgb(hsl);
  vAlpha = clamp(hsl.z * 1.55, 0.0, 1.0);
`;

const FIELDS: Record<FieldName, string> = {
  convergence: FIELD_CONVERGENCE,
  magnetosphere: FIELD_MAGNETOSPHERE,
  lamp: FIELD_LAMP,
};

function buildVertexShader(field: FieldName): string {
  return /* glsl */ `
    uniform float uTime;
    uniform float uCount;
    uniform float uProgress;
    uniform float uSize;
    uniform float uPixelRatio;
    uniform vec2  uPointer;
    uniform vec3  uColorA;
    uniform vec3  uColorB;
    uniform vec3  uColorC;

    /*
     * Tunable parameters. Every field declares the whole set — GLSL strips
     * the ones its branch never reads, so an unused uniform costs nothing
     * and this stays one shader header instead of three.
     */
    uniform float uSpeed;         // convergence + magnetosphere
    uniform float uChaos;         // convergence
    uniform float uCore;          // convergence
    uniform float uScale;         // magnetosphere
    uniform float uFieldStrength; // magnetosphere
    uniform float uFlare;         // magnetosphere
    uniform float uSat;           // magnetosphere
    uniform float uSpread;        // lamp
    uniform float uReach;         // lamp
    uniform float uHaze;          // lamp
    uniform float uFlicker;       // lamp
    uniform float uWarmth;        // lamp
    uniform float uDrift;         // lamp

    attribute float aIndex;

    varying vec3  vColor;
    varying float vAlpha;

    ${COMMON_GLSL}

    void main() {
      vec3 pos = vec3(0.0);
      float vScale = 1.0;

      ${FIELDS[field]}

      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = uSize * vScale * uPixelRatio * (220.0 / max(1.0, -mv.z));
    }
  `;
}

/**
 * Soft radial falloff. A hard-edged square point is the single clearest
 * tell that something is "just a particle system"; the falloff plus
 * additive blending is what reads as light rather than as geometry.
 */
const FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float falloff = pow(1.0 - d * 2.0, 1.8);
    gl_FragColor = vec4(vColor, falloff * vAlpha);
  }
`;

export interface ParticleFieldProps {
  field: FieldName;
  count?: number;
  /** Scroll scrub, 0→1. Only `convergence` reads it. */
  progress?: MotionValue<number>;
  /** Accent, secondary and neutral, as hex. Tenants override these. */
  colors?: [string, string, string];
  size?: number;
  /** Disables pointer parallax and freezes flicker for reduced-motion. */
  still?: boolean;
  /**
   * World-space nudge, in scene units. Copy and composition should never
   * fight: rather than dimming the scene behind text, the scene moves out
   * from under it.
   */
  offset?: [number, number];
  /** Live control values, keyed by uniform name. See FIELD_CONTROLS. */
  params?: Record<string, number>;
  /**
   * Object-space rotation in radians, for scenes the visitor can grab and
   * turn. Applied to the Points, not the camera, so the composition's
   * framing and offset stay exactly where they were designed.
   */
  spin?: { x: number; y: number };
}

export function ParticleField({
  field,
  count = 12000,
  progress,
  colors = ["#6d45e8", "#ff5c5c", "#f2f4f8"],
  size = 2.2,
  still = false,
  offset = [0, 0],
  params,
  spin,
}: ParticleFieldProps) {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();
  const pointer = useRef(new THREE.Vector2(0, 0));

  const geometry = useMemo(() => {
    // One attribute, uploaded once, never touched again: the particle's
    // own index. Everything else is derived from it on the GPU.
    const g = new THREE.BufferGeometry();
    const indices = new Float32Array(count);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) indices[i] = i;
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aIndex", new THREE.BufferAttribute(indices, 1));
    // The real bounds live in the shader, so the automatic bounding sphere
    // would be a zero-radius point at the origin and frustum-cull the whole
    // field the moment the camera moves.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400);
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCount: { value: count },
      uProgress: { value: 0 },
      uSize: { value: size },
      uPixelRatio: { value: 1 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uColorA: { value: new THREE.Color(colors[0]) },
      uColorB: { value: new THREE.Color(colors[1]) },
      uColorC: { value: new THREE.Color(colors[2]) },
      // Seeded from the field's own defaults so the scene is correct on
      // frame one, before any control has been touched.
      ...Object.fromEntries(
        Object.entries(defaultParams(field)).map(([k, v]) => [k, { value: v }]),
      ),
    }),
    // Colours are pushed imperatively below; rebuilding the uniform object
    // would recompile the program on every tenant repaint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, size, field],
  );

  const vertexShader = useMemo(() => buildVertexShader(field), [field]);

  useFrame((state, delta) => {
    const m = material.current;
    if (!m) return;

    // Clamped delta: a backgrounded tab resumes with a multi-second delta,
    // which would teleport every particle to a new phase.
    m.uniforms.uTime.value += Math.min(delta, 0.05) * (still ? 0.15 : 1);
    m.uniforms.uPixelRatio.value = Math.min(state.gl.getPixelRatio(), 2);

    if (progress) {
      const target = progress.get();
      const current = m.uniforms.uProgress.value as number;
      m.uniforms.uProgress.value = current + (target - current) * 0.08;
    }

    if (!still) {
      pointer.current.lerp(state.pointer, 0.05);
      (m.uniforms.uPointer.value as THREE.Vector2).copy(pointer.current);
    }

    if (params) {
      for (const key in params) {
        const u = m.uniforms[key];
        if (u) u.value = params[key];
      }
    }

    (m.uniforms.uColorA.value as THREE.Color).set(colors[0]);
    (m.uniforms.uColorB.value as THREE.Color).set(colors[1]);
    (m.uniforms.uColorC.value as THREE.Color).set(colors[2]);

    if (points.current) {
      // Gentle breathing so the composition never sits perfectly static
      // even when the visitor is not moving.
      const breathe = 1 + Math.sin(m.uniforms.uTime.value * 0.35) * 0.015;
      // Shrink to fit rather than crop: a narrow viewport should see the
      // whole composition, not the middle third of it.
      const fit = Math.min(1, viewport.width / 100);
      points.current.scale.setScalar(breathe * fit);
      points.current.position.set(offset[0] * fit, offset[1] * fit, 0);
      if (spin) {
        // Eased rather than assigned: a grabbed scene should have weight.
        points.current.rotation.x += (spin.x - points.current.rotation.x) * 0.1;
        points.current.rotation.y += (spin.y - points.current.rotation.y) * 0.1;
      }
    }
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={FRAGMENT_SHADER}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default ParticleField;
