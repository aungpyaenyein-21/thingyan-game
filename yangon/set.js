// yangon/set.js — the day-1 Yangon neighbourhood as one walkable map (STORY.md §၄):
//   ① home lane (walk-up flats, timber home, the empty lot)   ② the ward's main street (tea shop, barber, clothes shop …)
//   ③ the open-air market                                    ④ pagoda + monastery            + a chinlone field behind the shops
// Everything here is scenery: it is baked into a few meshes at start (world.bake). People and errands live in story.js.
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PAL } from '../world.js?v=3';

export const MM = n => String(n).replace(/\d/g, d => '၀၁၂၃၄၅၆၇၈၉'[d]);
export const BOUNDS = { x0: -10, x1: 34, z0: -10, z1: 26 };

// walk heights: asphalt .045, raised sidewalks .14, concrete lanes .05, everything else .01 (first match wins)
const RECTS = [
  { x0: -10, x1: 34, z0: 6.6, z1: 9.0, h: .045, c: PAL.road },        // ② main street
  { x0: -10, x1: 34, z0: 5.8, z1: 6.6, h: .14, c: PAL.walk },          // its north sidewalk
  { x0: 10.6, x1: 34, z0: 4.4, z1: 5.8, h: .14, c: PAL.walk },         // the shop fronts' apron
  { x0: -10, x1: 34, z0: 9.0, z1: 9.8, h: .14, c: PAL.walk },          // south sidewalk
  { x0: 11.8, x1: 14.2, z0: 9.8, z1: 26, h: .045, c: PAL.road },       // market street (cross street)
  { x0: -4.6, x1: 10.6, z0: -3.4, z1: -1.4, h: .05, c: '#cdc2b6' },    // ① back lane along the flats
  { x0: -4.6, x1: -2.6, z0: -3.4, z1: 5.8, h: .05, c: '#cdc2b6' },     // ① side lane out to the street
  { x0: 9.0, x1: 10.6, z0: -9.6, z1: -1.4, h: .05, c: '#cdc2b6' },     // east lane past the chinlone field
];
export const ground = (x, z) => { for (const r of RECTS) if (x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1) return r.h; return .01; };
export const AREAS = [ // for the minimap and the "you are here" toast
  { id: 1, short: '①', name: '① အိမ်နဲ့ လမ်းကြား', x0: -10, x1: 10.6, z0: -10, z1: 5.8, c: '#f4c9a8' },
  { id: 2, short: '', name: '② ရပ်ကွက်လမ်းမ', x0: -10, x1: 34, z0: 5.8, z1: 9.8, c: '#c9b6d6' },
  { id: 2, short: '②', name: '② ရပ်ကွက်လမ်းမ', x0: 10.6, x1: 34, z0: 0, z1: 5.8, c: '#e9c8d8' },
  { id: 6, short: 'ကွင်း', name: 'ခြင်းလုံးကွင်း', x0: 10.6, x1: 34, z0: -10, z1: 0, c: '#d8d0a0' },
  { id: 3, short: '③', name: '③ ဈေး', x0: -10, x1: 11.8, z0: 9.8, z1: 26, c: '#f2d39a' },
  { id: 4, short: '④', name: '④ ဘုရား · ဘုန်းကြီးကျောင်း', x0: 14.2, x1: 34, z0: 9.8, z1: 26, c: '#f6e7b8' },
  { id: 3, short: '', name: '③ ဈေးလမ်း', x0: 11.8, x1: 14.2, z0: 9.8, z1: 26, c: '#b8a8c8' },
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
  for (let x = B.x0 + .6; x < B.x1; x += 1.4) box(.7, .05, .1, PAL.roadLine, x, 0, 7.85, { cast: false });
  for (let z = 10.4; z < B.z1; z += 1.4) box(.1, .05, .7, PAL.roadLine, 13, 0, z, { cast: false });
  box(21.6, .02, 15.8, '#cfae86', .9, 0, 17.9, { cast: false });    // ③ market: packed earth
  box(18.2, .02, 14.6, '#e9dcc8', 24.2, 0, 18, { cast: false });    // ④ precinct: pale stone
  box(17, .02, 5.8, '#c99a6b', 22, 0, -4.1, { cast: false });       // chinlone field
  for (let x = -4.4; x < 10.4; x += .62) box(.56, .07, .3, '#9d9198', x, 0, -3.58, { cast: false });       // drain slabs (ရေမြောင်း) along the flats
  for (let z = -3.1; z < 5.5; z += .62) box(.3, .07, .56, '#9d9198', -4.78, 0, z, { cast: false });
  for (const [x, z, r] of [[-3.6, -2.2, .45], [6.2, -2.6, .5], [-3.4, 3.2, .4], [4, 14.8, .5], [-5, 18.7, .45], [9.8, -6, .4], [20, 8.2, .5]]) {
    const p = mesh(new THREE.CircleGeometry(r, 14), new THREE.MeshLambertMaterial({ color: PAL.puddle, transparent: true, opacity: .8 }), x, .08, z, { cast: false }); p.rotation.x = -Math.PI / 2;
  }

  // ---------- ① walk-up flats (တိုက်ခန်း) ----------
  // 4 floors of 2.6-wide units round an open stairwell; every balcony gets its own clutter: laundry, pots, a dish, an aircon box.
  const FH = 1.25;
  const grille = new THREE.MeshLambertMaterial({ map: stripeTex('#4f7a68', '#27453c', 10) });
  const stain = new THREE.MeshBasicMaterial({ color: '#3b2a3a', transparent: true, opacity: .1, depthWrite: false });
  function flats(fx, fz, units, rotY, wall, no) {
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
  const gable = (x, y, z, len, r, k = .5) => { const rg = new THREE.CylinderGeometry(r, r, len, 3); rg.rotateX(-Math.PI / 2); rg.rotateY(Math.PI / 2); rg.scale(1, k, 1); return mesh(rg, zinc, x, y, z); }; // triangular prism, ridge along x
  {
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
  }
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

  // ---------- ② the main street: shophouses on the north side, all facing the street ----------
  function shop(x, w, floors, wall, sign, signBg, signFg = '#fff6ea') {
    const D = 2.4, Z = 3.2, H = floors * 1.25;
    box(w, H, D, wall, x, .14, Z);
    box(w + .2, .18, D + .2, PAL.frame, x, H + .14, Z);
    box(w - .3, .95, .06, '#3b3040', x, .14, Z + D / 2);                     // open shop front (dark interior)
    mesh(new THREE.PlaneGeometry(w - .2, .42), new THREE.MeshLambertMaterial({ map: textTex(sign, signBg, signFg, 512, 110, 52) }), x, 1.32, Z + D / 2 + .04, { cast: false });
    for (let f = 1; f < floors; f++) {
      const y = .14 + f * 1.25;
      for (let wx = -w / 2 + .7; wx < w / 2 - .3; wx += 1.3) { box(.62, .74, .06, PAL.frame, x + wx, y + .2, Z + D / 2); box(.46, .6, .08, PAL.window, x + wx, y + .27, Z + D / 2); }
      box(w - .2, .08, .45, PAL.frame, x, y, Z + D / 2 + .22);
      for (let r = -w / 2 + .2; r <= w / 2 - .19; r += .275) box(.04, .34, .04, PAL.frame, x + r, y + .08, Z + D / 2 + .42);
      box(w - .2, .05, .05, PAL.frame, x, y + .42, Z + D / 2 + .42);
    }
    if (rnd() < .7) cyl(.28, .28, .55, '#2b2730', x + w / 2 - .5, H + .14, Z - .4, 10);
    const awn = mesh(new THREE.BoxGeometry(w - .1, .05, .75), new THREE.MeshLambertMaterial({ map: stripeTex('#fff1e0', pick(['#e07a7a', '#6fa98a', '#7a8fd0', '#e0a84f'])) }), x, 1.08, Z + D / 2 + .37);
    awn.rotation.x = .25;
    solid(x, Z, w, D + .1);
    return Z + D / 2;
  }
  // tea shop (လက်ဖက်ရည်ဆိုင်): wide, with low tables and tiny stools out on the apron
  const FRONT = shop(13.4, 5.2, 2, '#f4a6a6', 'ရွှေလမင်း လက်ဖက်ရည်ဆိုင်', '#c8553d');
  L.TEA = new THREE.Vector3(13.4, 0, FRONT + .4); L.TABLES = [];
  box(2.2, .8, .6, '#a8744a', 14.6, .14, FRONT - .45); cyl(.18, .2, .4, '#d9dde3', 14.2, .94, FRONT - .45, 10); cyl(.16, .16, .3, '#c0683f', 14.9, .94, FRONT - .45, 10); // counter, kettles
  for (const [tx, tz] of [[11.6, 5.15], [13.2, 5.25], [15.4, 5.2]]) {
    box(.7, .35, .55, '#c8a070', tx, .14, tz); for (const s of [-1, 1]) cyl(.12, .1, .2, pick(['#4fb3d9', '#e0574f', '#8bd17c']), tx + s * .55, .14, tz, 8);
    cyl(.05, .04, .08, '#fff6ea', tx - .1, .49, tz); solid(tx, tz, .7, .55); L.TABLES.push(new THREE.Vector3(tx, 0, tz));
  }
  // barber (ဆံပင်ညှပ်ဆိုင်): chair, mirror, the striped pole
  shop(18.4, 3.0, 2, '#a9d8bf', 'ဆံပင်ညှပ်ဆိုင်', '#3f6fa8');
  box(1.2, .9, .06, '#cfe6f2', 18.0, .5, FRONT + .03); box(.5, .45, .5, '#c8553d', 18.0, .14, FRONT + .4); box(.5, .4, .1, '#c8553d', 18.0, .55, FRONT + .2);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .8, 12), new THREE.MeshLambertMaterial({ map: (() => { const t = stripeTex('#fff6ea', '#e0574f', 6); t.rotation = .6; return t; })() }));
  pole.position.set(19.75, 1.0, FRONT + .2); scene.add(W.keep(pole)); L.spin = [pole];
  cyl(.11, .11, .08, '#d9dde3', 19.75, .56, FRONT + .2, 12); cyl(.11, .11, .08, '#d9dde3', 19.75, 1.36, FRONT + .2, 12);
  L.BARBER = new THREE.Vector3(18.4, 0, FRONT + .9);
  // clothes shop (အထည်ဆိုင်): longyi bolts, shirts on a rail
  shop(22.1, 3.4, 2, '#f7d58b', 'အထည်ဆိုင်', '#7a4a9a');
  for (let i = 0; i < 6; i++) box(.22, .12, .5, pick(['#a8434a', '#4a5aa8', '#3f7a5a', '#7a4a9a', '#e0a84f', '#e9a0b4']), 21.0 + i * .3, .3 + (i % 2) * .12, FRONT + .35);
  box(1.6, .04, .04, '#8f8794', 22.9, 1.0, FRONT + .55);
  for (let i = 0; i < 4; i++) box(.3, .45, .03, pick(['#ff7f6b', '#4fb3d9', '#8bd17c', '#fff6ea', '#2e3a59']), 22.3 + i * .4, .55, FRONT + .55);
  L.CLOTHES = new THREE.Vector3(22.1, 0, FRONT + .9);
  shop(26.4, 3.0, 3, '#9fb7e8', 'ဖုန်း · SIM ကတ်', '#f2c14e', '#2b2730');   // 2015–19: everyone getting their first smartphone
  shop(29.4, 2.6, 2, '#f4c9a8', 'ဆေးဆိုင်', '#3f7a5a');
  shop(32.4, 2.8, 3, '#cfe3d2', 'ကုန်စုံဆိုင်', '#c8553d');
  // (the gap at x 23.8–24.9 is the alley through to the chinlone field)
  // betel stall (ကွမ်းယာဆိုင်) on the apron between the tea shop and the barber
  box(.9, .8, .5, '#6b4a32', 16.4, .14, 5.0); box(.95, .05, .55, '#86b96d', 16.4, .94, 5.0); mesh(new THREE.SphereGeometry(.06, 8, 6), '#e0574f', 16.2, 1.0, 5.0);
  for (const s of [-1, 1]) cyl(.025, .025, 1.3, '#8a5a3a', 16.4 + s * .42, .14, 4.8, 5); box(1.1, .04, .7, '#c8553d', 16.4, 1.44, 4.95);
  solid(16.4, 5.0, .9, .5); L.BETEL = new THREE.Vector3(16.4, 0, 5.6);
  // sugarcane press cart (ကြံရည်)
  box(1.1, .55, .6, '#86b96d', 27.2, .3, 5.2); for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(.2, .04, 6, 12), '#2b2730', 27.2 + s * .35, .3, 5.52, {});
  for (let i = 0; i < 5; i++) { const c = cyl(.03, .03, 1, '#b8a060', 26.8 + i * .08, .85, 5.0, 5); c.rotation.z = .25; }
  solid(27.2, 5.2, 1.1, .6);

  // ---------- chinlone field + a row of small houses behind the shops ----------
  for (let x = 12; x < 33; x += 3.5) {
    const w = 2.8, z = -8.4; box(w, 1.2, 2.2, pick(['#eef1ee', '#f4c9a8', '#cfe3d2', '#f7d58b']), x, .02, z);
    gable(x, 1.6, z, w + .3, 1.45, .45); box(.6, .9, .05, '#6b4a32', x - .6, .02, z + 1.11); box(.6, .45, .05, '#3b2a24', x + .6, .55, z + 1.11);
    solid(x, z, w, 2.2);
  }
  for (const [px, pz] of [[15, -1.6], [29, -1.6]]) { cyl(.04, .04, 1.7, '#d9dde3', px, .02, pz, 5); }
  L.FIELD = new THREE.Vector3(22, 0, -4.6);

  // ---------- ③ open-air market: rows of stalls under striped awnings ----------
  const GOODS = {
    veg: () => [PAL.leaf, PAL.leafLight, '#e0574f', '#7a4a9a'], fruit: () => ['#f2c14e', '#e8954a', '#86b96d'],   // Thingyan: mango season
    flower: () => ['#ffc83d', '#fff6ea', '#f48fb1'], fish: () => ['#9aa3ad', '#c9d2dc', '#e8954a'],
    guns: () => ['#ff7f3f', '#4fb3d9', '#8bd17c', '#f06292'], pots: () => ['#b8653d', '#8a5a3a', '#d9b98f'],
  };
  function stall(x, z, kind, awnC) {
    box(2.0, .7, 1.0, '#a8744a', x, .02, z); box(2.1, .05, 1.1, '#d9b98f', x, .72, z);
    const cs = GOODS[kind]();
    for (let i = 0; i < 10; i++) {
      const gx = x - .8 + (i % 5) * .4, gz = z - .25 + (i >= 5 ? .45 : 0), c = pick(cs);
      if (kind === 'guns') { const g = box(.28, .1, .08, c, gx, .78, gz); g.rotation.y = rnd(); }
      else if (kind === 'fish') { const f = mesh(new THREE.SphereGeometry(.1, 8, 6), c, gx, .8, gz); f.scale.set(1.8, .5, .7); }
      else mesh(new THREE.IcosahedronGeometry(kind === 'pots' ? .14 : .11, 0), c, gx, .85, gz);
    }
    for (const sx of [-1, 1]) for (const szz of [-1, 1]) cyl(.03, .03, 1.9, '#8f8794', x + sx * .95, .02, z + szz * .5, 5);
    const a = mesh(new THREE.BoxGeometry(2.3, .05, 1.4), new THREE.MeshLambertMaterial({ map: stripeTex('#fff1e0', awnC) }), x, 1.95, z + .05); a.rotation.x = .12;
    solid(x, z, 2.0, 1.0);
  }
  const AWN = ['#e07a7a', '#6fa98a', '#7a8fd0', '#e0a84f', '#b388ff'];
  const KINDS = ['veg', 'fruit', 'flower', 'fish', 'guns', 'pots'];
  let k = 0;
  for (const z of [12.6, 16.4]) for (const x of [-7, -3.6, -.2, 3.2, 6.6]) stall(x, z, KINDS[k++ % KINDS.length], AWN[k % AWN.length]);
  for (const x of [-.2, 3.2]) stall(x, 20.2, KINDS[k++ % KINDS.length], AWN[k % AWN.length]);
  // the frond + bamboo yard (အုန်းလက် · ဝါး) at the market's back corner
  const FROND = frondGeo(THREE), frondM = M('#7fae5a', { side: THREE.DoubleSide }), dryM = M('#c8b070', { side: THREE.DoubleSide });
  L.FRONDS = new THREE.Vector3(-6.5, 0, 22.4);
  for (let i = 0; i < 9; i++) { const f = mesh(FROND, i % 3 ? frondM : dryM, -8.4 + rnd() * .3, .1 + i * .05, 21.2 + (i % 3) * .5); f.scale.setScalar(2.4); f.rotation.y = rnd() * .2; }
  for (let i = 0; i < 7; i++) { const b = cyl(.05, .05, 3.2, PAL.bamboo, -5.2 + i * .14, .02, 20.9, 6); b.rotation.x = -.35; }
  box(1.6, .5, .9, '#8a5a3a', -6.0, .02, 23.4); solid(-7.3, 21.8, 2.6, 1.6); solid(-5.0, 20.6, 1.2, .6); solid(-6.0, 23.4, 1.6, .9);
  // mohinga stall (မုန့်ဟင်းခါး): big pot on a charcoal stove, low tables
  L.MOHINGA = new THREE.Vector3(8.2, 0, 22.0);
  cyl(.45, .4, .5, '#5a4a4a', 8.2, .02, 21.4, 12); cyl(.42, .36, .55, '#9aa3ad', 8.2, .52, 21.4, 14); cyl(.4, .4, .02, '#d9a04a', 8.2, 1.07, 21.4, 14);
  for (const [tx, tz] of [[7.0, 22.6], [9.4, 22.6]]) { box(.6, .3, .5, '#c8a070', tx, .02, tz); cyl(.1, .1, .16, '#4fb3d9', tx + .45, .02, tz, 8); solid(tx, tz, .6, .5); }
  mesh(new THREE.PlaneGeometry(1.6, .4), new THREE.MeshLambertMaterial({ map: textTex('မုန့်ဟင်းခါး', '#c8553d', '#fff6ea', 512, 120, 64), side: THREE.DoubleSide }), 8.2, 2.0, 20.9, { cast: false });
  for (const s of [-1, 1]) cyl(.03, .03, 2.1, '#8f8794', 8.2 + s * .8, .02, 20.9, 5);
  solid(8.2, 21.4, 1.0, 1.0);
  // lights + electrics stall (မီးကြိုးဆိုင်): strings of bulbs hanging off the awning
  L.LIGHTS = new THREE.Vector3(3.2, 0, 23.2);
  stall(3.2, 22.6, 'pots', '#3f6fa8');
  for (let i = 0; i < 14; i++) mesh(new THREE.SphereGeometry(.05, 6, 4), new THREE.MeshBasicMaterial({ color: [new THREE.Color(2.8, 2.3, 1.2), new THREE.Color(2.8, 1.4, 1.4), new THREE.Color(1.3, 2.4, 2.8)][i % 3] }), 2.2 + i * .15, 1.8 - Math.sin(i / 13 * Math.PI) * .3, 23.15, { cast: false });
  // market sign facing the cross street
  for (const s of [-1, 1]) cyl(.06, .06, 3, '#c8553d', 11.4, .02, 15 + s * 1.6, 6);
  mesh(new THREE.PlaneGeometry(3.4, .6), new THREE.MeshLambertMaterial({ map: textTex('ရပ်ကွက် ဈေး', '#c8553d', '#ffe7a3', 512, 90, 60), side: THREE.DoubleSide }), 11.45, 2.7, 15, { cast: false }).rotation.y = Math.PI / 2;

  // ---------- ④ pagoda precinct: low white wall, chinthe at the gate, zedi, monastery, pond, well ----------
  const wallSeg = (x0, z0, x1, z1) => { const len = Math.hypot(x1 - x0, z1 - z0), along = Math.abs(x1 - x0) > Math.abs(z1 - z0);
    box(along ? len : .25, .7, along ? .25 : len, '#fbf4e6', (x0 + x1) / 2, .02, (z0 + z1) / 2); solid((x0 + x1) / 2, (z0 + z1) / 2, along ? len : .25, along ? .25 : len); };
  wallSeg(15, 10.6, 33.4, 10.6); wallSeg(15, 10.6, 15, 16.0); wallSeg(15, 19.0, 15, 25.4); wallSeg(15, 25.4, 33.4, 25.4); wallSeg(33.4, 10.6, 33.4, 25.4);
  for (const s of [16.0, 19.0]) { // chinthe (ခြင်္သေ့) guarding the gate
    box(.6, .7, .6, '#fbf4e6', 14.8, .02, s); const g = new THREE.Group(); g.position.set(14.8, .72, s); scene.add(g);
    box(.5, .45, .3, '#fbf4e6', 0, 0, 0, { parent: g }); mesh(new THREE.SphereGeometry(.22, 10, 8), '#fbf4e6', .05, .55, 0, { parent: g });
    mesh(new THREE.TorusGeometry(.2, .07, 6, 12), '#f2c14e', .05, .55, 0, { parent: g }).rotation.y = Math.PI / 2;
    for (const e of [-1, 1]) mesh(new THREE.SphereGeometry(.035, 6, 4), '#c8553d', .25, .6, e * .08, { parent: g });
  }
  L.GATE = new THREE.Vector3(15.6, 0, 17.5);
  { // the zedi on its terraces
    const X = 25, Z = 15.2, s = 1.7, zgold = new THREE.MeshStandardMaterial({ color: '#e0a83f', metalness: 1, roughness: .42 });
    cyl(1.35 * s, 1.45 * s, .3 * s, PAL.white, X, .02, Z, 8); cyl(1.05 * s, 1.15 * s, .3 * s, PAL.white, X, .02 + .3 * s, Z, 8); cyl(.8 * s, .9 * s, .3 * s, PAL.white, X, .02 + .6 * s, Z, 8);
    const bell = mesh(new THREE.SphereGeometry(.72 * s, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), zgold, X, .02 + .9 * s, Z); bell.scale.y = 1.25;
    mesh(new THREE.CylinderGeometry(.35 * s, .55 * s, .35 * s, 16), zgold, X, .02 + 1.98 * s, Z); mesh(new THREE.CylinderGeometry(0, .32 * s, 1.5 * s, 16), zgold, X, .02 + 2.9 * s, Z);
    mesh(new THREE.SphereGeometry(.09 * s, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.6, 1.5) }), X, .02 + 3.7 * s, Z);
    for (const [dx, dz] of [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]]) { cyl(.18, .22, .5, PAL.white, X + dx, .02, Z + dz, 8); mesh(new THREE.ConeGeometry(.16, .5, 8), zgold, X + dx, .77, Z + dz); } // corner shrines
    solid(X, Z, 2.9 * s, 2.9 * s);
    L.ZEDI = new THREE.Vector3(X, 0, Z);
  }
  { // the bell on its frame (ခေါင်းလောင်း)
    for (const s of [-1, 1]) cyl(.05, .05, 1.6, '#8a5a38', 19.5 + s * .45, .02, 12.4, 6); box(1.1, .1, .1, '#8a5a38', 19.5, 1.6, 12.4);
    const b = mesh(new THREE.CylinderGeometry(.18, .3, .5, 14), new THREE.MeshStandardMaterial({ color: '#c99a4a', metalness: .9, roughness: .4 }), 19.5, 1.05, 12.4);
    solid(19.5, 12.4, 1.1, .4); L.BELL = new THREE.Vector3(19.5, 0, 12.4);
  }
  { // monastery (ဘုန်းကြီးကျောင်း): teak hall on stilts, tiered roof, steps down to the yard
    const X = 21.5, Z = 20.6, w = 6, d = 3.6;
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) cyl(.08, .08, 1.0, '#6b4a32', X - w / 2 + .3 + i * (w - .6) / 3, .02, Z + s * (d / 2 - .25), 6);
    box(w + .4, .14, d + .4, '#8a5a38', X, 1.0, Z);
    mesh(new THREE.BoxGeometry(w, 1.4, d), plankM, X, 1.84, Z);
    for (let i = 0; i < 4; i++) box(.55, .7, .06, '#3b2a24', X - 2.2 + i * 1.45, 1.9, Z + d / 2 + .01);
    for (const [y, r, h] of [[2.55, 4.6, .9], [3.25, 3.3, .7], [3.8, 2.2, .55]]) { const t = mesh(new THREE.CylinderGeometry(r * .45, r, h, 4), '#7a3b2e', X, y + h / 2, Z); t.rotation.y = Math.PI / 4; t.scale.set(1.25, 1, .78); }
    cyl(0, .12, .6, '#f2c14e', X, 4.35, Z, 6);
    for (let i = 0; i < 5; i++) box(1.2, .14, .3, '#8a5a38', X, .02 + i * .2, Z + d / 2 + .35 + (4 - i) * .3 - .15);
    solid(X, Z, w + .4, d + .4); solid(X - 1.0, Z + d / 2 + 1, .2, 1.4); solid(X + 1.0, Z + d / 2 + 1, .2, 1.4);
    L.MONASTERY = new THREE.Vector3(X, 0, Z + d / 2 + 1.9);
  }
  { // fish pond (ကန်) and the well (ရေတွင်း)
    const X = 30.2, Z = 21.2;
    cyl(2.1, 2.2, .3, '#d9cdb8', X, .02, Z, 24); mesh(new THREE.CircleGeometry(1.9, 24), new THREE.MeshLambertMaterial({ color: '#7fc6d9' }), X, .33, Z, { cast: false }).rotation.x = -Math.PI / 2;
    for (let i = 0; i < 4; i++) mesh(new THREE.CircleGeometry(.28, 10), PAL.leafLight, X - 1 + rnd() * 2, .34, Z - 1 + rnd() * 2, { cast: false }).rotation.x = -Math.PI / 2; // lily pads
    solid(X, Z, 4.2, 4.2); L.POND = new THREE.Vector3(X - 2.4, 0, Z);
    const WX = 17.4, WZ = 23.4;
    cyl(.5, .55, .6, '#9aa3ad', WX, .02, WZ, 14); mesh(new THREE.CircleGeometry(.42, 14), '#2a3a4a', WX, .63, WZ, { cast: false }).rotation.x = -Math.PI / 2;
    for (const s of [-1, 1]) cyl(.04, .04, 1.4, '#8a5a38', WX + s * .55, .02, WZ, 5); box(1.2, .06, .06, '#8a5a38', WX, 1.42, WZ);
    solid(WX, WZ, 1.2, 1.2); L.WELL = new THREE.Vector3(WX + .9, 0, WZ);
  }
  // coconut palms (အုန်းပင်) in the precinct and the market corner: curved trunk, a crown of fronds
  function palm(x, z, h = 3.4, lean = .5) {
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, 0, z), new THREE.Vector3(x + lean * .2, h * .6, z + lean * .3), new THREE.Vector3(x + lean * .7, h, z + lean));
    mesh(new THREE.TubeGeometry(curve, 10, .1, 6), '#9a7a5a'); const top = curve.getPoint(1);
    for (let i = 0; i < 8; i++) { const f = mesh(FROND, frondM, top.x, top.y, top.z); f.scale.setScalar(1.7); f.rotation.set(0, i / 8 * Math.PI * 2, -.45); }
    for (let i = 0; i < 3; i++) mesh(new THREE.SphereGeometry(.1, 8, 6), '#7a8a3a', top.x + Math.cos(i * 2.1) * .12, top.y - .12, top.z + Math.sin(i * 2.1) * .12);
    solid(x, z, .4, .4);
  }
  palm(32.2, 12.2, 3.6, -.6); palm(16.4, 11.8, 3.0, .5); palm(32.4, 24.4, 3.3, -.5); palm(-9, 24.8, 3.2, .6); palm(10.6, 24.6, 3.0, -.4);
  { // a big shade tree (ညောင်ပင်) by the zedi
    cyl(.25, .35, 1.6, PAL.trunk, 29.5, .02, 12.8, 7);
    for (const [ox, oy, oz, r] of [[0, 2.2, 0, 1.3], [.8, 1.9, .4, .9], [-.8, 2.0, -.3, .95], [.1, 2.9, -.1, .9]]) mesh(new THREE.IcosahedronGeometry(r, 0), PAL.leaf, 29.5 + ox, oy, 12.8 + oz);
    solid(29.5, 12.8, .8, .8);
  }

  // ---------- street furniture: padauk trees, poles + tangled cables, Thingyan bunting across the street ----------
  padauk(2.2, -4.4, .8); padauk(7.7, 2.6, .95); padauk(-1.3, 5.1, .8);
  for (const [x, z, s] of [[-6.5, 9.45, .8], [5.6, 9.45, .75], [17.5, 9.45, .8], [29.5, 9.45, .8], [12.2, -1.0, .85], [33, -4, .9], [-8.5, 13.9, .85]]) padauk(x, z, s);
  const poleAt = ([x, z], h = 3.6) => { cyl(.06, .08, h, '#8f8794', x, .02, z, 6); box(.7, .06, .06, '#8f8794', x, h - .15, z); return new THREE.Vector3(x, h - .1, z); };
  const [p1, p2, p3, p4, p5] = [[-5.0, -3.85], [1.6, -3.85], [7.1, -3.85], [-5.0, 1.4], [-5.0, 5.4]].map(p => poleAt(p));
  box(.5, .6, .4, '#9aa3ad', 1.6, 2.4, -3.55);
  const off = (v, x = 0, y = 0, z = 0) => v.clone().add(new THREE.Vector3(x, y, z));
  for (const [a, b, d] of [[p1, p2, .6], [off(p1, 0, -.12), off(p2, 0, -.12), .9], [p2, p3, .55], [off(p2, 0, -.1), off(p3, 0, -.1), .8], [p1, p4, .7], [off(p1, .2), off(p4, .2), .95], [p4, p5, .6], [off(p4, 0, -.1), off(p5, 0, -.1), .85]]) sag(a, b, d);
  for (const [p, t, d] of [[p1, [-6.2, 4.2, -5.0], .3], [p2, [-.4, 3.8, -5.0], .35], [p2, [.9, 4.6, -5.0], .25], [p3, [4.2, 2.9, -4.75], .3], [p3, [6.6, 2.9, -4.75], .2], [p4, [-5.75, 3.7, .6], .25], [p5, [-5.75, 4.4, 3.4], .3], [p3, [7.6, 3.1, 1.4], .6]]) sag(p, new THREE.Vector3(...t), d);
  const north = [-8, -1, 6, 11, 16, 21, 26, 31].map(x => poleAt([x, 6.3])), south = [-8, -1, 6, 11, 16, 21, 26, 31].map(x => poleAt([x + .4, 9.5], 3.3));
  for (let i = 0; i + 1 < north.length; i++) { sag(north[i], north[i + 1], .6); sag(off(north[i], 0, -.12), off(north[i + 1], 0, -.12), .85); sag(south[i], south[i + 1], .5); }
  sag(p5, north[1], .4);
  const bunting = (a, b, drop) => {
    const mid = a.clone().lerp(b, .5); mid.y -= drop; const cv = new THREE.QuadraticBezierCurve3(a, mid, b); sag(a, b, drop);
    for (let i = 1; i < 16; i++) { const p = cv.getPoint(i / 16); const t = mesh(new THREE.ConeGeometry(.12, .24, 3), pick([PAL.padauk, PAL.pink, PAL.mint, '#9fb7e8', PAL.red]), p.x, p.y - .14, p.z, { cast: false }); t.rotation.x = Math.PI; }
  };
  for (let i = 0; i < north.length; i += 2) bunting(off(north[i], 0, -.3), off(south[i], 0, -.3), .5); // paper flags across the street, Thingyan colours
  cyl(.05, .06, 3.2, PAL.bamboo, -1.1, .02, -.5, 6); bunting(new THREE.Vector3(-5.75, 3.4, 2.4), new THREE.Vector3(-1.1, 3.1, -.5), .5);
  bunting(new THREE.Vector3(12, 3.0, 9.6), new THREE.Vector3(14.6, 2.8, 16), .4); // down the market street

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
