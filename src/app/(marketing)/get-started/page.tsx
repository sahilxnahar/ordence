import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { submitRequest } from "@/lib/requests";
import { INDUSTRY_PACKS } from "@/lib/tenant/industries";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Get started — request your workspace",
  description:
    "Tell us about your business and we'll configure an Ordence workspace on your own branded subdomain.",
};

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm placeholder:text-muted-subtle focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2";

const steps = [
  { n: "01", title: "Tell us about your business", body: "Two minutes. No credit card, no sales call required." },
  { n: "02", title: "We configure your workspace", body: "We switch on the modules your industry actually needs — nothing you don't." },
  { n: "03", title: "You're live on your subdomain", body: `yourcompany.${siteConfig.rootDomain}, branded as you, usually within a day.` },
] as const;

export default async function GetStartedPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;

  return (
    <section className="relative overflow-hidden">
      <div className="bg-aurora absolute inset-0" aria-hidden="true" />
      <div className="bg-grain absolute inset-0" aria-hidden="true" />
      <Container className="relative grid gap-14 py-20 lg:grid-cols-[1fr_1.15fr]">
        <div className="space-y-8">
          <span className="kicker rise">Get started</span>
          <h1
            className="type-display rise max-w-md"
            style={{ animationDelay: "120ms" }}
          >
            Your workspace,
            <br />
            <span className="text-gradient-brand font-extrabold">
              configured for you.
            </span>
          </h1>
          <p
            className="rise max-w-md text-lg text-muted"
            style={{ animationDelay: "240ms" }}
          >
            Tell us who you are and what you run. We&apos;ll set up an
            Ordence workspace with the right modules switched on for your
            industry — on your own branded subdomain.
          </p>

          <ol
            className="rise space-y-6 pt-2"
            style={{ animationDelay: "360ms" }}
          >
            {steps.map((s) => (
              <li key={s.n} className="flex gap-5">
                <span className="font-mono text-xs tracking-[0.15em] text-accent">
                  {s.n}
                </span>
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="mt-1 text-sm text-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="corner-caption">Reviewed by a human · usually same day</p>
        </div>

        <div
          className="rise rounded-panel border border-border bg-surface p-8 shadow-mid"
          style={{ animationDelay: "300ms" }}
        >
          {sent ? (
            <div className="flex min-h-96 flex-col items-center justify-center gap-4 text-center">
              <Badge tone="success">Request received</Badge>
              <h2 className="type-h2">
                We&apos;re on it.
              </h2>
              <p className="max-w-xs text-sm text-muted">
                Your request is in our queue. We&apos;ll review your details,
                configure the right modules, and email you the moment your
                workspace is live.
              </p>
              <Button variant="outline" href="/">
                Back to home
              </Button>
            </div>
          ) : (
            <form action={submitRequest} className="space-y-4">
              {error && (
                <p className="rounded-xl bg-danger-soft px-4 py-2.5 text-sm text-danger">
                  Please fill in your name, work email and company.
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="contactName" className="text-sm font-medium">
                    Your name
                  </label>
                  <input
                    id="contactName"
                    name="contactName"
                    required
                    className={inputClass}
                    placeholder="Sahil Nahar"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium">
                    Work email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className={inputClass}
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="company" className="text-sm font-medium">
                    Company
                  </label>
                  <input
                    id="company"
                    name="company"
                    required
                    className={inputClass}
                    placeholder="Acme Industries"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone <span className="text-muted-subtle">(optional)</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    className={inputClass}
                    placeholder="+91 …"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="industry" className="text-sm font-medium">
                    Industry
                  </label>
                  <select id="industry" name="industry" className={inputClass}>
                    <option value="">Select…</option>
                    {INDUSTRY_PACKS.map((i) => (
                      <option key={i.key} value={i.key}>
                        {i.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="teamSize" className="text-sm font-medium">
                    Team size
                  </label>
                  <select id="teamSize" name="teamSize" className={inputClass}>
                    <option value="">Select…</option>
                    <option>1–5</option>
                    <option>6–20</option>
                    <option>21–50</option>
                    <option>51–200</option>
                    <option>200+</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="notes" className="text-sm font-medium">
                  What do you need to run?{" "}
                  <span className="text-muted-subtle">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm placeholder:text-muted-subtle focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
                  placeholder="Inventory across three warehouses, GST invoicing, and a sales pipeline…"
                />
              </div>

              <Button type="submit" variant="accent" className="w-full">
                Request my workspace <span aria-hidden="true">→</span>
              </Button>
              <p className="text-center text-xs text-muted-subtle">
                No credit card. We review every request personally.
              </p>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}
