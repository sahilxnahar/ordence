"use client";

import { useEffect, useRef } from "react";

/**
 * CursorGrid — an interactive dot-grid background in the React Bits spirit.
 *
 * Engineering constraints (why it's built this way):
 *  - Single <canvas>, one rAF loop — no per-dot DOM nodes.
 *  - IntersectionObserver pauses the loop off-screen (battery, main thread).
 *  - devicePixelRatio-aware, capped at 2 to bound fill-rate on 3x displays.
 *  - prefers-reduced-motion renders a static grid (no loop at all).
 *  - Client-only ("use client") and consumed through a lazy wrapper, so it
 *    never enters the server bundle or blocks hydration.
 */
export default function CursorGrid({
  gap = 26,
  radius = 1.2,
  influence = 140,
  className,
}: {
  gap?: number;
  radius?: number;
  influence?: number;
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
    const pointer = { x: -9999, y: -9999 };

    const css = getComputedStyle(canvas);
    const dotColor = css.getPropertyValue("--grid-dot") || "rgba(17,24,39,0.18)";
    const hotColor = css.getPropertyValue("--grid-hot") || "#6d45e8";

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
      for (let x = gap / 2; x < width; x += gap) {
        for (let y = gap / 2; y < height; y += gap) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const dist = Math.hypot(dx, dy);
          const t = Math.max(0, 1 - dist / influence);
          const r = radius + t * 2.2;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = t > 0.02 ? hotColor : dotColor;
          ctx.globalAlpha = t > 0.02 ? 0.35 + t * 0.65 : 1;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }

    function loop() {
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
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    }

    function onPointerLeave() {
      pointer.x = -9999;
      pointer.y = -9999;
    }

    resize();
    draw(); // always paint the static grid once

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

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [gap, radius, influence]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={
        {
          "--grid-dot": "color-mix(in srgb, var(--foreground) 14%, transparent)",
          "--grid-hot": "var(--brand)",
        } as React.CSSProperties
      }
    />
  );
}
