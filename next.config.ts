import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  /**
   * Cloudflare free plan: the Vercel image optimizer doesn't exist here and
   * Cloudflare Image Resizing is a paid add-on. `unoptimized` keeps
   * next/image's layout/priority/lazy behavior (the parts that protect
   * CLS/LCP) while skipping server-side resizing. Ship pre-sized AVIF/WebP
   * assets; flip this off if you later enable Cloudflare Images.
   */
  images: {
    unoptimized: true,
  },

  // Fail the build on type errors — enterprise default.
  // (Linting moved out of `next build` in Next 16 — run `npm run lint` in CI.)
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;

// Enables `next dev` to access Cloudflare bindings (KV, etc.) locally
// through wrangler's simulator — dev/prod parity for the tenant cache.
initOpenNextCloudflareForDev();
