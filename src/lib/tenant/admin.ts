"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Tenant, TenantPlan } from "./types";
import { isValidTenantSlug } from "./resolve";
import { SEED_TENANTS, seedTenantBySlug } from "./registry";
import { industryByKey, productsFromModules } from "./industries";
import { getRequest, markRequestActivated } from "@/lib/requests";
import { button, emailShell, sendEmail } from "@/lib/email";
import { siteConfig } from "@/config/site";

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

/** Months → an exact expiry instant, anchored to the activation moment. */
function addMonths(from: Date, months: number): Date {
  const out = new Date(from);
  out.setMonth(out.getMonth() + months);
  return out;
}

/**
 * The activation step: turns an approved signup request into a live
 * tenant. This is the single moment a subdomain starts serving — there
 * is no DNS call, because `*.ordence.com` already resolves to this
 * Worker; provisioning is purely a write to the tenant store.
 */
export async function activateRequest(formData: FormData): Promise<void> {
  const requestId = String(formData.get("requestId") ?? "");
  const slug = String(formData.get("slug") ?? "").toLowerCase().trim();
  const name = String(formData.get("name") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();
  const seats = Number(formData.get("seats") ?? 5);
  const months = Number(formData.get("months") ?? 12);
  const accent = String(formData.get("accent") ?? "#6d45e8");
  const domain = String(formData.get("domain") ?? "").toLowerCase().trim();
  const modules = formData.getAll("modules").map(String);

  if (!isValidTenantSlug(slug) || !name || !industryByKey(industry)) {
    redirect(`/requests?error=invalid&open=${requestId}`);
  }
  if (!Number.isFinite(seats) || seats < 1 || !Number.isFinite(months) || months < 1) {
    redirect(`/requests?error=plan&open=${requestId}`);
  }

  const kv = await getKv();

  // Never overwrite an existing workspace by accident.
  if (kv) {
    const clash = await kv.get(`tenant:slug:${slug}`);
    if ((clash && clash !== "null") || seedTenantBySlug(slug)) {
      redirect(`/requests?error=exists&open=${requestId}`);
    }
  }

  const request = await getRequest(requestId);
  const startedAt = new Date();
  const plan: TenantPlan = {
    industry,
    modules,
    seats,
    months,
    startedAt: startedAt.toISOString(),
    expiresAt: addMonths(startedAt, months).toISOString(),
  };

  const tenant: Tenant = {
    slug,
    name,
    domains: domain ? [domain] : [],
    branding: { accent, accentContrast: "#ffffff", radius: "pill" },
    // Product flags are derived so a badge can never contradict the modules.
    features: productsFromModules(modules),
    status: "active",
    plan,
    contact: request
      ? { name: request.contactName, email: request.email }
      : undefined,
  };

  if (kv) await writeTenant(kv, tenant);
  else console.log("[ordence] activateRequest (no KV binding):", tenant);

  if (requestId) await markRequestActivated(requestId, slug);

  // Tell the customer they're live.
  if (request?.email) {
    const workspaceUrl = `https://${slug}.${siteConfig.rootDomain}`;
    await sendEmail({
      to: request.email,
      subject: `Your Ordence workspace is live — ${name}`,
      html: emailShell(`
        <h1 style="margin:0 0 8px;font-size:22px;letter-spacing:-.02em">You're live, ${request.contactName.split(" ")[0]}.</h1>
        <p style="margin:0 0 24px;color:#556075;font-size:14px">${name}'s workspace is ready on its own branded address.</p>
        <table role="presentation" style="width:100%;font-size:14px;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#556075;width:130px">Workspace</td><td>${slug}.${siteConfig.rootDomain}</td></tr>
          <tr><td style="padding:6px 0;color:#556075">Plan</td><td>${industryByKey(industry)?.label ?? industry}</td></tr>
          <tr><td style="padding:6px 0;color:#556075">Users</td><td>${seats}</td></tr>
          <tr><td style="padding:6px 0;color:#556075">Active until</td><td>${addMonths(startedAt, months).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td></tr>
        </table>
        <p style="margin:28px 0 0">${button(workspaceUrl, "Open your workspace →")}</p>
        <p style="margin:24px 0 0;font-size:13px;color:#8a92a6">Reply to this email any time — a human reads it.</p>
      `),
    });
  }

  revalidatePath("/requests");
  revalidatePath("/tenants");
  redirect(`/tenants?created=${slug}`);
}

/**
 * Extend a plan by N months.
 *
 * Extends from whichever is later — the current expiry or today — so
 * renewing early never loses the customer the days they already paid for,
 * and renewing late doesn't back-date the new term into the past.
 */
export async function renewTenant(formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") ?? "").toLowerCase().trim();
  const months = Number(formData.get("renewMonths") ?? 12);
  const existing = await getManagedTenant(slug);

  if (!existing?.plan) redirect("/tenants?error=noplan");
  if (!Number.isFinite(months) || months < 1) redirect("/tenants?error=plan");

  const now = new Date();
  const currentExpiry = new Date(existing.plan.expiresAt);
  const base = currentExpiry > now ? currentExpiry : now;

  const renewed: Tenant = {
    ...existing,
    // A renewal also lifts an expiry-driven suspension.
    status: "active",
    plan: {
      ...existing.plan,
      months,
      expiresAt: addMonths(base, months).toISOString(),
    },
  };

  const kv = await getKv();
  if (kv) await writeTenant(kv, renewed);
  else console.log("[ordence] renewTenant (no KV binding):", renewed);

  revalidatePath("/tenants");
  revalidatePath("/health");
  redirect(`/tenants?renewed=${slug}`);
}

/** Nudge a customer whose term is running out. */
export async function sendRenewalReminder(formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") ?? "").toLowerCase().trim();
  const tenant = await getManagedTenant(slug);

  if (!tenant?.plan || !tenant.contact?.email) {
    redirect("/tenants?error=nocontact");
  }

  const expiry = new Date(tenant.plan.expiresAt);
  const days = Math.max(
    0,
    Math.floor((expiry.getTime() - Date.now()) / 86_400_000),
  );

  await sendEmail({
    to: tenant.contact.email,
    subject: `${tenant.name} — your Ordence plan renews in ${days} days`,
    html: emailShell(`
      <h1 style="margin:0 0 8px;font-size:22px;letter-spacing:-.02em">Time to renew, ${tenant.contact.name.split(" ")[0]}.</h1>
      <p style="margin:0 0 24px;color:#556075;font-size:14px">${tenant.name}'s workspace is active until <strong>${expiry.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong> — that's ${days} day${days === 1 ? "" : "s"} away.</p>
      <table role="presentation" style="width:100%;font-size:14px;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#556075;width:130px">Workspace</td><td>${tenant.slug}.${siteConfig.rootDomain}</td></tr>
        <tr><td style="padding:6px 0;color:#556075">Users</td><td>${tenant.plan.seats}</td></tr>
      </table>
      <p style="margin:24px 0 0;color:#556075;font-size:14px">Reply to this email to renew or change your plan — we'll take care of it before anything lapses.</p>
      <p style="margin:24px 0 0">${button(`https://${siteConfig.rootDomain}/contact`, "Talk to us →")}</p>
    `),
  });

  revalidatePath("/tenants");
  redirect(`/tenants?reminded=${slug}`);
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
