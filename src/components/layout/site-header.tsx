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
import { HeaderScroll } from "@/components/layout/header-scroll";

const nav = [
  { href: "/platform", label: "Platform" },
  { href: "/features", label: "Capabilities" },
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
    <header
      data-site-header
      className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl"
    >
      {/*
        The lockup is deliberately oversized — 128px of mark at rest — and
        the bar condenses to roughly half that once you scroll past the
        first screen. That is the only way to have it both ways: an
        unmissable brand statement on arrival, and a header that is not
        still eating a fifth of the viewport on page nine.

        Height and scale are driven by a CSS variable set once by
        HeaderScroll, so the transition is a single compositor-friendly
        animation rather than a class swap that re-lays-out the page.
      */}
      <HeaderScroll />
      <Container className="flex h-[var(--header-h)] items-center justify-between gap-3 transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
        <Link
          href="/"
          aria-label="Ordence home"
          className="group flex items-center gap-4 text-foreground sm:gap-6"
        >
          <LogoMark className="logo-intro size-[var(--logo-mark)] transition-[width,height,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-[360deg] group-hover:duration-700" />
          <LogoWordmark className="h-[var(--logo-word)] transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
          <span className="sr-only">Ordence</span>
        </Link>

        {/*
          The nav sits in normal flow, not absolutely centred.

          Absolute centring looked tidy while the logo was small, but it
          takes the pill out of the layout — so as the lockup grew and a
          fifth nav item was added, the two silently overlapped instead of
          pushing each other apart. In flow, `justify-between` guarantees
          they can never collide at any width or item count.
        */}
        <nav
          aria-label="Primary"
          className="mx-auto hidden shrink-0 items-center gap-0.5 rounded-full border border-border bg-surface p-1.5 shadow-low xl:flex"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap text-muted transition-all duration-200 hover:bg-foreground/[0.06] hover:text-foreground active:scale-95 xl:px-4"
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
            /* Below xl the nav pill and the primary CTA need the room more
               than a secondary link does — Sign in is still one tap away
               inside the mobile sheet and on the CTA's destination. */
            className="hidden whitespace-nowrap xl:inline-flex"
          >
            Sign in
          </Button>
          {/* Responsive visibility sits on a plain wrapper rather than on
              Magnetic itself: layout concerns should not depend on whether
              the component inside happens to set its own display. */}
          <div className="max-sm:hidden">
            <Magnetic strength={0.25}>
              <Button
                variant="accent"
                size="md"
                href="/get-started"
                className="whitespace-nowrap"
              >
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
