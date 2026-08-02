"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import SceneCanvas from "./scene-canvas";

/**
 * Tenant Prism — one white beam ("one codebase") enters a glass prism;
 * branded mini-sites orbit out of it. Drag to spin the orbit (with
 * inertia); whichever site faces you is highlighted in the side panel.
 *
 * The mini-site textures are drawn on offscreen canvases at mount —
 * no image assets, always crisp, always on-brand.
 */

const TENANTS = [
  { slug: "ameyaa", name: "Ameyaa", accent: "#6d45e8", domain: "ameyaa.ordence.com", blurb: "Real-estate CRM in Ameyaa's violet — their leads, their brand." },
  { slug: "clientx", name: "Client X", accent: "#ff5c5c", domain: "customclientdomain.com", blurb: "Full ERP on a custom domain — coral brand, same codebase." },
  { slug: "northline", name: "Northline", accent: "#0e8a5f", domain: "northline.ordence.com", blurb: "Retail suite in Northline green — provisioned in under a minute." },
  { slug: "vega", name: "Vega", accent: "#b26a00", domain: "vega.ordence.com", blurb: "Logistics workspace in amber — every tenant fully isolated." },
] as const;

/** Draw a mini website mockup onto a canvas texture. */
function makeSiteTexture(accent: string): THREE.CanvasTexture {
  const w = 512;
  const h = 340;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;

  // page
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  // header bar
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, w, 54);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.arc(34, 27, 13, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(w - 70 - i * 62, 20, 44, 13);
  }
  // hero copy lines
  ctx.fillStyle = "#111827";
  ctx.fillRect(36, 96, 300, 22);
  ctx.fillRect(36, 130, 220, 22);
  ctx.fillStyle = "#b8bfd1";
  ctx.fillRect(36, 172, 260, 11);
  ctx.fillRect(36, 192, 230, 11);
  // CTA pill
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.roundRect(36, 226, 132, 36, 18);
  ctx.fill();
  // cards row
  ctx.fillStyle = "#f2f4f8";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.roundRect(36 + i * 152, 284, 136, 40, 8);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function PrismScene({ onFront }: { onFront: (index: number) => void }) {
  const orbit = useRef<THREE.Group>(null);
  const spin = useRef({ velocity: 0.004, dragging: false, lastX: 0 });
  const frontIndex = useRef(-1);

  const textures = useMemo(
    () => TENANTS.map((t) => makeSiteTexture(t.accent)),
    [],
  );

  useFrame(({ camera }) => {
    const g = orbit.current;
    if (!g) return;
    if (!spin.current.dragging) {
      g.rotation.y += spin.current.velocity;
      // ease back toward a gentle idle spin
      spin.current.velocity += (0.004 - spin.current.velocity) * 0.02;
    }
    // Which card is closest to the camera?
    let best = -1;
    let bestZ = -Infinity;
    const v = new THREE.Vector3();
    g.children.forEach((child, i) => {
      if (child.name !== "site") return;
      child.getWorldPosition(v);
      // nearest to the camera wins
      const dist = -v.distanceTo(camera.position);
      if (dist > bestZ) {
        bestZ = dist;
        best = i;
      }
    });
    if (best !== frontIndex.current && best >= 0) {
      frontIndex.current = best;
      onFront(best % TENANTS.length);
    }
    // Scale the front card up slightly
    g.children.forEach((child, i) => {
      if (child.name !== "site") return;
      const target = i === best ? 1.18 : 1;
      child.scale.lerp(new THREE.Vector3(target, target, target), 0.08);
    });
  });

  return (
    <group>
      {/* the incoming beam: one codebase */}
      <mesh position={[-3.1, 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 2.6, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
      </mesh>

      {/* glass prism */}
      <Float speed={1.2} rotationIntensity={0.5} floatIntensity={0.4}>
        <mesh>
          <octahedronGeometry args={[1.05, 0]} />
          <meshPhysicalMaterial
            transmission={0.92}
            thickness={1.1}
            roughness={0.18}
            ior={1.45}
            color="#e9e2ff"
            metalness={0.05}
            attenuationColor="#b8a1ff"
            attenuationDistance={1.6}
          />
        </mesh>
      </Float>

      {/* orbiting branded mini-sites (drag to spin) */}
      <group
        ref={orbit}
        onPointerDown={(e) => {
          spin.current.dragging = true;
          spin.current.lastX = e.clientX;
          (e.target as Element).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!spin.current.dragging || !orbit.current) return;
          const dx = e.clientX - spin.current.lastX;
          spin.current.lastX = e.clientX;
          orbit.current.rotation.y += dx * 0.008;
          spin.current.velocity = dx * 0.0012;
        }}
        onPointerUp={() => (spin.current.dragging = false)}
        onPointerLeave={() => (spin.current.dragging = false)}
      >
        {TENANTS.map((t, i) => {
          const angle = (i / TENANTS.length) * Math.PI * 2;
          const r = 2.7;
          return (
            <group
              key={t.slug}
              name="site"
              position={[Math.cos(angle) * r, Math.sin(i * 2.1) * 0.25, Math.sin(angle) * r]}
              rotation={[0, -angle + Math.PI / 2, 0]}
            >
              <mesh>
                <planeGeometry args={[1.5, 1]} />
                <meshBasicMaterial map={textures[i]} toneMapped={false} side={THREE.DoubleSide} />
              </mesh>
              {/* accent edge under the card */}
              <mesh position={[0, -0.56, 0]}>
                <boxGeometry args={[1.5, 0.035, 0.02]} />
                <meshBasicMaterial color={t.accent} />
              </mesh>
            </group>
          );
        })}
      </group>

      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 6, 5]} intensity={1.6} />
      <pointLight position={[-4, -2, -3]} intensity={1.2} color="#6d45e8" />
    </group>
  );
}

export default function TenantPrism({ className }: { className?: string }) {
  const [active, setActive] = useState(0);
  const tenant = TENANTS[active];

  return (
    <div className={className}>
      <div className="relative aspect-[4/3] w-full cursor-grab active:cursor-grabbing">
        <SceneCanvas
          frameloop="always"
          camera={{ position: [0, 0.5, 7.6], fov: 38 }}
          fallback={
            <div className="size-full rounded-panel bg-gradient-brand opacity-15 blur-2xl" />
          }
        >
          <group scale={0.9}>
            <PrismScene onFront={setActive} />
          </group>
        </SceneCanvas>
      </div>

      {/* live caption for the front-facing tenant */}
      <div
        className="mx-auto -mt-2 flex max-w-md items-center gap-3 rounded-panel border border-border bg-surface p-4 shadow-low transition-colors"
        aria-live="polite"
      >
        <span
          aria-hidden="true"
          className="size-9 shrink-0 rounded-full transition-colors duration-300"
          style={{ background: tenant.accent }}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {tenant.name}{" "}
            <span className="ml-1 font-mono text-xs font-normal text-muted-subtle">
              {tenant.domain}
            </span>
          </p>
          <p className="truncate text-xs text-muted">{tenant.blurb}</p>
        </div>
      </div>
      <p className="mt-3 text-center text-xs tracking-wide text-muted-subtle">
        Drag to spin — one beam in, every brand out.
      </p>
    </div>
  );
}
