"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";

/**
 * TiltCard — subtle 3D perspective tilt that follows the cursor,
 * with a moving highlight sheen. The "fun" layer for cards without
 * sacrificing the flat, hairline aesthetic.
 */
export function TiltCard({
  children,
  className,
  // Softened from 6°. At the larger angle the card read as a gimmick and
  // the text visibly sheared; at 3° it registers as the surface
  // responding to you, which is the whole point.
  maxTilt = 3,
}: {
  children: React.ReactNode;
  className?: string;
  /** degrees of rotation at the card edges */
  maxTilt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5); // pointer position 0..1
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 220, damping: 20 });
  const sy = useSpring(py, { stiffness: 220, damping: 20 });
  const rotateX = useTransform(sy, [0, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(sx, [0, 1], [-maxTilt, maxTilt]);
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 800,
      }}
      onPointerMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        px.set((e.clientX - rect.left) / rect.width);
        py.set((e.clientY - rect.top) / rect.height);
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
    >
      {children}
      {/*
        The moving sheen was removed here. It added two extra elements and
        a full-width gradient repaint per card on every pointer move, to
        simulate a glare that a flat, hairline-bordered surface would
        never actually produce. Cutting it is both faster and truer to
        the material.
      */}
    </motion.div>
  );
}
