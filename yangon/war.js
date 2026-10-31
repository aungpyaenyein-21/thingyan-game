// yangon/war.js — 「ရပ်ကွက်စစ်」 prototype (SCENARIO.md §၅, DIRECTION.md §၈-ခ): two kid gangs, steel slide-pump squirters fed
// by a jerry can on the back, fought silently on an open lot (or the alleys of two wards split by a creek). Nobody has HP —
// you have grit: get it in the face and it goes faster. At none you're OUT: nobody may spray you, you may only walk back,
// and you're in again once a drink at your own side's water-pot stand (ရေအိုးစင်) has filled your grit — slowly.
// Three rounds of three minutes: a gang that's all OUT at once has lost the round; at the bell, fewer OUTs takes it.
// Most rounds wins the match. Home side has four taps and holds its ground; the
// away side comes with an extra kid, one slow drum, and has to push in (and may use the home side's taps). One kid per tap.
import { createWorld } from '../world.js?v=12';
import { createSound } from '../sound.js?v=3';

const P = new URLSearchParams(location.search);
const MODE = P.get('mode'), AUTO = P.has('auto'), ALLEY = P.get('map') === 'alley'; // the open lot by default; the alleys if asked
const B = ALLEY ? { x0: -18, x1: 18, z0: -12, z1: 12 } : { x0: -14, x1: 14, z0: -9, z1: 9 };
const W = createWorld({ bounds: B, ground: () => .01, camBounds: ALLEY ? { x0: -16.5, x1: 16.5, z0: -10.5, z1: 10.5 } : { x0: -8, x1: 8, z0: -4.5, z1: 4.5 }, view: ALLEY ? 15 : innerWidth < innerHeight ? 11.5 : 15 }); // the lot is small: a phone held upright gets closer in
const { THREE, scene, box, mesh, rnd, pick } = W;
const sound = createSound(W);
const $ = id => document.getElementById(id);
const GRAV = -11, CAN = 3.5;
const STATS = { shots: 0, hits: 0, face: 0 }; // gravity as the town's water uses it; litres in a jerry can

