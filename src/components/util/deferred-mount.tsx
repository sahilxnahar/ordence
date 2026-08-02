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
  releaseWhenDistant = false,
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
  /**
   * Unmount again once the section is far off-screen.
   *
   * Mounting on approach bounds the *download*; it does not bound how
   * many scenes are alive at once. Three WebGL bands on one page meant
   * three live contexts and three GPU allocations for the whole session,
   * even though at most one is ever on screen. With this on, a scene
   * releases its context when it is more than a screen away and rebuilds
   * on the way back — which costs a few frames nobody sees, and holds
   * the "one context per route" budget by construction.
   *
   * Only for self-contained scenery. Anything holding state a visitor
   * would be annoyed to lose should stay mounted.
   */
  releaseWhenDistant?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!releaseWhenDistant && show) return;
    if (requireCapableDevice && !allowsHeavyScene()) return;

    // No IntersectionObserver (very old browsers): render immediately
    // rather than leaving a permanent hole in the page. Scheduled rather
    // than set inline — a synchronous setState in an effect body forces
    // a second render pass before paint.
    if (typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setShow(true));
      return () => cancelAnimationFrame(id);
    }

    if (!releaseWhenDistant) {
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
    }

    // Two observers: a near ring that mounts, and a far ring that
    // releases. One observer with a single margin would thrash at the
    // boundary — mounting and unmounting on every scroll wobble.
    const near = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setShow(true);
      },
      { rootMargin },
    );
    const far = new IntersectionObserver(
      (entries) => {
        if (entries.every((e) => !e.isIntersecting)) setShow(false);
      },
      { rootMargin: "120% 0px 120% 0px" },
    );
    near.observe(node);
    far.observe(node);
    return () => {
      near.disconnect();
      far.disconnect();
    };
  }, [rootMargin, show, requireCapableDevice, releaseWhenDistant]);

  return (
    <div ref={ref} className={className}>
      {show ? children : placeholder}
    </div>
  );
}
