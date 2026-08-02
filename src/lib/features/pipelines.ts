/**
 * Industry pipelines for the homepage demo.
 *
 * The demo used to show one generic pipeline — Discovery → Proposal →
 * Negotiation → Won — with four invented companies. It is a fine demo of
 * a kanban board and a poor demo of *this* product, because the entire
 * argument is that Ordence arrives already shaped like your industry.
 *
 * So the stages, the records, the fields and the actions all change with
 * the industry. A developer sees units and cost sheets; a clinic sees
 * appointments and consent; a manufacturer sees work orders and QC. The
 * actions are the ones that actually exist in each vertical's workflow,
 * which is what makes the board read as a product rather than a mock-up.
 */

export interface PipelineAction {
  /** Verb shown on the button. */
  label: string;
  /** What the visitor is told happened. Written as a system would say it. */
  result: string;
}

/** A single posting in the record's ledger. Debit/credit, never netted. */
export interface LedgerLine {
  date: string;
  account: string;
  debit?: number;
  credit?: number;
}

/** One instalment in a payment plan. */
export interface PaymentTerm {
  label: string;
  /** Percentage of the total value. */
  percent: number;
  due: string;
  status: "paid" | "raised" | "upcoming";
}

/** A field as it appears on the record itself — the database view. */
export interface DataField {
  label: string;
  value: string;
  /** Marks fields the platform derives rather than a human types. */
  derived?: boolean;
}

export interface PipelineRecord {
  id: string;
  /** Primary line — the customer, patient, order or student. */
  title: string;
  /** Secondary line, scoped to the industry (unit, batch, policy number). */
  reference: string;
  /** Value in lakhs. */
  value: number;
  owner: string;
  stage: number;
  contactRole: string;
  note: string;
  /** The stored record — what a database view of this row looks like. */
  fields: DataField[];
  /** Instalment plan. Empty where the industry does not use one. */
  terms: PaymentTerm[];
  /** Double-entry postings this record has generated so far. */
  ledger: LedgerLine[];
}

export interface IndustryPipeline {
  key: string;
  label: string;
  /** What a record is called here. Drives the record-panel heading. */
  noun: string;
  /** Column headings, in order, with their stage probabilities. */
  stages: { label: string; probability: number }[];
  /** Actions available on a selected record, in workflow order. */
  actions: PipelineAction[];
  records: PipelineRecord[];
  /** The one-line claim shown above the board. */
  claim: string;
}

