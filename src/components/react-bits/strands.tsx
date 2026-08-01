"use client";

import { useEffect, useRef } from "react";

/**
 * Strands — flowing brand-gradient filaments for hero sections,
 * in the React Bits spirit.
 *
 * Each strand is a horizontal polyline displaced by layered sine fields
 * and gently attracted toward the pointer. Drawn on a single canvas with
 * additive-feeling alpha, producing the "atmospheric hero" treatment from
 * the design references without WebGL cost.
 *
 * Same performance contract as CursorGrid: one rAF, DPR cap, off-screen
 * pause, reduced-motion static render, client-only via lazy wrapper.
 */
export default function Strands({
  count = 14,
  className,
}: {
  count?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let raf = 0;
    let running = false;
    let width = 0;
    let height = 0;
    let t = 0;
    const pointer = { x: 0.5, y: 0.5, active: false };

    // Brand palette — ink→violet→coral interpolation across strands.
    const colors = ["#6d45e8", "#8563ee", "#ff5c5c", "#111827"];

    interface Strand {
      baseY: number; // 0..1
      amp: number;
      freq: number;
      speed: number;
      phase: number;
      color: string;
      widthPx: number;
      alpha: number;
    }

    const strands: Strand[] = Array.from({ length: count }, (_, i) => ({
      baseY: 0.18 + (i / count) * 0.68 + (Math.sin(i * 7.3) * 0.03),
      amp: 26 + (i % 5) * 12,
      freq: 0.8 + (i % 4) * 0.35,
      speed: 0.12 + (i % 3) * 0.05,
      phase: i * 1.7,
      color: colors[i % colors.length],
      widthPx: i % 4 === 3 ? 1 : 1.5,
      alpha: 0.16 + (i % 3) * 0.08,
    }));

    function resize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const step = Math.max(8, Math.floor(width / 140));

      for (const s of strands) {
        ctx.beginPath();
        for (let x = -step; x <= width + step; x += step) {
          const nx = x / width;
          const wave =
            Math.sin(nx * Math.PI * 2 * s.freq + t * s.speed + s.phase) *
              s.amp +
            Math.sin(nx * Math.PI * 4.7 * s.freq + t * s.speed * 1.6) *
              (s.amp * 0.3);

          // Pointer attraction: strands lean toward the cursor.
          let pull = 0;
          if (pointer.active) {
            const d = Math.abs(nx - pointer.x);
            const fall = Math.max(0, 1 - d * 3.2);
            pull = (pointer.y - s.baseY) * height * 0.25 * fall * fall;
          }

          const y = s.baseY * height + wave + pull;
          if (x === -step) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = s.color;
        ctx.globalAlpha = s.alpha;
        ctx.lineWidth = s.widthPx;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function loop() {
      t += 0.016;
      draw();
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (!running && !reduceMotion) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    function onPointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointer.x = (e.clientX - rect.left) / rect.width;
      pointer.y = (e.clientY - rect.top) / rect.height;
      pointer.active = true;
    }

    function onPointerLeave() {
      pointer.active = false;
    }

    resize();
    draw();

    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0.05 },
    );
    io.observe(canvas);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    canvas.addEventListener("pointerleave", onPointerLeave);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [count]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
