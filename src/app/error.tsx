"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary. Client component by contract.
 * Report to your observability sink here (Sentry, Workers Analytics
 * Engine, Logpush) — never swallow silently.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ordence] route error:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <p className="text-eyebrow">Something broke</p>
      <h1 className="text-display text-4xl font-semibold">
        We hit an unexpected error.
      </h1>
      <p className="max-w-sm text-muted">
        The issue has been recorded. Try again — if it persists, we&apos;re
        already on it.
      </p>
      <Button onClick={reset} variant="accent">
        Try again
      </Button>
    </div>
  );
}
