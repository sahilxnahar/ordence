"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  OWNER_TONE,
  PIPELINES,
  type PaymentTerm,
  type PipelineRecord,
} from "@/lib/features/pipelines";

/**
 * A CRM company's homepage should let you touch the CRM — and it should
 * be *your* CRM, not a generic one.
 *
 * This was a single hard-coded sales pipeline: four stages, four invented
 * companies, two buttons. It demonstrated a kanban board. The product's
 * actual claim is that it arrives already shaped like your industry, and
 * a generic board is evidence against that claim rather than for it.
 *
 * So the industry selector drives everything — stage names, records, the
 * reference field, the noun for a record, and the actions available on
 * it. Blocking a unit, recording consent and releasing a work order are
 * different verbs because they are genuinely different businesses.
 *
 * Nothing is fetched and nothing persists. Actions report what the system
 * would have done, in the words a system would use, and that log is what
 * earns a visitor's third and fourth click.
 */

function formatLakh(value: number): string {
  return `₹${value % 1 === 0 ? value : value.toFixed(1)}L`;
}

/**
 * Indian digit grouping. `Intl` does this correctly for en-IN and doing
 * it by hand — as almost every dashboard does — is how you end up with
 * 1,480,000 where a finance team expects 14,80,000.
 */
const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatINR(value: number): string {
  return INR.format(value);
}

interface LogEntry {
  id: number;
  text: string;
}

/**
 * The mini menu. A pipeline card is the shallow view of a CRM; the depth
 * is underneath it — the stored row, the instalment plan, and the
 * postings those instalments generated. Tabs rather than a longer panel:
 * the board must not change height when a visitor looks at a ledger.
 */
