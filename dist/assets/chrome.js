/* Ordence — site chrome.
 *
 * Three small jobs that belong to every page rather than to the scene:
 * the header dissolving on the home page, the ambient field behind a
 * document page, and the cookie notice.
 *
 * Deliberately separate from scene.js and deliberately tiny. scene.js is
 * WebGL, three.js and a render loop that a product page has no reason to
 * download; this file is a few hundred bytes and no dependencies, so the
 * eleven document pages cost almost nothing while still looking like they
 * belong to the same site.
 */

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Save-Data is a request, not a hint, and on an Indian mobile plan it is
 * usually a deliberate one. The ambient field is decoration; under
 * Save-Data it does not run, and under a slow effective connection it
 * runs at a third of the density. Neither costs the reader anything they
 * came for. */
const conn = navigator.connection || {};
const thrifty = conn.saveData === true;
const slowLink = /^(slow-)?2g$/.test(conn.effectiveType || "");

/* ————— the header dissolves into the story —————
 * Home only. The header and the arrival pill hold the same six links, so
 * both on screen at once reads as the menu printed twice — and it robs
 * the pill of the one thing it is for, which is being the moment the
 * site hands you the map.
 *
 * It goes on the way down and comes straight back on the way up, because
 * a navigation you cannot summon is not navigation. The threshold is a
 * fraction of the viewport rather than a pixel count so it behaves the
 * same on a laptop and on a 1440p monitor, and the direction test has a
 * small dead zone so a trackpad's jitter cannot strobe it.
 */
function headerFade() {
  const header = document.querySelector(".site-header");
  if (!header || !document.body.classList.contains("is-scene")) return;

  let last = scrollY, ticking = false;

  const apply = () => {
    ticking = false;
    const y = scrollY;
    const down = y > last + 4;
    const up = y < last - 4;
    if (down || up) last = y;

    // Above the fold it is always present, whatever the last gesture was.
    if (y < innerHeight * 0.35) header.classList.remove("gone");
    else if (down) header.classList.add("gone");
    else if (up) header.classList.remove("gone");
  };

  addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(apply); }
  }, { passive: true });
  apply();
}

/* ————— the ambient field —————
 * Canvas 2D, a few hundred dots, drifting. It exists so a document page
 * feels like it belongs to the same site as the home page, and that is
 * the whole brief — it is not the scene and must never cost what the
 * scene costs.
 *
 * The particle count scales with area and is capped hard, the loop stops
 * when the tab is hidden or the field is scrolled past, and the whole
 * thing is skipped outright under prefers-reduced-motion. A decorative
 * background that drains a phone battery is a bug, not a flourish.
 */
