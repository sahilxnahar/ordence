import { chromium } from "playwright";

/**
 * Performance budget probe. Measures what a real visitor actually pays
 * for on a given route: transferred JS, canvas/WebGL context count, and
 * how much of the main thread is blocked after load.
 *
 *   PW_CHROME=<chromium> PORT=8787 node scripts/measure-page.mjs /
 */

const PORT = process.env.PORT ?? "8787";
const route = process.argv[2] ?? "/";
const b = await chromium.launch({ executablePath: process.env.PW_CHROME });
// MOBILE=1 emulates a mid-range phone, which is the profile that
// decides whether heavy scenery is a good idea.
const mobile = process.env.MOBILE === "1";
const page = await b.newPage(
  mobile
    ? {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      }
    : { viewport: { width: 1440, height: 900 } },
);

let jsBytes = 0;
let cssBytes = 0;
let requests = 0;
const scripts = [];
// Measure the actual body, not the content-length header: the local
// worker doesn't set that header, which silently reported 0 KB.
const pending = [];
page.on("response", (res) => {
  requests += 1;
  const type = res.request().resourceType();
  if (type !== "script" && type !== "stylesheet") return;
  pending.push(
    res
      .body()
      .then((buf) => {
        if (type === "script") {
          jsBytes += buf.length;
          scripts.push({ url: res.url().split("/").pop(), kb: buf.length / 1024 });
        } else {
          cssBytes += buf.length;
        }
      })
      .catch(() => {}),
  );
});

await page.goto(`http://localhost:${PORT}${route}`, {
  waitUntil: "networkidle",
});
await page.waitForTimeout(3000);

const stats = await page.evaluate(() => {
  const canvases = [...document.querySelectorAll("canvas")];
  let webgl = 0;
  for (const c of canvases) {
    // A canvas already bound to a WebGL context returns that same context;
    // asking for "2d" on it returns null, which is how we tell them apart.
    if (c.getContext("2d") === null) webgl += 1;
  }
  const nav = performance.getEntriesByType("navigation")[0];
  const longTasks = performance
    .getEntriesByType("longtask")
    .reduce((sum, t) => sum + t.duration, 0);
  return {
    canvases: canvases.length,
    webglContexts: webgl,
    domNodes: document.querySelectorAll("*").length,
    domContentLoaded: Math.round(nav?.domContentLoadedEventEnd ?? 0),
    longTaskMs: Math.round(longTasks),
  };
});

await Promise.all(pending);

console.log(`profile          ${mobile ? "mobile 390x844" : "desktop 1440x900"}`);
console.log(`route            ${route}`);
console.log(`requests         ${requests}`);
console.log(`js transferred   ${(jsBytes / 1024).toFixed(0)} KB`);
console.log(`css transferred  ${(cssBytes / 1024).toFixed(0)} KB`);
console.log(`canvases         ${stats.canvases}`);
console.log(`webgl contexts   ${stats.webglContexts}`);
console.log(`dom nodes        ${stats.domNodes}`);
console.log(`dom ready        ${stats.domContentLoaded} ms`);
console.log(`long tasks       ${stats.longTaskMs} ms`);
const heaviest = scripts.sort((a, b) => b.kb - a.kb).slice(0, 3);
for (const s of heaviest) {
  console.log(`  heaviest js    ${s.kb.toFixed(0)} KB  ${s.url}`);
}

await b.close();
