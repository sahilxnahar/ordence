import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Container } from "@/components/ui/container";
import { Magnetic } from "@/components/motion/magnetic";

const nav = [
  { href: "/#platform", label: "Platform" },
  { href: "/#demo", label: "Product" },
  { href: "/#craft", label: "Craft" },
  { href: "/#faq", label: "FAQ" },
] as const;

/**
 * Marketing chrome — Twenty-inspired: bright white bar, a BIG bold logo,
 * and a clearly-defined center nav (its own bordered pill container),
 * with a magnetic primary CTA.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      <Container className="flex h-20 items-center justify-between gap-4">
        {/* Big, bold brand lockup */}
        <Link
          href="/"
          aria-label="Ordence home"
          className="text-foreground transition-transform duration-200 hover:scale-[1.02]"
        >
          <Logo className="gap-3 [&>svg:first-child]:size-12 [&>svg:nth-child(2)]:h-5" />
        </Link>

        {/* Well-defined nav: its own pill surface with a hairline */}
        <nav
          aria-label="Primary"
          className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border border-border bg-surface p-1.5 shadow-low lg:flex"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted transition-all duration-200 hover:bg-foreground/[0.06] hover:text-foreground active:scale-95"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <Button variant="ghost" size="md" href="/auth/login" className="hidden sm:inline-flex">
            Sign in
          </Button>
          <Magnetic strength={0.25}>
            <Button variant="accent" size="md" href="/auth/login">
              Get started
              <span aria-hidden="true">→</span>
            </Button>
          </Magnetic>
        </div>
      </Container>
    </header>
  );
}
