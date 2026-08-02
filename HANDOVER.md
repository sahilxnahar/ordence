# Ordence — Project Handover

**Purpose:** everything a new session (or a new engineer) needs to continue
this project without re-discovering anything. Read this first, then
`BLUEPRINT.md` for architectural reasoning.

Last updated: 2 August 2026.

> **Credential policy:** no secret values appear in this file, and none
> should ever be added to it — this document lives in a Git repository.
> Every secret below is listed by **name and location** so you know what
> exists and where to find it. Values live only in Cloudflare Secrets and
> the provider dashboards.

---

## 1. Identity & accounts

| Thing | Value |
|---|---|
| Brand | Ordence ("Orbital" brand kit) |
| Production domain | `ordence.com` |
| Operator / owner email | `sahil@ordence.com` |
| GitHub repository | `github.com/sahilxnahar/ordence` (branch `main`) |
| Local clone (macOS) | `/Users/sah/Documents/GitHub/ordence` |
| Scratch / delivery folder | `/Users/sah/Downloads/Ordence Marketing/Website` |
| Cloudflare account | "Sahil@ordence.com's Account" |
| Cloudflare account ID | `ad6dd0d6cb1513eea62c34d216c9ef66` |
| Cloudflare Worker name | `ordence` |
| Zero Trust team domain | `solitary-meadow-c50e.cloudflareaccess.com` |
| Zero Trust plan | Free — 0 of 50 seats used |
| Email provider | Resend (account `ordence`) |
| Resend sending domain | `send.ordence.com` (region us-east-1) |

### Hosting model
Cloudflare Workers **free plan**, via OpenNext. Envelope the architecture is
designed around: 100,000 Worker requests/day, KV 100k reads / 1k writes per
day, 1 GB KV storage, unlimited free static asset serving, free proxied
wildcard DNS, Cloudflare for SaaS free for the first 100 custom hostnames.

---

## 2. Surfaces — which hostname does what

| Hostname | Served by | Behaviour |
|---|---|---|
| `ordence.com`, `www.ordence.com` | **this repo** | Marketing site |
| `<tenant>.ordence.com` | **this repo** | Branded tenant workspace |
| client custom domains | **this repo** | Same, resolved by KV lookup |
| `admin.ordence.com` | **this repo** | Operations console — MUST be behind Cloudflare Access |
| `app.ordence.com` | **separate CRM app** | This repo deliberately returns 404 |

**Critical routing rule:** this Worker takes the wildcard route
`*.ordence.com/*`. Bind `app.ordence.com` on the CRM Worker as a **Custom
Domain** (or an explicit `app.ordence.com/*` route) — both are more
specific than the wildcard, so the CRM wins that hostname.

**Subdomain provisioning is fully automatic.** The wildcard DNS record plus
the wildcard route mean every possible subdomain already resolves. Creating
a tenant is one KV write — no DNS API call, no propagation wait.

---

## 3. Environment variables & secrets

### Plain vars (in `wrangler.jsonc`, not secret)

| Name | Value | Purpose |
|---|---|---|
| `NEXT_PUBLIC_ROOT_DOMAIN` | `ordence.com` | Drives all host classification and canonical URLs |

### Secrets (set via `npx wrangler secret put <NAME>`)

| Name | Required? | Purpose | Behaviour if missing |
|---|---|---|---|
| `RESEND_API_KEY` | For email | Sends signup alerts + activation confirmations | Fails soft: logs `RESEND_API_KEY not set — would have sent …`, request still saved |
| `EMAIL_FROM` | Optional | Overrides sender identity | Falls back to `Ordence <onboarding@send.ordence.com>` |

### KV namespace bindings (in `wrangler.jsonc`)

| Binding | Namespace ID | Purpose |
|---|---|---|
| `TENANT_KV` | `e4f1eda097f94c97b9952d60555a63ea` | Tenants, signup requests, leads |
| `NEXT_INC_CACHE_KV` | `e3ff71ea8ffc4a7bb1bf6343b44e88fc` | Next.js incremental/ISR cache (used by OpenNext) |

### KV key schema (all in `TENANT_KV`)

```
tenant:slug:<slug>      → Tenant JSON        (read by the router)
tenant:domain:<domain>  → Tenant JSON        (custom-domain lookup)
tenants:index           → string[] of slugs  (admin fleet listing)
request:<id>            → TenantRequest JSON (signup queue)
requests:index          → string[] of ids    (newest first, capped 500)
lead:<ts>:<rand>        → Lead JSON          (contact form)
leads:index             → string[] of ids    (newest first, capped 200)
```

---

## 4. Build, test, deploy

