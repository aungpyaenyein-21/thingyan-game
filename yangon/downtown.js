// yangon/downtown.js — ⑤ downtown on day 1 (STORY.md §၄): the Sule Pagoda roundabout, the big stage in front of City Hall,
// Maha Bandula Park and its monument, pandals along the streets, a float circling Sule, crowds dancing in the hoses.
// Era 2015–19: floats still allowed. The stage is a generic city mandat — no officials, no state symbols (STORY.md §၈).
// Favour #9: the water crew will give you a brass sprinkler for the kids' mandat, once you've been soaked at all three stages.
import { createWorld, PAL } from '../world.js?v=3';
import { shwedagon, MM } from './set.js?v=2';
import { createHud, play } from './hud.js?v=2';
import { makePlayer } from './wardrobe.js?v=2';
import { load, save as store, finish, travel, party as partyOf, ITEMS, NEED } from './save.js?v=2';
import { createSound } from '../sound.js?v=1';

const S = load(); S.at = 'downtown';
const save = () => store(S);
const party = () => partyOf(S);

const BOUNDS = { x0: -16, x1: 28, z0: -14, z1: 22 };
const RING = 8, ISLAND = 4.6; // Sule roundabout: asphalt ring out to RING, the pagoda island inside ISLAND
const ROADS = [
  { x0: -16, x1: 28, z0: -2, z1: 2, h: .045, c: PAL.road },        // Maha Bandula Road (east–west)
  { x0: -2, x1: 2, z0: -14, z1: 22, h: .045, c: PAL.road },        // Sule Pagoda Road (north–south)
  { x0: -16, x1: 28, z0: -3, z1: -2, h: .14, c: PAL.walk }, { x0: -16, x1: 28, z0: 2, z1: 3, h: .14, c: PAL.walk },
  { x0: -3, x1: -2, z0: -14, z1: 22, h: .14, c: PAL.walk }, { x0: 2, x1: 3, z0: -14, z1: 22, h: .14, c: PAL.walk },
];
const ground = (x, z) => { const r = Math.hypot(x, z); if (r < RING) return .045; for (const q of ROADS) if (x > q.x0 && x < q.x1 && z > q.z0 && z < q.z1) return q.h; return .01; };
const AREAS = [
  { name: '⑤ ဆူးလေ အဝိုင်း', short: '', x0: -8, x1: 8, z0: -8, z1: 8, c: '#c9b6d6' },
  { name: '⑤ မြို့တော်ခန်းမ ရှေ့', short: 'မ', x0: 3, x1: 28, z0: -14, z1: 2, c: '#efe6cf' },
  { name: '⑤ မဟာဗန္ဓုလ ပန်းခြံ', short: 'ပ', x0: 3, x1: 28, z0: 2, z1: 22, c: '#9cc58a' },
  { name: '⑤ မဏ္ဍပ်တန်း', short: '', x0: -16, x1: -3, z0: -14, z1: 22, c: '#f2d39a' },
  { name: '⑤ မဏ္ဍပ်တန်း', short: '', x0: -3, x1: 3, z0: -14, z1: 22, c: '#c9b6d6' },
];
const areaAt = (x, z) => AREAS.find(a => x > a.x0 && x < a.x1 && z > a.z0 && z < a.z1);

const W = createWorld({ bounds: BOUNDS, ground, paintSky: shwedagon, camBounds: { x0: -9, x1: 21, z0: -7, z1: 15 }, view: 17 });
const { THREE, scene, M, mesh, box, cyl, textTex, stripeTex, bubbleTex, solid, bean, rnd, pick } = W;
const hud = createHud(W);
const sound = createSound(W); W.onFx = (n, p) => sound.fx(n, p);
const v = new THREE.Vector3();
const gold = new THREE.MeshStandardMaterial({ color: '#e0a83f', metalness: 1, roughness: .42 });
const bulbM = [new THREE.Color(2.8, 2.3, 1.2), new THREE.Color(2.8, 1.4, 1.4), new THREE.Color(1.3, 2.4, 2.8)].map(c => new THREE.MeshBasicMaterial({ color: c }));

// ---------- ground ----------
{
  const B = BOUNDS, sx = B.x1 - B.x0, sz = B.z1 - B.z0, cx = (B.x0 + B.x1) / 2, cz = (B.z0 + B.z1) / 2;
  box(sx, 1.4, sz, PAL.soil, cx, -1.4, cz); box(sx - .6, .5, sz - .6, PAL.soilDark, cx, -1.9, cz, { cast: false });
  box(sx - .02, .06, sz - .02, '#d9cdb8', cx, -.05, cz, { cast: false }); // downtown: paved everywhere
  for (const q of [...ROADS].reverse()) box(q.x1 - q.x0, q.h, q.z1 - q.z0, q.c, (q.x0 + q.x1) / 2, 0, (q.z0 + q.z1) / 2, { cast: false });
  const ring = mesh(new THREE.CircleGeometry(RING, 48), PAL.road, 0, .046, 0, { cast: false }); ring.rotation.x = -Math.PI / 2;
  const lane = mesh(new THREE.RingGeometry(6.15, 6.3, 64), PAL.roadLine, 0, .05, 0, { cast: false }); lane.rotation.x = -Math.PI / 2;
  for (let x = B.x0 + .6; x < B.x1; x += 1.4) if (Math.abs(x) > RING) box(.7, .05, .1, PAL.roadLine, x, 0, 0, { cast: false });
  for (let z = B.z0 + .6; z < B.z1; z += 1.4) if (Math.abs(z) > RING) box(.1, .05, .7, PAL.roadLine, 0, 0, z, { cast: false });
  box(23.6, .06, 18.6, '#86b96d', 15.6, 0, 12.6, { cast: false });
  for (const [x0, z0, x1, z1] of [[3.4, 12.2, 27.8, 13], [15.2, 3.4, 16, 21.8]]) box(x1 - x0, .07, z1 - z0, '#e6c9a8', (x0 + x1) / 2, 0, (z0 + z1) / 2, { cast: false }); // park paths
}

