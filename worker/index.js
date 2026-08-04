/**
 * Ordence — the enquiry endpoint.
 *
 * The site was static and every route to us was a `mailto:` link, which
 * meant there was no submit event, no thank-you page, and no way to
 * answer "which page produced that enquiry". You cannot improve a site
 * you cannot measure, so this is the smallest thing that closes it.
 *
 * It does five jobs and refuses to do a sixth:
 *
 *   1. Verify the Turnstile token, server-side, before reading anything.
 *   2. Write the enquiry down before trying to send it anywhere.
 *   3. Email the enquiry to us.
 *   4. Email an acknowledgement back, with a link to work we have done.
 *   5. Return a JSON verdict the page can act on.
 *
 * Everything else — the assets, every HTML page — is served by
 * Cloudflare's asset layer without this script running at all. A Worker
 * in front of a static site is latency on every request for the benefit
 * of one route.
 */

const CORS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

/** Fields we accept, and the most we will store of each. */
const FIELDS = {
  name: 200,
  email: 320,          // the RFC maximum for an address
  company: 200,
  phone: 40,
  people: 60,
  today: 400,
  message: 4000,
  page: 200,           // which page they submitted from
};

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: CORS });

/* ────────────────────────────────────────────────────────────────────
   THE LOG

   One KV namespace, three kinds of entry, and no third-party anything.

   It is inert until a namespace is bound. With no `LOG` binding every
   call here returns immediately, so this ships today and starts working
   the moment `wrangler.jsonc` gains six lines — no code change, nothing
   to remember, nothing to redeploy differently.

   Why bother, when the enquiries are already emailed. Because email is
   the least reliable part of this system and the only copy of a lead.
   If Resend is unconfigured, out of quota, rate-limiting, or simply
   down, `send()` returns and the enquiry is gone — the person saw a
   thank-you page and nobody ever wrote back. Writing to KV first means
   the worst case is a delayed reply rather than a lost customer.

   What is deliberately NOT here: no IP address, no cookie, no device
   fingerprint, no user agent, no cross-request identifier of any kind.
   Country comes from Cloudflare's edge and is as far as it goes. Every
   entry expires on its own. There is nothing in this store that would
   let anybody follow one person around the site, which is the same
   promise the privacy page makes and this is what keeping it looks like.
   ──────────────────────────────────────────────────────────────────── */

const KEEP = {
  enquiry: 60 * 60 * 24 * 365 * 2,   // two years: a lead is a business record
  notfound: 60 * 60 * 24 * 90,       // ninety days: long enough to see a pattern
  event: 60 * 60 * 24 * 90,
};

/** A sortable, collision-resistant key. KV lists lexicographically, so an
 *  ISO timestamp in front means `list({prefix:"enq:"})` comes back in the
 *  order things happened without any sorting at the other end. */
function logKey(kind, when) {
  const rand = crypto.randomUUID().slice(0, 8);
  return `${kind}:${when.toISOString()}:${rand}`;
}

/**
 * Write one entry. Never throws, never blocks the response, never becomes
 * the reason a submission fails — a logging failure that costs a customer
 * is worse than no logging.
 */
async function record(env, kind, body, request) {
  if (!env.LOG) return false;        // no namespace bound; nothing to do
  try {
    const now = new Date();
    await env.LOG.put(
      logKey(kind, now),
      JSON.stringify({
        at: now.toISOString(),
        country: request?.cf?.country || "",
        ...body,
      }),
      { expirationTtl: KEEP[kind] || KEEP.event });
    return true;
  } catch (err) {
    console.log("log write failed:", err && err.message);
    return false;
  }
}

/**
 * Turnstile, checked here and not trusted from the browser.
 *
 * Fails OPEN. If Cloudflare's siteverify is down, the choice is between
 * dropping a real enquiry and accepting a bot, and for a business that
 * gets a handful of enquiries a week the first is far more expensive.
 * That is a deliberate trade and it is written down so nobody has to
 * guess whether it was one.
 */
async function humanEnough(token, ip, secret) {
  if (!secret) return { ok: true, why: "no secret configured" };
  if (!token) return { ok: false, why: "no token" };

  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);

  try {
    const r = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body },
    );
    const out = await r.json();
    return { ok: !!out.success, why: (out["error-codes"] || []).join(",") };
  } catch (err) {
    return { ok: true, why: "siteverify unreachable — failing open" };
  }
}

