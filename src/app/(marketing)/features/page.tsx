import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { FeatureExplorer } from "@/components/marketing/feature-explorer";
import { FEATURES, PACKS } from "@/lib/features/catalog";

export const metadata: Metadata = {
  title: "Capabilities — the whole platform, filtered to you",
  description:
    "500 capabilities across CRM, ERP and 17 industry packs. Pick your industry and see exactly which of them make up your workspace.",
};

export default function FeaturesPage() {
  const horizontal = FEATURES.filter((f) => f.pack === null).length;

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bg-aurora absolute inset-0" aria-hidden="true" />
        <Container className="relative flex flex-col items-start gap-7 py-20 lg:py-24">
          <Reveal>
            <span className="kicker">Capabilities</span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="type-display max-w-3xl">
              One platform.
              <br />
              <span className="text-gradient-brand">Your industry&apos;s shape.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="measure text-lg text-muted">
              {horizontal} horizontal capabilities every workspace carries,
              plus {PACKS.length} industry packs built on the same kernel —{" "}
              {FEATURES.length} in total. Nobody needs all of them, which is
              exactly why the list filters rather than scrolls.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <Button variant="accent" size="lg" href="/get-started">
              Scope your workspace <span aria-hidden="true">→</span>
            </Button>
          </Reveal>
        </Container>
      </section>

      <FeatureExplorer />
    </>
  );
}