// ---------- Sule Pagoda on its island, ringed by little shops ----------
{
  cyl(ISLAND, ISLAND, .35, '#fbf4e6', 0, .02, 0, 8);
  for (let i = 0; i < 16; i++) { // the ring of shops round Sule's base
    const a = i / 16 * Math.PI * 2 + .2, r = ISLAND - .55, g = new THREE.Group(); g.position.set(Math.sin(a) * r, .37, Math.cos(a) * r); g.rotation.y = a; scene.add(g);
    box(1.4, .9, .8, pick(['#f4c9a8', '#cfe3d2', '#f7d58b', '#e9c8d8']), 0, 0, 0, { parent: g }); box(1.3, .5, .04, '#3b3040', 0, .1, .41, { parent: g });
    mesh(new THREE.BoxGeometry(1.5, .05, .5), new THREE.MeshLambertMaterial({ map: stripeTex('#fff1e0', pick(['#e07a7a', '#6fa98a', '#7a8fd0'])) }), 0, .95, .5, { parent: g }).rotation.x = .25;
  }
  const s = 2.4, Y = .37;
  cyl(1.35 * s, 1.45 * s, .3 * s, PAL.white, 0, Y, 0, 8); cyl(1.05 * s, 1.15 * s, .3 * s, PAL.white, 0, Y + .3 * s, 0, 8); cyl(.8 * s, .9 * s, .3 * s, gold, 0, Y + .6 * s, 0, 8);
  const bell = mesh(new THREE.SphereGeometry(.72 * s, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), gold, 0, Y + .9 * s, 0); bell.scale.y = 1.35;
  mesh(new THREE.CylinderGeometry(.35 * s, .55 * s, .35 * s, 16), gold, 0, Y + 2.05 * s, 0); mesh(new THREE.CylinderGeometry(0, .32 * s, 1.7 * s, 16), gold, 0, Y + 3.05 * s, 0);
  for (const [y, r] of [[2.5, .26], [2.8, .2], [3.05, .15]]) mesh(new THREE.TorusGeometry(r * s, .03 * s, 6, 16), gold, 0, Y + y * s, 0).rotation.x = Math.PI / 2;
  mesh(new THREE.SphereGeometry(.1 * s, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.6, 1.5) }), 0, Y + 3.95 * s, 0);
  solid(0, 0, ISLAND * 1.7, ISLAND * 1.7);
}
const SULE = new THREE.Vector3(3.6, 0, 3.6);