/** Read the form, clamp every field, drop anything we did not ask for. */
async function readEnquiry(request) {
  const ct = request.headers.get("content-type") || "";
  const raw = ct.includes("application/json")
    ? await request.json()
    : Object.fromEntries(await request.formData());

  const out = {};
  for (const [key, max] of Object.entries(FIELDS)) {
    const v = raw[key];
    if (typeof v === "string" && v.trim()) out[key] = v.trim().slice(0, max);
  }
  return { data: out, token: raw["cf-turnstile-response"] || raw.token || "" };
}

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/**
 * Send through Resend if a key is configured.
 *
 * If it is not, the Worker still accepts the enquiry and says so in the
 * log rather than failing the submission. Losing someone's message
 * because an API key was never set is the worst possible outcome here,
 * and the one most likely to happen quietly.
 */
async function send(env, { to, subject, html, replyTo }) {
  if (!env.RESEND_API_KEY) {
    console.log("EMAIL NOT SENT — RESEND_API_KEY unset:", subject, "→", to);
    return false;
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.MAIL_FROM || "Ordence <hello@ordence.com>",
      to: [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!r.ok) console.log("Resend refused:", r.status, await r.text());
  return r.ok;
}

const row = (k, v) =>
  v ? `<tr><td style="padding:4px 14px 4px 0;color:#666">${esc(k)}</td>
       <td style="padding:4px 0"><b>${esc(v)}</b></td></tr>` : "";

function internalEmail(d, meta) {
  return `<div style="font:15px/1.6 -apple-system,system-ui,sans-serif;color:#1a1a1a">
    <p style="margin:0 0 14px"><b>New enquiry from the website.</b></p>
    <table style="border-collapse:collapse;font-size:14px">
      ${row("Name", d.name)}${row("Email", d.email)}${row("Company", d.company)}
      ${row("Phone", d.phone)}${row("People", d.people)}
      ${row("Uses today", d.today)}${row("From page", d.page)}
      ${row("Country", meta.country)}
    </table>
    ${d.message ? `<p style="margin:18px 0 6px;color:#666">Message</p>
      <div style="white-space:pre-wrap;border-left:2px solid #aa8340;padding-left:12px">
      ${esc(d.message)}</div>` : ""}
  </div>`;
}

/**
 * The acknowledgement.
 *
 * It carries a link to work we have actually done, because the fastest
 * way to lose someone between "sent an enquiry" and "took the call" is
 * for the next hour to be silent. SAMPLE_URL points at a real site; the
 * default is this one, which the services page already claims as the
 * reference and which is therefore checkable rather than a boast.
 */
function ackEmail(d, env) {
  const sample = env.SAMPLE_URL || "https://ordence.com";
  const sampleName = env.SAMPLE_NAME || "ordence.com — this site";
  const first = (d.name || "").split(/\s+/)[0] || "there";
  return `<div style="font:15px/1.65 -apple-system,system-ui,sans-serif;color:#1a1a1a;max-width:560px">
    <p>Hello ${esc(first)},</p>
    <p>Thanks — your message reached a person, not a queue. We read every one
       and you will get a real reply, usually the same day and at the latest
       within one business day.</p>
    <p>What happens next: a short conversation about how work actually moves
       through your business, then a written scope listing the modules, what we
       would migrate, what we are <i>not</i> doing, and a fixed number. That
       document is yours to keep and circulate whether or not you go ahead.</p>
    <p style="margin-top:22px">While you wait, here is something we built:</p>
    <p style="margin:8px 0 22px">
      <a href="${esc(sample)}"
         style="display:inline-block;background:#8563ee;color:#fff;text-decoration:none;
                padding:11px 20px;border-radius:999px;font-weight:500">
        ${esc(sampleName)}
      </a>
    </p>
    <p style="color:#555;font-size:14px">Every page of it under 50KB, no framework
       runtime, and the product screens on the CRM and ERP pages are the real
       software rather than stock illustrations. If you want the same team on
       your site as well as your systems, say so and we will scope both.</p>
    <p style="margin-top:24px">— Sahil Nahar<br>
      <span style="color:#666;font-size:14px">Ordence · hello@ordence.com</span></p>
    <p style="color:#999;font-size:12px;margin-top:26px;border-top:1px solid #eee;padding-top:14px">
      You are getting this because you sent us an enquiry at ordence.com. We do not
      add you to a mailing list for asking a question. Reply to this email and it
      reaches the same person.</p>
  </div>`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    /* The event sink. Off by default and staying off: the page only
       posts here when `window.ORDENCE_ANALYTICS` has been set to true,
       which is a decision nobody has made yet. It exists so that making
       it is a one-line change in the head of the document rather than a
       new endpoint, a new deploy and a new set of things to get wrong.

       Bodies are capped hard. This is a hole in the edge of the site
       that anything on the internet can POST to, so it accepts a short
       event name and a small object, and drops the rest on the floor. */
    if (url.pathname === "/api/e") {
      if (request.method !== "POST") return json(405, { ok: false });
      try {
        const raw = await request.text();
        /* 2KB. Eight detail keys at their own limits come to about 1.2KB
           before the event name and path, so anything tighter than this
           makes the outer cap the binding one and the per-field caps
           below dead code — two limits where one is doing the work. */
        if (raw.length > 2048) return json(413, { ok: false });
        const b = JSON.parse(raw);
        const name = String(b.event || "").slice(0, 48);
        if (!/^[a-z0-9_]{1,48}$/.test(name)) return json(400, { ok: false });
        await record(env, "event", {
          event: name,
          page: String(b.page || "").slice(0, 200),
          detail: b.detail && typeof b.detail === "object"
            ? Object.fromEntries(Object.entries(b.detail).slice(0, 8)
                .map(([k, v]) => [String(k).slice(0, 32), String(v).slice(0, 120)]))
            : {},
        }, request);
      } catch { /* malformed; there is nothing useful to say back */ }
      // 204 whatever happened. This endpoint tells a caller nothing about
      // whether logging is on, which is one less thing to probe.
      return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
    }

    if (url.pathname !== "/api/enquiry") {
      // Not ours. Hand it to the asset layer.
      const res = await env.ASSETS.fetch(request);

      /* A 404 is the one asset response worth knowing about. Broken
         inbound links, a renamed page somebody bookmarked, a typo in a
         printed URL — all of it is invisible on a static site, and all
         of it is somebody who wanted something and did not get it.
         The referrer says who sent them, which is usually the fix. */
      if (res.status === 404 && request.method === "GET") {
        ctx.waitUntil(record(env, "notfound", {
          path: url.pathname.slice(0, 300),
          from: (request.headers.get("referer") || "").slice(0, 300),
        }, request));
      }
      return res;
    }
    if (request.method !== "POST") {
      return json(405, { ok: false, error: "POST only" });
    }

    let parsed;
    try {
      parsed = await readEnquiry(request);
    } catch {
      return json(400, { ok: false, error: "Could not read that submission." });
    }
    const { data, token } = parsed;

    if (!data.email || !data.email.includes("@")) {
      return json(400, { ok: false, error: "A working email address, please." });
    }

    const check = await humanEnough(
      token, request.headers.get("cf-connecting-ip"), env.TURNSTILE_SECRET);
    if (!check.ok) {
      return json(400, {
        ok: false,
        error: "That check did not pass. Reload the page and try once more.",
      });
    }

    const meta = { country: request.cf?.country || "" };
    const to = env.NOTIFY_TO || "hello@ordence.com";

    /* Written down BEFORE either email is attempted. If everything after
       this line fails, the enquiry still exists somewhere we can read it
       — which is the entire reason this is here and the reason it is
       awaited rather than fired into `waitUntil`. */
    const kept = await record(env, "enquiry", { ...data, ip: undefined }, request);

    // The reply to us must land before we answer the browser; the
    // acknowledgement can finish after, because the person is already
    // looking at the thank-you page by then.
    await send(env, {
      to,
      subject: `Enquiry — ${data.company || data.name || data.email}`,
      html: internalEmail(data, meta),
      replyTo: data.email,
    });
    ctx.waitUntil(send(env, {
      to: data.email,
      subject: "Ordence — we have your message",
      html: ackEmail(data, env),
    }));

    /* `kept` is deliberately not returned to the browser. Whether the
       Worker has a log is our business, not the visitor's, and a
       submission that was emailed successfully was successful. */
    void kept;
    return json(200, { ok: true });
  },
};
