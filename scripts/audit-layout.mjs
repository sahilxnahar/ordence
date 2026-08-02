import { chromium } from "playwright";

/**
 * Layout consistency audit.
 *
 * Alignment problems are rarely one broken element — they are a system
 * that drifted: three container widths where there should be one, six
 * section paddings where there should be three, a heading that is 44px
 * here and 40px there. This measures the drift so it can be fixed at the
 * token level rather than patched per page.
 */

const PORT = process.env.PORT ?? "8787";
const ROUTES = ["/", "/platform", "/product", "/crm", "/erp", "/ai", "/services",
  "/pricing", "/get-started", "/contact", "/about", "/insights", "/changelog"];
const WIDTHS = [1440, 1280, 1024, 768, 390];

const b = await chromium.launch({ executablePath: process.env.PW_CHROME,
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });

const containerEdges = new Map();
const sectionPads = new Map();
const headingSizes = new Map();
const overflow = [];
const gutters = new Map();

for (const width of WIDTHS) {
  const ctx = await b.newContext({ viewport: { width, height: 900 } });
  const p = await ctx.newPage();
  for (const route of ROUTES) {
    await p.goto(`http://localhost:${PORT}${route}`, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(500);

    const data = await p.evaluate((w) => {
      const out = { edges: [], pads: [], heads: [], over: [], gutters: [] };

      // horizontal overflow — the most visible alignment bug there is
      const de = document.documentElement;
      if (de.scrollWidth > de.clientWidth + 1) {
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && (r.right > de.clientWidth + 1 || r.left < -1)) {
            out.over.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className?.toString?.() ?? "").slice(0, 70),
              left: Math.round(r.left), right: Math.round(r.right),
            });
            if (out.over.length > 3) break;
          }
        }
      }

      // left edge of every top-level content container
      // Sections are the page's structural unit; the Container inside each
      // one establishes the content edge everything should share.
      for (const section of document.querySelectorAll("main > section, main > div > section, body > section")) {
        const sr = section.getBoundingClientRect();
        if (sr.height < 40) continue;
        const container = section.querySelector(".mx-auto");
        if (container) {
          const cr = container.getBoundingClientRect();
          if (cr.width > 200) {
            out.edges.push(Math.round(cr.left));
            out.gutters.push(Math.round(cr.width));
            const cs = getComputedStyle(container);
            out.pads.push(`${cs.paddingTop}/${cs.paddingBottom}`);
          }
        }
      }

      for (const h of document.querySelectorAll("h1,h2,h3")) {
        const cs = getComputedStyle(h);
        if (h.getBoundingClientRect().height > 0) {
          out.heads.push(`${h.tagName}:${cs.fontSize}`);
        }
      }
      return out;
    }, width);

    for (const o of data.over) overflow.push({ route, width, ...o });
    for (const e of data.edges) key(containerEdges, `${width}px`, e);
    for (const g of data.gutters) key(gutters, `${width}px`, g);
    for (const pd of data.pads) key(sectionPads, `${width}px`, pd);
    for (const h of data.heads) key(headingSizes, `${width}px`, h);
  }
  await ctx.close();
}

function key(map, k, v) {
  if (!map.has(k)) map.set(k, new Map());
  const m = map.get(k);
  m.set(v, (m.get(v) ?? 0) + 1);
}
function report(title, map, limit = 12) {
  console.log(`\n— ${title} —`);
  for (const [w, m] of map) {
    const sorted = [...m].sort((a, b) => b[1] - a[1]).slice(0, limit);
    console.log(`  ${w}: ${m.size} distinct`);
    console.log(`    ${sorted.map(([v, n]) => `${v}×${n}`).join("  ")}`);
  }
}

console.log(`\n=== HORIZONTAL OVERFLOW (${overflow.length}) ===`);
for (const o of overflow.slice(0, 25)) {
  console.log(`  ${o.route} @${o.width}  <${o.tag}> ${o.left}→${o.right}  .${o.cls}`);
}
report("content left edge", containerEdges);
report("outer gutter", gutters);
report("section vertical padding", sectionPads);
report("heading sizes", headingSizes, 14);

await b.close();
