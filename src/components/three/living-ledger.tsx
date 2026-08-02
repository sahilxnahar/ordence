"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";

/**
 * Living Ledger — the flagship showpiece.
 *
 * ~5,000 GPU particles (each one "a record": a lead, an order, an invoice)
 * morph between four formations as the user scrolls:
 *
 *   0 · CHAOS     — a drifting cloud (business before Ordence)
 *   1 · PIPELINE  — five kanban columns (the CRM)
 *   2 · LATTICE   — a supply-chain grid (the ERP)
 *   3 · ORBIT     — the Ordence ring (everything, unified)
 *
 * All morphing happens in the vertex shader: four position attributes are
 * blended by a single `uProgress` uniform (0→3), so the CPU cost per frame
 * is one uniform write. The pointer gently repels nearby particles.
 */

const COUNT = 5000;

const BRAND = {
  violet: new THREE.Color("#6d45e8"),
  coral: new THREE.Color("#ff5c5c"),
  ink: new THREE.Color("#8a94b8"),
};

function buildFormations() {
  const chaos = new Float32Array(COUNT * 3);
  const pipeline = new Float32Array(COUNT * 3);
  const lattice = new Float32Array(COUNT * 3);
  const orbit = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);

  // Deterministic pseudo-random (stable across renders/hydration)
  let s = 42;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    seeds[i] = rand();

    /* 0 · CHAOS — thick spherical cloud */
    {
      const r = 2.2 + rand() * 2.6;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      chaos[i3] = r * Math.sin(phi) * Math.cos(theta);
      chaos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      chaos[i3 + 2] = r * Math.cos(phi) * 0.6;
    }

    /* 1 · PIPELINE — five kanban columns of stacked cards */
    {
      const col = i % 5;
      const row = Math.floor(i / 5) % 40;
      const depth = Math.floor(i / 200);
      pipeline[i3] = (col - 2) * 1.35 + (rand() - 0.5) * 0.22;
      pipeline[i3 + 1] = 1.9 - row * 0.1 + (rand() - 0.5) * 0.05;
      pipeline[i3 + 2] = (depth - 12) * 0.055;
    }

    /* 2 · LATTICE — supply-chain grid with flowing “lanes” */
    {
      const gx = i % 25;
      const gy = Math.floor(i / 25) % 10;
      const gz = Math.floor(i / 250);
      lattice[i3] = (gx - 12) * 0.26;
      lattice[i3 + 1] = (gy - 4.5) * 0.42;
      lattice[i3 + 2] = (gz - 10) * 0.16;
    }

    /* 3 · ORBIT — the Ordence ring: 7 letter-clusters around a circle */
    {
      const cluster = i % 7;
      const baseAngle = (cluster / 7) * Math.PI * 2;
      const jitterA = (rand() - 0.5) * 0.55;
      const radius = 1.7 + (rand() - 0.5) * 0.28;
      const a = baseAngle + jitterA;
      orbit[i3] = Math.cos(a) * radius;
      orbit[i3 + 1] = Math.sin(a) * radius;
      orbit[i3 + 2] = (rand() - 0.5) * 0.25;
    }

    /* colors — mostly ink, accented violet + coral like the mark */
    const pick = rand();
    const c =
      pick < 0.18 ? BRAND.coral : pick < 0.55 ? BRAND.violet : BRAND.ink;
    colors[i3] = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;
  }

  return { chaos, pipeline, lattice, orbit, colors, seeds };
}

const vertexShader = /* glsl */ `
  attribute vec3 aPipeline;
  attribute vec3 aLattice;
  attribute vec3 aOrbit;
  attribute vec3 aColor;
  attribute float aSeed;

  uniform float uProgress;   // 0..3 across the four formations
  uniform float uTime;
  uniform vec2 uPointer;     // world-space xy
  uniform float uSize;

  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    // Blend between consecutive formations
    float p = clamp(uProgress, 0.0, 3.0);
    vec3 pos;
    if (p < 1.0) {
      pos = mix(position, aPipeline, smoothstep(0.0, 1.0, p));
    } else if (p < 2.0) {
      pos = mix(aPipeline, aLattice, smoothstep(0.0, 1.0, p - 1.0));
    } else {
      pos = mix(aLattice, aOrbit, smoothstep(0.0, 1.0, p - 2.0));
    }

    // Ambient life: tiny per-particle drift
    pos.x += sin(uTime * 0.6 + aSeed * 40.0) * 0.03;
    pos.y += cos(uTime * 0.5 + aSeed * 60.0) * 0.03;

    // Pointer repulsion (screen-plane)
    vec2 d = pos.xy - uPointer;
    float dist = length(d);
    float force = smoothstep(0.9, 0.0, dist) * 0.45;
    pos.xy += normalize(d + 0.0001) * force;

    vColor = aColor;
    vTwinkle = 0.65 + 0.35 * sin(uTime * (1.0 + aSeed * 2.0) + aSeed * 20.0);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (1.0 / -mv.z) * (0.7 + aSeed * 0.6);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    // Soft round dot
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float alpha = smoothstep(0.5, 0.12, d) * vTwinkle;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColor, alpha * 0.9);
  }
`;

export default function LivingLedger({
  progress,
}: {
  /** Framer Motion scroll value, 0..1 → mapped to formations 0..3 */
  progress: MotionValue<number>;
}) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();
  const pointer3 = useRef(new THREE.Vector2(999, 999));

  const data = useMemo(() => buildFormations(), []);

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(999, 999) },
      uSize: { value: 26 },
    }),
    [],
  );

  useFrame((state) => {
    if (!material.current) return;
    const u = material.current.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uProgress.value = progress.get() * 3;
    // Convert normalized pointer to world-plane coords
    pointer3.current.set(
      (state.pointer.x * viewport.width) / 2,
      (state.pointer.y * viewport.height) / 2,
    );
    (u.uPointer.value as THREE.Vector2).lerp(pointer3.current, 0.12);
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.chaos, 3]} />
        <bufferAttribute attach="attributes-aPipeline" args={[data.pipeline, 3]} />
        <bufferAttribute attach="attributes-aLattice" args={[data.lattice, 3]} />
        <bufferAttribute attach="attributes-aOrbit" args={[data.orbit, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[data.colors, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[data.seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
