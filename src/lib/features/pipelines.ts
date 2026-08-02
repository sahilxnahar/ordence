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
      { id: "r1", title: "Ameya Heights", reference: "Tower B · 3BHK · B-1204", value: 42, owner: "SN", stage: 3, contactRole: "Buyer", note: "Booked after the site visit. Registration slot to be confirmed." },
      { id: "r2", title: "Saymuk Residency", reference: "Tower A · 2BHK · A-0806", value: 18, owner: "AK", stage: 1, contactRole: "Buyer", note: "Wants a corner unit with the revised payment plan." },
      { id: "r3", title: "Vega Estates", reference: "Plot 14 · commercial", value: 9.5, owner: "RM", stage: 0, contactRole: "Channel partner", note: "Partner-sourced. Lead locked to them for 30 days." },
      { id: "r4", title: "Lumen Gardens", reference: "Tower C · 4BHK · C-1701", value: 27, owner: "SN", stage: 2, contactRole: "Buyer", note: "Negotiating the floor-rise premium." },
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
      { id: "r1", title: "Episode 4471", reference: "Orthopaedics · post-op", value: 3.2, owner: "SN", stage: 3, contactRole: "Consultant", note: "Discharged. Physio plan issued for six weeks." },
      { id: "r2", title: "Episode 4488", reference: "Cardiology · diagnostic", value: 1.8, owner: "AK", stage: 1, contactRole: "Referring GP", note: "Awaiting the stress-test slot." },
      { id: "r3", title: "Episode 4502", reference: "Dermatology · review", value: 0.6, owner: "RM", stage: 0, contactRole: "Referring GP", note: "Referral received this morning, unassigned." },
      { id: "r4", title: "Episode 4463", reference: "Orthopaedics · surgical", value: 5.4, owner: "SN", stage: 2, contactRole: "Consultant", note: "Theatre booked; implant reserved from stock." },
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
      { id: "r1", title: "WO-20841", reference: "Assembly · 500 units", value: 22, owner: "SN", stage: 3, contactRole: "Production lead", note: "Completed and inspected. Ready for dispatch." },
      { id: "r2", title: "WO-20867", reference: "Sub-assembly · 1,200 units", value: 14, owner: "AK", stage: 1, contactRole: "Planner", note: "Released. Waiting on a work centre to free up." },
      { id: "r3", title: "WO-20880", reference: "Machining · 300 units", value: 6.5, owner: "RM", stage: 0, contactRole: "Planner", note: "Planned against next month's forecast." },
      { id: "r4", title: "WO-20855", reference: "Finishing · 800 units", value: 18, owner: "SN", stage: 2, contactRole: "Production lead", note: "Running. One tooling change scheduled mid-run." },
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
      { id: "r1", title: "Ameya Heights", reference: "Brand & site rebuild", value: 12, owner: "SN", stage: 3, contactRole: "Marketing head", note: "Delivered and accepted. Retainer discussion open." },
      { id: "r2", title: "Saymuk", reference: "ERP implementation", value: 34, owner: "AK", stage: 2, contactRole: "COO", note: "Phase two running. Two milestones billed." },
      { id: "r3", title: "Vega Logistics", reference: "Data migration", value: 8, owner: "RM", stage: 0, contactRole: "IT manager", note: "Scoping the legacy export." },
      { id: "r4", title: "Lumen Foods", reference: "Automation audit", value: 5.5, owner: "SN", stage: 1, contactRole: "Founder", note: "Proposal sent; awaiting board sign-off." },
    ],
  },
];

export const OWNER_TONE: Record<string, string> = {
  SN: "var(--ordence-violet-700)",
  AK: "#b52d2d",
  RM: "var(--ordence-ink-700)",
};
