/**
 * The Worker, exercised without deploying it.
 *
 * Cloudflare's runtime is not needed for any of this: the handler takes a
 * Request, an env and a ctx, and returns a Response. So env is a plain
 * object, KV is a Map with two methods, and the whole suite runs in Node
 * in well under a second.
 *
 *     npm run test:worker
 *
 * What it is actually protecting: that a missing KV binding changes
 * nothing, that a KV outage cannot cost an enquiry, that the event sink
 * cannot be used as free storage, and that no request identifier ever
 * reaches the log. Each of those is a decision that would be easy to
 * undo by accident.
 */
import worker from '../worker/index.js';

// A KV namespace, in memory, with the two methods the Worker uses.
const makeKV = () => {
  const store = new Map();
  return { store,
    put: async (k, v, o) => { store.set(k, {v, o}); },
    list: async ({prefix}) => ({keys:[...store.keys()].filter(k=>k.startsWith(prefix)).map(name=>({name}))}) };
};
const ctx = { waitUntil: p => p };
const assets = status => ({ fetch: async () => new Response(status===404?'nope':'ok', {status}) });
let failed = 0;
const ok = (n, c) => { if (!c) failed++; console.log((c ? '  ok   ' : '  FAIL ') + n); };
process.on('exit', () => {
  console.log(failed ? `\n${failed} failing` : '\nall passing');
  if (failed) process.exitCode = 1;
});

// ── 1. no LOG binding: everything still works, nothing is stored ──────
{
  const env = { ASSETS: assets(404) };
  const res = await worker.fetch(new Request('https://ordence.com/typo'), env, ctx);
  ok('404 passes through with no LOG binding', res.status === 404);
}
// ── 2. with LOG: a 404 is recorded, a 200 is not ──────────────────────
{
  const LOG = makeKV();
  const env = { ASSETS: assets(404), LOG };
  await worker.fetch(new Request('https://ordence.com/old-pricing-page',
    {headers:{referer:'https://x.example/blog'}}), env, ctx);
  const keys = [...LOG.store.keys()];
  ok('404 recorded', keys.length === 1 && keys[0].startsWith('notfound:'));
  const e = JSON.parse(LOG.store.get(keys[0]).v);
  ok('404 stores path and referrer', e.path === '/old-pricing-page' && e.from.includes('x.example'));
  ok('404 has a TTL', LOG.store.get(keys[0]).o.expirationTtl === 60*60*24*90);
  ok('no ip / user-agent stored', !('ip' in e) && !('ua' in e));
}
{
  const LOG = makeKV();
  await worker.fetch(new Request('https://ordence.com/erp/'), { ASSETS: assets(200), LOG }, ctx);
  ok('a 200 is not recorded', LOG.store.size === 0);
}
// ── 3. the event endpoint ────────────────────────────────────────────
{
  const LOG = makeKV();
  const env = { ASSETS: assets(404), LOG };
  const post = (body) => worker.fetch(new Request('https://ordence.com/api/e',
    {method:'POST', body: typeof body==='string'?body:JSON.stringify(body)}), env, ctx);
  let r = await post({event:'roi_changed', page:'/roi', detail:{people:'6'}});
  ok('event accepted, 204', r.status === 204);
  ok('event stored', [...LOG.store.keys()].some(k=>k.startsWith('event:')));
  r = await post({event:'Bad Name!', page:'/x'});
  ok('bad event name rejected', r.status === 400);
  r = await post('x'.repeat(2200));
  ok('oversize body rejected', r.status === 413);
  r = await post('{not json');
  ok('malformed body still 204 (says nothing)', r.status === 204);
  const before = LOG.store.size;
  await post({event:'big', page:'p', detail:Object.fromEntries([...Array(14)].map((_,i)=>[`key${i}`,'v'.repeat(100)]))});
  const k = [...LOG.store.keys()].pop();
  const stored = JSON.parse(LOG.store.get(k).v);
  ok('detail capped at 8 keys', Object.keys(stored.detail).length === 8);
  ok('values truncated to 120', Object.values(stored.detail).every(v=>v.length<=120));
  ok('a new key each time', LOG.store.size === before + 1);
  r = await worker.fetch(new Request('https://ordence.com/api/e'), env, ctx);
  ok('GET on the sink is 405', r.status === 405);
}
// ── 4. the enquiry is written down before any email is attempted ──────
{
  const LOG = makeKV();
  const env = { ASSETS: assets(404), LOG };   // no RESEND_API_KEY: send() no-ops
  const fd = new URLSearchParams({name:'A Buyer', email:'a@example.com',
    company:'Widgets Pvt Ltd', message:'stock numbers never right', page:'/erp'});
  const r = await worker.fetch(new Request('https://ordence.com/api/enquiry',
    {method:'POST', body: fd, headers:{'content-type':'application/x-www-form-urlencoded'}}), env, ctx);
  ok('enquiry accepted', r.status === 200);
  const k = [...LOG.store.keys()].find(k=>k.startsWith('enquiry:'));
  ok('enquiry recorded even with no mail provider', !!k);
  const e = JSON.parse(LOG.store.get(k).v);
  ok('enquiry keeps the message', e.message === 'stock numbers never right');
  ok('enquiry kept two years', LOG.store.get(k).o.expirationTtl === 60*60*24*365*2);
}
// ── 5. a broken KV must never cost a submission ──────────────────────
{
  const env = { ASSETS: assets(404), LOG: { put: async () => { throw new Error('KV down'); } } };
  const fd = new URLSearchParams({name:'B', email:'b@example.com', message:'hi'});
  const r = await worker.fetch(new Request('https://ordence.com/api/enquiry',
    {method:'POST', body: fd, headers:{'content-type':'application/x-www-form-urlencoded'}}), env, ctx);
  ok('enquiry still succeeds when KV throws', r.status === 200);
}
// ── 6. keys sort in the order things happened ────────────────────────
{
  const LOG = makeKV(); const env = { ASSETS: assets(404), LOG };
  for (let i=0;i<3;i++) { await worker.fetch(new Request(`https://ordence.com/miss${i}`), env, ctx);
    await new Promise(r=>setTimeout(r,4)); }
  const keys = [...LOG.store.keys()];
  ok('keys are already in chronological order', JSON.stringify(keys)===JSON.stringify([...keys].sort()));
}
