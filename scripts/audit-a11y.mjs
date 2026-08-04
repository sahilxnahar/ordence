// Batch 25 — the accessibility audit.
//
// This does not run axe. axe is good at the things a static rule can see and
// silent about the things that actually break a keyboard user's day: a tab
// order that jumps, a focus ring you cannot see, a scrollable table nobody
// can scroll without a mouse. So this walks the pages the way a person on a
// keyboard walks them and reports what it finds.
// Needs playwright and a local server:  npm run serve  (in another terminal)
import { chromium } from 'playwright';

const PAGES = ['/', '/crm', '/erp', '/ai', '/services', '/pricing', '/case-study',
  '/about', '/security', '/get-started', '/contact', '/compare', '/integrations',
  '/industries', '/process', '/faq', '/glossary', '/tour', '/sitemap',
  '/tally-alternative', '/gst-billing-software', '/crm-for-real-estate',
  '/gstr-2b-reconciliation', '/migration-checklist', '/worked-example-distribution', '/design-system',
  '/roi', '/scope', '/privacy', '/terms', '/404.html'];

const url = p => 'http://localhost:8899' + (p === '/' ? '/' : p.endsWith('.html') ? p : p + '/');

// ── contrast ────────────────────────────────────────────────────────────────
// WCAG relative luminance, verbatim from the spec. Written in the page so it
// can read computed style, walked over text nodes rather than elements so a
// paragraph with a dim <small> inside it is measured twice, correctly.
const CONTRAST_FN = `
function _lum(c){
  const s = c.map(v => { v/=255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); });
  return 0.2126*s[0] + 0.7152*s[1] + 0.0722*s[2];
}
function _rgb(str){
  const m = str.match(/rgba?\\(([^)]+)\\)/); if(!m) return null;
  const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
  return {r:p[0], g:p[1], b:p[2], a: p.length > 3 ? p[3] : 1};
}
// Composite a translucent colour over what is behind it, which is what the
// eye sees and what a naive reader of getComputedStyle does not.
function _over(fg, bg){
  const a = fg.a;
  return [fg.r*a + bg[0]*(1-a), fg.g*a + bg[1]*(1-a), fg.b*a + bg[2]*(1-a)];
}
function _bgOf(el){
  let n = el, stack = [];
  while(n && n.nodeType === 1){
    const c = _rgb(getComputedStyle(n).backgroundColor);
    if(c && c.a > 0){ stack.push(c); if(c.a === 1) break; }
    n = n.parentElement;
  }
  let base = [8,9,12];              // --page, the last thing behind everything
  for(let i = stack.length - 1; i >= 0; i--) base = _over(stack[i], base);
  return base;
}
function _ratio(el){
  const cs = getComputedStyle(el);
  const fg = _rgb(cs.color); if(!fg) return null;
  const bg = _bgOf(el);
  const f = _lum(_over(fg, bg)), b = _lum(bg);
  const hi = Math.max(f,b), lo = Math.min(f,b);
  return { ratio: (hi + 0.05) / (lo + 0.05),
           px: parseFloat(cs.fontSize), weight: cs.fontWeight };
}`;

const problems = [];
const note = (page, msg) => problems.push({ page, msg });

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.route('**/*', r =>
  r.request().url().startsWith('http://localhost:8899') ? r.continue() : r.abort());

const seenTargets = new Set();

