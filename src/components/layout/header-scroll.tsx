"use client";

import { useEffect } from "react";

/**
 * Drives the header's condense-on-scroll as CSS variables on <html>.
 *
 * Variables rather than className toggling on purpose: the header, the
 * mark and the wordmark all need to shrink together, and three elements
 * reading one variable stay in lockstep by construction. Swapping classes
 * would leave three independent transitions to keep in sync by hand.
 *
 * The listener is passive and rAF-throttled, and it only writes when the
 * state actually flips — scrolling a long page does not mean touching
 * the DOM on every frame.
 */

// Two scales, because a 128px mark is a statement on a desktop and an
// obstruction on a phone. Matched to the lg breakpoint the stylesheet uses.
// Three tiers, matching the stylesheet exactly. The wide tier is the
// two-row layout with the doubled lockup; the middle tier is a single row
// with a large-but-contained mark; mobile stays modest.
const WIDE = {
  resting: { h: "11.5rem", mark: "16rem", word: "5rem" },
  condensed: { h: "5rem", mark: "3.5rem", word: "1.7rem" },
};
const MID = {
  resting: { h: "9.5rem", mark: "7.5rem", word: "3rem" },
  condensed: { h: "4.75rem", mark: "3.25rem", word: "1.6rem" },
};
const MOBILE = {
  resting: { h: "7.5rem", mark: "5.5rem", word: "2.25rem" },
  condensed: { h: "4.25rem", mark: "2.75rem", word: "1.35rem" },
};
const THRESHOLD = 120;

export function HeaderScroll() {
  useEffect(() => {
    const root = document.documentElement;
    const wide = window.matchMedia("(min-width: 1280px)");
    const mid = window.matchMedia("(min-width: 1024px)");
    let condensed: boolean | null = null;
    let lastTier: string | null = null;
    let queued = false;

    const apply = () => {
      queued = false;
      const next = window.scrollY > THRESHOLD;
      const tier = wide.matches ? "wide" : mid.matches ? "mid" : "mobile";
      if (next === condensed && tier === lastTier) return;
      condensed = next;
      lastTier = tier;
      const scale = tier === "wide" ? WIDE : tier === "mid" ? MID : MOBILE;
      const v = next ? scale.condensed : scale.resting;
      root.style.setProperty("--header-h", v.h);
      root.style.setProperty("--logo-mark", v.mark);
      root.style.setProperty("--logo-word", v.word);
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    wide.addEventListener("change", apply);
    mid.addEventListener("change", apply);
    return () => {
      window.removeEventListener("scroll", onScroll);
      wide.removeEventListener("change", apply);
      mid.removeEventListener("change", apply);
    };
  }, []);

  return null;
}
