import { describe, expect, it } from "vitest";
import { applyPlanState } from "./store";
import { productsFromModules, industryByKey, INDUSTRY_PACKS } from "./industries";
import type { Tenant } from "./types";

/**
 * Plan enforcement is the difference between "we sold a 6-month plan" and
 * "we gave it away forever", so it gets the same scrutiny as routing.
 */

function tenantWithExpiry(expiresAt: string, status: Tenant["status"] = "active"): Tenant {
  return {
    slug: "acme",
    name: "Acme",
    domains: [],
    branding: { accent: "#6d45e8", accentContrast: "#ffffff" },
    features: { crm: true, erp: false, ai: false, web: false },
    status,
    plan: {
      industry: "retail",
      modules: ["contacts", "pipeline"],
      seats: 10,
      months: 6,
      startedAt: new Date(Date.now() - 1000).toISOString(),
      expiresAt,
    },
  };
}

const inDays = (n: number) =>
  new Date(Date.now() + n * 86_400_000).toISOString();

describe("applyPlanState", () => {
  it("leaves a live plan active", () => {
    const t = applyPlanState(tenantWithExpiry(inDays(30)));
    expect(t?.status).toBe("active");
  });

  it("suspends a tenant the moment its plan lapses", () => {
    const t = applyPlanState(tenantWithExpiry(inDays(-1)));
    expect(t?.status).toBe("suspended");
  });

  it("treats an expiry exactly now as lapsed", () => {
    const t = applyPlanState(tenantWithExpiry(new Date().toISOString()));
    expect(t?.status).toBe("suspended");
  });

  it("keeps a manual suspension suspended even with time left", () => {
    const t = applyPlanState(tenantWithExpiry(inDays(30), "suspended"));
    expect(t?.status).toBe("suspended");
  });

  it("passes through tenants that have no plan (seed/legacy)", () => {
    const seed: Tenant = {
      slug: "ameyaa",
      name: "Ameyaa",
      domains: [],
      branding: { accent: "#6d45e8", accentContrast: "#ffffff" },
      features: { crm: true, erp: false, ai: true, web: true },
      status: "active",
    };
    expect(applyPlanState(seed)?.status).toBe("active");
  });

  it("passes null through untouched", () => {
    expect(applyPlanState(null)).toBeNull();
  });
});

describe("productsFromModules", () => {
  it("derives product flags from the module set", () => {
    expect(productsFromModules(["contacts", "invoicing"])).toEqual({
      crm: true,
      erp: true,
      ai: false,
      web: false,
    });
  });

  it("reports every product off for an empty selection", () => {
    expect(productsFromModules([])).toEqual({
      crm: false,
      erp: false,
      ai: false,
      web: false,
    });
  });

  it("ignores unknown module keys rather than throwing", () => {
    expect(productsFromModules(["not-a-module"]).crm).toBe(false);
  });
});

describe("industry packs", () => {
  it("exposes all ten verticals", () => {
    expect(INDUSTRY_PACKS).toHaveLength(10);
  });

  it("gives every pack a non-empty preset", () => {
    for (const pack of INDUSTRY_PACKS) {
      expect(pack.modules.length).toBeGreaterThan(0);
    }
  });

  it("presets at least one billable product for every pack", () => {
    for (const pack of INDUSTRY_PACKS) {
      const products = productsFromModules(pack.modules);
      expect(Object.values(products).some(Boolean)).toBe(true);
    }
  });

  it("returns null for an unknown industry key", () => {
    expect(industryByKey("space-tourism")).toBeNull();
  });
});
