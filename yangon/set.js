// yangon/set.js — the day-1 Yangon neighbourhood as one walkable map (STORY.md §၄):
//   ① home lane (walk-up flats, timber home, the empty lot)   ② the main street: shops below, flats above (tea shop, barber, tailor …)
//   ③ the ward market: vendors on mats along two lanes, sheds   ④ the ward monastery            + compounds, a chinlone lot, a condo going up
// Everything here is scenery: it is baked into a few meshes at start (world.bake). People and errands live in story.js.
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PAL } from '../world.js?v=4';

export const MM = n => String(n).replace(/\d/g, d => '၀၁၂၃၄၅၆၇၈၉'[d]);
export const BOUNDS = { x0: -10, x1: 34, z0: -10, z1: 29.2 };

// ② the main street: two lanes each way (drive on the right), a row of white blocks down the middle, broken only where
// it meets the side lane and the market street — the zebra crossings are there
export const ROAD = { z0: 6.6, z1: 12.2, mid: 9.4, west: [7.25, 8.55], east: [10.25, 11.55] }; // lane centres: westbound kerb/inner, eastbound inner/kerb
export const CROSSINGS = [-3.4, 13.0];

// walk heights: asphalt .045, raised sidewalks .14, concrete lanes .05, everything else .01 (first match wins)
const RECTS = [
  { x0: -10, x1: 34, z0: 6.6, z1: 12.2, h: .045, c: PAL.road },       // ② main street: two lanes each way, a line of white blocks down the middle
  { x0: -10, x1: 34, z0: 5.8, z1: 6.6, h: .14, c: PAL.walk },          // its north sidewalk
  { x0: 10.6, x1: 34, z0: 4.4, z1: 5.8, h: .14, c: PAL.walk },         // the shop fronts' apron
  { x0: -10, x1: 34, z0: 12.2, z1: 13.0, h: .14, c: PAL.walk },        // south sidewalk
  { x0: 11.8, x1: 14.2, z0: 13.0, z1: 29.2, h: .045, c: PAL.road },   // market street (cross street)
  { x0: -4.6, x1: 10.6, z0: -3.4, z1: -1.4, h: .05, c: '#cdc2b6' },    // ① back lane along the flats
  { x0: -4.6, x1: -2.6, z0: -3.4, z1: 5.8, h: .05, c: '#cdc2b6' },     // ① side lane out to the street
  { x0: 9.0, x1: 10.6, z0: -9.6, z1: -1.4, h: .05, c: '#cdc2b6' },     // east lane past the compounds
  { x0: 10.6, x1: 34, z0: -2.2, z1: -.4, h: .05, c: '#cdc2b6' },       // back lane behind the shops
  { x0: -9.6, x1: 11.8, z0: 16.0, z1: 17.8, h: .05, c: '#bdb2a6' },    // ③ market lane 1
  { x0: -9.6, x1: 11.8, z0: 22.6, z1: 24.4, h: .05, c: '#bdb2a6' },    // ③ market lane 2
  { x0: -9.5, x1: 9.9, z0: 18.8, z1: 21.8, h: .06, c: '#cfc8bc' },      // ③ concrete floor of market shed 1 (walk in)
  { x0: -9.5, x1: 9.9, z0: 25.6, z1: 28.8, h: .06, c: '#cfc8bc' },      // ③ …and shed 2
];
export const ground = (x, z) => { for (const r of RECTS) if (x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1) return r.h; return .01; };
export const AREAS = [ // for the minimap and the "you are here" toast
  { id: 1, short: '①', name: '① အိမ်နဲ့ လမ်းကြား', x0: -10, x1: 10.6, z0: -10, z1: 5.8, c: '#f4c9a8' },
  { id: 2, short: '', name: '② ရပ်ကွက်လမ်းမ', x0: -10, x1: 34, z0: 5.8, z1: 13.0, c: '#c9b6d6' },
  { id: 2, short: '②', name: '② ရပ်ကွက်လမ်းမ', x0: 10.6, x1: 34, z0: 0, z1: 5.8, c: '#e9c8d8' },
  { id: 6, short: '', name: 'ခြံဝင်းတွေ · ခြင်းလုံးကွင်း', x0: 10.6, x1: 34, z0: -10, z1: 0, c: '#d8d0a0' },
  { id: 3, short: '③', name: '③ ဈေး', x0: -10, x1: 11.8, z0: 13.0, z1: 29.2, c: '#f2d39a' },
  { id: 4, short: '④', name: '④ ဘုန်းကြီးကျောင်း', x0: 14.2, x1: 34, z0: 13.0, z1: 29.2, c: '#f6e7b8' },
  { id: 3, short: '', name: '③ ဈေးလမ်း', x0: 11.8, x1: 14.2, z0: 13.0, z1: 29.2, c: '#b8a8c8' },
];
export const areaAt = (x, z) => AREAS.find(a => x > a.x0 && x < a.x1 && z > a.z0 && z < a.z1);

// the Shwedagon far off below the island, over a hazy low city: you can always see which way home is.
// The sky is screen space, so it sits low-left where the island never covers it at any zoom; at dusk it is floodlit.
export function shwedagon(g, Wd, H, dusk = 0) {
  const base = H * .9, cx = Math.max(Wd * .1, 70), s = H * .0024;
  for (let x = 0, i = 0; x < cx * 2.6; x += 9 + (i * 37 % 15), i++) { // low city
    const h = 6 + (i * 53 % 17) * (1 - Math.abs(x - cx) / (cx * 2.8)), gr = g.createLinearGradient(0, base - h, 0, base + 20);
    gr.addColorStop(0, 'rgba(150,128,190,.38)'); gr.addColorStop(1, 'rgba(150,128,190,0)'); g.fillStyle = gr; g.fillRect(x, base - h, 8 + (i * 17 % 7), h + 20);
  }
  const hill = g.createRadialGradient(cx, base, 0, cx, base, 60 * s); hill.addColorStop(0, 'rgba(140,118,186,.55)'); hill.addColorStop(1, 'rgba(140,118,186,0)');
  g.fillStyle = hill; g.beginPath(); g.ellipse(cx, base, 60 * s, 14 * s, 0, Math.PI, 0); g.fill();  // Singuttara hill
  const gold = g.createLinearGradient(cx - 30 * s, 0, cx + 30 * s, 0); gold.addColorStop(0, '#e0a83f'); gold.addColorStop(.45, '#ffe39a'); gold.addColorStop(1, '#c98a2e');
  g.fillStyle = gold;
  const tier = (w, y, h) => g.fillRect(cx - w * s, base - y * s, w * 2 * s, h * s);
  tier(34, 8, 4); tier(28, 12, 4); tier(23, 16, 4); // terraces
  g.beginPath(); g.moveTo(cx - 20 * s, base - 15 * s); g.quadraticCurveTo(cx - 19 * s, base - 40 * s, cx, base - 44 * s); // bell
  g.quadraticCurveTo(cx + 19 * s, base - 40 * s, cx + 20 * s, base - 15 * s); g.fill();
  g.beginPath(); g.moveTo(cx - 9 * s, base - 42 * s); g.lineTo(cx, base - 92 * s); g.lineTo(cx + 9 * s, base - 42 * s); g.fill(); // spire
  for (const [w, y] of [[10, 46], [8.5, 52], [7, 58]]) tier(w, y, 2.2); // banana-bud rings
  g.fillStyle = 'rgba(255,248,220,.95)'; g.beginPath(); g.arc(cx, base - 93 * s, 1.6 * s, 0, 7); g.fill();
  const glow = g.createRadialGradient(cx, base - 50 * s, 0, cx, base - 50 * s, 70 * s); glow.addColorStop(0, `rgba(255,226,150,${.3 + dusk * .45})`); glow.addColorStop(1, 'rgba(255,226,150,0)');
  g.fillStyle = glow; g.fillRect(cx - 70 * s, base - 120 * s, 140 * s, 140 * s);
}

// a coconut frond (အုန်းလက်): a curved midrib with leaflets down both sides, one geometry, built along +x, length 1
let frondCache = null;
export function frondGeo(THREE) {
  if (frondCache) return frondCache;
  const parts = [], n = 16;
  const rib = new THREE.CylinderGeometry(.012, .02, 1, 4); rib.rotateZ(Math.PI / 2); rib.translate(.5, 0, 0); parts.push(rib.toNonIndexed());
  for (let i = 1; i < n; i++) {
    const t = i / n, len = .28 * Math.sin(t * Math.PI) + .06;
    for (const s of [-1, 1]) {
      const leaf = new THREE.PlaneGeometry(len, .06); leaf.translate(len / 2, 0, 0);
      leaf.rotateX(Math.PI / 2); leaf.rotateY(s * (Math.PI / 2 - .55)); leaf.rotateZ(-.35); leaf.translate(t, -t * t * .12, 0);
      parts.push(leaf.toNonIndexed());
    }
  }
  return frondCache = mergeGeometries(parts);
}

