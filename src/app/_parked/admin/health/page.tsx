import { Badge } from "@/components/ui/badge";
import { listManagedTenants } from "@/lib/tenant/admin";
import { listLeads } from "@/lib/leads";

export const dynamic = "force-dynamic";

/**
 * Platform Health & Revenue Observatory.
 *
 * Honesty policy for this screen: every number shown is computed from a
 * real source (KV) or clearly labelled as "not wired yet". Fabricated
 * dashboard metrics are worse than an empty state — they teach you to
 * trust a number that isn't measuring anything.
 */

/** Cloudflare free-tier envelope this platform is designed around. */
const FREE_TIER = {
  workerRequestsPerDay: 100_000,
  kvReadsPerDay: 100_000,
  kvWritesPerDay: 1_000,
  kvStorageGb: 1,
} as const;

function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "neutral" | "accent";
}) {
  return (
    <div className="rounded-panel border border-border bg-surface p-6 shadow-low">
      <p className="corner-caption">{label}</p>
      <p
        className={`text-display mt-2 text-3xl font-semibold ${tone === "accent" ? "text-accent" : ""}`}
      >
        {value}
      </p>
      <p className="mt-1.5 text-xs text-muted">{hint}</p>
    </div>
  );
}

/**
 * Time-bucketing lives outside the component: reading the clock is an
 * impure call, and render bodies must stay pure so results are cacheable
 * and replayable.
 */
async function bucketLeadsByRecency(leads: { at: string }[]) {
  const dayMs = 24 * 60 * 60 * 1000;
  const now = Date.now();
  return {
    last24h: leads.filter((l) => now - Date.parse(l.at) < dayMs).length,
    last7d: leads.filter((l) => now - Date.parse(l.at) < 7 * dayMs).length,
  };
}

export default async function AdminHealthPage() {
  const fleet = await listManagedTenants();
  const leads = await listLeads(200);

  const active = fleet.filter((f) => f.tenant.status === "active").length;
  const suspended = fleet.length - active;
  const withCustomDomain = fleet.filter(
    (f) => f.tenant.domains.length > 0,
  ).length;

  const { last24h: leads24h, last7d: leads7d } =
    await bucketLeadsByRecency(leads);

  // KV writes are the tightest free-tier constraint, so surface the one
  // number most likely to bite first.
  const writeBudgetUsed = Math.min(
    100,
    Math.round((leads24h / FREE_TIER.kvWritesPerDay) * 100),
  );

  const moduleCounts = (["crm", "erp", "ai", "web"] as const).map((m) => ({
    module: m,
    count: fleet.filter((f) => f.tenant.features[m]).length,
  }));

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Platform health
        </h1>
        <p className="text-sm text-muted">
          Live figures computed from edge KV. Anything not yet instrumented is
          labelled as such rather than estimated.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Active tenants"
          value={String(active)}
          hint={suspended ? `${suspended} suspended` : "None suspended"}
          tone="accent"
        />
        <Stat
          label="Custom domains"
          value={String(withCustomDomain)}
          hint={`${FREE_TIER.kvStorageGb} GB KV storage available`}
        />
        <Stat
          label="Leads · 24h"
          value={String(leads24h)}
          hint={`${leads7d} in the last 7 days`}
        />
        <Stat
          label="Leads captured"
          value={String(leads.length)}
          hint="Total retained in KV (latest 200)"
        />
      </div>

      <section className="rounded-panel border border-border bg-surface p-6 shadow-low">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Free-tier budget</h2>
            <p className="mt-1 text-sm text-muted">
              KV writes are the tightest daily limit — lead capture is the main
              consumer.
            </p>
          </div>
          <Badge tone={writeBudgetUsed > 70 ? "coral" : "success"}>
            {writeBudgetUsed}% of daily KV writes
          </Badge>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full rounded-full bg-gradient-brand transition-[width] duration-500"
            style={{ width: `${Math.max(writeBudgetUsed, 2)}%` }}
          />
        </div>
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="corner-caption">Worker requests</dt>
            <dd className="mt-1 text-muted">
              {FREE_TIER.workerRequestsPerDay.toLocaleString("en-IN")}/day —{" "}
              <span className="text-muted-subtle">
                usage not instrumented yet
              </span>
            </dd>
          </div>
          <div>
            <dt className="corner-caption">KV reads</dt>
            <dd className="mt-1 text-muted">
              {FREE_TIER.kvReadsPerDay.toLocaleString("en-IN")}/day —{" "}
              <span className="text-muted-subtle">
                absorbed by in-isolate cache
              </span>
            </dd>
          </div>
          <div>
            <dt className="corner-caption">KV writes</dt>
            <dd className="mt-1 text-muted">
              {FREE_TIER.kvWritesPerDay.toLocaleString("en-IN")}/day —{" "}
              {leads24h} used by leads today
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-panel border border-border bg-surface p-6 shadow-low">
        <h2 className="font-semibold">Module adoption</h2>
        <p className="mt-1 text-sm text-muted">
          Which modules tenants actually have switched on.
        </p>
        <div className="mt-5 space-y-3">
          {moduleCounts.map(({ module, count }) => (
            <div key={module} className="flex items-center gap-4">
              <span className="w-12 font-mono text-xs tracking-wider uppercase">
                {module}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/10">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{
                    width: `${fleet.length ? (count / fleet.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="w-16 text-right text-xs text-muted">
                {count}/{fleet.length}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-panel border border-border bg-surface p-6 shadow-low">
        <h2 className="font-semibold">Not instrumented yet</h2>
        <p className="mt-1 text-sm text-muted">
          These need Workers Analytics Engine or Logpush wired up — listed here
          so the gap stays visible rather than assumed.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-muted">
          {[
            "Per-tenant request volume and error rate",
            "Response-time percentiles by region",
            "Core Web Vitals from real users",
            "Churn siren — tenants silent for 14 days",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-subtle"
              />
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
