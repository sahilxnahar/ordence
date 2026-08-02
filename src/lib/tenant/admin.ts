"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Tenant } from "./types";
import { isValidTenantSlug } from "./resolve";

/**
 * Admin provisioning — writes tenants straight into TENANT_KV using the
 * exact keys the edge middleware reads (`tenant:slug:*`, `tenant:domain:*`),
 * so a created tenant's subdomain is LIVE within the cache TTL. An index
 * key lets the admin panel list KV-provisioned tenants (KV has no cheap
 * list-by-prefix on hot paths).
 *
 * NOTE: admin.ordence.com must be protected by real authentication before
 * production traffic — see BLUEPRINT.md §Authentication. Until auth lands,
 * these actions are safe to demo but the admin host should stay unshared.
 */

interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

async function getKv(): Promise<KVLike | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    return ((env as Record<string, unknown>)["TENANT_KV"] as KVLike) ?? null;
  } catch {
    return null;
  }
}

export async function listKvTenants(): Promise<Tenant[]> {
  const kv = await getKv();
  if (!kv) return [];
  try {
    const index = JSON.parse((await kv.get("tenants:index")) ?? "[]") as string[];
    const tenants = await Promise.all(
      index.map(async (slug) => {
        const raw = await kv.get(`tenant:slug:${slug}`);
        return raw && raw !== "null" ? (JSON.parse(raw) as Tenant) : null;
      }),
    );
    return tenants.filter((t): t is Tenant => t !== null);
  } catch {
    return [];
  }
}

export async function createTenant(formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") ?? "").toLowerCase().trim();
  const name = String(formData.get("name") ?? "").trim();
  const accent = String(formData.get("accent") ?? "#6d45e8");
  const domain = String(formData.get("domain") ?? "").toLowerCase().trim();

  if (!isValidTenantSlug(slug) || !name) {
    redirect("/tenants?error=invalid");
  }

  const tenant: Tenant = {
    slug,
    name,
    domains: domain ? [domain] : [],
    branding: { accent, accentContrast: "#ffffff", radius: "pill" },
    features: {
      crm: formData.get("crm") === "on",
      erp: formData.get("erp") === "on",
      ai: formData.get("ai") === "on",
      web: formData.get("web") === "on",
    },
    status: "active",
  };

  const kv = await getKv();
  if (kv) {
    await kv.put(`tenant:slug:${slug}`, JSON.stringify(tenant));
    if (domain) {
      await kv.put(`tenant:domain:${domain}`, JSON.stringify(tenant));
    }
    const index = JSON.parse((await kv.get("tenants:index")) ?? "[]") as string[];
    if (!index.includes(slug)) index.unshift(slug);
    await kv.put("tenants:index", JSON.stringify(index));
  } else {
    console.log("[ordence] createTenant (no KV binding):", tenant);
  }

  revalidatePath("/tenants");
  redirect(`/tenants?created=${slug}`);
}
