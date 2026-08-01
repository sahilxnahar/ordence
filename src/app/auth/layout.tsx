import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

/**
 * Auth layout — focused, chromeless, centered.
 * No navigation: nothing should compete with the credential flow.
 */

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center p-6">
      <div className="bg-aurora absolute inset-0" aria-hidden="true" />
      <Link
        href="/"
        aria-label="Back to ordence.com"
        className="absolute top-6 left-6 text-foreground"
      >
        <Logo />
      </Link>
      <main id="main" className="relative w-full max-w-sm">
        {children}
      </main>
    </div>
  );
}
