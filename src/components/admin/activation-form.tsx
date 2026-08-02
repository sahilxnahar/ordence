"use client";

import { useState } from "react";
import {
  INDUSTRY_PACKS,
  MODULE_CATALOG,
  industryByKey,
  type ProductKey,
} from "@/lib/tenant/industries";
import type { TenantRequest } from "@/lib/tenant/types";
import { activateRequest } from "@/lib/tenant/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * The approval step, as one screen.
 *
 * Choosing an industry replaces the module selection with that pack's
 * preset — the operator starts from a sensible configuration for the
 * vertical rather than an empty checklist, then adjusts. Selection state
 * is client-side so the prefill is instant; submission is a server action.
 */

const PRODUCT_LABELS: Record<ProductKey, string> = {
  crm: "CRM",
  erp: "ERP",
  ai: "AI",
  web: "Web",
};

const inputClass =
  "h-10 w-full rounded-xl border border-border bg-surface px-3.5 text-sm placeholder:text-muted-subtle focus-visible:outline-2 focus-visible:outline-ring";

export function ActivationForm({ request }: { request: TenantRequest }) {
  const initialIndustry = request.industry ?? INDUSTRY_PACKS[0].key;
  const [industry, setIndustry] = useState(initialIndustry);
  const [modules, setModules] = useState<string[]>(
    industryByKey(initialIndustry)?.modules ?? [],
  );
  const [months, setMonths] = useState(12);
  const [seats, setSeats] = useState(10);

  const pack = industryByKey(industry);

  function selectIndustry(key: string) {
    setIndustry(key);
    // Reset to the pack preset — the operator is choosing a starting point.
    setModules(industryByKey(key)?.modules ?? []);
  }

  function toggleModule(key: string) {
    setModules((m) =>
      m.includes(key) ? m.filter((x) => x !== key) : [...m, key],
    );
  }

  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + months);

  return (
    <form action={activateRequest} className="space-y-7">
      <input type="hidden" name="requestId" value={request.id} />
      <input type="hidden" name="industry" value={industry} />
      {modules.map((m) => (
        <input key={m} type="hidden" name="modules" value={m} />
      ))}

      {/* identity */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={`name-${request.id}`} className="text-sm font-medium">
            Workspace name
          </label>
          <input
            id={`name-${request.id}`}
            name="name"
            defaultValue={request.company}
            required
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`slug-${request.id}`} className="text-sm font-medium">
            Subdomain
          </label>
          <div className="flex items-center gap-2">
            <input
              id={`slug-${request.id}`}
              name="slug"
              defaultValue={request.suggestedSlug}
              required
              pattern="[a-z0-9][a-z0-9-]*"
              className={inputClass}
            />
            <span className="font-mono text-xs whitespace-nowrap text-muted-subtle">
              .ordence.com
            </span>
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`domain-${request.id}`} className="text-sm font-medium">
            Custom domain{" "}
            <span className="text-muted-subtle">(optional)</span>
          </label>
          <input
            id={`domain-${request.id}`}
            name="domain"
            placeholder="acme.com"
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`accent-${request.id}`} className="text-sm font-medium">
            Brand accent
          </label>
          <input
            id={`accent-${request.id}`}
            name="accent"
            type="color"
            defaultValue="#6d45e8"
            className="h-10 w-full cursor-pointer rounded-xl border border-border bg-surface px-1.5"
          />
        </div>
      </div>

      {/* industry */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Industry</legend>
        <p className="text-xs text-muted">
          Sets the starting module configuration. You can adjust anything
          below afterwards.
        </p>
        <div className="flex flex-wrap gap-2">
          {INDUSTRY_PACKS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => selectIndustry(p.key)}
              aria-pressed={industry === p.key}
              className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                industry === p.key
                  ? "border-accent bg-accent-soft text-accent-strong"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {pack && <p className="text-xs text-muted-subtle">{pack.blurb}</p>}
      </fieldset>

      {/* modules */}
      <fieldset className="space-y-4">
        <legend className="flex items-center gap-3 text-sm font-medium">
          Modules
          <Badge tone="accent">{modules.length} enabled</Badge>
        </legend>
        {(Object.keys(PRODUCT_LABELS) as ProductKey[]).map((product) => (
          <div key={product} className="space-y-2">
            <p className="corner-caption">{PRODUCT_LABELS[product]}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {MODULE_CATALOG.filter((m) => m.product === product).map((m) => {
                const on = modules.includes(m.key);
                return (
                  <label
                    key={m.key}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                      on
                        ? "border-accent/40 bg-accent-soft/50"
                        : "border-border hover:bg-foreground/[0.02]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleModule(m.key)}
                      className="mt-0.5 size-4 shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {m.label}
                      </span>
                      <span className="block text-xs text-muted">
                        {m.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </fieldset>

      {/* plan */}
      <fieldset className="grid gap-4 rounded-panel border border-border bg-background p-5 md:grid-cols-3">
        <legend className="px-2 text-sm font-medium">Plan</legend>
        <div className="space-y-1.5">
          <label htmlFor={`seats-${request.id}`} className="text-sm font-medium">
            Users
          </label>
          <input
            id={`seats-${request.id}`}
            name="seats"
            type="number"
            min={1}
            max={10000}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`months-${request.id}`} className="text-sm font-medium">
            Duration (months)
          </label>
          <input
            id={`months-${request.id}`}
            name="months"
            type="number"
            min={1}
            max={120}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <span className="text-sm font-medium">Active until</span>
          <p className="flex h-10 items-center text-sm text-muted">
            {expiry.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <p className="text-xs text-muted-subtle md:col-span-3">
          The workspace suspends itself automatically on this date — no
          scheduled job required.
        </p>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="accent">
          Activate workspace <span aria-hidden="true">→</span>
        </Button>
        <span className="corner-caption">
          Subdomain goes live immediately · customer is emailed
        </span>
      </div>
    </form>
  );
}
