import type { HostDecision } from "./types";

/**
 * Pure hostname classification — no I/O, fully unit-testable.
 *
 * Handles every deployment context:
 *   ordence.com / www.ordence.com          → marketing
 *   admin.ordence.com                      → admin
 *   app.ordence.com                        → app
 *   ameyaa.ordence.com                     → tenant (slug = "ameyaa")
 *   customclientdomain.com                 → custom-domain lookup
 *   localhost / ameyaa.localhost           → local dev parity
 *   *.workers.dev / *.pages.dev            → Cloudflare preview deployments
 */

/** Subdomains that can never be claimed by a tenant. */
const RESERVED_SUBDOMAINS = new Set([
  "www",
  "admin",
  "app",
  "api",
  "cdn",
  "assets",
  "mail",
  "status",
  "docs",
]);

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);

/** Lowercase and strip the port: "Ameyaa.Ordence.com:443" → "ameyaa.ordence.com" */
export function normalizeHost(rawHost: string): string {
  const host = rawHost.trim().toLowerCase();
  // IPv6 hosts look like "[::1]:3000" — split on the last ":" only if it
  // is a port separator.
  const portIdx = host.lastIndexOf(":");
  if (portIdx > -1 && !host.endsWith("]") && host.indexOf("]") < portIdx) {
    return host.slice(0, portIdx);
  }
  return host.includes("]") ? host : host.split(":")[0];
}

export function classifyHost(rawHost: string, rootDomain: string): HostDecision {
  const host = normalizeHost(rawHost);
  const root = rootDomain.toLowerCase();

  /* ——— Local development: mirror production shapes on localhost ——— */
  if (LOCAL_HOSTS.has(host)) return { surface: "marketing" };
  if (host.endsWith(".localhost")) {
    const label = host.slice(0, -".localhost".length);
    if (label === "admin") return { surface: "admin" };
    if (label === "app") return { surface: "app" };
    if (!RESERVED_SUBDOMAINS.has(label)) {
      return { surface: "tenant", tenantSlug: label };
    }
    return { surface: "marketing" };
  }

  /* ——— Cloudflare preview deployments ——— */
  if (host.endsWith(".workers.dev") || host.endsWith(".pages.dev")) {
    return { surface: "preview" };
  }

  /* ——— Production root domain and its subdomains ——— */
  if (host === root || host === `www.${root}`) return { surface: "marketing" };

  if (host.endsWith(`.${root}`)) {
    const label = host.slice(0, -(root.length + 1));
    // Nested labels ("a.b.ordence.com") are not valid tenant hosts.
    if (label.includes(".")) return { surface: "marketing" };
    if (label === "admin") return { surface: "admin" };
    if (label === "app") return { surface: "app" };
    if (RESERVED_SUBDOMAINS.has(label)) return { surface: "marketing" };
    return { surface: "tenant", tenantSlug: label };
  }

  /* ——— Anything else is a (potential) tenant custom domain ——— */
  return { surface: "tenant", customDomain: host };
}

/** Validate tenant slugs before they ever reach a lookup or a URL. */
export function isValidTenantSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug);
}
