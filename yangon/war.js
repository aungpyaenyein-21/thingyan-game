// yangon/war.js — 「ရပ်ကွက်စစ်」 prototype (SCENARIO.md §၅, DIRECTION.md §၈-ခ): two kid gangs, steel slide-pump squirters fed
// by a jerry can on the back, fought silently on an open lot (or the alleys of two wards split by a creek). Nobody has HP —
// you have grit: get it in the face and it goes faster. At none you're OUT: nobody may spray you, you may only walk back,
// and you're in again once a drink at your own side's water-pot stand (ရေအိုးစင်) has filled your grit — slowly.
// Three rounds of three minutes: a gang that's all OUT at once has lost the round; at the bell, fewer OUTs takes it.
// Most rounds wins the match. Home side has four taps and holds its ground; the
// away side comes with an extra kid, one slow drum, and has to push in (and may use the home side's taps). One kid per tap.
import { createWorld } from '../world.js?v=12';
import { createSound } from '../sound.js?v=3';
import { createFx } from '../fx.js?v=1';
import { createRules, RULE_TEXT } from '../rules.js?v=1';
import { createAI } from './ai.js?v=1';

const P = new URLSearchParams(location.search);
const MODE = P.get('mode'), AUTO = P.has('auto'), ALLEY = P.get('map') === 'alley'; // the open lot by default; the alleys if asked
const B = ALLEY ? { x0: -18, x1: 18, z0: -12, z1: 12 } : { x0: -14, x1: 14, z0: -9, z1: 9 };
const W = createWorld({ bounds: B, ground: () => .01, camBounds: ALLEY ? { x0: -16.5, x1: 16.5, z0: -10.5, z1: 10.5 } : { x0: -8, x1: 8, z0: -4.5, z1: 4.5 }, view: ALLEY ? 15 : innerWidth < innerHeight ? 11.5 : 15 }); // the lot is small: a phone held upright gets closer in
const { THREE, scene, box, mesh, rnd, pick } = W;
const sound = createSound(W);
const $ = id => document.getElementById(id);
const GRAV = -11, CAN = 3.5;
const STATS = { shots: 0, hits: 0, face: 0, fouls: 0 }; // gravity as the town's water uses it; litres in a jerry can

// ---------- T3: three weapons that feel different, the beat of a hit, water you can see, the unwritten rules ----------
// TUNE and WEAPONS are what ?tune edits (lil-gui) — copy the JSON back here once they feel right
const TUNE = { hitStop: .04, outStop: .12, shakeT: .15, shake: 6, squash: .85, vibrate: 30, faceK: 2 };
const WEAPONS = { // cost = share of a full can · grit = what a full hit takes off
  pump: { name: 'ပြွတ်', range: 6, cost: .1, every: .4, grit: .15, speed: 11 }, // a stroke every .4 s while held: 10% of the can a second, −.15 grit a second if it all lands
  balloon: { name: 'ပူဖောင်း', min: 3, range: 9, cost: .15, grit: .35, ring: .8 }, // hold = how far; it goes over walls and round corners
  bucket: { name: 'ပုံး', range: 1.5, cone: 90, cost: 1, grit: .6, push: 1.2, need: .3 }, // the whole can at once, close up (needs 30% in it)
};
const ORDER = Object.keys(WEAPONS), LOW_W = .2; // under 20% the pump goes weak and the can drips
const fx = createFx(W, { low: P.get('q') === 'lite' });
const rules = createRules({ onBreak: (why, from) => ruleLine(why, from) });

// ---------- the set ----------
// lot: an open patch of ground between the two wards — knee-high brick walls and drums to dodge behind, nothing to hide a kid
// alley: two wards of house blocks either side of a creek, two bridges
const HOUSE = ['#efe3c8', '#e8c9a8', '#d8e2c8', '#e6d2e0', '#cfdbe6'], HOUSES = [], LOW = [];
const GROUNDS = [], ground = (geo, c, x, y, z) => { const m = W.keep(mesh(geo, new THREE.MeshLambertMaterial({ color: c, flatShading: true }), x, y, z, { cast: false })); GROUNDS.push(m); return m; }; // its own material, out of the bake: fx.wet() paints it
const BRIDGES = ALLEY ? [{ z0: -1.6, z1: 1.6 }, { z0: 7, z1: 8.2 }] : [];
if (!ALLEY) {
  ground(new THREE.PlaneGeometry(B.x1 - B.x0, B.z1 - B.z0).rotateX(-Math.PI / 2), '#d6c7ad', 0, 0, 0);
  mesh(new THREE.PlaneGeometry(.12, B.z1 - B.z0 - 1).rotateX(-Math.PI / 2), '#efe6d6', 0, .012, 0, { cast: false }); // a chalk line down the middle
  for (const s of [-1, 1]) box(B.x1 - B.x0, 1.1, .3, '#c9b79a', 0, 0, s * (B.z1 + .2)); // the compound walls along the sides
  for (const [x, z, w, d] of [[-6, -4.5, 3, .4], [-6, 4, .4, 2.6], [6, 4.5, 3, .4], [6, -4, .4, 2.6], [-2.6, 0, .4, 2.2], [2.6, 0, .4, 2.2], [-10, 6.5, 2.2, .4], [10, -6.5, 2.2, .4]]) {
    const m = W.keep(box(w, .6, d, '#b5654a', x, 0, z)); W.solid(x, z, w, d); LOW.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, h: .6, m }); // knee-high brick: dodge behind it, but a face shot goes over
  }
  for (const [x, z] of [[-3.5, -6.5], [3.5, 6.5], [0, -2.8], [0, 2.8]]) { const m = W.keep(mesh(new THREE.CylinderGeometry(.42, .38, .9, 12), '#6f8fb0', x, .45, z)); W.solid(x, z, .8, .8); LOW.push({ x0: x - .4, x1: x + .4, z0: z - .4, z1: z + .4, h: .9, m, drum: [x, z] }); }
} else {
for (const s of [-1, 1]) ground(new THREE.PlaneGeometry(B.x1 - 1.3, B.z1 - B.z0).rotateX(-Math.PI / 2), '#d9cfbf', s * (B.x1 + 1.3) / 2, 0, 0); // the two banks
mesh(new THREE.PlaneGeometry(2.6, B.z1 - B.z0).rotateX(-Math.PI / 2), '#5fa3c4', 0, -.04, 0, { cast: false }); // the creek
for (const b of BRIDGES) box(3.2, .08, b.z1 - b.z0, b.z1 - b.z0 > 2 ? '#a99b88' : '#8a6a4a', 0, 0, (b.z0 + b.z1) / 2);
let zc = B.z0; // the creek's banks are walls, except at the bridges
for (const b of [...BRIDGES, { z0: B.z1, z1: B.z1 }]) { if (b.z0 > zc) W.solid(0, (zc + b.z0) / 2, 2.6, b.z0 - zc); zc = b.z1; }
for (const s of [-1, 1]) for (const [x, z, w, d] of [[12.5, -8.5, 5, 5], [5, -8.5, 4, 5], [12.5, 0, 5, 5], [5, 0, 4, 5], [12.5, 8.5, 5, 5], [5, 8.5, 4, 5]]) {
  const h = 2 + rnd(), X = s * x, c = pick(HOUSE);
  W.occluder(() => { // see-through when it stands between the camera and you
    box(w, h, d, c, X, 0, z); box(w + .3, .25, d + .3, '#b0553d', X, h, z); // walls + a tin roof
    for (let k = -1; k <= 1; k += 2) box(.6, .7, .05, '#3b3040', X + k * w * .25, 1, z + d / 2 + .01, { cast: false }); // windows facing the alley
  });
  W.solid(X, z, w, d); HOUSES.push({ x0: X - w / 2, x1: X + w / 2, z0: z - d / 2, z1: z + d / 2, h });
}
}

// ---------- modes: whose ward we fight in ----------
// home: ① (us) defends the west side, taps by our houses; ④ comes over with six. away: we go over to ④ with six.
const HOME = MODE === 'away' ? 'B' : 'A', SIDE = { A: -1, B: 1 };
const REFILL = [];
{ const s = SIDE[HOME], a = HOME === 'A' ? 'B' : 'A';
  const taps = ALLEY ? [[8.6, -4.6], [15.6, 4.4], [8.6, 4.6], [2.4, -5]] : [[12, -5], [12, 5], [8, 0], [5, -7.6]];
  for (const [x, z] of taps) REFILL.push({ x: s * x, z, rate: 1.7, kind: 'tap' }); // the home side's taps, by the houses
  REFILL.push(ALLEY ? { x: SIDE[a] * 3.2, z: -3.2, rate: .55, kind: 'drum' } : { x: SIDE[a] * 5, z: 1, rate: .55, kind: 'drum' }); } // one slow drum for the visitors
