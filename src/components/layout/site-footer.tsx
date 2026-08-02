import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/container";

const columns = [
  {
    title: "Platform",
    links: [
      { label: "CRM", href: "/crm" },
      { label: "ERP", href: "/erp" },
      { label: "AI Services", href: "/ai" },
      { label: "Web Development", href: "/services" },
      { label: "Multi-tenant", href: "/platform" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Pricing", href: "/pricing" },
      { label: "Insights", href: "/insights" },
      { label: "Changelog", href: "/changelog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/contact" },
      { label: "Terms", href: "/contact" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="grid gap-10 py-16 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo className="gap-4 [&>svg:first-child]:size-20 [&>svg:nth-child(2)]:h-9" />
          <p className="max-w-xs text-sm text-muted">
            The operating system for ambitious businesses — CRM, ERP, web and AI
            on one platform.
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
          <span>
            © {new Date().getFullYear()} Ordence. All rights reserved.
          </span>
          <span>Crafted on ordence.com</span>
        </Container>
      </div>
    </footer>
  );
}
