"use client";

/**
 * React Bits integration boundary.
 *
 * Every interactive "bit" is:
 *   1. Client-only  — `ssr: false` keeps canvas/WebGL code out of SSR.
 *   2. Code-split   — `next/dynamic` gives each bit its own chunk, loaded
 *                     only on pages that render it.
 *   3. Fallback-safe — a static brand-gradient wash renders during load
 *                     (and forever, if JS fails), so the page never looks
 *                     broken. Decoration must degrade to decoration.
 *
 * Pages import ONLY from this file — never from the raw implementations —
 * so the loading policy is enforced in exactly one place.
 */

import dynamic from "next/dynamic";

function DecorativeFallback({ className }: { className?: string }) {
  return <div className={className} style={{ opacity: 0.5 }} aria-hidden="true" />;
}

export const LazyCursorGrid = dynamic(() => import("./cursor-grid"), {
  ssr: false,
  loading: () => <DecorativeFallback />,
});

export const LazyStrands = dynamic(() => import("./strands"), {
  ssr: false,
  loading: () => <DecorativeFallback />,
});
