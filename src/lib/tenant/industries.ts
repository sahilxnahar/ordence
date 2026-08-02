/**
 * Industry packs and the module catalog.
 *
 * The "universal CRM/ERP for every industry" thesis in PRODUCT-VISION.md
 * resolves to this file: one shared platform, plus a preset that decides
 * which modules a given industry starts with. Picking an industry in the
 * approval console pre-fills the module set; the operator can then add or
 * remove anything before activating.
 */

export type ProductKey = "crm" | "erp" | "ai" | "web";

export interface ModuleDef {
  key: string;
  label: string;
  product: ProductKey;
  description: string;
}

/** Every switchable capability, grouped by the product it belongs to. */
export const MODULE_CATALOG: readonly ModuleDef[] = [
  // CRM
  { key: "contacts", label: "Contacts & companies", product: "crm", description: "Unified customer records with full history." },
  { key: "pipeline", label: "Deal pipelines", product: "crm", description: "Kanban stages, forecasting, win/loss capture." },
  { key: "inbox", label: "Omnichannel inbox", product: "crm", description: "Email, WhatsApp and chat in one queue." },
  { key: "quotes", label: "Quotes & e-sign", product: "crm", description: "CPQ, proposals, approvals and signatures." },
  { key: "tickets", label: "Support tickets", product: "crm", description: "SLA timers, knowledge base, CSAT." },
  { key: "campaigns", label: "Campaigns", product: "crm", description: "Email journeys, forms and attribution." },
  // ERP
  { key: "inventory", label: "Inventory & warehouse", product: "erp", description: "Multi-location stock, batches, serials." },
  { key: "procurement", label: "Procurement", product: "erp", description: "Requisitions, POs, vendor scorecards." },
  { key: "manufacturing", label: "Manufacturing", product: "erp", description: "BOMs, work orders, shop floor." },
  { key: "invoicing", label: "Invoicing & GST", product: "erp", description: "E-invoice, e-way bills, payment links." },
  { key: "orders", label: "Orders & shipping", product: "erp", description: "Pick-pack-ship, couriers, returns." },
  { key: "projects", label: "Projects & timesheets", product: "erp", description: "Gantt, budgets, milestone billing." },
  { key: "payroll", label: "HR & payroll", product: "erp", description: "Attendance, leave, PF/ESI payslips." },
  { key: "assets", label: "Assets & maintenance", product: "erp", description: "Asset register, AMC, service schedules." },
  { key: "pos", label: "Point of sale", product: "erp", description: "Counter billing and loyalty." },
  { key: "subscriptions", label: "Subscriptions", product: "erp", description: "Recurring plans, usage billing, dunning." },
  // AI
  { key: "assistant", label: "AI assistant", product: "ai", description: "Summaries, drafts and next-best-action." },
  { key: "insights", label: "AI insights", product: "ai", description: "Risk scoring and natural-language reporting." },
  // Web
  { key: "site", label: "Branded website", product: "web", description: "Marketing site on their own domain." },
  { key: "portal", label: "Customer portal", product: "web", description: "Self-serve invoices, tickets and documents." },
] as const;

export const MODULE_KEYS = MODULE_CATALOG.map((m) => m.key);

export function modulesByProduct(product: ProductKey): ModuleDef[] {
  return MODULE_CATALOG.filter((m) => m.product === product);
}

export interface IndustryPack {
  key: string;
  label: string;
  blurb: string;
  /** Modules switched on by default when this industry is selected. */
  modules: string[];
}

const CORE = ["contacts", "pipeline", "inbox", "assistant"];

export const INDUSTRY_PACKS: readonly IndustryPack[] = [
  {
    key: "real-estate",
    label: "Real Estate",
    blurb: "Inventory of units, site visits, channel partners, payment schedules.",
    modules: [...CORE, "quotes", "invoicing", "projects", "portal", "campaigns"],
  },
  {
    key: "healthcare",
    label: "Healthcare & Clinics",
    blurb: "Appointments, treatment plans, consumables, recall campaigns.",
    modules: [...CORE, "tickets", "invoicing", "inventory", "portal"],
  },
  {
    key: "education",
    label: "Education & Coaching",
    blurb: "Admissions, batches, fee plans with installment dunning.",
    modules: [...CORE, "invoicing", "subscriptions", "campaigns", "portal"],
  },
  {
    key: "financial-services",
    label: "Financial Services",
    blurb: "KYC workflows, renewals, commission reconciliation.",
    modules: [...CORE, "quotes", "invoicing", "tickets", "insights", "portal"],
  },
  {
    key: "retail",
    label: "Retail & D2C",
    blurb: "POS, loyalty, omnichannel orders, variant inventory.",
    modules: [...CORE, "pos", "inventory", "orders", "invoicing", "campaigns", "site"],
  },
  {
    key: "manufacturing",
    label: "Manufacturing & Distribution",
    blurb: "BOMs, work orders, dealer networks, credit control.",
    modules: [...CORE, "manufacturing", "inventory", "procurement", "orders", "invoicing", "assets"],
  },
  {
    key: "hospitality",
    label: "Hospitality & Events",
    blurb: "Venue availability, banquet quotes, advance schedules.",
    modules: [...CORE, "quotes", "invoicing", "projects", "campaigns", "site"],
  },
  {
    key: "legal",
    label: "Legal & Professional Services",
    blurb: "Matters, hearing calendars, time-and-billing, retainers.",
    modules: [...CORE, "projects", "invoicing", "quotes", "portal"],
  },
  {
    key: "logistics",
    label: "Logistics & Transport",
    blurb: "Trips, fleet maintenance, POD-linked invoicing, lane rates.",
    modules: [...CORE, "orders", "assets", "invoicing", "projects"],
  },
  {
    key: "agency",
    label: "Agencies & Studios",
    blurb: "Pitches, retainers, client approvals, scope tracking.",
    modules: [...CORE, "projects", "quotes", "invoicing", "subscriptions", "portal", "site"],
  },
] as const;

export function industryByKey(key: string): IndustryPack | null {
  return INDUSTRY_PACKS.find((i) => i.key === key) ?? null;
}

/**
 * Top-level product flags are derived from the module set rather than
 * stored twice — one source of truth means the CRM badge can never
 * disagree with whether any CRM module is actually enabled.
 */
export function productsFromModules(modules: string[]): Record<ProductKey, boolean> {
  const enabled = new Set(modules);
  const has = (p: ProductKey) =>
    MODULE_CATALOG.some((m) => m.product === p && enabled.has(m.key));
  return { crm: has("crm"), erp: has("erp"), ai: has("ai"), web: has("web") };
}
