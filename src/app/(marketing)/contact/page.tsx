import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { submitLead } from "@/lib/leads";

export const metadata: Metadata = {
  title: "Contact — talk to the team",
  description:
    "Book a demo, scope a website, or ask anything. A human replies within one business day.",
};

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm placeholder:text-muted-subtle focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;

  return (
    <section className="relative overflow-hidden">
      <div className="bg-aurora absolute inset-0" aria-hidden="true" />
      <Container className="relative grid gap-14 py-20 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <span className="kicker rise">Contact</span>
          <h1 className="text-display rise max-w-md text-5xl font-semibold" style={{ animationDelay: "120ms" }}>
            Talk to a human,
            <br />
            <span className="text-gradient-brand font-extrabold">not a funnel.</span>
          </h1>
          <p className="rise max-w-md text-lg text-muted" style={{ animationDelay: "240ms" }}>
            Tell us what you&apos;re building. We reply within one business
            day — usually much faster.
          </p>
          <div className="rise space-y-3 pt-4 text-sm text-muted" style={{ animationDelay: "360ms" }}>
            <p><span className="font-medium text-foreground">Email</span> — hello@ordence.com</p>
            <p><span className="font-medium text-foreground">Response time</span> — under 24 hours, weekdays</p>
            <p className="corner-caption pt-6">Stillness starts within · Ordence Studio</p>
          </div>
        </div>

        <div className="rise rounded-panel border border-border bg-surface p-8 shadow-mid" style={{ animationDelay: "300ms" }}>
          {sent ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-center">
              <Badge tone="success">Message received</Badge>
              <h2 className="text-xl font-semibold">We&apos;ll be in touch.</h2>
              <p className="max-w-xs text-sm text-muted">
                Your message is safely in our queue — expect a reply within one
                business day.
              </p>
              <Button variant="outline" href="/">Back to home</Button>
            </div>
          ) : (
            <form action={submitLead} className="space-y-4">
              {error && (
                <p className="rounded-xl bg-danger-soft px-4 py-2.5 text-sm text-danger">
                  Please add at least your name and email.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-sm font-medium">Name</label>
                  <input id="name" name="name" required className={inputClass} placeholder="Your name" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium">Work email</label>
                  <input id="email" name="email" type="email" required className={inputClass} placeholder="you@company.com" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="company" className="text-sm font-medium">Company</label>
                  <input id="company" name="company" className={inputClass} placeholder="Company name" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="interest" className="text-sm font-medium">Interested in</label>
                  <select id="interest" name="interest" className={inputClass}>
                    <option>CRM</option>
                    <option>ERP</option>
                    <option>AI Services</option>
                    <option>Website Development</option>
                    <option>Everything</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="message" className="text-sm font-medium">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm placeholder:text-muted-subtle focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
                  placeholder="What are you building?"
                />
              </div>
              <Button type="submit" variant="accent" className="w-full">
                Send message <span aria-hidden="true">→</span>
              </Button>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}
