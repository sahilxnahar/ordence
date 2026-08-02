"use client";

import { useId, useState } from "react";
import type { FieldControl } from "./particle-field";

/**
 * The playground panel for a dark band.
 *
 * Collapsed by default, and that is the important design decision. A
 * visitor's first impression of the section should be the composition, not
 * a rack of sliders — so the whole surface hides behind one small pill.
 * Anyone who wants to take it apart can; nobody has to look at the workings
 * to get the point.
 *
 * Everything here is native form controls with real labels, so it is
 * keyboard-operable and screen-reader-legible for free. The values are
 * plain numbers owned by the parent and pushed into shader uniforms — no
 * re-render of the scene, no shader recompilation, no state in the GPU.
 */

export function SceneControls({
  controls,
  values,
  onChange,
  onReset,
  tone = "violet",
  label = "Play with it",
}: {
  controls: FieldControl[];
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
  onReset: () => void;
  tone?: "violet" | "amber";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const accent = tone === "amber" ? "#ffc478" : "#a186f3";

  return (
    <div className="pointer-events-auto absolute right-5 bottom-5 z-10 hidden w-72 lg:block">
      {open && (
        <div
          id={panelId}
          className="mb-2 rounded-2xl border border-white/12 bg-black/65 p-4 backdrop-blur-xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-[10px] tracking-[0.2em] text-white/55 uppercase">
              Controls
            </p>
            <button
              type="button"
              onClick={onReset}
              className="rounded-full px-2 py-1 font-mono text-[10px] tracking-wider text-white/55 uppercase transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white/60"
            >
              Reset
            </button>
          </div>

          <div className="space-y-3">
            {controls.map((c) => {
              const v = values[c.key] ?? c.value;
              return (
                <div key={c.key}>
                  <div className="flex items-baseline justify-between gap-3">
                    <label
                      htmlFor={`${panelId}-${c.key}`}
                      className="text-[11px] text-white/75"
                    >
                      {c.label}
                    </label>
                    <span className="font-mono text-[10px] tabular-nums text-white/50">
                      {c.format ? c.format(v) : formatNumber(v)}
                    </span>
                  </div>
                  <input
                    id={`${panelId}-${c.key}`}
                    type="range"
                    min={c.min}
                    max={c.max}
                    step={c.step}
                    value={v}
                    onChange={(e) => onChange(c.key, Number(e.target.value))}
                    style={{ accentColor: accent }}
                    className="mt-1.5 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-4"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="ml-auto flex items-center gap-2 rounded-full border border-white/20 bg-black/55 px-4 py-2 font-mono text-[10px] tracking-[0.16em] text-white/80 uppercase backdrop-blur-xl transition-colors hover:border-white/40 hover:text-white focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-2"
      >
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full"
          style={{ background: accent }}
        />
        {open ? "Hide controls" : label}
      </button>
    </div>
  );
}

function formatNumber(v: number): string {
  if (Number.isInteger(v)) return String(v);
  // Trailing zeros only, and never the decimal point on its own: 1.00 → 1,
  // 0.50 → 0.5. `replace(/0$/)` would have left "1.0".
  return v.toFixed(2).replace(/\.?0+$/, "");
}
