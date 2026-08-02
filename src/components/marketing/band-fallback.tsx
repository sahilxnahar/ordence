/**
 * The static form of a dark band.
 *
 * On a phone, a metered connection or with reduced motion requested, this
 * is not a placeholder waiting to be replaced — it is the final, intended
 * composition. So it carries the same copy and the same silhouette as the
 * scene it stands in for, built from two radial gradients and the grain
 * texture already on the page. Zero JavaScript, zero WebGL, no layout
 * shift when the real scene is allowed to take over.
 */

export function BandFallback({
  eyebrow,
  title,
  body,
  glow = "violet",
  height = "tall",
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  body?: string;
  glow?: "violet" | "amber";
  height?: "tall" | "compact";
  children?: React.ReactNode;
}) {
  const amber = glow === "amber";

  return (
    <section
      aria-label={typeof title === "string" ? title : eyebrow}
      className={`relative flex items-center justify-center overflow-hidden ${
        amber ? "bg-[#07090f]" : "bg-[#080c14]"
      } ${height === "tall" ? "min-h-[520px] lg:min-h-[720px]" : "min-h-[420px] lg:min-h-[520px]"}`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: amber
            ? "radial-gradient(35% 55% at 50% 8%, rgba(255,196,120,0.30), transparent 70%), radial-gradient(50% 40% at 50% 95%, rgba(255,170,80,0.14), transparent 70%)"
            : "radial-gradient(38% 42% at 50% 48%, rgba(133,99,238,0.34), transparent 70%), radial-gradient(60% 50% at 50% 100%, rgba(255,92,92,0.10), transparent 70%)",
        }}
      />
      <div aria-hidden="true" className="bg-grain absolute inset-0 opacity-40" />
      <div className="relative w-full max-w-3xl px-6 py-20 text-center">
        <p className="font-mono text-[11px] tracking-[0.24em] text-white/45 uppercase">
          {eyebrow}
        </p>
        <h2 className="type-h2 mt-4 text-white">{title}</h2>
        {body && <p className="measure-narrow mt-5 text-white/60">{body}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