```bash
npm install              # first time

npm run dev              # local dev (localhost, admin.localhost, <tenant>.localhost)
npm run build            # Next production build (strict TS, fails on type errors)
npm run lint             # ESLint — must be clean
npm run test             # Vitest unit tests (40 currently, all passing)
npm run build:worker     # OpenNext → .open-next/worker.js  (CI build command)
npm run preview          # full Cloudflare workerd runtime locally
npm run deploy           # build + deploy from your machine
```

### Cloudflare Workers Builds (git-connected CI) — settings that matter

| Setting | Value |
|---|---|
| Build command | `npx opennextjs-cloudflare build` |
| Deploy command | `npx wrangler deploy` |
| Non-production branch deploy | `npx wrangler versions upload` |
| Production branch | `main` |
| Root directory | `/` |

> `npm run build` alone is **not** enough for CI — it compiles Next.js but
> not the Worker bundle, and the deploy step then fails with
> "Could not find compiled Open Next config". This has bitten twice.

### End-to-end scripts (need a local worker running)

```bash
npm run preview                                   # terminal 1
PW_CHROME=<path-to-chromium> PORT=8787 npm run e2e:provisioning
PW_CHROME=<path-to-chromium> PORT=8787 npm run e2e:tenant
PW_CHROME=<path-to-chromium> PORT=8787 npm run e2e:mobile
PW_CHROME=<path-to-chromium> PORT=8787 npm run e2e:renewal
```

They drive `admin.localhost:<port>` and `<tenant>.localhost:<port>`, which
exercise the same classifier branches as production.

---

## 5. Working procedure (important — this has caused data loss before)

**Never replace the repository folder.** Dragging a new `ordence` folder
into `Documents/GitHub` and choosing "Replace" deletes the hidden `.git`
folder, which *is* the repository — that is what caused GitHub Desktop's
"Can't find ordence" errors earlier.

The working loop is:

1. Changes are written **directly into** `/Users/sah/Documents/GitHub/ordence`,
   alongside the existing `.git` folder.
2. In GitHub Desktop: type a summary → **Commit to main** → **Push origin**.
3. Cloudflare Workers Builds deploys automatically.

If GitHub Desktop ever says it can't find the repo, click **Locate…** and
point it at `Documents/GitHub/ordence`. **Never "Clone Again"** — that
overwrites new work with the old remote copy.

Note: the cloud session cannot delete files on the Mac. Files that need
removing are moved to `Documents/GitHub/_to_delete/` instead; empty that
folder manually from time to time.

---

## 6. Tech stack (exact versions)

| Package | Version |
|---|---|
| next | 16.2.12 |
| react / react-dom | 19.2.4 |
| tailwindcss | ^4 (CSS-first, `@theme inline`) |
| framer-motion | ^12.43.0 |
| three | ^0.185.1 |
| @react-three/fiber | ^9.7.0 |
| @react-three/drei | ^10.7.7 |
| next-themes | ^0.4.6 |
| @opennextjs/cloudflare | ^1.20.2 |
| wrangler | ^4.118.0 |
| vitest | ^4.1.10 |
| playwright | ^1.62.1 (dev only, e2e) |

### Version-specific gotchas

- **Next 16 renamed `middleware.ts` → `proxy.ts`.** We deliberately keep
  `middleware.ts`: it compiles to *edge* middleware, which is what the
  Cloudflare adapter runs. `proxy.ts` compiles to the Node runtime, which
  the adapter cannot execute yet (verified empirically). The build prints a
  deprecation warning — that warning is expected and safe.
- **Linting moved out of `next build`** in Next 16; run `npm run lint` in CI.
- **React Compiler lint rules are strict:** no `setState` directly inside an
  effect body, no impure calls (`Date.now()`) during render. Both have
  already caused build failures; see `count-up.tsx` and `admin/health/page.tsx`
  for the accepted patterns.
- **`backdrop-filter` creates a containing block for `position: fixed`.**
  The mobile nav must portal to `document.body` or it renders trapped
  inside the header. This was a real bug.

---

## 7. Brand system

Source of truth: the official "Orbital" brand kit. Tokens live in
`src/app/globals.css` as CSS variables mapped into Tailwind via
`@theme inline`.

| Token | Value | Role |
|---|---|---|
| Ink Navy | `#111827` | Text, primary buttons, structure |
| Vivid Violet | `#6D45E8` | **Functional** accent — anything interactive |
| Bright Coral | `#FF5C5C` | **Editorial** accent — never interactive |
| Warm Ivory | `#FAF9F6` | Alternating section surface |
| White | `#FFFFFF` | Page canvas |

Accessibility note: `#FF5C5C` fails AA for text on white, so `--danger`
resolves to coral-600 `#DC3D3D` in light mode; the kit coral is used for
fills, dark mode and decoration.

Fonts: **Manrope** (display), **Geist** (body/UI), **Geist Mono** (kickers,
captions) — all self-hosted via `next/font`.

