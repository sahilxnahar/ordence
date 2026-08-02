"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Live tenant theme repainter — the multi-tenant pitch as a toy.
 *
 * Three ways in, in increasing order of "that's my brand":
 *
 *  1. a preset swatch
 *  2. a colour wheel, hue and lightness, dragged directly
 *  3. **upload your own logo** — we read its pixels and pull out the
 *     colours actually in it
 *
 * The third is the one that converts. A prospect who drops in their own
 * mark and watches the workspace repaint in their own colours has stopped
 * evaluating a claim about white-labelling and started using it.
 *
 * Extraction is a histogram over a downscaled canvas draw: quantise to a
 * coarse colour cube, drop near-white, near-black and near-grey, then
 * rank by frequency weighted toward saturation — otherwise a logo on a
 * white card returns "off-white" as its brand colour. Everything happens
 * in the browser; the file is never uploaded anywhere.
 */

const PRESETS = [
  { name: "Ordence", color: "#6d45e8" },
  { name: "Coral", color: "#ff5c5c" },
  { name: "Forest", color: "#0e8a5f" },
  { name: "Amber", color: "#b26a00" },
  { name: "Ocean", color: "#0369a1" },
  { name: "Gold", color: "#a8791f" },
  { name: "Ink", color: "#2c374f" },
  { name: "Magenta", color: "#a21caf" },
] as const;

const MAX_BYTES = 5 * 1024 * 1024;

function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Pull the most brand-like colours out of an image element. */
function extractPalette(img: HTMLImageElement): string[] {
  const size = 96; // enough signal, trivial cost
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, size, size);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, size, size).data;
  } catch {
    // A cross-origin image would taint the canvas. Local files never do,
    // but failing closed beats throwing in the middle of a page.
    return [];
  }

  const buckets = new Map<string, { r: number; g: number; b: number; score: number }>();

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 160) continue; // transparent logo padding
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2 / 255;
    const chroma = (max - min) / 255;

    // Reject the things a logo sits *on* rather than is made of.
    if (lightness > 0.93 || lightness < 0.07) continue;
    if (chroma < 0.12) continue;

    // Quantise to a 32-level cube so near-identical pixels merge.
    const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
    const existing = buckets.get(key);
    // Weight by chroma: a small saturated mark should beat a large
    // desaturated background every time.
    const score = 1 + chroma * 3;
    if (existing) {
      existing.score += score;
    } else {
      buckets.set(key, { r, g, b, score });
    }
  }

  return [...buckets.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(
      (c) =>
        `#${[c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, "0")).join("")}`,
    );
}

