import { describe, expect, it } from "vitest";
import {
  daysRemaining,
  expiringSoon,
  summarizePlans,
  RENEWAL_WARNING_DAYS,
} from "./plan-view";
import type { Tenant } from "./types";

const at = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString();

function tenant(slug: string, days: number | null): Tenant {
  return {
    slug,
    name: slug,
    domains: [],
    branding: { accent: "#6d45e8", accentContrast: "#ffffff" },
    features: { crm: true, erp: false, ai: false, web: false },
    status: "active",
    ...(days === null
      ? {}
      : {
          plan: {
            industry: "retail",
            modules: ["contacts"],
            seats: 10,
            months: 12,
            startedAt: at(-30),
            expiresAt: at(days),
          },
        }),
  };
}

describe("daysRemaining", () => {
  // Pinned clock: comparing two independent Date.now() calls makes the
  // result depend on how many milliseconds elapsed between them, which
  // is exactly the kind of flake that erodes trust in a suite.
  const NOW = Date.parse("2026-08-02T00:00:00.000Z");

  it("counts whole days forward", () => {
    expect(daysRemaining("2026-08-12T00:00:00.000Z", NOW)).toBe(10);
  });

  it("floors partial days rather than rounding up", () => {
    expect(daysRemaining("2026-08-12T23:59:00.000Z", NOW)).toBe(10);
  });

  it("reports zero on the final day", () => {
    expect(daysRemaining("2026-08-02T18:00:00.000Z", NOW)).toBe(0);
  });

  it("goes negative once the plan has lapsed", () => {
    expect(daysRemaining("2026-07-30T00:00:00.000Z", NOW)).toBe(-3);
  });
});

describe("summarizePlans", () => {
  it("grades urgency across the lifecycle", async () => {
    const map = await summarizePlans([
      tenant("healthy", 200),
      tenant("soon", 20),
      tenant("critical", 3),
      tenant("expired", -5),
      tenant("noplan", null),
    ]);
    expect(map.get("healthy")?.urgency).toBe("healthy");
    expect(map.get("soon")?.urgency).toBe("soon");
    expect(map.get("critical")?.urgency).toBe("critical");
    expect(map.get("expired")?.urgency).toBe("expired");
    expect(map.get("noplan")?.urgency).toBe("none");
  });

  it("marks plan-less tenants rather than inventing a plan", async () => {
    const map = await summarizePlans([tenant("seed", null)]);
    expect(map.get("seed")?.hasPlan).toBe(false);
    expect(map.get("seed")?.expiresAt).toBeUndefined();
  });

  it("carries seats through for display", async () => {
    const map = await summarizePlans([tenant("acme", 100)]);
    expect(map.get("acme")?.seats).toBe(10);
  });
});

describe("expiringSoon", () => {
  it("includes only plans inside the warning window", async () => {
    const rows = await expiringSoon([
      tenant("far", 200),
      tenant("near", 10),
      tenant("lapsed", -2),
    ]);
    expect(rows.map((r) => r.tenant.slug)).toEqual(["lapsed", "near"]);
  });

  it("sorts most urgent first", async () => {
    const rows = await expiringSoon([
      tenant("b", 25),
      tenant("a", 2),
      tenant("c", 15),
    ]);
    expect(rows.map((r) => r.tenant.slug)).toEqual(["a", "c", "b"]);
  });

  it("ignores tenants with no plan", async () => {
    const rows = await expiringSoon([tenant("seed", null)]);
    expect(rows).toHaveLength(0);
  });

  it("respects a custom window", async () => {
    const rows = await expiringSoon([tenant("x", 45)], 60);
    expect(rows).toHaveLength(1);
    expect(RENEWAL_WARNING_DAYS).toBe(30);
  });
});