const streamMat = new THREE.MeshBasicMaterial({ color: '#8fd3ff', transparent: true, opacity: .8 });
for (const r of REFILL) {
  if (r.kind === 'tap') { box(.18, .9, .18, '#7a7f88', r.x, 0, r.z); box(.36, .08, .12, '#9aa2ac', r.x, .82, r.z + .08); }
  else { mesh(new THREE.CylinderGeometry(.42, .38, .9, 12), '#3f6fa8', r.x, .45, r.z); }
  W.solid(r.x, r.z, .4, .4); r.user = null; // one kid at a time
  r.stream = new THREE.Mesh(new THREE.CylinderGeometry(.035, .05, r.kind === 'tap' ? .78 : .5, 6), streamMat); // water running while someone fills
  r.stream.position.set(r.x + (r.kind === 'tap' ? 0 : .3), r.kind === 'tap' ? .41 : .7, r.z + (r.kind === 'tap' ? .14 : 0)); r.stream.visible = false; scene.add(W.keep(r.stream));
}
// the water-pot stands (ရေအိုးစင်), one at the back of each side: a drink and a sit in the shade — grit comes back, slowly
const REST = {}, REST_R = 1.6, REST_RATE = .07;
for (const t of ['A', 'B']) {
  const s = SIDE[t], x = s * (ALLEY ? 16.8 : 12.9), z = ALLEY ? -4.4 : 0; REST[t] = { x, z, gx: x - s * 1.1 };
  box(.9, .55, .45, '#8a6a4a', x, 0, z); for (const dz of [-.2, .2]) mesh(new THREE.SphereGeometry(.18, 10, 8), '#a5583a', x, .72, z + dz);
  for (const dx of [-.42, .42]) for (const dz of [-.26, .26]) box(.06, 1.45, .06, '#6b5040', x + dx, 0, z + dz);
  box(1.15, .05, .75, '#9aa2ac', x, 1.45, z); W.solid(x, z, .9, .5);
  const ring = new THREE.Mesh(new THREE.RingGeometry(REST_R - .14, REST_R, 36).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#6fd06a', transparent: true, opacity: .45, depthWrite: false }));
  ring.position.set(x, .025, z); scene.add(W.keep(ring)); REST[t].ring = ring;
}
for (const g of GROUNDS) { g.updateMatrixWorld(true); fx.wet(g); }
const atRest = k => Math.hypot(pos(k).x - REST[k.team].x, pos(k).z - REST[k.team].z) < REST_R;

// ---------- the kids ----------
const TEAM = { A: { top: '#2f8fd6', hat: 'none', can: '#f4f1e8' }, B: { top: '#e0574f', hat: 'none', can: '#d8352a' } }; // no headbands: the shirt and the jerry can tell the sides apart (CHARACTERS.md)
const kids = [];
const silver = new THREE.MeshLambertMaterial({ color: '#cfd5dc' }), green = new THREE.MeshLambertMaterial({ color: '#5fe04a' }), red = new THREE.MeshLambertMaterial({ color: '#d8352a' }),
  white = new THREE.MeshLambertMaterial({ color: '#f4f1e8' });
function gear(ch, canColor) { // the pump in the right hand, the jerry can on the back, the red hose between
  const hand = ch.arms[1].hand, g = new THREE.Group(); hand.add(g);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .82, 6), silver); pipe.position.y = -.3; g.add(pipe);
  for (const y of [-.02, -.52]) { const grip = new THREE.Mesh(new THREE.CylinderGeometry(.038, .038, .14, 6), green); grip.position.y = y; g.add(grip); }
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .06, 6), red); tip.position.y = -.72; g.add(tip);
  const can = new THREE.Mesh(new THREE.BoxGeometry(.24, .3, .13), canColor === TEAM.B.can ? red : white); can.position.set(0, .12, -.2); ch.spine.add(can);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .05, 6), red); cap.position.set(.07, .29, -.2); ch.spine.add(cap);
  const hose = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(.07, .3, -.2), new THREE.Vector3(.16, .36, -.05), new THREE.Vector3(.24, .2, .06)]), 8, .014, 4), red);
  ch.spine.add(hose);
}
function makeKid(team, i, me) {
  const s = SIDE[team], home = team === HOME;
  const n = SIZE[team], back = ALLEY ? 16.4 : 11.5, span = ALLEY ? 17 : 12, x = s * (back + (i % 2) * .6), z = -span / 2 + i * span / (n - 1); // both gangs start at the back of their own side
  const goggles = team === 'B' && i === 1;
  const c = W.bean({ age: 'kid', tools: ['none'], tool: 'none', topStyle: pick(['tee', 'stripe', 'tank']), shirt: TEAM[team].top, hat: goggles ? 'goggles' : TEAM[team].hat, x, z, ry: -s * Math.PI / 2 });
  gear(c.ch, TEAM[team].can); c.dry = true;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(.42, 18).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: team === 'A' ? '#2f8fd6' : '#e0574f', transparent: true, opacity: .55, depthWrite: false }));
  disc.position.y = .02; disc.scale.setScalar(1 / c.g.scale.x); if (!me) c.g.add(disc); // which gang, at a glance (you have your own ring) // our own water does the hitting (the town's only hits what's on screen)
  const emit = c.anim.emit; c.anim.emit = (t, o) => { if (t === 'throw') release(k); else if (t === 'splash') dump(k); else if (t !== 'squirt' && t !== 'squirtStart') emit(t, o); }; // our own water from game logic, not the town's
  const k = { c, team, me, i, disc, lane: 0, outs: 0, lim: 0, tap: null, waiting: false, filling: false, grit: 1, water: CAN, state: 'fight', out: false, cool: 1 + rnd() * 1.5, think: 0, target: null, hitT: 9, dryT: 0, wipeT: 0, stuck: 0, side: 1, sideT: 0, navT: 0, wp: [0, 0], goal: [0, 0], faceAim: rnd() < .45, name: goggles ? 'ရေကူးမျက်မှန်' : '',
    id: team + i, weapon: !me && i === 2 ? 'balloon' : 'pump', base: c.g.scale.x, sq: 0, kb: null, pend: null, bal: null, fillT: 0, fillFrom: 0, emoT: 0, burst: 0, pumpT: 0 };
  k.start = [x, z, -s * Math.PI / 2]; kids.push(k); return k;
}
const SIZE = { A: HOME === 'A' ? 5 : 6, B: HOME === 'B' ? 5 : 6 };
const me = makeKid('A', 0, true);
for (let i = 1; i < SIZE.A; i++) makeKid('A', i, false);
for (let i = 0; i < SIZE.B; i++) makeKid('B', i, false);
W.setPlayer(me.c);

