import { Badge } from "@/components/ui/badge";
import { listLeads } from "@/lib/leads";

export const dynamic = "force-dynamic";

/** Lead inbox — everything the /contact form captured, newest first. */
export default async function AdminLeadsPage() {
  const leads = await listLeads(100);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
        <p className="text-sm text-muted">
          Captured by the contact form and stored at the edge. Newest first.
        </p>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-panel border border-dashed border-border-strong bg-surface p-12 text-center">
          <p className="font-medium">No leads yet.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Submissions from the contact form appear here within seconds. If you
            expected some, confirm the deployed worker has the{" "}
            <span className="font-mono text-xs">TENANT_KV</span> binding.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-surface border border-border bg-surface">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs tracking-wider text-muted uppercase">
                <th className="px-5 py-3 font-medium">Received</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Interest</th>
                <th className="px-5 py-3 font-medium">Message</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr
                  key={`${l.email}-${l.at}`}
                  className="border-b border-border align-top last:border-0"
                >
                  <td className="px-5 py-4 font-mono text-xs whitespace-nowrap text-muted">
                    {new Date(l.at).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium">{l.name}</p>
                    <a
                      href={`mailto:${l.email}`}
                      className="link-draw text-xs text-muted"
                    >
                      {l.email}
                    </a>
                  </td>
                  <td className="px-5 py-4 text-muted">{l.company || "—"}</td>
                  <td className="px-5 py-4">
                    <Badge tone="accent">{l.interest || "General"}</Badge>
                  </td>
                  <td className="max-w-sm px-5 py-4 text-muted">
                    {l.message || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
