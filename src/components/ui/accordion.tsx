import { cn } from "@/lib/utils";

/**
 * FAQ accordion built on native <details>/<summary> — interactive with
 * ZERO JavaScript, keyboard-accessible for free, server-rendered.
 * The chevron rotates via the group-open variant.
 */
export function AccordionItem({
  question,
  children,
  className,
}: {
  question: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <details
      className={cn("group border-b border-border last:border-0", className)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left font-medium transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
        {question}
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="size-4 shrink-0 text-muted transition-transform duration-300 group-open:rotate-45"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </summary>
      <div className="pb-5 text-sm leading-relaxed text-muted">{children}</div>
    </details>
  );
}