// ---------- water: logical jets (they hit anyone, on screen or not) drawn as our own drops ----------
const NJ = 700, jetMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.1, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(.9, 1.25, 1.55) }), NJ);
jetMesh.frustumCulled = false; jetMesh.count = 0; scene.add(W.keep(jetMesh));
const drops = [], tm = new THREE.Matrix4(), tq = new THREE.Quaternion(), ts = new THREE.Vector3(), tv = new THREE.Vector3();
const pos = k => k.c.g.position, H = k => 1.45 * k.c.g.scale.x;
const sideOf = x => !ALLEY ? Math.sign(x) : (x < -1.3 ? -1 : x > 1.3 ? 1 : 0);
function blocked(x, y, z) { for (const h of HOUSES) if (x > h.x0 && x < h.x1 && z > h.z0 && z < h.z1 && y < h.h + .25) return true; for (const h of LOW) if (x > h.x0 && x < h.x1 && z > h.z0 && z < h.z1 && y < h.h) return true; return false; }
function clear(a, b) { // line of sight between two kids, chest high
  const n = Math.ceil(a.distanceTo(b) / .5); for (let i = 1; i < n; i++) { const t = i / n; if (blocked(a.x + (b.x - a.x) * t, 1, a.z + (b.z - a.z) * t)) return false; } return true;
}
const nozzle = k => { const o = pos(k).clone(), f = new THREE.Vector3(Math.sin(k.c.g.rotation.y), 0, Math.cos(k.c.g.rotation.y)); o.addScaledVector(f, .45); o.y += .95 * k.c.g.scale.x; return [o, f]; };
const fwd = k => new THREE.Vector3(Math.sin(k.c.g.rotation.y), 0, Math.cos(k.c.g.rotation.y));
function recoil(k, dir, m) { const p = pos(k); p.addScaledVector(dir, -m); W.collide(p); }
// where a pump stroke goes: at a kid (their face or their body) if they're in reach, else along the aim as far as it carries
function plan(k, reach, target, dirIn, vh = WEAPONS.pump.speed) {
  const [o, f] = nozzle(k); let dir = (dirIn || f).clone().setY(0).normalize(), d = reach, ty = .35;
  if (target) { const tp = pos(target); dir.set(tp.x - o.x, 0, tp.z - o.z); const dd = Math.max(.5, dir.length()); dir.normalize(); if (dd <= reach) { d = dd; ty = tp.y + H(target) * (k.faceAim || k.me ? .82 : .5); } }
  const t = d / vh, vy = Math.min(3.6, (ty - o.y) / t - .5 * GRAV * t);
  return { o, dir, vh, vy, d };
}
// ① the pump: one push of the slide = one stroke of ten drops. Tap = a stroke, hold = a stroke every .4 s (Fable, plan review)
function stroke(k, target, dirIn) {
  const Wp = WEAPONS.pump, cost = Wp.cost * Wp.every * CAN; if (k.water < cost * .3 || k.pend) return false;
  const weak = k.water < LOW_W * CAN; k.water = Math.max(0, k.water - cost);
  k.c.anim.play('squirt'); sound.fx('squirt', pos(k)); STATS.shots++;
  const { o, dir, vh, vy, d } = plan(k, Wp.range * (weak ? .6 : 1), target, dirIn); k.c.g.rotation.y = Math.atan2(dir.x, dir.z);
  const sharp = k.me && !AUTO, err = (sharp ? .03 : .09) * (1 + d / 6), n = weak ? 5 : 10, st = { landed: false };
  for (let j = 0; j < n; j++) {
    const a = Math.atan2(dir.x, dir.z) + (rnd() - .5) * 2 * err, sp = vh * (.93 + rnd() * .1);
    drops.push({ p: o.clone(), v: new THREE.Vector3(Math.sin(a) * sp, vy + (rnd() - .5) * .6 * (sharp ? .3 : 1), Math.cos(a) * sp), wait: j * .018, life: d / vh * 1.3 + .2, own: k, dmg: Wp.grit * Wp.every / 10, push: dir, s: weak ? .6 : 1, st });
  }
  fx.stream(o, new THREE.Vector3(dir.x * vh, vy, dir.z * vh)); if (weak) fx.drip(o);
  recoil(k, dir, .05); if (k.me) kick(2); else if (pos(k).distanceTo(pos(me)) < 7) kick(.8);
  return true;
}
// ② the balloon: wind up (hold = how far), a high arc over walls, it bursts where it lands — everyone within .8 m is soaked
const BAL = ['#ff7aa8', '#ffd84a', '#7ad0ff', '#9cf07a'], balGeo = new THREE.SphereGeometry(.12, 12, 10), balloons = [];
function balloonIn(k) { // one in the hand while you wind up
  if (k.bal) return k.bal;
  const m = new THREE.Mesh(balGeo, new THREE.MeshLambertMaterial({ color: pick(BAL) })); m.scale.set(1, 1.15, 1).divideScalar(k.base); m.position.set(0, -.1, .06);
  k.c.ch.arms[1].hand.add(m); return k.bal = m;
}
function landing(k, charge, target, dirIn) { // where a balloon thrown now would come down
  const Wb = WEAPONS.balloon, p = pos(k), f = (dirIn || fwd(k)).clone().setY(0).normalize();
  if (target) { const t = pos(target), d = Math.hypot(t.x - p.x, t.z - p.z); if (d <= Wb.range) return new THREE.Vector3(t.x, 0, t.z); f.set(t.x - p.x, 0, t.z - p.z).normalize(); return p.clone().addScaledVector(f, Wb.range).setY(0); }
  return p.clone().addScaledVector(f, Wb.min + (Wb.range - Wb.min) * charge).setY(0);
}
const lobPath = (o, at) => { const dx = at.x - o.x, dz = at.z - o.z, t = .6 + Math.hypot(dx, dz) * .12; return { t, v: new THREE.Vector3(dx / t, (.1 - o.y) / t - .5 * GRAV * t, dz / t) }; };
function lob(k, charge, target, dirIn) {
  const Wb = WEAPONS.balloon, cost = Wb.cost * CAN; if (k.water < cost || k.pend) { dropBalloon(k); return false; }
  k.water -= cost; balloonIn(k); const at = landing(k, charge, target, dirIn), p = pos(k);
  k.c.g.rotation.y = Math.atan2(at.x - p.x, at.z - p.z); k.pend = { kind: 'balloon', at, t: .5 }; k.c.anim.play('bigthrow'); STATS.shots++;
  return true;
}
function dropBalloon(k) { if (k.bal) { k.bal.removeFromParent(); k.bal.material.dispose(); k.bal = null; } }
function release(k) { // the bigthrow lets go (its 'throw' beat, or the fallback timer)
  const b = k.pend; if (!b || b.kind !== 'balloon') return; k.pend = null;
  const m = balloonIn(k); k.bal = null; scene.attach(m); m.scale.set(1, 1.15, 1);
  const { t, v } = lobPath(m.position, b.at); balloons.push({ m, own: k, v, life: t + 1 });
  const f = fwd(k), p = pos(k); p.addScaledVector(f, .15); W.collide(p); // a step into the throw
  sound.fx('squirt', p);
}
function stepBalloons(dt) {
  for (let i = balloons.length - 1; i >= 0; i--) {
    const b = balloons[i], p = b.m.position; b.v.y += GRAV * dt; p.addScaledVector(b.v, dt); b.m.rotation.x += dt * 7; b.life -= dt;
    let on = null; for (const k of kids) { if (k.team === b.own.team) continue; const q = pos(k), r = .34 * k.c.g.scale.x; if (Math.abs(p.x - q.x) < r && Math.abs(p.z - q.z) < r && p.y < q.y + H(k) && p.y > q.y) { on = k; break; } }
    if (on || p.y < .1 || blocked(p.x, p.y, p.z) || b.life < 0) { balloons.splice(i, 1); burst(b); }
  }
}
function burst(b) { // splat: a ring of water .8 m across where it came down
  const Wb = WEAPONS.balloon, p = b.m.position.clone(); p.y = Math.max(.12, p.y); b.m.removeFromParent(); b.m.material.dispose();
  fx.burst(p); fx.splat(p.x, p.z, Wb.ring); wallDecal(p, .45, true); sound.fx('splash', p);
  STATS.lastBurst = [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2)];
  for (const k of kids) {
    if (k.team === b.own.team) continue; const q = pos(k);
    if (Math.hypot(q.x - p.x, q.z - p.z) > Wb.ring + .2 * k.c.g.scale.x || p.y > q.y + H(k) + .4) continue;
    if (k.out) { foul(b.own, k); continue; }
    soak(k, { grit: Wb.grit, face: false, push: new THREE.Vector3(q.x - p.x, 0, q.z - p.z).normalize(), from: b.own, at: p, big: true });
  }
}
// ③ the bucket: the whole can at once, everyone within 1.5 m in a 90° wedge in front gets it — and is shoved back
function heave(k, target, dirIn) {
  const Wk = WEAPONS.bucket; if (k.water < Wk.need * CAN || k.pend) return false;
  const dir = target ? pos(target).clone().sub(pos(k)).setY(0) : (dirIn || fwd(k)).clone().setY(0); dir.normalize();
  k.c.g.rotation.y = Math.atan2(dir.x, dir.z); k.pend = { kind: 'bucket', dir, t: .55 }; k.c.anim.play('splash'); STATS.shots++;
  return true;
}
function dump(k) { // the 'splash' beat of the swing
  const b = k.pend; if (!b || b.kind !== 'bucket') return; k.pend = null;
  const Wk = WEAPONS.bucket, amt = Math.min(1, k.water / CAN), g = Wk.grit * Math.min(1, .4 + amt); k.water = Math.max(0, k.water - Wk.cost * CAN);
  const p = pos(k), o = p.clone().addScaledVector(b.dir, .45); o.y = .9 * k.c.g.scale.x;
  fx.sheet(o, new THREE.Vector3(b.dir.x, .35, b.dir.z)); sound.fx('splash', p);
  for (let i = 0; i < 5; i++) { const a = Math.atan2(b.dir.x, b.dir.z) + (i - 2) * .3, r = .7 + rnd() * .8; fx.splat(p.x + Math.sin(a) * r, p.z + Math.cos(a) * r, .45); }
  const half = Wk.cone / 2 * Math.PI / 180;
  for (const q of kids) {
    if (q.team === k.team) continue; const v = pos(q).clone().sub(p).setY(0), d = v.length(); if (d > Wk.range + .3) continue;
    let a = Math.atan2(v.x, v.z) - Math.atan2(b.dir.x, b.dir.z); a = Math.abs(Math.atan2(Math.sin(a), Math.cos(a))); if (a > half && d > .45) continue;
    if (!clear(p, pos(q))) continue;
    if (q.out) { foul(k, q); continue; }
    soak(q, { grit: g, face: false, push: v.normalize(), from: k, at: pos(q).clone().setY(H(q) * .8), big: true, kb: Wk.push });
  }
  if (k.me) { kick(5); buzz(); } else if (p.distanceTo(pos(me)) < 6) kick(2);
}
function stepDrops(dt) { // in small steps, so a fast jet can't skip past a kid in one slow frame
  const n = Math.min(12, Math.ceil(dt * 60)); for (let i = 0; i < n; i++) moveDrops(dt / n);
  let m = 0; for (const d of drops) { if (d.wait > 0 || m >= NJ - 3) continue;
    for (let t = 0; t < 3; t++) jetMesh.setMatrixAt(m++, tm.compose(tv.copy(d.p).addScaledVector(d.v, -.016 * t), tq, ts.setScalar(d.s * (1 - t * .22)))); }
  jetMesh.count = m; jetMesh.instanceMatrix.needsUpdate = true;
}
function moveDrops(dt) {
  let n = 0;
  for (let i = 0; i < drops.length; i++) {
    const d = drops[i];
    if (d.wait > 0) { d.wait -= dt; drops[n++] = d; continue; }
    d.life -= dt; d.p.addScaledVector(d.v, dt); d.p.y += .5 * GRAV * dt * dt; d.v.y += GRAV * dt;
    let dead = d.life <= 0 || d.p.y < .05 || blocked(d.p.x, d.p.y, d.p.z);
    if (!dead) for (const k of kids) {
      if (k === d.own || k.team === d.own.team) continue; // a kid who's OUT still gets wet — and the one who did it pays (rules.js 3)
      const p = pos(k), r = .34 * k.c.g.scale.x;
      if (Math.abs(d.p.x - p.x) > r || Math.abs(d.p.z - p.z) > r || d.p.y > p.y + H(k) || d.p.y < p.y) continue;
      dead = true; if (k.out) foul(d.own, k); else { soak(k, { grit: d.dmg, face: (d.p.y - p.y) / H(k) > .66, push: d.push, from: d.own, at: d.p, first: !d.st.landed }); d.st.landed = true; } break;
    }
    if (dead && d.p.y < .1 && rnd() < .3) fx.splat(d.p.x, d.p.z, .3); else if (dead && d.p.y >= .1 && rnd() < .25) wallDecal(d.p, .25);
    if (dead) { if (d.p.y < .1 || rnd() < .3) W.spawn(d.p.clone().setY(Math.max(.1, d.p.y)), new THREE.Vector3((rnd() - .5) * 1.5, 1 + rnd(), (rnd() - .5) * 1.5), { spray: true, s: .5, life: .4 }); continue; }
    drops[n++] = d;
  }
  drops.length = n;
}
let hitSnd = 0, stop = 0;
const pops = document.createElement('div'); pops.style.cssText = 'position:fixed;inset:0;z-index:3;pointer-events:none;overflow:hidden'; document.body.appendChild(pops);
function pop(k, text, color = '#fff') { // a word that jumps off the kid you got
  const v = pos(k).clone(); v.y += H(k) + .3; v.project(W.cam);
  const e = document.createElement('b'); e.textContent = text;
  e.style.cssText = `position:absolute;left:${(v.x * .5 + .5) * innerWidth}px;top:${(-v.y * .5 + .5) * innerHeight}px;transform:translate(-50%,-50%);font-size:22px;color:${color};text-shadow:0 2px 0 #3b2a3a,0 0 6px rgba(0,0,0,.4);transition:transform .6s ease-out,opacity .6s ease-in;white-space:nowrap`;
  pops.appendChild(e); requestAnimationFrame(() => { e.style.transform = 'translate(-50%,-150%) scale(1.25)'; e.style.opacity = 0; }); setTimeout(() => e.remove(), 650);
}
let drown = 0; // that water-up-your-nose feeling, for you
let shakeT = 0, shakeA = 0, buzzT = 0;
const kick = (a, t = TUNE.shakeT) => { if (a >= shakeA * Math.max(0, shakeT) / TUNE.shakeT) { shakeA = a; shakeT = t; } }; // the screen jolts for .15 s
const buzz = () => { if (W.time() > buzzT) { buzzT = W.time() + .25; try { navigator.vibrate?.(TUNE.vibrate); } catch {} } }; // Android: a 30 ms buzz
// one hit, whatever it came from: grit off, a squash, the drop emote, the burst, the sound, the beat of stillness
function soak(k, o) {
  const g = o.grit * (o.face ? TUNE.faceK : 1); STATS.hits++; if (o.face) STATS.face++;
  k.grit = Math.max(0, k.grit - g); k.hitT = 0; k.c.anim.soak(o.big ? .6 : .25); if (k.wipeT > 0) k.wipeT = 0;
  if (k.filling) { k.fillT = 0; k.water = k.fillFrom; } // hit while filling: start the can again
  const p = pos(k); p.addScaledVector(o.push, o.big ? .15 : .045); W.collide(p); // the water shoves you back a little
  if (o.kb) k.kb = { v: o.push.clone().multiplyScalar(o.kb / .25), t: .25 };
  k.sq = .07; k.carrier?.hit?.(o.push);
  if (k.emoT < W.time()) { k.emoT = W.time() + 1.5; k.c.anim.emote('drop', 1); }
  if (W.time() - (k.fxT ?? -1) > .12) { k.fxT = W.time(); fx.burst(o.at.clone ? o.at.clone() : o.at); }
  for (let j = 0; j < (o.big ? 5 : 2); j++) W.spawn(o.at.clone(), new THREE.Vector3(-o.push.x * .5 + (rnd() - .5) * 2.4, 1.2 + rnd() * 1.6, -o.push.z * .5 + (rnd() - .5) * 2.4), { spray: true, s: .7, life: .5 });
  if (hitSnd <= 0) { sound.fx(o.face || o.big ? 'splash' : 'hit', p); hitSnd = .12; }
  if (k.me) { kick(o.big ? 8 : o.face ? 6 : 3); buzz(); drown = Math.min(1, drown + (o.big ? .25 : o.face ? .07 : .03)); if (o.face || o.big) sting = Math.min(1, sting + (o.big ? .35 : .2)); }
  const mine = o.from?.me;
  if (mine && (k.popT ?? 0) < W.time()) { k.popT = W.time() + .5; pop(k, o.big ? 'ရွှဲ!' : o.face ? 'မျက်နှာ!' : 'ဖျန်း!', o.face || o.big ? '#ffe36b' : '#fff'); if (o.big) buzz(); }
  if ((mine || k.me) && (o.big || o.face || o.first)) stop = Math.max(stop, TUNE.hitStop);
  if (k.grit <= 0) { goOut(k); if (mine) { pop(k, 'OUT!', '#ff8a7a'); stop = Math.max(stop, TUNE.outStop); kick(7); } }
}
// someone splashed a kid who's OUT (rule 3): it costs them grit, and the kid lets them know
function foul(from, k) {
  const pen = rules.broke('out', from); if (!pen) return;
  STATS.fouls++; from.grit = Math.max(0, from.grit - pen); pop(k, 'ဟဲ့!', '#ffb36b'); k.c.anim.emote('bang', 1.2); from.c.anim.emote('drop', 1);
  if (from.grit <= 0) goOut(from);
}
let ruleT = 0;
function ruleLine(why, from) { $('rule').textContent = (from?.me ? '' : (from?.team === 'A' ? '① ' : '④ ') + 'တစ်ယောက် — ') + RULE_TEXT[why] + (why === 'out' ? ' (ခံနိုင်ရည် −၃၀%)' : ''); $('rule').hidden = false; ruleT = 2.5; }
// wet patches where water hits a wall or a drum (fx.js decals)
let decT = 0;
function wallDecal(p, r = .3, force = false) {
  if (!force && W.time() < decT) return;
  for (const h of LOW) {
    if (!h.m || p.x < h.x0 - .2 || p.x > h.x1 + .2 || p.z < h.z0 - .2 || p.z > h.z1 + .2 || p.y > h.h + .15) continue;
    decT = W.time() + .08; let n;
    if (h.drum) n = new THREE.Vector3(p.x - h.drum[0], 0, p.z - h.drum[1]).normalize();
    else { const c = [[p.x - h.x0, -1, 0, 0], [h.x1 - p.x, 1, 0, 0], [p.z - h.z0, 0, 0, -1], [h.z1 - p.z, 0, 0, 1], [h.h - p.y, 0, 1, 0]].sort((a, b) => Math.abs(a[0]) - Math.abs(b[0]))[0]; n = new THREE.Vector3(c[1], c[2], c[3]); }
    fx.decal(h.m, p.clone(), n, r); return;
  }
}