// ---------- the set ----------
// lot: an open patch of ground between the two wards — knee-high brick walls and drums to dodge behind, nothing to hide a kid
// alley: two wards of house blocks either side of a creek, two bridges
const HOUSE = ['#efe3c8', '#e8c9a8', '#d8e2c8', '#e6d2e0', '#cfdbe6'], HOUSES = [], LOW = [];
const BRIDGES = ALLEY ? [{ z0: -1.6, z1: 1.6 }, { z0: 7, z1: 8.2 }] : [];
if (!ALLEY) {
  mesh(new THREE.PlaneGeometry(B.x1 - B.x0, B.z1 - B.z0).rotateX(-Math.PI / 2), '#d6c7ad', 0, 0, 0, { cast: false });
  mesh(new THREE.PlaneGeometry(.12, B.z1 - B.z0 - 1).rotateX(-Math.PI / 2), '#efe6d6', 0, .012, 0, { cast: false }); // a chalk line down the middle
  for (const s of [-1, 1]) box(B.x1 - B.x0, 1.1, .3, '#c9b79a', 0, 0, s * (B.z1 + .2)); // the compound walls along the sides
  for (const [x, z, w, d] of [[-6, -4.5, 3, .4], [-6, 4, .4, 2.6], [6, 4.5, 3, .4], [6, -4, .4, 2.6], [-2.6, 0, .4, 2.2], [2.6, 0, .4, 2.2], [-10, 6.5, 2.2, .4], [10, -6.5, 2.2, .4]]) {
    box(w, .6, d, '#b5654a', x, 0, z); W.solid(x, z, w, d); LOW.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, h: .6 }); // knee-high brick: dodge behind it, but a face shot goes over
  }
  for (const [x, z] of [[-3.5, -6.5], [3.5, 6.5], [0, -2.8], [0, 2.8]]) { mesh(new THREE.CylinderGeometry(.42, .38, .9, 12), '#6f8fb0', x, .45, z); W.solid(x, z, .8, .8); LOW.push({ x0: x - .4, x1: x + .4, z0: z - .4, z1: z + .4, h: .9 }); }
} else {
for (const s of [-1, 1]) mesh(new THREE.PlaneGeometry(B.x1 - 1.3, B.z1 - B.z0).rotateX(-Math.PI / 2), '#d9cfbf', s * (B.x1 + 1.3) / 2, 0, 0, { cast: false }); // the two banks
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
  const emit = c.anim.emit; c.anim.emit = (t, o) => { if (t !== 'squirt' && t !== 'squirtStart') emit(t, o); }; // the pump shoots from game logic, not the pose
  const k = { c, team, me, i, disc, lane: 0, outs: 0, lim: 0, tap: null, waiting: false, filling: false, grit: 1, water: CAN, state: 'fight', out: false, cool: 1 + rnd() * 1.5, think: 0, target: null, hitT: 9, dryT: 0, wipeT: 0, stuck: 0, side: 1, sideT: 0, navT: 0, wp: [0, 0], goal: [0, 0], faceAim: rnd() < .45, name: goggles ? 'ရေကူးမျက်မှန်' : '' };
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
// where a shot goes: at a kid (their face or their body), or along a direction for as far as the pull carries it
function plan(k, charge, target, dirIn) {
  const [o, f] = nozzle(k); let dir = (dirIn || f).clone().setY(0).normalize(), d = 2.5 + 6 * charge, ty = .35;
  if (target) { const tp = pos(target); dir.set(tp.x - o.x, 0, tp.z - o.z); d = Math.max(.5, dir.length()); dir.normalize(); ty = tp.y + H(target) * (k.faceAim || k.me ? .82 : .5); }
  const vh = 5 + 8 * charge, t = d / vh, vy = Math.min(3.6, (ty - o.y) / t - .5 * GRAV * t);
  return { o, dir, vh, vy, d };
}
function fire(k, charge, target, dirIn) {
  const cost = .15 + .3 * charge; if (k.water < cost) return false;
  k.water -= cost; k.c.anim.play('squirt'); sound.fx('squirt', pos(k)); STATS.shots++;
  const { o, dir, vh, vy, d } = plan(k, charge, target, dirIn); k.c.g.rotation.y = Math.atan2(dir.x, dir.z);
  const sharp = k.me && !AUTO, err = (sharp ? .03 : .09) * (1 + d / 6);
  for (let j = 0; j < 10; j++) {
    const a = Math.atan2(dir.x, dir.z) + (rnd() - .5) * 2 * err, sp = vh * (.9 + rnd() * .14);
    drops.push({ p: o.clone(), v: new THREE.Vector3(Math.sin(a) * sp, vy + (rnd() - .5) * .6 * (sharp ? .3 : 1), Math.cos(a) * sp), wait: j * .018, life: 1.4, own: k, dmg: .0035 + .004 * charge, push: dir, s: .8 + charge * .5 });
  }
  for (let j = 0; j < 5; j++) W.spawn(o.clone(), new THREE.Vector3(dir.x * 2 + (rnd() - .5) * 1.4, 1 + rnd(), dir.z * 2 + (rnd() - .5) * 1.4), { spray: true, s: .5, life: .35 }); // the burst at the nozzle
  if (k.me) shake = Math.max(shake, 2 + charge * 3); else if (pos(k).distanceTo(pos(me)) < 7) shake = Math.max(shake, .8);
  return true;
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
      if (k === d.own || k.team === d.own.team || k.out) continue; // nobody can get a kid who's OUT
      const p = pos(k), r = .34 * k.c.g.scale.x;
      if (Math.abs(d.p.x - p.x) > r || Math.abs(d.p.z - p.z) > r || d.p.y > p.y + H(k) || d.p.y < p.y) continue;
      dead = true; hit(k, d, (d.p.y - p.y) / H(k) > .66); break;
    }
    if (dead) { if (d.p.y < .1 || rnd() < .3) W.spawn(d.p.clone().setY(Math.max(.1, d.p.y)), new THREE.Vector3((rnd() - .5) * 1.5, 1 + rnd(), (rnd() - .5) * 1.5), { spray: true, s: .5, life: .4 }); continue; }
    drops[n++] = d;
  }
  drops.length = n;
}
let hitSnd = 0, shake = 0, stop = 0;
const pops = document.createElement('div'); pops.style.cssText = 'position:fixed;inset:0;z-index:3;pointer-events:none;overflow:hidden'; document.body.appendChild(pops);
function pop(k, text, color = '#fff') { // a word that jumps off the kid you got
  const v = pos(k).clone(); v.y += H(k) + .3; v.project(W.cam);
  const e = document.createElement('b'); e.textContent = text;
  e.style.cssText = `position:absolute;left:${(v.x * .5 + .5) * innerWidth}px;top:${(-v.y * .5 + .5) * innerHeight}px;transform:translate(-50%,-50%);font-size:22px;color:${color};text-shadow:0 2px 0 #3b2a3a,0 0 6px rgba(0,0,0,.4);transition:transform .6s ease-out,opacity .6s ease-in;white-space:nowrap`;
  pops.appendChild(e); requestAnimationFrame(() => { e.style.transform = 'translate(-50%,-150%) scale(1.25)'; e.style.opacity = 0; }); setTimeout(() => e.remove(), 650);
}
let drown = 0; // that water-up-your-nose feeling, for you
function hit(k, d, face) {
  const g = d.dmg * (face ? 2.2 : 1); STATS.hits++; if (face) STATS.face++;
  k.grit = Math.max(0, k.grit - g); k.hitT = 0; k.c.anim.soak(.25); if (k.wipeT > 0) k.wipeT = 0;
  const p = pos(k); p.addScaledVector(d.push, .045); W.collide(p); // the jet shoves you back a little
  for (let j = 0; j < 2; j++) W.spawn(d.p.clone(), new THREE.Vector3(-d.v.x * .15 + (rnd() - .5) * 2.4, 1.2 + rnd() * 1.6, -d.v.z * .15 + (rnd() - .5) * 2.4), { spray: true, s: .7, life: .5 });
  if (hitSnd <= 0) { sound.fx(face ? 'splash' : 'hit', p); hitSnd = .12; }
  if (k.me) { shake = Math.max(shake, face ? 7 : 4); drown = Math.min(1, drown + (face ? .07 : .03)); if (face) sting = Math.min(1, sting + .2); }
  if (d.own.me && (k.popT ?? 0) < W.time()) { k.popT = W.time() + .5; pop(k, face ? 'မျက်နှာ!' : 'ဖျန်း!', face ? '#ffe36b' : '#fff'); if (face) stop = .06; }
  if (k.grit <= 0) { goOut(k); if (d.own.me) { pop(k, 'OUT!', '#ff8a7a'); stop = .18; } }
}

