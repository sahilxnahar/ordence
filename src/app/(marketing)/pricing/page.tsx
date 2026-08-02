import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AccordionItem } from "@/components/ui/accordion";
import { PlanCalculator } from "@/components/marketing/plan-calculator";
import { SpotlightGroup } from "@/components/motion/spotlight-group";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { Magnetic } from "@/components/motion/magnetic";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Plans — quoted to your business",
  description:
    "Three tiers of the Ordence platform. Pricing is quoted against your industry, seat count and modules rather than published as a list.",
};

/*
 * Tiers without numbers.
 *
 * Nothing here is free and nothing here carries a published rate: the
 * commercial position is that we quote against the shape of a business,
 * so a list price on this page would be a promise made before we know
 * anything about the buyer. The tiers still do the job a pricing page
 * has to do — show what changes as you grow, and make it obvious which
 * row you are.
 */
const plans = [
  {
    name: "Launch",
    price: "Quoted",
    period: "per month",
    blurb: "For getting your brand live and leads flowing.",
    features: [
      "Your branded subdomain",
      "CRM core — contacts, pipeline, tasks",
      "Lead-capture forms & inbox",
      "Up to 5 team members",
      "Email support, answered by a person",
    ],
    cta: "Request a quote",
    featured: false,
  },
  {
    name: "Growth",
    price: "Quoted",
    period: "per month",
    blurb: "For teams running the whole business on Ordence.",
    features: [
      "Everything in Launch",
      "ERP — inventory, invoicing (GST-ready)",
      "Automation engine & AI assistant",
      "Custom domain with TLS",
      "Up to 25 team members",
      "Priority support",
    ],
    cta: "Request a quote",
    featured: true,
  },
  {
    name: "Scale",
    price: "Quoted",
    period: "per month",
    blurb: "For multi-entity operations and white-label partners.",
    features: [
      "Everything in Growth",
      "Unlimited members & entities",
      "White-label & agency mode",
      "SSO / SAML, audit exports",
      "Dedicated success manager",
      "Custom development sprints",
    ],
    cta: "Talk to us",
    featured: false,
  },
] as const;

const faqs = [
  {
    q: "Why aren't the prices listed?",
    a: "Because a list price would be a number we picked before knowing anything about you. What you pay depends on your industry pack, your seat count and which modules you actually switch on — so we quote it, in writing, as one fixed figure with nothing conditional underneath. Tell us the shape of your business and you have that number quickly.",
  },
  {
    q: "What happens when I upgrade?",
    a: "Nothing migrates — features switch on in place. Your data, domain and branding stay exactly where they are.",
  },
  {
    q: "Is GST invoicing included?",
    a: "Growth includes GST-ready invoicing, e-invoice and e-way bill support as first-class features — built for Indian businesses, not adapted for them.",
  },
  {
    q: "Do you build websites too?",
    a: "Yes — our studio ships enterprise sites wired into your CRM from day one. Website packages can be added to any plan.",
  },
] as const;

export default function PricingPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bg-aurora absolute inset-0" aria-hidden="true" />
        <Container className="relative flex flex-col items-center gap-6 pt-20 pb-14 text-center">
          <span className="kicker rise">Plans</span>
          <h1
            className="type-display rise max-w-3xl"
            style={{ animationDelay: "120ms" }}
          >
            One number.
            <br />
            <span className="text-gradient-brand font-extrabold">
              Nothing underneath it.
            </span>
          </h1>
          <p
            className="rise max-w-lg text-lg text-muted"
            style={{ animationDelay: "240ms" }}
          >
            We quote against your industry, your team size and the modules you
            actually switch on — then hold that figure. No per-feature
            nickel-and-diming, and no charge for the modules your industry
            needs to work at all.
          </p>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <SpotlightGroup>
            <RevealGroup className="grid items-stretch gap-5 lg:grid-cols-3">
            {plans.map((p) => (
              <RevealItem key={p.name} className="h-full">
                <div
                  data-spotlight
                  className={cn(
                    "spotlight relative flex h-full flex-col gap-6 rounded-panel border bg-surface p-8",
                    p.featured
                      ? "border-accent shadow-high"
                      : "border-border shadow-low",
                  )}
                >
                  {p.featured && (
                    <Badge tone="accent" className="absolute -top-3 left-8">
                      Most popular
                    </Badge>
                  )}
                  <div className="space-y-1.5">
                    <h2 className="font-semibold">{p.name}</h2>
                    <p className="type-h1">
                      {p.price}
                      <span className="ml-1 text-sm font-normal text-muted">
                        {p.period}
                      </span>
                    </p>
                    <p className="text-sm text-muted">{p.blurb}</p>
                  </div>
                  <ul className="flex-1 space-y-2.5">
                    {p.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2.5 text-sm text-muted"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand"
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Magnetic strength={0.2} className="block w-full">
                    <Button
                      variant={p.featured ? "accent" : "outline"}
                      className="w-full"
                      href="/contact"
                    >
                      {p.cta}
                    </Button>
                  </Magnetic>
                </div>
              </RevealItem>
            ))}
            </RevealGroup>
          </SpotlightGroup>
        </Container>
      </section>

      <section className="seam">
        <Container className="py-24">
          <PlanCalculator />
        </Container>
      </section>

      <section className="seam">
        <Container className="grid gap-12 py-24 lg:grid-cols-[1fr_1.4fr]">
          <Reveal className="space-y-4">
            <span className="kicker">FAQ</span>
            <h2 className="type-h1">
              The honest
              <br />
              small print.
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
    </>
  );
}