function ambient() {
  const cv = document.getElementById("ambient");
  if (!cv || reduced || thrifty) return;

  const ctx = cv.getContext("2d", { alpha: true });
  if (!ctx) return;

  let dots = [], w = 0, h = 0, dpr = 1, raf = 0, running = false;

  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const n = Math.min(260, Math.round((w * h) / (slowLink ? 15600 : 5200)));
    dots = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.5 + Math.random() * 1.15,
      vx: (Math.random() - 0.5) * 0.11,
      vy: -0.045 - Math.random() * 0.11,
      a: 0.14 + Math.random() * 0.4,
      // A tenth of them carry the brand violet. Any more and it stops
      // reading as a field and starts reading as a decorative pattern.
      v: Math.random() < 0.1,
    }));
  };

  const frame = () => {
    ctx.clearRect(0, 0, w, h);
    for (const d of dots) {
      d.x += d.vx; d.y += d.vy;
      if (d.y < -4) { d.y = h + 4; d.x = Math.random() * w; }
      if (d.x < -4) d.x = w + 4;
      else if (d.x > w + 4) d.x = -4;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, 6.2832);
      ctx.fillStyle = d.v
        ? `rgba(133,99,238,${d.a + 0.14})`
        : `rgba(244,245,247,${d.a})`;
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  };

  const start = () => { if (!running) { running = true; frame(); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  size();
  start();

  addEventListener("resize", () => { size(); }, { passive: true });
  document.addEventListener("visibilitychange", () =>
    document.hidden ? stop() : start());

  // Nothing to animate once the field is off screen. The mask means it
  // has already faded to nothing well before this point.
  addEventListener("scroll", () => {
    (scrollY > cv.clientHeight ? stop : start)();
  }, { passive: true });
}

/* ————— the cookie notice —————
 * One cookie, and it is the one recording that this was dismissed. No
 * advertising cookies and no third-party analytics, so there is nothing
 * to gate — which is why this is a notice with one button and not a
 * modal with a "manage preferences" screen. A consent theatre over a
 * site that sets nothing teaches people to click without reading.
 *
 * Rendered server-side and revealed here, rather than injected: it is
 * present without JavaScript, and it cannot shift the layout on arrival.
 */
const COOKIE_NAME = "ordence_notice";

function noticeSeen() {
  return document.cookie.split("; ").some((c) => c.startsWith(COOKIE_NAME + "="));
}

function cookieNotice() {
  const box = document.getElementById("cookie");
  const ok = document.getElementById("cookieOk");
  if (!box || !ok) return;

  if (noticeSeen()) return;      // stays hidden; never rendered visible

  box.hidden = false;
  document.body.classList.add("cookie-open");
  requestAnimationFrame(() => box.classList.add("on"));

  ok.addEventListener("click", () => {
    // A year, SameSite=Lax, path-wide. Not marked Secure, because the
    // attribute would silently drop the cookie over plain http on a
    // local preview and the notice would then return on every page.
    document.cookie =
      `${COOKIE_NAME}=1; path=/; max-age=31536000; SameSite=Lax`;
    box.classList.remove("on");
    document.body.classList.remove("cookie-open");
    setTimeout(() => { box.hidden = true; }, 420);
  });
}

/* ————— the persistent ask —————
 * An audit measured a 6,552px stretch on the home page, and 1,178 to
 * 5,768px on every other page, in which a reader who had already decided
 * had nothing to click. Inline asks every third section fix most of it;
 * this fixes the rest, because it does not depend on where they are.
 *
 * Document pages only. The home page ends in the arrival pill, and two
 * floating things at the bottom of one screen is the double-navigation
 * problem this site already solved once.
 *
 * Dismissible, and the dismissal is remembered for the session. A bar
 * you cannot get rid of is an argument with the reader, and you do not
 * win a B2B sale by winning that argument.
 */
function stickyCta() {
  if (!document.body.classList.contains("is-doc")) return;
  if (sessionStorage.getItem("ordence_cta_closed") === "1") return;
  // Nothing to promote on the page whose whole job is the enquiry.
  if (location.pathname.startsWith("/get-started")) return;

  const bar = document.createElement("aside");
  bar.className = "stickycta";
  bar.setAttribute("aria-label", "Get a scope");
  bar.innerHTML =
    '<p>A written scope and a fixed number, usually in a day.</p>' +
    '<a class="btn primary sm" href="/get-started">Get started</a>' +
    '<button type="button" class="x" aria-label="Dismiss">&times;</button>';
  document.body.appendChild(bar);

  const show = () => bar.classList.toggle("on", scrollY > innerHeight * 0.9);
  addEventListener("scroll", show, { passive: true });
  show();

  bar.querySelector(".x").addEventListener("click", () => {
    bar.classList.remove("on");
    sessionStorage.setItem("ordence_cta_closed", "1");
    setTimeout(() => bar.remove(), 400);
  });
}

/* ————— the enquiry form —————
 * Posts as JSON, keeps the person on the page while it is in flight, and
 * sends them to /thank-you on success.
 *
 * The form has a real `action` and `method` in the markup, so with
 * JavaScript off it still submits to the same endpoint and the Worker
 * still answers. This only makes it nicer, which is the correct order to
 * build a form in — the enhancement is allowed to fail.
 */
function enquiryForm() {
  const form = document.querySelector("form.enq");
  if (!form) return;
  const err = form.querySelector(".enqerr");

  /* Progressive disclosure.
   *
   * Seven fields is a wall. Two is a question. The rest appear on the
   * first keystroke — not on focus, because focus fires when somebody
   * tabs past, and a form that unfolds while you are looking elsewhere
   * is a form that feels like it is watching you.
   *
   * Everything is in the DOM from the start and only hidden, so it is
   * all present without JavaScript and nothing is lost if this never
   * runs. Required fields stay required either way.
   */
  const later = [...form.querySelectorAll(".fld")].slice(2);
  const grow = () => {
    later.forEach((f) => f.classList.remove("later"));
    form.removeEventListener("input", grow);
    track("form_started", { page: location.pathname });
  };
  if (later.length > 2) {
    later.forEach((f) => f.classList.add("later"));
    form.addEventListener("input", grow);
  }

  // A scope summary from /scope, carried in rather than retyped.
  try {
    const carried = sessionStorage.getItem("ordence_scope");
    const msg = form.elements.message;
    if (carried && msg && !msg.value) {
      msg.value = carried;
      grow();
    }
  } catch {}

  // Keep what they typed through a refresh. Losing a half-written
  // message to a stray reload is the cheapest way to lose an enquiry.
  const KEY = "ordence_draft";
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) || "{}");
    for (const [k, v] of Object.entries(saved)) {
      if (form.elements[k] && !form.elements[k].value) form.elements[k].value = v;
    }
    if (Object.keys(saved).length) grow();
  } catch {}
  form.addEventListener("input", () => {
    try {
      sessionStorage.setItem(KEY,
        JSON.stringify(Object.fromEntries(new FormData(form))));
    } catch {}
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form.dataset.sending) return;

    // Let the browser say which field is wrong before we bother a server.
    if (!form.reportValidity()) return;

    err.hidden = true;
    form.dataset.sending = "1";
    const btn = form.querySelector('button[type=submit]');
    const label = btn.textContent;
    btn.textContent = "Sending\u2026";

    const body = Object.fromEntries(new FormData(form));
    // Which page produced this. The whole reason the endpoint exists.
    body.page = location.pathname;

    try {
      const r = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const out = await r.json().catch(() => ({}));
      if (r.ok && out.ok) {
        try { sessionStorage.removeItem(KEY); } catch {}
        track("enquiry_sent", { page: body.page, landed: body.landed });
        location.href = "/thank-you";
        return;
      }
      throw new Error(out.error || "That did not go through.");
    } catch (ex) {
      err.textContent =
        ex.message +
        " You can also write to hello@ordence.com and it reaches the same person.";
      err.hidden = false;
      form.dataset.sending = "";
      btn.textContent = label;
    }
  });
}

