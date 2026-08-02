import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { CHANGELOG } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Changelog — what shipped",
  description: "Every meaningful improvement to the Ordence platform, dated.",
};

const tagTone = { New: "accent", Improved: "success", Platform: "neutral" } as const;

export default function ChangelogPage() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-aurora absolute inset-0" aria-hidden="true" />
      <Container className="relative max-w-3xl! py-20">
        <Reveal className="mb-14 space-y-4">
          <span className="kicker">Changelog</span>
          <h1 className="text-display text-5xl font-semibold">
            Shipping is
            <br />
            <span className="text-gradient-brand font-extrabold">the culture.</span>
          </h1>
        </Reveal>
        <RevealGroup className="space-y-0 border-l border-border pl-8">
          {CHANGELOG.map((e) => (
            <RevealItem key={`${e.date}-${e.title}`} className="relative pb-10">
              <span
                aria-hidden="true"
                className="absolute top-1.5 -left-[37px] size-2.5 rounded-full bg-brand ring-4 ring-background"
              />
              <p className="corner-caption mb-2">
                {new Date(e.date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-semibold">{e.title}</h2>
                <Badge tone={tagTone[e.tag]}>{e.tag}</Badge>
              </div>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
                {e.body}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
