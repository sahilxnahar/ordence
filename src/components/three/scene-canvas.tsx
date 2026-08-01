"use client";

import { Component, Suspense, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";

/**
 * SceneCanvas — the single sanctioned way to mount WebGL.
 *
 * Performance budget enforced here, once, for every scene:
 *  - dpr capped at [1, 2]: fill-rate is the #1 WebGL cost on 3x screens.
 *  - frameloop="demand" by default: static scenes render only on change;
 *    animated scenes opt into "always".
 *  - powerPreference "high-performance", no antialias when postprocessing.
 *  - Suspense boundary so async assets (models, textures) stream in
 *    without blocking the page.
 *  - Error boundary: a WebGL crash (lost context, unsupported GPU)
 *    degrades to the children's absence — never a white screen.
 */

class WebGLErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}

export default function SceneCanvas({
  children,
  className,
  frameloop = "demand",
  fallback = null,
}: {
  children: ReactNode;
  className?: string;
  frameloop?: "always" | "demand" | "never";
  fallback?: ReactNode;
}) {
  return (
    <WebGLErrorBoundary fallback={fallback}>
      <Canvas
        className={className}
        dpr={[1, 2]}
        frameloop={frameloop}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 5], fov: 45 }}
      >
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </WebGLErrorBoundary>
  );
}