Assets: `public/brand/` (SVG masters), `public/ordence-icon-*.png`,
`public/site.webmanifest`, `public/og.png`, `src/app/favicon.ico`.

---

## 8. Codebase map

```
src/
├── middleware.ts              ★ edge host router — read this first
├── config/site.ts             root domain, appUrl, authEntry seam
├── app/
│   ├── layout.tsx             fonts, theme, metadata, JSON-LD
│   ├── globals.css            ★ all design tokens + motion utilities
│   ├── (marketing)/           public site — 14 routes
│   ├── admin/                 operations console (Cloudflare Access only)
│   │   ├── requests/          signup approval queue
│   │   ├── tenants/           Command Grid — provision/edit/suspend
│   │   ├── health/            fleet + free-tier budget
│   │   └── leads/             contact-form inbox
│   ├── t/[tenant]/            tenant workspaces (branding injected here)
│   ├── auth/login/            marketing-side login page
│   └── _parked/               NOT routed (underscore = private folder)
├── components/
│   ├── ui/ layout/ marketing/ motion/ react-bits/ admin/
│   └── three/
│       ├── particle-field.tsx  ★ one GPU harness, three fields
│       ├── scene-controls.tsx      collapsible slider panel per band
│       ├── convergence-band.tsx    /crm, /ai
│       ├── magnetosphere-band.tsx  /platform, /erp, tenant workspaces
│       ├── lamp-band.tsx           homepage close, /about
│       ├── scene-canvas.tsx        the ONLY sanctioned way to mount WebGL
│       ├── lazy.tsx                dynamic imports + sized placeholders
│       └── living-ledger / tenant-prism / command-room
└── lib/
    ├── tenant/
    │   ├── resolve.ts         ★ pure host classification (+ tests)
    │   ├── store.ts           ★ layered cache + plan expiry enforcement
    │   ├── admin.ts           provisioning/activation server actions
    │   ├── industries.ts      10 industry packs + module catalog
    │   ├── registry.ts        seed tenants (fallback if KV is empty)
    │   └── types.ts           Tenant, TenantPlan, TenantRequest
    ├── requests.ts            signup queue server actions
    ├── leads.ts               contact-form capture
    ├── email.ts               Resend adapter (fails soft)
    └── content.ts             articles + changelog
```

### The three files that carry the most risk
1. `lib/tenant/resolve.ts` — a mistake leaks one tenant's surface onto
   another's hostname. Fully unit-tested, no I/O.
2. `middleware.ts` — every request passes through it.
3. `lib/tenant/store.ts` — caching + plan expiry; a bug here either serves
   stale config or gives away expired subscriptions.

---

## 9. How provisioning works (the commercial core)

```
prospect → /get-started
   ↓  writes request:<id> to KV (durable BEFORE any email)
   ↓  email to sahil@ordence.com with deep link
operator → admin.ordence.com/requests?open=<id>
   ↓  pick industry  → module preset pre-fills
   ↓  adjust modules, set seats + months
   ↓  Activate
   ↓  writes tenant:slug:<slug> to KV   ← subdomain is now live
   ↓  confirmation email to the customer
```

**Plan expiry is enforced on read** (`applyPlanState` in `store.ts`): a
tenant whose `plan.expiresAt` has passed reads as `suspended` everywhere,
instantly, with no cron job to fail. Suspended workspaces render an
explicit "temporarily unavailable" page, not a 404.

Cache TTLs: in-isolate memory 15s, KV edge 60s. Chosen so a suspension
propagates promptly — a security-adjacent action shouldn't wait a minute.

---

## 10. Current state

**Done and verified on the real Cloudflare runtime:** marketing site (14
routes), three WebGL showpieces, full design system with dark mode, mobile
navigation, ⌘K command palette, multi-tenant routing with custom domains,
tenant branding injection, admin console (requests / tenants / health /
leads), signup-to-live-subdomain pipeline, plan model with expiry, Resend
integration, SEO (sitemap, robots, JSON-LD, OG), plan visibility and
renewals in the Command Grid, renewal/decline emails, 40 unit tests, 4 e2e
scripts.

**Outstanding — in priority order:**

1. **Cloudflare Access policy** (Parts B–D of `DEPLOYMENT-ACCESS.md`).
   Zero Trust is enabled; the application policy is **not yet created**.
   Do not bind `admin.ordence.com` until it is — the console has no
   application-level auth by design.
2. **Resend**: verify `send.ordence.com`, then
   `npx wrangler secret put RESEND_API_KEY`.
3. Automated renewal reminders (currently one-click/manual from the
   Command Grid — a Cloudflare Cron Trigger could send them unattended).
4. Real case studies and client logos (currently honest placeholders,
   labelled as such).
