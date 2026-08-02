import { describe, expect, it } from "vitest";
import { classifyHost, isValidTenantSlug, normalizeHost } from "./resolve";

/**
 * Host classification is the highest-risk pure logic in the codebase:
 * a mistake here either breaks every route or — far worse — leaks one
 * tenant's surface onto another's hostname. It has no I/O, so it can be
 * exhaustively tested with zero mocks.
 */

const ROOT = "ordence.com";

describe("normalizeHost", () => {
  it("lowercases and strips the port", () => {
    expect(normalizeHost("Ameyaa.Ordence.com:443")).toBe("ameyaa.ordence.com");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeHost("  ordence.com  ")).toBe("ordence.com");
  });

  it("preserves IPv6 hosts", () => {
    expect(normalizeHost("[::1]")).toBe("[::1]");
  });
});

describe("classifyHost — platform surfaces", () => {
  it("routes the apex and www to marketing", () => {
    expect(classifyHost("ordence.com", ROOT).surface).toBe("marketing");
    expect(classifyHost("www.ordence.com", ROOT).surface).toBe("marketing");
  });

  it("routes the admin and app subdomains to their own surfaces", () => {
    expect(classifyHost("admin.ordence.com", ROOT).surface).toBe("admin");
    expect(classifyHost("app.ordence.com", ROOT).surface).toBe("app");
  });

  it("treats Cloudflare preview hosts as previews", () => {
    expect(classifyHost("ordence.sahil.workers.dev", ROOT).surface).toBe(
      "preview",
    );
    expect(classifyHost("abc123.pages.dev", ROOT).surface).toBe("preview");
  });
});

describe("classifyHost — tenants", () => {
  it("extracts the slug from a tenant subdomain", () => {
    const decision = classifyHost("ameyaa.ordence.com", ROOT);
    expect(decision.surface).toBe("tenant");
    expect(decision.tenantSlug).toBe("ameyaa");
  });

  it("defers unknown apex domains to custom-domain lookup", () => {
    const decision = classifyHost("customclientdomain.com", ROOT);
    expect(decision.surface).toBe("tenant");
    expect(decision.customDomain).toBe("customclientdomain.com");
    expect(decision.tenantSlug).toBeUndefined();
  });

  it("never lets a reserved subdomain become a tenant", () => {
    for (const reserved of ["api", "cdn", "assets", "mail", "status", "docs"]) {
      const decision = classifyHost(`${reserved}.${ROOT}`, ROOT);
      expect(decision.surface).toBe("marketing");
      expect(decision.tenantSlug).toBeUndefined();
    }
  });

  it("rejects nested labels rather than guessing a tenant", () => {
    // a.b.ordence.com must not resolve to tenant "a" or "b"
    const decision = classifyHost("a.b.ordence.com", ROOT);
    expect(decision.surface).toBe("marketing");
    expect(decision.tenantSlug).toBeUndefined();
  });

  it("does not confuse a lookalike domain with the root domain", () => {
    // notordence.com must be treated as a custom domain, never marketing
    const decision = classifyHost("notordence.com", ROOT);
    expect(decision.surface).toBe("tenant");
    expect(decision.customDomain).toBe("notordence.com");
  });
});

describe("classifyHost — local development parity", () => {
  it("maps bare localhost to marketing", () => {
    expect(classifyHost("localhost:3000", ROOT).surface).toBe("marketing");
    expect(classifyHost("127.0.0.1:3000", ROOT).surface).toBe("marketing");
  });

  it("mirrors production shapes on *.localhost", () => {
    expect(classifyHost("admin.localhost:3000", ROOT).surface).toBe("admin");
    expect(classifyHost("app.localhost:3000", ROOT).surface).toBe("app");
    const tenant = classifyHost("ameyaa.localhost:3000", ROOT);
    expect(tenant.surface).toBe("tenant");
    expect(tenant.tenantSlug).toBe("ameyaa");
  });

  it("honours reserved names locally too", () => {
    expect(classifyHost("www.localhost:3000", ROOT).surface).toBe("marketing");
  });
});

describe("isValidTenantSlug", () => {
  it("accepts ordinary slugs", () => {
    expect(isValidTenantSlug("ameyaa")).toBe(true);
    expect(isValidTenantSlug("client-x")).toBe(true);
    expect(isValidTenantSlug("a1")).toBe(true);
  });

  it("rejects anything that could escape a URL segment", () => {
    for (const bad of [
      "../etc",
      "has space",
      "UPPER",
      "-leading",
      "trailing-",
      "under_score",
      "",
      "a".repeat(64),
    ]) {
      expect(isValidTenantSlug(bad)).toBe(false);
    }
  });
});
