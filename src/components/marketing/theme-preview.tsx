"use client";

import { useState } from "react";

/**
 * Live tenant theme repainter — the multi-tenant pitch as a toy.
 * Visitors pick an accent; the preview card re-brands instantly via the
 * same `--brand` token mechanism production tenants use. Zero trickery:
 * this IS how it works.
 */

const PRESETS = [
  { name: "Ordence", color: "#6d45e8" },
  { name: "Coral", color: "#ff5c5c" },
  { name: "Forest", color: "#0e8a5f" },
  { name: "Amber", color: "#b26a00" },
  { name: "Ocean", color: "#0369a1" },
] as const;

export function ThemePreview() {
  const [accent, setAccent] = useState<string>(PRESETS[0].color);
  const [custom, setCustom] = useState(false);

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.15fr]">
      <div className="space-y-5">
        <h3 className="type-h2">
          Try it — repaint a tenant.
        </h3>
        <p className="max-w-md text-sm leading-relaxed text-muted">
          Pick a color. The preview re-brands through the exact token system
          production tenants use — one variable, every component.
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              aria-label={`Use ${p.name} accent`}
              onClick={() => {
                setAccent(p.color);
                setCustom(false);
              }}
              className="size-9 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                background: p.color,
                borderColor:
                  accent === p.color && !custom
                    ? "var(--foreground)"
                    : "transparent",
              }}
            />
          ))}
          <label className="relative inline-flex size-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border-strong text-xs font-semibold">
            <input
              type="color"
              aria-label="Pick a custom accent color"
              value={accent}
              onChange={(e) => {
                setAccent(e.target.value);
                setCustom(true);
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            +
          </label>
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
              className="size-6 rounded-full transition-colors"
              style={{ background: accent }}
            />
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
