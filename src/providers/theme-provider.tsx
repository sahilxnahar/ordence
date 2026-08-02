"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Theme provider — black by default, system preference ignored.
 *
 * Ordence is a black site. Following the OS meant half of visitors landed
 * on a white canvas that the accent palette, the WebGL bands and the gold
 * were never designed for, so the brand had two faces and only one of
 * them was art-directed. `enableSystem={false}` makes the intended one
 * unconditional; the toggle stays, so anyone who wants light can still
 * have it.
 *
 * `suppressHydrationWarning` on <html> is required because the theme class
 * is applied before hydration by next-themes' inline script.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
