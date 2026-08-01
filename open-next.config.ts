import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

/**
 * OpenNext → Cloudflare Workers adapter configuration.
 *
 * Free-plan strategy:
 *  - ISR/data cache in Workers KV (free tier: 100k reads / 1k writes per
 *    day) — pair with long `revalidate` windows so writes stay rare.
 *  - No R2, no Durable Objects queue, no tag cache — all optional
 *    upgrades once traffic justifies a paid plan.
 */
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
});