// ---------- OUT: can't be sprayed, can only go back, in again once the water-pot stand has filled your grit ----------
const grey = new THREE.MeshBasicMaterial({ color: '#9a9a9a', transparent: true, opacity: .55, depthWrite: false });
function goOut(k) {
  if (k.out) return;
  k.out = true; k.state = 'out'; k.outs++; OUTS[k.team]++; k.lim = pos(k).x * SIDE[k.team]; k.c.anim.emote('drop');
  k.pend = null; dropBalloon(k); k.burst = 0; k.carrier?.item && k.carrier.drop?.(); sound.fx('splash', pos(k)); if (k.me || pos(k).distanceTo(pos(me)) < 8) kick(k.me ? 9 : 4);
  if (k.tap?.user === k) k.tap.user = null; k.tap = null; if (k.disc) { k.disc.userData.m ??= k.disc.material; k.disc.material = grey; }
  if (k.me) { holding = false; charge = 0; aimDir = null; say('OUT! — နောက်ကိုပဲ သွားလို့ရ · ရေအိုးစင် (အစိမ်းဝိုင်း) မှာ ခံနိုင်ရည် ပြန်ဖြည့်', 4); }
  score(); checkEnd();
}
function comeBack(k) {
  k.out = false; k.state = 'fight'; k.grit = 1; if (k.disc) k.disc.material = k.disc.userData.m;
  pop(k, 'ပြန်ဝင်ပြီ!', '#9ff09a'); if (k.me) say('ပြန်ဝင်ပြီ — ဆက်တိုက်!', 2); score();
}

