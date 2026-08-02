import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated accessibility audit across every public route.
 *
 * Automated checks catch roughly a third of real accessibility problems —
 * they cannot judge whether alt text is *meaningful* or whether a focus
 * order makes sense. They do reliably catch contrast failures, missing
 * names, and broken landmark structure, which is exactly the class of
 * defect that creeps in during rapid visual iteration.
 *
 *   PW_CHROME=<chromium> PORT=8787 npm run audit:a11y
 */

const PORT = process.env.PORT ?? "8787";
const ROUTES = [
  "/",
  "/platform",
  "/product",
  "/crm",
  "/erp",
  "/ai",
  "/services",
  "/pricing",
  "/get-started",
  "/contact",
  "/about",
  "/insights",
  "/changelog",
  "/auth/login",
];

const b = await chromium.launch({ executablePath: process.env.PW_CHROME });
// axe requires an explicit context rather than browser.newPage().
const context = await b.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

let totalViolations = 0;
const byRule = new Map();

for (const route of ROUTES) {
  await page.goto(`http://localhost:${PORT}${route}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(800);

  // Scroll-triggered reveals sit at partial opacity until they enter the
  // viewport, and axe measures contrast against whatever opacity it finds.
  // Without this, every below-the-fold reveal is reported as a contrast
  // failure that no human would ever see. Walk the page, then return to top.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(900);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const violations = results.violations;
  totalViolations += violations.length;

  if (violations.length === 0) {
    console.log(`✓ ${route}`);
  } else {
    console.log(`✗ ${route}  (${violations.length})`);
    for (const v of violations) {
      console.log(`    [${v.impact}] ${v.id} — ${v.help} ×${v.nodes.length}`);
      console.log(`      e.g. ${v.nodes[0].target.join(" ")}`);
      byRule.set(v.id, (byRule.get(v.id) ?? 0) + v.nodes.length);
    }
  }
}

console.log("\n— summary —");
if (byRule.size === 0) {
  console.log("No WCAG A/AA violations detected across", ROUTES.length, "routes.");
} else {
  for (const [rule, count] of [...byRule].sort((a, b) => b[1] - a[1])) {
    console.log(`${String(count).padStart(4)}  ${rule}`);
  }
}

await b.close();
process.exit(totalViolations > 0 ? 1 : 0);