// ---------- City Hall: cream colonial block with Burmese tiered roofs; the big mandat in front of it ----------
const HALL = { x: 14, z: -9, w: 16, d: 6.4 };
{
  const { x: X, z: Z, w, d } = HALL, H = 4.2, cream = '#efe6cf', roofC = '#6f8f86';
  box(w, H, d, cream, X, .02, Z); box(w + .3, .2, d + .3, '#fff7ea', X, H, Z);
  for (let i = 0; i < 9; i++) { const ax = X - w / 2 + 1 + i * (w - 2) / 8; box(.9, 1.4, .08, '#5a4a52', ax, .02, Z + d / 2); mesh(new THREE.CylinderGeometry(.45, .45, .08, 12, 1, false, 0, Math.PI), '#5a4a52', ax, 1.42, Z + d / 2).rotation.set(Math.PI / 2, 0, 0); } // arcade
  for (let f = 0; f < 2; f++) for (let i = 0; i < 12; i++) { const wx = X - w / 2 + .8 + i * (w - 1.6) / 11; box(.5, .8, .06, '#fff7ea', wx, 1.9 + f * 1.1, Z + d / 2); box(.36, .66, .08, PAL.window, wx, 1.97 + f * 1.1, Z + d / 2); }
  const tiers = (tx, tz, base, n, y0) => { for (let i = 0; i < n; i++) { const r = base * (1 - i * .22), t = mesh(new THREE.CylinderGeometry(r * .55, r, .55, 4), roofC, tx, y0 + i * .6 + .28, tz); t.rotation.y = Math.PI / 4; } cyl(0, .1, .9, '#f2c14e', tx, y0 + n * .6, tz, 6); };
  box(4, 1.6, 3.4, cream, X, H, Z + .4); tiers(X, Z + .4, 3.0, 4, H + 1.6);                  // central tower
  for (const s of [-1, 1]) { box(2.2, .9, 2.2, cream, X + s * (w / 2 - 1.2), H, Z + 1.6); tiers(X + s * (w / 2 - 1.2), Z + 1.6, 1.8, 3, H + .9); } // corner pavilions
  mesh(new THREE.PlaneGeometry(3.4, .5), new THREE.MeshLambertMaterial({ map: textTex('မြို့တော်ခန်းမ', '#fff7ea', '#5a4a52', 512, 80, 54) }), X, H + .8, Z + 2.12, { cast: false });
  solid(X, Z, w, d);
}
// the big mandat: wide platform, gold-trimmed red roof, banner, speaker stacks, dancers, a row of hoses over the street
const STAGE = { x: 14, z: -4.6, w: 14, d: 2.8 };
const emitters = [];
{
  const { x: X, z: Z, w, d } = STAGE, top = 1.4;
  box(w, top, d, '#c8553d', X, .02, Z); box(w + .2, .1, d + .2, '#f2c14e', X, top, Z);
  for (let i = -w / 2; i <= w / 2; i += .35) box(.05, top - .1, .05, '#f2c14e', X + i, .05, Z + d / 2 + .02, { cast: false });
  for (const px of [-w / 2 + .2, -w / 4, 0, w / 4, w / 2 - .2]) cyl(.12, .12, 3.4, '#f2c14e', X + px, top, Z + d / 2 - .2, 8);
  box(w + .6, .25, d + .8, '#c8553d', X, top + 3.4, Z + .1); box(w + .7, .12, d + .9, '#f2c14e', X, top + 3.65, Z + .1);
  const roof = mesh(new THREE.CylinderGeometry(1.2, 3.2, 1.6, 4), '#c8553d', X, top + 4.6, Z); roof.rotation.y = Math.PI / 4; roof.scale.set(2.9, 1, .65);
  cyl(0, .2, 1.2, '#f2c14e', X, top + 5.4, Z, 6);
  for (let i = 0; i < 16; i++) { mesh(new THREE.ConeGeometry(.16, .5, 4), gold, X - w / 2 + .4 + i * (w - .8) / 15, top + 3.95, Z + d / 2 + .5); } // gold flame crest
  mesh(new THREE.PlaneGeometry(9, 1.1), new THREE.MeshLambertMaterial({ map: textTex('ရန်ကုန် သင်္ကြန် မဏ္ဍပ်', '#c8553d', '#ffe7a3', 1024, 128, 84) }), X, top + 2.85, Z + d / 2 + .52, { cast: false });
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) box(.8, .7, .7, '#26222b', X + s * (w / 2 - .6), top + k * .72, Z - .6);
  for (let i = 0; i < 40; i++) { const t = i / 39; W.keep(mesh(new THREE.SphereGeometry(.07, 6, 4), bulbM[i % 3], X - w / 2 + t * w, top + 3.25 - Math.sin(t * Math.PI) * .35, Z + d / 2 + .55, { cast: false })); }
  for (let i = 0; i < 6; i++) { const hx = X - w / 2 + 1.5 + i * (w - 3) / 5; const h = cyl(.06, .06, .8, '#4f9fbd', hx, top + .2, Z + d / 2, 6); h.rotation.x = 1.0; emitters.push({ p: new THREE.Vector3(hx, top + .7, Z + d / 2 + .4), d: new THREE.Vector3(0, .55, 1).normalize(), k: 4.3 }); }
  for (let i = 0; i < 4; i++) box(1.6, .2, .4, '#c8553d', X - w / 2 - .9, .02 + i * .35, Z + d / 2 - .4 - i * .4); // steps up at the west end
  solid(X, Z, w, d);
}
// two street pandals: west along Maha Bandula Road, and on Sule Pagoda Road south of the roundabout
function pandal(x, z, rot, name, color) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); const o = { parent: g }, top = .9;
  box(6, top, 2.4, PAL.bamboo, 0, .02, 0, o);
  for (const px of [-2.85, 2.85]) for (const pz of [-1.05, 1.05]) cyl(.08, .08, 2.6, PAL.bamboo, px, top, pz, 6, o);
  const r = mesh(new THREE.CylinderGeometry(0, 2.2, 1.1, 4, 1), color, 0, top + 3.1, 0, o); r.rotation.y = Math.PI / 4; r.scale.set(1.95, 1, .8);
  box(6.2, .12, 2.7, '#f2c14e', 0, top + 2.6, 0, o);
  mesh(new THREE.PlaneGeometry(4.6, .7), new THREE.MeshLambertMaterial({ map: textTex(name, color, '#ffe7a3', 512, 90, 52) }), 0, top + 2.15, 1.22, { ...o, cast: false });
  for (let i = 0; i < 14; i++) { const t = mesh(new THREE.ConeGeometry(.13, .26, 3), pick([PAL.padauk, PAL.pink, PAL.mint, '#9fb7e8', PAL.frame]), -2.4 + i * .37, top + 2.5 - Math.sin(i / 13 * Math.PI) * .2, 1.3, { ...o, cast: false }); t.rotation.x = Math.PI; }
  g.updateMatrixWorld();
  for (const hx of [-1.8, 0, 1.8]) { const p = g.localToWorld(new THREE.Vector3(hx, top + .5, 1.5)), d = new THREE.Vector3(0, .6, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot).normalize(); emitters.push({ p, d, k: 4.6 }); cyl(.06, .06, .6, '#4f9fbd', hx, top, 1.25, 6, o).rotation.x = 1.0; }
  const c = Math.abs(Math.cos(rot)) > .5; solid(x, z, c ? 6 : 2.4, c ? 2.4 : 6);
  return g;
}
pandal(-9.5, -4.6, 0, 'ရပ်ကွက်ပေါင်းစုံ မဏ္ဍပ်', '#3f6fa8');
pandal(-5.4, 11.5, Math.PI / 2, 'ရွှေပိတောက် မဏ္ဍပ်', '#7a4a9a');
// where you get soaked: the crowd zone in front of each stage
const ZONES = [
  { name: 'မဏ္ဍပ်ကြီး', x0: STAGE.x - STAGE.w / 2, x1: STAGE.x + STAGE.w / 2, z0: -3, z1: 2.6, at: new THREE.Vector3(STAGE.x, 0, -.4) },
  { name: 'ရပ်ကွက်ပေါင်းစုံ မဏ္ဍပ်', x0: -12.6, x1: -6.4, z0: -3, z1: 2.6, at: new THREE.Vector3(-9.5, 0, -.4) },
  { name: 'ရွှေပိတောက် မဏ္ဍပ်', x0: -3.6, x1: 1.6, z0: 8.4, z1: 14.6, at: new THREE.Vector3(-1, 0, 11.5) },
];

