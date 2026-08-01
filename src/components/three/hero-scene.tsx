"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import type { Mesh } from "three";
import SceneCanvas from "./scene-canvas";

/**
 * HeroOrb — a slowly-breathing distorted sphere in brand violet,
 * used as a premium focal object (product pages, feature intros).
 * Illustrates the pattern: scene content composes inside SceneCanvas;
 * the page imports it only through `components/three/lazy.tsx`.
 */

function Orb() {
  const mesh = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    mesh.current.rotation.y = clock.elapsedTime * 0.15;
    mesh.current.rotation.x = Math.sin(clock.elapsedTime * 0.2) * 0.2;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.9}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1.4, 48]} />
        <MeshDistortMaterial
          color="#6d45e8"
          roughness={0.25}
          metalness={0.55}
          distort={0.32}
          speed={1.6}
        />
      </mesh>
    </Float>
  );
}

export default function HeroScene({ className }: { className?: string }) {
  return (
    <SceneCanvas className={className} frameloop="always">
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} color="#ffffff" />
      <pointLight position={[-5, -3, -4]} intensity={2.2} color="#ff5c5c" />
      <Orb />
    </SceneCanvas>
  );
}
