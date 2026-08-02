"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * A CRM company's homepage should let you touch the CRM.
 *
 * This replaced a static screenshot-style table. Deals can be moved
 * between stages, selected to reveal their record, and the weighted
 * forecast recomputes as you go — which demonstrates the product's
 * actual claim (honest pipelines, stage probability, instant totals)
 * far better than a picture of it.
 *
 * State is a handful of strings in `useState`; the animation is
 * layout-driven. Nothing is fetched, nothing is persisted.
 */

const STAGES = [
  { key: "discovery", label: "Discovery", probability: 0.2 },
  { key: "proposal", label: "Proposal", probability: 0.45 },
  { key: "negotiation", label: "Negotiation", probability: 0.7 },
  { key: "won", label: "Won", probability: 1 },
] as const;

type StageKey = (typeof STAGES)[number]["key"];

interface Deal {
  id: string;
  company: string;
  value: number; // in lakhs
  owner: string;
  stage: StageKey;
  contact: string;
  note: string;
}

const INITIAL: Deal[] = [
  { id: "d1", company: "Ameyaa Heights", value: 42, owner: "SN", stage: "won", contact: "Procurement lead", note: "Signed after the site-visit workflow demo." },
  { id: "d2", company: "Northline Retail", value: 18, owner: "AK", stage: "proposal", contact: "Head of Ops", note: "Wants POS and inventory in one view." },
  { id: "d3", company: "Vega Logistics", value: 9.5, owner: "RM", stage: "discovery", contact: "Fleet manager", note: "Evaluating trip and POD tracking." },
  { id: "d4", company: "Lumen Foods", value: 27, owner: "SN", stage: "negotiation", contact: "Founder", note: "Negotiating seats for a 40-person team." },
];

/**
 * Avatar inks, not brand inks. White initials on coral-500 measure 2.55:1 —
 * these are the darkened variants that clear 4.5:1 against white text.
 */
const OWNER_TONE: Record<string, string> = {
  SN: "var(--ordence-violet-700)",
  AK: "#b52d2d",
  RM: "var(--ordence-ink-700)",
};

function formatLakh(value: number): string {
  return `₹${value % 1 === 0 ? value : value.toFixed(1)}L`;
}

export function PipelineDemo() {
  const [deals, setDeals] = useState<Deal[]>(INITIAL);
  const [selectedId, setSelectedId] = useState<string | null>("d2");
  const reduce = useReducedMotion();

  const selected = deals.find((d) => d.id === selectedId) ?? null;

  // Weighted forecast: the number a sales leader actually reports.
  const { total, weighted } = useMemo(() => {
    let total = 0;
    let weighted = 0;
    for (const d of deals) {
      const stage = STAGES.find((s) => s.key === d.stage)!;
      total += d.value;
      weighted += d.value * stage.probability;
    }
    return { total, weighted };
  }, [deals]);

  function moveDeal(id: string, direction: 1 | -1) {
    setDeals((current) =>
      current.map((d) => {
        if (d.id !== id) return d;
        const index = STAGES.findIndex((s) => s.key === d.stage);
        const next = Math.min(STAGES.length - 1, Math.max(0, index + direction));
        return { ...d, stage: STAGES[next].key };
      }),
    );
  }

  return (
    <div className="overflow-hidden rounded-panel border border-border bg-surface shadow-mid">
      {/* window chrome */}
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-subtle px-4 py-3">
        <span className="size-2.5 rounded-full bg-coral-400" />
        <span className="size-2.5 rounded-full bg-warning/60" />
        <span className="size-2.5 rounded-full bg-success/60" />
        <span className="ml-3 font-mono text-[11px] text-muted-subtle">
          app.ordence.com — Pipeline
        </span>
        <span className="ml-auto font-mono text-[11px] text-accent">
          live · try it
        </span>
      </div>

      {/* forecast bar */}
      <div className="flex flex-wrap items-center gap-6 border-b border-border px-4 py-3">
        <div>
          <p className="corner-caption">Pipeline</p>
          <p className="text-lg font-semibold tabular-nums">
            {formatLakh(total)}
          </p>
        </div>
        <div>
          <p className="corner-caption">Weighted forecast</p>
          <motion.p
            key={weighted.toFixed(1)}
            initial={reduce ? false : { opacity: 0.4, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-lg font-semibold text-accent tabular-nums"
          >
            {formatLakh(Number(weighted.toFixed(1)))}
          </motion.p>
        </div>
        <p className="ml-auto max-w-[14rem] text-xs text-muted">
          Move a deal and the forecast recalculates by stage probability.
        </p>
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr]">
        {/* board */}
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {STAGES.map((stage) => {
            const inStage = deals.filter((d) => d.stage === stage.key);
            return (
              <div key={stage.key} className="min-h-48 bg-surface p-3">
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  {/* Tracking is dropped here: the column headers are the
                      one place letterspacing costs more width than the
                      layout can spare. */}
                  <p className="font-mono text-[10px] tracking-normal text-muted uppercase">
                    {stage.label}
                  </p>
                  <span className="font-mono text-[10px] text-muted-subtle">
                    {Math.round(stage.probability * 100)}%
                  </span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {inStage.map((deal) => (
                      <motion.div
                        key={deal.id}
                        layout={!reduce}
                        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{
                          duration: 0.28,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedId(deal.id)}
                          aria-pressed={selectedId === deal.id}
                          className={cn(
                            "press w-full rounded-xl border p-2.5 text-left transition-colors",
                            selectedId === deal.id
                              ? "border-accent bg-accent-soft"
                              : "border-border bg-surface hover:bg-foreground/[0.03]",
                          )}
                        >
                          <span className="block truncate text-xs font-medium">
                            {deal.company}
                          </span>
                          <span className="mt-1 flex items-center justify-between">
                            <span className="font-mono text-[11px] text-muted">
                              {formatLakh(deal.value)}
                            </span>
                            <span
                              aria-hidden="true"
                              className="inline-flex size-5 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                              style={{ background: OWNER_TONE[deal.owner] }}
                            >
                              {deal.owner}
                            </span>
                          </span>
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>

        {/* record panel */}
        <div className="border-t border-border bg-surface-subtle p-5 md:border-t-0 md:border-l">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={reduce ? false : { opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div>
                <p className="corner-caption">Record</p>
                <h3 className="type-h3 mt-1">{selected.company}</h3>
              </div>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Value</dt>
                  <dd className="font-mono">{formatLakh(selected.value)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Stage</dt>
                  <dd>
                    <Badge tone="accent">
                      {STAGES.find((s) => s.key === selected.stage)?.label}
                    </Badge>
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Contact</dt>
                  <dd>{selected.contact}</dd>
                </div>
              </dl>
              <p className="rounded-xl bg-surface p-3 text-xs leading-relaxed text-muted">
                {selected.note}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => moveDeal(selected.id, -1)}
                  disabled={selected.stage === STAGES[0].key}
                  className="press flex-1 rounded-full border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-foreground/5 disabled:opacity-40"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => moveDeal(selected.id, 1)}
                  disabled={selected.stage === STAGES[STAGES.length - 1].key}
                  className="press flex-1 rounded-full bg-brand px-3 py-2 text-xs font-medium text-brand-contrast transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  Advance →
                </button>
              </div>
            </motion.div>
          ) : (
            <p className="text-xs text-muted">Select a deal to open its record.</p>
          )}
        </div>
      </div>
    </div>
  );
}