// ---------- colonial shophouses on the west blocks, the park and its monument ----------
function shophouse(x, z, rot, w, floors, wall) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); const o = { parent: g }, H = floors * 1.2, D = 3;
  box(w, H, D, wall, 0, .02, 0, o); box(w + .2, .25, D + .2, '#fff7ea', 0, H, 0, o); box(w * .5, .5, .3, '#fff7ea', 0, H + .2, D / 2 - .1, o); // parapet with a pediment
  for (let f = 0; f < floors; f++) for (let i = 0; i < Math.round(w / 1.1); i++) {
    const wx = -w / 2 + .55 + i * (w - 1.1) / Math.max(1, Math.round(w / 1.1) - 1), y = .3 + f * 1.2;
    if (f === 0) box(.8, .95, .06, '#5a4a52', wx, .02, D / 2, o);
    else { box(.46, .7, .08, PAL.window, wx, y, D / 2, o); mesh(new THREE.CylinderGeometry(.23, .23, .08, 10, 1, false, 0, Math.PI), PAL.window, wx, y + .7, D / 2, o).rotation.set(Math.PI / 2, 0, 0); box(.6, .06, .2, '#fff7ea', wx, y - .05, D / 2 + .08, o); } // arched windows, sills
  }
  if (rnd() < .6) box(w - .3, .08, .5, '#fff7ea', 0, 1.25, D / 2 + .25, o); // balcony ledge
  const c = Math.abs(Math.cos(rot)) > .5; solid(x, z, c ? w : D, c ? D : w);
}
const WALLS = ['#e9c8a8', '#cfe3d2', '#f4c9a8', '#d9d0e8', '#f7d58b', '#e6c9a8'];
for (const [x, w] of [[-14.4, 2.6], [-5.2, 3.6]]) shophouse(x, -6.5, 0, w, 4, pick(WALLS));
for (const [x, w] of [[-14, 3], [-10.4, 3.6], [-6.2, 3.4]]) shophouse(x, -11.6, 0, w, 3, pick(WALLS));
// the blocks south of the road sit between it and the camera, so they stay low (2 floors) and start back from the kerb
for (const [z, w] of [[5.8, 2.6], [16.4, 4], [20.2, 3]]) shophouse(-4.7, z, Math.PI / 2, w, 2, pick(WALLS));
for (const [z, w] of [[6.4, 3.4], [10.4, 3.4], [15, 3.6], [19.4, 3]]) shophouse(-11.6, z, Math.PI / 2, w, 2, pick(WALLS));
const MONUMENT = new THREE.Vector3(15.6, 0, 12.6);
{ // Maha Bandula Park: lawn, shade trees, benches, the obelisk at the centre
  const { x: X, z: Z } = MONUMENT;
  box(3, .4, 3, '#fbf4e6', X, .02, Z); box(2.2, .4, 2.2, '#fbf4e6', X, .42, Z); box(1.4, .6, 1.4, '#fbf4e6', X, .82, Z);
  const ob = mesh(new THREE.CylinderGeometry(.18, .55, 7, 4), '#fbf4e6', X, 1.42 + 3.5, Z); ob.rotation.y = Math.PI / 4;
  mesh(new THREE.ConeGeometry(.22, .5, 4), '#fbf4e6', X, 8.15, Z).rotation.y = Math.PI / 4;
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const p = mesh(new THREE.CylinderGeometry(.1, .2, 2.4, 4), '#fbf4e6', X + Math.sin(a) * 2.6, 1.22, Z + Math.cos(a) * 2.6); p.rotation.y = Math.PI / 4; }
  solid(X, Z, 3.2, 3.2);
  const tree = (tx, tz, s = 1) => { cyl(.14 * s, .2 * s, 1.5 * s, PAL.trunk, tx, .02, tz, 6); for (const [ox, oy, oz, r] of [[0, 2, 0, .95], [.5, 1.7, .3, .65], [-.5, 1.8, -.25, .7]]) mesh(new THREE.IcosahedronGeometry(r * s, 0), pick([PAL.leaf, PAL.leafLight]), tx + ox * s, oy * s, tz + oz * s); solid(tx, tz, .5, .5); };
  for (const [tx, tz] of [[5.5, 5.5], [9, 4.6], [22, 5], [26, 7.5], [5, 18], [9.5, 20], [21.5, 19.5], [26, 16], [11, 9], [20.5, 9.5]]) tree(tx, tz, .9 + rnd() * .3);
  W.padauk(25.5, 11.4, .9); W.padauk(6.2, 11.2, .85);
  for (const [bx, bz] of [[12, 15.6], [19, 15.6], [12, 9.8]]) { box(1.2, .3, .4, '#8a5a3a', bx, .2, bz); box(1.2, .06, .45, '#a8744a', bx, .5, bz); solid(bx, bz, 1.2, .45); }
}
// poles, cables and bunting down the streets; a bus stop for the ride home
const poleAt = (x, z, h = 3.8) => { cyl(.06, .08, h, '#8f8794', x, .02, z, 6); box(.7, .06, .06, '#8f8794', x, h - .15, z); return new THREE.Vector3(x, h - .1, z); };
const bunting = (a, b, drop) => {
  const mid = a.clone().lerp(b, .5); mid.y -= drop; const cv = new THREE.QuadraticBezierCurve3(a, mid, b); W.sag(a, b, drop);
  for (let i = 1; i < 16; i++) { const p = cv.getPoint(i / 16); const t = mesh(new THREE.ConeGeometry(.12, .24, 3), pick([PAL.padauk, PAL.pink, PAL.mint, '#9fb7e8', PAL.red]), p.x, p.y - .14, p.z, { cast: false }); t.rotation.x = Math.PI; }
};
for (const x of [-14, -10, 10, 18, 25]) { const a = poleAt(x, -2.6), b = poleAt(x + .3, 2.6); bunting(a, b, .45); }
for (const z of [10, 14, 18, -10, -13]) { const a = poleAt(-2.6, z), b = poleAt(2.6, z + .3); bunting(a, b, .45); }
const STOP = new THREE.Vector3(-13.6, 0, -2.6);
{
  const { x: X, z: Z } = STOP;
  box(2.6, 1.7, .08, '#3f6fa8', X, .14, Z - .3); box(2.4, .9, .1, '#9fc4e8', X, .7, Z - .29);
  for (const px of [-1.25, 1.25]) cyl(.05, .05, 2.1, '#d9dde3', X + px, .14, Z + .25, 6);
  box(2.9, .1, 1.0, '#3f6fa8', X, 2.2, Z); box(2, .1, .35, '#d9dde3', X, .5, Z - .1);
  mesh(new THREE.PlaneGeometry(2.3, .4), new THREE.MeshLambertMaterial({ map: textTex('ဆူးလေ မှတ်တိုင်', '#3f6fa8', '#fff6ea', 512, 90, 52) }), X, 2.04, Z + .51, { cast: false });
  solid(X, Z - .2, 2.7, .5);
}