// ---------- OUT: can't be sprayed, can only go back, in again once the water-pot stand has filled your grit ----------
const grey = new THREE.MeshBasicMaterial({ color: '#9a9a9a', transparent: true, opacity: .55, depthWrite: false });
function goOut(k) {
  if (k.out) return;
  k.out = true; k.state = 'out'; k.outs++; OUTS[k.team]++; k.lim = pos(k).x * SIDE[k.team]; k.c.anim.emote('drop');
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
function fillAt(k, r, dt) { // one kid per tap: the rest wait their turn
  if (r.user && r.user !== k) return false;
  r.user = k; k.filling = true; k.water = Math.min(CAN, k.water + r.rate * dt); if (k.water >= CAN - .02) r.user = null; return true;
}
function pickRefill(k) { // the nearest free one, keeping clear of a spot the other gang is standing round
  const p = pos(k); let best = null, bd = 1e9;
  for (const r of REFILL) { let c = Math.hypot(r.x - p.x, r.z - p.z); if (r.user && r.user !== k) c += 6; if (ALLEY && sideOf(r.x) !== sideOf(p.x)) c += 6;
    for (const o of enemies(k)) if (Math.hypot(pos(o).x - r.x, pos(o).z - r.z) < 4) c += 3; if (c < bd) { bd = c; best = r; } }
  return best;
}
// the alleys as a little graph: the back road, the middle alley and the creek road on each side, the cross alleys, two bridges
const NODES = [], EDGES = [];
for (const s of [-1, 1]) {
  if (!ALLEY) break;
  const xs = [16.6, 8.5, 2.1].map(x => s * x), zs = [-10.6, -4.4, 0, 4.4, 7.6, 10.6];
  for (const x of xs) for (const z of zs) if (z !== 0 && z !== 7.6 || Math.abs(x) < 3) NODES.push({ x, z }); // z 0 and 7.6: only on the creek road (the bridges)
}
const at = (x, z) => NODES.findIndex(n => Math.abs(n.x - x) < .01 && Math.abs(n.z - z) < .01);
function walkable(ax, az, bx, bz) { // a straight line a kid could walk
  const n = Math.max(2, Math.ceil(Math.hypot(bx - ax, bz - az) / .3));
  for (let i = 1; i < n; i++) { const t = i / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
    if (ALLEY && Math.abs(x) < 1.6 && !BRIDGES.some(b => z > b.z0 + .2 && z < b.z1 - .2)) return false;
    for (const h of HOUSES) if (x > h.x0 - .32 && x < h.x1 + .32 && z > h.z0 - .32 && z < h.z1 + .32) return false; }
  return true;
}
NODES.forEach((a, i) => NODES.forEach((b, j) => { if (j > i && (a.x === b.x || a.z === b.z) && walkable(a.x, a.z, b.x, b.z)) { (EDGES[i] ??= []).push(j); (EDGES[j] ??= []).push(i); } }));
function nextStep(px, pz, gx, gz) { // straight there if we can, else along the alleys (Dijkstra over a couple of dozen corners)
  if (walkable(px, pz, gx, gz)) return [gx, gz];
  const N = NODES.length, dist = new Array(N).fill(1e9), from = new Array(N).fill(-1), done = new Array(N).fill(false);
  const goalSeen = NODES.map(n => walkable(n.x, n.z, gx, gz));
  NODES.forEach((n, i) => { if (walkable(px, pz, n.x, n.z)) { dist[i] = Math.hypot(n.x - px, n.z - pz); from[i] = -2; } });
  let best = -1, bestD = 1e9;
  for (;;) {
    let u = -1; for (let i = 0; i < N; i++) if (!done[i] && dist[i] < 1e9 && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0) break; done[u] = true;
    if (goalSeen[u]) { const d = dist[u] + Math.hypot(gx - NODES[u].x, gz - NODES[u].z); if (d < bestD) { bestD = d; best = u; } }
    for (const v of EDGES[u] ?? []) { const d = dist[u] + Math.hypot(NODES[v].x - NODES[u].x, NODES[v].z - NODES[u].z); if (d < dist[v]) { dist[v] = d; from[v] = u; } }
  }
  if (best < 0) return [gx, gz];
  let u = best; while (from[u] >= 0) u = from[u];
  return [NODES[u].x, NODES[u].z];
}
function walk(k, gx, gz, run, dt) {
  const c = k.c, p = c.g.position;
  if ((k.navT -= dt) <= 0 || Math.hypot(k.wp[0] - p.x, k.wp[1] - p.z) < .35 || Math.hypot(k.goal[0] - gx, k.goal[1] - gz) > 1) { k.navT = .4; k.goal = [gx, gz]; k.wp = nextStep(p.x, p.z, gx, gz); }
  const [tx, tz] = k.wp, dx = tx - p.x, dz = tz - p.z, l = Math.hypot(dx, dz);
  if (l < .25) { if (c.anim.loop !== 'idle') c.anim.setLoop('idle'); return; }
  const loop = run ? 'run' : 'walk'; if (c.anim.loop !== loop) c.anim.setLoop(loop);
  let a = Math.atan2(dx, dz); if (k.stuck > .5) a += k.side * 1.3; // slide round a corner
  let d = a - c.g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); c.g.rotation.y += d * Math.min(1, dt * 8);
  const ox = p.x, oz = p.z, s = c.anim.speed * dt; p.x += Math.sin(a) * s; p.z += Math.cos(a) * s; W.collide(p);
  k.stuck = Math.hypot(p.x - ox, p.z - oz) < s * .35 ? k.stuck + dt : Math.max(0, k.stuck - dt); if (k.stuck > 1.6) { k.stuck = 0; k.side = -k.side; }
}
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
    if (STANCE[t] && st !== STANCE[t] && playing) say(t === 'A' ? (st === 'attack' ? 'ငါတို့ ဘက် တိုက်စစ် ဖွင့်ပြီ!' : 'ငါတို့ ဘက် နောက်ဆုတ်ပြီး ခံတိုက်') : (st === 'attack' ? '④ တိုက်စစ် ဖွင့်လာပြီ!' : '④ နောက်ဆုတ်ပြီး ခံနေပြီ'), 2.2);
    STANCE[t] = st;
    const f = kids.filter(k => k.team === t && !k.out).sort((p, q) => pos(p).z - pos(q).z);
    f.forEach((k, i) => { const z = -LANE + (i + .5) * 2 * LANE / f.length; k.lane = ALLEY ? LANES_ALLEY.reduce((b, l) => Math.abs(l - (i - (f.length - 1) / 2) * 5) < Math.abs(b - (i - (f.length - 1) / 2) * 5) ? l : b) : z; });
  }
}
function engage(k, t) { // where to stand against one kid: close in, back off, or step sideways
  const p = pos(k), tp = pos(t), d = tp.distanceTo(p);
  if ((k.sideT -= .016) < 0) { k.sideT = 1 + rnd() * 1.5; k.side = rnd() < .5 ? -1 : 1; }
  if (d > 5 || !clear(p, tp)) return [tp.x, tp.z, d > 8];
  if (d < 2.8) return [p.x - (tp.x - p.x), p.z - (tp.z - p.z), false];
  const a = Math.atan2(tp.x - p.x, tp.z - p.z) + k.side * Math.PI / 2; return [p.x + Math.sin(a) * 2, p.z + Math.cos(a) * 2, false];
}
function brain(k, dt) {
  const c = k.c, p = pos(k), s = SIDE[k.team], R = REST[k.team];
  k.waiting = false;
  if (k.out) { if (!atRest(k)) walk(k, R.gx, R.z + (k.i - 2.5) * .35, true, dt); else if (c.anim.loop !== 'idle') c.anim.setLoop('idle'); return; }
  if (k.state === 'wipe') { if ((k.wipeT -= dt) <= 0) { k.grit = Math.min(1, k.grit + .12); k.state = 'fight'; } return; }
  const foes = enemies(k); if (!foes.length) { if (c.anim.loop !== 'idle') c.anim.setLoop('idle'); return; }
  if ((k.think -= dt) <= 0) {
    k.think = .3 + rnd() * .2; const [t, near] = nearest(k, foes); k.target = t;
    if (k.water < .7 && k.state === 'fight') { k.state = 'refill'; k.tap = null; }
    if (k.state === 'refill' && (!k.tap || k.tap.user && k.tap.user !== k && rnd() < .3)) k.tap = pickRefill(k);
    if (k.state === 'fight' && k.grit < .15 && near > 4) k.state = 'rest';
    if (k.state === 'fight' && k.grit < .4 && near > 5 && rnd() < .15) { k.state = 'wipe'; k.wipeT = 1.2; c.anim.setLoop('idle'); c.anim.emote('drop'); return; }
  }
  if (k.state === 'rest') { // a drink at the water-pot stand
    if (!atRest(k)) walk(k, R.gx, R.z + (k.i - 2.5) * .35, true, dt); else if (c.anim.loop !== 'idle') c.anim.setLoop('idle');
    if (k.grit >= .7) k.state = 'fight';
    if (k.water >= .4 && k.target && pos(k.target).distanceTo(p) < 4) shootAt(k, dt);
    return;
  }
  if (k.state === 'refill') {
    const r = k.tap ?? (k.tap = pickRefill(k)), dd = Math.hypot(r.x - p.x, r.z - p.z);
    if (dd < 1.15 && fillAt(k, r, dt)) { if (c.anim.loop !== 'idle') c.anim.setLoop('idle'); if (k.water >= CAN - .05) { k.state = 'fight'; k.tap = null; } }
    else if (r.user && r.user !== k && dd < 2.4) { k.waiting = true; if (c.anim.loop !== 'idle') c.anim.setLoop('idle'); }
    else walk(k, r.x + .9 * Math.sign(p.x - r.x || 1), r.z, true, dt);
    if (k.water >= .4 && k.target && pos(k.target).distanceTo(p) < 3.5) shootAt(k, dt); // caught at the tap: still shoot back
    return;
  }
  let gx, gz, run = false;
  if (STANCE[k.team] === 'defend') {
    const [intr, di] = nearest(k, foes.filter(o => pos(o).x * s > (ALLEY ? 2 : -1.5))); // someone's come over to our side
    if (intr && di < 7) { [gx, gz, run] = engage(k, intr); k.target = intr; }
    else { gx = s * (ALLEY ? 8.5 : 5.2); gz = k.lane; run = Math.abs(p.x - gx) > 4; }
  } else {
    const deep = -s * (ALLEY ? 8.5 : 7.5), t = k.target, d = t ? pos(t).distanceTo(p) : 99;
    if (t && d < 5.5 && clear(p, pos(t))) { [gx, gz] = engage(k, t); gx -= s * 1.2; } // fight it out — but keep pressing on
    else { gx = deep; gz = k.lane; run = Math.abs(p.x - deep) > 4; }
  }
  for (const q of kids) { if (q === k || q.team !== k.team || q.out) continue; // spread out
    const dx = p.x - pos(q).x, dz = p.z - pos(q).z, l = Math.hypot(dx, dz); if (l < 1.8 && l > .01) { gx += dx / l * (1.8 - l) * 2; gz += dz / l * (1.8 - l) * 2; } }
  if (Math.hypot(gx - p.x, gz - p.z) < .3) { if (c.anim.loop !== 'idle') c.anim.setLoop('idle'); } else walk(k, gx, gz, run, dt);
  shootAt(k, dt);
}
function shootAt(k, dt) { // at whoever's nearest and in sight
  if ((k.cool -= dt) > 0 || k.c.anim.one) return;
  const p = pos(k); let t = null, bd = 7; for (const o of enemies(k)) { const d = pos(o).distanceTo(p); if (d < bd && clear(p, pos(o))) { bd = d; t = o; } }
  if (!t) return; k.target = t; k.faceAim = rnd() < .45;
  if (fire(k, .35 + rnd() * .55, t)) k.cool = .9 + rnd() * .7;
}