export function buildSet(W) {
  const { THREE, scene, M, mesh, box, cyl, textTex, stripeTex, solid, padauk, sag, rnd, pick } = W;
  const B = BOUNDS, sx = B.x1 - B.x0, sz = B.z1 - B.z0, cx = (B.x0 + B.x1) / 2, cz = (B.z0 + B.z1) / 2;
  const L = {}; // landmarks story.js needs

  // ---------- island + ground ----------
  box(sx, 1.4, sz, PAL.soil, cx, -1.4, cz);
  box(sx - .6, .5, sz - .6, PAL.soilDark, cx, -1.9, cz, { cast: false });
  box(sx - .02, .06, sz - .02, PAL.grass, cx, -0.05, cz, { cast: false });
  for (const r of [...RECTS].reverse()) box(r.x1 - r.x0, r.h, r.z1 - r.z0, r.c, (r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2, { cast: false });
  for (const lz of [7.9, 10.9]) for (let x = B.x0 + .6; x < B.x1; x += 1.4) if (!CROSSINGS.some(c => Math.abs(x - c) < 1.3)) box(.7, .05, .1, PAL.roadLine, x, 0, lz, { cast: false }); // lane lines
  for (let z = 13.6; z < B.z1; z += 1.4) box(.1, .05, .7, PAL.roadLine, 13, 0, z, { cast: false });
  for (const cx of CROSSINGS) for (let z = ROAD.z0 + .35; z < ROAD.z1 - .2; z += .55) if (Math.abs(z - ROAD.mid) > .35) box(2.0, .05, .3, '#f3f1ea', cx, 0, z, { cast: false }); // zebra (မြင်းကျား)
  { // the median: short white concrete blocks with gaps between, one solid strip per run so you cross at the zebras
    const gap = 1.3, runs = []; let a = B.x0;
    for (const cx of CROSSINGS) { runs.push([a, cx - gap]); a = cx + gap; } runs.push([a, B.x1]);
    for (const [x0, x1] of runs) { for (let x = x0 + .4; x < x1 - .2; x += .85) box(.6, .26, .3, '#f3f1ea', x, .045, ROAD.mid, { cast: false }); solid((x0 + x1) / 2, ROAD.mid, x1 - x0, .34); }
  }
  box(21.6, .02, 15.8, '#cfae86', .9, 0, 21.1, { cast: false });    // ③ market: packed earth
  box(10.4, .02, 10.6, '#e9dcc8', 20.3, 0, 19.4, { cast: false });  // ④ monastery yard: swept earth, pale
  for (let x = -4.4; x < 10.4; x += .62) box(.56, .07, .3, '#9d9198', x, 0, -3.58, { cast: false });       // drain slabs (ရေမြောင်း) along the flats
  for (let z = -3.1; z < 5.5; z += .62) box(.3, .07, .56, '#9d9198', -4.78, 0, z, { cast: false });
  for (const [x, z, r] of [[-3.6, -2.2, .45], [6.2, -2.6, .5], [-3.4, 3.2, .4], [4, 18.0, .5], [-5, 21.9, .45], [9.8, -6, .4], [20, 11.4, .5]]) {
    const p = mesh(new THREE.CircleGeometry(r, 14), new THREE.MeshLambertMaterial({ color: PAL.puddle, transparent: true, opacity: .8 }), x, .08, z, { cast: false }); p.rotation.x = -Math.PI / 2;
  }

  // ---------- ① walk-up flats (တိုက်ခန်း) ----------
  // 4 floors of 2.6-wide units round an open stairwell; every balcony gets its own clutter: laundry, pots, a dish, an aircon box.
  const FH = 1.25;
  const grille = new THREE.MeshLambertMaterial({ map: stripeTex('#4f7a68', '#27453c', 10) });
  const stain = new THREE.MeshBasicMaterial({ color: '#3b2a3a', transparent: true, opacity: .1, depthWrite: false });
  const flats = (...a) => W.occluder(() => flats0(...a)); // tall: see-through when you walk behind it
  function flats0(fx, fz, units, rotY, wall, no) {
    const g = new THREE.Group(); g.position.set(fx, 0, fz); g.rotation.y = rotY; scene.add(g);
    const UW = 2.6, Wd = units * UW, D = 3, H = 4 * FH, o = { parent: g }, stair = units >> 1, balconies = [];
    box(Wd, H, D, wall, 0, .14, 0, o);
    box(Wd + .2, .18, D + .2, PAL.frame, 0, H + .14, 0, o);
    for (let u = 0; u < units; u++) {
      const ux = -Wd / 2 + UW * (u + .5);
      for (const tx of [-.6, .5]) if (rnd() < .8) cyl(.32, .32, .62, pick(['#2b2730', '#2b2730', '#3f6fa8']), ux + tx, H + .14, -.3 + rnd() * .6, 10, o); // black water tanks
      if (rnd() < .5) { cyl(.015, .015, 1.1, '#8f8794', ux + .9, H + .14, .9, 4, o); box(.6, .03, .03, '#8f8794', ux + .9, H + 1.1, .9, o); } // TV aerial
      if (u === stair) { // open stairwell: dark slot, the landings showing
        box(1.2, H - .2, .06, '#4a3f52', ux, .14, D / 2, o);
        for (let f = 0; f < 4; f++) box(1.2, .1, .34, PAL.frame, ux, .14 + f * FH + .6, D / 2 + .1, o);
        mesh(new THREE.PlaneGeometry(.6, .3), new THREE.MeshLambertMaterial({ map: textTex('တိုက် ' + MM(no), PAL.frame, '#5a3550', 160, 80, 40) }), ux + .95, 1.3, D / 2 + .04, { ...o, cast: false });
        continue;
      }
      mesh(new THREE.BoxGeometry(.95, 1.05, .05), grille, ux - .45, .66, D / 2 + .02, o);  // ground floor: grille door + barred window
      box(.7, .55, .05, PAL.window, ux + .55, .6, D / 2, o); mesh(new THREE.BoxGeometry(.72, .57, .04), grille, ux + .55, .9, D / 2 + .04, o);
      for (let f = 1; f < 4; f++) {
        const y = .14 + f * FH;
        box(.62, .95, .06, '#6b5a7a', ux - .5, y + .05, D / 2, o);
        box(.5, .55, .06, PAL.frame, ux + .55, y + .38, D / 2, o); box(.4, .45, .08, PAL.window, ux + .55, y + .43, D / 2, o);
        box(UW - .3, .08, .55, PAL.frame, ux, y, D / 2 + .27, o);
        box(UW - .3, .36, .06, wall, ux, y + .08, D / 2 + .52, o);
        box(UW - .26, .05, .1, PAL.frame, ux, y + .44, D / 2 + .52, o);
        mesh(new THREE.PlaneGeometry(.5, .9), stain, ux + (rnd() - .5) * 1.4, y - .45, D / 2 + .005, { ...o, cast: false });
        const r = rnd();
        if (r < .45) { // laundry line: longyi, a shirt, a towel
          box(UW - .4, .015, .015, '#efe3c8', ux, y + .92, D / 2 + .4, o);
          let x = ux - .95;
          for (let k = 0; k < 3 + (rnd() * 2 | 0); k++) { const w = .2 + rnd() * .22, h = .3 + rnd() * .35, cl = pick(['#a8434a', '#4a5aa8', '#f2c14e', '#fff6ea', '#3f7a5a', '#e9a0b4', '#7a4a9a']);
            box(w, h, .02, cl, x + w / 2, y + .92 - h, D / 2 + .4, { ...o, cast: false }); x += w + .07; }
        } else if (r < .7) for (const px of [-.8, -.45, .7]) { cyl(.09, .07, .14, '#c0683f', ux + px, y + .44, D / 2 + .52, 8, o); mesh(new THREE.IcosahedronGeometry(.15, 0), PAL.leafLight, ux + px, y + .68, D / 2 + .52, o); }
        if (rnd() < .3) { const d = mesh(new THREE.SphereGeometry(.22, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#e9e6ea', ux + 1.05, y + 1.05, D / 2 + .25, o); d.rotation.x = 1.2; } // satellite dish
        else if (rnd() < .35) box(.45, .3, .25, '#e9e6ea', ux + 1.0, y + .8, D / 2 + .15, o); // aircon box
        balconies.push({ u, f, at: (dx = 0, dy = 0, dz = 0) => g.localToWorld(new THREE.Vector3(ux + dx, y + dy, D / 2 + .27 + dz)) });
      }
    }
    g.updateMatrixWorld();
    const c = Math.abs(Math.cos(rotY)) > .5; solid(fx, fz, c ? Wd : D + .2, c ? D + .2 : Wd);
    return { g, balconies, bal: (u, f) => balconies.find(b => b.u === u && b.f === f) };
  }
  L.flatsA = flats(-3.6, -6.6, 4, 0, '#efdcc0', 32);            // along the back lane
  flats(-7.3, .1, 4, Math.PI / 2, '#cfe3d2', 18);               // along the side lane

  // ---------- ① home: two-storey timber house (ပျဉ်ထောင်အိမ်), zinc roof, porch ----------
  const plank = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#a8744a'; g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#8a5a38'; for (let y = 0; y < 64; y += 8) g.fillRect(0, y, 64, 2); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); t.magFilter = THREE.NearestFilter; return t; })();
  const plankM = new THREE.MeshLambertMaterial({ map: plank });
  const zinc = new THREE.MeshLambertMaterial({ map: stripeTex('#b4bcc4', '#8f99a3', 16), flatShading: true });
  const gable = (x, y, z, len, r, k = .5, mat = zinc) => { const rg = new THREE.CylinderGeometry(r, r, len, 3); rg.rotateX(-Math.PI / 2); rg.rotateY(Math.PI / 2); rg.scale(1, k, 1); return mesh(rg, mat, x, y, z); }; // triangular prism, ridge along x
  W.occluder(() => { // the home house fades when it hides you
    const X = 5.6, Z = -6.5;
    box(5.2, 1.4, 3.2, '#eef1ee', X, .02, Z); box(5.22, .5, 3.22, '#6f9fc8', X, .02, Z, { cast: false });
    mesh(new THREE.BoxGeometry(5.5, 1.3, 3.5), plankM, X, 2.08, Z);
    gable(X, 3.26, Z, 6, 2.1);
    box(1, 1.15, .06, '#6b4a32', X - 1.2, .14, Z + 1.6); box(.9, 1.05, .07, '#3b2a24', X - 1.2, .14, Z + 1.61);
    for (const wx of [.6, 1.8]) { box(.6, .55, .06, '#3b2a24', X + wx, .55, Z + 1.61); for (const s of [-1, 1]) box(.3, .55, .05, '#6f9fc8', X + wx + s * .48, .55, Z + 1.66); }
    for (const wx of [-1.6, 0, 1.6]) { box(.7, .6, .06, '#3b2a24', X + wx, 1.82, Z + 1.76); for (const s of [-1, 1]) box(.34, .6, .05, '#d9b98f', X + wx + s * .53, 1.82, Z + 1.8); }
    box(5.2, .3, .9, '#8a5a3a', X, .02, Z + 2.05); box(1.2, .14, .4, '#8a5a3a', X - 1.2, .02, Z + 2.65);
    box(1.4, .38, .36, '#7a5038', X + 1.4, .3, Z + 1.95); box(1.4, .06, .4, '#a8744a', X + 1.4, .66, Z + 1.95);
    for (const px of [-2.2, -1.8]) { mesh(new THREE.SphereGeometry(.2, 12, 8), M('#b8653d', { flatShading: false }), X + px, .5, Z + 2.2); cyl(.13, .13, .03, '#d9b98f', X + px, .67, Z + 2.2, 10); }
    mesh(new THREE.PlaneGeometry(.9, .3), new THREE.MeshLambertMaterial({ map: textTex('အမှတ် ၁၂', '#fff6ea', '#5a3550', 256, 84, 46) }), X + .2, 1.25, Z + 1.62, { cast: false });
    solid(X, Z, 5.5, 3.5); solid(X, Z + 2.05, 5.2, .9);
  });
  // the empty lot where the kids' mandat goes up
  box(8, .03, 5.4, '#c99a6b', 2.6, 0, 2.1, { cast: false });
  for (let i = 0; i < 26; i++) { const x = -1.2 + rnd() * 7.6, z = -.4 + rnd() * 5; if (Math.hypot(x - 2.6, z - 1.9) > 2) mesh(new THREE.ConeGeometry(.09, .22, 4), pick([PAL.leaf, PAL.leafLight]), x, .12, z, { cast: false }); }
  { const sb = new THREE.Group(); sb.position.set(-.6, .02, .6); sb.rotation.y = Math.PI / 4; scene.add(sb);
    for (const px of [-.45, .45]) cyl(.04, .04, 1.3, '#8a5a3a', px, 0, 0, 5, { parent: sb });
    mesh(new THREE.PlaneGeometry(1.1, .55), new THREE.MeshLambertMaterial({ map: textTex('ကလေးမဏ္ဍပ် ဆောက်မည်', '#fff6ea', '#5a3550', 512, 256, 46) }), 0, 1.0, .03, { parent: sb });
    solid(-.6, .6, .8, .5); }
  L.STAGE = new THREE.Vector3(2.6, 0, 1.9); L.SIGN = new THREE.Vector3(-.6, 0, .6);
  { // charity water-pot stand (ရေအိုးစင်) by the lane
    const X = 8.0, Z = -.6, g = new THREE.Group(); g.position.set(X, .02, Z); g.rotation.y = -Math.PI / 4; scene.add(g);
    for (const px of [-.55, .55]) for (const pz of [-.25, .25]) cyl(.04, .04, 1.25, '#8a5a3a', px, 0, pz, 5, { parent: g });
    box(1.25, .07, .62, '#8a5a3a', 0, .5, 0, { parent: g });
    const roof = mesh(new THREE.CylinderGeometry(0, .85, .45, 4), M('#c8553d'), 0, 1.45, 0, { parent: g }); roof.rotation.y = Math.PI / 4; roof.scale.z = .6;
    for (const px of [-.3, .3]) { mesh(new THREE.SphereGeometry(.24, 12, 8), M('#b8653d', { flatShading: false }), px, .78, 0, { parent: g }); cyl(.13, .13, .03, '#d9b98f', px, 1.04, 0, 10, { parent: g }); }
    solid(X, Z, 1.2, 1.2);
  }
  { // U Ba Tin's door on the side lane: table, transistor radio, the amplifier
    box(.7, .5, .5, '#8a5a3a', -5.25, .02, .2); box(.4, .26, .2, '#3b3440', -5.25, .52, .2); cyl(.06, .06, .02, '#d9b98f', -5.13, .62, .31, 10);
    box(.36, .7, .36, '#26222b', -5.3, .02, -1.55); mesh(new THREE.CircleGeometry(.12, 12), '#4a4452', -5.11, .4, -1.55).rotation.y = Math.PI / 2;
    solid(-5.25, .2, .7, .5); solid(-5.3, -1.55, .4, .4);
  }
  L.CAR = new THREE.Vector3(-3.95, 0, 4.3);
  { // the old car on the side lane (Shwe Wa's roof)
    const g = new THREE.Group(); g.position.copy(L.CAR); scene.add(g); const o = { parent: g };
    box(1.2, .5, 2.7, '#7fb8a8', 0, .25, 0, o); box(1.1, .42, 1.4, '#7fb8a8', 0, .75, -.15, o);
    for (const z of [-.86, .56]) box(1.0, .3, .04, PAL.window, 0, .8, z, o); for (const x of [-.56, .56]) box(.04, .3, 1.2, PAL.window, x, .8, -.15, o);
    box(1.22, .12, .1, '#d9dde3', 0, .3, 1.36, o); box(1.22, .12, .1, '#d9dde3', 0, .3, -1.36, o);
    for (const x of [-.6, .6]) for (const z of [-.85, .85]) { const w = mesh(new THREE.CylinderGeometry(.24, .24, .16, 12), '#2b2730', x, .24, z, o); w.rotation.z = Math.PI / 2; }
    mesh(new THREE.PlaneGeometry(.5, .14), new THREE.MeshLambertMaterial({ map: textTex('ရန်ကုန် ၇က/၁၂၃၄', '#fff6ea', '#2b2730', 256, 72, 34) }), 0, .38, 1.42, { ...o, cast: false });
    solid(L.CAR.x, L.CAR.z, 1.3, 2.8);
  }

  // ---------- ② the main street: Yangon shop-houses — a shop on the ground floor, flats above behind iron-grille balconies ----------
  const grilleTex = (() => { // see-through iron grille (သံဇကာ) for balcony cages and shop shutters
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    g.fillStyle = '#2f4a44'; for (let x = 2; x < 64; x += 8) g.fillRect(x, 0, 3, 64); g.fillRect(0, 0, 64, 4); g.fillRect(0, 30, 64, 3); g.fillRect(0, 60, 64, 4);
    g.strokeStyle = '#2f4a44'; g.lineWidth = 2; for (let x = 6; x < 64; x += 16) { g.beginPath(); g.arc(x, 16, 5, 0, 7); g.stroke(); } // the little scroll each Yangon grille has
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter; return t;
  })();
  const grilleM = (rx, ry) => { const t = grilleTex.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return new THREE.MeshLambertMaterial({ map: t, alphaTest: .5, side: THREE.DoubleSide }); };
  const cage = grilleM(3, 1.5), cageSide = grilleM(1, 1.5);
  const shopFlat = (...a) => W.occluder(() => shopFlat0(...a)); // tall: see-through when you walk behind it
  const shutterM = new THREE.MeshLambertMaterial({ map: (t => (t.center.set(.5, .5), t.rotation = Math.PI / 2, t))(stripeTex('#b4bcc4', '#8f99a3', 14)) }); L.shutters = []; // roller-shutter slats
  function shopFlat0(x, w, floors, wall, sign, signBg, signFg = '#fff6ea', opts = {}) {
    const D = 3.2, Z = 2.8, FH = 1.25, front = Z + D / 2, H = floors * FH;
    box(w, H + .1, D, wall, x, .02, Z); box(w + .2, .25, D + .2, PAL.frame, x, H + .1, Z);
    box(w - .3, 1.05, .06, '#3b3040', x, .14, front);                                          // open shop front (dark inside)
    box(w - .3, .22, .1, '#9aa3ad', x, 1.2, front + .02);                                      // rolled-up shutter
    const sh = W.keep(mesh(new THREE.BoxGeometry(w - .3, 1.05, .04), shutterM, x, .66, front + .09, { cast: false })); sh.visible = false; L.shutters.push(sh); // …pulled down at night
    mesh(new THREE.PlaneGeometry(w - .15, .45), new THREE.MeshLambertMaterial({ map: textTex(sign, signBg, signFg, 512, 110, sign.length > 14 ? 40 : 50) }), x, 1.68, front + .05, { cast: false });
    const bays = Math.max(1, Math.round(w / 1.7)), bw = w / bays;
    for (let f = 1; f < floors; f++) {
      const y = .14 + f * FH;
      for (let b = 0; b < bays; b++) {
        const bx = x - w / 2 + bw * (b + .5);
        box(bw - .5, .9, .06, '#6b5a7a', bx, y + .05, front);                                  // door / window behind the cage
        box(bw - .2, .08, .55, PAL.frame, bx, y, front + .27);                                 // slab
        mesh(new THREE.PlaneGeometry(bw - .2, 1.05), cage, bx, y + .6, front + .55);            // the grille cage
        for (const s of [-1, 1]) mesh(new THREE.PlaneGeometry(.55, 1.05), cageSide, bx + s * (bw / 2 - .1), y + .6, front + .27).rotation.y = Math.PI / 2;
        box(bw - .2, .06, .6, PAL.frame, bx, y + 1.12, front + .28);
        const r = rnd();
        if (r < .4) for (let k = 0; k < 3; k++) box(.2 + rnd() * .15, .35 + rnd() * .2, .02, pick(['#a8434a', '#4a5aa8', '#f2c14e', '#fff6ea', '#3f7a5a', '#e9a0b4']), bx - .4 + k * .35, y + .55, front + .4, { cast: false }); // laundry inside the cage
        else if (r < .65) for (const px of [-.35, .3]) mesh(new THREE.IcosahedronGeometry(.16, 0), PAL.leafLight, bx + px, y + .32, front + .45);
        if (rnd() < .45) box(.45, .3, .25, '#e9e6ea', bx + bw / 2 - .35, y + .85, front + .7);    // aircon box hung outside
        else if (rnd() < .3) { const d = mesh(new THREE.SphereGeometry(.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#e9e6ea', bx - bw / 2 + .35, y + 1.0, front + .7); d.rotation.x = 1.2; }
      }
    }
    for (const tx of [-w / 4, w / 4]) if (rnd() < .8) cyl(.3, .3, .6, pick(['#2b2730', '#3f6fa8']), x + tx, H + .35, Z - .4, 10); // roof water tanks
    if (opts.billboard) { for (const s of [-1, 1]) box(.08, 1.2, .08, '#8f8794', x + s * (w / 2 - .4), H + .35, Z + .4); mesh(new THREE.PlaneGeometry(w - .3, 1), new THREE.MeshLambertMaterial({ map: textTex(opts.billboard, '#f2c14e', '#2b2730', 512, 180, 64) }), x, H + 1.35, Z + .45); }
    if (opts.awning !== false) { const a = mesh(new THREE.BoxGeometry(w - .1, .05, .8), new THREE.MeshLambertMaterial({ map: stripeTex('#fff1e0', pick(['#e07a7a', '#6fa98a', '#7a8fd0', '#e0a84f'])) }), x, 1.32, front + .38); a.rotation.x = .25; }
    solid(x, Z, w, D + .1);
    return new THREE.Vector3(x, 0, front + .55); // where you stand to go in
  }
  // tea shop (လက်ဖက်ရည်ဆိုင်): you can go in (rooms.js); a few low tables spill out onto the apron
  L.TEA = shopFlat(13.6, 5.2, 4, '#f4a6a6', 'ရွှေလမင်း လက်ဖက်ရည်ဆိုင်', '#c8553d', '#ffe7a3');
  for (const [tx, tz] of [[11.5, 5.2], [15.8, 5.2]]) { box(.7, .35, .55, '#c8a070', tx, .14, tz); for (const s of [-1, 1]) cyl(.12, .1, .2, pick(['#4fb3d9', '#e0574f', '#8bd17c']), tx + s * .55, .14, tz, 8); cyl(.05, .04, .08, '#fff6ea', tx - .1, .49, tz); solid(tx, tz, .7, .55); }
  // betel stall (ကွမ်းယာဆိုင်) on the apron
  box(.9, .8, .5, '#6b4a32', 16.7, .14, 5.0); box(.95, .05, .55, '#86b96d', 16.7, .94, 5.0); mesh(new THREE.SphereGeometry(.06, 8, 6), '#e0574f', 16.5, 1.0, 5.0);
  for (const s of [-1, 1]) cyl(.025, .025, 1.3, '#8a5a3a', 16.7 + s * .42, .14, 4.8, 5); box(1.1, .04, .7, '#c8553d', 16.7, 1.44, 4.95);
  solid(16.7, 5.0, .9, .5); L.BETEL = new THREE.Vector3(16.7, 0, 5.6);
  // barber (ဆံပင်ညှပ်ဆိုင်) with its spinning pole; clothes shop (အထည်ဆိုင်) with shirts on a rail outside
  L.BARBER = shopFlat(18.5, 2.8, 4, '#a9d8bf', 'ဆံပင်ညှပ်ဆိုင်', '#3f6fa8');
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .8, 12), new THREE.MeshLambertMaterial({ map: (() => { const t = stripeTex('#fff6ea', '#e0574f', 6); t.rotation = .6; return t; })() }));
  pole.position.set(19.75, 1.0, 4.65); scene.add(W.keep(pole)); L.spin = [pole];
  cyl(.11, .11, .08, '#d9dde3', 19.75, .56, 4.65, 12); cyl(.11, .11, .08, '#d9dde3', 19.75, 1.36, 4.65, 12);
  L.CLOTHES = shopFlat(21.9, 3.4, 4, '#f7d58b', 'ရွှေရည် အထည်ဆိုင်', '#7a4a9a');
  box(1.6, .04, .04, '#8f8794', 22.6, 1.0, 4.95); for (let i = 0; i < 4; i++) box(.3, .45, .03, pick(['#ff7f6b', '#4fb3d9', '#8bd17c', '#fff6ea', '#2e3a59']), 22.0 + i * .4, .55, 4.95);
  for (const s of [-1, 1]) cyl(.025, .025, 1.0, '#8f8794', 22.6 + s * .8, .14, 4.95, 5);
  // (x 23.6–24.6 is the alley through to the back lane)
  shopFlat(26.1, 3.0, 5, '#9fb7e8', 'ဖုန်း · SIM ကတ် · ငွေဖြည့်', '#f2c14e', '#2b2730', { billboard: '4G ရပြီ!' }); // 2016–17: 4G arrives, everyone's first smartphone
  shopFlat(29.1, 2.6, 4, '#f4c9a8', 'ဆေးဆိုင်', '#3f7a5a');
  shopFlat(32.1, 3.0, 5, '#cfe3d2', 'ကုန်စုံဆိုင် · ရေသန့်', '#c8553d');
  // sugarcane press cart (ကြံရည်)
  box(1.1, .55, .6, '#86b96d', 27.4, .3, 5.2); for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(.2, .04, 6, 12), '#2b2730', 27.4 + s * .35, .3, 5.52, {});
  for (let i = 0; i < 5; i++) { const c = cyl(.03, .03, 1, '#b8a060', 27.0 + i * .08, .85, 5.0, 5); c.rotation.z = .25; }
  solid(27.4, 5.2, 1.1, .6);

  // ---------- behind the shops: walled compounds (ခြံဝင်း), a small chinlone lot, a condo going up ----------
  const wallM = '#e9e1d2';
  const compound = (...a) => W.occluder(() => compound0(...a)); // tall: see-through when you walk behind it
  function compound0(x0, x1, z0, z1, house) {
    const gx = (x0 + x1) / 2 + .6, seg = (a, b, z) => { box(b - a, .95, .18, wallM, (a + b) / 2, .02, z); solid((a + b) / 2, z, b - a, .18); };
    seg(x0, gx - .8, z1); seg(gx + .8, x1, z1); seg(x0, x1, z0);
    for (const x of [x0, x1]) { box(.18, .95, z1 - z0, wallM, x, .02, (z0 + z1) / 2); solid(x, (z0 + z1) / 2, .18, z1 - z0); }
    mesh(new THREE.PlaneGeometry(1.5, .95), grilleM(2, 1), gx, .5, z1 + .02).rotation.y = .5;      // iron gate, left ajar
    const hx = house.x ?? (x0 + x1) / 2 - .4, hz = (z0 + z1) / 2 - .3, hw = house.w ?? (x1 - x0 - 2.2), hd = z1 - z0 - 2.4;
    box(hw, 1.3, hd, house.c, hx, .02, hz); mesh(new THREE.BoxGeometry(hw + .2, 1.2, hd + .2), plankM, hx, 1.94, hz); gable(hx, 2.95, hz, hw + .6, hd * .62, .45);
    box(.7, 1.0, .06, '#6b4a32', hx - hw / 4, .02, hz + hd / 2 + .01); for (const wx of [.3, hw / 2 - .5]) { box(.5, .45, .06, '#3b2a24', hx + wx, .55, hz + hd / 2 + .01); box(.5, .45, .06, '#3b2a24', hx + wx, 1.8, hz + hd / 2 + .11); }
    solid(hx, hz, hw, hd);
    if (house.tree) { const tx = x1 - .9, tz = z1 - 1; cyl(.12, .16, 1.3, PAL.trunk, tx, .02, tz, 6); for (const [ox, oy, oz, r] of [[0, 1.8, 0, .8], [.4, 1.5, .3, .55], [-.4, 1.6, -.2, .6]]) mesh(new THREE.IcosahedronGeometry(r, 0), PAL.leaf, tx + ox, oy, tz + oz); solid(tx, tz, .4, .4); } // a mango tree
    return new THREE.Vector3(gx, 0, z1 + .6);
  }
  compound(11, 17.2, -9.6, -2.6, { c: '#f4c9a8', tree: true });
  compound(22.8, 27.4, -9.6, -2.6, { c: '#cfe3d2', w: 2.6 });
  L.FIELD = new THREE.Vector3(20, 0, -5.4);   // the chinlone lot: a patch of beaten earth between two compound walls
  box(5, .02, 5.2, '#c99a6b', 20, 0, -5.6, { cast: false });
  W.occluder(() => { // the condo going up (2015–19): concrete frame, bamboo scaffolding, green netting, a tower crane
    const X = 30.8, Z = -6.2, w = 5, d = 5.2, F = 6;
    for (let f = 0; f <= F; f++) box(w, .14, d, '#bdb6ae', X, f * 1.2, Z);
    for (const sx of [-1, 0, 1]) for (const sz of [-1, 1]) box(.22, F * 1.2, .22, '#bdb6ae', X + sx * (w / 2 - .15), .02, Z + sz * (d / 2 - .15));
    const net = new THREE.MeshLambertMaterial({ color: '#4f8f5a', transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false });
    mesh(new THREE.PlaneGeometry(w + .4, F * 1.2 * .6), net, X, F * 1.2 * .7, Z + d / 2 + .25, { cast: false });
    for (let i = 0; i <= 6; i++) cyl(.03, .03, F * 1.2 + .6, PAL.bamboo, X - w / 2 - .1 + i * (w + .2) / 6, .02, Z + d / 2 + .2, 4);
    for (let f = 1; f <= F; f++) box(w + .4, .04, .04, PAL.bamboo, X, f * 1.2, Z + d / 2 + .2);
    box(.4, 12, .4, '#e0a84f', X + 3.2, .02, Z - 1.5); box(9, .3, .3, '#e0a84f', X + .8, 12, Z - 1.5); box(.9, .8, .8, '#5a4a52', X + 4.6, 11.4, Z - 1.5);
    mesh(new THREE.CylinderGeometry(.015, .015, 5, 4), '#3b3040', X - 1.6, 9.5, Z - 1.5); box(.6, .4, .6, '#9aa3ad', X - 1.6, 6.8, Z - 1.5);
    solid(X, Z, w + .6, d + .6); solid(X + 3.2, Z - 1.5, .4, .4);
    box(4.2, 1.6, .1, '#2f73c4', X - .2, .02, Z + d / 2 + 1.2); mesh(new THREE.PlaneGeometry(4, .5), new THREE.MeshLambertMaterial({ map: textTex('ကွန်ဒို အသစ် · ရောင်းမည်', '#2f73c4', '#fff6ea', 512, 64, 40) }), X - .2, 1.1, Z + d / 2 + 1.26, { cast: false });
    solid(X - .2, Z + d / 2 + 1.2, 4.2, .1);
  });

  // ---------- ③ the ward market: vendors on mats along two lanes, umbrellas and plastic tarps, a zinc-roofed market shed behind ----------
  const FROND = frondGeo(THREE), frondM = M('#7fae5a', { side: THREE.DoubleSide }), dryM = M('#c8b070', { side: THREE.DoubleSide });
  const TARP = ['#3f6fa8', '#e0843f', '#4f8f5a', '#c8553d', '#7a8fd0'];
  // the market's roofs, tarps and umbrellas get their own materials so main.js can fade them out while you're in the market
  L.roofFade = []; const fadeOf = new Map();
  const fade = m => { if (!fadeOf.has(m)) { const f = m.clone(); f.transparent = true; L.roofFade.push(f); fadeOf.set(m, f); } return fadeOf.get(m); };
  const tarp = (x, z, w, d, c, h = 2.0) => { // a plastic sheet on four bamboo poles, sagging
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(.035, .035, h, PAL.bamboo, x + sx * w / 2, .02, z + sz * d / 2, 5);
    const g = new THREE.PlaneGeometry(w + .2, d + .2, 4, 4), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, -.18 * (1 - (2 * p.getX(i) / (w + .2)) ** 2) * (1 - (2 * p.getY(i) / (d + .2)) ** 2)); g.computeVertexNormals();
    const m = mesh(g, fade(M(c, { side: THREE.DoubleSide })), x, h + .02, z); m.rotation.x = -Math.PI / 2;
  };
  const umbrella = (x, z, cA, cB) => { cyl(.03, .03, 1.9, '#8f8794', x, .02, z, 5); mesh(new THREE.CylinderGeometry(.02, 1.05, .35, 8, 1, true), fade(new THREE.MeshLambertMaterial({ map: stripeTex(cA, cB, 8), side: THREE.DoubleSide })), x, 1.92, z); };
  const GOODS = { veg: [PAL.leaf, PAL.leafLight, '#e0574f', '#7a4a9a'], fruit: ['#f2c14e', '#e8954a', '#86b96d'], flower: ['#ffc83d', '#fff6ea', '#f48fb1'], fish: ['#9aa3ad', '#c9d2dc'], dry: ['#c8553d', '#e8954a', '#d9b98f'], guns: ['#ff7f3f', '#4fb3d9', '#8bd17c', '#f06292'] };
  L.SEATS = [];
  function pitch(x, z, side, kind, cover) { // one vendor's patch: a sheet on the ground, baskets, trays, a basin, a low stool
    const fz = side > 0 ? 1 : -1, cs = GOODS[kind];
    const sheet = mesh(new THREE.PlaneGeometry(1.8, 1.0), pick(['#3f6fa8', '#c8553d', '#e9e1d2', '#4f8f5a']), x, .025, z, { cast: false }); sheet.rotation.x = -Math.PI / 2;
    for (let i = 0; i < 3; i++) {
      const gx = x - .55 + i * .55, gz = z + fz * .15;
      if (kind === 'fish') { cyl(.24, .2, .14, '#c9d2dc', gx, .03, gz, 12); for (let k = 0; k < 3; k++) { const f = mesh(new THREE.SphereGeometry(.07, 6, 4), pick(cs), gx - .08 + k * .08, .19, gz); f.scale.set(1.8, .5, .7); } }
      else if (i === 1) { cyl(.26, .26, .04, '#c8a060', gx, .03, gz, 12); for (let k = 0; k < 5; k++) mesh(new THREE.IcosahedronGeometry(.08, 0), pick(cs), gx - .14 + k * .07, .12, gz + (k % 2 - .5) * .1); } // bamboo tray (ဗန်း)
      else { cyl(.2, .15, .28, '#b8925a', gx, .03, gz, 10); for (let k = 0; k < 4; k++) mesh(new THREE.IcosahedronGeometry(.08, 0), pick(cs), gx + (k % 2 - .5) * .12, .34, gz + (k > 1 ? .06 : -.06)); } // basket
    }
    cyl(.14, .12, .22, pick(['#4fb3d9', '#e0574f', '#8bd17c']), x + .9, .03, z - fz * .35, 8);  // the vendor's low stool
    L.SEATS.push({ x: x + .9, z: z - fz * .35, ry: fz > 0 ? 0 : Math.PI });
    if (cover === 'tarp') tarp(x, z, 2.2, 1.6, pick(TARP)); else umbrella(x + .2, z, pick(['#e0574f', '#3f6fa8', '#f2c14e', '#4f8f5a']), '#fff6ea');
    solid(x - .1, z, 1.7, .9);
  }
  const LANES = [[16.0, 17.8], [22.6, 24.4]];
  const KINDS = ['veg', 'fruit', 'fish', 'flower', 'dry', 'veg', 'guns', 'fruit'];
  let k = 0;
  for (const [z0, z1] of LANES) for (const side of [-1, 1]) for (let x = -8.2; x < 10; x += 2.6) {
    const z = side < 0 ? z0 - .6 : z1 + .6;
    if (z1 > 20 && side > 0 && x < -5) continue;          // frond yard goes here
    if (z1 < 18 && side < 0 && x > 7) continue;            // mohinga stall goes here
    if (z1 > 20 && side < 0 && x > 2 && x < 6) continue;   // lights stall goes here
    pitch(x, z, side, KINDS[k++ % KINDS.length], rnd() < .5 ? 'tarp' : 'umbrella');
  }
  // zinc-roofed market sheds (ဈေးရုံ) you can walk into: a concrete floor, a raised stall counter down each long side with the
  // sellers sitting up on it among their goods, an aisle down the middle (in from either end), gaps in the counters lined up
  // with the gaps between the pitches outside so you can step in from the lanes
  L.SHED_SEATS = [];
  const SHED_GOODS = [[PAL.leaf, PAL.leafLight, '#7a4a9a'], ['#f2c14e', '#e8954a', '#86b96d'], ['#d9776a', '#c8553d', '#e9a0a0'], ['#9aa3ad', '#c9d2dc'], ['#c8553d', '#e8954a', '#d9b98f']];
  for (const [z0, z1, gapsS, gapsN] of [[18.8, 21.8, [-7.0, 3.4], [-7.0, 1.5]], [25.6, 28.8, [-1.8, .8, 3.4, 6.0], []]]) {
    const X = .2, w = 19.4, xa = X - w / 2, xb = X + w / 2;
    for (const [z, gaps] of [[z0 + .15, gapsS], [z1 - .15, gapsN]]) for (let x = xa + .2; x <= xb; x += 2.4) {
      if (gaps.some(g => Math.abs(g - x) < .7)) continue; // keep the way in clear
      cyl(.12, .12, 2.6, '#bdb6ae', x, .02, z, 6); solid(x, z, .3, .3);
    }
    gable(X, 3.2, (z0 + z1) / 2, w + .8, (z1 - z0) * .78, .38, fade(zinc));
    for (const [cz, gaps, face] of [[z0 + .6, gapsS, 0], [z1 - .6, gapsN, Math.PI]]) { // the two stall counters
      const cuts = [xa + .9, ...gaps.flatMap(g => [g - .55, g + .55]), xb - .9]; // leave the ends open for the aisle
      for (let i = 0; i + 1 < cuts.length; i += 2) {
        const a = cuts[i], b = cuts[i + 1], cx = (a + b) / 2, L2 = b - a; if (L2 < .6) continue;
        box(L2, .5, .7, '#bfb6a8', cx, .06, cz); box(L2 + .04, .06, .74, '#e4dccd', cx, .56, cz); solid(cx, cz, L2, .7);
        for (let x = a + .45; x < b - .3; x += 1.1) { // goods along the counter: baskets, trays, heaps
          const cs = pick(SHED_GOODS), k = rnd();
          if (k < .4) { cyl(.22, .22, .04, '#c8a060', x, .62, cz, 10); for (let j = 0; j < 4; j++) mesh(new THREE.IcosahedronGeometry(.07, 0), pick(cs), x - .1 + (j % 2) * .2, .7, cz - .06 + (j >> 1) * .12); }
          else if (k < .75) { cyl(.17, .13, .22, '#b8925a', x, .62, cz, 9); for (let j = 0; j < 3; j++) mesh(new THREE.IcosahedronGeometry(.07, 0), pick(cs), x + (j - 1) * .08, .86, cz); }
          else { const h = mesh(new THREE.IcosahedronGeometry(.2, 0), pick(cs), x, .7, cz); h.scale.set(1.3, .6, 1); }
        }
        if (L2 > 2.5) L.SHED_SEATS.push({ x: a + L2 * (.3 + rnd() * .4), z: cz + (face ? -.12 : .12), ry: face, y: .36 }); // a seller up on the counter, facing the aisle
      }
    }
  }
  mesh(new THREE.PlaneGeometry(3, .55), new THREE.MeshLambertMaterial({ map: textTex('ရပ်ကွက် ဈေး', '#c8553d', '#ffe7a3', 512, 90, 60) }), .2, 2.6, 21.85, { cast: false });
  // the frond + bamboo yard (အုန်းလက် · ဝါး) at the west end of the back lane
  L.FRONDS = new THREE.Vector3(-6.6, 0, 24.1);
  for (let i = 0; i < 9; i++) { const f = mesh(FROND, i % 3 ? frondM : dryM, -9.4 + rnd() * .3, .1 + i * .05, 24.8 + (i % 3) * .35); f.scale.setScalar(2.2); f.rotation.y = rnd() * .2; }
  for (let i = 0; i < 7; i++) { const b = cyl(.05, .05, 3.2, PAL.bamboo, -5.4 + i * .14, .02, 25.3, 6); b.rotation.x = .3; }
  solid(-8.2, 25.2, 2.6, 1.0); solid(-4.9, 25.4, 1.2, .5);
  // mohinga stall (မုန့်ဟင်းခါး) on the first lane, by the street
  L.MOHINGA = new THREE.Vector3(9.4, 0, 15.8);
  cyl(.45, .4, .5, '#5a4a4a', 9.4, .02, 14.2, 12); cyl(.42, .36, .55, '#9aa3ad', 9.4, .52, 14.2, 14); cyl(.4, .4, .02, '#d9a04a', 9.4, 1.07, 14.2, 14);
  for (const tx of [8.0, 10.8]) { box(.6, .3, .5, '#c8a070', tx, .02, 14.4); cyl(.1, .1, .16, '#4fb3d9', tx + .45, .02, 14.4, 8); solid(tx, 14.4, .6, .5); }
  tarp(9.4, 14.3, 3.6, 1.4, '#e0843f', 2.1);
  mesh(new THREE.PlaneGeometry(1.6, .4), new THREE.MeshLambertMaterial({ map: textTex('မုန့်ဟင်းခါး', '#c8553d', '#fff6ea', 512, 120, 64), side: THREE.DoubleSide }), 9.4, 1.7, 15.05, { cast: false });
  solid(9.4, 14.2, 1.0, 1.0);
  // lights + electrics stall (မီးကြိုးဆိုင်) on the back lane: bulbs strung off its tarp
  L.LIGHTS = new THREE.Vector3(4.0, 0, 23.1);
  box(1.6, .7, .7, '#8a5a3a', 4.0, .02, 22.1); tarp(4.0, 22.1, 2.2, 1.2, '#3f6fa8', 2.0); solid(4.0, 22.1, 1.6, .7);
  for (let i = 0; i < 14; i++) mesh(new THREE.SphereGeometry(.05, 6, 4), new THREE.MeshBasicMaterial({ color: [new THREE.Color(2.8, 2.3, 1.2), new THREE.Color(2.8, 1.4, 1.4), new THREE.Color(1.3, 2.4, 2.8)][i % 3] }), 3.0 + i * .15, 1.75 - Math.sin(i / 13 * Math.PI) * .3, 21.5, { cast: false });
  // trishaws (ဆိုက်ကား) parked along the street edge of the market, waiting for shoppers with heavy bags
  function trishaw(x, z, ry, y = .14) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; scene.add(g); const o = { parent: g }, tm = pick(['#2f6f8f', '#8a3a4a', '#3f7a5a']);
    for (const [wx, wz, r] of [[-.5, 0, .32], [.45, 0, .32], [-.05, .75, .26]]) mesh(new THREE.TorusGeometry(r, .03, 6, 16), '#2b2730', wx, r, wz, o);
    box(.9, .06, .1, tm, 0, .62, 0, o); box(.7, .08, .5, tm, -.05, .45, .72, o); box(.62, .32, .08, tm, -.05, .52, .95, o); box(.5, .06, .36, '#c8553d', -.05, .55, .72, o);
    solid(x + Math.sin(ry) * .35, z + Math.cos(ry) * .35, 1.2, 1.2); // the bike and its sidecar
  }
  trishaw(-7.6, 13.8, -.4); trishaw(-5.6, 13.9, .3); trishaw(.6, 13.8, -.2);
  mesh(new THREE.PlaneGeometry(3.2, .55), new THREE.MeshLambertMaterial({ map: textTex('ရပ်ကွက် ဈေး ↓', '#c8553d', '#ffe7a3', 512, 90, 56), side: THREE.DoubleSide }), 11.45, 2.7, 16.9, { cast: false }).rotation.y = Math.PI / 2;
  for (const s of [-1, 1]) cyl(.06, .06, 3, '#c8553d', 11.4, .02, 16.9 + s * 1.5, 6);

  // ---------- ④ the ward monastery (ဘုန်းကြီးကျောင်း): a walled yard, a two-storey kyaung, a bell, a well, a fish tank ----------
  const wallSeg = (x0, z0, x1, z1) => { const len = Math.hypot(x1 - x0, z1 - z0), along = Math.abs(x1 - x0) > Math.abs(z1 - z0);
    box(along ? len : .2, .9, along ? .2 : len, '#fbf4e6', (x0 + x1) / 2, .02, (z0 + z1) / 2); solid((x0 + x1) / 2, (z0 + z1) / 2, along ? len : .2, along ? .2 : len); };
  wallSeg(15, 14.0, 25.6, 14.0); wallSeg(15, 14.0, 15, 17.8); wallSeg(15, 19.8, 15, 24.8); wallSeg(15, 24.8, 25.6, 24.8); wallSeg(25.6, 14.0, 25.6, 24.8);
  { // gate arch with the kyaung's name board
    for (const s of [17.8, 19.8]) box(.4, 2.2, .4, '#fbf4e6', 15, .02, s);
    box(.4, .3, 2.4, '#fbf4e6', 15, 2.2, 18.8); const t = mesh(new THREE.CylinderGeometry(.2, 1.0, .5, 4), '#8a3a2a', 15, 2.75, 18.8); t.rotation.y = Math.PI / 4; t.scale.set(.5, 1, 1.4);
    mesh(new THREE.PlaneGeometry(2, .4), new THREE.MeshLambertMaterial({ map: textTex('ဓမ္မာရုံ ကျောင်း', '#8a3a2a', '#ffe7a3', 512, 100, 56), side: THREE.DoubleSide }), 14.75, 1.9, 18.8, { cast: false }).rotation.y = -Math.PI / 2;
  }
  L.GATE = new THREE.Vector3(15.8, 0, 18.8);
  W.occluder(() => { // the kyaung: whitewashed brick below, teak above, a plain hipped zinc roof with one small tiered finial
    const X = 21.2, Z = 18.6, w = 6.2, d = 4.0;
    box(w, 1.4, d, '#fbf4e6', X, .02, Z); mesh(new THREE.BoxGeometry(w + .2, 1.3, d + .2), plankM, X, 2.07, Z);
    for (let i = 0; i < 4; i++) { const ax = X - 2.2 + i * 1.47; box(.5, .8, .06, '#5a4a52', ax, .3, Z + d / 2 + .01); mesh(new THREE.CylinderGeometry(.25, .25, .06, 10, 1, false, 0, Math.PI), '#5a4a52', ax, 1.1, Z + d / 2 + .01).rotation.set(Math.PI / 2, 0, 0); box(.55, .55, .06, '#3b2a24', ax, 1.85, Z + d / 2 + .12); }
    const rg = new THREE.CylinderGeometry(2.6, 2.6, w + .7, 3); rg.rotateX(-Math.PI / 2); rg.rotateY(Math.PI / 2); rg.scale(1, .42, 1); // a plain zinc gable, like the houses round it
    mesh(rg, new THREE.MeshLambertMaterial({ map: stripeTex('#9a4a3a', '#7a3a2e', 16), flatShading: true }), X, 3.25, Z);
    for (const [y, r, h] of [[3.95, .55, .3], [4.22, .4, .26], [4.45, .27, .22]]) { const t = mesh(new THREE.CylinderGeometry(r * .55, r, h, 4), '#7a3a2e', X, y + h / 2, Z); t.rotation.y = Math.PI / 4; } // one small tiered finial on the ridge
    cyl(0, .06, .45, '#f2c14e', X, 4.67, Z, 6);
    for (let i = 0; i < 3; i++) box(1.4, .14, .35, '#d9cdb8', X, .02 + i * .14, Z + d / 2 + .25 + (2 - i) * .3);
    solid(X, Z, w + .2, d + .2);
    L.MONASTERY = new THREE.Vector3(X, 0, Z + d / 2 + 1.5);
  });
  { // bell (ခေါင်းလောင်း), well (ရေတွင်း), fish tank (ငါးကန်) in the yard; a coconut palm and a padauk
    for (const s of [-1, 1]) cyl(.05, .05, 1.6, '#8a5a38', 17.2 + s * .45, .02, 15.4, 6); box(1.1, .1, .1, '#8a5a38', 17.2, 1.6, 15.4);
    mesh(new THREE.CylinderGeometry(.16, .26, .42, 14), new THREE.MeshStandardMaterial({ color: '#c99a4a', metalness: .9, roughness: .4 }), 17.2, 1.1, 15.4);
    solid(17.2, 15.4, 1.1, .4); L.BELL = new THREE.Vector3(17.2, 0, 16.1);
    const WX = 17.0, WZ = 22.8;
    cyl(.5, .55, .6, '#9aa3ad', WX, .02, WZ, 14); mesh(new THREE.CircleGeometry(.42, 14), '#2a3a4a', WX, .63, WZ, { cast: false }).rotation.x = -Math.PI / 2;
    for (const s of [-1, 1]) cyl(.04, .04, 1.4, '#8a5a38', WX + s * .55, .02, WZ, 5); box(1.2, .06, .06, '#8a5a38', WX, 1.42, WZ);
    solid(WX, WZ, 1.2, 1.2); L.WELL = new THREE.Vector3(WX + .9, 0, WZ);
    const TX = 23.6, TZ = 23.1;
    box(2.4, .55, 1.4, '#d9cdb8', TX, .02, TZ); mesh(new THREE.PlaneGeometry(2.1, 1.1), new THREE.MeshLambertMaterial({ color: '#7fc6d9' }), TX, .56, TZ, { cast: false }).rotation.x = -Math.PI / 2;
    for (let i = 0; i < 5; i++) { const f = mesh(new THREE.SphereGeometry(.06, 6, 4), '#e8954a', TX - .8 + i * .4, .58, TZ - .3 + (i % 2) * .5, { cast: false }); f.scale.set(1.8, .5, .8); }
    solid(TX, TZ, 2.4, 1.4); L.POND = new THREE.Vector3(TX - 1.8, 0, TZ);
  }
  // coconut palms (အုန်းပင်): curved trunk, a crown of fronds
  function palm(x, z, h = 3.4, lean = .5) {
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, 0, z), new THREE.Vector3(x + lean * .2, h * .6, z + lean * .3), new THREE.Vector3(x + lean * .7, h, z + lean));
    mesh(new THREE.TubeGeometry(curve, 10, .1, 6), '#9a7a5a'); const top = curve.getPoint(1);
    for (let i = 0; i < 8; i++) { const f = mesh(FROND, frondM, top.x, top.y, top.z); f.scale.setScalar(1.7); f.rotation.set(0, i / 8 * Math.PI * 2, -.45); }
    for (let i = 0; i < 3; i++) mesh(new THREE.SphereGeometry(.1, 8, 6), '#7a8a3a', top.x + Math.cos(i * 2.1) * .12, top.y - .12, top.z + Math.sin(i * 2.1) * .12);
    solid(x, z, .4, .4);
  }
  palm(24.4, 22.0, 3.4, -.5); palm(11.1, 28.1, 3.0, -.4); palm(33.2, 14.8, 3.3, -.5);
  // east of the kyaung: two compounds and a four-storey block of flats at the back corner
  // the trishaw stand (ဆိုက်ကားဂိတ်) on the corner plot east of the kyaung: a zinc lean-to with a bench, two trishaws by the kerb
  // waiting for fares; the riders sit about on them (life.js) and talk football
  {
    const X = 31.0, Z = 15.6;
    box(7.0, .02, 5.6, '#c9a27a', 30.0, 0, 16.7, { cast: false });          // beaten earth
    for (const sx of [-1.5, 1.5]) for (const sz of [-.9, .9]) cyl(.06, .06, 2.3, '#8f8794', X + sx, .02, Z + sz, 6);
    gable(X, 2.4, Z, 3.6, 1.4, .3);
    box(2.4, .1, .45, '#8a5a3a', X, .45, Z + .4); for (const sx of [-1, 1]) box(.08, .45, .4, '#8a5a3a', X + sx, .02, Z + .4); solid(X, Z + .4, 2.4, .45);
    cyl(.22, .18, .45, '#b8653d', X + 1.25, .02, Z - .5, 10);                // a pot of drinking water
    mesh(new THREE.PlaneGeometry(1.8, .4), new THREE.MeshLambertMaterial({ map: textTex('ဆိုက်ကားဂိတ်', '#2f6f8f', '#fff6ea', 512, 110, 60), side: THREE.DoubleSide }), X, 2.0, Z - 1.0, { cast: false });
    for (const sx of [-1.5, 1.5]) solid(X + sx, Z - .9, .2, .2); for (const sx of [-1.5, 1.5]) solid(X + sx, Z + .9, .2, .2);
    L.STAND = new THREE.Vector3(X, 0, Z); L.STAND_TRIKES = [[27.2, 13.95], [28.8, 13.95]].map(([x, z]) => ({ x, z, ry: Math.PI, y: .02 }));
    for (const t of L.STAND_TRIKES) trishaw(t.x, t.z, t.ry, t.y);
  }
  compound(15.4, 22.6, 25.1, 29.0, { c: '#e9c8d8', w: 3.4 });
  flats(29.6, 25.6, 2, 0, '#f4c9a8', 7);

  // ---------- street furniture: padauk trees, poles + tangled cables, Thingyan bunting across the street ----------
  padauk(2.2, -4.4, .8); padauk(7.7, 2.6, .95); padauk(-1.3, 5.1, .8);
  for (const [x, z, s] of [[-6.5, 12.65, .8], [5.6, 12.65, .75], [17.5, 12.65, .8], [32.6, 12.65, .8], [12.4, .6, .8], [-9.4, 14.6, .8], [18.4, 26.6, .8]]) padauk(x, z, s);
  // street lamps: an arm off the pole, a bulb (L.lamp.bulb) and a soft pool of light on the road (L.lamp.glow); main.js turns them up at night
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.45, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  L.lamp = { bulb: new THREE.MeshBasicMaterial({ color: '#d9d2c4' }), glow: new THREE.MeshBasicMaterial({ map: glowTex, color: '#ffc77a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }) };
  const lamp = (top, dx, dz) => {
    box(Math.abs(dx) * .55 + .05, .05, Math.abs(dz) * .55 + .05, '#8f8794', top.x + dx * .27, top.y + .12, top.z + dz * .27, { cast: false });
    box(.22, .08, .22, '#5a5560', top.x + dx * .55, top.y + .06, top.z + dz * .55, { cast: false });
    mesh(new THREE.SphereGeometry(.08, 8, 6), L.lamp.bulb, top.x + dx * .55, top.y + .01, top.z + dz * .55, { cast: false });
    const g = mesh(new THREE.PlaneGeometry(4.2, 4.2), L.lamp.glow, top.x + dx * 1.1, .07, top.z + dz * 1.1, { cast: false }); g.rotation.x = -Math.PI / 2; g.receiveShadow = false;
  };
  const poleAt = ([x, z], h = 3.6) => { cyl(.06, .08, h, '#8f8794', x, .02, z, 6); box(.7, .06, .06, '#8f8794', x, h - .15, z); return new THREE.Vector3(x, h - .1, z); };
  const [p1, p2, p3, p4, p5] = [[-5.0, -3.85], [1.6, -3.85], [7.1, -3.85], [-5.0, 1.4], [-5.0, 5.4]].map(p => poleAt(p));
  lamp(p2, 0, 1); lamp(p3, 0, 1); lamp(p4, 1, 0); // the lanes in ①
  box(.5, .6, .4, '#9aa3ad', 1.6, 2.4, -3.55);
  const off = (v, x = 0, y = 0, z = 0) => v.clone().add(new THREE.Vector3(x, y, z));
  for (const [a, b, d] of [[p1, p2, .6], [off(p1, 0, -.12), off(p2, 0, -.12), .9], [p2, p3, .55], [off(p2, 0, -.1), off(p3, 0, -.1), .8], [p1, p4, .7], [off(p1, .2), off(p4, .2), .95], [p4, p5, .6], [off(p4, 0, -.1), off(p5, 0, -.1), .85]]) sag(a, b, d);
  for (const [p, t, d] of [[p1, [-6.2, 4.2, -5.0], .3], [p2, [-.4, 3.8, -5.0], .35], [p2, [.9, 4.6, -5.0], .25], [p3, [4.2, 2.9, -4.75], .3], [p3, [6.6, 2.9, -4.75], .2], [p4, [-5.75, 3.7, .6], .25], [p5, [-5.75, 4.4, 3.4], .3], [p3, [7.6, 3.1, 1.4], .6]]) sag(p, new THREE.Vector3(...t), d);
  const north = [-8, -1, 6, 11, 16, 21, 26, 31].map(x => poleAt([x, 6.3])), south = [-8, -1, 6, 11, 16, 21, 26, 31].map(x => poleAt([x + .4, 12.7], 3.3));
  north.forEach((p, i) => i % 2 || lamp(p, 0, 1)); south.forEach((p, i) => i % 2 && lamp(p, 0, -1)); // lamps over the main street, staggered
  for (let i = 0; i + 1 < north.length; i++) { sag(north[i], north[i + 1], .6); sag(off(north[i], 0, -.12), off(north[i + 1], 0, -.12), .85); sag(south[i], south[i + 1], .5); }
  sag(p5, north[1], .4);
  const bunting = (a, b, drop) => {
    const mid = a.clone().lerp(b, .5); mid.y -= drop; const cv = new THREE.QuadraticBezierCurve3(a, mid, b); sag(a, b, drop);
    for (let i = 1; i < 16; i++) { const p = cv.getPoint(i / 16); const t = mesh(new THREE.ConeGeometry(.12, .24, 3), pick([PAL.padauk, PAL.pink, PAL.mint, '#9fb7e8', PAL.red]), p.x, p.y - .14, p.z, { cast: false }); t.rotation.x = Math.PI; }
  };
  for (let i = 0; i < north.length; i += 2) bunting(off(north[i], 0, -.3), off(south[i], 0, -.3), .5); // paper flags across the street, Thingyan colours
  cyl(.05, .06, 3.2, PAL.bamboo, -1.1, .02, -.5, 6); bunting(new THREE.Vector3(-5.75, 3.4, 2.4), new THREE.Vector3(-1.1, 3.1, -.5), .5);
  bunting(new THREE.Vector3(12, 3.0, 12.8), new THREE.Vector3(14.6, 2.8, 19.2), .4); // down the market street
  bunting(new THREE.Vector3(-8, 2.4, 15.6), new THREE.Vector3(10, 2.4, 15.6), .3); bunting(new THREE.Vector3(-8, 2.4, 22.2), new THREE.Vector3(10, 2.4, 22.2), .3); // over the market lanes

  // ---------- bus stop (ဘတ်စ်ကားမှတ်တိုင်) on the main street ----------
  L.STOP = new THREE.Vector3(2.6, 0, 6.2);
  {
    const { x: X, z: Z } = L.STOP;
    box(2.6, 1.7, .08, '#3f6fa8', X, .14, Z - .3); box(2.4, .9, .1, '#9fc4e8', X, .7, Z - .29);
    for (const px of [-1.25, 1.25]) cyl(.05, .05, 2.1, '#d9dde3', X + px, .14, Z + .25, 6);
    const rf = box(2.9, .1, 1.0, '#3f6fa8', X, 2.2, Z); rf.rotation.x = -.08;
    box(2, .1, .35, '#d9dde3', X, .5, Z - .1); box(2, .4, .06, '#d9dde3', X, .14, Z - .1);
    mesh(new THREE.PlaneGeometry(2.3, .4), new THREE.MeshLambertMaterial({ map: textTex('ဘတ်စ်ကားမှတ်တိုင်', '#3f6fa8', '#fff6ea', 512, 90, 52) }), X, 2.04, Z + .51, { cast: false });
    cyl(.04, .04, 2.4, '#d9dde3', X + 1.9, .14, Z + .2, 6);
    mesh(new THREE.PlaneGeometry(.6, .6), new THREE.MeshLambertMaterial({ map: textTex('၃၆ · ၄၃', '#c8553d', '#fff6ea', 256, 256, 70), side: THREE.DoubleSide }), X + 1.9, 2.25, Z + .2, { cast: false });
    solid(X, Z - .2, 2.7, .5);
  }
  return L;
}