// ---------- the float (ကားပွင့်) circling Sule, revellers dancing on the back ----------
const float = W.keep(new THREE.Group()); scene.add(float);
{
  const o = { parent: float };
  box(1.7, .25, 4.6, '#3b3440', 0, .3, 0, o); box(1.75, 1.0, 1.1, '#3d72c4', 0, .45, 1.9, o); box(1.5, .4, .05, PAL.window, 0, 1.1, 2.46, o);
  box(1.95, .7, 3.5, '#2f73c4', 0, .55, -.5, o);
  for (let z = -2.1; z <= 1.1; z += .3) for (const x of [-.99, .99]) mesh(new THREE.SphereGeometry(.05, 6, 4), bulbM[(z * 10 | 0) & 1], x, 1.28, z - .5 + .5, o);
  mesh(new THREE.TorusGeometry(.95, .06, 6, 24, Math.PI), gold, 0, 1.25, 1.2, o);
  for (const z of [1.6, -1.6]) for (const x of [-.6, .6]) { const w = mesh(new THREE.CylinderGeometry(.3, .3, .22, 12), '#2b2730', x * 1.45, .3, z, o); w.rotation.z = Math.PI / 2; }
}
const riders = [[-.45, -1.2], [.45, -.4], [-.3, .4]].map(([x, z]) => { const r = bean({ x: 0, z: 0, age: 'adult', prop: 'none' }); float.add(r.g); r.g.position.set(x, 1.25, z); r.anim.setLoop('dance'); return r; });
const FL = { a: Math.PI * .75, r: 6.2, speed: .16 };

