"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";

/**
 * Magnetic — the element leans toward the cursor while hovered and
 * springs back on leave. Wrap CTAs and icons to make them feel alive.
 * Reduced-motion users get a plain wrapper (no listeners, no movement).
 */
export function Magnetic({
  children,
  strength = 0.35,
  className,
}: {
  children: React.ReactNode;
  /** 0..1 — how far the element follows the cursor. */
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.5 });
  const reduce = useReducedMotion();

  if (reduce) return <div className={cn("inline-block", className)}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      // `display` belongs in a class, not in `style`. As an inline style it
      // beat every responsive utility a caller passed in — `max-sm:hidden`
      // on a Magnetic-wrapped CTA silently did nothing, which is how the
      // header's "Get started" button stayed visible on phones and pushed
      // every page into horizontal overflow.
      className={cn("inline-block", className)}
      style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set((e.clientX - (rect.left + rect.width / 2)) * strength);
        y.set((e.clientY - (rect.top + rect.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
