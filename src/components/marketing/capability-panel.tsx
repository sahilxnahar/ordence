import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { LazyStrands } from "@/components/react-bits";

/**
 * NovaAI-style cinematic capability section — dark stage, glass panel
 * with numbered rows, white drop-shadowed editorial type. Ordence's
 * Strands provide the living backdrop instead of a borrowed video.
 */

export interface CapabilityRow {
  index: string;
  title: string;
  body: string;
}

export function CapabilitySection({
  badge,
  titleLines,
  body,
  rows,
}: {
  badge: string;
  titleLines: [string, string];
  body: string;
  rows: CapabilityRow[];
}) {
  return (
    <section className="relative overflow-hidden bg-[#0b101b]">
      <LazyStrands className="absolute inset-0 size-full opacity-60" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_42%,transparent_40%,rgba(6,9,14,0.6)_100%)]"
      />
      <Container className="relative grid items-end gap-14 py-24 md:grid-cols-[1.1fr_1fr] md:py-28">
        <div>
          <Reveal>
            <span className="badge-accent-left">{badge}</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-display mt-6 text-4xl font-normal tracking-tight text-white drop-shadow-lg sm:text-6xl">
              {titleLines[0]}
              <br />
              {titleLines[1]}
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-white/80 drop-shadow-md sm:text-base">
              {body}
            </p>
          </Reveal>
          <Reveal delay={0.3} className="mt-8 flex flex-wrap gap-3">
            <Button
              href="/contact"
              className="rounded-full bg-white text-[#0b101b] hover:bg-white/85"
            >
              Run the demo <span aria-hidden="true">→</span>
            </Button>
            <Button
              href="/pricing"
              className="glass-soft rounded-full text-white hover:bg-white/20"
            >
              See pricing
            </Button>
          </Reveal>
        </div>

        <Reveal delay={0.25}>
          <div className="glass-soft w-full max-w-md rounded-2xl px-5 sm:px-6">
            {rows.map((r, i) => (
              <div
                key={r.index}
                className={`group flex gap-5 py-5 ${i < rows.length - 1 ? "border-b border-white/15" : ""}`}
              >
                <span className="font-mono text-[11px] tracking-[0.15em] text-white/55">
                  {r.index}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-base font-medium text-white sm:text-lg">
                    {r.title}
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="size-4 text-white/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/70">
                    {r.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