/* ————— the phone menu —————
 * A disclosure, not a drawer library. It has to do four things properly:
 * announce its own state, trap focus while open, close on Escape, and
 * restore focus to the button that opened it. Everything else about a
 * mobile menu is decoration.
 */
function phoneMenu() {
  const btn = document.querySelector(".navtoggle");
  const menu = document.getElementById("menu");
  if (!btn || !menu) return;

  const open = (yes) => {
    btn.setAttribute("aria-expanded", String(yes));
    if (yes) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add("on"));
      // Stop the page behind from scrolling under the overlay.
      document.documentElement.style.overflow = "hidden";
      menu.querySelector("a")?.focus();
    } else {
      menu.classList.remove("on");
      document.documentElement.style.overflow = "";
      setTimeout(() => { menu.hidden = true; }, 240);
      btn.focus();
    }
  };

  btn.addEventListener("click", () =>
    open(btn.getAttribute("aria-expanded") !== "true"));

  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") open(false);
    if (e.key !== "Tab" || menu.hidden) return;
    // Focus trap. Without it, tabbing walks invisibly through the page
    // underneath and the reader has no idea where they are.
    const items = [btn, ...menu.querySelectorAll("a")];
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // A resize past the breakpoint leaves an overlay pinned over a desktop
  // layout with no visible way to shut it.
  matchMedia("(min-width: 861px)").addEventListener("change", (m) => {
    if (m.matches && btn.getAttribute("aria-expanded") === "true") open(false);
  });
}