5. `app.ordence.com` CRM — separate application, separate repo.

---

## 10b. Frontend performance budget

Measured with `npm run measure` (see `scripts/measure-page.mjs`), against
a local worker. Homepage, after the P1–P6 frontend pass:

| Profile | JS transferred | Canvases | WebGL contexts | DOM ready |
|---|---|---|---|---|
| Desktop 1440×900 | 1,623 KB | 2 | 1 | ~180 ms |
| Mobile 390×844 | **704 KB** | 1 | **0** | ~85 ms |

Before the pass the homepage mounted **4 canvases and 2 WebGL contexts on
every device**. The mobile figure is now 56% lighter because three.js
(883 KB) is gated by `lib/capability.ts` — heavy scenes load only on
desktop-class devices that aren't asking to save data or reduce motion.
Phones get a designed static composition instead, not a broken one.

Adding three new WebGL scenes moved mobile by **10 KB** and desktop by
27 KB. That is the whole point of the shared harness: `particle-field.tsx`
is a few KB of shader source that reuses the three.js chunk already on the
page, so the fourth scene costs roughly what the second one did.

Budgets to hold:
- Mobile homepage JS ≤ 750 KB
- At most **one** WebGL context per route, ever
- No route above 2 canvases
- Every dark band must be wrapped in `DeferredMount requireCapableDevice`
  with a `BandFallback` placeholder of matching height
- Every band pauses its render loop off-screen (`frameloop={inView ? …}`)

### Scene controls

Each band exposes a collapsed "Play with it" panel (`scene-controls.tsx`)
driven by `FIELD_CONTROLS` in `particle-field.tsx`. Sliders write plain
numbers into shader uniforms every frame — no React re-render of the WebGL
tree, no shader recompilation. Two rules when adding a control:

1. **Label it in product language, not renderer language.** "Workspaces in
   orbit", not "Magnetic Field Size". The float is the same; the claim is
   not.
2. **Keep the default on a step boundary.** A default that is not a
   multiple of `step` gets silently snapped by the browser, so Reset lands
   somewhere other than the documented value.

### Known bug, fixed — worth remembering

The Cloudflare adapter bundles the server with esbuild's `keepNames`
transform, which instruments functions with a call to its `__name` helper.
next-themes builds its no-flash script by stringifying a function, so the
instrumented source was serialized straight into the HTML — where the
helper does not exist. Every route threw a ReferenceError before first
paint, killing theme initialisation.

**It reproduced only in the Workers bundle, never under `next start`.** The
fix is a 60-byte identity shim, first script in `<head>` in
`src/app/layout.tsx`. The lesson is the general one: verify against
`npx opennextjs-cloudflare build` + `npx wrangler dev --local`, not just
`npm run build`. They are not the same runtime.

### Accessibility

`npm run audit:a11y` runs axe-core (WCAG 2.0/2.1 A + AA) across all 14
routes. Currently **zero violations**. The audit scrolls each page before
analysing, because scroll-reveals sit at partial opacity until they enter
the viewport and would otherwise be reported as contrast failures nobody
would ever see.

Contrast tokens worth knowing about: `--accent-strong` and
`--danger-strong` exist because a hue that passes 4.5:1 on white does not
pass on its own soft tint. Text on `bg-accent-soft` must use
`text-accent-strong`, never `text-accent`.

Re-check with:

```bash
npm run preview                                    # terminal 1
PW_CHROME=<chromium> PORT=8787 npm run measure /
PW_CHROME=<chromium> PORT=8787 MOBILE=1 npm run measure /
```

---

## 11. Documentation index

| File | What it covers |
|---|---|
| `HANDOVER.md` | This file — accounts, env, procedure, state |
| `BLUEPRINT.md` | Architecture reasoning, design critique, brand system |
| `PRODUCT-VISION.md` | 500-feature catalog, industry packs, admin spec |
| `ROADMAP.md` | The 10 development batches |
| `DEPLOYMENT-ACCESS.md` | **Securing admin.ordence.com + Resend setup** |
| `COPY-PASTE-DEPLOY.md` | Beginner click-by-click Cloudflare deployment |
| `DEPLOY-GUIDE.md` | Condensed deployment steps |
| `README.md` | Quickstart + CI settings |

---

## 12. Prompt for a new session

> I'm continuing the Ordence project — a multi-tenant marketing site and
> platform on Cloudflare Workers. The repository is at
> `/Users/sah/Documents/GitHub/ordence` (GitHub: `sahilxnahar/ordence`).
> Read `HANDOVER.md` in the repo root first; it has all accounts, env vars,
> KV schema, working procedure and current state. Then read `BLUEPRINT.md`
> for architecture. Write changes directly into that folder — never replace
> it, because that destroys the `.git` folder. I commit and push via GitHub
> Desktop.
