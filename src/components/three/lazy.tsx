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

/**
 * Dark bands. Each reserves its own height so the placeholder→scene swap
 * costs no layout shift, and each placeholder is a designed composition
 * rather than a grey box — on a capped device it is the final experience,
 * not a loading state.
 */

/** Homepage opening — the swarm layered over the headline. */
export const LazyHeroStage = dynamic(() => import("./hero-stage"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="min-h-[88svh] bg-[#080c14] bg-[radial-gradient(46%_46%_at_66%_50%,rgba(133,99,238,0.34),transparent_70%)]"
    />
  ),
});

/**
 * Homepage — one engine aimed at one product at a time. This is the
 * band that replaced three decorative ones.
 */
export const LazyProductSpotlight = dynamic(
  () => import("./product-spotlight"),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="h-[700px] bg-[#080c14] bg-[radial-gradient(42%_44%_at_62%_48%,rgba(133,99,238,0.28),transparent_70%)] lg:h-[780px]"
      />
    ),
  },
);

/** /crm — omnichannel noise collapsing into one record. */
export const LazyConvergenceBand = dynamic(() => import("./convergence-band"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="h-[520px] bg-[#080c14] bg-[radial-gradient(45%_45%_at_50%_50%,rgba(109,69,232,0.3),transparent_70%)] sm:h-[640px] lg:h-[760px]"
    />
  ),
});

/** /platform + tenant workspaces — one core, every workspace in orbit. */
export const LazyMagnetosphereBand = dynamic(
  () => import("./magnetosphere-band"),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="h-[560px] bg-[#080c14] bg-[radial-gradient(40%_40%_at_50%_50%,rgba(133,99,238,0.26),transparent_70%)] lg:h-[720px]"
      />
    ),
  },
);

/** Closing CTA + /about — the warm, quiet one. */
export const LazyLampBand = dynamic(() => import("./lamp-band"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="h-[600px] bg-[#07090f] bg-[radial-gradient(35%_55%_at_50%_10%,rgba(255,196,120,0.24),transparent_70%)] lg:h-[700px]"
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
