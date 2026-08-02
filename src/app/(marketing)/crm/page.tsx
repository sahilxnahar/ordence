import type { Metadata } from "next";
import { ProductPage } from "@/components/marketing/product-page";

export const metadata: Metadata = {
  title: "CRM — every lead, in line",
  description:
    "Pipelines, relationships and revenue intelligence — routed in under a second, branded as your own.",
};

export default function CrmPage() {
  return (
    <ProductPage
      kicker="Ordence CRM"
      titleTop="Every lead,"
      titleAccent="in line."
      sub="Instant routing, honest pipelines, and an AI that drafts the follow-up before the call ends. A CRM your team will actually open."
      cornerLeft="Speed-to-lead · under 1s"
      cornerRight="No. 001 — Customer OS"
      features={[
        {
          title: "Instant lead routing",
          body: "Edge-triggered assignment with round-robin, capacity caps and working hours — the first touch happens in seconds, not mornings.",
        },
        {
          title: "Pipelines that stay honest",
          body: "Required fields per stage, rotting-deal alerts and win/loss capture keep the forecast something you can say out loud.",
        },
        {
          title: "Omnichannel inbox",
          body: "Email, WhatsApp, calls and web chat in one timeline per customer — with collision detection so nobody replies twice.",
        },
        {
          title: "AI on every screen",
          body: "Summaries, drafts, next-best-action and deal-risk scores — explainable, and always under human approval.",
        },
        {
          title: "Quotes to cash",
          body: "CPQ, e-sign and payment links flow straight into invoicing — a won deal becomes an order without re-typing.",
        },
        {
          title: "Reports leadership reads",
          body: "Dashboards on brand tokens, scheduled to inboxes, drillable to the record. TV mode for the sales floor.",
        },
      ]}
    />
  );
}
