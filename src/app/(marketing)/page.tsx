import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Marquee } from "@/components/ui/marquee";
import { AccordionItem } from "@/components/ui/accordion";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { Magnetic } from "@/components/motion/magnetic";
import { TiltCard } from "@/components/motion/tilt-card";
import { WordRotate } from "@/components/motion/word-rotate";
import { CountUp } from "@/components/motion/count-up";
import { LazyCursorGrid, LazyStrands } from "@/components/react-bits";
import { LazyHeroScene, LazyLedgerSection } from "@/components/three/lazy";

export const metadata: Metadata = {
  title: "Ordence — The operating system for ambitious businesses",
  description:
    "CRM, ERP, web development and AI services, unified on one enterprise-grade platform. One codebase, every brand.",
};

/* ————— content data ————— */

const capabilities = [
  "CRM",
  "ERP",
  "AI Agents",
  "Web Development",
  "Automation",
  "Analytics",
  "Multi-tenant",
  "Custom Domains",
  "Edge-first",
  "White-label",
] as const;

const products = [
  {
    name: "CRM",
    tone: "accent" as const,
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="8" r="3.25" />
        <path d="M3.5 19c.7-3 2.9-4.5 5.5-4.5S13.8 16 14.5 19" />
        <path d="M15.5 5.5a3.25 3.25 0 0 1 0 5.9M17.7 14.9c1.5.7 2.5 2 2.9 4.1" />
      </svg>
    ),
    description:
      "Pipeline, relationships and revenue intelligence with an interface your team will actually enjoy.",
  },
  {
    name: "ERP",
    tone: "coral" as const,
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        <path d="M17 13.5v7M13.5 17h7" />
      </svg>
    ),
    description:
      "Operations, inventory and finance — modeled precisely, visualized beautifully, automated relentlessly.",
  },
  {
    name: "AI Services",
    tone: "accent" as const,
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4L12 3Z" />
        <path d="M18.5 15l.9 2.3 2.1.7-2.1.7-.9 2.3-.9-2.3-2.1-.7 2.1-.7.9-2.3Z" />
      </svg>
    ),
    description:
      "Assistants, automation and insight embedded in every workflow, not bolted on beside it.",
  },
  {
    name: "Web Development",
    tone: "coral" as const,
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 6l-5 6 5 6M16 6l5 6-5 6M13.5 4l-3 16" />
      </svg>
    ),
    description:
      "Enterprise sites and products engineered by the team that built this one.",
  },
] as const;

const deals = [
  { company: "Ameyaa Heights", stage: "Won", value: "₹42L", owner: "SN", tone: "success" as const },
  { company: "Northline Retail", stage: "Proposal", value: "₹18L", owner: "AK", tone: "accent" as const },
  { company: "Vega Logistics", stage: "Discovery", value: "₹9.5L", owner: "RM", tone: "neutral" as const },
  { company: "Client X", stage: "Negotiation", value: "₹27L", owner: "SN", tone: "coral" as const },
] as const;

