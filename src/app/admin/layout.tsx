import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/**
 * Admin layout — admin.ordence.com (internal operations console).
 * noindex: this surface must never appear in search engines.
 * Dense sidebar shell: admin tools optimize for scan speed, not story.
 */

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Ordence Admin" },
  robots: { index: false, follow: false },
};

const navigation = [
  { href: "/", label: "Overview" },
  { href: "/tenants", label: "Tenants" }, // ← live provisioning console
  { href: "/domains", label: "Domains" },
  { href: "/users", label: "Users" },
  { href: "/billing", label: "Billing" },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Link href="/" aria-label="Admin overview">
            <Logo className="[&>svg:first-child]:size-7" />
          </Link>
        </div>
        <nav aria-label="Admin" className="flex-1 space-y-1 p-3">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-3 text-xs text-muted-subtle">
          admin.ordence.com
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/75 px-6 backdrop-blur-xl">
          <p className="text-sm font-medium">Operations Console</p>
          <ThemeToggle />
        </header>
        <main id="main" className="flex-1 p-6 md:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
