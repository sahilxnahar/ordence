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
  { href: "/pricing", label: "Plans" },
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
        The lockup is deliberately oversized — 256px of mark at rest on
        desktop — and the bar condenses to about a fifth of that once you
        scroll past the first screen. That is the only way to have it both
        ways: an unmissable brand statement on arrival, and a header that
        is not still eating a third of the viewport on page nine.

        At that size the nav cannot share a row with it, so on desktop the
        pill drops to its own line beneath the lockup. Squeezing the brand
        back down until a five-item nav fit would have been solving the
        wrong problem.

        Height and scale are driven by CSS variables set once by
        HeaderScroll, so the transition is a single compositor-friendly
        animation rather than a class swap that re-lays-out the page.
      */}
      <HeaderScroll />
      <Container className="flex h-[var(--header-h)] items-center justify-between gap-3 transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] xl:h-auto xl:flex-col xl:items-stretch xl:gap-0 xl:py-4">
        <div className="flex w-full items-center justify-between gap-3">
        <Link
          href="/"
          aria-label="Ordence home"
          className="group flex items-center gap-4 text-foreground sm:gap-6"
        >
          <LogoMark className="logo-intro size-[var(--logo-mark)] transition-[width,height,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-[360deg] group-hover:duration-700" />
          <LogoWordmark className="h-[var(--logo-word)] transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
          <span className="sr-only">Ordence</span>
        </Link>

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
        </div>

        {/*
          The pill, on its own row on desktop.

          Each item carries a circle that swells up from beneath on hover
          and a second copy of the label that rises with it — so the pill
          fills rather than merely tinting. Both halves are pure CSS
          transforms on a masked element, which keeps it on the compositor
          and off the main thread.
        */}
        <nav
          aria-label="Primary"
          className="pill-nav mx-auto mt-3 hidden shrink-0 items-center gap-0.5 rounded-full border border-border p-1.5 shadow-low xl:flex"
        >
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="pill">
              <span aria-hidden="true" className="pill-fill" />
              <span className="pill-stack">
                <span className="pill-label">{item.label}</span>
                <span aria-hidden="true" className="pill-label-hover">
                  {item.label}
                </span>
              </span>
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
}
