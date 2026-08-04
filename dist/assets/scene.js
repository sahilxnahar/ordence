/* Ordence scene engine. Extracted from the verified preview build. */
import * as THREE from "./three.module.min.js";
const $ = (id) => document.getElementById(id);
/* Diagnostics are optional on a real page — the debug panel only exists
   in the preview build. Writing through a helper means a missing element
   is a no-op rather than a TypeError that kills the whole module. */
const setText = (id, value) => { const el = $(id); if (el) el.textContent = value; };
const MARK_LAYERS = await fetch(new URL('./mark-layers.json', import.meta.url))
  .then(r => r.json()).catch(() => []);

/* ═══════════════════════════════════════════════════════════════════
   THE ADAPTIVE ENGINE

   One scene, many machines. A ₹8,000 Android phone on a 3G connection
   and an M3 Max on a 5K display both have to arrive somewhere good, and
   the honest way to do that is to measure the machine rather than guess
   from the screen width. A 4K screen tells you about pixels, not about
   the GPU pushing them — plenty of cheap laptops ship 4K panels attached
   to integrated graphics, and a phone can have a denser display than a
   workstation. So this profiles three things and then keeps watching.
   ═══════════════════════════════════════════════════════════════════ */

const TIERS = {
  //          particles   dpr   bloom  flow  depth
  ultra:   { count: 90000, dpr: 2.00, bloom: 1.00, flow: 0.68, depth: 1.00 },
  high:    { count: 52000, dpr: 1.75, bloom: 0.90, flow: 0.62, depth: 1.00 },
  medium:  { count: 30000, dpr: 1.50, bloom: 0.72, flow: 0.52, depth: 0.85 },
  low:     { count: 15000, dpr: 1.25, bloom: 0.45, flow: 0.38, depth: 0.60 },
  minimal: { count:  6000, dpr: 1.00, bloom: 0.00, flow: 0.20, depth: 0.30 },
};
const ORDER = ["minimal","low","medium","high","ultra"];

function profile(gl){
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cores   = navigator.hardwareConcurrency || 4;
  const mem     = navigator.deviceMemory || 4;          // Chromium only
  const touch   = matchMedia("(pointer: coarse)").matches;
  const dpr     = devicePixelRatio || 1;
  const px      = screen.width * screen.height * dpr * dpr;

  let gpu = "unknown";
  try {
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (ext) gpu = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || gpu;
  } catch { /* privacy-hardened browsers withhold this; the score copes */ }
  const g = gpu.toLowerCase();

  /* Score from evidence, not from one signal. Each clue nudges; no single
     clue decides. A machine that looks weak on every axis lands on
     minimal, one that looks strong on every axis lands on ultra, and the
     ambiguous majority land in the middle where the cost of being wrong
     is smallest. */
  let score = 2;                                        // start at medium
  if (cores >= 8) score++;
  if (cores <= 4) score--;
  if (mem >= 8) score++;
  if (mem <= 2) score--;
  if (touch) score--;                                   // phones throttle hard
  /* Discrete and Apple silicon read as fast. Integrated and mobile parts
     read as slow. These strings are the ones that actually appear in
     UNMASKED_RENDERER_WEBGL, not marketing names. */
  if (/rtx|radeon rx|geforce|apple m[1-9]|quadro|arc a/.test(g)) score += 2;
  if (/intel.*(hd|uhd|iris xe)|mali|adreno [1-6]|powervr|swiftshader|llvmpipe/.test(g)) score -= 2;
  if (/swiftshader|llvmpipe|software/.test(g)) score = 0;   // no GPU at all
  /* A very high pixel count costs fill rate on every single frame, so it
     pulls the tier down even on strong hardware — the particles are
     overdraw-bound, not geometry-bound. */
  if (px > 8_000_000) score--;
  if (px > 14_000_000) score--;

  /* Override for testing, and so a preview can be judged at settings the
     viewing machine would not otherwise choose: ?tier=ultra|high|medium|low|minimal */
  const forced = new URLSearchParams(location.search).get("tier");
  const tier = TIERS[forced] ? forced
             : reduced ? "minimal"
             : ORDER[Math.max(0, Math.min(4, score))];
  return { tier, gpu, cores, mem, touch, dpr, reduced,
           label: `${touch ? "touch" : "desktop"} · ${cores}c · ${gpu.slice(0,28)}` };
}