// ---------- the kids' heads ----------
const enemies = k => kids.filter(o => o.team !== k.team && !o.out);
const nearest = (k, list) => { let b = null, bd = 1e9; for (const o of list) { const d = pos(o).distanceTo(pos(k)); if (d < bd) { bd = d; b = o; } } return [b, bd]; };
function tapAt(k) { for (const r of REFILL) if (Math.hypot(r.x - pos(k).x, r.z - pos(k).z) < 1.15) return r; return null; }
const FILL_T = 1.5; // a full can in 1.5 s at a tap (B); get hit while filling and it starts again
function fillAt(k, r, dt) { // one kid per tap: the rest wait their turn
  if (r.user && r.user !== k) return false;
  if (r.user !== k) { r.user = k; k.fillT = 0; k.fillFrom = k.water; }
  const T = r.kind === 'tap' ? FILL_T : FILL_T * 1.7; // the visitors' drum is slower
  k.filling = true; k.fillT += dt; k.water = k.fillFrom + (CAN - k.fillFrom) * Math.min(1, k.fillT / T);
  if (k.fillT >= T) { k.water = CAN; r.user = null; } return true;
}
function pickRefill(k) { // the nearest free one, keeping clear of a spot the other gang is standing round
  const p = pos(k); let best = null, bd = 1e9;
  for (const r of REFILL) { let c = Math.hypot(r.x - p.x, r.z - p.z); if (r.user && r.user !== k) c += 6; if (ALLEY && sideOf(r.x) !== sideOf(p.x)) c += 6;
    for (const o of enemies(k)) if (Math.hypot(pos(o).x - r.x, pos(o).z - r.z) < 4) c += 3; if (c < bd) { bd = c; best = r; } }
  return best;
}
// where a kid can stand (ai.js builds its A* grid from this): inside the lot, off the creek, clear of houses, walls, drums, taps, stands
const R_KID = .32;
function free(x, z) {
  if (x < B.x0 + .3 || x > B.x1 - .3 || z < B.z0 + .3 || z > B.z1 - .3) return false;
  if (ALLEY && Math.abs(x) < 1.6 && !BRIDGES.some(b => z > b.z0 + .2 && z < b.z1 - .2)) return false;
  for (const h of HOUSES) if (x > h.x0 - R_KID && x < h.x1 + R_KID && z > h.z0 - R_KID && z < h.z1 + R_KID) return false;
  for (const h of LOW) if (x > h.x0 - R_KID && x < h.x1 + R_KID && z > h.z0 - R_KID && z < h.z1 + R_KID) return false;
  for (const r of REFILL) if (Math.abs(x - r.x) < .2 + R_KID && Math.abs(z - r.z) < .2 + R_KID) return false;
  for (const t of ['A', 'B']) if (Math.abs(x - REST[t].x) < .45 + R_KID && Math.abs(z - REST[t].z) < .25 + R_KID) return false;
  return true;
}
const OBST = []; // what Yuka's obstacle avoidance steers round: drums, wall stubs (as a row of circles), taps, the stands
for (const h of LOW) { if (h.drum) { OBST.push({ x: h.drum[0], z: h.drum[1], r: .5 }); continue; }
  const w = h.x1 - h.x0, d = h.z1 - h.z0, n = Math.max(1, Math.round(Math.max(w, d) / .45)), r = Math.min(w, d) / 2 + .2;
  for (let i = 0; i < n; i++) { const t = (i + .5) / n; OBST.push(w > d ? { x: h.x0 + w * t, z: (h.z0 + h.z1) / 2, r } : { x: (h.x0 + h.x1) / 2, z: h.z0 + d * t, r }); } }
for (const r of REFILL) OBST.push({ x: r.x, z: r.z, r: .35 }); for (const t of ['A', 'B']) OBST.push({ x: REST[t].x, z: REST[t].z, r: .6 });
// how a gang plays it: the home side holds a line across its own half and only steps up to meet a kid who's come in;
// the visitors push through, spread across the lot. Whoever's two up (or the home side, once the visitors are down to
// two) goes on the attack; visitors two down fall back and hold. Every kid keeps their own lane, so nobody bunches.
const STANCE = { A: '', B: '' }, OUTS = { A: 0, B: 0 }, LANE = ALLEY ? 0 : 6.5;
const LANES_ALLEY = [-10.6, -4.4, 4.4, 10.6];
let teamT = 0;
const active = t => kids.filter(k => k.team === t && !k.out).length;
function teams(dt) {
  if ((teamT -= dt) > 0) return; teamT = .5;
  for (const t of ['A', 'B']) {
    const a = active(t), e = active(t === 'A' ? 'B' : 'A');
    const st = t === HOME ? (a >= e + 2 || (a > e && e <= 2) ? 'attack' : 'defend') : (a + 2 <= e ? 'defend' : 'attack');
    if (STANCE[t] && st !== STANCE[t] && playing) { const line = t === 'A' ? (st === 'attack' ? 'ငါတို့ ဘက် တိုက်စစ် ဖွင့်ပြီ!' : 'ငါတို့ ဘက် နောက်ဆုတ်ပြီး ခံတိုက်') : (st === 'attack' ? '④ တိုက်စစ် ဖွင့်လာပြီ!' : '④ နောက်ဆုတ်ပြီး ခံနေပြီ');
      if (rules.speak(line)) say(line, 2.2); else for (const k of kids) if (k.team === t && !k.out && rnd() < .5) k.c.anim.emote(st === 'attack' ? 'bang' : 'drop', 1); } // a fight is silent (rules.js 1): a look, not a shout
    STANCE[t] = st;
    const f = kids.filter(k => k.team === t && !k.out).sort((p, q) => pos(p).z - pos(q).z);
    f.forEach((k, i) => { const z = -LANE + (i + .5) * 2 * LANE / f.length; k.lane = ALLEY ? LANES_ALLEY.reduce((b, l) => Math.abs(l - (i - (f.length - 1) / 2) * 5) < Math.abs(b - (i - (f.length - 1) / 2) * 5) ? l : b) : z; });
  }
}
function shootAt(k, dt) { // at whoever's nearest and in sight — a few pump strokes, a balloon over the wall, the bucket up close
  if (k.pend) return;
  if (k.burst > 0) { if ((k.pumpT -= dt) <= 0) { k.pumpT = WEAPONS.pump.every; k.burst--; if (!k.target || k.target.out || !stroke(k, k.target)) k.burst = 0; } return; }
  if ((k.cool -= dt) > 0 || k.c.anim.one) return;
  const p = pos(k);
  if (k.weapon === 'balloon') { // the lobber: anyone in 3–9 m, wall or no wall
    let t = null, bd = WEAPONS.balloon.range; for (const o of enemies(k)) { const d = pos(o).distanceTo(p); if (d > WEAPONS.balloon.min && d < bd) { bd = d; t = o; } }
    if (t && k.water > WEAPONS.balloon.cost * CAN + .3) { k.target = t; if (lob(k, 0, t)) { k.cool = 1.6 + rnd() * 1.2; return; } }
  }
  let t = null, bd = WEAPONS.pump.range + .5; for (const o of enemies(k)) { const d = pos(o).distanceTo(p); if (d < bd && clear(p, pos(o))) { bd = d; t = o; } }
  if (!t) return; k.target = t; k.faceAim = rnd() < .45;
  if (bd < WEAPONS.bucket.range + .2 && k.water > .5 * CAN && rnd() < .35) { if (heave(k, t)) { k.cool = 1.4 + rnd(); return; } }
  k.burst = 1 + Math.floor(rnd() * 3); k.pumpT = 0; k.cool = .7 + rnd() * .8;
}

// the heads and legs: Yuka steering + a state machine per kid, roles from SCENARIO (yangon/ai.js)
const ai = createAI({ kids, me, auto: AUTO, B, alley: ALLEY, homeTeam: HOME, CAN, weapons: WEAPONS, rnd, pos, free, obstacles: OBST, collide: p => W.collide(p),
  side: t => SIDE[t], stance: t => STANCE[t], lane: k => k.lane, rest: t => REST[t], enemies, nearest, clear, pickRefill, fillAt, atRest, shootAt,
  onSupply: (k, to) => { pop(to, '+ရေ', '#9fe3ff'); } });