// ---------- people: the crowd in the hoses, dancers, the water crew, park families ----------
const npc = (o, y) => { const c = bean({ prop: 'none', print: '', ...o }); if (y !== undefined) c.g.position.y = y; return c; };
const DANCER = { hair: 'bun', flower: true, shirt: '#f48fb1', topStyle: 'yinphone', bottom: 'htamein', bottomColor: ['#c98a2e', '#f2c14e'], accent: '#f2c14e', garland: true, age: 'adult', hat: 'none' };
const dancers = [-4.5, -2.2, 0, 2.2, 4.5].map(dx => { const d = npc({ ...DANCER, x: STAGE.x + dx, z: STAGE.z - .2 }, 1.45); d.anim.setLoop('dance'); d.dry = true; return d; });
const crew = [-3, 3].map(dx => npc({ x: STAGE.x + dx, z: STAGE.z + .9, shirt: '#4fb3d9', topStyle: 'tee', bottom: 'shorts', bottomColor: ['#fff6ea', '#4fb3d9'], hat: 'band', accent: '#fff6ea', age: 'adult' }, 1.45));
const boss = npc({ x: STAGE.x - STAGE.w / 2 - .6, z: -1.2, shirt: '#4fb3d9', topStyle: 'tee', bottom: 'shorts', bottomColor: ['#fff6ea', '#4fb3d9'], hat: 'band', accent: '#fff6ea', age: 'adult', hair: 'spiky', ry: Math.PI / 2 });
crew.forEach(c => { c.dry = true; });
const crowd = [];
for (let i = 0; i < 16; i++) { const z = ZONES[i % 3], x = z.x0 + .6 + rnd() * (z.x1 - z.x0 - 1.2), zz = z.z0 + .6 + rnd() * (z.z1 - z.z0 - 1.2); const c = npc({ x, z: zz, ry: rnd() * 6, prop: rnd() < .4 ? 'gun' : 'none' }); if (rnd() < .5) c.anim.setLoop('dance'); crowd.push(c); }
for (const [x, z] of [[10, 16.8], [20.5, 17], [24.2, 13.2], [7.8, 7.6], [-8.4, 6.2], [-8.2, 18.4], [6.2, -4.2], [24.6, -2.6]]) W.idlers.push(npc({ x, z, ry: rnd() * 6, age: pick(['adult', 'adult', 'elder', 'kid']) }));
const iceCream = npc({ x: 7.2, z: 3.6, shirt: '#fff6ea', topStyle: 'shirt', bottom: 'longyi', hat: 'bucket', age: 'adult' });
box(1.1, .7, .6, '#f48fb1', 8.2, .14, 3.5); box(1.2, .05, .7, '#fff6ea', 8.2, .86, 3.5); for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(.2, .04, 6, 12), '#2b2730', 8.2 + s * .35, .3, 3.82); solid(8.2, 3.5, 1.1, .6);
mesh(new THREE.PlaneGeometry(1, .3), new THREE.MeshLambertMaterial({ map: textTex('ရေခဲမုန့်', '#f48fb1', '#fff6ea', 256, 76, 46) }), 8.2, 1.05, 3.81, { cast: false });
W.idlers.push(iceCream);
W.addPet('dog', 'park', 22.5, 14.5); W.addPet('dog', 'walker', 10, 6); W.addPet('cat', 'house', -11, 3.4);

// balloons drifting up from behind the big stage (an opening-night picture everyone remembers)
const balloons = Array.from({ length: 14 }, (_, i) => { const b = W.keep(mesh(new THREE.SphereGeometry(.28, 12, 10), pick(['#e0574f', '#f2c14e', '#4fb3d9', '#8bd17c', '#f48fb1', '#fff6ea']), 0, -9, 0, { cast: false })); b.scale.y = 1.2; b.userData.t = i * .9; return b; });

// ---------- the living street ----------
W.tick((dt, T) => {
  sound.env({ phase: 'day', night: W.night(), street: .5, crowd: .9, water: .9 }); // downtown: a big crowd and the hoses going
  // hoses: pulse on and off, each stage on its own beat
  emitters.forEach((e, i) => { if (Math.sin(T * .8 + i * .7) < -.25 || rnd() < .4) return; const vv = e.d.clone().multiplyScalar(e.k + rnd()); vv.x += (rnd() - .5) * .8; vv.z += (rnd() - .5) * .4; W.spawn(e.p, vv); });
  // float round the ring; riders splash now and then; keep you from under the wheels
  FL.a += FL.speed * dt; float.position.set(Math.sin(FL.a) * FL.r, .05, Math.cos(FL.a) * FL.r); float.rotation.y = FL.a + Math.PI / 2;
  for (const r of riders) if (!r.anim.one && rnd() < dt * .25) r.anim.play('splash');
  { const p = W.player.g.position, d = v.copy(p).sub(float.position).setY(0); if (d.length() < 2.4) { d.setLength(2.4); p.x = float.position.x + d.x; p.z = float.position.z + d.z; W.collide(p); } }
  // crowd: dance, jump, splash whoever is close
  for (const c of crowd) { c.idleT -= dt; if (c.idleT < 0 && !c.anim.one) { const you = c.g.position.distanceTo(W.player.g.position) < 3 && rnd() < .5; if (you) { c.g.rotation.y = Math.atan2(W.player.g.position.x - c.g.position.x, W.player.g.position.z - c.g.position.z); c.anim.play('splash'); } else c.anim.play(pick(['jump', 'wave', 'jump'])); c.idleT = 2 + rnd() * 4; } }
  for (const b of balloons) { b.userData.t += dt; const t = b.userData.t % 12.6; b.position.set(HALL.x - 4 + (b.id % 9), 5 + t * .9, HALL.z + 2 + Math.sin(t + b.id) * .6); b.visible = t < 11; }
  // the soak errand: get wet in front of each stage
  if (S.q.nozzle === 'soak' && W.player.ch.wet > .45) {
    const p = W.player.g.position;
    ZONES.forEach((z, i) => { if (!S.soaked.includes(i) && p.x > z.x0 && p.x < z.x1 && p.z > z.z0 && p.z < z.z1) { S.soaked.push(i); hud.toast(`${z.name} — ရေစိုပြီ! (${MM(S.soaked.length)}/၃)`); if (S.soaked.length >= 3) { S.q.nozzle = 'back'; hud.toast('စိုရွှဲပြီ! ရေပက်အဖွဲ့ ကိုကြီးဆီ ပြန်သွား'); } hud2(); } });
  }
});

