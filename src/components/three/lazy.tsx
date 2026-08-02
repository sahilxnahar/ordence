"use client";

/**
 * Lazy boundary for all Three.js scenes.
 * three + fiber + drei ≈ hundreds of KB — they must never ride in the
 * shared bundle. Each showpiece gets its own async chunk with `ssr: false`
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

/** Homepage flagship — pinned particle scroll-story on a dark stage. */
export const LazyLedgerSection = dynamic(() => import("./ledger-section"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="h-svh bg-[#0b101b] bg-[radial-gradient(60%_60%_at_50%_45%,rgba(109,69,232,0.2),transparent_70%)]"
    />
  ),
});

/** /platform showpiece — draggable glass prism of branded tenant sites. */
export const LazyTenantPrism = dynamic(() => import("./tenant-prism"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="aspect-[4/3] w-full rounded-panel bg-gradient-brand opacity-10 blur-2xl"
    />
  ),
});

/** /product showpiece — the living isometric business diorama. */
export const LazyCommandRoom = dynamic(() => import("./command-room"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="aspect-[16/10] w-full rounded-panel border border-border bg-[#0b101b]"
    />
  ),
});
