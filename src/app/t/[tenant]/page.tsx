import { siteConfig } from "@/config/site";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LazyMagnetosphereBand } from "@/components/three/lazy";
import { DeferredMount } from "@/components/util/deferred-mount";
import { BandFallback } from "@/components/marketing/band-fallback";

/** Tenant home — branded by the layout's CSS-variable injection. */
export default async function TenantHomePage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  // The layout replaces children with a "workspace paused" notice, but the
  // page still executes — returning early keeps its markup out of the RSC
  // payload entirely rather than rendering content nobody should see.
  if (tenant.status !== "active") return null;

  const enabled = (
    Object.entries(tenant.features) as [string, boolean][]
  ).filter(([, on]) => on);

  const moduleCopy: Record<string, string> = {
    crm: "Customers, pipeline and conversations in one place.",
    erp: "Orders, inventory and invoices — reconciled by design.",
    ai: "An assistant grounded in this workspace's data.",
    web: "This site — engineered and hosted by Ordence Studio.",
  };

  return (
    <div className="relative overflow-hidden">
      <div className="bg-aurora absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-6 py-24">
        <span className="kicker rise">
          {slug}.ordence.com{tenant.domains[0] ? ` · ${tenant.domains[0]}` : ""}
        </span>
        <h1
          className="text-display rise max-w-2xl text-5xl font-semibold sm:text-6xl"
          style={{ animationDelay: "120ms" }}
        >
          Welcome to {tenant.name}.
        </h1>
        <p
          className="rise max-w-xl text-lg text-muted"
          style={{ animationDelay: "240ms" }}
        >
          A dedicated, branded environment for {tenant.name} — isolated
          configuration and permissions, served from the shared Ordence platform
          at the edge.
        </p>
        <div
          className="rise grid w-full gap-4 pt-2 sm:grid-cols-2"
          style={{ animationDelay: "360ms" }}
        >
          {enabled.map(([key]) => (
            <div
              key={key}
              className="group rounded-panel border border-border bg-surface p-6 shadow-low transition-shadow hover:shadow-mid"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{key.toUpperCase()}</h2>
                <Badge tone="accent">Enabled</Badge>
              </div>
              <p className="mt-2 text-sm text-muted">
                {moduleCopy[key] ?? "Configured for this workspace."}
              </p>
            </div>
          ))}
        </div>
        {/* This button is repainted by the tenant's --brand token. */}
        <div className="rise" style={{ animationDelay: "480ms" }}>
          <Button variant="accent" size="lg" href={siteConfig.authEntry}>
            Enter workspace <span aria-hidden="true">→</span>
          </Button>
        </div>
      </div>

      {/*
        The same scene /platform uses to explain multi-tenancy, painted in
        this tenant's own accent. It is the cheapest possible proof of the
        thing the platform page only claims: their workspace really is
        theirs, down to the colour of the plasma. Costs nothing extra —
        the shader is already in the shared chunk.
      */}
      <DeferredMount
        requireCapableDevice
        placeholder={
          <BandFallback
            eyebrow={`${tenant.name} · powered by Ordence`}
            title="Your workspace, on your colours."
            height="compact"
            body={`Isolated configuration, your own domain and your own module set — served at the edge for ${tenant.name}.`}
          />
        }
      >
        <LazyMagnetosphereBand
          height="compact"
          accent={tenant.branding.accent}
          secondary={tenant.branding.accent}
          eyebrow={`${tenant.name} · powered by Ordence`}
          title="Your workspace, on your colours."
          body={`Isolated configuration, your own domain and your own module set — served at the edge for ${tenant.name}.`}
        />
      </DeferredMount>
    </div>
  );
}
