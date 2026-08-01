"use client";

/**
 * Lazy boundary for all Three.js scenes.
 * three + fiber + drei ≈ hundreds of KB — they must never ride in the
 * shared bundle. Each scene gets its own async chunk with `ssr: false`
 * (WebGL cannot render on the server) and a lightweight CSS fallback
 * that reserves layout space to prevent CLS.
 */

import dynamic from "next/dynamic";

export const LazyHeroScene = dynamic(() => import("./hero-scene"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="size-full rounded-full bg-gradient-brand opacity-20 blur-3xl"
    />
  ),
});
