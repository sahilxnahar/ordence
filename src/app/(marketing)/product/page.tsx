import { siteConfig } from "@/config/site";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { Magnetic } from "@/components/motion/magnetic";
import { LazyCommandRoom } from "@/components/three/lazy";

export const metadata: Metadata = {
  title: "Product — your business, live",
  description:
    "Watch Ordence run a business in real time: leads light up the CRM, orders dispatch from the warehouse, invoices grow the revenue tower.",
};

const modules = [
  {
    title: "CRM Quarter",
    body: "Leads route in under a second, pipelines stay honest, and AI drafts the follow-up before you've finished the call.",
  },
  {
    title: "Revenue Tower",
    body: "GST-ready invoicing, payment links, auto-reconciliation. Every payment makes the tower grow — literally, on this page.",
  },
  {
    title: "Warehouse & Dispatch",
    body: "Multi-location stock feeding live promise dates into every quote, with pick-pack-ship and courier tracking built in.",
  },
  {
    title: "Support Studio",
    body: "Omnichannel tickets with SLA timers and a knowledge base published straight to your own domain.",
  },
] as const;

export default function ProductPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bg-aurora absolute inset-0" aria-hidden="true" />
        <Container className="relative flex flex-col items-center gap-7 pt-20 pb-10 text-center">
          <Reveal>
            <Badge tone="accent">CRM + ERP, alive</Badge>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="text-display max-w-3xl text-5xl font-semibold sm:text-6xl">
              This is your business,
              <br />
              <span className="text-gradient-brand">running on Ordence.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="max-w-xl text-lg text-muted">
              A live miniature of a company on Ordence: every light, truck and
              growing tower is a real feature doing real work.
            </p>
          </Reveal>
        </Container>

        {/* The showpiece */}
        <Container className="relative pb-20">
          <Reveal delay={0.1}>
            <LazyCommandRoom />
          </Reveal>
        </Container>
      </section>

      <section className="border-t border-border bg-surface-subtle">
        <Container className="py-24">
          <RevealGroup className="grid gap-5 sm:grid-cols-2">
            {modules.map((m) => (
              <RevealItem
                key={m.title}
                className="group rounded-panel border border-border bg-surface p-8 shadow-low transition-shadow hover:shadow-mid"
              >
                <h3 className="font-semibold transition-colors group-hover:text-accent">
                  {m.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {m.body}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal className="mt-12 flex justify-center">
            <Magnetic>
              <Button variant="accent" size="lg" href={siteConfig.authEntry}>
                Run yours on Ordence <span aria-hidden="true">→</span>
              </Button>
            </Magnetic>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
