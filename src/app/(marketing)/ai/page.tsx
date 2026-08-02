import type { Metadata } from "next";
import { ProductPage } from "@/components/marketing/product-page";
import { CapabilitySection } from "@/components/marketing/capability-panel";
import { LazyConvergenceBand } from "@/components/three/lazy";
import { DeferredMount } from "@/components/util/deferred-mount";
import { BandFallback } from "@/components/marketing/band-fallback";

export const metadata: Metadata = {
  title: "AI — intelligence in the workflow",
  description:
    "Assistants, automation and insight embedded in every Ordence screen — grounded in your data, under your approval.",
};

export default function AiPage() {
  return (
    <ProductPage
      kicker="Ordence AI"
      titleTop="Intelligence in the workflow,"
      titleAccent="not beside it."
      sub="No chatbot bolted to the corner. Ordence AI lives inside the record — summarizing accounts, drafting follow-ups, scoring risk — grounded only in your tenant's data."
      cornerLeft="Grounded · explainable"
      cornerRight="No. 003 — Intelligence OS"
      features={[
        {
          title: "Assistant on every screen",
          body: "“Summarize this account.” “Draft the renewal email.” “What changed this week?” Answered in place, logged to the timeline.",
        },
        {
          title: "Deal & churn risk",
          body: "Explainable scores from engagement signals — with the ‘why’ shown, never a black-box number.",
        },
        {
          title: "Zero-entry philosophy",
          body: "Calls transcribed, emails filed, meetings summarized. The CRM writes itself; your team sells.",
        },
        {
          title: "Answer bot on your KB",
          body: "Customer questions answered from your knowledge base only — cited, contained, and handed to a human on doubt.",
        },
        {
          title: "Natural-language reports",
          body: "“Show deals slipping this month by owner.” A chart appears. Analysts optional.",
        },
        {
          title: "Human-in-the-loop",
          body: "Every outbound AI action can require approval. Per-tenant data boundaries, always.",
        },
      ]}
    >
      <CapabilitySection
        badge="Insight on demand"
        titleLines={["Learn to see", "brilliantly."]}
        body="From raw enquiry to closed deal, Ordence AI turns signals into decisions your team can act on — quietly, precisely, at speed."
        rows={[
          {
            index: "01",
            title: "Real-time vision",
            body: "Reads context as it happens and surfaces what matters before you ask.",
          },
          {
            index: "02",
            title: "Layered insight",
            body: "Moves from rough pipeline to sharp forecast without losing the thread.",
          },
          {
            index: "03",
            title: "Adaptive speed",
            body: "Learns your team's cadence and tightens every pass as you work.",
          },
        ]}
      />
      <DeferredMount
        requireCapableDevice
        placeholder={
          <BandFallback
            eyebrow="Ingest · reason · act"
            title="Signal in. Decision out."
            body="Every enquiry, message and event is pulled into one context window — so the model reasons over your whole business, not a fragment of it."
          />
        }
      >
        <LazyConvergenceBand />
      </DeferredMount>
    </ProductPage>
  );
}
