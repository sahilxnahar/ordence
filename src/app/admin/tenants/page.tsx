import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEED_TENANTS } from "@/lib/tenant/registry";
import { createTenant, listKvTenants } from "@/lib/tenant/admin";
import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

const inputClass =
  "h-10 w-full rounded-xl border border-border bg-surface px-3.5 text-sm placeholder:text-muted-subtle focus-visible:outline-2 focus-visible:outline-ring";

/** Provisioning console — a tenant goes live in one form submit. */
export default async function AdminTenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const { created, error } = await searchParams;
  const kvTenants = await listKvTenants();
  const seedSlugs = new Set(SEED_TENANTS.map((t) => t.slug));
  const all = [
    ...kvTenants.filter((t) => !seedSlugs.has(t.slug)),
    ...SEED_TENANTS,
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tenants</h1>
        <p className="text-sm text-muted">
          Provision a tenant and its subdomain is live within about a minute
          (edge cache TTL). Custom domains attach via Cloudflare for SaaS.
        </p>
      </div>

      {created && (
        <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm">
          <span className="font-medium">{created}</span> provisioned — check{" "}
          <span className="font-mono">{created}.{siteConfig.rootDomain}</span>
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          Invalid slug or name — slugs are lowercase letters, digits, hyphens.
        </div>
      )}

      <form
        action={createTenant}
        className="grid gap-4 rounded-panel border border-border bg-surface p-6 shadow-low md:grid-cols-2"
      >
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">Tenant name</label>
          <input id="name" name="name" required className={inputClass} placeholder="Acme Industries" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="slug" className="text-sm font-medium">Subdomain slug</label>
          <input id="slug" name="slug" required pattern="[a-z0-9][a-z0-9-]*" className={inputClass} placeholder="acme" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="domain" className="text-sm font-medium">Custom domain (optional)</label>
          <input id="domain" name="domain" className={inputClass} placeholder="acme.com" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="accent" className="text-sm font-medium">Brand accent</label>
          <input id="accent" name="accent" type="color" defaultValue="#6d45e8" className="h-10 w-full cursor-pointer rounded-xl border border-border bg-surface px-1.5" />
        </div>
        <fieldset className="flex flex-wrap items-center gap-5 md:col-span-2">
          <legend className="mb-2 text-sm font-medium">Modules</legend>
          {(["crm", "erp", "ai", "web"] as const).map((m) => (
            <label key={m} className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" name={m} defaultChecked={m === "crm"} className="size-4 accent-(--brand)" />
              {m.toUpperCase()}
            </label>
          ))}
        </fieldset>
        <div className="md:col-span-2">
          <Button type="submit" variant="accent">
            Provision tenant <span aria-hidden="true">→</span>
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-surface border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs tracking-wider text-muted uppercase">
              <th className="px-5 py-3 font-medium">Tenant</th>
              <th className="px-5 py-3 font-medium">Hostname</th>
              <th className="px-5 py-3 font-medium">Accent</th>
              <th className="px-5 py-3 font-medium">Modules</th>
              <th className="px-5 py-3 font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {all.map((t) => (
              <tr key={t.slug} className="border-b border-border last:border-0">
                <td className="px-5 py-3.5 font-medium">{t.name}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-muted">
                  {t.slug}.{siteConfig.rootDomain}
                  {t.domains[0] ? ` · ${t.domains[0]}` : ""}
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-block size-5 rounded-full border border-border" style={{ background: t.branding.accent }} />
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {(Object.entries(t.features) as [string, boolean][])
                      .filter(([, on]) => on)
                      .map(([k]) => (
                        <Badge key={k} tone="accent">{k.toUpperCase()}</Badge>
                      ))}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <Badge tone={seedSlugs.has(t.slug) ? "neutral" : "success"}>
                    {seedSlugs.has(t.slug) ? "seed" : "KV"}
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