// ---------- you ----------
// The pad: tap it = the pump goes at the nearest kid you can see; press and drag = aim yourself (the way the drag points),
// the longer you hold the further it carries. A dotted arc shows where it'll land; a red ring marks who it'll hit.
// PC: the mouse aims (hold the button to pull), Space / J fire at the nearest.
let charge = 0, holding = false, sting = 0, aimDir = null, dragFrom = null, mouseAim = null;
const ringEl = $('ring');
const RIGHT = new THREE.Vector3(1, 0, -1).normalize(), UP = new THREE.Vector3(-1, 0, -1).normalize(); // the screen's right and up, on the ground (the world's iso camera)
function visibleFoes() { const p = pos(me); return enemies(me).filter(o => pos(o).distanceTo(p) < 10 && clear(p, pos(o))); }
function autoTarget() { let best = null, bd = 1e9; for (const o of visibleFoes()) { const d = pos(o).distanceTo(pos(me)); if (d < bd) { bd = d; best = o; } } return best; }
function rayTarget(dir) { // the kid nearest the line you're aiming along (never one who's OUT)
  const p = pos(me); let best = null, ba = .3;
  for (const o of kids) { if (o === me || o.team === me.team || o.out) continue; const tp = pos(o), d = tp.distanceTo(p); if (d > 10) continue;
    let a = Math.atan2(tp.x - p.x, tp.z - p.z) - Math.atan2(dir.x, dir.z); a = Math.abs(Math.atan2(Math.sin(a), Math.cos(a))); if (a < ba && clear(p, tp)) { ba = a; best = o; } }
  return best;
}
const aimNow = () => { const d = mouseAim ? mouseAim.clone().sub(pos(me)).setY(0) : aimDir; return d && d.lengthSq() > .01 ? d.normalize() : null; };
const targetNow = () => { const d = aimNow(); return d ? rayTarget(d) : autoTarget(); };
const press = on => {
  if (!playing || me.out || me.state === 'wipe') return;
  if (on) { holding = true; $('fire').classList.add('on'); }
  else if (holding) { holding = false; $('fire').classList.remove('on'); const d = aimNow(), t = targetNow(); if (!fire(me, Math.max(.15, charge), t, t ? null : d)) say('ရေကုန်ပြီ — ပိုက်ခေါင်း/ရေစည်ဆီ သွားဖြည့်', 2); charge = 0; aimDir = null; dragFrom = null; }
};
const wipe = () => { if (!playing || me.out || me.state === 'wipe') return; drown = 0; me.state = 'wipe'; me.wipeT = 1.2; holding = false; charge = 0; W.frozen = true; $('wipe').classList.add('on'); };
$('fire').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); dragFrom = [e.clientX, e.clientY, e.pointerId]; aimDir = null; try { $('fire').setPointerCapture(e.pointerId); } catch {} press(true); });
$('fire').addEventListener('pointermove', e => { if (!dragFrom || e.pointerId !== dragFrom[2]) return; const dx = e.clientX - dragFrom[0], dy = dragFrom[1] - e.clientY;
  aimDir = Math.hypot(dx, dy) > 16 ? new THREE.Vector3().addScaledVector(RIGHT, dx).addScaledVector(UP, dy) : null; });
