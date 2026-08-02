"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  DOMAIN_LABEL,
  FEATURES,
  PACKS,
  PACK_AFFINITY,
  featuresForIndustry,
  groupsFor,
  type Feature,
} from "@/lib/features/catalog";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

/**
 * The scoping tool: pick an industry, see the workspace it produces.
 *
 * 500 rows is far too many to present as a list — as a wall of text it
 * reads as noise and argues nothing. Filtered by industry it becomes the
 * opposite: a buyer picks Real Estate and sees 350 capabilities that are
 * all theirs, organised into the categories their team is already
 * structured around.
 *
 * Everything is computed client-side from one typed catalogue. No fetch,
 * no CMS, no second copy of the list to drift out of sync with the
 * provisioning wizard.
 */

const DOMAIN_ORDER: Feature["domain"][] = ["crm", "erp", "pack"];

export function FeatureExplorer() {
  const [industry, setIndustry] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const deferredQuery = useDeferredValue(query);

  const scoped = useMemo(() => featuresForIndustry(industry), [industry]);

  const matched = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return scoped;
    return scoped.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.blurb.toLowerCase().includes(q) ||
        f.group.toLowerCase().includes(q),
    );
  }, [scoped, deferredQuery]);

  const byDomain = useMemo(() => {
    const out: Record<string, Feature[]> = { crm: [], erp: [], pack: [] };
    for (const f of matched) out[f.domain].push(f);
    return out;
  }, [matched]);

  const searching = deferredQuery.trim().length > 0;
  const affinity = industry ? (PACK_AFFINITY[industry] ?? []) : [];

  function toggle(key: string) {
    setOpenGroups((g) => ({ ...g, [key]: !g[key] }));
  }

  return (
    <section aria-label="Capability explorer" className="seam">
      <Container className="py-20">
        {/* ————— industry selector ————— */}
        <div className="mb-10">
          <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">
            Step one · pick your industry
          </p>
          <h2 className="type-h2 mt-4 max-w-2xl">
            See exactly what your workspace includes.
          </h2>
          <p className="measure mt-4 text-muted">
            Every workspace carries the horizontal platform — {""}
            {FEATURES.filter((f) => f.pack === null).length} capabilities that
            are the same whatever you sell. Choosing an industry adds the pack
            built for it, and hides everything that would only be noise.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIndustry(null)}
            aria-pressed={industry === null}
            className={cn(
              "press rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              industry === null
                ? "border-accent bg-accent-soft text-accent-strong"
                : "border-border text-muted hover:border-border-strong hover:text-foreground",
            )}
          >
            Platform only
          </button>
          {PACKS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setIndustry(p)}
              aria-pressed={industry === p}
              className={cn(
                "press rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                industry === p
                  ? "border-accent bg-accent-soft text-accent-strong"
                  : "border-border text-muted hover:border-border-strong hover:text-foreground",
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {/* ————— summary + search ————— */}
        <div className="mt-8 flex flex-wrap items-end justify-between gap-6 border-t border-border pt-8">
          <div>
            <p className="text-display text-4xl font-semibold tabular-nums">
              {scoped.length}
            </p>
            <p className="mt-1 text-sm text-muted">
              capabilities in a{" "}
              <span className="font-medium text-foreground">
                {industry ?? "platform-only"}
              </span>{" "}
              workspace
              {affinity.length > 0 && (
                <>
                  {" "}
                  — including the{" "}
                  <span className="font-medium text-foreground">
                    {affinity.join(" and ")}
                  </span>{" "}
                  pack, which this industry almost always needs
                </>
              )}
            </p>
          </div>

          <label className="w-full max-w-xs">
            <span className="sr-only">Search capabilities</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 500 capabilities…"
              className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm placeholder:text-muted-subtle focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
            />
          </label>
        </div>

        {searching && (
          <p className="mt-4 text-sm text-muted">
            {matched.length === 0
              ? "Nothing matches that."
              : `${matched.length} match${matched.length === 1 ? "" : "es"} — categories expanded.`}
          </p>
        )}

        {/* ————— categories ————— */}
        <div className="mt-12 space-y-14">
          {DOMAIN_ORDER.map((domain) => {
            const list = byDomain[domain];
            if (list.length === 0) return null;
            return (
              <div key={domain}>
                <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
                  <h3 className="type-h3">{DOMAIN_LABEL[domain]}</h3>
                  <span className="font-mono text-xs text-muted tabular-nums">
                    {list.length}
                  </span>
                </div>

                <div className="divide-y divide-border">
                  {groupsFor(list).map((groupName) => {
                    const rows = list.filter((f) => f.group === groupName);
                    const key = `${domain}:${groupName}`;
                    const open = searching || openGroups[key];
                    return (
                      <div key={key}>
                        <h4>
                          <button
                            type="button"
                            onClick={() => toggle(key)}
                            aria-expanded={!!open}
                            className="group flex w-full items-center justify-between gap-4 py-4 text-left"
                          >
                            <span className="font-medium transition-colors group-hover:text-accent">
                              {groupName}
                            </span>
                            <span className="flex items-center gap-3">
                              <span className="font-mono text-xs text-muted tabular-nums">
                                {rows.length}
                              </span>
                              <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                                className={cn(
                                  "size-4 text-muted transition-transform duration-300",
                                  open && "rotate-180",
                                )}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              >
                                <path d="m6 9 6 6 6-6" />
                              </svg>
                            </span>
                          </button>
                        </h4>

                        {open && (
                          <ul className="grid gap-x-8 gap-y-5 pb-8 sm:grid-cols-2 lg:grid-cols-3">
                            {rows.map((f) => (
                              <li key={f.id} className="flex gap-3">
                                <span
                                  aria-hidden="true"
                                  className="mt-0.5 font-mono text-[10px] text-muted-subtle tabular-nums"
                                >
                                  {String(f.id).padStart(3, "0")}
                                </span>
                                <span>
                                  <span className="block text-sm font-medium">
                                    {f.title}
                                  </span>
                                  <span className="mt-1 block text-sm leading-relaxed text-muted">
                                    {f.blurb}
                                  </span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/*
          The honest footnote. This catalogue is the platform's scope, not a
          claim that every row is finished — saying so here costs nothing and
          is the difference between a confident roadmap and a false promise.
        */}
        <p className="measure mt-16 border-t border-border pt-8 text-sm text-muted">
          This is the platform&apos;s capability map. What is switched on for
          you is set at activation and listed on your own configuration sheet —
          modules ship in waves, and we would rather show you the whole shape
          of the system than pretend every row is finished today.
        </p>
      </Container>
    </section>
  );
}
