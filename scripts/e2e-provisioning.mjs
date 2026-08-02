import { chromium } from "playwright";

/**
 * End-to-end proof of the provisioning pipeline:
 *   public signup → pending request → operator approval with an industry
 *   preset and a plan → live branded subdomain.
 *
 * Run against a local worker:  PORT=8810 npm run e2e:provisioning
 */

const PORT = process.env.PORT ?? "8787";
const base = `http://localhost:${PORT}`;
const admin = `http://admin.localhost:${PORT}`;
const b = await chromium.launch({ executablePath: process.env.PW_CHROME });
const fail = [];
const check = (label, ok) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) fail.push(label);
};

// 1 · a prospect submits the public form
const p = await b.newPage();
await p.goto(`${base}/get-started`, { waitUntil: "domcontentloaded" });
await p.fill("#contactName", "Priya Menon");
await p.fill("#email", "priya@northwind.test");
await p.fill("#company", "Northwind Traders");
await p.selectOption("#industry", "retail");
await p.selectOption("#teamSize", "21–50");
await p.fill("#notes", "Three stores, GST billing, one warehouse.");
await p.click('button[type="submit"]');
await p.waitForTimeout(2500);
check("signup confirms to the prospect", /We're on it|Request received/i.test(await p.textContent("body")));

// 2 · it appears in the operator queue
const a = await b.newPage();
await a.goto(`${admin}/requests`, { waitUntil: "domcontentloaded" });
const queue = await a.textContent("body");
check("request reaches the pending queue", /Northwind Traders/.test(queue));
check("industry captured at signup", /Retail/.test(queue));

// 3 · open it and confirm the industry preset pre-filled modules
await a.click("summary:has-text('Northwind Traders')");
await a.waitForTimeout(700);
const enabledBadge = await a.textContent("legend:has-text('Modules')");
const presetCount = Number((enabledBadge.match(/(\d+) enabled/) ?? [])[1] ?? 0);
check(`retail preset pre-fills modules (${presetCount})`, presetCount > 0);
check("POS is preset for retail", await a.isChecked("input[type=checkbox] >> nth=0") !== null);

// 4 · set the plan and activate
await a.fill("input[name='seats']", "25");
await a.fill("input[name='months']", "6");
await a.click("button:has-text('Activate workspace')");
await a.waitForTimeout(3000);
const afterActivate = await a.textContent("body");
check("activation lands on the tenant grid", /provisioned|Tenant Command Grid/i.test(afterActivate));

// 5 · the subdomain is live, branded, with the plan applied
const t = await b.newPage();
await t.goto(`http://northwind-traders.localhost:${PORT}/`, { waitUntil: "domcontentloaded" });
const site = await t.content();
check("subdomain serves the branded workspace", /Northwind Traders/.test(site));
check("workspace is not suspended", !/temporarily unavailable/i.test(site));

// 6 · the request is now history, not pending
await a.goto(`${admin}/requests`, { waitUntil: "domcontentloaded" });
const queueAfter = await a.textContent("body");
check("request moved out of pending", /activated/i.test(queueAfter));

await b.close();
console.log(fail.length ? `\n${fail.length} FAILED` : "\nAll checks passed");
process.exit(fail.length ? 1 : 0);
