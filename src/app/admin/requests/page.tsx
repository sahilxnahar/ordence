import { Badge } from "@/components/ui/badge";
import { ActivationForm } from "@/components/admin/activation-form";
import { declineRequest, listRequests } from "@/lib/requests";
import { industryByKey } from "@/lib/tenant/industries";
import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  invalid: "Check the workspace name, subdomain and industry.",
  plan: "Users and duration must both be at least 1.",
  exists: "That subdomain is already taken — choose another.",
};

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string; error?: string; declined?: string }>;
}) {
  const { open, error, declined } = await searchParams;
  const requests = await listRequests();
  const pending = requests.filter((r) => r.status === "pending");
  const handled = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Requests</h1>
        <p className="text-sm text-muted">
          Signups awaiting approval. Choose an industry to pre-fill modules,
          set the plan, and activate — the subdomain goes live immediately.
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {errors[error] ?? "Something went wrong."}
        </p>
      )}
      {declined && (
        <p className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
          Request declined.
        </p>
      )}

      <section className="space-y-4">
        <h2 className="flex items-center gap-3 text-sm font-semibold">
          Pending
          <Badge tone={pending.length ? "coral" : "neutral"}>
            {pending.length}
          </Badge>
        </h2>

        {pending.length === 0 ? (
          <div className="rounded-panel border border-dashed border-border-strong bg-surface p-12 text-center">
            <p className="font-medium">Nothing waiting.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              New submissions from{" "}
              <span className="font-mono text-xs">
                {siteConfig.rootDomain}/get-started
              </span>{" "}
              appear here, and an email goes to sahil@ordence.com.
            </p>
          </div>
        ) : (
          pending.map((r) => (
            <details
              key={r.id}
              open={open === r.id}
              className="group rounded-panel border border-border bg-surface shadow-low"
            >
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-4 p-6 [&::-webkit-details-marker]:hidden">
                <div className="min-w-0">
                  <p className="font-semibold">{r.company}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {r.contactName} · {r.email}
                    {r.teamSize ? ` · ${r.teamSize} people` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {r.industry && (
                    <Badge tone="accent">
                      {industryByKey(r.industry)?.label ?? r.industry}
                    </Badge>
                  )}
                  <span className="corner-caption">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <span className="text-xs font-medium text-accent">
                    <span className="group-open:hidden">Review →</span>
                    <span className="hidden group-open:inline">Close</span>
                  </span>
                </div>
              </summary>

              <div className="border-t border-border p-6">
                {r.notes && (
                  <p className="mb-6 rounded-xl bg-background p-4 text-sm text-muted">
                    “{r.notes}”
                  </p>
                )}
                <ActivationForm request={r} />
                <form action={declineRequest} className="mt-6 border-t border-border pt-5">
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-muted transition-colors hover:text-danger"
                  >
                    Decline this request
                  </button>
                </form>
              </div>
            </details>
          ))
        )}
      </section>

      {handled.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold">History</h2>
          <div className="overflow-hidden rounded-surface border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs tracking-wider text-muted uppercase">
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 font-medium">Workspace</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {handled.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5 font-medium">{r.company}</td>
                    <td className="px-5 py-3.5 text-muted">{r.email}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted">
                      {r.activatedSlug
                        ? `${r.activatedSlug}.${siteConfig.rootDomain}`
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={r.status === "activated" ? "success" : "neutral"}>
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
