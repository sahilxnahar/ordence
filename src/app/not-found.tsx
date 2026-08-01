import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <p className="text-eyebrow">404</p>
      <h1 className="text-display text-4xl font-semibold">
        This page doesn&apos;t exist.
      </h1>
      <p className="max-w-sm text-muted">
        The page you&apos;re looking for was moved, renamed, or never shipped.
      </p>
      <Button href="/" variant="outline">
        Back to home
      </Button>
    </div>
  );
}
