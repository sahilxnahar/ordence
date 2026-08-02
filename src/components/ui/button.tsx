import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Pill-shaped control — the signature Ordence interaction primitive.
 * Server-safe (no client JS); renders <a> when `href` is present.
 */

type Variant = "primary" | "accent" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium " +
  "transition-[background-color,color,box-shadow,transform] duration-200 " +
  "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 " +
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 select-none";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90 shadow-low",
  accent: "bg-brand text-brand-contrast hover:opacity-90 shadow-low",
  outline:
    "border border-border-strong bg-surface text-foreground hover:border-foreground/40 hover:bg-background",
  ghost: "text-foreground hover:bg-foreground/5",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-4 text-sm",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  href,
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], className);
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
