import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/container";

const columns = [
  {
    title: "Platform",
    links: [
      { label: "CRM", href: "/#platform" },
      { label: "ERP", href: "/#platform" },
      { label: "AI Services", href: "/#platform" },
      { label: "Web Development", href: "/#services" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/#craft" },
      { label: "Careers", href: "/#craft" },
      { label: "Contact", href: "/#craft" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/#" },
      { label: "Terms", href: "/#" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="grid gap-10 py-16 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted">
            The operating system for ambitious businesses — CRM, ERP, web and
            AI on one platform.
          </p>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title} className="space-y-3">
            <p className="text-eyebrow">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <div className="border-t border-border">
        <Container className="flex h-14 items-center justify-between text-xs text-muted-subtle">
          <span>© {new Date().getFullYear()} Ordence. All rights reserved.</span>
          <span>Crafted on ordence.com</span>
        </Container>
      </div>
    </footer>
  );
}
