"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Proximity spotlight.
 *
 * Every card inside lights up from wherever the cursor is, and the
 * nearest card's border catches the light. The naive way to build this
 * is per-card React state and a listener each — which at 6 cards means 6
 * listeners and 6 re-renders per pointer move.
 *
 * Instead: ONE listener on the group, coordinates written straight to CSS
 * custom properties on the DOM nodes, batched into a single animation
 * frame. React never re-renders during the interaction, and the paint is
 * a GPU-composited radial gradient. The whole system is a few hundred
 * bytes and stays smooth with any number of cards.
 */
export function SpotlightGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const latest = useRef({ x: 0, y: 0 });

  const paint = useCallback(() => {
    frame.current = 0;
    const root = ref.current;
    if (!root) return;
    const { x, y } = latest.current;
    for (const card of root.querySelectorAll<HTMLElement>("[data-spotlight]")) {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--spot-x", `${x - r.left}px`);
      card.style.setProperty("--spot-y", `${y - r.top}px`);
      // Fade the effect out with distance so only nearby cards react —
      // everything lighting up at once reads as a bug, not a response.
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const distance = Math.hypot(x - cx, y - cy);
      const reach = Math.max(r.width, r.height) * 1.15;
      const strength = Math.max(0, 1 - distance / reach);
      card.style.setProperty("--spot-strength", strength.toFixed(3));
    }
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      latest.current = { x: e.clientX, y: e.clientY };
      if (!frame.current) frame.current = requestAnimationFrame(paint);
    },
    [paint],
  );

  const onPointerLeave = useCallback(() => {
    const root = ref.current;
    if (!root) return;
    for (const card of root.querySelectorAll<HTMLElement>("[data-spotlight]")) {
      card.style.setProperty("--spot-strength", "0");
    }
  }, []);

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={className}
    >
      {children}
    </div>
  );
}

/** Marks an element as a spotlight target. Pure presentation. */
export function spotlightClass(extra?: string): string {
  return cn("spotlight", extra);
}
