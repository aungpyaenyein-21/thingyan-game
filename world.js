// world.js — the diorama engine shared by the story zones (docs/archive/STORY.md): renderer, light, sky, post, chibi people,
// street pets, water + petal particles, input, camera follow and the frame loop. A zone page builds its own set on top.
// Lifted from diorama.html (which stays as the art prototype); same look, same numbers.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { makeChibi, ChibiAnimator, HAIRS, HAIRS_DYED, HAIR_GREY, TOPS, ACCENTS } from './chibi.js?v=31';
import { makeCritter, CritterAnimator, DOG_COATS, CAT_COATS } from './critters.js?v=6';
import { PAL as TONE } from './palette.js?v=1';
import { createOrbit } from './camera.js?v=2';
import { createSky, createSurround } from './sky.js?v=4';

export { THREE };
// the old key names stay (every zone file uses them); the colours now come from palette.js (docs/PALETTE.md) where a token exists
export const PAL = {
  soil:'#b5835a', soilDark:'#8a5f42', grass:'#9cc58a', road:'#7d7085', roadLine:'#efe3c8', frame:'#fff7ea',
  window:'#5b6c9a', shutter:'#6b5a7a', bamboo:'#d8b06a', red:'#d9534f', gold:'#f2c14e', white:'#fff6ea',
  leaf:'#6a9f58', leafLight:'#86b96d', trunk:'#7a5038', hair:'#2b1d1a', eye:'#2b1d1a', thanaka:'#fdf0c8',
  ...TONE, // sand dust shade · cream mint pink ochre teal · brick zinc · water wet splash · padauk tarp · gang1 gang4 …
  walk: TONE.sand, butter: TONE.ochre, roof: TONE.brick, puddle: TONE.wet,
};
export const SKINS = ['#efc29c', '#d9a07a', '#b97d58'];
export const LONGYI = [['#4a5aa8', '#7f8fd6'], ['#a8434a', '#d97a7f'], ['#3f7a5a', '#72b08b'], ['#7a4a9a', '#a985c8'], ['#a8743a', '#d6a76a']];
const SHIRTS = TOPS.filter(c => !['#4fb3d9', '#f06292', '#ffc83d'].includes(c)); // keep crew blue, dancer pink and the player's yellow for their roles
const BOTTOMS = { longyi: LONGYI, htamein: [['#a8434a', '#e08a8f'], ['#7a4a9a', '#c79be0'], ['#3f6fa8', '#8fb8e8']], pants: [['#3f5a8a', '#3f5a8a'], ['#b59a6a', '#b59a6a'], ['#2e2e38', '#2e2e38']], shorts: [['#5b7fa8', '#f6ead2'], ['#3f7a5a', '#f6ead2'], ['#b59a6a', '#f6ead2']],
  skirt: [['#4a6a9a', '#4a6a9a'], ['#e9a0b4', '#e9a0b4'], ['#f2d27a', '#f2d27a'], ['#2e2e38', '#2e2e38']], overalls: [['#4a6a9a', '#4a6a9a'], ['#e0574f', '#e0574f']] };
const KID_TOPS = ['#ff7f6b', '#8bd17c', '#ff9f43', '#4fd1c5', '#b388ff'], KID_BOTTOMS = [['#ff9f43', '#fff6ea'], ['#4fd1c5', '#fff6ea'], ['#b388ff', '#fff6ea']];
const TAIKPON = ['#2e3a59', '#3a3030', '#f3ead8'], HOODIE = ['#9aa3ad', '#2e3a59', '#8a3a4a', '#3f7a5a'], JACKET = ['#4a6a9a', '#b59a6a', '#2e2e38'];
const GRAV = -11;
const FONT = '"Myanmar Sangam MN","Noto Sans Myanmar",Padauk,sans-serif';

