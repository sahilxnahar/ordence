"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { TenantRequest } from "./tenant/types";
import { isValidTenantSlug } from "./tenant/resolve";
import { industryByKey } from "./tenant/industries";
import { button, emailShell, sendEmail } from "./email";
import { siteConfig } from "@/config/site";

/**
 * Signup requests — the front half of the provisioning pipeline.
 *
 * A prospect fills in /get-started; the request lands in KV immediately
 * (durable before any email is attempted), the operator is notified, and
 * approval happens in the admin console. Nothing is provisioned until a
 * human approves — this is a sales-qualified pipeline, not open self-serve.
 */

const OPERATOR_EMAIL = "sahil@ordence.com";

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

/** company name → candidate subdomain label. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function listRequests(limit = 100): Promise<TenantRequest[]> {
  const kv = await getKv();
  if (!kv) return [];
  try {
    const index = JSON.parse(
      (await kv.get("requests:index")) ?? "[]",
    ) as string[];
    const rows = await Promise.all(
      index.slice(0, limit).map(async (id) => {
        const raw = await kv.get(`request:${id}`);
        return raw ? (JSON.parse(raw) as TenantRequest) : null;
      }),
    );
    return rows.filter((r): r is TenantRequest => r !== null);
  } catch {
    return [];
  }
}

export async function getRequest(id: string): Promise<TenantRequest | null> {
  const kv = await getKv();
  if (!kv) return null;
  const raw = await kv.get(`request:${id}`);
  return raw ? (JSON.parse(raw) as TenantRequest) : null;
}

export async function saveRequest(request: TenantRequest): Promise<void> {
  const kv = await getKv();
  if (!kv) return;
  await kv.put(`request:${request.id}`, JSON.stringify(request));
  const index = JSON.parse((await kv.get("requests:index")) ?? "[]") as string[];
  if (!index.includes(request.id)) {
    index.unshift(request.id);
    await kv.put("requests:index", JSON.stringify(index.slice(0, 500)));
  }
}

/** Public action behind the /get-started form. */
export async function submitRequest(formData: FormData): Promise<void> {
  const company = String(formData.get("company") ?? "").trim().slice(0, 120);
  const email = String(formData.get("email") ?? "").trim().slice(0, 160);
  const contactName = String(formData.get("contactName") ?? "").trim().slice(0, 120);

  if (!company || !email || !contactName) {
    redirect("/get-started?error=missing");
  }

  let suggestedSlug = slugify(company);
  if (!isValidTenantSlug(suggestedSlug)) suggestedSlug = "";

  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const request: TenantRequest = {
    id,
    company,
    suggestedSlug,
    contactName,
    email,
    phone: String(formData.get("phone") ?? "").trim().slice(0, 40) || undefined,
    industry: String(formData.get("industry") ?? "").trim() || undefined,
    teamSize: String(formData.get("teamSize") ?? "").trim() || undefined,
    notes: String(formData.get("notes") ?? "").trim().slice(0, 2000) || undefined,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  // Durable first, notify second — a mail failure must never lose a lead.
  await saveRequest(request);

  const industryLabel = request.industry
    ? (industryByKey(request.industry)?.label ?? request.industry)
    : "Not specified";
  const reviewUrl = `https://admin.${siteConfig.rootDomain}/requests?open=${id}`;

  await sendEmail({
    to: OPERATOR_EMAIL,
    replyTo: email,
    subject: `New ERP request — ${company}`,
    html: emailShell(`
      <h1 style="margin:0 0 8px;font-size:22px;letter-spacing:-.02em">${company}</h1>
      <p style="margin:0 0 24px;color:#556075;font-size:14px">wants access to the Ordence platform.</p>
      <table role="presentation" style="width:100%;font-size:14px;color:#111827;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#556075;width:120px">Contact</td><td>${request.contactName}</td></tr>
        <tr><td style="padding:6px 0;color:#556075">Email</td><td>${email}</td></tr>
        ${request.phone ? `<tr><td style="padding:6px 0;color:#556075">Phone</td><td>${request.phone}</td></tr>` : ""}
        <tr><td style="padding:6px 0;color:#556075">Industry</td><td>${industryLabel}</td></tr>
        ${request.teamSize ? `<tr><td style="padding:6px 0;color:#556075">Team size</td><td>${request.teamSize}</td></tr>` : ""}
        <tr><td style="padding:6px 0;color:#556075">Subdomain</td><td>${suggestedSlug || "—"}.${siteConfig.rootDomain}</td></tr>
      </table>
      ${request.notes ? `<p style="margin:20px 0 0;padding:14px;background:#faf9f6;border-radius:10px;font-size:14px;color:#556075">${request.notes}</p>` : ""}
      <p style="margin:28px 0 0">${button(reviewUrl, "Review & activate →")}</p>
    `),
  });

  redirect("/get-started?sent=1");
}

/** Marks a request activated once its tenant has been provisioned. */
export async function markRequestActivated(
  id: string,
  slug: string,
): Promise<void> {
  const existing = await getRequest(id);
  if (!existing) return;
  await saveRequest({
    ...existing,
    status: "activated",
    activatedAt: new Date().toISOString(),
    activatedSlug: slug,
  });
  revalidatePath("/requests");
}

export async function declineRequest(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const existing = await getRequest(id);
  if (existing) {
    await saveRequest({ ...existing, status: "declined" });
  }
  revalidatePath("/requests");
  redirect("/requests?declined=1");
}
