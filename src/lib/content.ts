/**
 * Content engine v1 — typed content collections. Deliberately code-first:
 * new articles are a PR away, fully typed, zero CMS moving parts. Swap to
 * MDX or a headless CMS when a non-engineer needs the publish button.
 */

export interface Article {
  slug: string;
  title: string;
  description: string;
  date: string;
  readMinutes: number;
  kicker: string;
  body: string[]; // paragraphs
}

export const ARTICLES: Article[] = [
  {
    slug: "speed-to-lead",
    title: "Speed-to-lead is the cheapest revenue you'll ever buy",
    description:
      "Most Indian SMBs answer a new enquiry in hours. The winners answer in seconds — here's why the gap is worth lakhs, and how to close it this week.",
    date: "2026-07-28",
    readMinutes: 5,
    kicker: "Sales operations",
    body: [
      "A lead that gets a call in the first five minutes is dramatically more likely to convert than one called after an hour. Every sales leader has heard some version of this statistic; almost no team acts on it, because acting on it is an infrastructure problem, not a motivation problem.",
      "The enquiry lands in one inbox, gets forwarded to a WhatsApp group, waits for someone to claim it, and by the time a rep dials, the prospect has already spoken to a competitor who answered first. The fix isn't hustle — it's routing. When a form submission, missed call or WhatsApp message becomes an assigned task with an alert in under a second, the first conversation happens while intent is still hot.",
      "This is what Ordence's edge-triggered routing was built for: capacity-aware round-robin, working-hours logic, and an automatic text-back on missed calls. The technology is the easy part. The discipline it enforces — every lead owned by a named person within seconds — is what moves revenue.",
      "Start by measuring one number this week: minutes from enquiry to first human touch. If the median is over fifteen, speed-to-lead is the highest-ROI project on your list.",
    ],
  },
  {
    slug: "gst-invoicing-inside-crm",
    title: "Why GST invoicing belongs inside your CRM, not beside it",
    description:
      "When the deal and the invoice live in different tools, reconciliation becomes a monthly archaeology project. The case for one system of record.",
    date: "2026-07-14",
    readMinutes: 4,
    kicker: "Finance operations",
    body: [
      "The most expensive spreadsheet in most growing businesses is the one that maps 'deals we won' to 'invoices we raised' to 'money that arrived'. Three tools, three truths, one exhausted accountant reconciling them at month-end.",
      "The failure isn't any single tool — it's the seams. A quote edited in the CRM never updates the invoice draft. A credit note raised in the accounting package never reaches the salesperson whose customer is still being dunned. E-invoice and e-way bill requirements add compliance risk to what was already coordination pain.",
      "When the won deal becomes the order becomes the GST-ready invoice in one system, the seams disappear. Payment links close the loop; reconciliation from bank feeds happens against the same records the sales team sees. Month-end stops being archaeology.",
      "If you're evaluating any business software this year, ask one question first: when a deal closes, how many times will a human re-type its details before the cash arrives? The right answer is zero.",
    ],
  },
] as const;

export interface ChangelogEntry {
  date: string;
  title: string;
  tag: "New" | "Improved" | "Platform";
  body: string;
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-08-02",
    title: "Self-serve signup & one-click provisioning",
    tag: "Platform",
    body: "Prospects request a workspace at /get-started; it lands in the operations console with an email alert. Choose their industry to pre-fill modules, set users and duration, and activate — the branded subdomain goes live immediately and the customer is emailed.",
  },
  {
    date: "2026-08-02",
    title: "Plans that expire on their own",
    tag: "Platform",
    body: "Every workspace carries a plan with seats and a term. A lapsed subscription suspends itself the moment it expires — enforced on every read, with no scheduled job to fail.",
  },
  {
    date: "2026-08-02",
    title: "Ten industry packs",
    tag: "New",
    body: "Real Estate, Healthcare, Education, Financial Services, Retail, Manufacturing, Hospitality, Legal, Logistics and Agencies — each preset with the modules that vertical actually runs on.",
  },
  {
    date: "2026-08-02",
    title: "Surfaces split",
    tag: "Platform",
    body: "ordence.com is now purely the marketing site. app.ordence.com is served by the separate CRM application, and the admin console is parked until it can ship behind authentication.",
  },
  {
    date: "2026-08-02",
    title: "Mobile navigation",
    tag: "New",
    body: "A full-height slide-in menu with focus management and Escape-to-close. Fixed a containing-block bug that had trapped the overlay inside the header.",
  },
  {
    date: "2026-08-02",
    title: "Tenant suspension",
    tag: "Platform",
    body: "Suspend or resume any tenant from the Command Grid. Paused workspaces now explain themselves instead of returning a bare 404, and changes propagate within about 15 seconds.",
  },
  {
    date: "2026-08-02",
    title: "Platform health & lead inbox",
    tag: "New",
    body: "Live fleet counts, free-tier budget tracking and module adoption — plus every captured lead, in the admin console.",
  },
  {
    date: "2026-08-02",
    title: "Test suite",
    tag: "Improved",
    body: "16 unit tests covering hostname routing, plus end-to-end scripts for the tenant lifecycle and mobile navigation.",
  },
  {
    date: "2026-08-02",
    title: "Three WebGL showpieces",
    tag: "New",
    body: "The Living Ledger scroll story on the homepage, the draggable Tenant Prism on /platform, and the living Command Room diorama on /product.",
  },
  {
    date: "2026-08-02",
    title: "Admin tenant provisioning",
    tag: "Platform",
    body: "Tenants can now be provisioned from the admin console straight into edge KV — subdomains go live within about a minute.",
  },
  {
    date: "2026-08-02",
    title: "Command palette",
    tag: "New",
    body: "Press ⌘K anywhere on the site to jump between pages.",
  },
  {
    date: "2026-08-01",
    title: "Official Orbital brand system",
    tag: "Improved",
    body: "The full brand kit — colors, inline SVG logo, favicons — now drives every token on the site, light and dark.",
  },
  {
    date: "2026-08-01",
    title: "Twenty-inspired redesign",
    tag: "Improved",
    body: "White canvas, defined pill navigation, interactive tilt cards, marquee, count-up stats and FAQ.",
  },
  {
    date: "2026-08-01",
    title: "Cloudflare Workers deployment",
    tag: "Platform",
    body: "The entire platform ships on Cloudflare's free tier via OpenNext — static-first, KV-cached, globally fast.",
  },
] as const;
