# Ordence — 10 Development Batches

Each batch is a self-contained sprint: shippable on its own, ordered so every
batch compounds the previous one. Batches 1–5 transform the marketing site;
6–10 turn the site into the product.

---

## Batch 1 — Brand Amplification
The brand becomes unmissable and alive.
- Oversized header lockup (✅ shipped with this batch's first commit) with the
  orbital mark completing a slow rotation on hover
- A licensed signature display typeface for headlines (Söhne/GT Walsheim
  class) — the single biggest "expensive feel" upgrade available
- Animated logo intro: the letter-ring assembles once on first page load
- Dynamic Open Graph images (every page shares with on-brand social cards)
- Brand moments in the details: custom text selection, scrollbar, 404 art

## Batch 2 — Conversion Layer
The site starts earning its keep.
- Real contact/demo-booking forms → a Worker + KV inbox + email notification
- Pricing page with plan comparison, annual/monthly toggle, FAQ per plan
- Social proof strip (client logos), 2–3 written case studies with numbers
- Testimonial wall with rotating highlights
- Sticky mobile CTA bar + exit-intent demo offer (tasteful, once per visitor)

## Batch 3 — Page Buildout
Every product gets its own stage.
- /crm, /erp, /ai, /services (web development) — each with one signature
  interactive moment and a feature grid pulled from PRODUCT-VISION.md
- /about with team, story and the "craft" philosophy
- /contact with map, WhatsApp deep link and response-time promise
- Footer v2: full sitemap, newsletter signup, locale switcher shell

## Batch 4 — Interaction Excellence
The Linear/Raycast layer.
- ⌘K command palette: navigate the whole site, search features, jump to demo
- View Transitions between pages (shared-element morphs on cards)
- Scroll progress + section-aware nav highlighting
- Magnetic/tilt audit: consistent physics constants site-wide
- Custom cursor states over interactive showpieces ("drag", "hover")

## Batch 5 — Dark Mode & Theming Mastery
- Art-directed dark mode for every section (not just inverted tokens)
- Animated theme toggle (mask-reveal sweep)
- Live theme-preview widget on /platform: visitors repaint a fake tenant
  with a color picker and watch the whole UI re-brand — the multi-tenant
  pitch as a toy
- prefers-contrast and forced-colors audits

## Batch 6 — Performance, SEO & Analytics
- Structured data (Organization, Product, FAQ), sitemap.xml, robots.txt
- Per-page metadata audit + canonical/hreflang scaffolding
- Font subsetting; image → AVIF pipeline; bundle budget CI check
- Privacy-first analytics (Workers Analytics Engine or Umami) + Core Web
  Vitals RUM reporting
- Lighthouse 95+ on every route as a CI gate

## Batch 7 — Authentication & App Shell
The door to the product opens.
- Real auth (Better Auth on D1, or WorkOS for enterprise SSO)
- Session verification in the edge middleware; per-tenant login isolation
- app.ordence.com shell: sidebar, command palette, notifications, empty
  states that sell what's coming
- Onboarding wizard: name workspace → pick industry pack → invite team

## Batch 8 — Master Admin Panel v1
The three crucial capabilities, made real.
- Tenant Command Grid backed by KV/D1 (create, suspend, toggle features)
- Provisioning wizard: subdomain live in seconds, custom-domain DNS
  checker with live verification status
- Platform observatory: per-tenant request/error charts, free-tier budget
  burn-down, 14-days-silent churn alerts

## Batch 9 — Tenant Experience
What clients actually get.
- Three polished tenant site templates (Real Estate, Agency, Retail packs)
- Tenant theme editor: logo upload, accent picker, live preview, publish
- Custom-domain onboarding UI (the client-facing side of Batch 8's wizard)
- Tenant analytics starter dashboard (visits, leads, sources)

## Batch 10 — Content Engine
Compounding, ownable traffic.
- MDX blog/insights with author pages and reading-time design
- Changelog page fed by releases ("what shipped this week" — trust signal)
- Case-study CMS template so new wins publish in minutes
- RSS + newsletter automation; content calendar seeded from the
  performance-marketing angle (CRM/ERP comparisons, India GST guides)

---

*Cadence suggestion: one batch ≈ one focused week. After Batch 5 the
marketing site is world-class; after Batch 8 you can onboard paying
tenants; after Batch 10 the site grows on its own.*
