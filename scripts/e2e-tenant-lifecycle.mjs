import { chromium } from "playwright";

const PORT = process.env.PORT ?? "8796";
const b = await chromium.launch({ executablePath: process.env.PW_CHROME });
const p = await b.newPage();

// 1 · provision a fresh tenant through the admin UI
await p.goto(`http://admin.localhost:${PORT}/tenants`, { waitUntil: "domcontentloaded" });
await p.fill("#name", "Delta Freight");
await p.fill("#slug", "delta");
await p.click('button[type="submit"]');
await p.waitForTimeout(2500);

// 2 · its own subdomain should serve immediately
const t = await b.newPage();
await t.goto(`http://delta.localhost:${PORT}/`, { waitUntil: "domcontentloaded" });
console.log("LIVE_AFTER_CREATE:", /Welcome to Delta Freight/.test(await t.textContent("body")));

// 3 · suspend it from the grid
await p.goto(`http://admin.localhost:${PORT}/tenants`, { waitUntil: "domcontentloaded" });
for (const row of await p.$$("tbody tr")) {
  if (/Delta Freight/.test(await row.textContent())) {
    const btn = await row.$('button:text("Suspend")');
    if (btn) {
      await btn.click();
      await p.waitForTimeout(2500);
    }
    break;
  }
}

// 4 · after the 15s L1 cache window, the hostname must stop serving
await new Promise((r) => setTimeout(r, 17000));
await t.goto(`http://delta.localhost:${PORT}/`, { waitUntil: "domcontentloaded" });
// innerText, not textContent: textContent includes <script> bodies, and the
// RSC flight payload for this route carries the serialized not-found
// component. Asserting against it reported a bare 404 on a page that
// visibly renders the suspension notice.
const afterText = await t.innerText("body");
console.log("BLOCKED_AFTER_SUSPEND:", /temporarily unavailable/i.test(afterText));
console.log("NOT_A_BARE_404:", !/doesn.t exist/i.test(afterText));

await b.close();
