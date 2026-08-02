import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SEED_TENANTS } from "@/lib/tenant/registry";

const shortcuts = [
  {
    href: "/tenants",
    title: "Command Grid",
    body: "Provision, rebrand and suspend tenants.",
  },
  {
    href: "/health",
    title: "Platform health",
    body: "Fleet counts and free-tier budget.",
  },
  {
    href: "/leads",
    title: "Leads",
    body: "Everything the contact form captured.",
  },
] as const;

/** Admin overview — jump-off point plus the seed fleet at a glance. */
export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted">
          Every tenant on the platform, their domains and entitlements.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {shortcuts.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group rounded-panel border border-border bg-surface p-5 shadow-low transition-shadow hover:shadow-mid"
          >
            <p className="font-medium transition-colors group-hover:text-accent">
              {s.title} <span aria-hidden="true">→</span>
            </p>
            <p className="mt-1 text-sm text-muted">{s.body}</p>
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-surface border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Tenant</th>
              <th className="px-5 py-3 font-medium">Hostname</th>
              <th className="px-5 py-3 font-medium">Custom domains</th>
              <th className="px-5 py-3 font-medium">Features</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {SEED_TENANTS.map((t) => (
              <tr key={t.slug} className="border-b border-border last:border-0">
                <td className="px-5 py-4 font-medium">{t.name}</td>
                <td className="px-5 py-4 text-muted">{t.slug}.ordence.com</td>
                <td className="px-5 py-4 text-muted">
                  {t.domains.length ? t.domains.join(", ") : "—"}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.entries(t.features) as [string, boolean][])
                      .filter(([, on]) => on)
                      .map(([key]) => (
                        <Badge key={key} tone="accent">
                          {key.toUpperCase()}
                        </Badge>
                      ))}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Badge tone={t.status === "active" ? "success" : "coral"}>
                    {t.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
