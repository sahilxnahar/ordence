import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { LazyLampBand } from "@/components/three/lazy";
import { DeferredMount } from "@/components/util/deferred-mount";
import { BandFallback } from "@/components/marketing/band-fallback";

export const metadata: Metadata = {
  title: "About — why Ordence exists",
  description:
    "We believe ambitious businesses deserve software with the craft of the products they admire — built in India, deployed to the world's edge.",
};

const values = [
  {
    title: "Craft over clutter",
    body: "Every screen earns its place. If a feature can't be beautiful and fast, it isn't finished.",
  },
  {
    title: "One system of record",
    body: "Businesses break where tools don't talk. Ordence is one platform so nothing falls between the gaps.",
  },
  {
    title: "Your brand first",
    body: "Our proudest moment is when your customers never notice us — only you, faster and sharper.",
  },
  {
    title: "Built for here, deployed everywhere",
    body: "GST, WhatsApp-first sales and Indian workflows as first-class citizens, served from a global edge network.",
  },
] as const;

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bg-aurora absolute inset-0" aria-hidden="true" />
        <Container className="relative flex min-h-[52svh] flex-col items-center justify-center gap-7 py-24 text-center">
          <span className="kicker rise">About Ordence</span>
          <h1
            className="type-display rise max-w-3xl"
            style={{ animationDelay: "120ms" }}
          >
            Order, engineered
            <br />
            <span className="text-gradient-brand font-extrabold">
              into a product.
            </span>
          </h1>
          <p
            className="rise max-w-xl text-lg text-muted"
            style={{ animationDelay: "240ms" }}
          >
            Ordence began as a studio building software for ambitious Indian
            businesses — and became the platform we always wished they could
            buy: CRM, ERP, AI and web craft in one system, under their brand.
          </p>
        </Container>
      </section>

      <section className="seam">
        <Container className="py-24">
          <RevealGroup className="grid gap-5 sm:grid-cols-2">
            {values.map((v) => (
              <RevealItem
                key={v.title}
                className="group rounded-panel border border-border bg-surface p-8 shadow-low transition-shadow hover:shadow-mid"
              >
                <h3 className="font-semibold transition-colors group-hover:text-accent">
                  {v.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {v.body}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      <DeferredMount
        requireCapableDevice
        placeholder={
          <BandFallback
            eyebrow="Talk to a human"
            title="Someone is actually here."
            glow="amber"
            body="No chatbot maze, no lead-scoring purgatory. Tell us what you're building and a person replies — usually the same day."
          >
            <Button variant="accent" size="lg" href="/contact">
              Build with us <span aria-hidden="true">→</span>
            </Button>
          </BandFallback>
        }
      >
        <LazyLampBand primaryHref="/contact" primaryLabel="Build with us" />
      </DeferredMount>
    </>
  );
}