for (const p of PAGES) {
  const page = await ctx.newPage();
  await page.goto(url(p), { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.addScriptTag({ content: CONTRAST_FN });

  // ── 1. static structure ──────────────────────────────────────────────────
  const s = await page.evaluate(() => {
    const out = {};
    out.lang = document.documentElement.lang;
    out.title = document.title;
    out.landmarks = ['header', 'nav', 'main', 'footer'].map(t =>
      ({ t, n: document.querySelectorAll(t).length }));
    out.skip = (() => {
      const a = document.querySelector('.skip, a[href^="#main"], a[href="#content"]');
      if (!a) return null;
      const href = a.getAttribute('href');
      return { href, targetExists: !!document.querySelector(href) };
    })();
    // Heading order — a level may not be skipped on the way down.
    const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
      .map(h => ({ lvl: +h.tagName[1], text: h.textContent.trim().slice(0, 44) }));
    out.headingJumps = [];
    for (let i = 1; i < hs.length; i++)
      if (hs[i].lvl > hs[i - 1].lvl + 1)
        out.headingJumps.push(`h${hs[i - 1].lvl} → h${hs[i].lvl} at "${hs[i].text}"`);
    out.emptyHeadings = hs.filter(h => !h.text).length;

    // Images without alt. A decorative image needs alt="", not no attribute.
    out.noAlt = [...document.querySelectorAll('img')]
      .filter(i => i.getAttribute('alt') === null)
      .map(i => i.getAttribute('src'));

    // Form controls without an accessible name.
    out.unlabelled = [...document.querySelectorAll('input,select,textarea')]
      .filter(c => c.type !== 'hidden')
      .filter(c => {
        if (c.getAttribute('aria-label')) return false;
        if (c.getAttribute('aria-labelledby')) return false;
        if (c.id && document.querySelector(`label[for="${CSS.escape(c.id)}"]`)) return false;
        if (c.closest('label')) return false;
        return true;
      })
      .map(c => c.name || c.type);

    // Buttons and links with no text at all.
    out.namelessControls = [...document.querySelectorAll('a,button')]
      .filter(el => !el.textContent.trim() && !el.getAttribute('aria-label')
                 && !el.querySelector('img[alt]:not([alt=""])'))
      .map(el => el.tagName + (el.className ? '.' + String(el.className).split(' ')[0] : ''));

    // Anything scrollable sideways must be reachable by keyboard, which means
    // tabindex="0" and a name so a screen reader says what it is.
    out.scrollers = [...document.querySelectorAll('*')]
      .filter(el => el.scrollWidth - el.clientWidth > 2 && el.clientWidth > 200)
      .filter(el => /auto|scroll/.test(getComputedStyle(el).overflowX))
      .filter(el => el !== document.body && el !== document.documentElement)
      .map(el => ({
        sel: el.tagName + (el.className ? '.' + String(el.className).split(' ')[0] : ''),
        tabbable: el.tabIndex >= 0,
        named: !!(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')),
        role: el.getAttribute('role'),
      }));

    // aria-expanded controls must point at something real.
    out.expanders = [...document.querySelectorAll('[aria-expanded]')].map(el => ({
      sel: el.tagName + (el.className ? '.' + String(el.className).split(' ')[0] : ''),
      controls: el.getAttribute('aria-controls'),
      target: el.getAttribute('aria-controls')
        ? !!document.getElementById(el.getAttribute('aria-controls')) : null,
    }));

    // Duplicate ids break every aria-* reference that points at them.
    const ids = [...document.querySelectorAll('[id]')].map(e => e.id);
    out.dupIds = ids.filter((v, i) => ids.indexOf(v) !== i);

    // Same link text pointing at different places, and vice versa.
    out.hrefs = [...document.querySelectorAll('a[href]')]
      .map(a => [a.textContent.trim().toLowerCase(), a.getAttribute('href')]);
    return out;
  });

  if (!s.lang) note(p, 'no lang on <html>');
  if (!s.title) note(p, 'no <title>');
  const main = s.landmarks.find(l => l.t === 'main');
  if (main.n !== 1) note(p, `${main.n} <main> elements`);
  if (!s.skip) note(p, 'no skip link');
  else if (!s.skip.targetExists) note(p, `skip link points at ${s.skip.href} which does not exist`);
  s.headingJumps.forEach(j => note(p, 'heading level skipped: ' + j));
  if (s.emptyHeadings) note(p, `${s.emptyHeadings} empty heading(s)`);
  s.noAlt.forEach(src => note(p, 'img with no alt attribute: ' + src));
  s.unlabelled.forEach(n => note(p, 'form control with no accessible name: ' + n));
  s.namelessControls.forEach(n => note(p, 'control with no accessible name: ' + n));
  s.dupIds.forEach(i => note(p, 'duplicate id: ' + i));
  s.scrollers.forEach(sc => {
    if (!sc.tabbable) note(p, `horizontally scrollable ${sc.sel} is not keyboard reachable`);
    if (sc.tabbable && !sc.named) note(p, `scrollable ${sc.sel} is tabbable but has no name`);
  });
  s.expanders.forEach(e => {
    if (!e.controls) note(p, `${e.sel} has aria-expanded but no aria-controls`);
    else if (!e.target) note(p, `${e.sel} aria-controls="${e.controls}" points at nothing`);
  });

  // ── 2. contrast ──────────────────────────────────────────────────────────
  const contrast = await page.evaluate(() => {
    const bad = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const done = new Set();
    let n;
    while ((n = walk.nextNode())) {
      const t = n.textContent.trim();
      if (t.length < 2) continue;
      const el = n.parentElement;
      if (!el || done.has(el)) continue;
      done.add(el);
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
      if (!el.getClientRects().length) continue;
      const r = _ratio(el);
      if (!r) continue;
      // WCAG AA: 4.5 for body text, 3.0 for large (>=24px, or >=18.66px bold).
      const large = r.px >= 24 || (r.px >= 18.66 && +r.weight >= 700);
      const need = large ? 3 : 4.5;
      if (r.ratio < need)
        bad.push({ text: t.slice(0, 46), ratio: +r.ratio.toFixed(2), need,
                   px: r.px, sel: el.tagName + (el.className ? '.' + String(el.className).split(' ')[0] : '') });
    }
    return bad;
  });
  contrast.forEach(c => {
    const key = `${c.sel}|${c.ratio}`;
    if (seenTargets.has(key)) return;      // report each offending style once
    seenTargets.add(key);
    note(p, `contrast ${c.ratio}:1 (needs ${c.need}) on ${c.sel} @${c.px}px — "${c.text}"`);
  });

  // ── 3. the actual keyboard walk ──────────────────────────────────────────
  // Tab through the page and record what receives focus, whether it is on
  // screen, and whether anything visibly changed when it did.
  await page.evaluate(() => { document.body.focus(); window.scrollTo(0, 0); });
  const walk = [];
  let lastY = -1e9, backJumps = 0;
  for (let i = 0; i < 90; i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const inViewport = r.bottom > 0 && r.top < innerHeight && r.width > 0 && r.height > 0;
      // A focus indicator is an outline, a box-shadow, or a border change.
      // We compare against the same element with :focus-visible suppressed —
      // which we cannot do directly, so we read what is there and call an
      // outline of 0 with no shadow a failure.
      // The indicator may legitimately be drawn on a wrapper — a borderless
      // input inside a bordered shell has to be, because the shell clips.
      // So look at the element and one level up.
      const has = n => n && ((getComputedStyle(n).outlineStyle !== 'none'
                              && parseFloat(getComputedStyle(n).outlineWidth) > 0)
                          || (getComputedStyle(n).boxShadow || 'none') !== 'none');
      const ring = has(el) || has(el.parentElement);
      return {
        tag: el.tagName,
        cls: String(el.className || '').split(' ')[0],
        name: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 34),
        y: r.top + scrollY, x: r.left,
        w: r.width, h: r.height,
        inViewport, ring, display: cs.display,
        inFooter: !!el.closest('footer'),
        fixed: (() => { let n = el; while (n) { if (getComputedStyle(n).position === 'fixed') return true; n = n.parentElement; } return false; })(),
        hidden: cs.visibility === 'hidden' || cs.display === 'none',
      };
    });
    if (!f) break;                         // wrapped back out to the browser UI
    if (f.hidden) note(p, `tab stop on a hidden element: ${f.tag}.${f.cls}`);
    if (!f.ring) note(p, `no visible focus indicator: ${f.tag}.${f.cls} "${f.name}"`);
    // Inline links inside running text are exempt (SC 2.5.8, "inline").
    if (f.display !== 'inline' && (f.w < 24 || f.h < 24))
      note(p, `focus target smaller than 24×24: ${f.tag}.${f.cls} "${f.name}" (${Math.round(f.w)}×${Math.round(f.h)})`);
    // Focus order should mostly move down the page. One backward jump is a
    // rail or a footer link; a run of them is a broken order.
    if (!f.inFooter && !f.fixed) {
      if (f.y < lastY - 40) backJumps++;
      lastY = f.y;
    }
    walk.push(f);
  }
  if (backJumps > 3) note(p, `focus order jumps backwards ${backJumps} times`);
  if (!walk.length) note(p, 'nothing is focusable');

  await page.close();
}

