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

export interface Tenant {
  /** URL-safe unique identifier; doubles as the subdomain label. */
  slug: string;
  name: string;
  /** Custom apex/sub domains verified for this tenant. */
  domains: string[];
  branding: TenantBranding;
  features: TenantFeatures;
  status: "active" | "suspended";
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