/* ————— site search —————
 * A static index built at build time, matched locally. No service, no
 * request per keystroke, no third party watching what people look for on
 * your site. About 30KB, fetched once on first open and then cached.
 *
 * Ranking is deliberately crude and deliberately explicable: a hit in a
 * heading outweighs one in body text, an exact phrase outweighs scattered
 * words, and the page title outweighs a section. Anything cleverer would
 * be unpredictable, and unpredictable search on a 29-page site is worse
 * than none.
 */
function siteSearch() {
  const dlg = document.getElementById("sdlg");
  const input = document.getElementById("sq");
  const out = document.getElementById("sres");
  if (!dlg || !input || !out) return;

  let index = null, last = "", opener = null;

  const load = async () => {
    if (index) return index;
    index = await fetch("/assets/search.json").then((r) => r.json()).catch(() => []);
    return index;
  };

  const open = async (yes, seed = "") => {
    // Whoever opened it gets focus back when it shuts. Without this the
    // keyboard user lands back at the top of the document and has to tab
    // all the way to where they were, which is the whole reason the
    // search is a dialog and not a page.
    if (yes && !dlg.classList.contains("on")) {
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    dlg.classList.toggle("on", yes);
    document.documentElement.style.overflow = yes ? "hidden" : "";
    if (yes) {
      await load();
      input.value = seed || input.value;
      input.focus();
      input.select();
      run();
    } else if (opener && document.contains(opener)) {
      opener.focus();
      opener = null;
    }
  };

  // A modal dialog that lets Tab walk out behind it is not modal. Cycle
  // within the box; there is nothing else on the screen to reach.
  dlg.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const f = [...dlg.querySelectorAll('input,a[href],button')]
      .filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last_ = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last_.focus(); }
    else if (!e.shiftKey && document.activeElement === last_) { e.preventDefault(); first.focus(); }
  });

  const score = (q, hay, weight) => {
    const h = hay.toLowerCase();
    if (h.includes(q)) return weight * 4;              // the whole phrase
    const words = q.split(/\s+/).filter(Boolean);
    if (!words.length) return 0;
    const hits = words.filter((w) => h.includes(w)).length;
    return hits === words.length ? weight * 2 : weight * hits * 0.5;
  };

  const run = () => {
    const q = input.value.trim().toLowerCase();
    if (q === last) return;
    last = q;
    if (!q || !index) { out.innerHTML = ""; return; }

    const hits = [];
    for (const page of index) {
      for (const e of page.e) {
        const s = score(q, e.h, 3) + score(q, e.t, 1) + score(q, page.n, 2);
        if (s > 0) hits.push({ s, page, e });
      }
    }
    hits.sort((a, b) => b.s - a.s);

    if (!hits.length) {
      out.innerHTML =
        '<p class="sempty">Nothing matched. The glossary covers the tax vocabulary, ' +
        'and <a href="/contact">a person</a> covers the rest.</p>';
      return;
    }
    out.innerHTML = hits.slice(0, 12).map(({ page, e }) => {
      const href = page.u + (e.a ? "#" + e.a : "");
      return `<a href="${href}"><b>${e.h}</b><i>${page.n} · ${page.u}</i>` +
             (e.t ? `<p>${e.t}</p>` : "") + "</a>";
    }).join("");
  };

  input.addEventListener("input", run);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { out.querySelector("a")?.click(); }
    if (e.key === "ArrowDown") { e.preventDefault(); out.querySelector("a")?.focus(); }
  });

  document.querySelectorAll("[data-search]").forEach((b) =>
    b.addEventListener("click", () => open(true)));

  dlg.addEventListener("click", (e) => { if (e.target === dlg) open(false); });

  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dlg.classList.contains("on")) open(false);
    // The shortcut everyone already has in their fingers.
    if ((e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) &&
        !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
      e.preventDefault(); open(true);
    }
  });

  // A 404 can pre-fill the box with whatever URL they were reaching for.
  if (document.body.dataset.notfound) {
    const guess = location.pathname.replace(/[/_-]+/g, " ").trim();
    if (guess) open(true, guess);
  }
}