export const PIPELINES: IndustryPipeline[] = [
  {
    key: "real-estate",
    label: "Real Estate",
    noun: "Booking",
    claim:
      "A booking locks the unit. Two salespeople cannot sell the same flat — the database refuses the second one.",
    stages: [
      { label: "Enquiry", probability: 0.15 },
      { label: "Site visit", probability: 0.4 },
      { label: "Negotiation", probability: 0.7 },
      { label: "Booked", probability: 1 },
    ],
    actions: [
      { label: "Block unit", result: "Unit B-1204 held for 72 hours. Availability updated across every channel." },
      { label: "Send cost sheet", result: "Cost sheet issued with the current payment milestone plan attached." },
      { label: "Schedule site visit", result: "Visit booked; agent assigned and the buyer sent a confirmation." },
      { label: "Raise demand letter", result: "Demand letter generated against the completed construction stage." },
    ],
    records: [
      { id: "r1", title: "Ameya Heights", reference: "Tower B · 3BHK · B-1204", value: 42, owner: "SN", stage: 3, contactRole: "Buyer", note: "Booked after the site visit. Registration slot to be confirmed.", fields: [{ label: "Unit", value: "B-1204 · 1,840 sq ft" }, { label: "Carpet area", value: "1,204 sq ft" }, { label: "Rate", value: "₹12,400 / sq ft" }, { label: "Agreement value", value: "₹42,00,000", derived: true }, { label: "GST @5%", value: "₹2,10,000", derived: true }, { label: "Stamp duty", value: "₹2,52,000", derived: true }, { label: "Source", value: "Walk-in" }, { label: "Booked on", value: "12 Jul 2026" }], terms: [{ label: "On booking", percent: 10, due: "12 Jul 2026", status: "paid" }, { label: "Agreement", percent: 20, due: "26 Jul 2026", status: "paid" }, { label: "Plinth", percent: 30, due: "14 Sep 2026", status: "raised" }, { label: "Slab 7", percent: 25, due: "20 Dec 2026", status: "upcoming" }, { label: "Possession", percent: 15, due: "30 Apr 2027", status: "upcoming" }], ledger: [{ date: "12 Jul", account: "Bank — booking advance", debit: 420000 }, { date: "12 Jul", account: "Customer advances", credit: 400000 }, { date: "12 Jul", account: "GST output payable", credit: 20000 }, { date: "26 Jul", account: "Bank — agreement instalment", debit: 840000 }, { date: "26 Jul", account: "Customer advances", credit: 840000 }] },
      { id: "r2", title: "Saymuk Residency", reference: "Tower A · 2BHK · A-0806", value: 18, owner: "AK", stage: 1, contactRole: "Buyer", note: "Wants a corner unit with the revised payment plan.", fields: [{ label: "Unit", value: "A-0806 · 1,180 sq ft" }, { label: "Carpet area", value: "784 sq ft" }, { label: "Rate", value: "₹11,900 / sq ft" }, { label: "Quoted value", value: "₹18,00,000", derived: true }, { label: "Floor-rise", value: "₹64,000", derived: true }, { label: "Source", value: "99acres" }, { label: "Lead age", value: "6 days", derived: true }], terms: [{ label: "On booking", percent: 10, due: "On agreement", status: "upcoming" }, { label: "Agreement", percent: 20, due: "+14 days", status: "upcoming" }, { label: "Plinth", percent: 30, due: "Q4 2026", status: "upcoming" }, { label: "Possession", percent: 40, due: "Q3 2027", status: "upcoming" }], ledger: [] },
      { id: "r3", title: "Vega Estates", reference: "Plot 14 · commercial", value: 9.5, owner: "RM", stage: 0, contactRole: "Channel partner", note: "Partner-sourced. Lead locked to them for 30 days.", fields: [{ label: "Plot", value: "14 · commercial" }, { label: "Area", value: "2,400 sq ft" }, { label: "Indicative value", value: "₹9,50,000", derived: true }, { label: "Partner", value: "Vega Realty" }, { label: "Lead lock", value: "30 days", derived: true }, { label: "Commission", value: "2% + TDS 5%", derived: true }], terms: [], ledger: [] },
      { id: "r4", title: "Lumen Gardens", reference: "Tower C · 4BHK · C-1701", value: 27, owner: "SN", stage: 2, contactRole: "Buyer", note: "Negotiating the floor-rise premium.", fields: [{ label: "Unit", value: "C-1701 · 2,460 sq ft" }, { label: "Carpet area", value: "1,620 sq ft" }, { label: "Rate", value: "₹13,100 / sq ft" }, { label: "Quoted value", value: "₹27,00,000", derived: true }, { label: "Floor-rise", value: "₹1,70,000", derived: true }, { label: "Discount sought", value: "2.5%" }], terms: [{ label: "On booking", percent: 10, due: "Pending", status: "upcoming" }, { label: "Agreement", percent: 20, due: "Pending", status: "upcoming" }, { label: "Construction", percent: 55, due: "Staged", status: "upcoming" }, { label: "Possession", percent: 15, due: "Q2 2028", status: "upcoming" }], ledger: [] },
    ],
  },
  {
    key: "healthcare",
    label: "Healthcare",
    noun: "Episode",
    claim:
      "Clinical records are segmented by role and relationship, so access is a permission rather than a convention.",
    stages: [
      { label: "Referral", probability: 0.2 },
      { label: "Consultation", probability: 0.5 },
      { label: "Treatment", probability: 0.8 },
      { label: "Discharged", probability: 1 },
    ],
    actions: [
      { label: "Check entitlement", result: "Payer coverage confirmed; prior authorisation is not required for this code." },
      { label: "Record consent", result: "Signed consent stored with timestamp and revocation history." },
      { label: "Book follow-up", result: "Follow-up scheduled and added to the practitioner's calendar." },
      { label: "Raise claim", result: "Claim submitted. Denials, if any, open in the denial workbench." },
    ],
    records: [
      { id: "r1", title: "Episode 4471", reference: "Orthopaedics · post-op", value: 3.2, owner: "SN", stage: 3, contactRole: "Consultant", note: "Discharged. Physio plan issued for six weeks.", fields: [{ label: "Pathway", value: "Ortho · post-operative" }, { label: "Practitioner", value: "Dr S. Nair" }, { label: "Payer", value: "Star Health" }, { label: "Policy", value: "SH-4471-22" }, { label: "Billed", value: "₹3,20,000", derived: true }, { label: "Co-pay", value: "₹32,000", derived: true }, { label: "Consent", value: "On file · 12 Jul" }], terms: [{ label: "Payer settlement", percent: 90, due: "On claim", status: "raised" }, { label: "Patient co-pay", percent: 10, due: "At discharge", status: "paid" }], ledger: [{ date: "14 Jul", account: "Bank — patient receipts", debit: 32000 }, { date: "14 Jul", account: "Service revenue", credit: 32000 }, { date: "15 Jul", account: "Insurance receivable", debit: 288000 }, { date: "15 Jul", account: "Service revenue", credit: 288000 }] },
      { id: "r2", title: "Episode 4488", reference: "Cardiology · diagnostic", value: 1.8, owner: "AK", stage: 1, contactRole: "Referring GP", note: "Awaiting the stress-test slot.", fields: [{ label: "Pathway", value: "Cardiology · diagnostic" }, { label: "Practitioner", value: "Dr A. Kapoor" }, { label: "Payer", value: "Self-pay" }, { label: "Estimate", value: "₹1,80,000", derived: true }, { label: "Prior auth", value: "Not required", derived: true }, { label: "Consent", value: "Pending" }], terms: [{ label: "On booking", percent: 30, due: "At scheduling", status: "upcoming" }, { label: "On completion", percent: 70, due: "After report", status: "upcoming" }], ledger: [] },
      { id: "r3", title: "Episode 4502", reference: "Dermatology · review", value: 0.6, owner: "RM", stage: 0, contactRole: "Referring GP", note: "Referral received this morning, unassigned.", fields: [{ label: "Pathway", value: "Dermatology · review" }, { label: "Referred by", value: "Dr R. Menon" }, { label: "Payer", value: "Self-pay" }, { label: "Estimate", value: "₹60,000", derived: true }, { label: "Triage", value: "Routine" }], terms: [], ledger: [] },
      { id: "r4", title: "Episode 4463", reference: "Orthopaedics · surgical", value: 5.4, owner: "SN", stage: 2, contactRole: "Consultant", note: "Theatre booked; implant reserved from stock.", fields: [{ label: "Pathway", value: "Ortho · surgical" }, { label: "Practitioner", value: "Dr S. Nair" }, { label: "Payer", value: "Niva Bupa" }, { label: "Policy", value: "NB-9902-04" }, { label: "Estimate", value: "₹5,40,000", derived: true }, { label: "Implant", value: "Reserved from stock", derived: true }, { label: "Prior auth", value: "Approved 18 Jul" }], terms: [{ label: "Advance", percent: 20, due: "Pre-admission", status: "paid" }, { label: "Payer settlement", percent: 80, due: "On discharge", status: "upcoming" }], ledger: [{ date: "18 Jul", account: "Bank — patient advance", debit: 108000 }, { date: "18 Jul", account: "Customer advances", credit: 108000 }] },
    ],
  },
  {
    key: "manufacturing",
    label: "Manufacturing",
    noun: "Work order",
    claim:
      "Materials are reserved against the order, so a promised date is backed by stock that actually exists.",
    stages: [
      { label: "Planned", probability: 0.2 },
      { label: "Released", probability: 0.5 },
      { label: "In production", probability: 0.85 },
      { label: "Completed", probability: 1 },
    ],
    actions: [
      { label: "Reserve materials", result: "Components reserved against this order; available-to-promise recalculated." },
      { label: "Release to floor", result: "Order dispatched to the work centre with routing and standard times." },
      { label: "Log QC result", result: "Inspection recorded. A failure would quarantine the batch automatically." },
      { label: "Backflush", result: "Consumption posted from completed output; WIP value updated in the ledger." },
    ],
    records: [
      { id: "r1", title: "WO-20841", reference: "Assembly · 500 units", value: 22, owner: "SN", stage: 3, contactRole: "Production lead", note: "Completed and inspected. Ready for dispatch.", fields: [{ label: "Item", value: "ASM-4410 · Assembly" }, { label: "Quantity", value: "500 units" }, { label: "Work centre", value: "Line 2" }, { label: "BOM version", value: "v7" }, { label: "Standard cost", value: "₹4,400 / unit", derived: true }, { label: "Order value", value: "₹22,00,000", derived: true }, { label: "QC", value: "Passed · 2 Aug" }], terms: [{ label: "Advance", percent: 30, due: "On release", status: "paid" }, { label: "On dispatch", percent: 60, due: "Net 15", status: "raised" }, { label: "Retention", percent: 10, due: "After 90 days", status: "upcoming" }], ledger: [{ date: "22 Jul", account: "Raw material consumed", debit: 1480000 }, { date: "22 Jul", account: "Inventory — raw", credit: 1480000 }, { date: "30 Jul", account: "Work in progress", debit: 1480000 }, { date: "2 Aug", account: "Finished goods", debit: 2010000 }, { date: "2 Aug", account: "Work in progress", credit: 2010000 }] },
      { id: "r2", title: "WO-20867", reference: "Sub-assembly · 1,200 units", value: 14, owner: "AK", stage: 1, contactRole: "Planner", note: "Released. Waiting on a work centre to free up.", fields: [{ label: "Item", value: "SUB-2210 · Sub-assembly" }, { label: "Quantity", value: "1,200 units" }, { label: "Work centre", value: "Awaiting" }, { label: "BOM version", value: "v3" }, { label: "Standard cost", value: "₹1,167 / unit", derived: true }, { label: "Order value", value: "₹14,00,000", derived: true }, { label: "Materials", value: "Reserved", derived: true }], terms: [{ label: "Advance", percent: 30, due: "On release", status: "paid" }, { label: "On dispatch", percent: 70, due: "Net 30", status: "upcoming" }], ledger: [{ date: "28 Jul", account: "Bank — advance", debit: 420000 }, { date: "28 Jul", account: "Customer advances", credit: 420000 }] },
      { id: "r3", title: "WO-20880", reference: "Machining · 300 units", value: 6.5, owner: "RM", stage: 0, contactRole: "Planner", note: "Planned against next month's forecast.", fields: [{ label: "Item", value: "MCH-1180 · Machining" }, { label: "Quantity", value: "300 units" }, { label: "Work centre", value: "Unassigned" }, { label: "BOM version", value: "v2" }, { label: "Order value", value: "₹6,50,000", derived: true }, { label: "Source", value: "Forecast" }], terms: [], ledger: [] },
      { id: "r4", title: "WO-20855", reference: "Finishing · 800 units", value: 18, owner: "SN", stage: 2, contactRole: "Production lead", note: "Running. One tooling change scheduled mid-run.", fields: [{ label: "Item", value: "FIN-3320 · Finishing" }, { label: "Quantity", value: "800 units" }, { label: "Work centre", value: "Line 4" }, { label: "BOM version", value: "v5" }, { label: "Order value", value: "₹18,00,000", derived: true }, { label: "Tooling change", value: "Scheduled mid-run" }], terms: [{ label: "Advance", percent: 30, due: "On release", status: "paid" }, { label: "On dispatch", percent: 70, due: "Net 30", status: "upcoming" }], ledger: [{ date: "29 Jul", account: "Raw material consumed", debit: 980000 }, { date: "29 Jul", account: "Inventory — raw", credit: 980000 }] },
    ],
  },
  {
    key: "professional-services",
    label: "Professional Services",
    noun: "Engagement",
    claim:
      "Time, expenses and milestones roll into the same margin figure the moment they are recorded.",
    stages: [
      { label: "Scoping", probability: 0.2 },
      { label: "Proposed", probability: 0.45 },
      { label: "Delivering", probability: 0.85 },
      { label: "Delivered", probability: 1 },
    ],
    actions: [
      { label: "Build the SOW", result: "Statement of work assembled from scope, milestones and acceptance terms." },
      { label: "Assign specialists", result: "Team staffed by capability and availability; utilisation forecast updated." },
      { label: "Bill a milestone", result: "Invoice raised against the approved milestone only — nothing before it." },
      { label: "Check margin", result: "Revenue, labour, expenses and write-offs compared in real time." },
    ],
    records: [
      { id: "r1", title: "Ameya Heights", reference: "Brand & site rebuild", value: 12, owner: "SN", stage: 3, contactRole: "Marketing head", note: "Delivered and accepted. Retainer discussion open.", fields: [{ label: "Engagement", value: "Brand & site rebuild" }, { label: "Rate card", value: "Studio 2026" }, { label: "Budget", value: "₹12,00,000", derived: true }, { label: "Hours logged", value: "412", derived: true }, { label: "Margin", value: "38%", derived: true }, { label: "Accepted", value: "28 Jul" }], terms: [{ label: "Kick-off", percent: 30, due: "04 Jun 2026", status: "paid" }, { label: "Design sign-off", percent: 40, due: "02 Jul 2026", status: "paid" }, { label: "Launch", percent: 30, due: "28 Jul 2026", status: "raised" }], ledger: [{ date: "4 Jun", account: "Bank", debit: 360000 }, { date: "4 Jun", account: "Deferred revenue", credit: 360000 }, { date: "2 Jul", account: "Bank", debit: 480000 }, { date: "2 Jul", account: "Revenue recognised", credit: 720000 }, { date: "28 Jul", account: "Accounts receivable", debit: 360000 }] },
      { id: "r2", title: "Saymuk", reference: "ERP implementation", value: 34, owner: "AK", stage: 2, contactRole: "COO", note: "Phase two running. Two milestones billed.", fields: [{ label: "Engagement", value: "ERP implementation" }, { label: "Rate card", value: "Enterprise 2026" }, { label: "Budget", value: "₹34,00,000", derived: true }, { label: "Hours logged", value: "1,180", derived: true }, { label: "Margin", value: "31%", derived: true }, { label: "Phase", value: "2 of 3" }], terms: [{ label: "Phase 1", percent: 25, due: "12 May 2026", status: "paid" }, { label: "Phase 2", percent: 35, due: "18 Jul 2026", status: "raised" }, { label: "Phase 3", percent: 30, due: "Q4 2026", status: "upcoming" }, { label: "Hypercare", percent: 10, due: "Q1 2027", status: "upcoming" }], ledger: [{ date: "12 May", account: "Bank", debit: 850000 }, { date: "12 May", account: "Revenue recognised", credit: 850000 }, { date: "18 Jul", account: "Accounts receivable", debit: 1190000 }, { date: "18 Jul", account: "Revenue recognised", credit: 1190000 }] },
      { id: "r3", title: "Vega Logistics", reference: "Data migration", value: 8, owner: "RM", stage: 0, contactRole: "IT manager", note: "Scoping the legacy export.", fields: [{ label: "Engagement", value: "Data migration" }, { label: "Rate card", value: "Enterprise 2026" }, { label: "Estimate", value: "₹8,00,000", derived: true }, { label: "Scope", value: "Legacy export + mapping" }, { label: "Status", value: "Scoping" }], terms: [], ledger: [] },
      { id: "r4", title: "Lumen Foods", reference: "Automation audit", value: 5.5, owner: "SN", stage: 1, contactRole: "Founder", note: "Proposal sent; awaiting board sign-off.", fields: [{ label: "Engagement", value: "Automation audit" }, { label: "Rate card", value: "Studio 2026" }, { label: "Estimate", value: "₹5,50,000", derived: true }, { label: "Proposal sent", value: "30 Jul" }, { label: "Decision", value: "Board, 8 Aug" }], terms: [{ label: "On signature", percent: 50, due: "On signature", status: "upcoming" }, { label: "On delivery", percent: 50, due: "+30 days", status: "upcoming" }], ledger: [] },
    ],
  },
];

export const OWNER_TONE: Record<string, string> = {
  SN: "var(--ordence-violet-700)",
  AK: "#b52d2d",
  RM: "var(--ordence-ink-700)",
};