// opts: half = island half size, or bounds = { x0, x1, z0, z1 } for a non-square map; ground(x, z) = walk height,
// paintSky(g, W, H, dusk) = extra sky art (skyline, zedi), camClamp = how far the camera follows (small islands),
// camBounds = { x0, x1, z0, z1 }: on a big map the camera centres on you, kept inside this rect; view = default zoom
// camera: 'iso' (the original fixed orthographic view — war.html until T3) | 'orbit' (T2: perspective, turns in 45° steps, camera.js)
// surround: { rects } — orbit only: ground, streets running on and a low town outside the island (sky.js createSurround)
export function createWorld({ half = 9, bounds, ground = () => .01, paintSky, camClamp = 4, camBounds, view = 15, seed = 20270413, camera = 'iso', surround = null } = {}) {
  const ORBIT = camera === 'orbit';
  let B = bounds ?? { x0: -half, x1: half, z0: -half, z1: half };
  const P = new URLSearchParams(location.search);
  let VIEW = +(P.get('v') || view); // ortho view height (units); wheel zooms 7..28
  const PHONE = matchMedia('(pointer:coarse)').matches;
  const Q = P.get('q') || (PHONE ? 'low' : 'high'); // ?q=low|high|off; low = phone: half-size bloom, same look
  // ရုပ်ထွက် button: auto (adapts to the phone), high (always the full look), lite (saves battery). Remembered per device.
  let GFX = P.get('q') ? 'fixed' : (() => { try { return localStorage.getItem('thingyan.gfx') || 'auto'; } catch { return 'auto'; } })();
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = a => a[(rnd() * a.length) | 0];

  // ---------- renderer / camera / light ----------
  const renderer = new THREE.WebGLRenderer({ antialias: Q === 'off', powerPreference: 'high-performance' });
  const PR = Math.min(devicePixelRatio, 2);
  renderer.setPixelRatio(PR);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = ORBIT ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap; // orbit: plain PCF (cheaper; the soft kernel smeared at a low sun anyway)
  let shadowTick = 0; if (PHONE) renderer.shadowMap.autoUpdate = false;
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const cam = ORBIT ? new THREE.PerspectiveCamera(40, 1, .1, 260) : new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  // orbit: docs/CAMERA.md — base 11 (a phone held upright 12), the player's zoom offset remembered, never inside a wall
  const camCollide = (from, to) => { // the camera may not sit inside a building: pull it in to just short of the wall (CAMERA.md §၅)
    let best = null;
    for (const o of occluders) { if (!o.box.containsPoint(to) || o.box.containsPoint(from)) continue; cRay.origin.copy(from); cRay.direction.copy(to).sub(from).normalize(); const p = cRay.intersectBox(o.box, cHit); if (p) { const d = p.distanceTo(from); if (best === null || d < best) best = d; } }
    return best;
  };
  const cRay = new THREE.Ray(), cHit = new THREE.Vector3(), oMove = new THREE.Vector3();
  const orbit = ORBIT ? createOrbit(cam, { base: innerWidth < innerHeight ? 12 : 11, storageKey: 'thingyan.zoom', collide: camCollide }) : null;
  const ISO = new THREE.Vector3(1, 0.95, 1).normalize().multiplyScalar(60);
  const camTarget = new THREE.Vector3();
  scene.add(cam);
  const skyC = document.createElement('canvas'), skyT = new THREE.CanvasTexture(skyC); skyT.colorSpace = THREE.SRGBColorSpace; scene.background = skyT;
  // time of day: 0 = the usual golden afternoon, 1 = dusk (setTime). Sky stops, sun and fill light all blend between the two.
  const SKY = [['#ffd9a8', '#3d3470'], ['#f9b8a0', '#7a4f92'], ['#d9a3c0', '#d97a7a'], ['#b39bd1', '#f2a65a']], STOPS = [0, .45, .8, 1];
  const mix = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
  let dusk = 0, night = 0; // setTime: 0..1 afternoon → sunset (dusk), 1..2 sunset → night
  function drawSky() { // gradient + soft sun, redrawn per aspect so the sun stays round
    if (sky) { sky.setTime(dusk, night); if (scene.fog) scene.fog.color.copy(sky.horizon); return; } // orbit: the dome (sky.js) instead
    const H = 512, W = Math.round(H * innerWidth / innerHeight); skyC.width = W; skyC.height = H; const g = skyC.getContext('2d');
    const NIGHT = ['#0f1433', '#1c2150', '#2f2a5a', '#46386a'];
    const gr = g.createLinearGradient(0, 0, 0, H); SKY.forEach(([a, b], i) => gr.addColorStop(STOPS[i], mix(mix(a, b, dusk), NIGHT[i], night)));
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const r = H * .14 * (1 - dusk * .3), cx = W / 2, cy = H * (.2 + dusk * .55), rg = g.createRadialGradient(cx, cy, r * .2, cx, cy, r * 1.6), a = (1 - dusk * .45) * (1 - night); // the sun sinks and reddens
    rg.addColorStop(0, `rgba(255,245,218,${.95 * a})`); rg.addColorStop(.6, `rgba(255,${240 - dusk * 70},${205 - dusk * 90},${.85 * a})`); rg.addColorStop(.66, `rgba(255,232,190,${.25 * a})`); rg.addColorStop(1, 'rgba(255,232,190,0)');
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
    if (night > .3) { g.fillStyle = `rgba(255,250,235,${(night - .3) * .9})`; for (let i = 0; i < 70; i++) { const sx = (Math.sin(i * 91.7) * .5 + .5) * W, sy = (Math.sin(i * 47.3) * .5 + .5) * H * .55; g.fillRect(sx, sy, i % 7 ? 1.5 : 2.5, i % 7 ? 1.5 : 2.5); } } // stars
    paintSky?.(g, W, H, dusk); skyT.needsUpdate = true;
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .45; // only the metals (Standard) use it
  const hemi = new THREE.HemisphereLight('#ffe2c4', TONE.shade, 1.55); scene.add(hemi); // lavender fill = soft lilac shadows
  const sun = new THREE.DirectionalLight('#ffb46b', 2.4);
  const SUN = new THREE.Vector3(-14, 11, 6); // the sun's offset from wherever the camera looks, so shadows follow you round a big map
  sun.position.copy(SUN); sun.castShadow = true; scene.add(sun.target);
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
  Object.assign(sun.shadow.camera, ORBIT ? { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 50 } : { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 50 }); // orbit: 12 m round you
  scene.add(sun);
  // orbit: a sky dome that stays right when you turn, fog into the horizon colour, and the town carrying on past the island's edge
  const sky = ORBIT ? createSky(scene, { paintSky, sunBearing: SUN }) : null;
  if (sky) { scene.background = null; scene.fog = new THREE.Fog(sky.horizon.clone(), 30, 115); }
  const town = ORBIT && surround ? createSurround(scene, B, surround) : null;
  const occluders = []; // see occluder() below
  function setTime(t) { // 0 day .. 1 dusk; windows (PAL.window) glow as it gets dark
    dusk = THREE.MathUtils.clamp(t, 0, 1); night = THREE.MathUtils.clamp(t - 1, 0, 1);
    sun.color.set(mix(mix('#ffb46b', '#ff7a5a', dusk), '#8fa0e8', night)); sun.intensity = 2.4 - dusk * 1.5 - night * .6; // the sun goes, a cool moonlight stays
    hemi.color.set(mix(mix('#ffe2c4', '#9a8ad0', dusk), '#5d68b0', night)); hemi.groundColor.set(mix(mix(TONE.shade, '#3f3368', dusk), '#221d3e', night)); hemi.intensity = 1.55 - dusk * .35 - night * .55;
    M(PAL.window).emissive.set('#ffc46b').multiplyScalar(dusk * dusk * .9 + night * .4);
    for (const o of occluders) for (const c of o.mats) if (c.userData.base.emissive) c.emissive.copy(c.userData.base.emissive); // see-through buildings' windows light up too
    document.body.style.background = mix(mix('#f9b8a0', '#7a4f92', dusk), '#1c2150', night);
    drawSky();
  }

  // ---------- builders ----------
  const matCache = {};
  const M = (c, o = {}) => matCache[c + JSON.stringify(o)] ??= new THREE.MeshLambertMaterial({ color: c, flatShading: true, ...o });
  const statics = [], LOD = 26; // LOD: |dx| + |dz| from the camera beyond which people and pets stop animating
  function mesh(geo, color, x = 0, y = 0, z = 0, opt = {}) {
    const m = new THREE.Mesh(geo, typeof color === 'string' ? M(color) : color);
    m.position.set(x, y, z); m.castShadow = opt.cast ?? true; m.receiveShadow = true;
    (opt.parent || scene).add(m); statics.push(m); return m;
  }
  const box = (w, h, d, c, x, y, z, o) => mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(.07, Math.min(w, h, d) * .3)), c, x, y + h / 2, z, o);
  const cyl = (rt, rb, h, c, x, y, z, seg = 10, o) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), c, x, y + h / 2, z, o);
  function textTex(text, bg, fg, w = 512, h = 128, size = 64) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg;
    g.font = `${size}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const tw = g.measureText(text).width; if (tw > w * .92) g.font = `${Math.floor(size * w * .92 / tw)}px ${FONT}`; // too long for the board: shrink to fit
    g.fillText(text, w / 2, h / 2 + 4);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  function stripeTex(a, b, n = 8, plaid = false) {
    const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d');
    g.fillStyle = a; g.fillRect(0, 0, 32, 32); g.fillStyle = b;
    for (let i = 0; i < n; i += 2) g.fillRect(i * 32 / n, 0, 32 / n, 32);
    if (plaid) { g.globalAlpha = .45; for (let i = 0; i < n; i += 2) g.fillRect(0, i * 32 / n, 32, 32 / n); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.NearestFilter; return t;
  }
  function bubbleTex(text) { // speech bubble for street calls ("ဟင်းသီး… ဟင်းရွက်…"); a long line wraps onto two rows (texture.userData.tall)
    const c = document.createElement('canvas'), g = c.getContext('2d'); c.width = 512;
    const fit = (t, px) => { g.font = `${px}px ${FONT}`; const w = g.measureText(t).width; return w > 460 ? Math.floor(px * 460 / w) : px; };
    let px = fit(text, 60), sp = text.indexOf(' ', text.length / 2 - 4), rows = [text];
    if (px < 44 && sp > 0) { rows = [text.slice(0, sp), text.slice(sp + 1)]; px = Math.min(fit(rows[0], 56), fit(rows[1], 56)); }
    const H = rows.length > 1 ? 196 : 112; c.height = H + 48;
    g.fillStyle = '#fff6ea'; g.strokeStyle = '#5a3550'; g.lineWidth = 6;
    g.beginPath(); g.roundRect(6, 6, 500, H, 40); g.moveTo(230, H + 6); g.lineTo(256, H + 40); g.lineTo(282, H + 6); g.fill(); g.stroke();
    g.fillStyle = '#fff6ea'; g.fillRect(234, H - 2, 44, 12);
    g.fillStyle = '#5a3550'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${px}px ${FONT}`;
    rows.forEach((r, i) => g.fillText(r, 256, rows.length > 1 ? 56 + i * 86 : 64));
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.userData.tall = rows.length > 1; t.userData.text = text; return t;
  }
  // ---------- speech: a bubble sprite handed to speak() is shown as HTML over the canvas instead, so it stays sharp, a
  // readable size on a phone (the world is drawn half size there), never cut by a roof or blurred with the distance, and
  // two that overlap get nudged apart. Callers keep driving the sprite (visible, map, position) exactly as before. ----------
  const speech = [], bubLayer = document.createElement('div'); bubLayer.id = 'bubbles';
  const bubCss = document.createElement('style');
  bubCss.textContent = `#bubbles{position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden}
    #bubbles .bub{position:absolute;left:0;top:0;display:none;max-width:min(240px,46vw);padding:3px 12px 4px;border:2px solid #5a3550;border-radius:14px;background:#fff6ea;color:#5a3550;
      font:15px/1.55 ${FONT};text-align:center;white-space:normal;box-shadow:0 2px 0 rgba(90,53,80,.18);will-change:transform}
    #bubbles .bub::after{content:'';position:absolute;left:50%;bottom:-8px;margin-left:-7px;border:7px solid transparent;border-bottom:0;border-top-color:#5a3550}
    #bubbles .bub::before{content:'';position:absolute;left:50%;bottom:-5px;margin-left:-5px;border:5px solid transparent;border-bottom:0;border-top-color:#fff6ea;z-index:1}
    @media (pointer:coarse){#bubbles .bub{font-size:13px;padding:2px 10px 3px}}
    body.busy #bubbles{display:none}`;
  document.head.appendChild(bubCss); document.body.appendChild(bubLayer);
  function speak(sprite) { sprite.layers.set(1); const el = document.createElement('div'); el.className = 'bub'; bubLayer.appendChild(el); speech.push({ s: sprite, el, text: '', on: false }); return sprite; }
  const bp = new THREE.Vector3(), bs = new THREE.Vector3(), BUB_MAX = PHONE ? 4 : 6; // only the few nearest you talk at once: a market doesn't drown the screen
  function placeBubbles() {
    const want = [];
    for (const b of speech) {
      let on = !!b.s.parent; for (let q = b.s; on && q; q = q.parent) on = q.visible;
      if (on) { b.s.getWorldPosition(bp); b.d = bp.distanceToSquared(W.player.g.position) - (b.s.userData.talk ? 1e4 : 0); b.s.getWorldScale(bs); bp.y -= bs.y * .45; bp.project(cam); on = b.d < 144 && Math.abs(bp.x) < 1.05 && Math.abs(bp.y) < 1.05; } // street calls from further off than ~12 stay quiet
      if (on) { b.x = (bp.x * .5 + .5) * innerWidth; b.y = (-bp.y * .5 + .5) * innerHeight - 8; want.push(b); }
    }
    want.sort((a, b) => a.d - b.d); const shown = want.slice(0, BUB_MAX), keep = new Set(shown);
    for (const b of speech) if (b.on && !keep.has(b)) { b.el.style.display = 'none'; b.on = false; }
    for (const b of shown) {
      const t = b.s.material.map?.userData.text ?? ''; if (t !== b.text) { b.el.textContent = b.text = t; }
      if (!b.on) { b.el.style.display = 'block'; b.on = true; }
    }
    for (const b of shown) { b.w = b.el.offsetWidth; b.h = b.el.offsetHeight; b.x = THREE.MathUtils.clamp(b.x, b.w / 2 + 6, innerWidth - b.w / 2 - 6); } // never past the screen edge
    shown.sort((a, b) => b.y - a.y); // the lowest on screen keeps its place; anyone overlapping it moves up
    for (let i = 1; i < shown.length; i++) for (let j = 0; j < i; j++) {
      const a = shown[i], o = shown[j];
      if (Math.abs(a.x - o.x) < (a.w + o.w) / 2 + 4 && a.y > o.y - o.h - 4 && a.y - a.h < o.y + 4) a.y = o.y - o.h - 6;
    }
    for (const b of shown) b.el.style.transform = `translate(${Math.round(b.x - b.w / 2)}px,${Math.round(b.y - b.h)}px)`;
  }

  const solids = []; // AABBs the player can't walk into
  const solid = (x, z, w, d) => solids.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 });
  function collide(p) {
    p.x = THREE.MathUtils.clamp(p.x, B.x0 + .4, B.x1 - .4); p.z = THREE.MathUtils.clamp(p.z, B.z0 + .4, B.z1 - .4);
    for (const s of solids) {
      if (p.x > s.x0 - .3 && p.x < s.x1 + .3 && p.z > s.z0 - .3 && p.z < s.z1 + .3) {
        const dx0 = p.x - (s.x0 - .3), dx1 = s.x1 + .3 - p.x, dz0 = p.z - (s.z0 - .3), dz1 = s.z1 + .3 - p.z, m = Math.min(dx0, dx1, dz0, dz1);
        if (m === dx0) p.x = s.x0 - .3; else if (m === dx1) p.x = s.x1 + .3; else if (m === dz0) p.z = s.z0 - .3; else p.z = s.z1 + .3;
      }
    }
  }

  // padauk trees: their blossom spots feed the instanced flowers + falling petals (built in start())
  const flowerSpots = [];
  function padauk(x, z, s = 1, bloom = true) { // bloom: false for a tree that hasn't flowered yet
    cyl(.12 * s, .18 * s, 1.4 * s, PAL.trunk, x, 0, z, 6);
    for (const [ox, oy, oz, r, c] of [[0, 1.9, 0, .95, PAL.leaf], [.55, 1.6, .3, .6, PAL.leafLight], [-.5, 1.65, -.25, .65, PAL.leafLight], [.1, 2.5, -.1, .6, PAL.leaf]]) {
      mesh(new THREE.IcosahedronGeometry(r * s, 0), c, x + ox * s, oy * s, z + oz * s);
      for (let k = 0; k < (bloom === true ? 7 : bloom || 0); k++) { // bloom: a number for a tree in full flower
        const v = new THREE.Vector3(rnd() - .5, rnd() * .9 - .1, rnd() - .5).normalize().multiplyScalar(r * s * .95);
        flowerSpots.push(new THREE.Vector3(x + ox * s + v.x, oy * s + v.y, z + oz * s + v.z));
      }
    }
    solid(x, z, .6, .6);
  }
  const cableM = M('#3b3040');
  function sag(a, b, drop = .45) { // sagging overhead cable between two points
    const mid = a.clone().lerp(b, .5); mid.y -= drop;
    mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 16, .014, 4), cableM, 0, 0, 0, { cast: false });
  }

  // ---------- bean characters ----------
  // Everything unspecified is rolled: age, build, hair style + colour, top cut, face, slippers, headgear, water gun, garland, thanaka.
  const chars = [];
  function emitFx(type, obj, root) { // root: whoever is splashing, so kids can splash too, not just the player
    const w = obj.getWorldPosition(new THREE.Vector3());
    const f = new THREE.Vector3(Math.sin(root.rotation.y), 0, Math.cos(root.rotation.y)), k = root.scale.x;
    if (type === 'splash') { splash(w.addScaledVector(f, .2 * k).setY(w.y + .1), f, 64, root); W.onFx?.('splash', w); } // a bucket: a lot of water, it doesn't go far
    if (type === 'squirtStart') W.onFx?.('squirt', w);
    if (type === 'squirt') { // a water gun: a thin, fast stream that carries
      w.addScaledVector(f, .22 * k); const v = f.clone().multiplyScalar(8 + rnd() * .9); v.x += (rnd() - .5) * .25; v.z += (rnd() - .5) * .25; v.y = .9 + rnd() * .35;
      spawn(w, v, { own: root, s: .6 });
    }
    if (type === 'drip') for (let k = 0; k < 3; k++) { const a = rnd() * 6.28; spawn(w, new THREE.Vector3(Math.cos(a) * 2, 1 + rnd(), Math.sin(a) * 2)); }
  }
  function bean({ skin = pick(SKINS), shirt, hair, flower, bottom, longyi, x = 0, z = 0, ry = 0, print, age, hat, prop, build, topStyle, ...rest } = {}) {
    age ??= rnd() < .15 ? 'kid' : rnd() < .1 ? 'elder' : 'adult';
    const fem = ['bun', 'long', 'pigtails', 'bob'].includes(hair) || (!hair && rnd() < .5);
    hair ??= fem ? pick(age === 'kid' ? ['pigtails', 'bob', 'bun'] : ['bun', 'long', 'bob', 'short']) : pick(['short', 'buzz', 'spiky', 'short', 'mohawk']);
    bottom ??= age === 'elder' ? (fem ? 'htamein' : 'longyi')
      : age === 'kid' ? pick(fem ? ['shorts', 'skirt', 'overalls', 'htamein'] : ['shorts', 'shorts', 'overalls', 'pants'])
      : fem ? pick(['htamein', 'htamein', 'pants', 'skirt', 'skirt', 'shorts']) : pick(['longyi', 'longyi', 'longyi', 'pants', 'pants', 'shorts']);
    topStyle ??= age === 'elder' ? (fem ? 'yinphone' : pick(['taikpon', 'shirt']))
      : age === 'kid' ? pick(['tee', 'stripe', 'stripe', 'tank', 'hoodie'])
      : fem ? (rnd() < .25 ? 'yinphone' : pick(['tee', 'tee', 'shirt', 'long', 'hoodie', 'jacket', 'tank']))
      : rnd() < .12 ? 'taikpon' : pick(['tee', 'tee', 'shirt', 'hoodie', 'jacket', 'tank', 'long']);
    shirt ??= topStyle === 'taikpon' ? pick(TAIKPON) : age === 'elder' ? pick(['#fff6ea', '#f3ead8', '#dfe8f0']) : age === 'kid' ? pick(KID_TOPS)
      : topStyle === 'hoodie' ? pick(HOODIE) : topStyle === 'jacket' ? pick(JACKET) : pick(SHIRTS);
    flower ??= fem && age !== 'kid' && rnd() < .45;
    const bottomColor = bottom === 'longyi' && longyi ? longyi : age === 'kid' && (bottom === 'shorts' || bottom === 'pants') ? pick(KID_BOTTOMS) : pick(BOTTOMS[bottom]);
    const hairColor = age === 'elder' ? HAIR_GREY : rnd() < (hair === 'mohawk' ? .7 : .2) ? pick(HAIRS_DYED) : pick(HAIRS);
    hat ??= hair === 'mohawk' ? 'none' : age === 'elder' ? pick(['none', 'bucket']) : pick(['none', 'none', 'band', 'goggles', 'bucket']);
    prop ??= age === 'elder' ? 'none' : rnd() < .25 ? 'gun' : rnd() < .2 ? 'bucket' : 'none';
    const ch = makeChibi({ skin, top: shirt, topStyle, hair, hairColor, flower, bottom, bottomColor, print: print ?? pick(['သင်္ကြန်', '', '']),
      shoes: rnd() < .7 ? 'slipper' : 'sneaker', shoeColor: pick(['#c8553d', '#3f6fa8', '#5a4a3a', '#e9b44c']), accent: pick(ACCENTS), hat, prop, tool: rest.tool ?? (prop === 'none' ? 'none' : prop), garland: rnd() < .2,
      thanaka: age === 'kid' ? pick(['square', 'round']) : pick(['round', 'leaf', 'dots', false]), age, build: build ?? (age === 'kid' ? 'round' : fem ? 'slim' : 'broad'), outline: true,
      eyes: pick(['round', 'round', 'almond', 'bead', 'sleepy']), brows: pick(['arc', 'flat', 'thin', 'bold']), lips: pick(['smile', 'grin', 'small', 'cat']),
      marks: age === 'kid' ? pick(['blush', 'blush', 'none']) : pick(['none', 'none', 'blush', 'freckles', 'mole']), head: pick(['wide', 'round', 'tall', 'soft']), ...rest });
    ch.root.traverse(m => { if (m.isMesh) m.castShadow = false; }); // the soft blob under their feet is their shadow: half the draw calls for a crowd
    ch.root.position.set(x, ground(x, z), z); ch.root.rotation.y = ry; scene.add(ch.root);
    const c = { g: ch.root, ch, anim: null, cool: rnd() * 2, idleT: 2 + rnd() * 6 };
    c.anim = new ChibiAnimator(ch, (t, o) => emitFx(t, o, ch.root)); c.anim.T = rnd() * 3; // desync idle breathing/blinks
    chars.push(c); return c;
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(.3, .37, 32), new THREE.MeshBasicMaterial({ color: TONE.water, transparent: true, opacity: .85, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .012;
  const setPlayer = c => { W.player = c; c.g.add(ring); camTarget.copy(c.g.position); }; // ring: find yourself at any zoom

  // ---------- street dogs + cats ----------
  // dogs hang round shops, wander, nap; cats sit on doorsteps. Water makes dogs shake and cats bolt; dogs are pleased to see you.
  const blockedAt = (x, z) => solids.some(s => x > s.x0 - .22 && x < s.x1 + .22 && z > s.z0 - .22 && z < s.z1 + .22);
  const openAt = (x, z) => x > B.x0 + 1 && x < B.x1 - 1 && z > B.z0 + 1 && z < B.z1 - 1 && !blockedAt(x, z) && !W.offLimits?.(x, z);
  const ROLES = { // r = how far from home it strays (0 = anywhere), rest = what it does on arrival, t = how long
    shop: { r: 1, rest: ['sit', 'sit', 'idle', 'sleep'], t: [6, 14] }, walker: { r: 0, rest: ['idle', 'sit'], t: [2, 5], run: .25 },
    park: { r: .6, rest: ['sleep', 'sleep', 'sit'], t: [15, 30] }, house: { r: .8, rest: ['sit', 'sleep', 'sleep', 'idle'], t: [8, 20] },
  };
  function petSpot(c) {
    const h = c?.home, R = c ? ROLES[c.role].r : 0;
    for (let k = 0; k < 60; k++) {
      const x = h && R ? h.x + (rnd() * 2 - 1) * R : B.x0 + 1 + rnd() * (B.x1 - B.x0 - 2), z = h && R ? h.z + (rnd() * 2 - 1) * R : B.z0 + 1 + rnd() * (B.z1 - B.z0 - 2);
      if (openAt(x, z)) return new THREE.Vector3(x, 0, z);
    }
    return h ? h.clone() : new THREE.Vector3(0, 0, 0);
  }
  const pets = [];
  function addPet(kind, role, hx, hz, opts = {}) {
    const ch = makeCritter({ kind, coat: pick(kind === 'dog' ? DOG_COATS : CAT_COATS), ears: pick(['point', 'point', 'floppy']), socks: rnd() < .4, size: .9 + rnd() * .2, outline: true, ...opts });
    const c = { g: ch.root, ch, role, home: new THREE.Vector3(hx, 0, hz), anim: new CritterAnimator(ch, (t, o) => emitFx(t, o, ch.root)), cool: rnd(), rest: 3 + rnd() * 8, target: null, near: false, stuck: 0 };
    const at = role === 'walker' ? petSpot() : c.home;
    ch.root.position.set(at.x, ground(at.x, at.z), at.z); ch.root.rotation.y = rnd() * 6.28; scene.add(ch.root);
    c.anim.setLoop(pick(ROLES[role]?.rest ?? ['idle']));
    c.flee = from => { const a = Math.atan2(c.g.position.x - from.x, c.g.position.z - from.z), t = c.g.position.clone().add(new THREE.Vector3(Math.sin(a) * 2.5, 0, Math.cos(a) * 2.5));
      c.target = openAt(t.x, t.z) ? t : petSpot(c); c.anim.setLoop('run'); };
    c.hit = d => { // dogs shake it off, cats bolt
      c.anim.soak();
      if (ch.dog) { c.anim.setLoop('idle'); c.target = null; c.rest = 2 + rnd() * 2; c.anim.play('shake'); c.anim.emote('drop'); }
      else { c.anim.play('hop'); c.anim.emote('bang'); c.flee(d.p); }
    };
    pets.push(c); return c;
  }
  function updatePet(c, dt) {
    const a = c.anim, p = c.g.position, pp = W.player.g.position, role = ROLES[c.role];
    if (c.held) { a.update(dt); return; } // a zone is steering it (carried, following …)
    if (c.target) { // trot towards it, turning in an arc; give up if something keeps blocking
      const dx = c.target.x - p.x, dz = c.target.z - p.z;
      if (Math.hypot(dx, dz) < .2) { c.target = null; a.setLoop(pick(role.rest)); c.rest = role.t[0] + rnd() * (role.t[1] - role.t[0]); }
      else if (a.speed > 0) {
        let d = Math.atan2(dx, dz) - c.g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); c.g.rotation.y += d * Math.min(1, dt * 5);
        const ox = p.x, oz = p.z, s = a.speed * dt; p.x += Math.sin(c.g.rotation.y) * s; p.z += Math.cos(c.g.rotation.y) * s; collide(p);
        c.stuck = Math.hypot(p.x - ox, p.z - oz) < s * .3 ? c.stuck + dt : 0; if (c.stuck > 1) { c.target = petSpot(c); c.stuck = 0; }
      }
    } else if ((c.rest -= dt) < 0) { c.target = petSpot(c); a.setLoop(rnd() < (role.run || 0) ? 'run' : 'walk'); }
    const pd = Math.hypot(pp.x - p.x, pp.z - p.z);
    if (c.ch.dog) { if (pd < 1.3) { a.happy = 1; if (!c.near) { c.near = true; a.emote('heart'); if (a.loop === 'sleep') a.setLoop('sit'); } } else if (pd > 2) c.near = false; }
    else if (pd < 1.2 && W.player.anim.loop === 'run' && a.loop !== 'run') { a.emote('bang'); c.flee(pp); } // cats aren't, if you come running
    p.y = ground(p.x, p.z); c.cool -= dt; a.update(dt);
  }

  // ---------- particles: water + falling petals ----------
  // drops live in a pool; only the live ones are touched each frame and drawn (water.count). A drop that hits someone stops there
  // and bursts into a little spray off them, instead of flying on through.
  const NW = 1400, water = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.07, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(TONE.water).multiplyScalar(1.45) }), NW); // over 1: the water glows a little under bloom
  water.instanceMatrix.setUsage(THREE.DynamicDrawUsage); water.frustumCulled = false; water.count = 0; scene.add(water);
  const free = Array.from({ length: NW }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0, s: 1, own: null, spray: false })), live = [];
  function spawn(p, v, o) { // o: { own: the thrower's root (never hits them), s: size, life, spray: no hit test }
    const d = free.pop() ?? live.shift(); if (!d) return;
    d.p.copy(p); d.v.copy(v); d.life = o?.life ?? 2.2; d.s = o?.s ?? 1; d.own = o?.own ?? null; d.spray = !!o?.spray; live.push(d);
  }
  let sprayBudget = 0;
  function burst(d) { // the drop splats on someone: a few small droplets bounce off them
    if (sprayBudget <= 0) return; sprayBudget -= 3;
    const back = d.v.clone().multiplyScalar(-.12);
    for (let k = 0; k < 3; k++) spawn(d.p, new THREE.Vector3(back.x + (rnd() - .5) * 2.2, 1 + rnd() * 1.4, back.z + (rnd() - .5) * 2.2), { s: .5, life: .6, spray: true });
  }
  const NR = 40, rings = new THREE.InstancedMesh(new THREE.RingGeometry(.12, .17, 14), new THREE.MeshBasicMaterial({ color: TONE.splash, transparent: true, opacity: .85 }), NR);
  rings.instanceMatrix.setUsage(THREE.DynamicDrawUsage); rings.frustumCulled = false; scene.add(rings);
  const ringD = Array.from({ length: NR }, () => ({ x: 0, z: 0, t: 9 })); let ri = 0;
  function splash(from, dir, n = 34, own = null) { // a bucketful: a wide, heavy sheet of water that lands a couple of steps away
    for (let i = 0; i < n; i++) {
      const v = dir.clone().multiplyScalar(2.2 + rnd() * 1.6);
      v.x += (rnd() - .5) * 1.8; v.z += (rnd() - .5) * 1.8; v.y = 1.4 + rnd() * 1.6;
      spawn(from.clone().add(new THREE.Vector3((rnd() - .5) * .2, rnd() * .1, (rnd() - .5) * .2)), v, { own, s: .8 + rnd() * .5 });
    }
  }
  let petals = null, pet = [];

  // ---------- input ----------
  // E / the round button: the zone's onAction() gets first go (talk, pick up …); if it doesn't take it, you splash.
  const keys = {};
  const act = name => { const a = W.player.anim; if (a.one && a.one !== 'jump') return; if (name === 'dance') { a.setLoop(a.loop === 'dance' ? 'idle' : 'dance'); return; } a.play(name); };
  const action = () => { if (W.onAction?.()) return; if (!W.frozen) act('splash'); };
  const swapTool = () => { // bucket ⇄ water gun, for a hero who carries both
    const c = W.player, ts = c.ch.tools.filter(t => t !== 'none'); if (ts.length < 2 || c.anim.one === 'splash' || c.anim.one === 'squirt') return;
    const t = ts[(ts.indexOf(c.ch.tool) + 1) % ts.length]; c.anim.setTool(t); W.onTool?.(t);
  };
  document.getElementById('tool')?.addEventListener('pointerdown', e => { e.stopPropagation(); swapTool(); });
  addEventListener('keydown', e => {
    keys[e.code] = true; if (e.repeat) return;
    if (e.code === 'KeyE' || e.code === 'Enter') { action(); e.preventDefault(); return; }
    if (e.code === 'KeyR') { swapTool(); return; }
    if (ORBIT && (e.code === 'KeyZ' || e.code === 'KeyC')) { orbit.rotate(e.code === 'KeyZ' ? -1 : 1); return; } // Q is the wave, E the action: turn on Z / C
    if (W.frozen) return;
    const m = { Space: 'jump', KeyQ: 'wave', Digit1: 'dance', Digit2: 'kadaw' }[e.code];
    if (m) { act(m); e.preventDefault(); }
  });
  addEventListener('keyup', e => keys[e.code] = false);
  // touch: a thumb on the left half is the joystick — it appears under the thumb; a little push walks, all the way out runs.
  // Two fingers anywhere else pinch-zoom (a second finger landing before the stick has moved turns it into a pinch too).
  const STICK = 52; let touch = null; const fingers = new Map(); let pinch = 0;
  const stick = document.createElement('div'), knob = document.createElement('i'); stick.id = 'stick'; stick.appendChild(knob);
  Object.assign(stick.style, { position: 'fixed', zIndex: 3, width: '128px', height: '128px', marginLeft: '-64px', marginBottom: '-64px', borderRadius: '50%', pointerEvents: 'none',
    background: 'rgba(255,246,234,.22)', border: '3px solid rgba(255,246,234,.6)', boxSizing: 'border-box', display: PHONE ? 'block' : 'none', transition: 'opacity .2s' });
  Object.assign(knob.style, { position: 'absolute', left: '50%', top: '50%', width: '56px', height: '56px', margin: '-28px', borderRadius: '50%', background: 'rgba(255,246,234,.95)', boxShadow: '0 3px 0 rgba(90,53,80,.25)' });
  document.body.appendChild(stick);
  const home = () => { stick.style.left = 'calc(84px + env(safe-area-inset-left, 0px))'; stick.style.bottom = 'calc(84px + env(safe-area-inset-bottom, 0px))'; stick.style.opacity = .55; knob.style.transform = ''; knob.style.background = 'rgba(255,246,234,.95)'; };
  const drawStick = () => {
    const dx = touch.x - touch.x0, dy = touch.y - touch.y0, l = Math.hypot(dx, dy), k = l > STICK ? STICK / l : 1;
    knob.style.transform = `translate(${dx * k}px,${dy * k}px)`; knob.style.background = l > STICK * .8 ? '#f2a65a' : 'rgba(255,246,234,.95)'; // orange = running
  };
  home();
  const spread = () => { const [a, b] = [...fingers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  let turn = null; // orbit: one finger on the right half (or the right mouse button) dragged sideways turns the view, snapping to 45° on release
  if (ORBIT) renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());
  renderer.domElement.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') { if (ORBIT && e.button === 2) turn = { id: e.pointerId, x0: e.clientX }; return; }
    if (W.frozen) { action(); return; } // talking / a cutscene: a tap anywhere moves it on
    if (!touch && fingers.size === 0 && e.clientX < innerWidth * .5) {
      touch = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, id: e.pointerId };
      Object.assign(stick.style, { left: e.clientX + 'px', bottom: innerHeight - e.clientY + 'px', opacity: 1, display: 'block' }); drawStick(); return;
    }
    if (touch && Math.hypot(touch.x - touch.x0, touch.y - touch.y0) < 12) { fingers.set(touch.id, { x: touch.x, y: touch.y }); touch = null; home(); } // two fingers: a pinch after all
    fingers.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (fingers.size === 2) pinch = spread();
    if (ORBIT) { if (fingers.size === 1 && e.clientX >= innerWidth * .5) turn = { id: e.pointerId, x0: e.clientX }; else if (turn && fingers.size > 1) { orbit.drag(0); orbit.dragEnd(); turn = null; } } // a second finger: it's a pinch
  });
  addEventListener('pointermove', e => {
    if (touch && e.pointerId === touch.id) { touch.x = e.clientX; touch.y = e.clientY; drawStick(); return; }
    if (turn && e.pointerId === turn.id && Math.abs(e.clientX - turn.x0) > 8) orbit.drag(e.clientX - turn.x0);
    const f = fingers.get(e.pointerId); if (f) { f.x = e.clientX; f.y = e.clientY; }
    if (fingers.size === 2 && pinch) { const d = spread(); if (d > 10) { zoom(pinch / d); pinch = d; } }
  });
  const endTouch = e => { if (turn && e.pointerId === turn.id) { orbit.dragEnd(); turn = null; } fingers.delete(e.pointerId); if (fingers.size < 2) pinch = 0; if (touch && e.pointerId === touch.id) { touch = null; if (!PHONE) stick.style.display = 'none'; home(); } };
  addEventListener('pointerup', endTouch); addEventListener('pointercancel', endTouch);
  document.getElementById('splash')?.addEventListener('pointerdown', e => { e.stopPropagation(); action(); });
  document.getElementById('jump')?.addEventListener('pointerdown', e => { e.stopPropagation(); if (!W.frozen) act('jump'); });
  for (const [id, d] of [['rotl', -1], ['rotr', 1]]) { const b = document.getElementById(id); if (!b) continue; b.hidden = !ORBIT; b.addEventListener('pointerdown', e => { e.stopPropagation(); orbit?.rotate(d); }); }

  // ---------- post: bloom -> depth of field round you/grade/grain -> output ----------
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: Q === 'off' ? 0 : 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, cam));
  // orbit sees bulbs, lamps and white walls up close: a higher threshold and a tighter radius, or they bloom into blobs (T2 review)
  const bloom = Q !== 'off' ? new UnrealBloomPass(new THREE.Vector2(1, 1), ORBIT ? .35 : .5, ORBIT ? .2 : .45, ORBIT ? 1.6 : 1.25) : null; if (bloom) composer.addPass(bloom);
  if (bloom && Q === 'low') { const set = bloom.setSize.bind(bloom); bloom.setSize = (w, h) => set(Math.round(w / 2), Math.round(h / 2)); }
  const look = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, res: { value: new THREE.Vector2(1, 1) }, time: { value: 0 }, focus: { value: new THREE.Vector2(.5, .52) }, blur: { value: Q === 'off' ? 0 : 5.0 }, sat: { value: ORBIT ? .9 : 1.07 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 res, focus; uniform float time, blur, sat; varying vec2 vUv;
      void main(){
        float d = length((vUv - focus) * vec2(res.x / res.y, 1.));
        float r = smoothstep(.15, .6, d) * blur;                // sharp round you, softening the further away it is
        vec3 c;
        if (r < .3) c = texture2D(tDiffuse, vUv).rgb;
        else {
          vec4 col = vec4(0.);
          for (int i = 0; i < 16; i++) { float fi = float(i); float a = fi * 2.39996; vec2 o = vec2(cos(a), sin(a)) * sqrt((fi + .5) / 16.) * r / res; col += texture2D(tDiffuse, vUv + o); }
          c = col.rgb / 16.;
        }
        float l = dot(c, vec3(.2126, .7152, .0722));
        c = mix(vec3(l), c, sat);                                 // PALETTE: an April world, a little faded (orbit mode .9); the water is brighter than 1 going in, so it still reads
        c += vec3(.018, .004, .03) * (1. - smoothstep(0., .5, l)); // lilac lift in the darks (lo-fi)
        float v = smoothstep(.98, .35, length((vUv - .5) * vec2(1.15, 1.)));
        c *= mix(.84, 1., v);                                     // warm vignette
        float n = fract(sin(dot(vUv * res + time * 61.7, vec2(12.9898, 78.233))) * 43758.5453);
        c += (n - .5) * .022;                                     // film grain
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  composer.addPass(look);
  composer.addPass(new OutputPass());
  function fitCam() {
    if (ORBIT) { cam.aspect = innerWidth / innerHeight; cam.fov = cam.aspect < 1 ? 52 : 40; cam.updateProjectionMatrix(); return; } // CAMERA.md: landscape 40°, portrait 52°
    const a = innerWidth / innerHeight, h = a < 1 ? VIEW * 1.15 / a : VIEW; // portrait phones: keep ~17 units across
    Object.assign(cam, { left: -h * a / 2, right: h * a / 2, top: h / 2, bottom: -h / 2 }); cam.updateProjectionMatrix();
  }
  function resize() {
    fitCam();
    renderer.setSize(innerWidth, innerHeight); drawSky();
    const pr = renderer.getPixelRatio(); composer.setPixelRatio(pr); composer.setSize(innerWidth, innerHeight);
    look.uniforms.res.value.set(innerWidth * pr, innerHeight * pr);
  }

  // ---------- loop ----------
  const RIGHT = new THREE.Vector3(1, 0, -1).normalize(), UP = new THREE.Vector3(-1, 0, -1).normalize(), oR = new THREE.Vector3(), oF = new THREE.Vector3();
  const tmp = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), v3 = new THREE.Vector3(), fv = new THREE.Vector3(), fv2 = new THREE.Vector2();
  const flat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  const clock = new THREE.Clock(); let T = 0;
  const ndc = new THREE.Vector3();
  const DTMAX = +(P.get('dt') || 1 / 30); // longest step per frame (?dt= lets a very slow test browser keep time)
  // adaptive quality: when frames stay slow (under ~33 fps), step down; when there's room again (over ~52 fps), step back up.
  // Sharpness goes first in small steps (on a phone screen 2x vs 1.5x is hard to see), then the soft distance, then shadow
  // detail, and only at the very end the glow and the shadows — they are most of the look. ?q= or the ရုပ်ထွက် button pins it.
  const LEVELS = [ // [pixel ratio cap, distance blur, shadow map, bloom, shadows]
    [2, 1, 2048, 1, 1], [1.75, 1, 2048, 1, 1], [1.5, 1, 2048, 1, 1], [1.25, 1, 2048, 1, 1],
    [1.25, 0, 2048, 1, 1], [1, 0, 1024, 1, 1], [1, 0, 1024, 0, 1], [1, 0, 1024, 0, 0]];
  const AQ = { lvl: -1, t: -5, sum: 0, n: 0, ups: 0 };
  let blurBase = 0;
  const PHONE0 = ORBIT ? 2 : 1; // a phone starts here: orbit sees to the horizon, so pixel ratio ≤ 1.5 from the start
  function setLevel(l) {
    l = THREE.MathUtils.clamp(l, 0, LEVELS.length - 1); if (l === AQ.lvl) return;
    const [pr, blur, map, glow, shade] = LEVELS[l];
    if (Math.min(PR, pr) !== renderer.getPixelRatio()) { renderer.setPixelRatio(Math.min(PR, pr)); if (AQ.lvl >= 0) resize(); }
    blurBase = Q === 'off' ? 0 : blur * (ORBIT ? 3.2 : 5.0); look.uniforms.blur.value = blurBase; // orbit sees to the horizon: a lighter blur, or the sky goes to mush
    if (bloom) bloom.enabled = !!glow;
    if (sun.shadow.mapSize.x !== map) { sun.shadow.mapSize.set(map, map); sun.shadow.map?.dispose(); sun.shadow.map = null; renderer.shadowMap.needsUpdate = true; }
    sun.castShadow = !!shade;
    AQ.lvl = l;
  }
  function setGfx(m) { // 'auto' | 'high' | 'lite'
    GFX = m; try { localStorage.setItem('thingyan.gfx', m); } catch {}
    AQ.t = -2; AQ.sum = AQ.n = AQ.ups = 0;
    setLevel(m === 'high' ? 0 : m === 'lite' ? 5 : PHONE ? PHONE0 : 0); gfxLabel();
  }
  const gfxBtn = document.getElementById('gfx'), GFX_NAME = { auto: 'အလိုအလျောက်', high: 'အကောင်းဆုံး', lite: 'ဘက်ထရီချွေ' };
  const gfxLabel = () => { if (gfxBtn) gfxBtn.textContent = '🎨 ' + GFX_NAME[GFX]; };
  if (gfxBtn) {
    if (GFX === 'fixed') gfxBtn.hidden = true;
    gfxBtn.addEventListener('pointerdown', e => e.stopPropagation());
    gfxBtn.addEventListener('click', e => { e.stopPropagation(); setGfx({ auto: 'high', high: 'lite', lite: 'auto' }[GFX]); });
  }
  setLevel(GFX === 'lite' ? 5 : PHONE && GFX !== 'high' ? PHONE0 : 0); gfxLabel();
  function adapt(raw) {
    if (GFX !== 'auto' || document.hidden || raw > .5) return; // a long hitch is loading, not the scene
    AQ.t += raw; if (AQ.t < 0) return; AQ.sum += raw; AQ.n++;
    if (AQ.t < 3) return;
    const avg = AQ.sum / AQ.n; AQ.t = AQ.sum = AQ.n = 0;
    if (avg > 1 / 33) { setLevel(AQ.lvl + 1); AQ.t = -1; }
    else if (avg < 1 / 52 && AQ.lvl > 0 && AQ.ups < 3) { AQ.ups++; setLevel(AQ.lvl - 1); AQ.t = -3; } // a few tries back up, then settle
  }
  function frame() {
    if (W.paused) { clock.getDelta(); return; } // a full-screen view (the tea brewing) covers the town: don't draw it underneath
    const raw = clock.getDelta(), dt = Math.min(raw, DTMAX); T += dt; adapt(raw);
    const player = W.player, pa = player.anim;

    // player
    let ix = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
    let iy = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
    let farDrag = false;
    if (touch) { const dx = touch.x - touch.x0, dy = touch.y0 - touch.y, l = Math.hypot(dx, dy); if (l > 10) { ix = dx / l; iy = dy / l; farDrag = l > STICK * .8; } }
    if (W.frozen) ix = iy = 0;
    if (ORBIT) { orbit.right(oR); orbit.forward(oF); } // the angle on screen right now (mid-turn too), so a turn never knocks you sideways
    const mv = v3.set(0, 0, 0).addScaledVector(ORBIT ? oR : RIGHT, ix).addScaledVector(ORBIT ? oF : UP, iy);
    const moving = mv.lengthSq() > .01;
    if (moving) oMove.copy(mv).normalize();
    const loop = moving ? (keys.ShiftLeft || keys.ShiftRight || farDrag ? 'run' : 'walk') : 'idle';
    if ((!['dance', 'sit'].includes(pa.loop) || moving) && loop !== pa.loop) pa.setLoop(loop); // dancing / sitting last until you move; setLoop() drops any one-shot, so only on a real change
    if (moving && pa.speed > 0) {
      mv.normalize();
      player.g.position.addScaledVector(mv, pa.speed * dt); collide(player.g.position);
      const want = Math.atan2(mv.x, mv.z); let d = want - player.g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
      player.g.rotation.y += d * Math.min(1, dt * 12);
    }
    player.g.position.y = ground(player.g.position.x, player.g.position.z) + W.lift; // lift: a zone raising you (up a tree …)

    // npcs in W.idlers do a little something now and then; zone code drives everyone else
    for (const c of W.idlers) { c.idleT -= dt; if (c.idleT < 0 && !c.anim.one) { const kid = c.ch.opts.age === 'kid'; c.anim.play(pick(kid ? ['jump', 'jump', 'wave'] : ['wave', 'jump', 'wave'])); c.idleT = kid ? 1.5 + rnd() * 2 : 5 + rnd() * 8; } }
    const near = c => { if (c === player) return true; const p = c.g.parent === scene ? c.g.position : c.g.getWorldPosition(v3); return Math.abs(p.x - camTarget.x) + Math.abs(p.z - camTarget.z) < LOD; }; // far off-screen: skip the animation work
    for (const c of pets) if (near(c)) updatePet(c, dt);
    for (const f of ticks) f(dt, T);
    if (occluders.length) fadeOccluders(dt);
    // people off screen: no animation, and their whole body is skipped by the renderer and the matrix update (a big crowd stays cheap)
    for (const c of chars) {
      c.cool -= dt;
      let on = c === player;
      if (!on && c.g.visible) { ndc.copy(c.g.parent === scene ? c.g.position : c.g.getWorldPosition(v3)).project(cam); on = ndc.x > -1.2 && ndc.x < 1.2 && ndc.y > -1.3 && ndc.y < 1.5; }
      if (on !== c.on) { c.on = on; c.ch.body.visible = c.ch.blob.visible = on; c.ch.body.matrixWorldAutoUpdate = on; if (!on) { c.ch.bucket.visible = false; if (c.ch.hang) c.ch.hang.visible = false; } }
      if (on) c.anim.update(dt); else c.anim.skip(dt);
    }

    // drops: only the live ones; hit-test only people near the camera
    const hitList = []; if (live.length) for (const c of [...chars, ...pets]) if (!c.dry && c.g.visible && (c.on ?? near(c))) { c.wp = c.g.getWorldPosition(c.wp || new THREE.Vector3()); c.hr = .3 * c.g.scale.x + .06; c.hh = 1.45 * c.g.scale.x; hitList.push(c); }
    sprayBudget = 45; let n = 0;
    for (let i = 0; i < live.length; i++) {
      const d = live[i];
      d.life -= dt; d.v.y += GRAV * dt; d.p.addScaledVector(d.v, dt);
      let dead = d.life <= 0;
      if (!dead && d.p.y < .1) { if (rnd() < (d.spray ? .05 : .18)) { const r = ringD[ri = (ri + 1) % NR]; r.x = d.p.x; r.z = d.p.z; r.t = 0; } dead = true; }
      if (!dead && !d.spray) for (const c of hitList) {
        if (c.g === d.own || Math.abs(d.p.x - c.wp.x) > c.hr || Math.abs(d.p.z - c.wp.z) > c.hr || d.p.y > c.wp.y + c.hh || d.p.y < c.wp.y) continue;
        dead = true; burst(d);
        if (c.cool <= 0) {
          c.cool = 2.5; W.onFx?.('hit', d.p);
          if (c.hit) c.hit(d);
          else {
            c.anim.soak(.6); // splashed! soaked (>_<), then shake it off, jump or cheer
            const r = c === player ? 'shake' : pick(['jump', 'shake', 'wave']);
            if (!c.anim.one || c.anim.one === 'jump') { c.anim.play(r); if (c === player || rnd() < .6) c.anim.emote({ shake: 'drop', jump: 'bang', wave: 'heart' }[r]); }
            c.onSplash?.(d);
          }
        } else if (c !== player && c.ch.wet !== undefined) c.ch.wet = Math.min(1, c.ch.wet + .02); // a stream keeps soaking them
        break;
      }
      if (dead) { d.life = 0; free.push(d); continue; }
      live[n] = d; water.setMatrixAt(n++, tmp.compose(d.p, q, sc.setScalar(d.s)));
    }
    live.length = n; water.count = n; water.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < NR; i++) {
      const r = ringD[i]; r.t += dt; const s = r.t < .5 ? 1 + r.t * 5 : 0;
      rings.setMatrixAt(i, tmp.compose(v3.set(r.x, .09, r.z), flat, sc.setScalar(s)));
    }
    rings.instanceMatrix.needsUpdate = true;

    // petals
    if (petals) {
      for (let i = 0; i < pet.length; i++) {
        const p = pet[i]; p.s += dt;
        p.p.y -= dt * .45; p.p.x += Math.sin(p.s * 1.7) * dt * .35; p.p.z += Math.cos(p.s * 1.3) * dt * .25;
        if (p.p.y < .08) { p.p.y = .08; if (p.s > 30) { p.p.copy(flowerSpots[(rnd() * flowerSpots.length) | 0]); p.s = 0; } }
        q.setFromEuler(new THREE.Euler(p.p.y > .1 ? p.s * 2 : -Math.PI / 2, p.s, 0));
        petals.setMatrixAt(i, tmp.compose(p.p, q, sc.setScalar(1)));
      }
      petals.instanceMatrix.needsUpdate = true; q.identity();
    }

    // camera follow (soft, clamped so the island edge stays in view)
    v3.copy(player.g.position); v3.y = 0;
    if (W.camFocus) v3.lerp(W.camFocus, .5).setY(0); // something to watch (a cat deciding whether to trust you): frame you both
    if (camBounds) { v3.x = THREE.MathUtils.clamp(v3.x, camBounds.x0, camBounds.x1); v3.z = THREE.MathUtils.clamp(v3.z, camBounds.z0, camBounds.z1); }
    else { v3.x = THREE.MathUtils.clamp(v3.x * .6, -camClamp, camClamp); v3.z = THREE.MathUtils.clamp(v3.z * .6, -camClamp, camClamp); }
    if (ORBIT) {
      orbit.context('talk', !!(W.frozen && W.talkWith), W.talkWith?.g.getWorldPosition(new THREE.Vector3())); // a conversation: frame the two of you (main.js talk() sets W.talkWith)
      v3.y = ground(v3.x, v3.z) + .5 + W.lift; orbit.update(dt, v3, moving && !W.frozen ? { dir: oMove, kind: pa.loop === 'run' ? 'run' : 'walk' } : null); camTarget.copy(orbit.state.target).setY(0);
    } // only the target is clamped to camBounds, never the camera: turning at the edge doesn't jump
    else { camTarget.lerp(v3, Math.min(1, dt * 3)); cam.position.copy(camTarget).add(ISO); cam.lookAt(camTarget); }
    sun.position.copy(camTarget).add(SUN); sun.target.position.copy(camTarget);
    if (sky) sky.follow(cam.position);
    look.uniforms.time.value = T % 100;
    if (ORBIT) { const el = Math.asin(THREE.MathUtils.clamp((cam.position.y - orbit.state.target.y) / Math.max(.01, cam.position.distanceTo(orbit.state.target)), -1, 1));
      look.uniforms.blur.value = blurBase * THREE.MathUtils.smoothstep(el, .3, .5); } // a low camera looks along the ground: the screen-space blur would smear the near things and the horizon together, so it fades out (T2 review)
    cam.updateMatrixWorld(); fv.copy(player.g.position); fv.y += .8; fv.project(cam); // where you are on screen: the focus follows you
    look.uniforms.focus.value.lerp(fv2.set(fv.x * .5 + .5, fv.y * .5 + .5), Math.min(1, dt * 6));
    if (PHONE && (++shadowTick & 1)) renderer.shadowMap.needsUpdate = true; // phones: shadows redrawn every other frame (the lookup follows the map, so nothing swims)
    composer.render(); placeBubbles();
  }
  const ticks = [];
  // ?tune (CAMERA.md §၈): the camera's numbers live; 「JSON」 copies them so they can go back into the doc
  async function tunePanel() {
    try {
      const { GUI } = await import('https://cdn.jsdelivr.net/npm/lil-gui@0.19.2/dist/lil-gui.esm.min.js');
      const gui = new GUI({ title: 'ကင်မရာ (?tune)' }), t = orbit.tune;
      const f1 = gui.addFolder('follow'); f1.add(t, 'followK', .5, 10, .1); f1.add(t, 'azK', 1, 20, .5); f1.add(t, 'distOutK', .3, 8, .1); f1.add(t, 'distInK', .3, 8, .1);
      const f2 = gui.addFolder('zoom (dist)'); f2.add(t, 'base', 6, 20, .5); for (const k of ['run', 'ride', 'war', 'talk']) f2.add(t, k, -8, 8, .5); f2.add(t, 'room', 3, 12, .5);
      const f3 = gui.addFolder('look-ahead'); f3.add(t, 'lookWalk', 0, 4, .1); f3.add(t, 'lookRun', 0, 5, .1); f3.add(t, 'lookRide', 0, 6, .1); f3.add(t, 'lookK', .1, 3, .05);
      const f4 = gui.addFolder('elevation · fade'); f4.add(t, 'elevMin', .05, .6, .01); f4.add(t, 'elevMax', .4, 1.4, .01); f4.add(t, 'fade', 0, 1, .05); f4.add(t, 'autoRotate');
      gui.add({ JSON: () => { const j = JSON.stringify(t); console.log('camera tune', j); navigator.clipboard?.writeText(j).catch(() => {}); } }, 'JSON');
    } catch (e) { console.warn('?tune: lil-gui did not load', e.message); }
  }
  function start() { // call once the zone has built its set: flowers + petals need the trees
    bake();
    if (flowerSpots.length) {
      const fl = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.09, 0), M(PAL.padauk), flowerSpots.length);
      flowerSpots.forEach((p, i) => fl.setMatrixAt(i, new THREE.Matrix4().setPosition(p)));
      fl.castShadow = false; scene.add(fl);
      petals = new THREE.InstancedMesh(new THREE.PlaneGeometry(.11, .07), new THREE.MeshLambertMaterial({ color: PAL.padauk, side: THREE.DoubleSide }), 70);
      pet = Array.from({ length: 70 }, () => ({ p: flowerSpots[(rnd() * flowerSpots.length) | 0].clone().add(new THREE.Vector3(0, -rnd() * 2, 0)), s: rnd() * 6 }));
      scene.add(petals);
    }
    addEventListener('resize', resize); resize();
    addEventListener('wheel', e => zoom(1 + Math.sign(e.deltaY) * .1), { passive: true });
    snapCam();
    if (ORBIT && P.has('tune')) tunePanel(); // ?tune: lil-gui for the camera numbers (docs/CAMERA.md §၈)
    renderer.setAnimationLoop(frame);
  }

  // bake: merge every static mesh into one mesh per material, so a big map is a few dozen draw calls instead of thousands.
  // Static = made with mesh()/box()/cyl() and not under anything marked keep(); call keep(obj) on what moves or changes later.
  const keep = o => { o.userData.keep = true; return o; };
  // tall things you can walk behind (flats, shop-houses, the kyaung …): build() makes one; its meshes get their own materials,
  // so it can fade to see-through whenever it stands between the camera and you. Still baked like everything else.
  const RAY = new THREE.Ray(), ISOdir = ISO.clone().normalize(), rayHit = new THREE.Vector3();
  const between = box => { // is the box between RAY.origin and the camera?
    if (!ORBIT) { RAY.direction.copy(ISOdir); return RAY.intersectsBox(box); }
    RAY.direction.copy(cam.position).sub(RAY.origin); const d = RAY.direction.length(); RAY.direction.divideScalar(d);
    return !!RAY.intersectBox(box, rayHit) && rayHit.distanceTo(RAY.origin) < d;
  };
  function occluder(build) {
    const n0 = statics.length, r = build(), own = new Map(), box = new THREE.Box3();
    scene.updateMatrixWorld(true);
    for (const m of statics.slice(n0)) {
      if (Array.isArray(m.material)) continue;
      let c = own.get(m.material);
      if (!c) { c = m.material.clone(); c.transparent = true; c.userData.base = m.material; own.set(m.material, c); }
      m.material = c; box.expandByObject(m);
    }
    occluders.push({ box, mats: [...own.values()], a: 1 }); return r;
  }
  function fadeOccluders(dt) {
    const p = W.player.g.position, w = W.watch; // watch: something else you need to see (a cat up on a roof)
    for (const o of occluders) {
      let hit = false; for (const y of [.25, 1.1]) { RAY.origin.set(p.x, p.y + y, p.z); if (between(o.box)) { hit = true; break; } }
      if (!hit && w) { RAY.origin.set(w.x, w.y + .3, w.z); hit = between(o.box); }
      const want = hit ? (orbit?.tune.fade ?? .2) : 1; if (o.a === want) continue;
      o.a += (want - o.a) * Math.min(1, dt * 7); if (Math.abs(o.a - want) < .01) o.a = want;
      for (const c of o.mats) { c.opacity = o.a; c.depthWrite = o.a > .95; }
    }
  }
  // hero buildings (T2): build() puts up a code-built stand-in at once; the Blender .glb (art/buildings.py) replaces it when it
  // arrives — never awaited, so the town opens as fast as before. Both fade like an occluder. place = where the .glb origin goes.
  const gltf = new GLTFLoader();
  function hero(url, { x = 0, z = 0, ry = 0 } = {}, build) {
    const before = new Set(scene.children), n0 = statics.length;
    const r = build();
    const added = scene.children.filter(c => !before.has(c)); statics.splice(n0); // the stand-in stays as it is (not baked) until the swap
    for (const c of added) keep(c);
    const occ = { box: new THREE.Box3(), mats: [], a: 1 }, own = new Map(); occluders.push(occ);
    scene.updateMatrixWorld(true);
    for (const c of added) c.traverse(m => {
      if (!m.isMesh || Array.isArray(m.material)) return;
      let k = own.get(m.material); if (!k) { k = m.material.clone(); k.transparent = true; k.userData.base = m.material; own.set(m.material, k); }
      m.material = k; occ.box.expandByObject(m);
    });
    occ.mats = [...own.values()];
    gltf.loadAsync(url).then(g => {
      const s = g.scene, mats = new Map(), win = M(PAL.window); s.position.set(x, 0, z); s.rotation.y = ry;
      s.traverse(m => {
        if (!m.isMesh) return;
        const src = m.material; let k = mats.get(src);
        if (!k) { // Blender gives PBR; the town is flat-shaded Lambert — and a 'window' keeps the town's window colour so it glows at dusk
          k = new THREE.MeshLambertMaterial({ color: src.name === 'window' ? win.color : src.color, map: src.map, flatShading: !src.map, side: src.side, transparent: true });
          k.userData.base = src.name === 'window' ? win : k.clone(); mats.set(src, k);
        }
        m.material = k; m.castShadow = m.receiveShadow = true;
      });
      for (const c of added) c.removeFromParent();
      scene.add(s); s.updateMatrixWorld(true); occ.box.setFromObject(s); occ.mats = [...mats.values()];
      for (const k of occ.mats) { if (k.userData.base.emissive) k.emissive.copy(k.userData.base.emissive); k.opacity = occ.a; k.depthWrite = occ.a > .95; }
      W.onHero?.(url, s);
    }).catch(e => console.warn('hero: keeping the stand-in for', url, e.message));
    return r;
  }
  function bake() {
    scene.updateMatrixWorld(true);
    const kept = o => { for (let p = o; p; p = p.parent) if (p.userData.keep) return true; return false; };
    const groups = new Map(), ctr = new THREE.Vector3();
    // plain flat colours (most of the town) merge across colours as vertex colours, in 8-unit squares so the ones off screen
    // are still skipped; a see-through building stays its own set so it can fade. Anything that changes later (glowing
    // windows, fading roofs, textures) merges by material as before.
    const owner = new Map(); occluders.forEach((o, i) => o.mats.forEach(c => owner.set(c, i)));
    const win = M(PAL.window), vcMats = {};
    const plain = mt => mt.isMeshLambertMaterial && !mt.map && !mt.emissiveMap && !mt.vertexColors && !mt.emissive.getHex() && mt !== win && mt.userData.base !== win
      && (!mt.transparent || owner.has(mt));
    for (const m of statics) {
      if (!m.parent || kept(m) || Array.isArray(m.material) || !m.visible) continue;
      let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
      if (!g.attributes.normal) g.computeVertexNormals();
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      g.clearGroups(); g.applyMatrix4(m.matrixWorld);
      const mt = m.material, flags = (m.castShadow ? 'c' : '') + (m.receiveShadow ? 'r' : '');
      let key = mt.uuid + flags;
      if (plain(mt)) {
        const o = owner.get(mt); m.getWorldPosition(ctr);
        key = `vc${mt.flatShading ? 'f' : ''}${mt.side}${flags}|` + (o ?? `${Math.floor(ctr.x / 8)},${Math.floor(ctr.z / 8)}`);
        const fam = `${mt.flatShading}${mt.side}` + (o ?? '');
        const vm = vcMats[fam] ??= new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: mt.flatShading, side: mt.side, transparent: o !== undefined });
        if (o !== undefined && !occluders[o].mats.includes(vm)) { vm.userData.base = {}; occluders[o].mats.push(vm); }
        const n = g.attributes.position.count, col = new Float32Array(n * 3); for (let i = 0; i < n; i++) mt.color.toArray(col, i * 3);
        g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        groups.set(key, groups.get(key) ?? { mat: vm, cast: m.castShadow, recv: m.receiveShadow, geos: [] });
      }
      if (!groups.has(key)) groups.set(key, { mat: mt, cast: m.castShadow, recv: m.receiveShadow, geos: [] });
      groups.get(key).geos.push(g); m.parent.remove(m);
    }
    for (const { mat, cast, recv, geos } of groups.values()) {
      const merged = new THREE.Mesh(mergeGeometries(geos), mat); merged.castShadow = cast; merged.receiveShadow = recv; scene.add(merged);
    }
    statics.length = 0;
  }
  // rooms: a shop interior built off the island swaps in its own walls, floor and camera box; null goes back outside
  const outside = { B, ground, camBounds, bg: null };
  function setRoom(r) { // r: { bounds, ground, camBounds, background, view }; the camera jumps straight there
    if (!r) { B = outside.B; ground = outside.ground; camBounds = outside.camBounds; scene.background = sky ? null : skyT; if (sky) { sky.visible = true; scene.fog = outside.fog ?? scene.fog; } if (town) town.group.visible = true; if (outside.view) { VIEW = outside.view; outside.view = null; fitCam(); } if (ORBIT) orbit.context('room', false); }
    else { B = r.bounds; ground = r.ground; camBounds = r.camBounds; scene.background = new THREE.Color(r.background || '#3a2a3e'); if (sky) { sky.visible = false; outside.fog ??= scene.fog; scene.fog = null; } if (town) town.group.visible = false; if (r.view) { outside.view ??= VIEW; VIEW = r.view; fitCam(); }
      if (ORBIT) orbit.context('room', true, { az: r.az ?? 0 }); } // inside a shop: a cut to a fixed, closer view (three walls are built, so no turning)
    W.ground = ground; W.bounds = B;
    W.player.g.position.y = ground(W.player.g.position.x, W.player.g.position.z);
  }
  function zoom(k) { if (ORBIT) return orbit.zoom(k); VIEW = THREE.MathUtils.clamp(VIEW * k, 7, 28); fitCam(); } // iso: only changes the projection
  const snapCam = () => { camTarget.copy(W.player.g.position).setY(0); if (camBounds) { camTarget.x = THREE.MathUtils.clamp(camTarget.x, camBounds.x0, camBounds.x1); camTarget.z = THREE.MathUtils.clamp(camTarget.z, camBounds.z0, camBounds.z1); } if (ORBIT) orbit.snap(v3.copy(camTarget).setY(ground(camTarget.x, camTarget.z) + .5 + W.lift)); };
  const removeChar = c => { scene.remove(c.g); for (const list of [chars, W.idlers]) { const i = list.indexOf(c); if (i >= 0) list.splice(i, 1); } };

  const W = { THREE, scene, cam, renderer, orbit, sky, half, bounds: B, rnd, pick, M, mesh, box, cyl, textTex, stripeTex, bubbleTex, solids, solid, collide, ground,
    padauk, flowerSpots, sag, bean, chars, swapTool, quality: () => AQ.lvl, setGfx, speak, setPlayer, player: null, idlers: [], addPet, pets, spawn, splash, keys, act,
    onAction: null, frozen: false, paused: false, camFocus: null, watch: null, lift: 0, tick: f => ticks.push(f), start, time: () => T, setTime, dusk: () => dusk, night: () => night, keep, occluder, hero, bake, removeChar, offLimits: null, setRoom, snapCam };
  return W;
}
