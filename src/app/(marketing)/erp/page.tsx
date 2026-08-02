import type { Metadata } from "next";
import { ProductPage } from "@/components/marketing/product-page";

export const metadata: Metadata = {
  title: "ERP — every order, on time",
  description:
    "Inventory, procurement, manufacturing and GST-ready finance — modeled precisely and automated relentlessly.",
};

export default function ErpPage() {
  return (
    <ProductPage
      kicker="Ordence ERP"
      titleTop="Every order,"
      titleAccent="on time."
      sub="From purchase order to proof-of-delivery, with double-entry accounting under everything and India-ready GST built in — not bolted on."
      cornerLeft="Three-way match · always"
      cornerRight="No. 002 — Operations OS"
      features={[
        { title: "Live multi-location stock", body: "Bins, batches, serials and expiry — synced into every quote so promise dates are promises, not guesses." },
        { title: "Procurement with proof", body: "RFQs, vendor scorecards and three-way match (PO ↔ GRN ↔ invoice) close the gap where money leaks." },
        { title: "GST-native finance", body: "E-invoicing, e-way bills, GSTR-ready reports, TDS — statutory India handled in the core ledger, not a plugin." },
        { title: "Manufacturing depth", body: "Multi-level BOMs, work orders, shop-floor terminals and yield tracking for teams that make real things." },
        { title: "Orders end-to-end", body: "Capture from CRM, web or marketplace; pick-pack-ship with courier labels; COD reconciliation without spreadsheets." },
        { title: "Cash-flow foresight", body: "AR/AP aging, dunning that runs itself, and a forecast built from real receivables — not vibes." },
      ]}
    />
  );
}
