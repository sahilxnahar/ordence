import { chromium } from "playwright";

/**
 * Mobile navigation smoke test.
 * Guards the regression where the sheet was trapped inside the header's
 * backdrop-filter containing block (rendered ~96px tall instead of full
 * screen, hiding every link).
 */

const PORT = process.env.PORT ?? "8787";
const b = await chromium.launch({ executablePath: process.env.PW_CHROME });
const p = await b.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});

await p.goto(`http://localhost:${PORT}/`, { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2000);
await p.click('button[aria-label="Open menu"]');
await p.waitForTimeout(900);

const sheet = await p.$('[role="dialog"][aria-label="Site menu"]');
const box = await sheet.boundingBox();
console.log("SHEET_FULL_HEIGHT:", box.height > 800, `(${Math.round(box.height)}px)`);
console.log("SHEET_ANCHORED_RIGHT:", Math.round(box.x + box.width) === 390);
console.log("ALL_LINKS_VISIBLE:", (await p.$$('[role="dialog"] nav a')).length === 9);
console.log("LINK_HITTABLE:", await p.isVisible('[role="dialog"] nav a:text("Pricing")'));

if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT });

// Escape closes and focus returns to the trigger.
await p.keyboard.press("Escape");
await p.waitForTimeout(600);
console.log("ESCAPE_CLOSES:", (await p.$('[role="dialog"]')) === null);

await b.close();
