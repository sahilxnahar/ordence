/**
 * Tenant domain model.
 * A "tenant" is any organization served from a subdomain of ordence.com
 * (ameyaa.ordence.com) or from a fully custom domain (customclientdomain.com).
 */

export interface TenantBranding {
  /** Accent color injected as `--brand` — repaints every accent-driven UI. */
  accent: string;
  /** Foreground color that passes contrast on top of `accent`. */
  accentContrast: string;
  /** Optional tenant logo (served from tenant asset storage / CDN). */
  logoUrl?: string;
  /** Control shape personality. Ordence default is "pill". */
  radius?: "pill" | "soft" | "sharp";
}

export interface TenantFeatures {
  crm: boolean;
  erp: boolean;
  ai: boolean;
  web: boolean;
}

/**
 * The commercial plan attached to a tenant.
 *
 * `expiresAt` is authoritative: a tenant whose plan has lapsed is treated
 * as suspended on read, so a subscription can never silently run forever
 * just because no scheduled job happened to fire.
 */
export interface TenantPlan {
  /** Industry pack chosen at activation (see industries.ts). */
  industry: string;
  /** Granular module keys switched on for this tenant. */
  modules: string[];
  /** Licensed user seats. */
  seats: number;
  /** Subscription length in months, as sold. */
  months: number;
  startedAt: string; // ISO
  expiresAt: string; // ISO
}

export interface Tenant {
  /** URL-safe unique identifier; doubles as the subdomain label. */
  slug: string;
  name: string;
  /** Custom apex/sub domains verified for this tenant. */
  domains: string[];
  branding: TenantBranding;
  features: TenantFeatures;
  status: "active" | "suspended";
  /** Absent on legacy/seed tenants provisioned before plans existed. */
  plan?: TenantPlan;
  /** Primary contact, captured at signup. */
  contact?: { name: string; email: string };
}

/** The surface a hostname resolves to. Set by proxy, read by layouts. */
export type Surface =
  | "marketing" // ordence.com, www.ordence.com
  | "admin" // admin.ordence.com — internal operations console
  | "app" // app.ordence.com — signed-in product shell
  | "tenant" // {tenant}.ordence.com or a custom domain
  | "preview"; // *.workers.dev / local previews

export interface HostDecision {
  surface: Surface;
  /** Present when surface === "tenant" and resolved via subdomain. */
  tenantSlug?: string;
  /** Present when the tenant must be resolved via custom-domain lookup. */
  customDomain?: string;
}

/** A signup request awaiting operator approval. */
export interface TenantRequest {
  id: string;
  company: string;
  /** Suggested subdomain, derived from the company name at signup. */
  suggestedSlug: string;
  contactName: string;
  email: string;
  phone?: string;
  industry?: string;
  teamSize?: string;
  notes?: string;
  status: "pending" | "activated" | "declined";
  createdAt: string;
  /** Set once approved, so the queue keeps an audit trail. */
  activatedAt?: string;
  activatedSlug?: string;
}
