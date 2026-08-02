import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Domain not connected",
  robots: { index: false, follow: false },
};

/**
 * Rendered when a request arrives on a hostname that maps to no active
 * tenant (mistyped custom domain, tenant suspended, DNS pointed early).
 */
export default function DomainNotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <p className="text-eyebrow">Domain not connected</p>
      <h1 className="text-display text-4xl font-semibold">
        This domain isn&apos;t linked to a workspace.
      </h1>
      <p className="max-w-md text-muted">
        If you just connected this domain, DNS may still be propagating. If you
        believe this is an error, contact your Ordence administrator.
      </p>
      <a
        href="https://ordence.com"
        className="rounded-full border border-border-strong bg-surface px-6 py-3 text-sm font-medium transition-colors hover:bg-background"
      >
        Go to ordence.com
      </a>
    </div>
  );
}
