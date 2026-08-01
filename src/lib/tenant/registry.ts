import type { Tenant } from "./types";

/**
 * Seed tenant registry.
 *
 * In production this data lives in your system of record (D1 / Postgres /
 * your control-plane API) and is *cached* in Workers KV by `store.ts`.
 * Keeping a static seed here gives you:
 *   1. Instant local development with zero infrastructure.
 *   2. A guaranteed fallback if KV and the origin store are unreachable.
 *   3. Executable documentation of the tenant shape.
 */
export const SEED_TENANTS: readonly Tenant[] = [
  {
    slug: "ameyaa",
    name: "Ameyaa",
    domains: [],
    branding: { accent: "#6d45e8", accentContrast: "#ffffff", radius: "pill" },
    features: { crm: true, erp: false, ai: true, web: true },
    status: "active",
  },
  {
    slug: "clientx",
    name: "Client X",
    domains: ["customclientdomain.com", "www.customclientdomain.com"],
    branding: { accent: "#ff5c5c", accentContrast: "#ffffff", radius: "soft" },
    features: { crm: true, erp: true, ai: false, web: true },
    status: "active",
  },
] as const;

export function seedTenantBySlug(slug: string): Tenant | null {
  return SEED_TENANTS.find((t) => t.slug === slug) ?? null;
}

export function seedTenantByDomain(domain: string): Tenant | null {
  return SEED_TENANTS.find((t) => t.domains.includes(domain)) ?? null;
}
