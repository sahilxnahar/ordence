import { NextResponse, type NextRequest } from "next/server";
import { classifyHost, isValidTenantSlug } from "@/lib/tenant/resolve";
import { getTenantByDomain } from "@/lib/tenant/store";
import {
  HEADER_HOST,
  HEADER_SURFACE,
  HEADER_TENANT,
} from "@/lib/tenant/context";
import { siteConfig } from "@/config/site";

/**
 * Multi-tenant edge router.
 *
 * Next.js 16 note: this is the file historically named `middleware.ts` —
 * the convention was renamed to `proxy.ts` (identical API). On Cloudflare
 * Workers (via OpenNext) this runs inside the Worker, in front of every
 * render, so hostname routing costs ~0ms extra.
 *
 * Host → surface mapping:
 *   ordence.com, www.ordence.com   → /            (marketing route group)
 *   ameyaa.ordence.com             → /t/ameyaa/*  (tenant site)
 *   customclientdomain.com         → /t/{slug}/*  (via KV-cached lookup)
 *
 * Deliberately NOT served by this Worker:
 *   app.ordence.com    — owned by the separate CRM application. Bind it
 *                        there as a Custom Domain (or an explicit
 *                        `app.ordence.com/*` route, which beats this
 *                        Worker's `*.ordence.com/*` wildcard on
 *                        specificity). If a request still reaches here,
 *                        the CRM binding is missing — so we 404 rather
 *                        than serve a stub that looks like the product.
 *   admin.ordence.com  — parked (see src/app/_parked/README.md). Returns
 *                        404 so the hostname reveals nothing until an
 *                        authenticated console is deployed.
 *
 * Security invariants:
 *   1. Internal path prefixes (/t, /admin, /app) are unreachable from the
 *      public marketing host — no cross-tenant path spoofing.
 *   2. Tenant slugs are validated before being interpolated into rewrites.
 *   3. The resolved surface travels to the app via request headers, never
 *      via user-controllable URL state.
 */

export const config = {
  // Skip static assets entirely — the proxy must stay off the hot path
  // for files. Everything else (pages + API) is host-routed.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|map|woff2?)).*)",
  ],
};

export default async function middleware(
  request: NextRequest,
): Promise<NextResponse> {
  const url = request.nextUrl;
  const host = request.headers.get("host") ?? siteConfig.rootDomain;
  const decision = classifyHost(host, siteConfig.rootDomain);

  /* Propagate the routing decision to layouts/pages via request headers. */
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(HEADER_HOST, host);
  requestHeaders.set(HEADER_SURFACE, decision.surface);

  const withHeaders = { request: { headers: requestHeaders } };

  switch (decision.surface) {
    // Neither hostname is this Worker's to serve. Reaching this branch
    // means a DNS/route binding is missing upstream, so fail closed with
    // a 404 instead of exposing a placeholder or a parked console.
    case "admin":
    case "app": {
      const rewritten = url.clone();
      rewritten.pathname = "/404";
      return NextResponse.rewrite(rewritten, withHeaders);
    }

    case "tenant": {
      let slug = decision.tenantSlug ?? null;

      // Custom domain → tenant slug, via layered cache (memory → KV → origin).
      if (!slug && decision.customDomain) {
        const tenant = await getTenantByDomain(decision.customDomain);
        if (!tenant || tenant.status !== "active") {
          const rewritten = url.clone();
          rewritten.pathname = "/domain-not-found";
          return NextResponse.rewrite(rewritten, withHeaders);
        }
        slug = tenant.slug;
      }

      if (!slug || !isValidTenantSlug(slug)) {
        const rewritten = url.clone();
        rewritten.pathname = "/domain-not-found";
        return NextResponse.rewrite(rewritten, withHeaders);
      }

      requestHeaders.set(HEADER_TENANT, slug);
      const rewritten = url.clone();
      rewritten.pathname = `/t/${slug}${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(rewritten, withHeaders);
    }

    case "preview":
    case "marketing": {
      // /app on the marketing host is a convenience shortcut into the
      // separate CRM application.
      if (url.pathname === "/app" || url.pathname.startsWith("/app/")) {
        return NextResponse.redirect(
          `${siteConfig.appUrl}${url.pathname.replace(/^\/app/, "") || "/"}`,
        );
      }
      // Internal-only prefixes are never reachable from the public host.
      // `/admin` is parked, and `/t/*` must never be addressable directly
      // or one tenant's surface could be requested from another's URL.
      if (
        url.pathname === "/admin" ||
        url.pathname.startsWith("/admin/") ||
        url.pathname.startsWith("/t/") ||
        url.pathname === "/domain-not-found"
      ) {
        const rewritten = url.clone();
        rewritten.pathname = "/404";
        return NextResponse.rewrite(rewritten, withHeaders);
      }
      return NextResponse.next(withHeaders);
    }
  }
}