// ---------- HUD + talk ----------
const $ = id => document.getElementById(id);
function hud2() {
  const q = S.q.nozzle;
  $('gtext').textContent = S.step === 'arrive' ? 'ရပ်ကွက်ကို ပြန်သွားပြီး ကလေးတွေကို အရင် တွေ့ပါ'
    : q === 'done' ? (S.step === 'quests' || S.step === 'build' ? 'ရေပန်းခေါင်း ရပြီ! ဘတ်စ်ကားနဲ့ ရပ်ကွက်ကို ပြန်ပါ' : 'မြို့လယ် ညလေး… ဘတ်စ်ကားနဲ့ ရပ်ကွက်ကို ပြန်ပြီး ညကား ထွက်ပါ')
    : { ask: 'ရေပန်းခေါင်း — မဏ္ဍပ်ကြီးဘေးက ရေပက်အဖွဲ့ ကိုကြီးကို မေး', soak: `မဏ္ဍပ် ၃ ခုရှေ့မှာ ရေပက်ခံ (${MM(S.soaked.length)}/၃)`, back: 'ရေပက်အဖွဲ့ ကိုကြီးဆီ ပြန်သွား' }[q];
  $('stage').hidden = S.step === 'arrive';
  $('scount').textContent = `${MM(S.parts.length)}/${MM(NEED)}`;
  $('bag').innerHTML = S.gifts ? `<span>လက်ဆောင်ထုပ် ×${MM(S.gifts)}</span>` : '';
  save();
}
const ME = 'ကျွန်တော်', face = (c, t = W.player) => { c.g.rotation.y = Math.atan2(t.g.position.x - c.g.position.x, t.g.position.z - c.g.position.z); };
const talk = (lines, done, who) => { if (who) face(who); hud.talk(lines, done); };
function talkBoss() {
  const K = 'ရေပက်အဖွဲ့ ကိုကြီး', q = S.q.nozzle;
  if (S.step === 'quests' && q === 'ask') return talk([
    [ME, 'အစ်ကို… ရပ်ကွက်က ကလေးတွေ မဏ္ဍပ်လေး ဆောက်နေလို့ပါ။ ရေပန်းခေါင်း အပို တစ်ခု ရနိုင်မလား။'],
    [K, 'ကလေးမဏ္ဍပ်အတွက်လား! ပေးမယ်… ဒါပေမဲ့ မြို့လယ် ရောက်ပြီး ရေမစိုဘဲ ပြန်သွားလို့ မရဘူးကွ!'],
    [K, 'မဏ္ဍပ် သုံးခုလုံးရှေ့မှာ ရေပက်ခံခဲ့ — ဒီမဏ္ဍပ်ကြီး၊ အနောက်ဘက်က ရပ်ကွက်ပေါင်းစုံ မဏ္ဍပ်၊ တောင်ဘက်က ရွှေပိတောက် မဏ္ဍပ်။ စိုရွှဲပြီးမှ ပြန်လာ!'],
  ], () => { S.q.nozzle = 'soak'; S.soaked = []; hud2(); hud.toast('မဏ္ဍပ် ၃ ခုမှာ ရေပက်ခံမယ်'); }, boss);
  if (q === 'back') return talk([
    [K, 'ဟား ဟား! စိုရွှဲနေပြီပဲ! ဒါမှ သင်္ကြန်ပေါ့။'],
    [K, 'ရော့ — ရေပန်းခေါင်း၊ ကြေးဝါ အစစ်။ ခေါင်မိုးပေါ် တပ်လိုက်ရင် ကလေးတွေ ပေါ်ကို မိုးရွာသလို ကျမယ်။'],
  ], () => { const all = finish(S, 'nozzle'); hud2(); hud.toast(`+ ${ITEMS.nozzle}  (${MM(S.parts.length)}/${MM(NEED)})`); boss.anim.play('wave'); if (all) setTimeout(() => talk([['', 'ပစ္စည်း ကိုးမျိုးလုံး စုံပြီ။ ရပ်ကွက်ကို ပြန်ပြီး ကလေးတွေနဲ့ မဏ္ဍပ်လေး ဆောက်ကြစို့!']]), 900); }, boss);
  if (q === 'soak') return talk([[K, `ကျန်သေးတယ်… ${MM(3 - S.soaked.length)} မဏ္ဍပ်။ ရေပိုက်အောက် တည့်တည့် ဝင်ရပ်!`]], null, boss);
  talk([[K, party() ? 'ညဘက် မဏ္ဍပ်မီးတွေ လှတယ်မလား… ရေကတော့ မနက်ဖြန် ဆက်ပက်မယ်!' : 'ရေပက်ခံမလား! လာ လာ!']], null, boss);
}
function openBus() {
  hud.menu({ title: '🚌 ဘတ်စ်ကား ၃၆', close: 'မသွားသေးဘူး', items: [
    { label: '🏠 ရပ်ကွက်ကို ပြန်', note: '①–④', cls: 'go', on: () => { ride(); } },
  ] });
}
async function ride() { hud.cinematic(true); hud.area('🚌 ရပ်ကွက်ကို ပြန်မယ်'); await hud.fade(true, 900); travel(S, 'ward'); }
const nearStage = () => { const p = W.player.g.position; return p.x > STAGE.x - STAGE.w / 2 && p.x < STAGE.x + STAGE.w / 2 && p.z > -3.2 && p.z < -1.6; };
const SPOTS = [
  { at: () => boss.g.position, r: 1.8, label: () => 'ရေပက်အဖွဲ့ ကိုကြီးနဲ့ စကားပြော', goal: () => S.step === 'quests' && ['ask', 'back'].includes(S.q.nozzle), run: talkBoss },
  { at: () => STOP, r: 2.0, label: () => 'ဘတ်စ်ကား စီး', goal: () => S.q.nozzle === 'done' || S.step === 'arrive' || party(), run: openBus },
  { at: () => SULE, r: 2.2, label: () => 'ဆူးလေဘုရား ဖူး', goal: () => false, run: () => { W.player.anim.play('kadaw'); hud.toast('သာဓု သာဓု သာဓု'); } },
  { at: () => v.set(STAGE.x, 0, -2.2), r: 7, label: () => nearStage() ? 'ယိမ်းအဖွဲ့နဲ့ အတူ က' : null, goal: () => false, run: () => { W.player.anim.setLoop('dance'); hud.toast('၁ ကို နှိပ်ရင် ရပ်'); } },
  { at: () => iceCream.g.position, r: 1.6, label: () => 'ရေခဲမုန့် ဝယ်', goal: () => false, run: () => talk([['ရေခဲမုန့်သည်', 'ရေခဲမုန့်~ နို့ရေခဲ~ ရေစိုပြီး ပူနေရင် တစ်ခွက် စားလိုက်!'], [ME, 'တစ်ခွက် ပေး… ငယ်ငယ်က အရသာ အတိုင်းပဲ။']], () => W.player.anim.play('jump'), iceCream) },
];
const goals = () => {
  if (S.step === 'arrive' || S.q.nozzle === 'done') return [STOP];
  if (S.q.nozzle === 'soak') return ZONES.filter((z, i) => !S.soaked.includes(i)).map(z => z.at);
  return [boss.g.position];
};
hud.initMap(AREAS.map(a => ({ ...a, label: a.short })), [{ x0: BOUNDS.x0, x1: BOUNDS.x1, z0: -2, z1: 2 }, { x0: -2, x1: 2, z0: BOUNDS.z0, z1: BOUNDS.z1 }], BOUNDS);
const here = play(W, hud, { spots: SPOTS, goals, areaAt }).here;

