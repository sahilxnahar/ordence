import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import { siteConfig } from "@/config/site";
import "./globals.css";

/**
 * Root layout — shared by every surface (marketing, admin, tenants, auth).
 * Owns: fonts, color-scheme, theme provider, base metadata.
 * Surface-specific chrome lives in nested layouts.
 */

const fontSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const fontMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/** Display voice — geometric, confident, pairs with the orbital wordmark. */
const fontDisplay = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    url: siteConfig.url,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Ordence" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
  },
  // Official brand-kit favicon set (public/ + src/app/favicon.ico).
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/ordence-icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/ordence-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/ordence-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/ordence-icon-180.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0b101b" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontMono.variable} ${fontDisplay.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Organization structured data for rich search results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: siteConfig.name,
              url: siteConfig.url,
              logo: `${siteConfig.url}/ordence-icon-512.png`,
              description: siteConfig.description,
              sameAs: [siteConfig.links.twitter, siteConfig.links.linkedin],
            }),
          }}
        />
        <ThemeProvider>
          {/* Skip link: first tabbable element on every page */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            Skip to content
          </a>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
