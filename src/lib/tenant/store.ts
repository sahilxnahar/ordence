import type { Tenant } from "./types";
import { seedTenantByDomain, seedTenantBySlug } from "./registry";

/**
 * Tenant lookup with a layered cache, designed for the Cloudflare free plan:
 *
 *   L1  In-isolate memory (Map)  — 0ms, survives across requests that hit
 *       the same Worker isolate. Free, unlimited.
 *   L2  Workers KV               — ~ms reads at the edge. Free tier:
 *       100k reads/day — ample when fronted by L1.
 *   L3  System of record         — seed registry today; swap `originLookup`
 *       for a D1 query or control-plane fetch without touching callers.
 *
 * Negative results are cached too (short TTL) so unknown domains cannot
 * stampede the origin — important on a request-capped free plan.
 */

/**
 * L1 TTL is deliberately short. Suspension is a security-adjacent action —
 * an admin who suspends a tenant expects the hostname to stop serving
 * promptly, and a 60s window of continued service is too long to defend.
 * 15s still absorbs the overwhelming majority of repeat reads within a
 * traffic burst, so the KV free-tier read budget stays comfortable.
 */
const MEMORY_TTL_MS = 15_000;
const NEGATIVE_TTL_MS = 15_000;
const KV_TTL_SECONDS = 60; // edge cache; bounds worst-case propagation

interface CacheEntry {
  value: Tenant | null;
  expiresAt: number;
}

/** Minimal structural KV type — avoids a hard @cloudflare/workers-types dep. */
interface KVNamespaceLike {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
}

const memoryCache = new Map<string, CacheEntry>();

function readMemory(key: string): CacheEntry | undefined {
  const hit = memoryCache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit;
  if (hit) memoryCache.delete(key);
  return undefined;
}

function writeMemory(key: string, value: Tenant | null): void {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + (value ? MEMORY_TTL_MS : NEGATIVE_TTL_MS),
  });
}

/**
 * Reach the Workers KV binding when running on Cloudflare; resolve to
 * `null` everywhere else (next dev, `next build`, CI) so the code path
 * is identical across environments.
 */
async function getKv(): Promise<KVNamespaceLike | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    const kv = (env as Record<string, unknown>)["TENANT_KV"];
    return (kv as KVNamespaceLike | undefined) ?? null;
  } catch {
    return null;
  }
}

/** L3 — swap this for your D1 / Postgres / control-plane call. */
async function originLookup(key: string): Promise<Tenant | null> {
  if (key.startsWith("slug:")) return seedTenantBySlug(key.slice(5));
  if (key.startsWith("domain:")) return seedTenantByDomain(key.slice(7));
  return null;
}

async function lookup(key: string): Promise<Tenant | null> {
  const l1 = readMemory(key);
  if (l1) return l1.value;

  const kv = await getKv();
  if (kv) {
    try {
      const raw = await kv.get(`tenant:${key}`);
      if (raw !== null) {
        const value = raw === "null" ? null : (JSON.parse(raw) as Tenant);
        writeMemory(key, value);
        return value;
      }
    } catch {
      // KV unavailable — fall through to origin. Never fail the request.
    }
  }

  const value = await originLookup(key);
  writeMemory(key, value);

  if (kv) {
    try {
      // Cache negatives as the literal "null" to distinguish from a miss.
      await kv.put(`tenant:${key}`, value ? JSON.stringify(value) : "null", {
        expirationTtl: KV_TTL_SECONDS,
      });
    } catch {
      // Best-effort write-back.
    }
  }

  return value;
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  return lookup(`slug:${slug}`);
}

export async function getTenantByDomain(
  domain: string,
): Promise<Tenant | null> {
  return lookup(`domain:${domain.toLowerCase()}`);
}