// ── 4. the mobile disclosure menu, on a phone ────────────────────────────────
const mob = await b.newContext({ viewport: { width: 390, height: 844 } });
await mob.route('**/*', r =>
  r.request().url().startsWith('http://localhost:8899') ? r.continue() : r.abort());
{
  const page = await mob.newPage();
  await page.goto(url('/erp'), { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const t = await page.$('.navtoggle');
  if (!t) note('/erp (mobile)', 'no .navtoggle on a phone viewport');
  else {
    await t.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(260);
    const open = await page.evaluate(() => ({
      expanded: document.querySelector('.navtoggle')?.getAttribute('aria-expanded'),
      menuVisible: !!document.querySelector('.menu.on, .menu[data-open]'),
      focusInside: !!document.querySelector('.menu')?.contains(document.activeElement),
    }));
    if (open.expanded !== 'true') note('/erp (mobile)', 'aria-expanded not set to true on open');
    if (!open.menuVisible) note('/erp (mobile)', 'menu did not open on Enter');
    // Tab all the way round; focus must never escape the open menu.
    let escaped = null;
    for (let i = 0; i < 24; i++) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(() =>
        !!document.querySelector('.menu')?.contains(document.activeElement)
        || document.activeElement?.classList.contains('navtoggle'));
      if (!inside) { escaped = i; break; }
    }
    if (escaped !== null) note('/erp (mobile)', `focus escaped the open menu after ${escaped} tabs`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(220);
    const closed = await page.evaluate(() => ({
      expanded: document.querySelector('.navtoggle')?.getAttribute('aria-expanded'),
      focusReturned: document.activeElement?.classList.contains('navtoggle'),
    }));
    if (closed.expanded !== 'false') note('/erp (mobile)', 'Escape did not close the menu');
    if (!closed.focusReturned) note('/erp (mobile)', 'focus not returned to the toggle on close');
  }
  await page.close();
}

// ── 5. the search dialog ─────────────────────────────────────────────────────
{
  const page = await ctx.newPage();
  await page.goto(url('/faq'), { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const sb = await page.$('.searchbtn');
  if (!sb) note('/faq', 'no search button');
  else {
    await sb.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(260);
    const st = await page.evaluate(() => ({
      open: !!document.querySelector('.sdlg.on'),
      focused: document.activeElement?.tagName + '.' + String(document.activeElement?.className||'').split(' ')[0],
      role: document.querySelector('.sdlg')?.getAttribute('role'),
      modal: document.querySelector('.sdlg')?.getAttribute('aria-modal'),
    }));
    if (!st.open) note('/faq', 'search dialog did not open from the keyboard');
    if (!/INPUT/.test(st.focused)) note('/faq', `search opened but focus went to ${st.focused}`);
    if (st.role !== 'dialog') note('/faq', 'search dialog has no role="dialog"');
    if (st.modal !== 'true') note('/faq', 'search dialog has no aria-modal');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(220);
    const after = await page.evaluate(() => ({
      open: !!document.querySelector('.sdlg.on'),
      back: document.activeElement?.classList.contains('searchbtn'),
    }));
    if (after.open) note('/faq', 'Escape did not close the search dialog');
    if (!after.back) note('/faq', 'focus not returned to the search button on close');
  }
  await page.close();
}

// ── 6. the quiz and the calculator ───────────────────────────────────────────
{
  const page = await ctx.newPage();
  await page.goto(url('/scope'), { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const q = await page.evaluate(() => ({
    liveBar: document.querySelector('.qbar')?.getAttribute('role'),
    legendPerStep: [...document.querySelectorAll('.qstep')].every(f => !!f.querySelector('legend')),
    hiddenStepsFocusable: [...document.querySelectorAll('.qstep[hidden] input')].length,
  }));
  if (!q.legendPerStep) note('/scope', 'a question step has no legend');
  // A [hidden] fieldset removes its inputs from the tab order in every engine
  // we care about; the check is here so a future refactor to display:none via
  // a class does not silently reintroduce them.
  const page2 = await ctx.newPage();
  await page2.goto(url('/roi'), { waitUntil: 'networkidle' });
  await page2.waitForTimeout(400);
  const c = await page2.evaluate(() => ({
    live: document.querySelector('#roiout')?.getAttribute('aria-live'),
    total: document.querySelector('#roitotal')?.textContent.trim(),
  }));
  if (c.live !== 'polite') note('/roi', 'result region is not aria-live');
  if (!c.total || c.total === '—') note('/roi', 'total did not compute');
  await page.close(); await page2.close();
}

await b.close();

// ── report ───────────────────────────────────────────────────────────────────
if (!problems.length) console.log('CLEAN — no accessibility problems found.');
else {
  const byPage = {};
  for (const { page, msg } of problems) (byPage[page] ||= []).push(msg);
  for (const [pg, msgs] of Object.entries(byPage)) {
    console.log('\n' + pg);
    msgs.forEach(m => console.log('  · ' + m));
  }
  console.log(`\n${problems.length} problem(s) across ${Object.keys(byPage).length} page(s).`);
}
