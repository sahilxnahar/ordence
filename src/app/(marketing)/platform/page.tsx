import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { Magnetic } from "@/components/motion/magnetic";
import { LazyTenantPrism } from "@/components/three/lazy";
import { ThemePreview } from "@/components/marketing/theme-preview";
import { DeferredMount } from "@/components/util/deferred-mount";

export const metadata: Metadata = {
  title: "Platform — one codebase, every brand",
  description:
    "Ordence's multi-tenant platform gives every client an isolated, branded environment — their subdomain or custom domain — on one edge-deployed codebase.",
};

const pillars = [
  {
    title: "Provisioned in seconds",
    body: "A new tenant gets a live, branded subdomain — ameyaa.ordence.com — in under a minute. No servers, no tickets.",
  },
  {
    title: "Custom domains, automatic TLS",
    body: "Clients graduate to their own domain whenever they're ready. Certificates issue automatically; nothing migrates.",
  },
  {
    title: "Isolated by architecture",
    body: "Branding, configuration, permissions and data are scoped per tenant at the edge — isolation is structural, not policy.",
  },
  {
    title: "White-label to the pixel",
    body: "One accent token repaints buttons, charts, focus rings, everything. Your client's customers only ever see your client.",
  },
] as const;

export default function PlatformPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bg-aurora absolute inset-0" aria-hidden="true" />
        <Container className="relative grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col items-start gap-7">
            <Reveal>
              <Badge tone="accent">Multi-tenant platform</Badge>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="type-display max-w-xl">
                One codebase.
                <br />
                <span className="text-gradient-brand">Every brand.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="max-w-md text-lg text-muted">
                One beam of engineering goes in. Fully-branded client platforms
                come out — each on its own domain, each completely isolated.
                Spin the prism.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <Magnetic>
                <Button variant="accent" size="lg" href="/get-started">
                  Provision a tenant <span aria-hidden="true">→</span>
                </Button>
              </Magnetic>
            </Reveal>
          </div>

          {/* The showpiece */}
          {/*
            Same capability gate as the homepage: phones and data-saver
            users get the static brand composition rather than 883 KB of
            three.js for a decorative prism. The live theme repainter
            below is the interactive proof on those devices.
          */}
          <Reveal delay={0.1}>
            <DeferredMount
              requireCapableDevice
              placeholder={
                <div
                  aria-hidden="true"
                  className="aspect-[4/3] w-full rounded-panel border border-border bg-gradient-brand opacity-[0.10] blur-2xl"
                />
              }
            >
              <LazyTenantPrism />
            </DeferredMount>
          </Reveal>
        </Container>
      </section>

      {/*
        The magnetosphere band used to sit here. Removed: on this page it
        restated what the Tenant Prism above already shows interactively,
        and a second full-height scene between two of them made the page
        feel padded rather than rich. The scene still earns its place on
        tenant workspaces, where it renders in that customer's own colour
        and is therefore about them rather than about us.
      */}
      {/* Live theme repainter — the pitch as a toy */}
      <section className="seam">
        <Container className="py-24">
          <ThemePreview />
        </Container>
      </section>

      <section className="seam">
        <Container className="py-24">
          <RevealGroup className="grid gap-5 sm:grid-cols-2">
            {pillars.map((p) => (
              <RevealItem
                key={p.title}
                className="group rounded-panel border border-border bg-surface p-8 shadow-low transition-shadow hover:shadow-mid"
              >
                <h3 className="font-semibold transition-colors group-hover:text-accent">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {p.body}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>
    </>
  );
}