$('fire').addEventListener('pointerup', e => { e.stopPropagation(); press(false); });
$('fire').addEventListener('pointercancel', () => press(false));
$('wipe').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); wipe(); });
addEventListener('keydown', e => { if (e.repeat) return; if (e.code === 'Space' || e.code === 'KeyJ') { mouseAim = null; press(true); e.preventDefault(); } if (e.code === 'KeyF') wipe(); }, true);
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
function showAim() {
  const t = playing && !me.out && me.state !== 'wipe' ? targetNow() : null;
  mark.visible = !!t; if (t) { mark.position.set(pos(t).x, .03, pos(t).z); mark.scale.setScalar(1 + Math.sin(W.time() * 8) * .06); }
  if (!holding) { arc.count = 0; return; }
  const d = aimNow(); if (t || d) me.c.g.rotation.y = t ? Math.atan2(pos(t).x - pos(me).x, pos(t).z - pos(me).z) : Math.atan2(d.x, d.z);
  const { o, dir, vh, vy } = plan(me, Math.max(.15, charge), t, t ? null : d);
  let n = 0; for (let i = 1; i <= NA; i++) { const tt = i * .045, y = o.y + vy * tt + .5 * GRAV * tt * tt; if (y < .05) break; arc.setMatrixAt(n++, tm.compose(tv.set(o.x + dir.x * vh * tt, y, o.z + dir.z * vh * tt), tq, ts.setScalar(1))); }
  arc.count = n; arc.instanceMatrix.needsUpdate = true;
}

