"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/config/site";

/**
 * ⌘K command palette — dependency-free, ~2KB. Fuzzy-ish filter over the
 * site map; Enter navigates; arrows move; Esc closes. The Linear-grade
 * navigation layer, rendered only when open.
 */

const COMMANDS = [
  { label: "Home", hint: "ordence.com", href: "/" },
  { label: "Platform — multi-tenant prism", hint: "Page", href: "/platform" },
  { label: "Product — command room", hint: "Page", href: "/product" },
  { label: "CRM", hint: "Product", href: "/crm" },
  { label: "ERP", hint: "Product", href: "/erp" },
  { label: "AI Services", hint: "Product", href: "/ai" },
  { label: "Web Development", hint: "Studio", href: "/services" },
  { label: "Pricing", hint: "Plans", href: "/pricing" },
  { label: "Insights", hint: "Articles", href: "/insights" },
  { label: "Changelog", hint: "What shipped", href: "/changelog" },
  { label: "About", hint: "Company", href: "/about" },
  { label: "Get started — request a workspace", hint: "Action", href: "/get-started" },
  { label: "Contact — talk to us", hint: "Action", href: "/contact" },
  { label: "Sign in", hint: "Workspace", href: siteConfig.authEntry },
] as const;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()),
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setIndex(0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command palette (Cmd+K)"
        title="Search — ⌘K"
        className="hidden size-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:text-foreground sm:inline-flex"
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
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/20 p-4 pt-[18vh] backdrop-blur-sm"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-panel border border-border bg-surface shadow-high"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setIndex((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && results[index]) {
              router.push(results[index].href);
              close();
            }
          }}
          placeholder="Where to? Type to search…"
          className="w-full border-b border-border bg-transparent px-5 py-4 text-sm outline-none placeholder:text-muted-subtle"
        />
        <ul className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted">
              No matches.
            </li>
          )}
          {results.map((c, i) => (
            <li key={c.href}>
              <button
                type="button"
                onClick={() => {
                  router.push(c.href);
                  close();
                }}
                onMouseEnter={() => setIndex(i)}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm transition-colors ${
                  i === index ? "bg-accent-soft text-accent" : "text-foreground"
                }`}
              >
                {c.label}
                <span className="font-mono text-[10px] tracking-wider text-muted-subtle uppercase">
                  {c.hint}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
