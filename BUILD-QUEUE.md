# 30 batches I can build without you

Nothing here needs an account, a key, a decision, a photograph, a phone number or a
lawyer. Everything that does — Resend, Gmail deliverability testing, the legal blanks,
a named customer, DNS, pricing figures, the brand decision — is parked in *Deferred*
at the bottom and stays parked.

Status: **all thirty are done.** Session one was 1-15, session two 16-30.

---

## Navigation and structure

**1. Mobile navigation** — **done**
Below 860px the header nav is `display:none` and there is no hamburger. On a phone the
only links are the logo and "Get a quote". This is the most concrete defect on the site.
A proper disclosure menu, keyboard-operable, focus-trapped, no library.

**2. Breadcrumbs and related pages** — **done**
Seventeen pages with no hierarchy expressed anywhere. A breadcrumb line under the header
and a "related" block before the closing band on every document page.

**3. On-site search** — **done**
A search index built at build time from every heading and paragraph, as JSON. Client-side
matching, a few KB, no server. Reachable from the header and the 404.

**4. A human sitemap** — **done**
`/sitemap` as a page, not just the XML. Every page, grouped, with one line each.

**5. A 404 that recovers traffic** — **done**
Search box, the three most likely destinations, and a Worker path that records what was
asked for so broken inbound links stop being invisible.

## Product proof

**6. Six more product screens** — **done**
Dashboard, TDS, purchases with the ITC register, contracts, automations, statements.
Same method as the six that exist: every label lifted from `app.ordence` source.

**7. An interactive pipeline** — **done**
The board, draggable, in the browser, no signup, nothing saved. The screens are already
HTML, which is why this is a day and not a month.

**8. A product tour page** — **done**
Every screen on one page with the argument between them. The page you send someone
instead of a slide deck.

**9. Annotated screens** — **done**
Numbered callouts on two or three screens, pointing at the specific thing that matters —
"available, not on hand"; "this figure is what a bank asks for".

## Content

**10. `/process`** — **done**
How a project actually runs, promoted out of the fragments currently scattered across
get-started and services.

**11. `/faq`** — **done**
A real hub. The four FAQ blocks on product pages answer product questions; this answers
the commercial and fear questions.

**12. `/glossary`** — **done**
GSTR-2B, ITC, HSN, SAC, place of supply, e-way bill, TDS sections, MSME 43B(h), RERA,
reverse charge, absorption, carpet versus saleable. Long-tail search, and genuinely
useful to a buyer who half-knows these.

**13. Four search-shaped landing pages** — **done**
Tally alternative, GST billing software for distributors, CRM for real estate developers
in India, GSTR-2B reconciliation software. One page each, answering the query in the
first paragraph.

**14. Migration checklist** — **done**
The lead magnet. Forty-odd questions someone should ask before moving systems, as a page
and a print-clean PDF.

**15. A second worked example** — **done**
Trading and distribution, to pair with the real-estate one. Same honest framing.

## Conversion mechanics

**16. Progressive form disclosure** — **done**
Two fields first, the rest after the first keystroke, partial input kept through a
refresh.

**17. Scope questionnaire** — **done**
Twelve questions, client-side, produces a summary they can send. For people who want to
be specific but not talk yet.

**18. ROI calculator** — **done**
Month-end days, hours reconciling, stock written off. Shows its arithmetic.

**19. Trust microcopy** — **done**
Per-field reassurance at each point of doubt, and a stated reply time.

**20. Objection handling on `/contact`** — **done**
"You don't need us if…", "we tried this before", "our accountant won't like it".
Currently the thinnest page on the site at 362 words.

## Search and sharing

**21. Structured data** — **done**
Organization, SoftwareApplication, FAQPage on the four pages already eligible,
BreadcrumbList once batch 2 lands.

**22. Per-page social images** — **done**
Generated at build from the page title and its three facts. Every page currently shares
one identical `og.png`.

**23. `llms.txt` and robots** — **done**
A machine-readable summary of what Ordence is, for the retrieval systems that now sit
between a buyer and a search box.

**24. Freshness** — **done**
Last-reviewed dates on the pages where staleness is a real risk, and per-page `lastmod`
in the sitemap instead of one build date.

## Quality

**25. Accessibility pass** — **done**
Full keyboard walk of every page, focus order, the disclosure menu, the form, the
scrollable tables, colour contrast on the new components.

**26. Print stylesheet** — **done**
Someone will print `/pricing`, `/security` and the checklist. Right now they get a black
page and no product screens.

**27. Reduced data and reduced motion** — **done**
`prefers-reduced-motion` is handled; `Save-Data` is not. On a metered Indian connection
the home page should not ship 751KB of three.js uninvited.

**28. Performance budget** — **done**
A build that fails if a document page exceeds 60KB. Drop the nine unused brand SVGs
(68KB shipped to every visitor for nothing). A poster frame so the scene's first paint
is instant.

**29. Design system page** — **done**
Every component on one screen, the twelve tokens named, and the three load-bearing rules
written down. The build already guards one of them; guard the rest.

**30. Analytics and logging scaffolding** — **done**
The event helper, the first-touch record, the KV write in the Worker — all of it written
and inert until you set a key. When you do the setup pass, it starts working with no
code change.

---

## Deferred — needs you

Resend and the sending domain · SPF, DKIM, DMARC · Gmail, Yahoo and Outlook
deliverability testing · the 24 legal blanks · a named customer · your photograph and
LinkedIn · a WhatsApp number · pricing figures · the violet-versus-brass brand decision ·
DNS for ordence.com · Cloudflare Web Analytics · the KV namespace binding · booking
software · Hindi translation review.

---

## What session two actually changed

**16-20, conversion mechanics.** The enquiry form now shows two fields and
reveals the rest on the first keystroke, keeping a partial answer through
a refresh. `/scope` asks twelve questions and hands back a summary the
reader can copy and carry into the form. `/roi` puts a number on the
current way of working and shows the arithmetic. `/contact` gained the
paragraph that says who should not buy this.

**21-24, search and sharing.** Organization, SoftwareApplication and
FAQPage structured data. Twenty-seven per-page social images, generated
from each page's own title and its three facts. `llms.txt`. Last-reviewed
dates on the four pages where staleness is a real risk.

**25, accessibility.** A keyboard walk of every page found 938 problems.
All of them are fixed. The largest were: the search field had no
accessible name on any page, the contents rail scrolled sideways with no
way to scroll it without a mouse, no form field on the site had a visible
focus ring, and every product screen put nine dead links in the tab order
between the two real ones. Seven colours failed AA contrast, including
white on the brand violet at button sizes; the brand keeps its value
everywhere it is decoration and a slightly deeper shade carries white text.

**26-28, weight.** A print stylesheet. Save-Data and 2G and reduced-motion
visitors no longer receive 733KB of three.js — they get a painted poster
frame, which is now also what everyone sees for the first moment before the
engine arrives. Nine unreferenced logo files are no longer deployed. The
build fails if a page, the stylesheet, the script or a cold first load goes
over budget.

**29, the design system.** `/design-system` — internal, noindex, every
component rendered live, the tokens read out of the stylesheet at build
time so the page cannot disagree with what ships, and the five rules this
codebase cannot survive breaking, three of them now enforced by the build.

**30, logging.** The Worker writes enquiries, 404 paths and events to KV,
inert until a namespace is bound. Twenty-one tests, no deploy needed.

One thing worth knowing that was found along the way: the scrim behind
every headline on the home page was clipped by its own box, cutting the
fade off while still two-thirds opaque. Invisible against flat black, and
a hard vertical seam once there was anything behind it.
