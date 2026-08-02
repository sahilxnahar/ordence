"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { siteConfig } from "@/config/site";

/**
 * Mobile navigation sheet.
 *
 * Why this exists: the desktop nav is a centered pill that can't survive
 * narrow viewports, so it hides below `lg`. Without this component the
 * site would be unnavigable on phones — the single worst accessibility
 * failure a marketing site can ship.
 *
 * Behaviour: focus moves into the sheet on open and returns to the
 * trigger on close, Escape closes, body scroll locks, and the route
 * change auto-closes it.
 */

const LINKS = [
  { href: "/platform", label: "Platform" },
  { href: "/product", label: "Product" },
  { href: "/crm", label: "CRM" },
  { href: "/erp", label: "ERP" },
  { href: "/ai", label: "AI Services" },
  { href: "/services", label: "Web Development" },
  { href: "/pricing", label: "Pricing" },
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" },
] as const;

const emptySubscribe = () => () => {};
/** True only after hydration — portals need a real document. */
function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Escape to close + scroll lock while open. Navigation closes the sheet
  // via each link's onClick, so no route-watching effect is needed.
  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    // Move focus into the sheet for keyboard and screen-reader users.
    sheetRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex size-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-foreground/5 lg:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {/*
        Portalled to <body> on purpose. The site header uses backdrop-blur,
        and a backdrop-filter ancestor becomes the containing block for
        position:fixed descendants — which would trap this overlay inside
        the 96px header instead of covering the viewport.
      */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className="fixed inset-0 z-50 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* scrim */}
                <div
                  className="absolute inset-0 bg-foreground/25 backdrop-blur-sm"
                  onClick={() => setOpen(false)}
                />

                <motion.div
                  ref={sheetRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Site menu"
                  tabIndex={-1}
                  initial={reduce ? { opacity: 0 } : { x: "100%" }}
                  animate={reduce ? { opacity: 1 } : { x: 0 }}
                  exit={reduce ? { opacity: 0 } : { x: "100%" }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col border-l border-border bg-surface shadow-high outline-none"
                >
                  <div className="flex h-24 items-center justify-between border-b border-border px-6">
                    <span className="kicker">Menu</span>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Close menu"
                      className="inline-flex size-10 items-center justify-center rounded-full border border-border text-muted transition-colors hover:text-foreground"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="size-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        aria-hidden="true"
                      >
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </div>

                  <nav
                    aria-label="Mobile"
                    className="flex-1 overflow-y-auto p-4"
                  >
                    <ul className="space-y-1">
                      {LINKS.map((l, i) => (
                        <li key={l.href}>
                          <motion.span
                            initial={reduce ? false : { opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              delay: 0.06 + i * 0.035,
                              duration: 0.3,
                            }}
                            className="block"
                          >
                            <Link
                              href={l.href}
                              onClick={() => setOpen(false)}
                              className="flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium transition-colors hover:bg-accent-soft hover:text-accent"
                            >
                              {l.label}
                              <span
                                aria-hidden="true"
                                className="text-muted-subtle"
                              >
                                →
                              </span>
                            </Link>
                          </motion.span>
                        </li>
                      ))}
                    </ul>
                  </nav>

                  <div className="space-y-3 border-t border-border p-6">
                    <Link
                      href="/contact"
                      onClick={() => setOpen(false)}
                      className="flex h-12 items-center justify-center rounded-full bg-brand font-medium text-brand-contrast"
                    >
                      Get started
                    </Link>
                    <Link
                      href={siteConfig.authEntry}
                      onClick={() => setOpen(false)}
                      className="flex h-12 items-center justify-center rounded-full border border-border-strong font-medium"
                    >
                      Sign in
                    </Link>
                    <p className="corner-caption pt-2 text-center">
                      Ordence · Business OS
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
