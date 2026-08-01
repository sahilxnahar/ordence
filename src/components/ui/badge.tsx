import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "coral" | "success";

const tones: Record<Tone, string> = {
  neutral: "bg-foreground/5 text-muted",
  accent: "bg-accent-soft text-accent",
  coral: "bg-danger-soft text-danger",
  success: "bg-success/10 text-success",
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