function mine(dt) {
  me.waiting = false;
  if (me.out) { const x = pos(me).x * SIDE.A; if (x < me.lim) pos(me).x = me.lim * SIDE.A; else me.lim = x; return; } // OUT: backwards only
  if (me.state === 'wipe') { if ((me.wipeT -= dt) <= 0) { me.grit = Math.min(1, me.grit + .12); sting = Math.max(0, sting - .6); me.state = 'fight'; W.frozen = false; $('wipe').classList.remove('on'); } return; }
  if (holding) charge = Math.min(1, charge + dt / .7);
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
  if (ended) return; ended = true; if (winner) wins[winner]++; rounds.push(winner); roundLabel();
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
  round++; clock = ROUND; ended = false; hinted = false; drops.length = 0; OUTS.A = OUTS.B = 0; STANCE.A = STANCE.B = ''; teamT = 0;
  for (const r of REFILL) r.user = null;
  for (const k of kids) {
    Object.assign(k, { grit: 1, water: CAN, out: false, state: 'fight', tap: null, waiting: false, wipeT: 0, stuck: 0, navT: 0, cool: 1 + rnd() * 1.5, target: null });
    if (k.disc?.userData.m) k.disc.material = k.disc.userData.m;
    k.c.g.position.set(k.start[0], 0, k.start[1]); k.c.g.rotation.y = k.start[2]; k.c.anim.setLoop('idle');
  }
  holding = false; charge = 0; drown = 0; sting = 0; $('wipe').classList.remove('on');
  W.snapCam(); $('end').hidden = true; playing = true; W.frozen = false; window.war.result = null; scored = ''; score(); roundLabel();
  say(`ပွဲ ${MY(round)} — စ!`, 2);
}
const go = mode => { location.search = '?mode=' + mode + (ALLEY ? '&map=alley' : '') + (AUTO ? '&auto' : '') + (P.has('debug') ? '&debug' : '') + (P.get('dt') ? '&dt=' + P.get('dt') : '') + (P.get('q') ? '&q=' + P.get('q') : ''); };
$('home').onclick = () => go('home'); $('away').onclick = () => go('away');
$('alley').onclick = () => { location.search = '?map=' + (ALLEY ? 'lot' : 'alley') + (AUTO ? '&auto' : ''); };
$('alley').textContent = ALLEY ? 'မြေပုံ: လမ်းကြား → ကွက်လပ်' : 'မြေပုံ: ကွက်လပ် → လမ်းကြား';
$('again').onclick = () => { if (round < 3 && !window.war.final) nextRound(); else go(MODE || 'home'); }; $('menu').onclick = () => { location.search = (ALLEY ? '?map=alley' : '?') + (AUTO ? '&auto' : ''); };
function begin() {
  $('start').hidden = true; playing = true; W.frozen = false; score(); roundLabel();
  say(HOME === 'A' ? '④ ဂိုဏ်း ဝင်လာပြီ — ကိုယ့်ဘက်ကို ကာ!' : '④ ဘက်ကို ဖောက်ဝင်တိုက် — သူတို့ ပိုက်ခေါင်းလည်း သုံးလို့ရ', 3);
  setTimeout(() => playing && say(matchMedia('(pointer:coarse)').matches ? 'ပက် ကို တို့ = အနီးဆုံးကို ချိန် · ဖိပြီး ဆွဲ = ကိုယ်တိုင် ချိန်' : 'mouse နဲ့ ချိန်၊ ဖိထား = ဆွဲ၊ လွှတ် = ပက် · Space = အနီးဆုံး', 4), 3200);
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
  if (playing) {
    teams(dt);
    for (const k of kids) { k.hitT += dt; if (atRest(k) && k.grit < 1) { k.grit = Math.min(1, k.grit + REST_RATE * dt); if (k.out && k.grit >= 1) comeBack(k); } }
    if (AUTO) brain(me, dt); else mine(dt);
    for (const k of kids) if (!k.me) brain(k, dt);
    for (const r of REFILL) { if (r.user && (r.user.out || Math.hypot(pos(r.user).x - r.x, pos(r.user).z - r.z) > 1.3)) r.user = null; r.stream.visible = !!r.user && r.user.filling; }
    score();
    if (!ended && (clock -= dt) <= 0) { clock = 0; timeUp(); }
    $('clock').textContent = `${Math.floor(clock / 60)}:${String(Math.floor(clock % 60)).padStart(2, '0')}`;
  }
  stepDrops(dt); showAim(); tags();
  REST.A.ring.material.opacity = me.out ? .55 + Math.sin(W.time() * 6) * .35 : .45;
  shake = Math.max(0, shake - dt * 30); drown = Math.max(0, drown - dt * .3);
  const sw = drown > .05 ? ` scale(${(1 + drown * .025 * (1 + Math.sin(W.time() * 4.5))).toFixed(4)})` : '';
  W.renderer.domElement.style.transform = (shake > .2 ? `translate(${((rnd() - .5) * shake).toFixed(1)}px,${((rnd() - .5) * shake).toFixed(1)}px)` : '') + sw;
  if (stop > 0) { const s = stop; stop = 0; W.paused = true; setTimeout(() => { W.paused = false; }, s * 1000); } // a beat of stillness when a shot really lands
  sting = Math.max(0, sting - dt * .35); $('sting').style.opacity = sting.toFixed(2); film.style.opacity = Math.min(1, drown * 1.6).toFixed(2);
  const bl = Math.max(sting > .25 ? sting * 2.2 : 0, drown * 2.4);
  W.renderer.domElement.style.filter = bl > .3 ? `blur(${bl.toFixed(1)}px)` + (drown > .1 ? ` saturate(${(1 - drown * .35).toFixed(2)}) hue-rotate(${(-drown * 12).toFixed(0)}deg)` : '') : '';
  $('water').firstChild.style.width = (me.water / CAN * 100) + '%'; $('grit').firstChild.style.width = (me.grit * 100) + '%';
  $('note').textContent = me.out ? 'OUT — ရေအိုးစင် ပြန်သွား' : atRest(me) && me.grit < 1 ? 'ခံနိုင်ရည် ဖြည့်နေတယ်…' : me.filling ? 'ရေဖြည့်နေတယ်…' : me.waiting ? 'ပိုက်ခေါင်း မအားသေး — စောင့်' : me.water < .6 ? 'ရေကုန်ခါနီး!' : '';
  ringEl.setAttribute('stroke-dashoffset', (333 * (1 - charge)).toFixed(0));
  $('wipe').classList.toggle('hint', drown > .4 && !me.out && me.state !== 'wipe'); // the wipe pad pulses while water's up your nose
  if (drown > .5 && !hinted && playing && !AUTO) { hinted = true; say('ရေမွန်းနေပြီ — 「သုတ်」 နဲ့ မျက်နှာ သုတ်', 2.5); }
});

W.start();
window.war = { kids, me, state: () => ({ playing, ended, A: active('A'), B: active('B'), outs: { ...OUTS }, stance: { ...STANCE }, clock: +clock.toFixed(0), water: me.water, grit: me.grit }), result: null, fire, W, STATS };
