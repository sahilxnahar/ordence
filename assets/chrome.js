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
  if (!cv || reduced) return;

  const ctx = cv.getContext("2d", { alpha: true });
  if (!ctx) return;

  let dots = [], w = 0, h = 0, dpr = 1, raf = 0, running = false;

  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const n = Math.min(260, Math.round((w * h) / 5200));
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

headerFade();
ambient();
cookieNotice();
