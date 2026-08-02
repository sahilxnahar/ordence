import { siteConfig } from "@/config/site";
import Link from "next/link";
import { LogoMark, LogoWordmark } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Container } from "@/components/ui/container";
import { Magnetic } from "@/components/motion/magnetic";
import { CommandPalette } from "@/components/ui/command-palette";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { MobileNav } from "@/components/layout/mobile-nav";

const nav = [
  { href: "/platform", label: "Platform" },
  { href: "/product", label: "Product" },
  { href: "/pricing", label: "Pricing" },
  { href: "/insights", label: "Insights" },
] as const;

/**
 * Marketing chrome — Twenty-inspired: bright white bar, a BIG bold logo,
 * and a clearly-defined center nav (its own bordered pill container),
 * with a magnetic primary CTA.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      <Container className="flex h-28 items-center justify-between gap-4 lg:h-32">
        {/* The brand IS the header, so the lockup gets the height rather
            than the height constraining the lockup: the bar grew to 7rem
            (8rem on desktop) specifically to carry a mark this size with
            air around it. The orbital mark completes a slow turn on
            hover — a living logo, not a sticker. */}
        <Link
          href="/"
          aria-label="Ordence home"
          className="group flex items-center gap-4 text-foreground sm:gap-5"
        >
          <LogoMark className="logo-intro size-[4.25rem] transition-transform duration-700 ease-out group-hover:rotate-[360deg] sm:size-24 lg:size-28" />
          <LogoWordmark className="h-7 sm:h-10 lg:h-11" />
          <span className="sr-only">Ordence</span>
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
          <ScrollProgress />
          <CommandPalette />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="md"
            href={siteConfig.authEntry}
            className="hidden sm:inline-flex"
          >
            Sign in
          </Button>
          {/* Responsive visibility sits on a plain wrapper rather than on
              Magnetic itself: layout concerns should not depend on whether
              the component inside happens to set its own display. */}
          <div className="max-sm:hidden">
            <Magnetic strength={0.25}>
              <Button variant="accent" size="md" href="/get-started">
                Get started
                <span aria-hidden="true">→</span>
              </Button>
            </Magnetic>
          </div>
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
