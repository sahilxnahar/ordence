import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { LazyCursorGrid, LazyStrands } from "@/components/react-bits";
import { LazyHeroScene } from "@/components/three/lazy";

export const metadata: Metadata = {
  title: "Ordence — The operating system for ambitious businesses",
  description:
    "CRM, ERP, web development and AI services, unified on one enterprise-grade platform. One codebase, every brand.",
};

const products = [
  {
    name: "CRM",
    tone: "accent" as const,
    description:
      "Pipeline, relationships and revenue intelligence with an interface your team will actually enjoy.",
  },
  {
    name: "ERP",
    tone: "coral" as const,
    description:
      "Operations, inventory and finance — modeled precisely, visualized beautifully, automated relentlessly.",
  },
  {
    name: "AI Services",
    tone: "accent" as const,
    description:
      "Assistants, automation and insight embedded in every workflow, not bolted on beside it.",
  },
  {
    name: "Web Development",
    tone: "coral" as const,
    description:
      "Enterprise sites and products engineered by the team that built this one.",
  },
] as const;

const principles = [
  {
    title: "One codebase, every brand",
    body: "Multi-tenant to the core: each client gets isolated branding, domains and permissions on shared, battle-tested infrastructure.",
  },
  {
    title: "Edge-first by design",
    body: "Rendered and routed at the network edge. Fast in Mumbai, fast in Munich — without a single dedicated server.",
  },
  {
    title: "Craft as a feature",
    body: "Hairline borders, engineered type, restrained motion. The interface is part of the product, not decoration around it.",
  },
] as const;

export default function HomePage() {
  return (
    <>
      {/* ————— Hero: Strands atmosphere + editorial display type ————— */}
      <section className="relative overflow-hidden">
        <div className="bg-aurora absolute inset-0" aria-hidden="true" />
        <LazyStrands className="absolute inset-0 size-full" />
        <Container className="relative flex min-h-[82svh] flex-col items-start justify-center gap-8 py-28">
          <Reveal>
            <Badge tone="accent">CRM · ERP · Web · AI</Badge>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="text-display max-w-3xl text-5xl font-semibold sm:text-6xl md:text-7xl">
              The operating system for{" "}
              <span className="text-gradient-brand">ambitious</span> businesses.
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="max-w-xl text-lg text-muted">
              Ordence unifies your customers, operations and intelligence on one
              enterprise-grade platform — under your brand, on your domain.
            </p>
          </Reveal>
          <Reveal delay={0.24} className="flex flex-wrap gap-3">
            <Button variant="accent" size="lg" href="/auth/login">
              Start building
            </Button>
            <Button variant="outline" size="lg" href="/#platform">
              Explore the platform
            </Button>
          </Reveal>
        </Container>
      </section>

      {/* ————— Platform grid ————— */}
      <section id="platform" className="border-t border-border bg-surface">
        <Container className="py-24">
          <Reveal className="mb-14 max-w-2xl space-y-4">
            <p className="text-eyebrow">Platform</p>
            <h2 className="text-display text-3xl font-semibold sm:text-4xl">
              Four products. One system of record.
            </h2>
          </Reveal>
          <RevealGroup className="grid gap-px overflow-hidden rounded-panel border border-border bg-border sm:grid-cols-2">
            {products.map((p) => (
              <RevealItem
                key={p.name}
                className="group bg-surface p-8 transition-colors hover:bg-background"
              >
                <Badge tone={p.tone}>{p.name}</Badge>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  {p.description}
                </p>
                <span className="mt-6 inline-block text-sm font-medium text-foreground transition-transform duration-200 group-hover:translate-x-1">
                  Learn more →
                </span>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* ————— Craft: 3D focal object + principles ————— */}
      <section id="craft" className="relative overflow-hidden border-t border-border">
        <Container className="grid items-center gap-16 py-24 md:grid-cols-2">
          <div className="space-y-10">
            <Reveal className="space-y-4">
              <p className="text-eyebrow">Craft</p>
              <h2 className="text-display text-3xl font-semibold sm:text-4xl">
                Engineered like infrastructure.
                <br />
                Finished like a product you love.
              </h2>
            </Reveal>
            <RevealGroup className="space-y-8">
              {principles.map((pr) => (
                <RevealItem key={pr.title} className="space-y-1.5">
                  <h3 className="font-medium">{pr.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{pr.body}</p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
          <div className="relative aspect-square max-h-[480px] w-full">
            <LazyHeroScene className="absolute! inset-0" />
          </div>
        </Container>
      </section>

      {/* ————— Interactive CTA: CursorGrid background ————— */}
      <section id="services" className="relative border-t border-border bg-surface">
        <LazyCursorGrid className="absolute inset-0 size-full" />
        <Container className="relative flex flex-col items-center gap-6 py-28 text-center">
          <Reveal>
            <h2 className="text-display max-w-2xl text-3xl font-semibold sm:text-5xl">
              Your brand. Your domain.
              <br />
              Our engineering.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-md text-muted">
              Launch on you.ordence.com today — move to your own domain when
              you&apos;re ready. No migration, no downtime.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <Button variant="primary" size="lg" href="/auth/login">
              Talk to us
            </Button>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
