import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ARTICLES } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Insights — operator notes",
  description:
    "Short, specific writing on sales operations, finance and building on the edge — from the Ordence team.",
};

export default function InsightsPage() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-aurora absolute inset-0" aria-hidden="true" />
      <Container className="relative py-20">
        <Reveal className="mb-14 space-y-4">
          <span className="kicker">Insights</span>
          <h1 className="type-display max-w-2xl">
            Operator notes,
            <br />
            <span className="text-gradient-brand font-extrabold">
              not content marketing.
            </span>
          </h1>
        </Reveal>
        <RevealGroup className="grid gap-5 md:grid-cols-2">
          {ARTICLES.map((a) => (
            <RevealItem key={a.slug}>
              <Link
                href={`/insights/${a.slug}`}
                className="group flex h-full flex-col gap-4 rounded-panel border border-border bg-surface p-8 shadow-low transition-shadow hover:shadow-mid"
              >
                <span className="corner-caption">
                  {a.kicker} · {a.readMinutes} min read
                </span>
                <h2 className="type-h2 transition-colors group-hover:text-accent">
                  {a.title}
                </h2>
                <p className="flex-1 text-sm leading-relaxed text-muted">
                  {a.description}
                </p>
                <span className="link-draw text-sm font-medium">Read →</span>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
