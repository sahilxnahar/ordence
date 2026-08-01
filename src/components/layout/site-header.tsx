import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Container } from "@/components/ui/container";

const nav = [
  { href: "/#platform", label: "Platform" },
  { href: "/#services", label: "Services" },
  { href: "/#craft", label: "Craft" },
] as const;

/** Marketing chrome: sticky glass header with hairline underline. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/75 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" aria-label="Ordence home" className="text-foreground">
          <Logo />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" href="/auth/login" className="hidden sm:inline-flex">
            Sign in
          </Button>
          <Button variant="accent" size="sm" href="/auth/login">
            Get started
          </Button>
        </div>
      </Container>
    </header>
  );
}