const stats = [
  { value: 99.9, decimals: 1, suffix: "%", label: "Uptime target on Cloudflare's edge" },
  { value: 50, prefix: "<", suffix: "ms", label: "Response time, served near your users" },
  { value: 100, suffix: "+", label: "Branded tenant sites from one codebase" },
  { value: 4, label: "Products on one system of record" },
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

const faqs = [
  {
    q: "Can my clients use their own domain?",
    a: "Yes. Every client starts on their own subdomain (client.ordence.com) and can attach a fully custom domain — with HTTPS handled automatically. No migration, no downtime.",
  },
  {
    q: "Is each client's branding really isolated?",
    a: "Completely. Colors, logo, and configuration are scoped per tenant. Two clients on the same platform never see a pixel of each other.",
  },
  {
    q: "What does Ordence run on?",
    a: "Next.js on Cloudflare's global edge network — the same infrastructure class used by the fastest products on the internet, with static-first pages that load instantly.",
  },
  {
    q: "Can we start small and grow?",
    a: "That's the design. Start with one product — CRM, ERP, AI or a website — and switch on the rest when you're ready. Everything shares one system of record.",
  },
] as const;

/* ————— page ————— */

export default function HomePage() {
  return (
    <>
      {/* ————— 1 · Hero: rotating headline + magnetic CTAs + strands ————— */}
      <section className="relative overflow-hidden">
        <div className="bg-aurora absolute inset-0" aria-hidden="true" />
        <LazyStrands className="absolute inset-0 size-full opacity-70" />
        <Container className="relative flex min-h-[78svh] flex-col items-start justify-center gap-8 py-24">
          <Reveal>
            <Badge tone="accent">CRM · ERP · Web · AI — one platform</Badge>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="text-display max-w-4xl text-5xl font-semibold sm:text-6xl md:text-7xl">
              The operating system for ambitious{" "}
              <WordRotate
                words={["businesses.", "founders.", "brands.", "teams."]}
                className="text-gradient-brand"
              />
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="max-w-xl text-lg text-muted">
              Ordence unifies your customers, operations and intelligence on one
              enterprise-grade platform — under your brand, on your domain.
            </p>
          </Reveal>
          <Reveal delay={0.24} className="flex flex-wrap items-center gap-3">
            <Magnetic>
              <Button variant="accent" size="lg" href="/auth/login">
                Start building <span aria-hidden="true">→</span>
              </Button>
            </Magnetic>
            <Magnetic strength={0.2}>
              <Button variant="outline" size="lg" href="/#demo">
                See it in action
              </Button>
            </Magnetic>
          </Reveal>
        </Container>

        {/* capability marquee — the fun, always-moving strip */}
        <div className="relative border-t border-border bg-surface/60 py-5 backdrop-blur-sm">
          <Marquee>
            {capabilities.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent"
              >
                <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
                {c}
              </span>
            ))}
          </Marquee>
        </div>
      </section>

      {/* ————— 1.5 · The Living Ledger: flagship scroll story ————— */}
      <LazyLedgerSection />

      {/* ————— 2 · Product demo: live-feeling CRM card in a tilt frame ————— */}
      <section id="demo" className="border-t border-border bg-surface-subtle">
        <Container className="grid items-center gap-12 py-24 lg:grid-cols-[1fr_1.2fr]">
          <Reveal className="space-y-5">
            <p className="text-eyebrow">Product</p>
            <h2 className="text-display text-3xl font-semibold sm:text-4xl">
              A CRM that feels like
              <br />
              it was built this year.
            </h2>
            <p className="max-w-md text-muted">
              Fast tables, clean pipelines, zero clutter. Hover the card — the
              whole interface is this responsive.
            </p>
            <Button variant="outline" href="/auth/login">
              Explore the CRM
            </Button>
          </Reveal>

          <Reveal delay={0.1}>
            <TiltCard className="group relative rounded-panel border border-border bg-surface p-2 shadow-mid">
              <div className="overflow-hidden rounded-[calc(var(--radius-panel)-0.5rem)] border border-border">
                {/* window chrome */}
                <div className="flex items-center gap-1.5 border-b border-border bg-surface-subtle px-4 py-3">
                  <span className="size-2.5 rounded-full bg-coral-400" />
                  <span className="size-2.5 rounded-full bg-warning/60" />
                  <span className="size-2.5 rounded-full bg-success/60" />
                  <span className="ml-3 text-xs text-muted-subtle">
                    app.ordence.com — Deals
                  </span>
                </div>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs tracking-wider text-muted uppercase">
                      <th className="px-4 py-2.5 font-medium">Company</th>
                      <th className="px-4 py-2.5 font-medium">Stage</th>
                      <th className="px-4 py-2.5 font-medium">Value</th>
                      <th className="px-4 py-2.5 font-medium">Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map((d) => (
                      <tr
                        key={d.company}
                        className="border-b border-border bg-surface transition-colors last:border-0 hover:bg-accent-soft/60"
                      >
                        <td className="px-4 py-3 font-medium">{d.company}</td>
                        <td className="px-4 py-3">
                          <Badge tone={d.tone}>{d.stage}</Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{d.value}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex size-7 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-contrast">
                            {d.owner}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TiltCard>
          </Reveal>
        </Container>
      </section>

      {/* ————— 3 · Platform grid: tilt cards with icons ————— */}
      <section id="platform" className="border-t border-border bg-background">
        <Container className="py-24">
          <Reveal className="mb-14 max-w-2xl space-y-4">
            <p className="text-eyebrow">Platform</p>
            <h2 className="text-display text-3xl font-semibold sm:text-4xl">
              Four products. One system of record.
            </h2>
          </Reveal>
          <RevealGroup className="grid gap-5 sm:grid-cols-2">
            {products.map((p) => (
              <RevealItem key={p.name}>
                <TiltCard className="group relative h-full rounded-panel border border-border bg-surface p-8 shadow-low transition-shadow duration-300 hover:shadow-mid">
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        p.tone === "accent"
                          ? "inline-flex size-11 items-center justify-center rounded-2xl bg-accent-soft text-accent transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
                          : "inline-flex size-11 items-center justify-center rounded-2xl bg-danger-soft text-danger transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"
                      }
                    >
                      {p.icon}
                    </span>
                    <h3 className="text-lg font-semibold">{p.name}</h3>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-muted">
                    {p.description}
                  </p>
                  <span className="link-draw mt-6 inline-block text-sm font-medium text-foreground">
                    Learn more →
                  </span>
                </TiltCard>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* ————— 4 · Stats band: numbers that count themselves up ————— */}
      <section className="border-t border-border bg-surface-subtle">
        <Container className="grid grid-cols-2 gap-px overflow-hidden rounded-none py-16 md:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="group flex flex-col gap-2 border-l border-border px-6 first:border-0 max-md:[&:nth-child(3)]:border-0 max-md:[&:nth-child(n+3)]:mt-10"
            >
              <span className="text-display text-4xl font-semibold text-foreground transition-colors duration-300 group-hover:text-accent sm:text-5xl">
                <CountUp
                  value={s.value}
                  decimals={"decimals" in s ? s.decimals : 0}
                  prefix={"prefix" in s ? s.prefix : ""}
                  suffix={"suffix" in s ? s.suffix : ""}
                />
              </span>
              <span className="text-sm text-muted">{s.label}</span>
            </div>
          ))}
        </Container>
      </section>

      {/* ————— 5 · Craft: 3D focal object + principles ————— */}
      <section id="craft" className="relative overflow-hidden border-t border-border bg-background">
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
                <RevealItem key={pr.title} className="group space-y-1.5">
                  <h3 className="font-medium transition-colors duration-200 group-hover:text-accent">
                    {pr.title}
                  </h3>
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

      {/* ————— 6 · FAQ: zero-JS interactive accordion ————— */}
      <section id="faq" className="border-t border-border bg-surface-subtle">
        <Container className="grid gap-12 py-24 lg:grid-cols-[1fr_1.4fr]">
          <Reveal className="space-y-4">
            <p className="text-eyebrow">FAQ</p>
            <h2 className="text-display text-3xl font-semibold sm:text-4xl">
              Questions,
              <br />
              answered.
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="rounded-panel border border-border bg-surface px-6 shadow-low sm:px-8">
              {faqs.map((f) => (
                <AccordionItem key={f.q} question={f.q}>
                  {f.a}
                </AccordionItem>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ————— 7 · CTA: CursorGrid playground ————— */}
      <section id="services" className="relative border-t border-border bg-background">
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
            <Magnetic>
              <Button variant="primary" size="lg" href="/auth/login">
                Talk to us <span aria-hidden="true">→</span>
              </Button>
            </Magnetic>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
