import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createTenant,
  listManagedTenants,
  toggleTenantStatus,
  updateTenant,
} from "@/lib/tenant/admin";
import { siteConfig } from "@/config/site";
import type { Tenant } from "@/lib/tenant/types";

export const dynamic = "force-dynamic";

const inputClass =
  "h-10 w-full rounded-xl border border-border bg-surface px-3.5 text-sm placeholder:text-muted-subtle focus-visible:outline-2 focus-visible:outline-ring";

const MODULES = ["crm", "erp", "ai", "web"] as const;

const notices: Record<string, { tone: "success" | "danger"; text: string }> = {
  exists: {
    tone: "danger",
    text: "That slug is already taken — pick another.",
  },
  invalid: {
    tone: "danger",
    text: "Invalid slug or name. Slugs are lowercase letters, digits and hyphens.",
  },
  missing: { tone: "danger", text: "That tenant no longer exists." },
};

/** Inline editor — native <details>, so the grid stays zero-JS. */
function TenantEditor({ tenant }: { tenant: Tenant }) {
  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-xs font-medium text-accent hover:underline [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">Edit</span>
        <span className="hidden group-open:inline">Close</span>
      </summary>
      <form
        action={updateTenant}
        className="mt-4 grid gap-3 rounded-xl border border-border bg-background p-4 md:grid-cols-2"
      >
        <input type="hidden" name="slug" value={tenant.slug} />
        <div className="space-y-1.5">
          <label
            className="text-xs font-medium"
            htmlFor={`name-${tenant.slug}`}
          >
            Name
          </label>
          <input
            id={`name-${tenant.slug}`}
            name="name"
            defaultValue={tenant.name}
            required
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label
            className="text-xs font-medium"
            htmlFor={`domain-${tenant.slug}`}
          >
            Add custom domain
          </label>
          <input
            id={`domain-${tenant.slug}`}
            name="domain"
            placeholder={tenant.domains[0] ?? "acme.com"}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label
            className="text-xs font-medium"
            htmlFor={`accent-${tenant.slug}`}
          >
            Brand accent
          </label>
          <input
            id={`accent-${tenant.slug}`}
            name="accent"
            type="color"
            defaultValue={tenant.branding.accent}
            className="h-10 w-full cursor-pointer rounded-xl border border-border bg-surface px-1.5"
          />
        </div>
        <fieldset className="flex flex-wrap items-center gap-4">
          <legend className="mb-1.5 text-xs font-medium">Modules</legend>
          {MODULES.map((m) => (
            <label
              key={m}
              className="flex items-center gap-2 text-xs text-muted"
            >
              <input
                type="checkbox"
                name={m}
                defaultChecked={tenant.features[m]}
                className="size-4"
              />
              {m.toUpperCase()}
            </label>
          ))}
        </fieldset>
        <div className="flex items-center gap-3 md:col-span-2">
          <Button type="submit" variant="accent" size="sm">
            Save changes
          </Button>
          <span className="corner-caption">
            Live within ~1 min (edge cache TTL)
          </span>
        </div>
      </form>
    </details>
  );
}

export default async function AdminTenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string; error?: string }>;
}) {
  const { created, updated, error } = await searchParams;
  const fleet = await listManagedTenants();
  const notice = error ? notices[error] : undefined;

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Tenant Command Grid
        </h1>
        <p className="text-sm text-muted">
          Provision, rebrand, suspend. Every change writes to edge KV — the same
          store the router reads, so it goes live without a deploy.
        </p>
      </div>

      {created && (
        <p className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm">
          <span className="font-medium">{created}</span> provisioned — visit{" "}
          <span className="font-mono">
            {created}.{siteConfig.rootDomain}
          </span>
        </p>
      )}
      {updated && (
        <p className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm">
          <span className="font-medium">{updated}</span> updated.
        </p>
      )}
      {notice && (
        <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {notice.text}
        </p>
      )}

      <form
        action={createTenant}
        className="grid gap-4 rounded-panel border border-border bg-surface p-6 shadow-low md:grid-cols-2"
      >
        <p className="text-sm font-semibold md:col-span-2">
          Provision a new tenant
        </p>
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Tenant name
          </label>
          <input
            id="name"
            name="name"
            required
            className={inputClass}
            placeholder="Acme Industries"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="slug" className="text-sm font-medium">
            Subdomain slug
          </label>
          <input
            id="slug"
            name="slug"
            required
            pattern="[a-z0-9][a-z0-9-]*"
            className={inputClass}
            placeholder="acme"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="domain" className="text-sm font-medium">
            Custom domain (optional)
          </label>
          <input
            id="domain"
            name="domain"
            className={inputClass}
            placeholder="acme.com"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="accent" className="text-sm font-medium">
            Brand accent
          </label>
          <input
            id="accent"
            name="accent"
            type="color"
            defaultValue="#6d45e8"
            className="h-10 w-full cursor-pointer rounded-xl border border-border bg-surface px-1.5"
          />
        </div>
        <fieldset className="flex flex-wrap items-center gap-5 md:col-span-2">
          <legend className="mb-2 text-sm font-medium">Modules</legend>
          {MODULES.map((m) => (
            <label
              key={m}
              className="flex items-center gap-2 text-sm text-muted"
            >
              <input
                type="checkbox"
                name={m}
                defaultChecked={m === "crm"}
                className="size-4"
              />
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

      <div className="overflow-x-auto rounded-surface border border-border bg-surface">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs tracking-wider text-muted uppercase">
              <th className="px-5 py-3 font-medium">Tenant</th>
              <th className="px-5 py-3 font-medium">Hostnames</th>
              <th className="px-5 py-3 font-medium">Brand</th>
              <th className="px-5 py-3 font-medium">Modules</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fleet.map(({ tenant, source }) => (
              <tr
                key={tenant.slug}
                className="border-b border-border align-top last:border-0"
              >
                <td className="px-5 py-4">
                  <p className="font-medium">{tenant.name}</p>
                  <p className="corner-caption mt-0.5">{source}</p>
                </td>
                <td className="px-5 py-4 font-mono text-xs text-muted">
                  <p>
                    {tenant.slug}.{siteConfig.rootDomain}
                  </p>
                  {tenant.domains.map((d) => (
                    <p key={d}>{d}</p>
                  ))}
                </td>
                <td className="px-5 py-4">
                  <span
                    className="inline-block size-5 rounded-full border border-border"
                    style={{ background: tenant.branding.accent }}
                    title={tenant.branding.accent}
                  />
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1">
                    {MODULES.filter((m) => tenant.features[m]).map((m) => (
                      <Badge key={m} tone="accent">
                        {m.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Badge
                    tone={tenant.status === "active" ? "success" : "coral"}
                  >
                    {tenant.status}
                  </Badge>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-2">
                    <TenantEditor tenant={tenant} />
                    <form action={toggleTenantStatus}>
                      <input type="hidden" name="slug" value={tenant.slug} />
                      <button
                        type="submit"
                        className="text-xs font-medium text-muted transition-colors hover:text-danger"
                      >
                        {tenant.status === "active" ? "Suspend" : "Resume"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
