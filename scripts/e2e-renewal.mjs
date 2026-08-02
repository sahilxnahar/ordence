import { chromium } from "playwright";

/**
 * Proves the commercial lifecycle end to end: activate a plan, see it in
 * the grid, renew it, and confirm the expiry actually moved.
 */

const PORT = process.env.PORT ?? "8787";
const admin = `http://admin.localhost:${PORT}`;
const b = await chromium.launch({ executablePath: process.env.PW_CHROME });
const fail = [];
const check = (label, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra ? "  " + extra : ""}`);
  if (!ok) fail.push(label);
};

// Seed a request, then activate it with a 1-month plan.
const p = await b.newPage();
await p.goto(`http://localhost:${PORT}/get-started`, { waitUntil: "domcontentloaded" });
await p.fill("#contactName", "Asha Rao");
await p.fill("#email", "asha@lumen.test");
await p.fill("#company", "Lumen Foods");
await p.selectOption("#industry", "retail");
await p.click('button[type="submit"]');
await p.waitForTimeout(2500);

const a = await b.newPage();
await a.goto(`${admin}/requests`, { waitUntil: "domcontentloaded" });
await a.click("summary:has-text('Lumen Foods')");
await a.waitForTimeout(600);
await a.fill("input[name='months']", "1");
await a.fill("input[name='seats']", "12");
await a.click("button:has-text('Activate workspace')");
await a.waitForTimeout(3000);

// Grid should now show the plan, not "No plan".
await a.goto(`${admin}/tenants`, { waitUntil: "domcontentloaded" });
const gridRow = await a
  .locator("tr", { hasText: "Lumen Foods" })
  .first()
  .textContent();
const firstDays = Number((gridRow.match(/(\d+)d left/) ?? [])[1] ?? -1);
check("plan appears in the grid", /d left/.test(gridRow), gridRow.match(/\d+d left/)?.[0] ?? "");
check("seat count shown", /12 users/.test(gridRow));
check("one-month term is ~30 days", firstDays >= 27 && firstDays <= 31, `${firstDays}d`);

// Health should list it as expiring soon (within 30 days).
await a.goto(`${admin}/health`, { waitUntil: "domcontentloaded" });
check("appears in renewals panel", /Lumen Foods/.test(await a.textContent("body")));

// Renew for 12 months and confirm the expiry moved.
await a.goto(`${admin}/tenants`, { waitUntil: "domcontentloaded" });
const row = a.locator("tr", { hasText: "Lumen Foods" }).first();
await row.locator("input[name='renewMonths']").fill("12");
await row.locator("button:has-text('Renew')").click();
await a.waitForTimeout(3000);

const renewedRow = await a
  .locator("tr", { hasText: "Lumen Foods" })
  .first()
  .textContent();
const afterDays = Number((renewedRow.match(/(\d+)d left/) ?? [])[1] ?? -1);
check("renewal extended the term", afterDays > firstDays + 300, `${firstDays}d → ${afterDays}d`);

// And it should have dropped off the renewals list.
await a.goto(`${admin}/health`, { waitUntil: "domcontentloaded" });
check("no longer flagged for renewal", !/Lumen Foods/.test(await a.textContent("body")));

await b.close();
console.log(fail.length ? `\n${fail.length} FAILED` : "\nAll checks passed");
process.exit(fail.length ? 1 : 0);
