"use client";

import { useEffect, useRef, useState } from "react";
import { allowsHeavyScene } from "@/lib/capability";

/**
 * Mounts children only once they approach the viewport.
 *
 * `next/dynamic` splits heavy code into its own chunk, but a dynamic
 * component that is present in the tree still *downloads and executes*
 * on load. For a 880 KB three.js scene sitting below the fold that is a
 * tax every visitor pays whether or not they scroll to it.
 *
 * This gate keeps the chunk unrequested until the section is within
 * `rootMargin` of the viewport, so the initial page costs nothing for
 * scenery nobody has looked at yet. The placeholder reserves the same
 * space, so nothing shifts when the real component arrives (no CLS).
 */
export function DeferredMount({
  children,
  placeholder,
  rootMargin = "300px",
  className,
  requireCapableDevice = false,
}: {
  children: React.ReactNode;
  /** Rendered until the real content mounts — must match its height. */
  placeholder?: React.ReactNode;
  rootMargin?: string;
  className?: string;
  /**
   * When true, the children are never fetched on devices that shouldn't
   * pay for a heavy scene (see lib/capability.ts) — the placeholder
   * becomes the permanent, intended experience there.
   *
   * A boolean rather than a predicate function on purpose: this component
   * is imported by Server Components, and functions can't cross that
   * boundary as props.
   */
  requireCapableDevice?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || show) return;
    if (requireCapableDevice && !allowsHeavyScene()) return;

    // No IntersectionObserver (very old browsers): render immediately
    // rather than leaving a permanent hole in the page. Scheduled rather
    // than set inline — a synchronous setState in an effect body forces
    // a second render pass before paint.
    if (typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setShow(true));
      return () => cancelAnimationFrame(id);
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [rootMargin, show, requireCapableDevice]);

  return (
    <div ref={ref} className={className}>
      {show ? children : placeholder}
    </div>
  );
}
