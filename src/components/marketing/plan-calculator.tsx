"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { INDUSTRY_PACKS, MODULE_CATALOG } from "@/lib/tenant/industries";

/**
 * Interactive plan estimator.
 *
 * Mirrors the real activation model — industry preset, seats, term —
 * so a prospect arrives at the approval conversation already knowing
 * roughly what they'll pay and which modules they're getting. It also
 * quietly demonstrates the industry-pack idea better than a paragraph
 * about it could.
 *
 * A scope builder, not a price calculator: quoting a firm number from a slider
 * and then charging something else is the fastest way to lose trust.
 */

/*
 * No published price.
 *
 * This used to be a live estimator at a fixed per-seat rate. Pricing is
 * now quoted rather than listed, so the component keeps everything that
 * was useful about it — pick your industry, set your team size, choose a
 * term, watch the module list assemble — and drops the only part that
 * was a commitment we are not ready to make in public. What the visitor
 * builds here is submitted as the scope of their quote request.
 */
const MIN_SEATS = 3;
const MAX_SEATS = 250;

const TERMS = [
  { months: 1, label: "Monthly" },
  { months: 12, label: "12 months" },
  { months: 24, label: "24 months" },
] as const;

export function PlanCalculator() {
  const [seats, setSeats] = useState(12);
  const [termIndex, setTermIndex] = useState(1);
  const [industry, setIndustry] = useState(INDUSTRY_PACKS[0].key);
  const reduce = useReducedMotion();

  const term = TERMS[termIndex];
  const pack = INDUSTRY_PACKS.find((p) => p.key === industry)!;

  // What the visitor is assembling is a scope, not a bill.
  const summary = useMemo(
    () =>
      `${pack.label} · ${seats} ${seats === 1 ? "user" : "users"} · ${
        term.months === 1 ? "monthly" : `${term.months}-month term`
      }`,
    [pack, seats, term],
  );

  const modules = useMemo(
    () =>
      MODULE_CATALOG.filter((m) => pack.modules.includes(m.key)).slice(0, 8),
    [pack],
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      {/* controls */}
      <div className="space-y-7">
        <div>
          <span className="kicker">Estimate your plan</span>
          <h2 className="type-h1 mt-4">What would this cost us?</h2>
          <p className="type-body measure-narrow mt-3">
            Move the controls. The modules shown are the ones your industry
            actually starts with — the same preset our team applies when we
            configure your workspace.
          </p>
        </div>

        {/* industry */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Industry</legend>
          <div className="flex flex-wrap gap-2">
            {INDUSTRY_PACKS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setIndustry(p.key)}
                aria-pressed={industry === p.key}
                className={`press rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  industry === p.key
                    ? "border-accent bg-accent-soft text-accent-strong"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* seats */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <label htmlFor="seats" className="text-sm font-medium">
              Users
            </label>
            <span className="font-mono text-sm tabular-nums">{seats}</span>
          </div>
          <input
            id="seats"
            type="range"
            min={MIN_SEATS}
            max={MAX_SEATS}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-foreground/10 accent-[var(--brand)]"
          />
          <div className="flex justify-between font-mono text-[10px] text-muted-subtle">
            <span>{MIN_SEATS}</span>
            <span>{MAX_SEATS}+</span>
          </div>
        </div>

        {/* term */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Commitment</legend>
          <div className="flex flex-wrap gap-2">
            {TERMS.map((t, i) => (
              <button
                key={t.months}
                type="button"
                onClick={() => setTermIndex(i)}
                aria-pressed={termIndex === i}
                className={`press rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                  termIndex === i
                    ? "border-accent bg-accent-soft text-accent-strong"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                {t.label}

              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {/* result */}
      <div className="rounded-panel border border-border bg-surface p-8 shadow-mid">
        <p className="corner-caption">Your configuration</p>
        <motion.p
          key={summary}
          initial={reduce ? false : { opacity: 0.5, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="type-h3 mt-2"
        >
          {summary}
        </motion.p>
        <p className="type-body mt-3 text-muted">
          We quote against the shape of your business rather than a per-seat
          list price — the modules your industry needs to work at all are
          never a line item. Send this configuration and you get a fixed
          number in writing.
        </p>

        {term.months > 1 && (
          <Badge tone="accent" className="mt-4">
            Longer terms are priced better
          </Badge>
        )}

        <div className="mt-7 border-t border-border pt-6">
          <p className="corner-caption mb-3">
            {pack.label} starts with {pack.modules.length} modules
          </p>
          <div className="flex flex-wrap gap-1.5">
            {modules.map((m) => (
              <span
                key={m.key}
                className="rounded-full bg-foreground/5 px-2.5 py-1 text-[11px] text-muted"
              >
                {m.label}
              </span>
            ))}
            {pack.modules.length > modules.length && (
              <span className="rounded-full bg-foreground/5 px-2.5 py-1 text-[11px] text-muted">
                +{pack.modules.length - modules.length} more
              </span>
            )}
          </div>
        </div>

        <Button variant="accent" href="/get-started" className="mt-7 w-full">
          Request this configuration <span aria-hidden="true">→</span>
        </Button>
        <p className="mt-3 text-center text-[11px] text-muted-subtle">
          Nothing here is a commitment — we confirm scope and price in writing before anything starts.
        </p>
      </div>
    </div>
  );
}
