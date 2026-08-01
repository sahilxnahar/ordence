# Ordence Platform — Architectural Blueprint

**Enterprise multi-tenant B2B SaaS · Next.js 16 · Cloudflare Workers (free plan) · ordence.com**

This document is the architecture record for the working implementation in this repository. Every code sample below exists in the repo, compiles under strict TypeScript, and was smoke-tested on the actual Cloudflare `workerd` runtime (`wrangler dev`) against all hostname classes: `ordence.com`, `admin.ordence.com`, `app.ordence.com`, `ameyaa.ordence.com`, `customclientdomain.com`, unknown domains, and localhost.

---

## 0. Inputs & ground truth

Two notes on the analyzed assets before anything else:

1. **Brand source** — the palette was first extracted programmatically from `Logo Options/FINAL.png`, then **rebased onto the official ORDENCE Orbital brand kit** once it was supplied: Ink Navy `#111827`, Vivid Violet `#6D45E8`, Bright Coral `#FF5C5C`, Warm Ivory `#FAF9F6` (from `tokens/ordence-brand.json`). The kit's SVG masters are inlined as the `Logo` components (kit navy swapped to `currentColor` so the mark re-inks itself in dark mode), the full master set ships in `public/brand/`, and the kit's favicon/manifest set is wired into metadata. The wordmark is a geometric grotesque set in wide-tracked uppercase; the mark is playful, editorial, almost fashion-brand — a rare and valuable tension against the engineered wordmark. The brand system below is built entirely from this extraction.
2. **DESIGN.md and the React Bits source were not present** in the shared folder (the `Website/` directory is empty). The design review below therefore critiques the design direction as described in the brief (bright white canvases, single dominant accent, hairline borders, pill controls, flat surfaces, editorial restraint) and the React Bits integration implements `CursorGrid` and `Strands` from scratch to the same contract, behind wrappers that let you drop in the official React Bits versions unchanged.
3. **Deployment target is Cloudflare, not Vercel** — per your instruction. The brief's "Vercel Edge-first" requirement is honored in spirit (edge-first rendering, edge middleware, CDN-shaped caching) but every concrete decision is tuned to the **Cloudflare free plan**: 100k Worker requests/day, KV at 100k reads/day, free static asset serving, free wildcard proxied DNS, and Cloudflare for SaaS (100 free custom hostnames) for client domains.
4. **Next.js 16 renamed `middleware.ts` → `proxy.ts`.** This repo deliberately keeps the **`middleware.ts`** convention (still fully supported): in Next 16 it compiles to *edge* middleware, which is what OpenNext's Cloudflare adapter executes inside the Worker. The new `proxy.ts` convention compiles to the Node runtime, which the Cloudflare adapter does not yet run — verified empirically during this build. When the adapter gains Node-proxy support, the file renames with zero logic changes.

---

## 1. Design Review

### 1.1 Critique of the inherited direction

The reference direction (white canvas, grayscale foundation, one accent, hairlines, pills, flat surfaces) is a strong foundation — it is the Stripe/Linear school. But applied naively to a *platform* of this scope it has real weaknesses:

**It under-specifies for enterprise surfaces.** A marketing-page aesthetic of generous whitespace and gallery layouts collapses in a CRM table with 40 columns. The direction as described has no *density model* — no answer to "what does this design language look like at 13px in a data grid." Fix: the system defines two densities from one token set. Marketing surfaces use the editorial scale; admin/app surfaces use a compact scale (smaller paddings, `text-sm` default, same tokens). Same DNA, different air pressure.

**"A single dominant accent" fights the logo.** The mark is proudly two-accent: violet *and* coral. Forcing one accent wastes the brand's most distinctive asset. Fix: a hierarchy, not a monogamy — **violet is the functional accent** (interactive color, focus rings, links, primary CTAs); **coral is the editorial accent** (never interactive — used for emphasis, data-viz second series, gradient endpoints, and error/danger semantics, which its red-leaning hue supports naturally). Users learn "violet means clickable" while the brand keeps its dual personality.