// ---------- you ----------
// The pad, by weapon (R or the three small pads switch): pump — tap = one stroke at the nearest kid you can see, hold = a
// stroke every .4 s, drag = aim yourself · balloon — hold = how far (the ring fills), let go = throw; a dotted arc and a
// ring show where it lands · bucket — let go = the whole can at whoever's in front, close up.
// A red ring marks who it'll hit. PC: the mouse aims, Space / J = the pad, R = switch, 1 2 3 = pick.
let charge = 0, holding = false, sting = 0, aimDir = null, dragFrom = null, mouseAim = null;
const ringEl = $('ring');
const RIGHT = new THREE.Vector3(1, 0, -1).normalize(), UP = new THREE.Vector3(-1, 0, -1).normalize(); // the screen's right and up, on the ground (the world's iso camera)
function visibleFoes() { const p = pos(me), lob = me.weapon === 'balloon'; return enemies(me).filter(o => pos(o).distanceTo(p) < (lob ? WEAPONS.balloon.range : 10) && (lob || clear(p, pos(o)))); }
function autoTarget() { let best = null, bd = 1e9; for (const o of visibleFoes()) { const d = pos(o).distanceTo(pos(me)); if (d < bd) { bd = d; best = o; } } return best; }
function rayTarget(dir) { // the kid nearest the line you're aiming along (never one who's OUT)
  const p = pos(me); let best = null, ba = .3;
  for (const o of kids) { if (o === me || o.team === me.team || o.out) continue; const tp = pos(o), d = tp.distanceTo(p); if (d > 10) continue;
    let a = Math.atan2(tp.x - p.x, tp.z - p.z) - Math.atan2(dir.x, dir.z); a = Math.abs(Math.atan2(Math.sin(a), Math.cos(a))); if (a < ba && (me.weapon === 'balloon' || clear(p, tp))) { ba = a; best = o; } }
  return best;
}
const aimNow = () => { const d = mouseAim ? mouseAim.clone().sub(pos(me)).setY(0) : aimDir; return d && d.lengthSq() > .01 ? d.normalize() : null; };
const targetNow = () => { const d = aimNow(); return d ? rayTarget(d) : autoTarget(); };
let pumpT = 0;
const empty = () => say(me.weapon === 'bucket' && me.water >= .05 ? 'ပုံးအတွက် ရေ မလောက် (၃၀% လို)' : 'ရေကုန်ပြီ — ပိုက်ခေါင်း/ရေစည်ဆီ သွားဖြည့်', 2);
const pumpNow = () => { const d = aimNow(), t = targetNow(); if (!stroke(me, t, t ? null : d) && !me.pend) empty(); };
const press = on => {
  if (!playing || me.out || me.state === 'wipe') return;
  const w = me.weapon;
  if (on) { holding = true; $('fire').classList.add('on'); if (w === 'pump') { pumpT = WEAPONS.pump.every; pumpNow(); } else if (w === 'balloon' && me.water >= WEAPONS.balloon.cost * CAN && !me.pend) balloonIn(me); }
  else if (holding) {
    holding = false; $('fire').classList.remove('on'); const d = aimNow(), t = targetNow();
    if (w === 'balloon' && !lob(me, charge, t, t ? null : d) && !me.pend) empty();
    if (w === 'bucket' && !heave(me, t && pos(t).distanceTo(pos(me)) < WEAPONS.bucket.range + 1.5 ? t : null, d) && !me.pend) empty();
    charge = 0; aimDir = null; dragFrom = null;
  }
};
function setWeapon(w) {
  if (holding) { holding = false; charge = 0; $('fire').classList.remove('on'); } if (me.weapon === 'balloon' && !me.pend) dropBalloon(me);
  me.weapon = w; for (const b of document.querySelectorAll('#weps button')) b.classList.toggle('on', b.dataset.w === w);
  $('fire').dataset.w = w;
}
const nextWeapon = () => setWeapon(ORDER[(ORDER.indexOf(me.weapon) + 1) % ORDER.length]);
for (const b of document.querySelectorAll('#weps button')) b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); setWeapon(b.dataset.w); });
setWeapon('pump');
const wipe = () => { if (!playing || me.out || me.state === 'wipe') return; drown = 0; me.state = 'wipe'; me.wipeT = 1.2; holding = false; charge = 0; W.frozen = true; $('wipe').classList.add('on'); };
$('fire').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); dragFrom = [e.clientX, e.clientY, e.pointerId]; aimDir = null; try { $('fire').setPointerCapture(e.pointerId); } catch {} press(true); });
$('fire').addEventListener('pointermove', e => { if (!dragFrom || e.pointerId !== dragFrom[2]) return; const dx = e.clientX - dragFrom[0], dy = dragFrom[1] - e.clientY;
  aimDir = Math.hypot(dx, dy) > 16 ? new THREE.Vector3().addScaledVector(RIGHT, dx).addScaledVector(UP, dy) : null; });
