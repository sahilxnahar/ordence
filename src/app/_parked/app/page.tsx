import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

/**
 * app.ordence.com — the signed-in workspace shell (pre-auth preview).
 * Real authentication wires in per BLUEPRINT.md; until then this shell
 * shows the product's skeleton with honest empty states.
 */

const modules = [
  {
    key: "crm",
    name: "CRM",
    desc: "Pipelines, contacts, conversations",
    state: "Preview",
  },
  {
    key: "erp",
    name: "ERP",
    desc: "Inventory, orders, invoices",
    state: "Preview",
  },
  {
    key: "ai",
    name: "AI Assistant",
    desc: "Summaries, drafts, insight",
    state: "Preview",
  },
  {
    key: "analytics",
    name: "Analytics",
    desc: "Dashboards & reports",
    state: "Preview",
  },
] as const;

export default function AppHomePage() {
  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Link href="/" aria-label="Workspace home">
            <Logo className="gap-2.5 [&>svg:first-child]:size-8 [&>svg:nth-child(2)]:h-4" />
          </Link>
        </div>
        <nav aria-label="Workspace" className="flex-1 space-y-1 p-3">
          {modules.map((m) => (
            <span
              key={m.key}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-muted"
            >
              {m.name}
              <span className="font-mono text-[10px] tracking-wider text-muted-subtle uppercase">
                soon
              </span>
            </span>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <p className="corner-caption">app.ordence.com</p>
        </div>
      </aside>

      <main id="main" className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/75 px-6 backdrop-blur-xl">
          <p className="text-sm font-medium">Workspace</p>
          <Badge tone="accent">Preview build</Badge>
        </header>
        <div className="flex-1 p-6 md:p-10">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="space-y-2">
              <span className="kicker">Your workspace</span>
              <h1 className="text-display text-3xl font-semibold">
                The product mounts here.
              </h1>
              <p className="max-w-lg text-sm text-muted">
                Authentication and the first CRM screens are the next milestones
                on the roadmap. Everything below is the real shell they land in.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {modules.map((m) => (
                <div
                  key={m.key}
                  className="group rounded-panel border border-border bg-surface p-6 shadow-low transition-shadow hover:shadow-mid"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold transition-colors group-hover:text-accent">
                      {m.name}
                    </h2>
                    <Badge tone="neutral">{m.state}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted">{m.desc}</p>
                </div>
              ))}
            </div>
            <Button variant="accent" href="/auth/login">
              Sign in when auth ships <span aria-hidden="true">→</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