**Flat + hairline without an elevation story breaks in dark mode and in layered UI.** Hairline borders at 10% opacity disappear on dark surfaces, and menus/dialogs need *some* depth cue. Fix: a four-step elevation scale (`hairline → low → mid → high`) where the hairline is embedded *inside* the shadow tokens, so elevation and border always travel together and both re-resolve per theme.

**Editorial restraint often means "nothing moves," which reads as static, not premium.** The brands you cited (Framer, Arc, Raycast) are restrained *and* alive. Fix: a motion philosophy (§1.4) where ambient motion is atmospheric and interaction motion is instant.

**UX inconsistency risk: multi-tenant branding versus design integrity.** Letting tenants inject arbitrary colors can destroy the system. Fix: tenants override exactly **one slot** (`--brand` + its contrast pair + control radius). Every other token is platform-owned. Tenant sites stay on-brand for the tenant and structurally on-system for Ordence.

### 1.2 What is preserved

Bright canvas (the kit's Warm Ivory `#FAF9F6` — pure white is clinical; paper is editorial). Grayscale foundation (tinted with ink, not neutral gray, so even "gray" is brand). Hairlines. Pills. Flat-first surfaces. Generous whitespace on marketing. Engineered typography. Disciplined accent usage — sharpened into the violet/coral role split.

### 1.3 Typography system

One family — **Geist** (wired via `next/font`, self-hosted, zero layout shift) — in two voices. Swap to a licensed grotesque (Söhne, Founders) later by changing two lines in `layout.tsx`; every token references the CSS variable, not the font.

| Role | Size/weight | Treatment |
|---|---|---|
| Display | 48–72px / 600 | `-0.035em` tracking, `line-height 1.02`, `text-wrap: balance` (`.text-display`) |
| Heading | 24–36px / 600 | `-0.02em` |
| Body | 16px / 400 | `1.6` leading |
| UI | 14px / 500 | default in app/admin surfaces |
| Eyebrow | 12px / 600 | uppercase, `+0.14em` tracking (`.text-eyebrow`) — the wordmark's wide tracking, systematized |
| Mono | data, IDs, code | tabular numerals in tables |

The eyebrow is the signature move: the logo's letterspaced uppercase reappears as section labels across every surface — brand recall without logos everywhere.

### 1.4 Spacing, elevation, iconography, motion

**Spacing** — 4px base grid; marketing sections breathe at 96–112px vertical rhythm; app surfaces at 24–32px. One `Container` (max-w-6xl, responsive gutters) owns horizontal rhythm everywhere.

**Elevation** — flat by default. `--shadow-hairline` (borders as elevation zero) → `low` (cards, buttons) → `mid` (dropdowns, popovers) → `high` (dialogs, command palette). Shadows are ink-tinted, not black.

**Iconography** — 1.5px stroke line icons (Lucide-compatible), 16/20px grid, `currentColor` only — icons inherit semantic color and never carry their own palette. The logo mark is inline SVG (`components/ui/logo.tsx`): crisp at any DPR, recolorable, zero requests.

**Motion philosophy** — three registers, one easing (`cubic-bezier(0.22,1,0.36,1)` — fast out, soft landing):
- *Micro* (hover, press): 120–200ms, transform/opacity only. Buttons compress (`active:scale-[0.98]`) — they feel physical.
- *Structural* (reveals, page transitions): 400–600ms, small distances (≤24px drift). `Reveal`/`RevealGroup` are the only sanctioned scroll animations — one voice, not a zoo.
- *Ambient* (Strands, CursorGrid, WebGL): continuous but subordinate — low alpha, pausing off-screen, never blocking reading.
- `prefers-reduced-motion` collapses all three globally (CSS kill-switch + per-component checks). Non-negotiable.

---

## 2. Brand System

Full implementation: `src/app/globals.css`. Architecture: **raw palette → semantic tokens (CSS variables) → Tailwind theme (`@theme inline`)**. Components only ever consume semantic utilities (`bg-surface`, `text-muted`, `bg-brand`), which is what makes dark mode and tenant theming pure variable swaps.

### 2.1 Palette (official brand kit anchors + derived scales)

```
Ink Navy       50→950   #F2F4F8 … #111827 … #0B101B    structure, text, primary
Bright Coral   100→600  #FFE5E5 … #FF5C5C … #DC3D3D    editorial accent, danger
Vivid Violet   100→700  #EDE8FC … #6D45E8 … #5533C7    functional accent
Warm Ivory              #FAF9F6                         light canvas
```

The four anchors are byte-identical to `ordence-brand-kit/tokens/ordence-brand.json`; the tint/shade steps are derived. Note the kit's `#FF5C5C` does not meet AA for text on white — `--danger` therefore resolves to coral-600 `#DC3D3D` in light mode (kit coral is used at 500 for fills, dark mode, and decoration).

### 2.2 Semantic layer (light ⇄ dark)

| Token | Light | Dark |
|---|---|---|
| `--background` | `#FAF9F6` ivory | `#0B101B` ink-950 |
| `--surface` / `--surface-raised` | white / white | ink-900 / `#1B2434` |
| `--foreground` | ink-900 | `#F2F4F8` |
| `--muted` / `--muted-subtle` | `#556075` / `#8A92A6` | `#A8B2C7` / `#707B93` |
| `--border` | ink @ 10% | light @ 10% |
| `--accent` / `--ring` | violet-600 | violet-500/400 (lightened for contrast) |
| `--danger` | coral-600 (AA on white) | coral-500 |
| `--brand` (tenant slot) | violet-600 | violet-500 |

Dark mode is a *re-lit room, not an inversion*: canvas goes ink-950, surfaces ink-900, accents lighten one step to hold WCAG contrast, aurora gradients gain opacity because dark canvases swallow light.

**Gradients** — `--gradient-brand` (violet→coral 135°, for text highlights and decorative fills only — never behind body text), `--gradient-aurora` (two ultra-soft radial washes for hero atmosphere), `--gradient-ink` (navy depth for dark panels).

### 2.3 Why CSS variables and not Tailwind config colors

Tailwind v4's `@theme inline` maps utilities onto variables, so **runtime** theming works: the tenant layout injects `--brand` via a `style` attribute and every `bg-brand` element repaints — no per-tenant CSS builds, no client JS, no flash. This single decision is what makes "isolated branding, one codebase" cheap. Verified in the running worker: Ameyaa's HTML ships `--brand:#6d45e8` from the server.

---

## 3. Folder Architecture

```
ordence/
├── middleware.ts →  src/middleware.ts     # edge router (see §4)
├── next.config.ts                         # images strategy, CF dev bindings
├── open-next.config.ts                    # OpenNext → Workers adapter (KV ISR cache)
├── wrangler.jsonc                         # Worker, KV bindings, free-plan notes
├── .env.example
├── public/                                # static assets — served free by CF
└── src/
    ├── middleware.ts                      # ★ multi-tenant edge routing
    ├── app/                               # App Router — URL structure only
    │   ├── layout.tsx                     # root: fonts, theme, metadata, skip-link
    │   ├── globals.css                    # ★ design tokens (the brand system)
    │   ├── error.tsx · global-error.tsx · not-found.tsx
    │   ├── (marketing)/                   # ordence.com — public, static, SEO
    │   │   ├── layout.tsx · page.tsx · loading.tsx
    │   ├── admin/                         # admin.ordence.com (rewritten here)
    │   │   ├── layout.tsx · page.tsx
    │   ├── app/                           # app.ordence.com — product shell
    │   │   └── page.tsx
    │   ├── t/[tenant]/                    # tenant sites (rewritten here)
    │   │   ├── layout.tsx                 # ★ branding injection point
    │   │   └── page.tsx
    │   ├── auth/                          # focused, chromeless credential flows
    │   │   ├── layout.tsx · login/page.tsx
    │   └── domain-not-found/page.tsx      # unclaimed-hostname landing
    ├── components/
    │   ├── ui/                            # design-system primitives (server-first)
    │   ├── layout/                        # site chrome (header, footer)
    │   ├── motion/                        # Framer Motion primitives (client)
    │   ├── react-bits/                    # ★ interactive bits + lazy boundary
    │   └── three/                         # ★ R3F scenes + lazy boundary
    ├── lib/
    │   ├── tenant/                        # ★ types · resolve · registry · store · context
    │   └── utils.ts
    ├── config/site.ts                     # root domain, canonical URLs
    └── providers/theme-provider.tsx
```

**Why each area exists (and why some requested folders are intentionally absent at this stage):**

- **`app/` holds no logic** — it is the URL manifest. Pages compose from `components/` and `lib/`; nothing in `app/` is imported by anything else. This is what keeps a growing route tree from becoming a dependency web.
- **`lib/tenant/` is split by responsibility**: `types` (contracts), `resolve` (pure host classification — unit-testable with zero mocks), `registry` (seed data = executable documentation + outage fallback), `store` (the only file that knows caching exists), `context` (the only file that knows headers exist). Each file is replaceable independently — swapping the seed registry for D1 touches one function.
- **`components/react-bits/` and `components/three/` each expose exactly one import surface** (`index.tsx` / `lazy.tsx`) so lazy-loading policy is enforced structurally, not by convention.
- **Deferred by design** — the brief's full production tree also names `features/`, `services/`, `hooks/`, `cms/`, `sessions/`, `monitoring/`, `testing/`, `shaders/`. They are *planned growth points*, not day-one scaffolding; empty folders rot. Add them at these triggers:
  - `features/<domain>/` (components + server actions + queries per business domain: `features/crm/`, `features/erp/`) — the moment the CRM ships its first real screen. Rule: features may import `shared`/`lib`; never each other.
  - `services/` — typed clients for external systems (payment, email, CMS) when the second integration lands.
  - `hooks/` — when the third cross-feature client hook appears.
  - `cms/` — content collections for the marketing site (MDX or a headless CMS client) when marketing needs non-engineer publishing.
  - `auth/` + `sessions/` — with the identity provider decision (§ auth below).
  - `three/shaders/` — first custom GLSL material (`*.glsl` files, imported as strings, hot-swappable).
  - `monitoring/` — Workers Analytics Engine / Sentry wrappers when observability lands.
  - `testing/` — Vitest for `lib/tenant/resolve.ts` first (pure functions, highest routing risk), then Playwright against `wrangler dev` with Host-header matrices — exactly the smoke test run during this build, automated.

---

## 4. Multi-Tenant Routing Architecture

### 4.1 The decision flow

```
                        request: Host + path
                               │
                    normalizeHost() ── strips port, lowercases
                               │
                 ┌──── classifyHost(host, "ordence.com") ────┐   pure, no I/O
                 │                                           │
   ordence.com / www ──────────► marketing ──► serve (marketing)/ as-is
   admin.ordence.com ──────────► admin ─────► rewrite /admin/*
   app.ordence.com ────────────► app ───────► rewrite /app/*
   ameyaa.ordence.com ─────────► tenant ────► rewrite /t/ameyaa/*
   *.localhost ────────────────► same shapes, locally
   *.workers.dev / *.pages.dev ► preview ───► marketing surface
   anything else ──────────────► custom domain
                                      │
                        getTenantByDomain(host)
                     memory (60s) → KV (5m) → registry/origin
                              │           │
                        found: /t/{slug}/*    miss: /domain-not-found
```

Plus three security invariants, all verified live: apex `/t/*` → 404 (no cross-tenant path spoofing), apex `/admin` → 307 to `admin.ordence.com` (one canonical URL per surface), slugs regex-validated before entering any rewrite.

### 4.2 The middleware (complete, as shipped)

`src/middleware.ts` — see the file for the fully commented version; the core:

```ts
export default async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? siteConfig.rootDomain;
  const decision = classifyHost(host, siteConfig.rootDomain);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(HEADER_HOST, host);
  requestHeaders.set(HEADER_SURFACE, decision.surface);
  const withHeaders = { request: { headers: requestHeaders } };

  switch (decision.surface) {
    case "admin": /* rewrite → /admin/*  */
    case "app":   /* rewrite → /app/*    */
    case "tenant": {
      let slug = decision.tenantSlug ?? null;
      if (!slug && decision.customDomain) {
        const tenant = await getTenantByDomain(decision.customDomain);
        if (!tenant || tenant.status !== "active")
          return rewrite("/domain-not-found");
        slug = tenant.slug;
      }
      if (!slug || !isValidTenantSlug(slug)) return rewrite("/domain-not-found");
      requestHeaders.set(HEADER_TENANT, slug);
      return rewrite(`/t/${slug}${path}`);
    }
    case "preview":
    case "marketing": /* guard /t, /admin, /app; else next() */
  }
}
```

**Design decisions worth defending:**

- **The routing decision travels via request headers**, not URL state — layouts read `x-ordence-surface` / `x-ordence-tenant` through `lib/tenant/context.ts` (wrapped in React `cache()` for per-request dedup). User-controllable input never selects a tenant after the middleware.
- **Caching strategy is free-plan-aware.** L1 in-isolate `Map` (0ms, survives across requests in a warm isolate) absorbs the vast majority of lookups so KV's 100k reads/day is never the bottleneck; L2 KV (5-min TTL) makes cold isolates fast; L3 is the swappable origin. **Negative caching** (misses cached as `"null"`, 15s memory TTL) prevents unknown-domain scans from stampeding the origin — a real concern when every request is metered.
- **Static assets bypass the middleware entirely** via the matcher — on Cloudflare they're served from the free asset plane without invoking the Worker at all, which is the single biggest free-plan lever.
- **Custom domains on the free plan:** point the client's DNS at Cloudflare, attach via **Cloudflare for SaaS** custom hostnames (first 100 free, TLS issued automatically). The Worker never needs to know — it just receives the Host header.
- **Preview deployments** (`*.workers.dev`) classify as `preview` and serve the marketing surface; tenant simulation locally uses `ameyaa.localhost:3000`, which works in every modern browser without hosts-file edits.

---

## 5. App Router Architecture

| Layout | Serves | Notes |
|---|---|---|
| `app/layout.tsx` | everyone | fonts (`next/font`, self-hosted, `display:swap`), ThemeProvider, `metadataBase`, skip-link, `suppressHydrationWarning` (required by the pre-hydration theme script) |
| `(marketing)/layout.tsx` | ordence.com | sticky glass header (server-rendered; only the theme toggle hydrates), footer; fully static — prerendered at build |
| `admin/layout.tsx` | admin.ordence.com | dense sidebar shell, `robots: noindex`, compact density |
| `t/[tenant]/layout.tsx` | tenant hosts | **the branding boundary**: async `params`, tenant fetched once (deduped), `notFound()` for missing/suspended, injects `--brand`/`--ring`/`--radius-control` inline, per-tenant `generateMetadata` |
| `auth/layout.tsx` | all surfaces | chromeless, centered, aurora background — nothing competes with credentials |
| `error.tsx` / `global-error.tsx` / `not-found.tsx` / `(marketing)/loading.tsx` | failure & pending states | loading state is a **layout-mirroring skeleton** of the hero (zero CLS), not a spinner |

Build output confirms the shape: every route static (`○`) except `ƒ /t/[tenant]` — dynamic because tenant config is per-request, exactly as intended.

**State management decision:** none installed — deliberately. Server state lives in RSC props; theme lives in `next-themes`; tenant identity lives in request headers. The escalation path when the CRM/ERP interactive shells arrive: **URL state first** (filters, tabs — shareable by default) → **Zustand** for genuinely client-local workspace state (command palette open, optimistic drag state) → **TanStack Query** only for high-frequency client refetching (live dashboards). Redux-class machinery is an anti-goal; RSC already deleted most of what it existed for.

**Data fetching decision:** RSC-first — pages/layouts fetch on the server (the tenant lookup *is* the pattern: request-deduped via `cache()`, edge-cached via KV). Mutations are **Server Actions** (typed, no API-route boilerplate, free progressive enhancement). Route Handlers only where an HTTP surface is contractually required (webhooks, future public API under `api.ordence.com`). Client fetching is the last resort, via TanStack Query when it arrives.

**Authentication decision (designed, not yet wired):** an edge-compatible, cookie-based session model — short-lived signed JWT access cookie + rotating refresh token, `HttpOnly; Secure; SameSite=Lax`, **scoped per host** (a session on `ameyaa.ordence.com` must not leak to `clientx.ordence.com`; only `app.ordence.com` and apex may share). Enterprise SSO (SAML/OIDC, SCIM) should be delegated to a provider rather than hand-rolled — on this stack, **Better Auth** (self-hosted on D1, free-plan friendly) or **WorkOS** (free to 1M MAU for AuthKit) are the shortlist. Session verification happens in this same middleware — decode locally with the public key, no network call, then RBAC per surface: `admin` requires platform-staff role; tenant workspaces check tenant membership. The login UI shipped in `auth/login` is provider-agnostic by design.

---

## 6. Component Architecture

The dependency rule (enforceable later with ESLint import boundaries):

```
app/  →  features/*  →  shared (components/ui, components/layout)  →  lib/
             │                        │
             └── may use motion/, react-bits/, three/ ── never the reverse
```

- **Server by default.** `ui/` primitives (Button, Badge, Container, Logo) ship zero JS — Button renders `<Link>`/`<button>` with token-driven classes. Client components are leaves, marked by capability: *motion* (Framer), *bits* (canvas), *three* (WebGL), *stateful chrome* (ThemeToggle).
- **Business components** (future `features/crm/…`) own domain meaning; they compose shared primitives and are the only place domain types appear in UI.
- **Canvas/Three/Bits components** are behind mandatory lazy boundaries (§7, §8) — pages physically cannot import the heavy implementation directly.
- **Forms**: server-action-first (see login form) — validation with Zod at the action boundary when real forms land.
- **Charts** (future): one wrapper choosing SVG (small data, print-friendly) vs canvas (10k+ points) behind a single `<Chart>` API, colored exclusively by semantic tokens so tenant theming reaches data-viz for free.
- **Providers** are surface-scoped: theme at root; tenant branding at the tenant layout; future auth/session at the surfaces that need it. No provider pyramid at the root.

---

## 7. Three.js Architecture

Three layers, one rule per layer (all shipped in `components/three/`):

1. **`scene-canvas.tsx` — the only way to mount WebGL.** Enforces the performance budget once, for every future scene: `dpr={[1,2]}` (fill-rate cap on 3× displays), `frameloop="demand"` default (static scenes render on change only; animated scenes opt into `"always"`), `powerPreference: "high-performance"`, a `Suspense` boundary for streamed assets, and a **WebGL error boundary** — a lost context or unsupported GPU degrades to the CSS fallback, never a white screen.
2. **`hero-scene.tsx` — scene content.** A breathing icosahedron in brand violet with coral rim light (`MeshDistortMaterial`, `Float`), demonstrating the composition pattern. Future scenes follow it: content composes inside `SceneCanvas`, assets load via drei's suspense-integrated loaders (`useGLTF` with Draco/KTX2 when real models arrive), postprocessing added per-scene only when justified (each pass is a full-screen render — budgeted, never default).
3. **`lazy.tsx` — the async boundary.** `next/dynamic` + `ssr:false` (WebGL can't SSR), CSS gradient fallback that reserves layout (zero CLS). three+fiber+drei live in their own chunk, loaded only where a scene renders.

Performance budget as policy: ≤1 active WebGL canvas per viewport; ≤50k triangles for decorative scenes; textures ≤1024² KTX2; pause when off-viewport; interaction layered via R3F events on meshes, DOM overlays for anything textual.

## 8. React Bits Integration

Same doctrine, shipped in `components/react-bits/`: implementations are client-only files; **pages import only from `react-bits/index.tsx`**, which wraps each bit in `next/dynamic` (`ssr:false`) with a decorative fallback. Decoration must degrade to decoration — if JS fails, layout holds.

- **`CursorGrid`** — dot lattice with pointer proximity glow. Placement: section backgrounds that want quiet interactivity (the CTA band on the home page; later, feature sections and the 404). Config: `gap` 26px, `influence` 140px, dots at `color-mix(foreground 14%)` with hot dots in `var(--brand)` — meaning tenant sites get *their* accent in the grid for free.
- **`Strands`** — flowing brand-gradient filaments with pointer attraction. Placement: hero sections only — it is the "atmospheric hero treatment" from the references and loses specialness if repeated. Config: 14 strands sampling the ink/violet/coral ramp at 16–24% alpha behind display type.

Shared engineering contract (both implement it): single canvas + one rAF loop; DPR capped at 2; `IntersectionObserver` pauses off-screen; `ResizeObserver` redraws; `prefers-reduced-motion` renders one static frame and never starts the loop; colors read from CSS custom properties so theming (dark mode, tenant brand) flows through with zero JS coordination. When you adopt official React Bits components, they replace the implementation files; the wrapper contract — and therefore every page — is unchanged.

---

## 9. Enterprise Performance Strategy (Cloudflare free plan edition)

The free plan makes performance an *economic* constraint, which conveniently forces the right architecture:

- **Static-first rendering.** Every marketing/auth/admin-shell route prerenders (`○` in the build output) and is served from Cloudflare's free, unmetered asset plane — those requests cost nothing from the 100k/day Worker budget and arrive at CDN latency. Only tenant routes render dynamically. This is the free plan's version of Partial Prerendering; adopt PPR (`cacheComponents`) for the static shell of tenant pages when it stabilizes for the adapter.
- **RSC + streaming.** Server components keep data on the server and JS off the client; `loading.tsx` streams a layout-mirroring skeleton while dynamic segments resolve. Server Actions handle mutations without API-route weight.
- **ISR in KV.** OpenNext's incremental cache is bound to Workers KV (`open-next.config.ts`). Use long `revalidate` windows (hours, not seconds) — KV free tier allows 1k writes/day, so revalidation should be rare and deliberate.
- **Bundle discipline.** three/fiber/drei and each React Bit are isolated async chunks via the mandatory lazy boundaries; Framer Motion is imported only by leaf motion components. The shared client bundle stays lean because interactivity is structurally quarantined.
- **Middleware optimization.** Pure-function host classification (no I/O for platform hosts), layered cache for custom domains, static assets excluded by matcher — the middleware adds ~0ms to the hot path.
- **Images** — `next/image` with `unoptimized: true` (Cloudflare's resizer is paid): layout/priority/lazy semantics retained (CLS/LCP protection), resizing done at build time — ship pre-sized AVIF/WebP. Flip to Cloudflare Images later without touching call sites.
- **Fonts** — `next/font` self-hosts Geist with `display:swap`: zero external requests, zero FOIT, zero layout shift.
- **Prefetching** — Next's viewport prefetch on `<Link>` covers marketing; keep tenant-workspace prefetch conservative (hover-triggered) to respect the request budget.
- **Accessibility as performance** — skip-link, visible focus rings, semantic landmarks, reduced-motion compliance, AA contrast in both themes (dark-mode accents lightened specifically for this).
- **Core Web Vitals targets** — LCP ≤ 1.8s (static HTML from CDN + self-hosted fonts), CLS ≤ 0.02 (reserved canvas/skeleton space), INP ≤ 150ms (tiny hydration surface; ambient animation on canvas, off the main React tree). Measure with real-user `web-vitals` reporting into Workers Analytics Engine (free) when monitoring lands.

---

## 10. Enterprise UI Roadmap

Sequenced for impact-per-effort; each item names its home because placement *is* the design decision:

1. **Command palette (⌘K)** — `app.` + `admin.` surfaces. The Linear/Raycast signature; on an RSC-heavy app it doubles as instant navigation. Build on `cmdk`, style with tokens, elevation `high`. *Highest leverage next feature.*
2. **CRM dashboard** — `app.ordence.com/crm`. Compact density, tabular numerals, canvas-based pipeline visualizations in brand ramp; micro-interactions on row hover (chevron slide, 120ms).
3. **ERP flow visualizations** — `app.ordence.com/erp`. Inventory/order flows as animated node graphs — the WebGL budget's best ROI inside the product (one `SceneCanvas`, `frameloop:"demand"`).
4. **AI assistant surface** — a slide-over panel inside app surfaces (not a floating bubble — this is an enterprise tool, not a support widget). Streaming responses via Server Actions; Strands at low alpha as its thinking state.
5. **Scroll storytelling** — marketing product pages: pinned sections where the hero orb morphs per feature (Framer `useScroll` driving the R3F scene). Apple treatment, one page at a time.
6. **WebGL product showcases** — marketing `/platform`: the data-flow "system of record" visual as an interactive scene. Fallback: pre-rendered video.
7. **Realtime collaboration presence** — deferred until paid plan: Durable Objects (the natural CF primitive for presence) are limited on free. Design cursors/avatars now, ship later.
8. **Glass effects** — already in the header (`backdrop-blur` + hairline); extend to command palette and slide-overs. Discipline: glass is for *chrome above content*, never for content itself.
9. **Premium loading states** — extend the skeleton-mirror pattern to every surface; add view-transition polish (Next's `unstable_viewTransition`) when stable.

---

## 11. Deployment Runbook (Cloudflare free plan)

```bash
# 1. Auth
npx wrangler login

# 2. Create the two KV namespaces, paste ids into wrangler.jsonc
npx wrangler kv namespace create TENANT_KV
npx wrangler kv namespace create NEXT_INC_CACHE_KV

# 3. Ship
npm run deploy        # = opennextjs-cloudflare build && deploy

# 4. Dashboard wiring (one-time), zone ordence.com:
#    - Workers → your worker → Domains & Routes:
#        custom domains:  ordence.com, www.ordence.com,
#                         admin.ordence.com, app.ordence.com
#        route:           *.ordence.com/*  → ordence worker   (wildcard
#                         proxied DNS is free on all plans)
#    - Client domains: SSL/TLS → Custom Hostnames (Cloudflare for SaaS,
#      first 100 free) → add customclientdomain.com; client CNAMEs to
#      your fallback origin. No code changes — the Worker just sees Host.

# Local dev:   npm run dev          (localhost, ameyaa.localhost, admin.localhost)
# Worker dev:  npm run preview      (full workerd runtime, KV simulated)
```

Free-plan envelope: 100k req/day ≈ 3M/month against the Worker — with static assets unmetered and marketing fully prerendered, realistically supports substantial traffic. The upgrade path ($5 Workers Paid) unlocks 10M requests, Durable Objects for realtime, and R2 for tenant assets — no architectural changes required; every choice above was made so paid features are additive.

## 12. Verification record

`next build`: ✓ compiled, ✓ strict TS, ✓ ESLint clean, all marketing/admin/auth routes static, tenant dynamic. `opennextjs-cloudflare build`: ✓ worker bundle. `wrangler dev` (real workerd) Host-matrix smoke test: apex 200 + hero content · `ameyaa.ordence.com` → tenant page with `--brand:#6d45e8` injected server-side · `customclientdomain.com` → Client X · `admin.` → console · `app.` → shell · unknown domain → domain-not-found · apex `/t/ameyaa` → 404 · apex `/admin` → 307 to `admin.ordence.com` · unknown subdomain → 404.