/* ————— the board, made real —————
 * The pipeline screen on /tour becomes draggable. Progressive: without
 * JavaScript it is the same static picture, which is why the markup was
 * never conditional on this running.
 *
 * Pointer events rather than the HTML drag-and-drop API, because HTML5
 * DnD does not fire on touch at all — and the argument this board makes
 * is about a sales team on their phones.
 */
function liveBoard() {
  const board = document.querySelector('[data-live] .a-board');
  if (!board) return;

  board.querySelectorAll(".a-lead").forEach((card) => {
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-describedby", "boardhelp");

    let drag = null;

    card.addEventListener("pointerdown", (e) => {
      if (e.button) return;
      drag = { x: e.clientX, y: e.clientY };
      card.setPointerCapture(e.pointerId);
      card.style.cursor = "grabbing";
      card.style.zIndex = "5";
    });

    card.addEventListener("pointermove", (e) => {
      if (!drag) return;
      card.style.transform =
        `translate(${e.clientX - drag.x}px, ${e.clientY - drag.y}px)`;
      card.style.opacity = "0.9";
    });

    const drop = (e) => {
      if (!drag) return;
      drag = null;
      card.style.cursor = card.style.zIndex = card.style.opacity = "";
      card.style.transform = "";
      // Whichever column's box contains the pointer wins. Simple, and it
      // behaves the same for a mouse and a thumb.
      const col = [...board.querySelectorAll(".a-col")].find((c) => {
        const r = c.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right;
      });
      if (col && col.querySelector("ul") !== card.parentElement) {
        move(card, col);
      }
    };
    card.addEventListener("pointerup", drop);
    card.addEventListener("pointercancel", drop);

    // Keyboard, because a board you can only use with a pointer is a
    // board half your visitors cannot use at all.
    card.addEventListener("keydown", (e) => {
      const cols = [...board.querySelectorAll(".a-col")];
      const here = cols.indexOf(card.closest(".a-col"));
      let to = null;
      if (e.key === "ArrowRight") to = cols[here + 1];
      if (e.key === "ArrowLeft") to = cols[here - 1];
      if (!to) return;
      e.preventDefault();
      move(card, to);
      card.focus();
    });
  });

  function move(card, col) {
    const list = col.querySelector("ul");
    list.querySelector(".dim")?.remove();          // the "Nothing here" line
    list.appendChild(card);
    recount();
  }

  // Reconcile the counts with reality before anyone touches it.
  //
  // The static screen carries the real product's figures — 34 new, 51
  // contacted — because that is what the picture is for. The moment the
  // board becomes interactive those numbers are a lie about what is on
  // screen, and the first drag would have snapped 34 to 1 in front of
  // the reader. Better to be consistent from the first frame.
  recount();

  function recount() {
    board.querySelectorAll(".a-col").forEach((c) => {
      const n = c.querySelectorAll(".a-lead").length;
      const badge = c.querySelector("header span");
      if (badge) badge.textContent = String(n);
      const ul = c.querySelector("ul");
      if (!n && !ul.querySelector(".dim")) {
        const li = document.createElement("li");
        li.className = "dim";
        li.style.cssText = "font-size:11px;padding:6px 2px";
        li.textContent = "Nothing here";
        ul.appendChild(li);
      }
    });
  }
}