/* ═══════════════════════════════════════════════════════════════════
   THE MARK

   Rendered one glyph at a time. The composite raster was the whole
   problem in v3: seven overlapping letterforms flatten into a single
   silhouette, and the four that share the ink colour become one
   indistinguishable mass. Rendered separately, each glyph keeps its own
   outline and its own value, and the kaleidoscope reads as seven things
   instead of one blob.

   Each layer is also edge-detected. Particles on the outline get full
   brightness; particles filling the interior get a fraction of it. That
   is what turns a solid blob into legible line art — you can see the
   counters inside the O and the D, and you can see which glyph is in
   front, because outlines survive overlap where fills do not.
   ═══════════════════════════════════════════════════════════════════ */

/* Four glyphs share #111827, which is invisible on a #08090c page. Rather
   than remapping all four to one pale tone — v3's mistake, which merged
   them — each gets its own value from a cool grey ramp. Different
   luminance, no invented hue. */
const INK_RAMP = [
  [1.00,1.00,1.00],[0.87,0.91,1.00],[0.96,0.98,1.00],[0.80,0.86,0.98],
];

function rasterise(svgText, size){
  return new Promise((res)=>{
    const img = new Image();
    img.onload = ()=>{
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const g = c.getContext("2d", { willReadFrequently:true });
      g.drawImage(img, 0, 0, size, size);
      res(g.getImageData(0,0,size,size).data);
    };
    img.onerror = ()=>res(null);
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgText)));
  });
}

/* Wider than v3 (66) because the kaleidoscope spreads seven glyphs over
   its own width — each individual letterform is only a fraction of the
   mark, and below a certain size no amount of contrast rescues it. The
   lift keeps it clear of the closing copy, which sits at the bottom. */
const MARK_W = 78, MARK_LIFT = 14;

async function sampleMark(size = 620){
  const edge = [], fill = [];
  let inkSeen = 0;
  for (const layerSvg of MARK_LAYERS){
    const d = await rasterise(layerSvg, size);
    if (!d) continue;
    const A = (x,y) => d[(y*size + x)*4 + 3];
    /* Decide this layer's colour once, from its first opaque pixel —
       every layer is a single flat fill, so one sample is the whole
       truth and we skip 380,000 luminance tests. */
    let col = null;
    for (let i = 0; i < d.length && !col; i += 4){
      if (d[i+3] < 60) continue;
      const r = d[i]/255, g = d[i+1]/255, b = d[i+2]/255;
      col = (0.2126*r + 0.7152*g + 0.0722*b) < 0.30
        ? INK_RAMP[inkSeen++ % INK_RAMP.length]
        : [Math.min(1,r*1.1), Math.min(1,g*1.1), Math.min(1,b*1.1)];
    }
    if (!col) continue;

    const S = 2;                                    // edge probe distance
    for (let y = S; y < size-S; y++){
      for (let x = S; x < size-S; x++){
        if (A(x,y) < 60) continue;
        const isEdge = A(x-S,y) < 60 || A(x+S,y) < 60 || A(x,y-S) < 60 || A(x,y+S) < 60;
        const p = { x:(x/size - 0.5)*MARK_W, y:-(y/size - 0.5)*MARK_W + MARK_LIFT, c:col };
        if (isEdge) edge.push(p);
        else if (((x*7 + y*11) % 9) === 0) fill.push(p);    // sparse interior
      }
    }
  }
  return { edge, fill };
}

/* ═══════════════════════════════════════════════════════════════════ */

