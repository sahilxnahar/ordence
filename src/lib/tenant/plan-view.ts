import type { Tenant } from "./types";

/**
 * Read-time views of the commercial plan.
 *
 * These are async on purpose. Reading the clock is an impure call, and
 * React's compiler rules (correctly) forbid impure calls during render —
 * so anything time-dependent is computed in an awaited helper rather than
 * inline in a component body.
 */

export type PlanUrgency = "none" | "healthy" | "soon" | "critical" | "expired";

export interface PlanSummary {
  slug: string;
  hasPlan: boolean;
  seats?: number;
  months?: number;
  expiresAt?: string;
  daysRemaining?: number;
  urgency: PlanUrgency;
}

/** Renewal conversations should start well before the lights go out. */
export const RENEWAL_WARNING_DAYS = 30;
export const RENEWAL_CRITICAL_DAYS = 7;

function urgencyFor(daysRemaining: number): PlanUrgency {
  if (daysRemaining < 0) return "expired";
  if (daysRemaining <= RENEWAL_CRITICAL_DAYS) return "critical";
  if (daysRemaining <= RENEWAL_WARNING_DAYS) return "soon";
  return "healthy";
}

/** Whole days from `now` until the plan lapses; negative once expired. */
export function daysRemaining(expiresAt: string, now: number): number {
  return Math.floor((Date.parse(expiresAt) - now) / 86_400_000);
}

export async function summarizePlans(
  tenants: Tenant[],
): Promise<Map<string, PlanSummary>> {
  const now = Date.now();
  // Annotated explicitly: without it TypeScript infers the first branch's
  // narrow shape and rejects the second.
  const entries: [string, PlanSummary][] = tenants.map((t) => {
    if (!t.plan) {
      return [t.slug, { slug: t.slug, hasPlan: false, urgency: "none" }];
    }
    const remaining = daysRemaining(t.plan.expiresAt, now);
    return [
      t.slug,
      {
        slug: t.slug,
        hasPlan: true,
        seats: t.plan.seats,
        months: t.plan.months,
        expiresAt: t.plan.expiresAt,
        daysRemaining: remaining,
        urgency: urgencyFor(remaining),
      },
    ];
  });
  return new Map(entries);
}

/** Tenants worth a renewal conversation, most urgent first. */
export async function expiringSoon(
  tenants: Tenant[],
  withinDays = RENEWAL_WARNING_DAYS,
): Promise<{ tenant: Tenant; daysRemaining: number }[]> {
  const now = Date.now();
  return tenants
    .filter((t) => t.plan)
    .map((t) => ({ tenant: t, daysRemaining: daysRemaining(t.plan!.expiresAt, now) }))
    .filter((r) => r.daysRemaining <= withinDays)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