/* ————— batch 30: analytics, inert until there is somewhere to send it —————
 * Written now so that turning measurement on later is a configuration
 * change rather than a code change. Until `window.ORDENCE_ANALYTICS` is
 * set by a snippet in the head, `track` is a no-op that costs nothing.
 *
 * First touch is recorded separately from the submitting page, because
 * they are different facts and only the first one tells you which page
 * earned the enquiry. sessionStorage rather than a cookie: it dies with
 * the tab, so it is not a cross-session identifier and does not change
 * what the privacy page has to say.
 */
function firstTouch() {
  try {
    if (!sessionStorage.getItem("ordence_first")) {
      sessionStorage.setItem("ordence_first", location.pathname);
      sessionStorage.setItem("ordence_ref", document.referrer || "direct");
    }
  } catch { /* private mode; not worth a broken page */ }
}

function track(event, detail) {
  const sink = window.ORDENCE_ANALYTICS;

  /* Three states, and the default is the quiet one.
   *
   *   undefined  — nothing happens. No request, no storage, no cost.
   *                This is today, and it stays today until somebody
   *                decides otherwise.
   *   a function — hand it over and let it decide. This is the hook for
   *                Plausible, Fathom, Cloudflare Web Analytics, or a
   *                three-line snippet in the head.
   *   true       — post it to our own Worker, which writes it to KV. No
   *                third party, no cookie, no identifier: the endpoint
   *                sees an event name, a path, and whatever country
   *                Cloudflare's edge says the request came from.
   *
   * sendBeacon rather than fetch, so a click that navigates away does not
   * cancel its own measurement — which is exactly the click most worth
   * measuring. It is fire-and-forget by design: nothing on this page
   * waits for it and nothing on this page changes if it fails.
   */
  if (typeof sink === "function") { sink(event, detail || {}); return; }
  if (sink !== true) return;
  try {
    const body = JSON.stringify({
      event, page: location.pathname, detail: detail || {},
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/e", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/e", { method: "POST", body, keepalive: true }).catch(() => {});
    }
  } catch { /* never the reason a page misbehaves */ }
}

/* ————— batch 18: the cost calculator —————
 * Shows its working. A calculator that will not show its arithmetic is a
 * lead-capture form in costume, and the reader can tell.
 */
function roiCalc() {
  const form = document.getElementById("roi");
  if (!form) return;
  const total = document.getElementById("roitotal");
  const work = document.getElementById("roiwork");

  // Indian digit grouping. Getting this wrong on a page aimed at Indian
  // businesses is the loudest possible tell.
  const inr = (n) => {
    n = Math.round(n);
    const s = String(Math.abs(n));
    if (s.length <= 3) return (n < 0 ? "-₹" : "₹") + s;
    const last3 = s.slice(-3);
    let head = s.slice(0, -3), parts = [];
    while (head.length > 2) { parts.unshift(head.slice(-2)); head = head.slice(0, -2); }
    if (head) parts.unshift(head);
    return (n < 0 ? "-₹" : "₹") + parts.join(",") + "," + last3;
  };

  const num = (n) => Math.max(0, Number(form.elements[n].value) || 0);

  const recalc = () => {
    const people = num("people"), hours = num("hours"), cost = num("cost");
    const closedays = num("closedays"), writeoff = num("writeoff"), itc = num("itc");

    const rekey = people * hours * 46 * cost;          // 46 working weeks
    // Month-end above two days, costed for two people. Two days is a
    // reasonable close; the excess is the reconciliation, not the books.
    const close = Math.max(0, closedays - 2) * 12 * 8 * cost * 2;

    const lines = [
      [`${people} people × ${hours} h/week × 46 weeks × ${inr(cost)}`, rekey,
       "Re-keying and reconciling"],
      [`${Math.max(0, closedays - 2)} days over a 2-day close × 12 months × 2 people × 8 h`,
       close, "Month-end"],
      ["as entered", writeoff, "Stock written off"],
      ["as entered", itc, "Input tax credit lost"],
    ];
    const sum = rekey + close + writeoff + itc;

    total.textContent = inr(sum) + " a year";
    work.innerHTML = lines.map(([how, v, what]) =>
      `<tr><td>${what}</td><td class="calchow">${how}</td>` +
      `<td class="calcval">${inr(v)}</td></tr>`).join("") +
      `<tr class="calcsum"><td>Total</td><td class="calchow">` +
      `about ${inr(sum / 12)} a month</td><td class="calcval">${inr(sum)}</td></tr>`;
  };

  form.addEventListener("input", recalc);
  recalc();
  form.addEventListener("change", () => track("roi_changed", {}), { once: true });
}

