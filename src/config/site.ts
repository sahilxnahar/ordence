/**
 * Platform-level configuration. Single source of truth for the root
 * domain — middleware, metadata, and tenant resolution all read from here.
 */

const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "ordence.com";

export const siteConfig = {
  name: "Ordence",
  tagline: "The operating system for ambitious businesses.",
  description:
    "Ordence unifies CRM, ERP, web development and AI services on one enterprise-grade platform.",
  /** Apex production domain. Override per-environment via env var. */
  rootDomain,
  url: `https://${rootDomain}`,

  /**
   * The CRM workspace, served by a SEPARATE application at
   * app.ordence.com — this marketing Worker never renders it.
   *
   * `authEntry` is the single seam for every "Sign in" / "Get started"
   * call-to-action on the site. It currently points at the local
   * marketing auth page; change it to `appUrl` in one place the day the
   * CRM's own login is live, and every CTA across the site follows.
   */
  appUrl: `https://app.${rootDomain}`,
  authEntry: "/auth/login" as string,

  links: {
    twitter: "https://x.com/ordence",
    linkedin: "https://linkedin.com/company/ordence",
  },
} as const;

export type SiteConfig = typeof siteConfig;
