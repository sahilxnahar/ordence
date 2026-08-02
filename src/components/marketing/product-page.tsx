import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { Magnetic } from "@/components/motion/magnetic";
import { TiltCard } from "@/components/motion/tilt-card";

/**
 * Shared product-page template — one signature layout for /crm, /erp,
 * /ai and /services, so the four pages stay consistent and each file
 * stays tiny. Uses the ASCEND-style kicker + corner captions and the
 * blur-rise cascade for the hero.
 */

export interface ProductPageProps {
  kicker: string;
  titleTop: string;
  titleAccent: string;
  sub: string;
  cta?: string;
  cornerLeft?: string;
  cornerRight?: string;
  features: { title: string; body: string }[];
  children?: React.ReactNode; // optional interactive moment
}

export function ProductPage({
  kicker,
  titleTop,
  titleAccent,
  sub,
  cta = "Talk to us",
  cornerLeft,
  cornerRight,
  features,
  children,
}: ProductPageProps) {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bg-aurora absolute inset-0" aria-hidden="true" />
        <div className="bg-grain absolute inset-0" aria-hidden="true" />
        <Container className="relative flex min-h-[62svh] flex-col items-center justify-center gap-8 py-24 text-center">
          <span className="kicker rise">{kicker}</span>
          <h1
            className="text-display rise max-w-4xl text-5xl font-semibold sm:text-6xl md:text-7xl"
            style={{ animationDelay: "120ms" }}
          >
            {titleTop}
            <br />
            <span className="text-gradient-brand font-extrabold">
              {titleAccent}
            </span>
          </h1>
          <p
            className="rise max-w-xl text-lg text-muted"
            style={{ animationDelay: "260ms" }}
          >
            {sub}
          </p>
          <div className="rise" style={{ animationDelay: "400ms" }}>
            <Magnetic>
              <Button variant="accent" size="lg" href="/contact">
                {cta} <span aria-hidden="true">→</span>
              </Button>
            </Magnetic>
          </div>

          {/* TERRA-style corner captions */}
          {cornerLeft && (
            <span
              className="corner-caption rise absolute bottom-8 left-6 hidden md:block"
              style={{ animationDelay: "560ms" }}
            >
              {cornerLeft}
            </span>
          )}
          {cornerRight && (
            <span
              className="corner-caption rise absolute right-6 bottom-8 hidden md:block"
              style={{ animationDelay: "560ms" }}
            >
              {cornerRight}
            </span>
          )}
        </Container>
      </section>

      {children}

      <section className="border-t border-border bg-surface-subtle">
        <Container className="py-24">
          <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <RevealItem key={f.title}>
                <TiltCard className="group relative h-full rounded-panel border border-border bg-surface p-7 shadow-low transition-shadow hover:shadow-mid">
                  <h3 className="font-semibold transition-colors group-hover:text-accent">
                    {f.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">
                    {f.body}
                  </p>
                </TiltCard>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>
    </>
  );
}
