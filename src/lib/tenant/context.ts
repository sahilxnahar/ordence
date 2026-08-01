import { headers } from "next/headers";
import { cache } from "react";
import type { Surface, Tenant } from "./types";
import { getTenantBySlug } from "./store";

/**
 * Server-side accessors for the routing decision made in `proxy.ts`.
 * The proxy stamps request headers; layouts and pages read them here.
 * `cache()` dedupes the lookup across a single request's render tree.
 */

export const HEADER_SURFACE = "x-ordence-surface";
export const HEADER_TENANT = "x-ordence-tenant";
export const HEADER_HOST = "x-ordence-host";

export async function getSurface(): Promise<Surface> {
  const h = await headers();
  return (h.get(HEADER_SURFACE) as Surface | null) ?? "marketing";
}

export const getCurrentTenant = cache(async (): Promise<Tenant | null> => {
  const h = await headers();
  const slug = h.get(HEADER_TENANT);
  if (!slug) return null;
  return getTenantBySlug(slug);
});
