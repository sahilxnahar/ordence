import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "coral" | "success";

const tones: Record<Tone, string> = {
  // Text on a *soft tint* needs a darker ink than the same hue on white —
  // hence the "-strong" variants rather than reusing --accent / --danger.
  neutral: "bg-foreground/5 text-muted",
  accent: "bg-accent-soft text-accent-strong",
  coral: "bg-danger-soft text-danger-strong",
  success: "bg-success-soft text-success",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
