/**
 * Platform-level configuration. Single source of truth for the root
 * domain — middleware, metadata, and tenant resolution all read from here.
 */
export const siteConfig = {
  name: "Ordence",
  tagline: "The operating system for ambitious businesses.",
  description:
    "Ordence unifies CRM, ERP, web development and AI services on one enterprise-grade platform.",
  /** Apex production domain. Override per-environment via env var. */
  rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "ordence.com",
  url: `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "ordence.com"}`,
  links: {
    twitter: "https://x.com/ordence",
    linkedin: "https://linkedin.com/company/ordence",
  },
} as const;

export type SiteConfig = typeof siteConfig;
