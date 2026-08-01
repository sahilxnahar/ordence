import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenantBySlug } from "@/lib/tenant/store";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/**
 * Tenant layout — {tenant}.ordence.com and custom domains.
 *
 * Branding isolation happens HERE, not in components: the tenant's accent
 * color is injected as `--brand` / `--ring` on the surface root, so every
 * token-driven component repaints automatically. Zero per-tenant CSS.
 */

interface TenantParams {
  params: Promise<{ tenant: string }>;
}

export async function generateMetadata({
  params,
}: TenantParams): Promise<Metadata> {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return { title: "Not found" };
  return {
    title: { default: tenant.name, template: `%s — ${tenant.name}` },
    description: `${tenant.name}, powered by Ordence.`,
    // Tenant sites own their SEO identity; the platform stays invisible.
    robots: { index: tenant.status === "active", follow: true },
  };
}

export default async function TenantLayout({
  children,
  params,
}: TenantParams & { children: React.ReactNode }) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || tenant.status !== "active") notFound();

  const radius =
    tenant.branding.radius === "sharp"
      ? "0.375rem"
      : tenant.branding.radius === "soft"
        ? "0.75rem"
        : "9999px";

  return (
    <div
      className="flex min-h-svh flex-col"
      style={
        {
          "--brand": tenant.branding.accent,
          "--brand-contrast": tenant.branding.accentContrast,
          "--ring": tenant.branding.accent,
          "--radius-control": radius,
        } as React.CSSProperties
      }
    >
      <header className="sticky top-0 z-40 border-b border-border bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 font-semibold">
            <span
              aria-hidden="true"
              className="size-6 rounded-full"
              style={{ background: tenant.branding.accent }}
            />
            {tenant.name}
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6 text-xs text-muted-subtle">
          <span>© {new Date().getFullYear()} {tenant.name}</span>
          <span>
            Powered by{" "}
            <a
              href="https://ordence.com"
              className="font-medium text-muted transition-colors hover:text-foreground"
            >
              Ordence
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
