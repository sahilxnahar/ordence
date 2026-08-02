import type { Metadata } from "next";
import { ProductPage } from "@/components/marketing/product-page";

export const metadata: Metadata = {
  title: "Web Development — engineered like this site",
  description:
    "Enterprise websites and products by the team that built ordence.com — edge-deployed, brand-obsessed, wired into your CRM from day one.",
};

export default function ServicesPage() {
  return (
    <ProductPage
      kicker="Web Development"
      titleTop="Engineered by the team"
      titleAccent="that built this site."
      sub="Everything you're looking at — the 3D, the speed, the multi-tenant platform — is our portfolio. We build the same for you, wired into your CRM from the first form."
      cta="Book a site audit"
      cornerLeft="Edge-deployed · sub-second"
      cornerRight="No. 004 — Studio"
      features={[
        { title: "Launch", body: "A fast, beautiful lead-capture site on your Ordence subdomain — live in days, every form feeding your CRM." },
        { title: "Growth", body: "Full marketing site on your own domain: interactive moments, SEO foundations, analytics, content engine." },
        { title: "Custom", body: "Product-grade builds — portals, dashboards, e-commerce — on the same edge architecture as Ordence itself." },
        { title: "Always wired in", body: "Every project ships pre-connected: forms, chat, booking and analytics land in your CRM automatically." },
        { title: "Performance guaranteed", body: "Core Web Vitals in the green as a contractual target, not a hope. Static-first, globally cached." },
        { title: "One team, no handoffs", body: "Design, engineering and the platform under one roof — the site and the software never drift apart." },
      ]}
    />
  );
}
