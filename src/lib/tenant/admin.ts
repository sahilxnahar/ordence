"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Tenant } from "./types";
import { isValidTenantSlug } from "./resolve";
import { SEED_TENANTS, seedTenantBySlug } from "./registry";

/**
 * Admin provisioning + fleet management.
 *
 * Everything writes to the SAME keys the edge middleware reads
 * (`tenant:slug:*`, `tenant:domain:*`), so changes go live within the
 * cache TTL with no deploy. Because `store.ts` checks KV before the seed
 * registry, writing a seed slug into KV acts as an override — which is
 * how seed tenants become editable without a code change.
 *
 * SECURITY: admin.ordence.com must sit behind real authentication before
 * this is exposed publicly — see BLUEPRINT.md §Authentication. These
 * actions are intentionally unguarded only while the host is private.
 */

interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete?(key: string): Promise<void>;
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

/** Persist a tenant to every key the router might resolve it by. */
async function writeTenant(kv: KVLike, tenant: Tenant): Promise<void> {
  await kv.put(`tenant:slug:${tenant.slug}`, JSON.stringify(tenant));
  for (const domain of tenant.domains) {
    await kv.put(`tenant:domain:${domain}`, JSON.stringify(tenant));
  }
  const index = JSON.parse((await kv.get("tenants:index")) ?? "[]") as string[];
  if (!index.includes(tenant.slug)) {
    index.unshift(tenant.slug);
    await kv.put("tenants:index", JSON.stringify(index));
  }
}

/** Read one tenant, preferring the KV override over the seed registry. */
export async function getManagedTenant(slug: string): Promise<Tenant | null> {
  const kv = await getKv();
  if (kv) {
    const raw = await kv.get(`tenant:slug:${slug}`);
    if (raw && raw !== "null") return JSON.parse(raw) as Tenant;
  }
  return seedTenantBySlug(slug);
}

/** The full fleet: KV-provisioned tenants merged over seed defaults. */
export async function listManagedTenants(): Promise<
  { tenant: Tenant; source: "kv" | "seed" }[]
> {
  const kv = await getKv();
  const bySlug = new Map<string, { tenant: Tenant; source: "kv" | "seed" }>();

  for (const seed of SEED_TENANTS) {
    bySlug.set(seed.slug, { tenant: seed, source: "seed" });
  }

  if (kv) {
    try {
      const index = JSON.parse(
        (await kv.get("tenants:index")) ?? "[]",
      ) as string[];
      for (const slug of index) {
        const raw = await kv.get(`tenant:slug:${slug}`);
        if (raw && raw !== "null") {
          bySlug.set(slug, { tenant: JSON.parse(raw) as Tenant, source: "kv" });
        }
      }
    } catch {
      /* fleet view degrades to seeds rather than erroring the page */
    }
  }

  return [...bySlug.values()];
}

function tenantFromForm(formData: FormData, existing?: Tenant | null): Tenant {
  const slug = String(formData.get("slug") ?? "")
    .toLowerCase()
    .trim();
  const domain = String(formData.get("domain") ?? "")
    .toLowerCase()
    .trim();
  return {
    slug,
    name: String(formData.get("name") ?? "").trim(),
    domains: domain
      ? [domain, ...(existing?.domains ?? []).filter((d) => d !== domain)]
      : (existing?.domains ?? []),
    branding: {
      accent: String(formData.get("accent") ?? "#6d45e8"),
      accentContrast: "#ffffff",
      radius: existing?.branding.radius ?? "pill",
    },
    features: {
      crm: formData.get("crm") === "on",
      erp: formData.get("erp") === "on",
      ai: formData.get("ai") === "on",
      web: formData.get("web") === "on",
    },
    status: existing?.status ?? "active",
  };
}

export async function createTenant(formData: FormData): Promise<void> {
  const tenant = tenantFromForm(formData);
  if (!isValidTenantSlug(tenant.slug) || !tenant.name) {
    redirect("/tenants?error=invalid");
  }

  const kv = await getKv();
  if (kv) {
    // Refuse to silently clobber an existing tenant.
    const existing = await kv.get(`tenant:slug:${tenant.slug}`);
    if ((existing && existing !== "null") || seedTenantBySlug(tenant.slug)) {
      redirect("/tenants?error=exists");
    }
    await writeTenant(kv, tenant);
  } else {
    console.log("[ordence] createTenant (no KV binding):", tenant);
  }

  revalidatePath("/tenants");
  redirect(`/tenants?created=${tenant.slug}`);
}

export async function updateTenant(formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") ?? "")
    .toLowerCase()
    .trim();
  if (!isValidTenantSlug(slug)) redirect("/tenants?error=invalid");

  const existing = await getManagedTenant(slug);
  const tenant = tenantFromForm(formData, existing);
  if (!tenant.name) redirect("/tenants?error=invalid");

  const kv = await getKv();
  if (kv) await writeTenant(kv, tenant);
  else console.log("[ordence] updateTenant (no KV binding):", tenant);

  revalidatePath("/tenants");
  redirect(`/tenants?updated=${slug}`);
}

/**
 * Suspend/resume. Suspended tenants fail the middleware's active check,
 * so their hostname immediately serves the domain-not-found page.
 */
export async function toggleTenantStatus(formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") ?? "")
    .toLowerCase()
    .trim();
  const existing = await getManagedTenant(slug);
  if (!existing) redirect("/tenants?error=missing");

  const updated: Tenant = {
    ...existing,
    status: existing.status === "active" ? "suspended" : "active",
  };

  const kv = await getKv();
  if (kv) await writeTenant(kv, updated);
  else console.log("[ordence] toggleTenantStatus (no KV binding):", updated);

  revalidatePath("/tenants");
  redirect(`/tenants?updated=${slug}`);
}