W.setPlayer(makePlayer(W, S, STOP.x + 1.4, STOP.z + 1.2, Math.PI / 2)); hud.tool(W.player.ch.tool); W.onTool = t => { S.tool = t; save(); hud.tool(t); };
if (party()) W.setTime(1);
$('title').firstChild.textContent = 'ဆူးလေ · မြို့လယ်';
$('title').querySelector('small').textContent = 'မဏ္ဍပ်တန်း · ဘတ်စ်ကား ၃၆ နဲ့ ရောက်လာ';
$('where').firstChild.textContent = 'အကြိုနေ့ · ၁/၅ · ရန်ကုန် ⑤ ';
hud2(); W.start();
if (new URLSearchParams(location.search).has('debug')) window.zone = { W, S: () => S, SPOTS, boss, ZONES, hud, here, talking: () => hud.talking(), mini: () => hud.mini() };
if (!S.introDown) setTimeout(() => talk([
  ['', 'ဆူးလေ… ငယ်ငယ်က အဖေ့ ပခုံးပေါ် ထိုင်ပြီး လာကြည့်ခဲ့တဲ့ မဏ္ဍပ်တန်း။'],
  ['', 'ဗုံသံ၊ ရေပက်သံ၊ အော်ဟစ်သံ… မြို့တော်ခန်းမရှေ့က မဏ္ဍပ်ကြီး အခုထိ ကြီးတုန်း။'],
], () => { S.introDown = true; save(); }), 1600);
setTimeout(() => $('title').classList.add('gone'), 1400);
