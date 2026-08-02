import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ARTICLES } from "@/lib/content";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) return { title: "Not found" };
  return { title: article.title, description: article.description };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) notFound();

  return (
    <article className="relative overflow-hidden">
      <div className="bg-aurora absolute inset-0" aria-hidden="true" />
      <Container className="relative max-w-3xl! py-20">
        <header className="mb-12 space-y-5">
          <span className="kicker">{article.kicker}</span>
          <h1 className="text-display text-4xl font-semibold sm:text-5xl">
            {article.title}
          </h1>
          <p className="corner-caption">
            {new Date(article.date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            · {article.readMinutes} min read · Ordence Team
          </p>
        </header>
        <div className="space-y-6">
          {article.body.map((p, i) => (
            <p
              key={i}
              className="text-[1.05rem] leading-[1.8] text-foreground/85"
            >
              {p}
            </p>
          ))}
        </div>
        <footer className="mt-14 flex flex-wrap items-center gap-4 border-t border-border pt-8">
          <Button variant="accent" href="/contact">
            Put this to work <span aria-hidden="true">→</span>
          </Button>
          <Button variant="ghost" href="/insights">
            ← All insights
          </Button>
        </footer>
      </Container>
    </article>
  );
}
