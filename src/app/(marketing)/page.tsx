import { siteConfig } from "@/config/site";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Marquee } from "@/components/ui/marquee";
import { PipelineDemo } from "@/components/marketing/pipeline-demo";
import { SpotlightGroup } from "@/components/motion/spotlight-group";
import { LogoMark } from "@/components/ui/logo";
import { AccordionItem } from "@/components/ui/accordion";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { Magnetic } from "@/components/motion/magnetic";
import { TiltCard } from "@/components/motion/tilt-card";
import { WordRotate } from "@/components/motion/word-rotate";
import { CountUp } from "@/components/motion/count-up";
import { LazyStrands } from "@/components/react-bits";
import { LazyLedgerSection, LazyLampBand } from "@/components/three/lazy";
import { BandFallback } from "@/components/marketing/band-fallback";
import { DeferredMount } from "@/components/util/deferred-mount";

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
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
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
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
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
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
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
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 6l-5 6 5 6M16 6l5 6-5 6M13.5 4l-3 16" />
      </svg>
    ),
    description:
      "Enterprise sites and products engineered by the team that built this one.",
  },
] as const;

/**
 * Every figure here must be one we can point at and defend.
 *
 * The previous set claimed "99.9% uptime" and "<50ms response" (neither
 * measured) and "100+ branded tenant sites" (we have none yet). Those are
 * exactly the numbers a serious first customer checks, and being caught
 * inventing them costs far more than they could ever win. These four are
 * structural facts about the product — true on day one.
 */
