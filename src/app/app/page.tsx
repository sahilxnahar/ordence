import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * app.ordence.com — signed-in product shell placeholder.
 * This is where the CRM/ERP workspaces mount once authentication lands.
 */
export default function AppHomePage() {
  return (
    <Container className="flex min-h-svh flex-col items-center justify-center gap-6 text-center">
      <Badge tone="accent">app.ordence.com</Badge>
      <h1 className="text-display text-4xl font-semibold">Your workspace</h1>
      <p className="max-w-md text-muted">
        The signed-in product shell — CRM pipelines, ERP operations and AI
        assistants mount here after authentication.
      </p>
      <Button variant="accent" href="/auth/login">
        Sign in to continue
      </Button>
    </Container>
  );
}
