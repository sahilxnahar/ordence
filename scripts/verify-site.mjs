/**
 * The interactive pieces, exercised the way a person uses them.
 *
 *     npm run serve      # in another terminal
 *     npm run check:site
 *
 * check-pages.mjs proves the pages render; audit-a11y.mjs proves they can
 * be operated by keyboard. This one proves they still DO the thing: the
 * form reveals and remembers, the questionnaire produces a summary, the
 * calculator arrives at a number in Indian digit grouping, the board is
 * reachable, the screens around it are not, search opens on a slash, and
 * the print stylesheet still turns the page white.
 */
import pw from 'playwright';
const b = await pw.chromium.launch();
const only = ctx => ctx.route('**/*', r => r.request().url().startsWith('http://localhost:8899') ? r.continue() : r.abort());
const U = p => 'http://localhost:8899' + p;
let bad = 0;
const ok = (n,c,x='') => { if(!c) bad++; console.log((c?'  ok   ':'  FAIL ')+n+(x?'  · '+x:'')); };

const ctx = await b.newContext({viewport:{width:1400,height:950}}); await only(ctx);

// 16 · progressive disclosure + draft persistence
{
  const p = await ctx.newPage();
  await p.goto(U('/get-started/'),{waitUntil:'networkidle'}); await p.waitForTimeout(500);
  const before = await p.evaluate(()=>document.querySelectorAll('.fld.later').length);
  await p.fill('input[name=name]','Sahil');
  await p.waitForTimeout(600);
  const after = await p.evaluate(()=>document.querySelectorAll('.fld.later').length);
  ok('16 fields collapsed at rest, revealed on typing', before>=4 && after===0, `${before} → ${after}`);
  await p.fill('textarea[name=message]','stock numbers never right');
  await p.waitForTimeout(900);
  await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(700);
  const kept = await p.inputValue('textarea[name=message]');
  ok('16 draft survives a refresh', kept.includes('stock numbers'), kept.slice(0,30));
  await p.close();
}
// 17 · scope quiz
{
  const p = await ctx.newPage();
  await p.goto(U('/scope/'),{waitUntil:'networkidle'}); await p.waitForTimeout(400);
  for (let i=0;i<12;i++){
    const more = await p.evaluate(()=>{
      const inp=document.querySelector('.qstep:not([hidden]) .qopt input');
      if(!inp) return false;
      inp.checked=true; inp.dispatchEvent(new Event('change',{bubbles:true}));
      return true;
    });
    if(!more) break;
    await p.waitForTimeout(140);
    await p.click('#qnext'); await p.waitForTimeout(200);
  }
  const s = await p.evaluate(()=>({done:!document.getElementById('qdone').hidden,
    lines:(document.getElementById('qsummary').textContent||'').split('\n').length}));
  ok('17 twelve questions produce a summary', s.done && s.lines>20, s.lines+' lines');
  await p.close();
}
// 18 · ROI calculator
{
  const p = await ctx.newPage();
  await p.goto(U('/roi/'),{waitUntil:'networkidle'}); await p.waitForTimeout(500);
  const t0 = await p.textContent('#roitotal');
  await p.fill('input[name=people]','12'); await p.waitForTimeout(400);
  const t1 = await p.textContent('#roitotal');
  const rows = await p.evaluate(()=>document.querySelectorAll('#roiwork tr').length);
  ok('18 calculator computes and recomputes', /₹/.test(t0) && t1!==t0 && rows>=5, `${t0} → ${t1}, ${rows} rows`);
  ok('18 Indian digit grouping', /₹\d{1,2},\d{2},\d{3}/.test(t1)||/₹\d,\d{2},\d{2},\d{3}/.test(t1), t1);
  await p.close();
}
// 7 · the live board is still keyboard-operable, and inert screens are not
{
  const p = await ctx.newPage();
  await p.goto(U('/tour/'),{waitUntil:'networkidle'}); await p.waitForTimeout(900);
  const st = await p.evaluate(()=>({
    board: !!document.querySelector('[data-live] .a-board[tabindex="0"]'),
    label: document.querySelector('[data-live] .a-board')?.getAttribute('aria-label')?.length>10,
    inertLinks: document.querySelectorAll('.shotwrap:not([data-live]) a.a-link').length,
    spans: document.querySelectorAll('.shotwrap:not([data-live]) span.a-link').length,
    tabbableInside: [...document.querySelectorAll('.shotwrap:not([data-live]) a,.shotwrap:not([data-live]) button')]
      .filter(e=>e.tabIndex>=0).length,
  }));
  ok('7 live board is focusable and named', st.board && st.label);
  ok('25 static screens have no dead links left', st.inertLinks===0 && st.spans>0, st.spans+' became spans');
  ok('25 nothing inside a static screen takes focus', st.tabbableInside===0);
  await p.close();
}
// 3 · search dialog, keyboard round trip
{
  const p = await ctx.newPage();
  await p.goto(U('/glossary/'),{waitUntil:'networkidle'}); await p.waitForTimeout(500);
  await p.keyboard.press('/'); await p.waitForTimeout(350);
  await p.keyboard.type('gstr'); await p.waitForTimeout(450);
  const hits = await p.evaluate(()=>document.querySelectorAll('#sres a').length);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  const closed = await p.evaluate(()=>!document.querySelector('.sdlg.on'));
  ok('3 search opens on "/", matches, closes on Esc', hits>0 && closed, hits+' hits');
  await p.close();
}
// 26 · print stylesheet
{
  const p = await ctx.newPage();
  await p.goto(U('/pricing/'),{waitUntil:'networkidle'}); await p.waitForTimeout(400);
  await p.emulateMedia({media:'print'});
  const pr = await p.evaluate(()=>({
    bg:getComputedStyle(document.body).backgroundColor,
    ink:getComputedStyle(document.body).color,
    headerGone:getComputedStyle(document.querySelector('.site-header')).display==='none',
    shots:[...document.querySelectorAll('.shot-body')].every(e=>getComputedStyle(e).overflowX!=='auto'),
  }));
  ok('26 print is dark-on-white with no chrome',
     pr.bg==='rgb(255, 255, 255)' && pr.headerGone && pr.shots, `${pr.bg} / ${pr.ink}`);
  await p.close();
}
// 1 · phone menu
{
  const m = await b.newContext({viewport:{width:390,height:844}}); await only(m);
  const p = await m.newPage();
  await p.goto(U('/erp/'),{waitUntil:'networkidle'}); await p.waitForTimeout(500);
  await p.click('.navtoggle'); await p.waitForTimeout(400);
  const links = await p.evaluate(()=>document.querySelectorAll('#menu a').length);
  const over = await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  ok('1 phone menu carries the whole map', links>=20, links+' links');
  ok('1 no horizontal overflow on a phone', over<=1, over+'px');
  await p.close();
}
// 22 · social images exist for every built page
{
  const p = await ctx.newPage();
  await p.goto(U('/sitemap/'),{waitUntil:'networkidle'});
  const imgs = await p.evaluate(async ()=>{
    const pages = [...document.querySelectorAll('main a[href^="/"]')].map(a=>a.getAttribute('href'));
    const uniq = [...new Set(pages)];
    const out = [];
    for (const u of uniq) {
      const slug = u.replace(/^\/|\/$/g,'') || 'home';
      const r = await fetch('/og/'+slug+'.png', {method:'HEAD'});
      if (!r.ok) out.push(slug);
    }
    return out;
  });
  ok('22 every linked page has a social image', imgs.length===0, imgs.join(', '));
  await p.close();
}
await b.close();
console.log(bad ? `\n${bad} failing` : '\nall passing');
