import { Container } from "@/components/ui/container";

/**
 * Marketing loading state — a branded skeleton, not a spinner.
 * Mirrors the hero's layout so the transition to content is spatial,
 * not jarring (premium loading state, zero CLS).
 */
export default function MarketingLoading() {
  return (
    <Container className="flex min-h-[82svh] flex-col justify-center gap-6 py-28">
      <div className="h-6 w-40 animate-pulse rounded-full bg-foreground/10" />
      <div className="h-16 w-full max-w-2xl animate-pulse rounded-2xl bg-foreground/10" />
      <div className="h-16 w-3/4 max-w-xl animate-pulse rounded-2xl bg-foreground/10" />
      <div className="h-5 w-full max-w-md animate-pulse rounded-full bg-foreground/10" />
      <div className="flex gap-3 pt-2">
        <div className="h-12 w-36 animate-pulse rounded-full bg-foreground/10" />
        <div className="h-12 w-44 animate-pulse rounded-full bg-foreground/10" />
      </div>
    </Container>
  );
}