export function ThemePreview() {
  const [accent, setAccent] = useState<string>(PRESETS[0].color);
  const [hue, setHue] = useState(258);
  const [lightness, setLightness] = useState(0.6);
  const [logo, setLogo] = useState<string | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const applyWheel = useCallback((h: number, l: number) => {
    setHue(h);
    setLightness(l);
    setAccent(hslToHex(h, 0.72, l));
  }, []);

  const onFile = useCallback((file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("That doesn't look like an image. PNG, JPG, SVG or WebP work.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That file is over 5 MB — a logo should be far smaller.");
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const found = extractPalette(img);
      setLogo(url);
      setPalette(found);
      if (found.length > 0) setAccent(found[0]);
      else
        setError(
          "We couldn't find a strong colour in that mark — pick one below instead.",
        );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError("That image couldn't be read. Try a PNG or JPG.");
    };
    img.src = url;
  }, []);

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.15fr]">
      <div className="space-y-6">
        <h3 className="type-h2">Try it — repaint a tenant.</h3>
        <p className="measure text-sm leading-relaxed text-muted">
          Drop in your own logo and we&apos;ll read its colours, or dial one in
          by hand. The preview re-brands through the exact token system
          production tenants use — one variable, every component. Nothing
          leaves your browser.
        </p>

        {/* 1 · upload */}
        <div>
          <p className="corner-caption mb-2">Your logo</p>
          <label
            className={cn(
              "flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed p-4 transition-colors",
              logo
                ? "border-border-strong"
                : "border-border hover:border-border-strong",
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFile(e.dataTransfer.files?.[0]);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <span
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-foreground/5"
            >
              {logo ? (
                // Object URL of a user's own file — next/image would want a
                // configured remote pattern for something that never leaves
                // this tab.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt=""
                  className="size-full object-contain p-1.5"
                />
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="size-5 text-muted"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 16V4m0 0L8 8m4-4 4 4" />
                  <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                </svg>
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">
                {logo ? "Colours pulled from your mark" : "Drop a logo, or browse"}
              </span>
              <span className="block text-xs text-muted">
                PNG, JPG, SVG or WebP · read in your browser, never uploaded
              </span>
            </span>
          </label>

          {error && (
            <p role="status" className="mt-2 text-xs text-danger-strong">
              {error}
            </p>
          )}

          {palette.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] tracking-wider text-muted-subtle uppercase">
                Found
              </span>
              {palette.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAccent(c)}
                  aria-label={`Use ${c}`}
                  aria-pressed={accent === c}
                  className="size-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    background: c,
                    borderColor:
                      accent === c ? "var(--foreground)" : "transparent",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* 2 · the wheel */}
        <div>
          <p className="corner-caption mb-2">Or dial one in</p>
          <div className="flex items-center gap-5">
            <div
              aria-hidden="true"
              className="relative size-24 shrink-0 rounded-full border border-border"
              style={{
                background: `conic-gradient(${Array.from(
                  { length: 13 },
                  (_, i) => `${hslToHex(i * 30, 0.72, lightness)} ${i * 30}deg`,
                ).join(", ")})`,
              }}
            >
              <span
                className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-mid"
                style={{
                  background: accent,
                  left: `${50 + 38 * Math.cos(((hue - 90) * Math.PI) / 180)}%`,
                  top: `${50 + 38 * Math.sin(((hue - 90) * Math.PI) / 180)}%`,
                }}
              />
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <label className="block">
                <span className="flex items-baseline justify-between text-xs text-muted">
                  Hue
                  <span className="font-mono text-[10px] tabular-nums">
                    {Math.round(hue)}°
                  </span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={359}
                  value={hue}
                  onChange={(e) => applyWheel(Number(e.target.value), lightness)}
                  className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-full focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
                  style={{
                    background:
                      "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                  }}
                />
              </label>
              <label className="block">
                <span className="flex items-baseline justify-between text-xs text-muted">
                  Lightness
                  <span className="font-mono text-[10px] tabular-nums">
                    {Math.round(lightness * 100)}%
                  </span>
                </span>
                <input
                  type="range"
                  min={20}
                  max={80}
                  value={Math.round(lightness * 100)}
                  onChange={(e) => applyWheel(hue, Number(e.target.value) / 100)}
                  className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-foreground/15 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
                />
              </label>
            </div>
          </div>
        </div>

        {/* 3 · presets */}
        <div>
          <p className="corner-caption mb-2">Or start from a preset</p>
          <div className="flex flex-wrap items-center gap-2.5">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                aria-label={`Use ${p.name} accent`}
                aria-pressed={accent === p.color}
                onClick={() => setAccent(p.color)}
                className="size-9 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  background: p.color,
                  borderColor:
                    accent === p.color ? "var(--foreground)" : "transparent",
                }}
              />
            ))}
            <label className="relative inline-flex size-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border-strong text-xs font-semibold">
              <input
                type="color"
                aria-label="Pick an exact accent colour"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              +
            </label>
            <span className="ml-1 font-mono text-[11px] text-muted-subtle tabular-nums">
              {accent.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* the repainted mini-tenant */}
      <div
        className="rounded-panel border border-border bg-surface p-6 shadow-mid transition-colors"
        style={{ "--brand": accent, "--ring": accent } as React.CSSProperties}
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <span className="flex items-center gap-2.5 font-semibold">
            <span
              aria-hidden="true"
              className="flex size-7 items-center justify-center overflow-hidden rounded-full transition-colors"
              style={{ background: logo ? "transparent" : accent }}
            >
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="size-full object-contain" />
              )}
            </span>
            Your Brand
          </span>
          <span
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-white transition-colors"
            style={{ background: accent }}
          >
            Get started
          </span>
        </div>
        <div className="space-y-3 pt-4">
          <div className="h-3.5 w-2/3 rounded-full bg-foreground/85" />
          <div className="h-3.5 w-1/2 rounded-full bg-foreground/15" />
          <div className="flex gap-2 pt-2">
            {[38, 62, 45].map((w, i) => (
              <div
                key={i}
                className="h-16 flex-1 rounded-xl border border-border p-2.5"
              >
                <div
                  className="mb-2 h-2 rounded-full bg-foreground/12"
                  style={{ width: `${w}%` }}
                />
                <div
                  className="h-2 w-1/2 rounded-full transition-colors"
                  style={{ background: accent, opacity: 0.75 }}
                />
              </div>
            ))}
          </div>
          <p className="pt-1 font-mono text-[10px] tracking-wider text-muted-subtle uppercase">
            yourbrand.ordence.com — live in 60 seconds
          </p>
        </div>
      </div>
    </div>
  );
}
