/* Batch 22 — one social image per page.
 *
 * Rendered from HTML by the same browser that renders the site, rather
 * than composed in an image library: the type is the site's type, the
 * palette is the site's palette, and when the brand changes these change
 * with it instead of drifting.
 *
 * Every page shared one identical og.png before this, so a link to /erp
 * in a WhatsApp group looked exactly like a link to /privacy.
 */
import pw from '/home/claude/.npm-global/lib/node_modules/playwright/index.js';
import { readFileSync, mkdirSync } from 'node:fs';
const { chromium } = pw;

const pages = JSON.parse(readFileSync('og-manifest.json', 'utf8'));
mkdirSync('dist/og', { recursive: true });

const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const p = await c.newPage();

const card = (t) => `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#08090c;color:#f4f5f7;
  font:400 16px/1.5 ui-sans-serif,-apple-system,"Segoe UI",system-ui,sans-serif;
  padding:74px 78px;display:flex;flex-direction:column;justify-content:space-between;
  position:relative;overflow:hidden}
.glow{position:absolute;right:-180px;top:-160px;width:660px;height:660px;border-radius:50%;
  background:radial-gradient(circle,rgba(133,99,238,.30),transparent 65%)}
.top{position:relative;display:flex;align-items:center;gap:13px;
  font-weight:600;font-size:15px;letter-spacing:.18em}
.dot{width:11px;height:11px;border-radius:50%;background:#8563ee}
.eyebrow{position:relative;margin-top:52px;font-family:ui-monospace,Menlo,monospace;
  font-size:15px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.48)}
h1{position:relative;margin-top:20px;font-size:${t.h.length > 44 ? 58 : 70}px;
  line-height:1.04;letter-spacing:-.032em;font-weight:700;max-width:19ch}
.accent{color:#8563ee}
.facts{position:relative;display:flex;gap:56px;padding-top:30px;
  border-top:1px solid rgba(244,245,247,.12)}
.facts div{display:flex;flex-direction:column;gap:7px;max-width:250px}
.facts b{font-size:34px;line-height:1;letter-spacing:-.02em;font-weight:700}
.facts span{font-size:15px;line-height:1.35;color:rgba(255,255,255,.48)}
</style></head><body>
<div class="glow"></div>
<div class="top"><span class="dot"></span>ORDENCE</div>
<div><p class="eyebrow">${t.e}</p><h1>${t.h}</h1></div>
<div class="facts">${t.f.map(([v, l]) =>
  `<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>
</body></html>`;

let n = 0;
for (const t of pages) {
  await p.setContent(card(t), { waitUntil: 'load' });
  await p.screenshot({ path: `dist/og/${t.slug || 'home'}.png` });
  n++;
}
await b.close();
console.log(`${n} social images`);
