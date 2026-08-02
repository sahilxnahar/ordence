"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Keyboard navigation layer.
 *
 * Two-key sequences in the Gmail/Linear tradition — `g` then `p` for
 * pricing, `g` then `h` for home. Power users navigate the whole site
 * without touching the mouse; everyone else never notices it exists.
 *
 * Deliberately inert while typing: a shortcut that fires inside a form
 * field and navigates away mid-sentence is worse than no shortcut.
 */

const ROUTES: Record<string, string> = {
  h: "/",
  p: "/pricing",
  c: "/crm",
  e: "/erp",
  a: "/ai",
  w: "/services",
  i: "/insights",
  g: "/get-started",
};

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

export function KeyboardHints() {
  const router = useRouter();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;

      if (!armed) {
        if (e.key.toLowerCase() === "g") {
          setArmed(true);
          // The sequence expires so a stray "g" doesn't lie in wait.
          timeout = setTimeout(() => setArmed(false), 1500);
        }
        return;
      }

      const destination = ROUTES[e.key.toLowerCase()];
      setArmed(false);
      if (timeout) clearTimeout(timeout);
      if (destination) {
        e.preventDefault();
        router.push(destination);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timeout) clearTimeout(timeout);
    };
  }, [armed, router]);

  if (!armed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-surface px-4 py-2 shadow-high"
    >
      <span className="font-mono text-[11px] tracking-wider text-muted uppercase">
        go to — h home · p pricing · c crm · e erp · a ai · i insights
      </span>
    </div>
  );
}