/* ————— batch 17: the scope questionnaire —————
 * One question at a time, because twelve at once is a form and a form is
 * what this exists to avoid. Nothing leaves the browser until the reader
 * chooses to send it, and the summary is theirs either way.
 */
function scopeQuiz() {
  const form = document.getElementById("quiz");
  if (!form) return;
  const steps = [...form.querySelectorAll(".qstep")];
  const bar = document.getElementById("qprog");
  const back = document.getElementById("qback");
  const next = document.getElementById("qnext");
  const done = document.getElementById("qdone");
  const nav = form.querySelector(".qnav");
  const out = document.getElementById("qsummary");
  let at = 0;

  const show = (i) => {
    steps.forEach((s, n) => { s.hidden = n !== i; });
    at = i;
    bar.style.width = `${((i + 1) / steps.length) * 100}%`;
    back.hidden = i === 0;
    next.textContent = i === steps.length - 1 ? "See the summary" : "Next";
    // Move focus to the new question, or a keyboard user is left behind
    // on a button while the content changes silently around them.
    steps[i].querySelector("input")?.focus();
  };

  const answered = (i) =>
    !!steps[i].querySelector("input:checked");

  next.addEventListener("click", () => {
    if (!answered(at)) {
      steps[at].classList.add("qmiss");
      setTimeout(() => steps[at].classList.remove("qmiss"), 900);
      return;
    }
    if (at < steps.length - 1) { show(at + 1); return; }
    finish();
  });
  back.addEventListener("click", () => show(Math.max(0, at - 1)));

  // Choosing an answer moves you on. Twelve extra clicks on "Next" is
  // twelve chances to stop.
  form.addEventListener("change", (e) => {
    if (e.target.type !== "radio") return;
    if (at < steps.length - 1) setTimeout(() => show(at + 1), 180);
  });

  function finish() {
    const lines = steps.map((s) => {
      const q = s.querySelector("legend").textContent
        .replace(/^\d+ of \d+/, "").trim();
      const a = s.querySelector("input:checked")?.value || "—";
      return `${q}\n  ${a}`;
    });
    const text = "Ordence — scope summary\n\n" + lines.join("\n\n");
    out.textContent = text;
    steps.forEach((s) => { s.hidden = true; });
    nav.hidden = true;
    done.hidden = false;
    bar.style.width = "100%";
    out.focus();
    try { sessionStorage.setItem("ordence_scope", text); } catch {}
    track("scope_completed", { answers: steps.length });
  }

  document.getElementById("qcopy")?.addEventListener("click", async (e) => {
    try {
      await navigator.clipboard.writeText(out.textContent);
      e.target.textContent = "Copied";
      setTimeout(() => { e.target.textContent = "Copy it"; }, 1800);
    } catch {
      // Clipboard refused — select it so ⌘C still works.
      const r = document.createRange();
      r.selectNodeContents(out);
      getSelection().removeAllRanges();
      getSelection().addRange(r);
    }
  });

  show(0);
}

firstTouch();
phoneMenu();
siteSearch();
roiCalc();
scopeQuiz();
liveBoard();
headerFade();
ambient();
cookieNotice();
stickyCta();
enquiryForm();
