// Needs playwright and a local server:  npm run serve  (in another terminal)
import { chromium } from 'playwright';
const PAGES = ['/', '/crm', '/erp', '/ai', '/services', '/pricing', '/case-study',
  '/about', '/security', '/get-started', '/contact', '/compare', '/integrations',
  '/industries', '/process', '/faq', '/glossary', '/tour', '/sitemap',
  '/tally-alternative', '/gst-billing-software', '/crm-for-real-estate',
  '/gstr-2b-reconciliation', '/migration-checklist', '/worked-example-distribution', '/design-system',
  '/roi', '/scope', '/privacy', '/terms', '/404.html'];
const b = await chromium.launch();
// The forms load Turnstile from challenges.cloudflare.com, which this
// sandbox cannot reach — `networkidle` would wait for it forever. Block
// anything off-origin; none of it affects what we measure.
const blockOffOrigin = ctx => ctx.route('**/*', r =>
  r.request().url().startsWith('http://localhost:8899') ? r.continue() : r.abort());
const problems = [];
for (const vp of [{w:1440,h:900,tag:'desk'},{w:390,h:844,tag:'mob'}]) {
  const ctx = await b.newContext({ viewport:{width:vp.w,height:vp.h}, deviceScaleFactor:1 });
  await blockOffOrigin(ctx);
  for (const p of PAGES) {
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', m => {
      // Ignore the failure we caused ourselves by blocking off-origin
      // requests — that is the Turnstile script, not a page defect.
      const t = m.text();
      if (m.type()==='error' && !t.includes('ERR_FAILED')) errs.push(t);
    });
    page.on('pageerror', e => errs.push('PAGEERROR: '+e.message));
    const res = await page.goto('http://localhost:8899'+(p==='/'?'/':p.endsWith('.html')?p:p+'/'), {waitUntil:'networkidle'});
    await page.waitForTimeout(700);
    const m = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      h1: document.querySelectorAll('h1').length,
      h1text: document.querySelector('h1')?.textContent.trim().slice(0,50),
      cookie: !!document.querySelector('#cookie.on'),
      links: [...document.querySelectorAll('a[href^="/"]')].map(a=>a.getAttribute('href')),
    }));
    const over = m.scrollW - m.clientW;
    if (over > 1) problems.push(`${vp.tag} ${p}: ${over}px horizontal overflow`);
    if (m.h1 !== 1) problems.push(`${vp.tag} ${p}: ${m.h1} h1 elements`);
    if (errs.length) problems.push(`${vp.tag} ${p}: ${errs.slice(0,2).join(' | ')}`);
    if (res.status() !== 200) problems.push(`${vp.tag} ${p}: HTTP ${res.status()}`);
    if (vp.tag==='desk') {
      const name = p==='/'?'home':p.slice(1);
      await page.screenshot({path:`/home/claude/shots/${name}.png`});
      globalThis.LINKS ??= new Set(); m.links.forEach(l=>LINKS.add(l));
    }
    await page.close();
  }
  await ctx.close();
}
// dead internal links
const ctx = await b.newContext();
await blockOffOrigin(ctx);
const pg = await ctx.newPage();
for (const l of [...(globalThis.LINKS||[])].sort()) {
  const url = 'http://localhost:8899' + (l.endsWith('/')||l.endsWith('.html')?l:l+'/');
  const r = await pg.goto(url).catch(()=>null);
  if (!r || r.status()>=400) problems.push(`dead link: ${l} -> ${r?r.status():'ERR'}`);
}
await b.close();
console.log(problems.length ? 'PROBLEMS:\n'+problems.join('\n') : 'clean: no overflow, no console errors, no dead links, one h1 per page');