const VERT = `
precision highp float;
attribute vec3 aChaos, aRows, aGrid, aMark, aMarkCol;
attribute float aSeed, aLayer, aEdge;
uniform float uTime, uProgress, uSize, uFlow, uDepth, uPtrAmt, uPixelRatio, uDensity;
uniform vec2 uPtr;
varying vec3 vCol;
varying float vGlow;

vec3 curl(vec3 p, float t){
  return vec3(
    sin(p.y*0.13 + t*0.42) + sin(p.z*0.11 - t*0.31),
    sin(p.z*0.12 - t*0.37) + sin(p.x*0.09 + t*0.27),
    sin(p.x*0.10 + t*0.33) + sin(p.y*0.14 - t*0.24));
}

void main(){
  float p = clamp(uProgress, 0.0, 3.0);
  float i = floor(p);
  float f = smoothstep(0.0, 1.0, fract(p));
  float lag = mix(0.0, 0.28, fract(aSeed * 7.31));
  float ff  = smoothstep(lag, 1.0, fract(p));

  vec3 a = i < 0.5 ? aChaos : (i < 1.5 ? aRows : (i < 2.5 ? aGrid : aMark));
  vec3 b = i < 0.5 ? aRows  : (i < 1.5 ? aGrid : aMark);
  vec3 pos = mix(a, b, i < 2.5 ? ff : f);

  /* How completely the mark has resolved. Drives every legibility
     decision below, because the settings that make a drifting cloud
     beautiful are the same settings that make a logo unreadable. */
  float focus = smoothstep(2.25, 2.95, p);

  float layer = mix(1.0, aLayer, uDepth);
  pos.z += (layer - 1.0) * 26.0 * (1.0 - focus * 0.82);
  pos.xy *= mix(1.0, 0.82 + layer * 0.3, uDepth * (1.0 - focus));

  vec3 drift = curl(pos * 0.9 + aSeed * 4.0, uTime) * uFlow * 1.9;
  drift *= mix(1.0, 0.10, focus);
  pos += drift;

  vec2 dd = pos.xy - uPtr;
  pos.xy += normalize(dd + 0.0001) * (14.0 / (length(dd) + 6.0)) * uPtrAmt * 2.4 * (1.0 - focus * 0.7);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);

  float energy = clamp(length(drift) * 0.5 + (1.0 - ff) * 0.7, 0.0, 1.0);
  float place  = clamp(length(pos.xy) / 46.0, 0.0, 1.0);
  float t = clamp(mix(1.0 - energy, 1.0 - place, 0.55), 0.0, 1.0);

  vec3 c0=vec3(0.16,0.14,0.30), c1=vec3(0.36,0.24,0.74), c2=vec3(0.52,0.39,0.93),
       c3=vec3(0.95,0.42,0.40), c4=vec3(0.83,0.63,0.21), c5=vec3(1.00,0.94,0.86);
  vec3 ramp = t < 0.2 ? mix(c0,c1,t/0.2)
            : t < 0.4 ? mix(c1,c2,(t-0.2)/0.2)
            : t < 0.6 ? mix(c2,c3,(t-0.4)/0.2)
            : t < 0.8 ? mix(c3,c4,(t-0.6)/0.2)
                      : mix(c4,c5,(t-0.8)/0.2);
  ramp += (fract(aSeed*13.7) - 0.5) * 0.09;

  vCol  = mix(ramp, aMarkCol, focus * 0.94);
  /* Interior particles fall back to a fraction of their brightness as the
     mark resolves; outline particles hold theirs. Fills stop swallowing
     the counters, outlines survive where glyphs overlap, and the
     letterforms separate. */
  /* A drifting particle can be dim because motion carries it. A settled
     one cannot — it just looks grey. So brightness does not decay toward
     the mark, it crosses over to a floor of its own: outlines bright
     enough to read as drawn line, interiors low enough to stay shading. */
  float base = 0.35 + energy * 0.65;
  vGlow = mix(base, mix(0.30, 1.30, aEdge), focus);

  gl_PointSize = uSize * uPixelRatio * (300.0 / max(-mv.z, 1.0)) * uDensity
               * (0.75 + fract(aSeed*5.7) * 0.5)
               * mix(1.0, mix(0.60, 0.44, aEdge), focus);   // shrink to sharpen
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = `
precision highp float;
varying vec3 vCol; varying float vGlow;
uniform float uAlpha, uCore;
void main(){
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d); a *= a;
  gl_FragColor = vec4(vCol + vec3(smoothstep(0.22, 0.0, d) * uCore), a * uAlpha * vGlow);
}`;

/* ═══════════════════════════════════════════════════════════════════ */

const cvs = $("stage");
let drawn = false;   // flipped on the first drawn frame; reveals the canvas over the poster
const renderer = new THREE.WebGLRenderer({
  canvas:cvs, alpha:true, antialias:false,     // round sprites antialias themselves
  powerPreference:"high-performance", stencil:false, depth:false,
});
const DEV = profile(renderer.getContext());
let tierName = DEV.tier, T = TIERS[tierName];

renderer.setPixelRatio(Math.min(devicePixelRatio, T.dpr));
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(52, innerWidth/innerHeight, 0.1, 2000);

/* ————— FIT —————
   A fixed camera distance composes correctly at exactly one aspect ratio.
   Vertical field of view is constant, so a narrow phone crops the mark's
   sides off and an ultrawide monitor leaves it marooned in the middle of a
   very large frame. This solves for the distance at which a sphere of
   world radius RADIUS fits BOTH axes, so the mark is framed the same way
   on a 21:9 display and a portrait phone — the horizontal fit governs on
   narrow screens, the vertical on wide ones. */
const RADIUS = 47;
let baseZ = 96;
function fitCamera(){
  cam.aspect = innerWidth / innerHeight;
  const vFov = cam.fov * Math.PI / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * cam.aspect);
  baseZ = Math.max(RADIUS / Math.tan(vFov / 2), RADIUS / Math.tan(hFov / 2)) * 1.04;
  cam.updateProjectionMatrix();
}
fitCamera();
cam.position.set(0, 0, baseZ);

const U = {
  uTime:{value:0}, uProgress:{value:0}, uFlow:{value:T.flow}, uDepth:{value:T.depth},
  uPtr:{value:new THREE.Vector2(9999,9999)}, uPtrAmt:{value:DEV.touch ? 0 : 0.5},
  uPixelRatio:{value:renderer.getPixelRatio()}, uDensity:{value:1},
};
const mkMat = (alpha, core, sizeMul) => new THREE.ShaderMaterial({
  uniforms: Object.assign({}, U, {
    uAlpha:{value:alpha}, uCore:{value:core}, uSize:{value:2.0*sizeMul},
  }),
  vertexShader:VERT, fragmentShader:FRAG,
  transparent:true, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending,
});

let geo, core, halo, MARK = null;

function build(count){
  const prev = geo;
  geo = new THREE.BufferGeometry();
  const F = (n) => new Float32Array(count*n);
  const chaos=F(3), rows=F(3), grid=F(3), mk=F(3), mc=F(3), seed=F(1), lay=F(1), edg=F(1);

  let s = 20260802;
  const rnd = () => (s = (s*1664525 + 1013904223) >>> 0) / 4294967296;
  const E = MARK ? MARK.edge : [], FI = MARK ? MARK.fill : [];
  const COLS = 44;

  for (let i=0;i<count;i++){
    const i3 = i*3;
    const th = rnd()*Math.PI*2, ph = Math.acos(2*rnd()-1), r = 26+rnd()*30;
    chaos[i3]=r*Math.sin(ph)*Math.cos(th)*1.5;
    chaos[i3+1]=r*Math.sin(ph)*Math.sin(th)*0.8;
    chaos[i3+2]=r*Math.cos(ph)*0.7;

    const band=i%6, idx=Math.floor(i/6);
    rows[i3]=((idx%COLS)/COLS-0.5)*104+(rnd()-0.5)*1.4;
    rows[i3+1]=(band-2.5)*7.2+(rnd()-0.5)*1.1;
    rows[i3+2]=(Math.floor(idx/COLS)/40-0.5)*16;

    const gx=i%38, gy=Math.floor(i/38)%26, gz=Math.floor(i/(38*26));
    grid[i3]=(gx-18.5)*2.5+(rnd()-0.5)*.4;
    grid[i3+1]=(gy-12.5)*2.0+(rnd()-0.5)*.4;
    grid[i3+2]=(gz-4)*3.2;

    /* Two in three particles draw the outline, one in three fills the
       interior. The ratio is the legibility dial: all-outline looks like
       wireframe, all-fill looks like the blob v3 produced. */
    const onEdge = (i % 3) !== 0 && E.length > 0;
    const src = onEdge ? E : (FI.length ? FI : E);
    if (src.length){
      const m = src[(i*7919) % src.length];
      mk[i3]=m.x+(rnd()-0.5)*0.34; mk[i3+1]=m.y+(rnd()-0.5)*0.34; mk[i3+2]=(rnd()-0.5)*1.5;
      mc[i3]=m.c[0]; mc[i3+1]=m.c[1]; mc[i3+2]=m.c[2];
    } else { mc[i3]=mc[i3+1]=mc[i3+2]=1; }
    edg[i] = onEdge ? 1 : 0;

    seed[i]=rnd();
    lay[i]=rnd()<0.5 ? 0.55+rnd()*0.25 : (rnd()<0.6 ? 1.0 : 1.35+rnd()*0.3);
  }

  const A=(n,arr,sz)=>geo.setAttribute(n,new THREE.BufferAttribute(arr,sz));
  A("position",chaos,3); A("aChaos",chaos,3); A("aRows",rows,3); A("aGrid",grid,3);
  A("aMark",mk,3); A("aMarkCol",mc,3);
  A("aSeed",seed,1); A("aLayer",lay,1); A("aEdge",edg,1);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400);
  U.uDensity.value = Math.sqrt(20000 / count);

  if (core){ scene.remove(core); scene.remove(halo); }
  halo = new THREE.Points(geo, mkMat(0.23*T.bloom, 0.0, 3.4));
  core = new THREE.Points(geo, mkMat(0.95, 0.55, 1.0));
  halo.frustumCulled = core.frustumCulled = false;
  halo.visible = T.bloom > 0.01;
  scene.add(halo); scene.add(core);
  if (prev) prev.dispose();                       // release the old buffers

  setText("dCount", count.toLocaleString());
}

function applyTier(name){
  tierName = name; T = TIERS[name];
  renderer.setPixelRatio(Math.min(devicePixelRatio, T.dpr));
  U.uPixelRatio.value = renderer.getPixelRatio();
  U.uFlow.value = T.flow; U.uDepth.value = T.depth;
  build(T.count);
  setText("dTier", name);
  setText("dDpr", renderer.getPixelRatio().toFixed(2));
}

function sync(){
  for (const m of [halo, core]){
    if (!m) continue;
    const u = m.material.uniforms;
    u.uTime.value=U.uTime.value; u.uProgress.value=U.uProgress.value;
    u.uFlow.value=U.uFlow.value; u.uDepth.value=U.uDepth.value;
    u.uPtrAmt.value=U.uPtrAmt.value; u.uDensity.value=U.uDensity.value;
    u.uPixelRatio.value=U.uPixelRatio.value; u.uPtr.value.copy(U.uPtr.value);
  }
  /* Bloom is the first thing to go as the mark resolves. It is what
     filled the counters and welded the glyphs together in v3. */
  if (halo) halo.material.uniforms.uAlpha.value =
    0.23 * T.bloom * (1 - 0.78 * smoothstep(2.25, 2.95, U.uProgress.value));
}
function smoothstep(a,b,x){ const t=Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t); }

/* ————— input ————— */
let target=0, prog=0, spinX=0, spinY=0, drag=null;
addEventListener("scroll", ()=>{
  const max = document.body.scrollHeight - innerHeight;
  const t = max>0 ? scrollY/max : 0;
  target = Math.min(3, t * PROG_SCALE);
  $("hint").style.opacity = t > 0.02 ? 0 : 1;
}, {passive:true});
addEventListener("pointerdown", e=>{ if(!e.target.closest("#pill,#dbg")) drag={x:e.clientX,y:e.clientY,sx:spinX,sy:spinY}; });
addEventListener("pointerup", ()=>drag=null);
addEventListener("pointermove", e=>{
  U.uPtr.value.set((e.clientX/innerWidth-0.5)*90, -(e.clientY/innerHeight-0.5)*60);
  if (drag){ spinY = drag.sy + (e.clientX-drag.x)*0.0042; spinX = drag.sx + (e.clientY-drag.y)*0.0030; }
});
let rt; addEventListener("resize", ()=>{
  clearTimeout(rt);
  rt = setTimeout(()=>{
    renderer.setSize(innerWidth, innerHeight);
    fitCamera(); measure();
  }, 140);
});
/* A hidden tab still fires rAF in some browsers and always produces a
   huge first dt when it returns. Both are handled here. */
let hidden = false;
addEventListener("visibilitychange", ()=>{ hidden = document.hidden; last = performance.now(); });
cvs.addEventListener("webglcontextlost", e=>{ e.preventDefault(); });

/* ————— one beat at a time —————
   Section geometry is measured once and cached. Reading it per frame would
   force a layout on every tick; scrollY alone is free. */
const BEATS = [...document.querySelectorAll("#scroller section")].map(el => ({
  el, col: el.querySelector(".col"), top: 0, h: 0,
}));
/* The scroll-to-progress scale is DERIVED, never guessed. A hardcoded
   multiplier silently goes wrong the moment a section height changes —
   which is exactly how the mark ended up only 84% formed under its own
   headline. This solves for the value that puts progress at exactly 3.0
   when the mark's beat is centred, whatever the section heights are. */
let PROG_SCALE = 3.8;
/* Each page declares its own shape program and which beat anchors it.
   Read from the document so one cached engine serves every page. */
const PROGRAM = (document.body.dataset.program || "chaos,drift").split(",");
const MARK_BEAT = Number(document.body.dataset.anchor ?? -1) >= 0
  ? Number(document.body.dataset.anchor)
  : Math.max(0, document.querySelectorAll("#scroller section").length - 2);
function measure(){
  for (const b of BEATS){
    const r = b.el.getBoundingClientRect();
    b.top = r.top + scrollY; b.h = r.height;
  }
  const max = document.body.scrollHeight - innerHeight;
  const m = BEATS[MARK_BEAT];
  if (m && max > 0){
    /* Target the START of the mark beat's pinned window, not its middle:
       the logo is then fully formed the instant that beat takes the
       screen and STAYS formed for the whole time it holds it, rather than
       still assembling under its own headline. */
    PROG_SCALE = 3 / Math.max(0.05, Math.min(0.999, m.top / max));
  }
}
measure();
addEventListener("load", measure);
setTimeout(measure, 600);            // after webfonts settle the metrics

function beats(){
  const vh = innerHeight;
  for (const b of BEATS){
    /* A beat is at full strength for exactly as long as its rail is
       pinned — because that is precisely the range over which its copy is
       dead centre and cannot be clipped. Measuring from the section's
       midpoint instead was subtly wrong: it left the hero at 65% on
       arrival, since a 125svh section's midpoint sits below the centre of
       the viewport at scroll zero.

       So distance is measured from the pinned WINDOW, and is zero
       anywhere inside it. Outside, the copy has started travelling toward
       an edge and fades steeply enough to be gone before it clips. */
    const s0 = b.top, s1 = b.top + b.h - vh;
    /* Signed displacement of this rail from its pinned position. */
    const off = scrollY < s0 ? (s0 - scrollY)
              : scrollY > s1 ? -(scrollY - s1) : 0;
    const d = Math.min(1, Math.abs(off) / (vh * 1.15));
    b.col.style.opacity = Math.pow(1 - d, 1.5).toFixed(3);
    /* Counteract most of the drift. The gap between two pinned windows is
       always exactly one viewport tall — that is forced by the geometry,
       not a tunable — so without this there is a full screen of scrolling
       where every beat has faded to nothing and the page looks broken.
       Holding the copy near centre while it cross-fades turns that dead
       zone into a proper hand-off, and keeps a half-faded block from
       sliding off an edge on its way out. */
    b.col.style.transform = `translateY(${(-off * 0.8).toFixed(1)}px)`;
  }
}

/* ————— the arrival pill ————— */
const pill=$("pill"), bar=$("pillBar"), glide=$("pillGlide"), phint=$("pillHint");
const DEFAULT_HINT="Where would you like to go?";
let pillOn=null;
function showPill(on){
  if (on === pillOn) return;
  pillOn = on;
  if (on) pill.hidden = false;
  requestAnimationFrame(()=>pill.classList.toggle("on", on));
  if (!on) setTimeout(()=>{ if(!pillOn) pill.hidden = true; }, 700);
}
function moveGlide(a){
  phint.textContent = a.dataset.hint || DEFAULT_HINT;
  glide.style.width = a.offsetWidth + "px";
  glide.style.transform = `translateX(${a.offsetLeft - 6}px)`;
}
bar.addEventListener("pointerover", e=>{ const a=e.target.closest("a"); if(a) moveGlide(a); });
bar.addEventListener("focusin", e=>{ const a=e.target.closest("a"); if(a){ glide.style.opacity=1; moveGlide(a);} });
bar.addEventListener("pointerleave", ()=>phint.textContent=DEFAULT_HINT);
bar.addEventListener("focusout", ()=>{ glide.style.opacity=""; phint.textContent=DEFAULT_HINT; });
bar.addEventListener("click", e=>{
  const a=e.target.closest("a"); if(!a) return;
  /* Real navigation. Only the current page's own link is intercepted,
     because on that page "Home" means the top of this scroll. */
  const here = location.pathname.replace(/index\.html$/, "");
  if (new URL(a.href).pathname.replace(/index\.html$/, "") === here) {
    e.preventDefault(); scrollTo({ top: 0, behavior: "smooth" });
  }
});

/* ————— diagnostics ————— */
if (location.search.includes("debug")) $("dbg").classList.add("on");
addEventListener("keydown", e=>{ if(e.key==="d"||e.key==="D") $("dbg").classList.toggle("on"); });

/* ═══════════════════════════════════════════════════════════════════
   RUNTIME ADAPTATION

   The static profile is a first guess. It cannot know about a machine on
   battery saver, a browser with fifty other tabs, or a GPU that throttles
   when it warms up — and it deliberately cannot know the GPU at all in a
   privacy-hardened browser. So the frame rate is measured continuously
   and the tier moves.

   Downgrades are quick, because a visitor stuck at 20fps is having a bad
   time right now. Upgrades are slow, need sustained headroom, and are
   permitted only once — otherwise a machine sitting near the boundary
   oscillates between tiers, and rebuilding the buffers to switch is
   itself a stutter. Better to settle slightly low than to hunt forever.
   ═══════════════════════════════════════════════════════════════════ */
let last=performance.now(), fCount=0, fAcc=0, winFps=[], upgrades=0, settleAt=0;

const FORCED = TIERS[new URLSearchParams(location.search).get("tier")] ? true : false;
function adapt(fps){
  if (FORCED) return;
  winFps.push(fps); if (winFps.length > 5) winFps.shift();
  if (winFps.length < 3 || performance.now() < settleAt) return;
  const avg = winFps.reduce((a,b)=>a+b,0) / winFps.length;
  const i = ORDER.indexOf(tierName);
  if (avg < 42 && i > 0){
    applyTier(ORDER[i-1]); winFps.length = 0; settleAt = performance.now() + 2500;
  } else if (avg > 58 && i < ORDER.length-1 && upgrades < 1 && !DEV.reduced){
    upgrades++; applyTier(ORDER[i+1]); winFps.length = 0; settleAt = performance.now() + 6000;
  }
}

function loop(now){
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now-last)/1000); last = now;
  if (hidden) return;

  U.uTime.value += dt;
  prog += (target - prog) * Math.min(1, dt * 3.4);
  U.uProgress.value = prog;
  if (core){ core.rotation.y = halo.rotation.y = spinY; core.rotation.x = halo.rotation.x = spinX; }
  cam.position.z = baseZ - Math.sin(Math.min(prog,3)/3 * Math.PI) * (baseZ * 0.125);
  sync();
  renderer.render(scene, cam);
  /* The poster gradient underneath holds the frame until there is a real
     one to show. Reveal on the first drawn frame, not on module load —
     the gap between "script ran" and "particles exist" is the whole gap
     the poster is covering. */
  if (!drawn) { drawn = true; cvs.dataset.ready = "1"; }
  beats();
  showPill(prog > 2.9);

  fCount++; fAcc += dt;
  if (fAcc >= 0.5){
    const fps = fCount / fAcc;
    setText("dFps", Math.round(fps));
    adapt(fps);
    fCount = 0; fAcc = 0;
  }
}

(async ()=>{
  setText("dDev", DEV.touch ? "touch" : "desktop");
  setText("dTier", tierName);
  MARK = await sampleMark();
  setText("dMark", (MARK.edge.length + MARK.fill.length).toLocaleString());
  window.__engine = { DEV, get tier(){return tierName}, get prog(){return prog},
                      get scale(){return PROG_SCALE}, beats:BEATS,
                      mark:{edge:MARK.edge.length, fill:MARK.fill.length} };
  applyTier(tierName);
  requestAnimationFrame(loop);
})();
