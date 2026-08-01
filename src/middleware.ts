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
 *   admin.ordence.com              → /admin/*     (operations console)
 *   app.ordence.com                → /app/*       (signed-in product shell)
 *   ameyaa.ordence.com             → /t/ameyaa/*  (tenant site)
 *   customclientdomain.com         → /t/{slug}/*  (via KV-cached lookup)
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

export default async function middleware(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl;
  const host = request.headers.get("host") ?? siteConfig.rootDomain;
  const decision = classifyHost(host, siteConfig.rootDomain);

  /* Propagate the routing decision to layouts/pages via request headers. */
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(HEADER_HOST, host);
  requestHeaders.set(HEADER_SURFACE, decision.surface);

  const withHeaders = { request: { headers: requestHeaders } };

  switch (decision.surface) {
    case "admin": {
      // admin.ordence.com/*  →  /admin/*
      const rewritten = url.clone();
      rewritten.pathname = `/admin${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(rewritten, withHeaders);
    }

    case "app": {
      // app.ordence.com/*  →  /app/*
      const rewritten = url.clone();
      rewritten.pathname = `/app${url.pathname === "/" ? "" : url.pathname}`;
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
      // Guard internal prefixes on the public host. `/admin` and `/app`
      // redirect to their canonical subdomains; `/t/*` is never public.
      if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
        return NextResponse.redirect(
          `https://admin.${siteConfig.rootDomain}${url.pathname.replace(/^\/admin/, "") || "/"}`,
        );
      }
      if (url.pathname === "/app" || url.pathname.startsWith("/app/")) {
        return NextResponse.redirect(
          `https://app.${siteConfig.rootDomain}${url.pathname.replace(/^\/app/, "") || "/"}`,
        );
      }
      if (url.pathname.startsWith("/t/") || url.pathname === "/domain-not-found") {
        const rewritten = url.clone();
        rewritten.pathname = "/404";
        return NextResponse.rewrite(rewritten, withHeaders);
      }
      return NextResponse.next(withHeaders);
    }
  }
}
