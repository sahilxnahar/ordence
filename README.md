# Ordence — the marketing site

Thirty-two pages, one stylesheet, one Worker. Deployed to Cloudflare
Workers as static assets, so every page is served from the edge without
the Worker running at all. Only `POST /api/enquiry`, `POST /api/e` and a
404 ever reach the script.

```
npm install          # playwright, for the checks; nothing else
npm run deploy       # wrangler deploy
```

## What is in here

```
dist/                 the site, as served. Generated — see below.
worker/index.js       the enquiry endpoint, the event sink, the 404 log
wrangler.jsonc        the deploy, and the KV binding when you want it
scripts/
  check-pages.mjs     overflow, console errors, dead links, one h1 a page
  audit-a11y.mjs      a keyboard walk of every page + a contrast audit
  verify-site.mjs     the interactive pieces, exercised end to end
  worker-test.mjs     the Worker, without deploying it
  social-images.mjs   regenerates dist/og/*.png from og-manifest.json
```

`dist/` is **generated**. The generator is `build.py` and the content
modules beside it, which are not in this repo — they live in the working
folder the site is authored in. Editing a file under `dist/` by hand
works exactly once, until the next build overwrites it.

The three files under `dist/assets/` that are *not* generated are
`scene.js`, `three.module.min.js` and `three.core.min.js` — the particle
engine and its dependency. Those are checked in, and the build refuses to
ship a site that has lost them.

## The checks

```
npm run serve        # in one terminal
npm run check        # in another — layout, links, console
npm run check:a11y   # keyboard order, focus rings, contrast, landmarks
npm run check:site   # the form, the quiz, the calculator, the board, print
npm run test:worker  # no server needed
```

All four are expected to pass on every commit. `check:a11y` walks the tab
order of every page and measures the contrast of every visible run of
text against what is actually behind it, alpha compositing included — it
is stricter than a Lighthouse score and it is the one to believe.

## The budget

The build fails if a document page exceeds 60KB of HTML, if the shared
stylesheet exceeds 68KB, if `chrome.js` exceeds 36KB, or if a cold
document page — HTML plus CSS plus JS — exceeds 150KB. Today the heaviest
page is `/tour` at 41KB and a cold page is 134KB.

When one of these trips, the answer is usually to cut. Raising the number
deliberately and saying why in the commit message is also fine. Drifting
past it without noticing is not, which is why it is a build failure and
not a warning.

## The rules this stylesheet cannot survive breaking

Written up in full, with the reasoning, at `/design-system` — an internal
`noindex` page that renders every component live and reads the design
tokens out of the stylesheet at build time, so it cannot disagree with
what ships. In short:

1. `font:` shorthand may not contain `inherit` — the whole declaration is
   dropped and the element falls back to 16px/400 in the browser's default
   family. **Guarded by the build.**
2. `overflow: clip`, never `hidden` — `hidden` creates a scroll container,
   and `position: sticky` sticks to its nearest scroll container, so one
   of these on an ancestor silently unsticks every rail on the home page.
   **Guarded by the build**, with a `/* sticky-safe */` escape hatch per
   line.
3. A canvas rule must set an explicit width — canvas is a replaced
   element, so `auto` resolves to the intrinsic bitmap width and overflows
   the phone it is on. **Guarded by the build.**

Two more that a grep cannot check: nothing removes a focus indicator
(`check:a11y` walks for it), and every string is formatted *then* escaped,
in that order, through the one function that does both.

## The home page

The only page that behaves differently. It loads a WebGL particle field
that forms the Ordence mark as you scroll; every other page is an ordinary
document.

`data-program` on `<body>` sets the shapes the particles morph between:
`chaos` `rows` `grid` `funnel` `orbit` `wave` `columns` `shell` `drift`
`mark`. Two to four, comma separated. `data-anchor` is the index of the
beat that must be fully resolved when it lands.

`?debug`, or the `d` key, shows the engine readout — chosen quality tier,
particle count, frame rate. `?tier=ultra|high|medium|low|minimal` forces a
level so you can see how it looks on hardware you do not have.

The engine is 733KB across three chained modules, and three people never
receive it: anyone with Save-Data on, anyone on a 2G connection, and
anyone who has asked their system for reduced motion. They get a painted
poster frame instead, which costs no request and no bytes, and the page is
complete without the engine — every word on it is in the HTML.

## Turning the log on

The Worker writes enquiries, 404 paths and events to a KV namespace called
`LOG`. There is no binding yet, so every write returns immediately and
nothing is recorded. To turn it on:

```
npx wrangler kv namespace create LOG
```

then uncomment the `kv_namespaces` block in `wrangler.jsonc`, paste the id
in, and deploy. No code changes.

Worth doing before the first real enquiry arrives. Right now the only copy
of a lead is the email, so if Resend is unconfigured or down, the enquiry
is gone and the sender saw a thank-you page. With the binding in place the
worst case is a delayed reply.

Nothing in that store identifies anybody: no IP, no cookie, no user agent,
no cross-request identifier. Country, from Cloudflare's edge, is as far as
it goes. Enquiries are kept two years, everything else ninety days, and
both expire on their own.

Reading it back:

```
npx wrangler kv key list --binding LOG --prefix enq:
npx wrangler kv key get  --binding LOG "<the key>"
```

## Secrets

Never in this repo. Set them on the Worker:

```
npx wrangler secret put TURNSTILE_SECRET
npx wrangler secret put RESEND_API_KEY
```

The Turnstile **site** key is public and belongs in the markup, which is
where it is. The **secret** is the one above and must only ever be a
Worker secret.

Optional, as plain vars: `NOTIFY_TO`, `MAIL_FROM`, `SAMPLE_URL`,
`SAMPLE_NAME`.

With `RESEND_API_KEY` unset the Worker logs what it would have sent and
returns success, so the form is testable before any of this exists.

## Still waiting on a decision

None of it blocks a deploy, and none of it is code:

Resend and a sending domain · SPF, DKIM, DMARC · deliverability testing
against Gmail, Yahoo and Outlook · the 24 legal blanks in `/privacy` and
`/terms`, which are `noindex` and banner themselves as drafts until they
are filled · a named customer for the case study · a photograph and a
LinkedIn URL · a WhatsApp number · the pricing figures · violet or brass,
which is the one real brand decision outstanding · DNS for ordence.com ·
Cloudflare Web Analytics · the KV namespace above.
