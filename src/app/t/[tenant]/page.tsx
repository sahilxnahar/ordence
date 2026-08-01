import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** Tenant home — branded by the layout's CSS-variable injection. */
export default async function TenantHomePage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const enabled = (
    Object.entries(tenant.features) as [string, boolean][]
  ).filter(([, on]) => on);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-6 py-24">
      <Badge tone="accent">
        {slug}.ordence.com{tenant.domains[0] ? ` · ${tenant.domains[0]}` : ""}
      </Badge>
      <h1 className="text-display max-w-2xl text-5xl font-semibold">
        Welcome to {tenant.name}.
      </h1>
      <p className="max-w-xl text-lg text-muted">
        This experience is isolated to the {tenant.name} tenant — its own
        branding, configuration and permissions — served from the shared
        Ordence codebase at the edge.
      </p>
      <div className="flex flex-wrap gap-2">
        {enabled.map(([key]) => (
          <Badge key={key} tone="neutral">
            {key.toUpperCase()} enabled
          </Badge>
        ))}
      </div>
      {/* This button is repainted by the tenant's --brand token. */}
      <Button variant="accent" size="lg" href="/auth/login">
        Enter workspace
      </Button>
    </div>
  );
}
