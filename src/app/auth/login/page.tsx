import { Button } from "@/components/ui/button";

/**
 * Login screen — UI shell for the enterprise auth flow.
 * Wire the form to your identity provider (OIDC/SAML via your auth
 * service) — see the blueprint's Authentication section for the
 * recommended edge-compatible session architecture.
 */
export default function LoginPage() {
  return (
    <div className="space-y-6 rounded-panel border border-border bg-surface p-8 shadow-mid">
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted">Sign in to your Ordence workspace.</p>
      </div>

      <form className="space-y-4" action="#" method="post">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            className="h-11 w-full rounded-full border border-border bg-background px-4 text-sm placeholder:text-muted-subtle focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          />
        </div>
        <Button type="submit" variant="accent" className="w-full">
          Continue with email
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-subtle">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button variant="outline" className="w-full">
        Continue with SSO
      </Button>

      <p className="text-center text-xs text-muted-subtle">
        By continuing you agree to the Ordence Terms of Service.
      </p>
    </div>
  );
}
