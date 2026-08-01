"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Theme provider — class-based dark mode with system preference default.
 * `suppressHydrationWarning` on <html> is required because the theme class
 * is applied before hydration by next-themes' inline script.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