$('fire').addEventListener('pointerup', e => { e.stopPropagation(); press(false); });
$('fire').addEventListener('pointercancel', () => press(false));
$('wipe').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); wipe(); });
addEventListener('keydown', e => { if (e.repeat) return; if (e.code === 'Space' || e.code === 'KeyJ') { mouseAim = null; press(true); e.preventDefault(); } if (e.code === 'KeyF') wipe(); if (e.code === 'KeyR') nextWeapon(); const n = ['Digit1', 'Digit2', 'Digit3'].indexOf(e.code); if (n >= 0) setWeapon(ORDER[n]); }, true);
addEventListener('keyup', e => { if (e.code === 'Space' || e.code === 'KeyJ') press(false); });
const ray = new THREE.Raycaster(), groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), mv2 = new THREE.Vector2();
const cursorGround = e => { mv2.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1); ray.setFromCamera(mv2, W.cam); return ray.ray.intersectPlane(groundPlane, new THREE.Vector3()); };
W.renderer.domElement.addEventListener('mousemove', e => { mouseAim = cursorGround(e); });
W.renderer.domElement.addEventListener('mousedown', e => { if (e.button === 0) { mouseAim = cursorGround(e); press(true); } });
addEventListener('mouseup', e => { if (e.button === 0) press(false); });
W.onAction = () => true; // E doesn't splash a bucket here
// what the aim shows: a dotted arc while you pull, a red ring under whoever's in your sights
const NA = 18, arc = new THREE.InstancedMesh(new THREE.SphereGeometry(.05, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .85, depthWrite: false }), NA);
arc.frustumCulled = false; arc.count = 0; scene.add(W.keep(arc));
const mark = new THREE.Mesh(new THREE.RingGeometry(.42, .55, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ff4a3a', transparent: true, opacity: .9, depthWrite: false }));
mark.visible = false; scene.add(W.keep(mark));
const land = new THREE.Mesh(new THREE.RingGeometry(WEAPONS.balloon.ring - .08, WEAPONS.balloon.ring, 36).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .8, depthWrite: false }));
land.visible = false; scene.add(W.keep(land));
const wedge = new THREE.Mesh(new THREE.CircleGeometry(1, 20, -Math.PI / 4, Math.PI / 2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#8fd3ff', transparent: true, opacity: .35, depthWrite: false }));
wedge.visible = false; scene.add(W.keep(wedge));
function showAim() {
  const t = playing && !me.out && me.state !== 'wipe' ? targetNow() : null;
  mark.visible = !!t; if (t) { mark.position.set(pos(t).x, .03, pos(t).z); mark.scale.setScalar(1 + Math.sin(W.time() * 8) * .06); }
  land.visible = wedge.visible = false;
  if (!holding) { arc.count = 0; return; }
  const d = aimNow(), w = me.weapon; if (t || d) me.c.g.rotation.y = t ? Math.atan2(pos(t).x - pos(me).x, pos(t).z - pos(me).z) : Math.atan2(d.x, d.z);
  let n = 0;
  if (w === 'pump') {
    const { o, dir, vh, vy } = plan(me, WEAPONS.pump.range * (me.water < LOW_W * CAN ? .6 : 1), t, t ? null : d);
    for (let i = 1; i <= NA; i++) { const tt = i * .035, y = o.y + vy * tt + .5 * GRAV * tt * tt; if (y < .05) break; arc.setMatrixAt(n++, tm.compose(tv.set(o.x + dir.x * vh * tt, y, o.z + dir.z * vh * tt), tq, ts.setScalar(1))); }
  } else if (w === 'balloon') {
    const at = landing(me, charge, t, t ? null : d), [o] = nozzle(me), { t: T, v } = lobPath(o, at);
    for (let i = 1; i <= NA; i++) { const tt = i / NA * T; arc.setMatrixAt(n++, tm.compose(tv.set(o.x + v.x * tt, o.y + v.y * tt + .5 * GRAV * tt * tt, o.z + v.z * tt), tq, ts.setScalar(1))); }
    land.visible = true; land.position.set(at.x, .03, at.z);
  } else {
    wedge.visible = true; wedge.position.set(pos(me).x, .03, pos(me).z); wedge.rotation.y = me.c.g.rotation.y; wedge.scale.setScalar(WEAPONS.bucket.range); }
  arc.count = n; arc.instanceMatrix.needsUpdate = true;
}

function mine(dt) {
  me.waiting = false;
  if (me.out) { const x = pos(me).x * SIDE.A; if (x < me.lim) pos(me).x = me.lim * SIDE.A; else me.lim = x; return; } // OUT: backwards only
  if (me.state === 'wipe') { if ((me.wipeT -= dt) <= 0) { me.grit = Math.min(1, me.grit + .12); sting = Math.max(0, sting - .6); me.state = 'fight'; W.frozen = false; $('wipe').classList.remove('on'); } return; }
  if (holding && me.weapon === 'balloon') charge = Math.min(1, charge + dt / .7);
  if (holding && me.weapon === 'pump' && (pumpT -= dt) <= 0) { pumpT = WEAPONS.pump.every; pumpNow(); }
  const r = tapAt(me); if (r && me.water < CAN && !fillAt(me, r, dt)) me.waiting = true;
}

// ---------- the match ----------
let playing = false, ended = false, msgT = 0;
function say(t, s = 2) { $('msg').textContent = t; $('msg').classList.remove('off'); msgT = s; }
const ROUND = +(P.get('clock') || 180), MY = n => String(n).replace(/\d/g, d => '၀၁၂၃၄၅၆၇၈၉'[d]);
let scored = '', clock = ROUND, round = 1, hinted = false;
const wins = { A: 0, B: 0 }, rounds = [];
function score() {
  const h = t => kids.filter(k => k.team === t).map(k => `<i class="${k.out ? '' : 'on'}"></i>`).join('');
  const a = h('A'), b = h('B'); if (a + b === scored) return; scored = a + b; $('sa').innerHTML = a; $('sb').innerHTML = b;
}
const roundLabel = () => { $('rnd').textContent = `ပွဲ ${MY(round)}/၃ · ${MY(wins.A)}–${MY(wins.B)}`; };
function roundOver(winner, why) { // winner: 'A', 'B' or null (a draw)
  if (ended) return; ended = true; rules.stop(); if (winner) wins[winner]++; rounds.push(winner); roundLabel();
  setTimeout(() => {
    if (winner === 'A') { $('big').textContent = 'ဟေး!'; $('big').hidden = false; for (const k of kids) if (k.team === 'A' && !k.out) { k.c.anim.play('jump'); k.c.anim.emote('heart'); } }
    setTimeout(() => {
      $('big').hidden = true;
      const tally = `ပွဲစဉ် — ① ${MY(wins.A)} : ${MY(wins.B)} ④`;
      if (round < 3) {
        end(`ပွဲ ${MY(round)} — ${winner === 'A' ? '① နိုင်' : winner === 'B' ? '④ နိုင်' : 'သရေ'}`, `${why}\n${tally}`, `ပွဲ ${MY(round + 1)} စမယ်`);
        if (AUTO) setTimeout(nextRound, 1500);
      } else {
        const d = wins.A - wins.B; window.war.final = true;
        end(d > 0 ? 'နိုင်ပြီ' : d < 0 ? 'ရှုံးပြီ' : 'သရေ', `${why}\n၃ ပွဲ ပြီးပြီ — ① ${MY(wins.A)} : ${MY(wins.B)} ④`, 'ပြန်ကစား');
      }
    }, winner === 'A' ? 1800 : 600);
  }, 700);
}
function checkEnd() { // a gang that's all OUT at the same time has lost the round
  if (ended) return;
  const a = active('A'), b = active('B'); if (a && b) return;
  roundOver(a ? 'A' : 'B', a ? '④ ဂိုဏ်း တစ်ယောက်မကျန် OUT ဖြစ်သွားပြီ' : '① ဘက်က တစ်ယောက်မကျန် OUT ဖြစ်သွားပြီ');
}
function timeUp() { // the bell: fewer OUTs takes the round
  const d = OUTS.B - OUTS.A; roundOver(d > 0 ? 'A' : d < 0 ? 'B' : null, `အချိန်ပြည့် — OUT ① ${MY(OUTS.A)} ကြိမ် · ④ ${MY(OUTS.B)} ကြိမ်`);
}
function end(title, text, btn) { $('etitle').textContent = title; $('etext').innerText = text; $('again').textContent = btn; $('end').hidden = false; playing = false; W.frozen = true; window.war.result = title; window.war.round = round; }
function nextRound() { // everyone back to the start line, full cans, full grit
  if (round >= 3 || $('end').hidden) return;
  round++; clock = ROUND; ended = false; hinted = false; drops.length = 0; for (const b of balloons) b.m.removeFromParent(); balloons.length = 0; rules.start(); OUTS.A = OUTS.B = 0; STANCE.A = STANCE.B = ''; teamT = 0;
  for (const r of REFILL) r.user = null;
  for (const k of kids) {
    dropBalloon(k); Object.assign(k, { pend: null, kb: null, burst: 0, grit: 1, water: CAN, out: false, state: 'fight', tap: null, waiting: false, wipeT: 0, stuck: 0, navT: 0, cool: 1 + rnd() * 1.5, target: null });
    if (k.disc?.userData.m) k.disc.material = k.disc.userData.m;
    k.c.g.position.set(k.start[0], 0, k.start[1]); k.c.g.rotation.y = k.start[2]; k.c.anim.setLoop('idle');
  }
  holding = false; charge = 0; drown = 0; sting = 0; $('wipe').classList.remove('on');
  ai.reset(); W.snapCam(); $('end').hidden = true; playing = true; W.frozen = false; window.war.result = null; scored = ''; score(); roundLabel();
  say(`ပွဲ ${MY(round)} — စ!`, 2);
}
const go = mode => { location.search = '?mode=' + mode + (ALLEY ? '&map=alley' : '') + (AUTO ? '&auto' : '') + (P.has('debug') ? '&debug' : '') + (P.get('dt') ? '&dt=' + P.get('dt') : '') + (P.get('q') ? '&q=' + P.get('q') : ''); };
$('home').onclick = () => go('home'); $('away').onclick = () => go('away');
$('alley').onclick = () => { location.search = '?map=' + (ALLEY ? 'lot' : 'alley') + (AUTO ? '&auto' : ''); };
$('alley').textContent = ALLEY ? 'မြေပုံ: လမ်းကြား → ကွက်လပ်' : 'မြေပုံ: ကွက်လပ် → လမ်းကြား';
$('again').onclick = () => { if (round < 3 && !window.war.final) nextRound(); else go(MODE || 'home'); }; $('menu').onclick = () => { location.search = (ALLEY ? '?map=alley' : '?') + (AUTO ? '&auto' : ''); };
function begin() {
  $('start').hidden = true; playing = true; W.frozen = false; score(); roundLabel(); rules.start();
  say(HOME === 'A' ? '④ ဂိုဏ်း ဝင်လာပြီ — ကိုယ့်ဘက်ကို ကာ!' : '④ ဘက်ကို ဖောက်ဝင်တိုက် — သူတို့ ပိုက်ခေါင်းလည်း သုံးလို့ရ', 3);
  setTimeout(() => playing && say(matchMedia('(pointer:coarse)').matches ? 'ပက် ကို တို့ = တစ်ချက် · ဖိထား = ဆက်တိုက် · ဆွဲ = ချိန် · ပြွတ်/ပူဖောင်း/ပုံး ပြောင်းလို့ရ' : 'mouse နဲ့ ချိန် · Space = ပက် (ဖိထား = ဆက်တိုက်) · R = လက်နက် ပြောင်း', 4), 3200);
}
if (MODE) begin(); else { W.frozen = true; score(); roundLabel(); }

// the tags over everyone's head: grit and water, and what they're up to
const ICON = {
  out: '<span class="out">OUT</span>',
  rest: '<span class="rest">+</span>',
  fill: '<svg class="fill" viewBox="0 0 20 22"><path d="M10 1C10 1 3 9.5 3 14a7 7 0 0 0 14 0C17 9.5 10 1 10 1z"/></svg>',
  wait: '<svg class="wait" viewBox="0 0 20 22"><path d="M10 1C10 1 3 9.5 3 14a7 7 0 0 0 14 0C17 9.5 10 1 10 1z"/><text x="10" y="17" text-anchor="middle">…</text></svg>',
  low: '<svg class="low" viewBox="0 0 20 22"><path d="M10 1C10 1 3 9.5 3 14a7 7 0 0 0 14 0C17 9.5 10 1 10 1z"/><text x="10" y="18" text-anchor="middle">!</text></svg>',
};
for (const k of kids) {
  const e = document.createElement('div'); e.className = 'tag ' + k.team + (k.me ? ' me' : '');
  e.innerHTML = '<div class="bars"><i class="g"><b></b></i><i class="w"><b></b></i></div><div class="ic"></div>'; $('tags').appendChild(e);
  k.tag = { e, g: e.querySelector('.g b'), w: e.querySelector('.w b'), ic: e.querySelector('.ic'), s: null };
}
const tp = new THREE.Vector3();
function tags() {
  for (const k of kids) {
    const T = k.tag; tp.copy(pos(k)); tp.y += H(k) + .2; tp.project(W.cam);
    if (tp.z > 1 || Math.abs(tp.x) > 1.1 || Math.abs(tp.y) > 1.1) { T.e.style.display = 'none'; continue; }
    T.e.style.display = ''; T.e.style.transform = `translate(${((tp.x * .5 + .5) * innerWidth).toFixed(0)}px,${((-tp.y * .5 + .5) * innerHeight).toFixed(0)}px) translate(-50%,-100%)`;
    T.g.style.width = (k.grit * 100).toFixed(0) + '%'; T.w.style.width = (k.water / CAN * 100).toFixed(0) + '%';
    const st = k.out ? 'out' : atRest(k) && k.grit < 1 ? 'rest' : k.filling ? 'fill' : k.waiting ? 'wait' : k.water < .6 ? 'low' : '';
    if (st !== T.s) { T.s = st; T.ic.innerHTML = ICON[st] || ''; T.e.dataset.s = st; }
  }
}
// ရေမွန်း: drops running down the screen, the picture swimming and blurring while water's up your nose
const film = $('drown');
for (let i = 0; i < 9; i++) { const d = document.createElement('i'); const w = 14 + rnd() * 22; d.style.cssText = `left:${(rnd() * 96).toFixed(1)}%;width:${w.toFixed(0)}px;height:${(w * 1.35).toFixed(0)}px;animation-duration:${(1.6 + rnd() * 1.8).toFixed(2)}s;animation-delay:-${(rnd() * 3).toFixed(2)}s`; film.appendChild(d); }

W.tick(dt => {
  hitSnd -= dt;
  if (msgT > 0 && (msgT -= dt) <= 0) $('msg').classList.add('off');
  for (const k of kids) k.filling = false;
  rules.tick(dt);
  if (playing) {
    teams(dt);
    for (const k of kids) { k.hitT += dt; if (atRest(k) && k.grit < 1) { k.grit = Math.min(1, k.grit + REST_RATE * dt); if (k.out && k.grit >= 1) comeBack(k); } }
    if (!AUTO) mine(dt);
    ai.update(dt); // everyone else (and you, on ?auto): yangon/ai.js
    for (const r of REFILL) { if (r.user && (r.user.out || Math.hypot(pos(r.user).x - r.x, pos(r.user).z - r.z) > 1.3)) r.user = null; r.stream.visible = !!r.user && r.user.filling; }
    score();
    if (!ended && (clock -= dt) <= 0) { clock = 0; timeUp(); }
    $('clock').textContent = `${Math.floor(clock / 60)}:${String(Math.floor(clock % 60)).padStart(2, '0')}`;
  }
  stepDrops(dt); stepBalloons(dt); showAim(); tags(); feel(dt); fx.update(dt);
  REST.A.ring.material.opacity = me.out ? .55 + Math.sin(W.time() * 6) * .35 : .45;
  const shake = shakeT > 0 ? shakeA * shakeT / TUNE.shakeT * TUNE.shake / 6 : 0; shakeT -= dt; drown = Math.max(0, drown - dt * .3);
  const sw = drown > .05 ? ` scale(${(1 + drown * .025 * (1 + Math.sin(W.time() * 4.5))).toFixed(4)})` : '';
  W.renderer.domElement.style.transform = (shake > .2 ? `translate(${((rnd() - .5) * shake).toFixed(1)}px,${((rnd() - .5) * shake).toFixed(1)}px)` : '') + sw;
  if (stop > 0) { const s = stop; stop = 0; W.paused = true; setTimeout(() => { W.paused = false; }, s * 1000); } // a beat of stillness when a shot really lands
  sting = Math.max(0, sting - dt * .35); $('sting').style.opacity = sting.toFixed(2); film.style.opacity = Math.min(1, drown * 1.6).toFixed(2);
  const bl = Math.max(sting > .25 ? sting * 2.2 : 0, drown * 2.4);
  W.renderer.domElement.style.filter = bl > .3 ? `blur(${bl.toFixed(1)}px)` + (drown > .1 ? ` saturate(${(1 - drown * .35).toFixed(2)}) hue-rotate(${(-drown * 12).toFixed(0)}deg)` : '') : '';
  $('water').firstChild.style.width = (me.water / CAN * 100) + '%'; $('water').classList.toggle('low', me.water < LOW_W * CAN); if (ruleT > 0 && (ruleT -= dt) <= 0) $('rule').hidden = true; $('grit').firstChild.style.width = (me.grit * 100) + '%';
  $('note').textContent = me.out ? 'OUT — ရေအိုးစင် ပြန်သွား' : atRest(me) && me.grit < 1 ? 'ခံနိုင်ရည် ဖြည့်နေတယ်…' : me.filling ? 'ရေဖြည့်နေတယ်… (ပက်ခံရရင် ပြန်စ)' : me.waiting ? 'ပိုက်ခေါင်း မအားသေး — စောင့်' : me.water < .6 ? 'ရေကုန်ခါနီး!' : '';
  ringEl.setAttribute('stroke-dashoffset', (333 * (1 - charge)).toFixed(0));
  $('wipe').classList.toggle('hint', drown > .4 && !me.out && me.state !== 'wipe'); // the wipe pad pulses while water's up your nose
  if (drown > .5 && !hinted && playing && !AUTO) { hinted = true; say('ရေမွန်းနေပြီ — 「သုတ်」 နဲ့ မျက်နှာ သုတ်', 2.5); }
});

// the body after a hit: a one-frame squash, the bucket's shove, the throw that lands on its beat, drips from a can running dry
let dripT = 0, dripI = 0, lowT = 0;
function feel(dt) {
  for (const k of kids) {
    k.c.g.scale.y = k.sq > 0 ? k.base * TUNE.squash : k.base; k.sq -= dt;
    if (k.kb) { const p = pos(k); p.addScaledVector(k.kb.v, Math.min(dt, k.kb.t)); W.collide(p); if ((k.kb.t -= dt) <= 0) k.kb = null; }
    if (k.pend && (k.pend.t -= dt) <= 0) (k.pend.kind === 'balloon' ? release : dump)(k);
  }
  if ((dripT -= dt) <= 0) { dripT = .3; // one dripping can at a time, round-robin
    for (let j = 0; j < kids.length; j++) { const k = kids[(dripI + j) % kids.length]; if (k.out || k.filling || k.water >= LOW_W * CAN) continue;
      dripI = (dripI + j + 1) % kids.length; fx.drip(k.c.ch.spine.localToWorld(new THREE.Vector3(0, 0, -.22))); break; } }
  if ((lowT -= dt) <= 0) { lowT = 1; fx.low = P.get('q') === 'lite' || W.quality() >= 6; } // LEVELS low: no decals, no wet ground
}
// ?tune — lil-gui: hit feel, the three weapons, particle budget; copy the JSON back into TUNE / WEAPONS / fx.js BUDGET
if (P.has('tune')) import('https://cdn.jsdelivr.net/npm/lil-gui@0.19.2/dist/lil-gui.esm.min.js').then(({ GUI }) => {
  const gui = new GUI({ title: 'ရေပက် tune (T3)' }), f = gui.addFolder('ထိတဲ့ခဏ');
  f.add(TUNE, 'hitStop', 0, .15, .005); f.add(TUNE, 'outStop', 0, .3, .01); f.add(TUNE, 'shakeT', 0, .5, .01); f.add(TUNE, 'shake', 0, 20, .5); f.add(TUNE, 'squash', .6, 1, .01); f.add(TUNE, 'vibrate', 0, 80, 5); f.add(TUNE, 'faceK', 1, 3, .1);
  for (const w of Object.values(WEAPONS)) { const g = gui.addFolder(w.name); for (const [key, v] of Object.entries(w)) if (typeof v === 'number') g.add(w, key, 0, Math.max(1, v * 3), .01); g.close(); }
  const pf = gui.addFolder('particles (total = live · the rest on reload)'); for (const n of Object.keys(fx.budget)) pf.add(fx.budget, n, 0, fx.budget[n] * 2, 1); pf.close();
  gui.add({ copy: () => { const j = JSON.stringify({ TUNE, WEAPONS, BUDGET: fx.budget }, null, 1); navigator.clipboard?.writeText(j); console.log(j); } }, 'copy').name('JSON copy');
});

W.start();
window.war = { ai, fx, rules, WEAPONS, TUNE, setWeapon, stroke, lob, heave, dump, soak, goOut, balloons, drops, kids, me, state: () => ({ playing, ended, A: active('A'), B: active('B'), outs: { ...OUTS }, stance: { ...STANCE }, clock: +clock.toFixed(0), water: me.water, grit: me.grit }), result: null, W, STATS };
