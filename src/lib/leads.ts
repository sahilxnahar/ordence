"use server";

import { redirect } from "next/navigation";

/**
 * Lead capture → Workers KV (free tier: 1k writes/day — far beyond any
 * early-stage lead volume). Keys: `lead:<timestamp>:<random>`; an index
 * key keeps the latest 200 ids for the admin panel.
 * Falls back to a server log in local dev without bindings.
 */

interface KVLike {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    opts?: { expirationTtl?: number },
  ): Promise<void>;
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

export interface Lead {
  name: string;
  email: string;
  company: string;
  interest: string;
  message: string;
  at: string;
}

/** Newest-first captured leads, for the admin inbox. */
export async function listLeads(limit = 50): Promise<Lead[]> {
  const kv = await getKv();
  if (!kv) return [];
  try {
    const index = JSON.parse((await kv.get("leads:index")) ?? "[]") as string[];
    const leads = await Promise.all(
      index.slice(0, limit).map(async (id) => {
        const raw = await kv.get(id);
        return raw ? (JSON.parse(raw) as Lead) : null;
      }),
    );
    return leads.filter((l): l is Lead => l !== null);
  } catch {
    return [];
  }
}

export async function submitLead(formData: FormData): Promise<void> {
  const lead = {
    name: String(formData.get("name") ?? "").slice(0, 200),
    email: String(formData.get("email") ?? "").slice(0, 200),
    company: String(formData.get("company") ?? "").slice(0, 200),
    interest: String(formData.get("interest") ?? "").slice(0, 100),
    message: String(formData.get("message") ?? "").slice(0, 2000),
    at: new Date().toISOString(),
  };

  if (!lead.email || !lead.name) redirect("/contact?error=1");

  const kv = await getKv();
  if (kv) {
    const id = `lead:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    await kv.put(id, JSON.stringify(lead));
    try {
      const raw = (await kv.get("leads:index")) ?? "[]";
      const index = JSON.parse(raw) as string[];
      index.unshift(id);
      await kv.put("leads:index", JSON.stringify(index.slice(0, 200)));
    } catch {
      /* index is best-effort */
    }
  } else {
    console.log("[ordence] lead (no KV binding):", lead);
  }

  redirect("/contact?sent=1");
}
