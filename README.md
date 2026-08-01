# Ordence Platform

Enterprise multi-tenant SaaS platform for ordence.com — Next.js 16, Tailwind v4,
Framer Motion, React Three Fiber, deployed to Cloudflare Workers (free plan)
via OpenNext.

**Read `BLUEPRINT.md` first** — it is the full architecture record: design
review, brand system, multi-tenant routing, performance strategy, deployment
runbook.

## Quickstart

```bash
npm install
npm run dev
# http://localhost:3000            → marketing (ordence.com)
# http://ameyaa.localhost:3000     → tenant site
# http://admin.localhost:3000      → admin console
# http://app.localhost:3000       → product shell
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Next dev server (with simulated Cloudflare bindings) |
| `npm run build` | Production Next build (strict TS) |
| `npm run lint` / `typecheck` | Quality gates |
| `npm run preview` | Full Cloudflare workerd runtime locally |
| `npm run deploy` | Build + deploy to Cloudflare Workers |

Before first deploy: create the KV namespaces and paste their ids into
`wrangler.jsonc` (instructions inside that file).
