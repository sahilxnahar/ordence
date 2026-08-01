import { cn } from "@/lib/utils";

/**
 * Marquee — infinite horizontal strip (capabilities, client logos).
 * Pure CSS animation (zero JS, server-rendered); pauses on hover;
 * the global reduced-motion kill-switch freezes it automatically.
 * Content is duplicated once — the track translates -50% for a
 * seamless loop.
 */
export function Marquee({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "marquee-paused relative overflow-hidden",
        // soft fade at both edges
        "[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
        className,
      )}
    >
      <div className="animate-marquee flex w-max items-center gap-4 pr-4">
        <div aria-hidden="false" className="flex items-center gap-4">
          {children}
        </div>
        <div aria-hidden="true" className="flex items-center gap-4">
          {children}
        </div>
      </div>
    </div>
  );
}