const stats = [
  { value: 4, label: "Products on one system of record" },
  { value: 10, label: "Industry configurations, ready to switch on" },
  {
    value: 60,
    prefix: "<",
    suffix: "s",
    label: "To provision a branded workspace",
  },
  { value: 100, label: "Client domains included, at no extra cost" },
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

/**
 * Static stand-in for the Living Ledger. Not an apology for a missing
 * feature — on a phone this reads as a deliberate dark editorial band,
 * costs nothing, and carries the same line of copy the scene ends on.
 */
function LedgerFallback() {
  return (
    <section
      aria-label="From scattered records to one system"
      className="relative flex h-svh items-center justify-center overflow-hidden bg-[#0b101b]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_45%,rgba(109,69,232,0.22),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="bg-grain absolute inset-0 opacity-40"
      />
      <div className="relative px-6 text-center">
        <p className="text-eyebrow mb-4 text-[#8a94b8]!">One platform</p>
        <p className="type-h1 text-[#f2f4f8]">
          One system. Ordence.
        </p>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      {/* ————— 1 · Hero: rotating headline + magnetic CTAs + strands ————— */}
      <section className="relative overflow-hidden">
        <div className="bg-aurora absolute inset-0" aria-hidden="true" />
        <LazyStrands className="absolute inset-0 size-full opacity-70" />
        <Container className="relative flex min-h-[78svh] flex-col items-start justify-center gap-8 py-24">
          <Reveal>
            <span className="kicker">
              <span className="glow-dot" aria-hidden="true" /> CRM · ERP · Web ·
              AI
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="type-display max-w-4xl">
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
              <Button variant="accent" size="lg" href="/get-started">
                Start building <span aria-hidden="true">→</span>
              </Button>
            </Magnetic>
            <Magnetic strength={0.2}>
              <Button variant="outline" size="lg" href="/#demo">
                See it in action
              </Button>
            </Magnetic>
          </Reveal>

          {/* TERRA-style corner captions */}
          <span className="corner-caption absolute bottom-8 left-6 hidden md:block">
            Ordence · Business OS
          </span>
          <span className="corner-caption absolute right-6 bottom-8 hidden items-center gap-2 md:flex">
            Scroll to organize
            <svg
              viewBox="0 0 24 24"
              className="size-3.5 opacity-70"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 4v16m0 0-5-5m5 5 5-5" />
            </svg>
          </span>
        </Container>

        {/* capability marquee — the fun, always-moving strip */}
        <div className="relative border-t border-border bg-surface/60 py-5 backdrop-blur-sm">
          <Marquee>
            {capabilities.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent"
              >
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-brand"
                />
                {c}
              </span>
            ))}
          </Marquee>
        </div>
      </section>

      {/*
        ————— 1.5 · The Living Ledger: the page's ONE WebGL moment —————
        Two gates, both deliberate:
        · capability — three.js (883 KB) is only fetched on desktop-class
          devices that aren't asking us to save data or reduce motion.
          Phones get the static composition below, which is the right
          experience there rather than a lesser one.
        · viewport — even when allowed, nothing loads until the section
          is approached. The fallback is the same height, so no shift.
      */}
      <DeferredMount requireCapableDevice placeholder={<LedgerFallback />}>
        <LazyLedgerSection />
      </DeferredMount>

      {/*
        ————— 2 · Product demo —————
        The pipeline gets the full container width rather than sharing a
        row with the copy. In a half-column the four stages compress to
        ~100px each, which clips the stage labels and truncates every
        company name — a demo that looks broken argues against the
        product it is meant to sell.
      */}
      <section id="demo" className="border-t border-border bg-surface-subtle">
        <Container className="py-24">
          <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-4">
              <p className="text-eyebrow">Product</p>
              <h2 className="type-h1">
                A CRM that feels like
                <br />
                it was built this year.
              </h2>
            </div>
            <div className="space-y-4">
              <p className="type-body measure-narrow">
                This is not a screenshot. Open a deal, move it between
                stages, and watch the weighted forecast recalculate.
              </p>
              <Button variant="outline" href="/crm">
                Explore the CRM
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <PipelineDemo />
          </Reveal>
        </Container>
      </section>

      {/* ————— 3 · Platform grid: tilt cards with icons ————— */}
      <section id="platform" className="border-t border-border bg-background">
        <Container className="py-24">
          <Reveal className="mb-14 max-w-2xl space-y-4">
            <p className="text-eyebrow">Platform</p>
            <h2 className="type-h1">
              Four products. One system of record.
            </h2>
          </Reveal>
          <SpotlightGroup>
            <RevealGroup className="grid gap-5 sm:grid-cols-2">
            {products.map((p) => (
              <RevealItem key={p.name}>
                <TiltCard
                  data-spotlight
                  className="spotlight group relative h-full rounded-panel border border-border bg-surface p-8 shadow-low transition-shadow duration-300 hover:shadow-mid"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        p.tone === "accent"
                          ? "inline-flex size-11 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
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
          </SpotlightGroup>
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
                {/* Every stat is a whole number now, so no decimals prop. */}
                <CountUp
                  value={s.value}
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
      <section
        id="craft"
        className="relative overflow-hidden border-t border-border bg-background"
      >
        <Container className="grid items-center gap-16 py-24 md:grid-cols-2">
          <div className="space-y-10">
            <Reveal className="space-y-4">
              <p className="text-eyebrow">Craft</p>
              <h2 className="type-h1">
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
                  <p className="text-sm leading-relaxed text-muted">
                    {pr.body}
                  </p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
          {/*
            Previously a second WebGL orb. Removed: two live WebGL
            contexts on one page is a real cost (GPU memory, a second
            render loop, another 880 KB chunk) for decoration that
            repeated what the Living Ledger already says better. A pure
            CSS composition carries the same visual weight for nothing.
          */}
          <Reveal
            delay={0.1}
            className="relative aspect-square max-h-[420px] w-full"
          >
            <div
              aria-hidden="true"
              className="absolute inset-[12%] rounded-full bg-gradient-brand opacity-[0.14] blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full border border-border"
            />
            <div
              aria-hidden="true"
              className="absolute inset-[14%] rounded-full border border-border"
            />
            <div
              aria-hidden="true"
              className="absolute inset-[28%] rounded-full border border-border-strong"
            />
            <LogoMark className="absolute top-1/2 left-1/2 size-24 -translate-x-1/2 -translate-y-1/2 text-foreground" />
          </Reveal>
        </Container>
      </section>

      {/*
        ————— 5.5 · Commitments —————
        This slot held three invented testimonials attributed to made-up
        people. A prospect who asks "who said that?" deserves an answer,
        and an early company caught fabricating social proof loses more
        than the proof was ever worth. Commitments are first-person,
        checkable, and stronger while the logo wall is still empty.
      */}
      <section className="border-t border-border bg-surface-subtle">
        <Container className="py-24">
          <Reveal className="mb-12 flex flex-col items-center gap-4 text-center">
            <span className="kicker">Our commitments</span>
            <h2 className="type-h1 max-w-xl">
              What you can hold us to.
            </h2>
          </Reveal>
          <RevealGroup className="grid gap-5 md:grid-cols-3">
            {[
              {
                title: "A person answers",
                body: "Every request is read by someone on the team, usually the same day. No ticket queue, no bot deflection before a human sees it.",
              },
              {
                title: "Your data leaves when you do",
                body: "Full export, self-serve, any time. Nothing about this platform is designed to make leaving difficult.",
              },
              {
                title: "The price we quote is the price",
                body: "No per-feature surprises after signature, and no charge for the modules your industry needs to work at all.",
              },
            ].map((c) => (
              <RevealItem
                key={c.title}
                className="flex h-full flex-col gap-3 rounded-panel border border-border bg-surface p-8 shadow-low"
              >
                <h3 className="font-semibold">{c.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{c.body}</p>
              </RevealItem>
            ))}
          </RevealGroup>
          <p className="corner-caption mt-10 text-center">
            Named customer stories will appear here as they go live
          </p>
        </Container>
      </section>

      {/* ————— 6 · FAQ: zero-JS interactive accordion ————— */}
      <section id="faq" className="border-t border-border bg-surface-subtle">
        <Container className="grid gap-12 py-24 lg:grid-cols-[1fr_1.4fr]">
          <Reveal className="space-y-4">
            <p className="text-eyebrow">FAQ</p>
            <h2 className="type-h1">
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

      {/*
        ————— 7 · Close: the lamp —————
        After three screens of capability the last note should be human,
        so the closing band is the one calm scene of the set: a filament,
        a cone of light and dust drifting through it. Warm amber against
        the site's violet — the one place the brand palette steps aside.
      */}
      <DeferredMount
        requireCapableDevice
        placeholder={
          <BandFallback
            eyebrow="Your brand. Your domain."
            title="Someone is actually here."
            glow="amber"
            body="Launch on you.ordence.com today and move to your own domain when you're ready. No migration, no downtime — and a person, not a bot, on the other end."
          >
            <Button variant="accent" size="lg" href={siteConfig.authEntry}>
              Talk to us <span aria-hidden="true">→</span>
            </Button>
          </BandFallback>
        }
      >
        <LazyLampBand
          eyebrow="Your brand. Your domain."
          title="Someone is actually here."
          body="Launch on you.ordence.com today and move to your own domain when you're ready. No migration, no downtime — and a person, not a bot, on the other end."
          primaryHref={siteConfig.authEntry}
          primaryLabel="Talk to us"
        />
      </DeferredMount>
    </>
  );
}