const TABS = [
  { key: "record", label: "Record" },
  { key: "terms", label: "Terms" },
  { key: "ledger", label: "Ledger" },
  { key: "actions", label: "Actions" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const TERM_TONE: Record<PaymentTerm["status"], string> = {
  paid: "text-success",
  raised: "text-warning",
  upcoming: "text-muted-subtle",
};

const TERM_LABEL: Record<PaymentTerm["status"], string> = {
  paid: "Received",
  raised: "Invoiced",
  upcoming: "Scheduled",
};

export function PipelineDemo() {
  const [industryIndex, setIndustryIndex] = useState(0);
  const pipeline = PIPELINES[industryIndex];

  const [records, setRecords] = useState<PipelineRecord[]>(pipeline.records);
  const [selectedId, setSelectedId] = useState<string | null>(
    pipeline.records[1].id,
  );
  const [log, setLog] = useState<LogEntry[]>([]);
  const [tab, setTab] = useState<TabKey>("record");
  // A monotonic id, held in a ref rather than state: the log needs stable
  // keys for its exit animations, and bumping a counter through setState
  // would re-render the whole board for a number nothing reads.
  const logSeq = useRef(0);
  const reduce = useReducedMotion();

  const selectIndustry = useCallback((i: number) => {
    setIndustryIndex(i);
    setRecords(PIPELINES[i].records);
    setSelectedId(PIPELINES[i].records[1].id);
    setLog([]);
    setTab("record");
  }, []);

  const selected = records.find((r) => r.id === selectedId) ?? null;

  // Weighted forecast: the number an operator actually reports upward.
  const { total, weighted } = useMemo(() => {
    let total = 0;
    let weighted = 0;
    for (const r of records) {
      total += r.value;
      weighted += r.value * pipeline.stages[r.stage].probability;
    }
    return { total, weighted };
  }, [records, pipeline]);

  const move = useCallback(
    (id: string, direction: 1 | -1) => {
      setRecords((current) =>
        current.map((r) =>
          r.id === id
            ? {
                ...r,
                stage: Math.min(
                  pipeline.stages.length - 1,
                  Math.max(0, r.stage + direction),
                ),
              }
            : r,
        ),
      );
    },
    [pipeline],
  );

  const runAction = useCallback((text: string) => {
    const id = (logSeq.current += 1);
    // Newest first, capped at four — an unbounded log would grow past the
    // panel and push the board's height around as the visitor clicks.
    setLog((entries) => [{ id, text }, ...entries].slice(0, 4));
  }, []);

  return (
    <div className="overflow-hidden rounded-panel border border-border bg-surface shadow-mid">
      {/* window chrome */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border bg-surface-subtle px-4 py-3">
        <span className="size-2.5 rounded-full bg-coral-400" />
        <span className="size-2.5 rounded-full bg-warning/60" />
        <span className="size-2.5 rounded-full bg-success/60" />
        <span className="ml-3 font-mono text-[11px] text-muted-subtle">
          app.ordence.com — {pipeline.label}
        </span>
        <span className="ml-auto font-mono text-[11px] text-accent">
          live · try it
        </span>
      </div>

      {/* industry selector — the whole point of the component */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <span className="mr-1 font-mono text-[10px] tracking-[0.18em] text-muted-subtle uppercase">
          Industry
        </span>
        {PIPELINES.map((p, i) => (
          <button
            key={p.key}
            type="button"
            aria-pressed={i === industryIndex}
            onClick={() => selectIndustry(i)}
            className={cn(
              "press rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              i === industryIndex
                ? "border-accent bg-accent-soft text-accent-strong"
                : "border-border text-muted hover:border-border-strong hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
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
        <p className="ml-auto max-w-[22rem] text-xs text-muted">
          {pipeline.claim}
        </p>
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr]">
        {/* board */}
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {pipeline.stages.map((stage, stageIndex) => {
            const inStage = records.filter((r) => r.stage === stageIndex);
            return (
              <div key={stage.label} className="min-h-56 bg-surface p-3">
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <p className="font-mono text-[10px] tracking-normal text-muted uppercase">
                    {stage.label}
                  </p>
                  <span className="font-mono text-[10px] text-muted-subtle">
                    {Math.round(stage.probability * 100)}%
                  </span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {inStage.map((record) => (
                      <motion.div
                        key={record.id}
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
                          onClick={() => setSelectedId(record.id)}
                          aria-pressed={selectedId === record.id}
                          className={cn(
                            "press w-full rounded-xl border p-2.5 text-left transition-colors",
                            selectedId === record.id
                              ? "border-accent bg-accent-soft"
                              : "border-border bg-surface hover:bg-foreground/[0.04]",
                          )}
                        >
                          <span className="block truncate text-xs font-medium">
                            {record.title}
                          </span>
                          <span className="mt-0.5 block truncate font-mono text-[10px] text-muted-subtle">
                            {record.reference}
                          </span>
                          <span className="mt-1.5 flex items-center justify-between">
                            <span className="font-mono text-[11px] text-muted">
                              {formatLakh(record.value)}
                            </span>
                            <span
                              aria-hidden="true"
                              className="inline-flex size-5 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                              style={{ background: OWNER_TONE[record.owner] }}
                            >
                              {record.owner}
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
        <div className="border-t border-border bg-surface-subtle p-5 lg:border-t-0 lg:border-l">
          {selected ? (
            <motion.div
              key={selected.id + pipeline.key}
              initial={reduce ? false : { opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div>
                <p className="corner-caption">{pipeline.noun}</p>
                <h3 className="type-h3 mt-1">{selected.title}</h3>
                <p className="mt-1 font-mono text-[11px] text-muted-subtle">
                  {selected.reference}
                </p>
              </div>

              {/* ————— mini menu ————— */}
              <div
                role="tablist"
                aria-label="Record views"
                className="flex gap-1 rounded-full border border-border bg-surface p-1"
              >
                {TABS.map((t) => {
                  const count =
                    t.key === "terms"
                      ? selected.terms.length
                      : t.key === "ledger"
                        ? selected.ledger.length
                        : 0;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      role="tab"
                      id={`pipe-tab-${t.key}`}
                      aria-selected={tab === t.key}
                      aria-controls={`pipe-panel-${t.key}`}
                      onClick={() => setTab(t.key)}
                      className={cn(
                        "press relative flex-1 rounded-full px-2 py-1.5 text-[11px] font-medium transition-colors",
                        tab === t.key
                          ? "text-brand-contrast"
                          : "text-muted hover:text-foreground",
                      )}
                    >
                      {/* The moving pill. One shared layoutId means the
                          indicator slides between tabs instead of four
                          separate backgrounds cross-fading. */}
                      {tab === t.key && (
                        <motion.span
                          layoutId={`pipe-tab-${pipeline.key}`}
                          aria-hidden="true"
                          className="absolute inset-0 rounded-full bg-brand"
                          transition={
                            reduce
                              ? { duration: 0 }
                              : { type: "spring", stiffness: 420, damping: 34 }
                          }
                        />
                      )}
                      <span className="relative">
                        {t.label}
                        {count > 0 && (
                          <span className="ml-1 font-mono text-[9px] opacity-60 tabular-nums">
                            {count}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div
                role="tabpanel"
                id={`pipe-panel-${tab}`}
                aria-labelledby={`pipe-tab-${tab}`}
                /* A region that scrolls but cannot be focused is
                   unreachable by keyboard — the content below the fold
                   simply does not exist for anyone not using a mouse.
                   tabIndex is also the ARIA-authoring-practices default
                   for a tabpanel whose own children may not be focusable. */
                tabIndex={0}
                /* Fixed height, not min-height: the tallest tab is the
                   record view and the shortest is an empty ledger, so a
                   min-height still lets the whole board jump ~120px as a
                   visitor moves between tabs. A record panel that scrolls
                   internally is also what the real product does. */
                className="h-[19rem] overflow-y-auto pr-1"
              >
                {tab === "record" && (
                  <div className="space-y-3">
                    <dl className="space-y-2 text-xs">
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted">Value</dt>
                        <dd className="font-mono">
                          {formatLakh(selected.value)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted">Stage</dt>
                        <dd>
                          <Badge tone="accent">
                            {pipeline.stages[selected.stage].label}
                          </Badge>
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted">Contact</dt>
                        <dd>{selected.contactRole}</dd>
                      </div>
                      {/* The stored row. A CRM is a database before it is a
                          board, and the fields marked ƒ are the ones the
                          platform computes rather than asks a human to
                          retype — which is where the errors come from. */}
                      {selected.fields.map((f) => (
                        <div
                          key={f.label}
                          className="flex justify-between gap-4 border-t border-border/60 pt-2"
                        >
                          <dt className="flex items-center gap-1.5 text-muted">
                            {f.label}
                            {f.derived && (
                              <span
                                title="Derived by the platform"
                                className="font-mono text-[9px] text-accent"
                              >
                                ƒ
                              </span>
                            )}
                          </dt>
                          <dd className="text-right font-mono text-[11px]">
                            {f.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="rounded-xl bg-surface p-3 text-xs leading-relaxed text-muted">
                      {selected.note}
                    </p>
                  </div>
                )}

                {tab === "terms" &&
                  (selected.terms.length === 0 ? (
                    <p className="text-xs text-muted">
                      No payment plan yet — terms are generated when this{" "}
                      {pipeline.noun.toLowerCase()} is confirmed.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selected.terms.map((t) => (
                        <div
                          key={t.label}
                          className="rounded-xl border border-border bg-surface p-2.5"
                        >
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-[11px] font-medium">
                              {t.label}
                            </span>
                            <span className="font-mono text-[11px] tabular-nums">
                              {formatINR(
                                Math.round(
                                  (selected.value * 100000 * t.percent) / 100,
                                ),
                              )}
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span
                              aria-hidden="true"
                              className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/10"
                            >
                              <span
                                className="block h-full rounded-full bg-accent"
                                style={{ width: `${t.percent}%` }}
                              />
                            </span>
                            <span className="font-mono text-[10px] text-muted-subtle tabular-nums">
                              {t.percent}%
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between gap-3 text-[10px]">
                            <span className="text-muted">{t.due}</span>
                            <span
                              className={cn("font-medium", TERM_TONE[t.status])}
                            >
                              {TERM_LABEL[t.status]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}

                {tab === "ledger" &&
                  (selected.ledger.length === 0 ? (
                    <p className="text-xs text-muted">
                      Nothing posted yet. Postings are written by the workflow,
                      not typed — the first one appears when money or material
                      moves.
                    </p>
                  ) : (
                    <table className="w-full text-[11px]">
                      <caption className="sr-only">
                        Ledger postings for {selected.title}
                      </caption>
                      <thead>
                        <tr className="text-muted">
                          <th
                            scope="col"
                            className="pb-1.5 text-left font-normal"
                          >
                            Account
                          </th>
                          <th
                            scope="col"
                            className="pb-1.5 text-right font-normal"
                          >
                            Dr
                          </th>
                          <th
                            scope="col"
                            className="pb-1.5 text-right font-normal"
                          >
                            Cr
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.ledger.map((line, i) => (
                          <tr
                            key={`${line.date}-${line.account}-${i}`}
                            className="border-t border-border/60"
                          >
                            <th
                              scope="row"
                              className="py-1.5 pr-2 text-left font-normal"
                            >
                              <span className="block">{line.account}</span>
                              <span className="font-mono text-[10px] text-muted-subtle">
                                {line.date}
                              </span>
                            </th>
                            <td className="py-1.5 text-right font-mono tabular-nums">
                              {line.debit ? formatINR(line.debit) : "—"}
                            </td>
                            <td className="py-1.5 text-right font-mono tabular-nums">
                              {line.credit ? formatINR(line.credit) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        {/* Both columns are shown even though they are always
                            equal. That equality is the point: a ledger that
                            cannot go out of balance is a different promise
                            from a spreadsheet that happens to add up. */}
                        <tr className="border-t border-border-strong font-medium">
                          <th scope="row" className="py-1.5 text-left">
                            Balanced
                          </th>
                          <td className="py-1.5 text-right font-mono tabular-nums">
                            {formatINR(
                              selected.ledger.reduce(
                                (s, l) => s + (l.debit ?? 0),
                                0,
                              ),
                            )}
                          </td>
                          <td className="py-1.5 text-right font-mono tabular-nums">
                            {formatINR(
                              selected.ledger.reduce(
                                (s, l) => s + (l.credit ?? 0),
                                0,
                              ),
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  ))}

                {tab === "actions" && (
                  <div className="space-y-3">
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {pipeline.actions.map((a) => (
                        <button
                          key={a.label}
                          type="button"
                          onClick={() => runAction(a.result)}
                          className="press rounded-lg border border-border bg-surface px-2.5 py-2 text-left text-[11px] font-medium transition-colors hover:border-accent hover:text-accent-strong"
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>

                    {log.length > 0 ? (
                      <ul className="space-y-1.5 border-t border-border pt-3">
                        <AnimatePresence initial={false}>
                          {log.map((entry) => (
                            <motion.li
                              key={entry.id}
                              initial={reduce ? false : { opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex gap-2 text-[11px] leading-relaxed text-muted"
                            >
                              <span aria-hidden="true" className="text-success">
                                ✓
                              </span>
                              <span>{entry.text}</span>
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </ul>
                    ) : (
                      <p className="border-t border-border pt-3 text-[11px] text-muted">
                        Run one — the system reports back in the words it would
                        actually use.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => move(selected.id, -1)}
                  disabled={selected.stage === 0}
                  className="press flex-1 rounded-full border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-foreground/5 disabled:opacity-40"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => move(selected.id, 1)}
                  disabled={selected.stage === pipeline.stages.length - 1}
                  className="press flex-1 rounded-full bg-brand px-3 py-2 text-xs font-medium text-brand-contrast transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  Advance →
                </button>
              </div>
            </motion.div>
          ) : (
            <p className="text-xs text-muted">
              Select a {pipeline.noun.toLowerCase()} to open its record.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
