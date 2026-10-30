// yangon/war.js — 「ရပ်ကွက်စစ်」 prototype (SCENARIO.md §၅, DIRECTION.md §၈-ခ): two kid gangs, steel slide-pump squirters fed
// by a jerry can on the back, fought silently through the alleys of two wards split by a creek. Nobody has HP — you have
// grit: get it in the face and it goes faster; at none you run for it. Run dry and can't refill: you sit down. Spray a kid
// who's sitting out and the game's off. Last kid standing wins it for the gang. Home side refills fast at its own taps;
// the away side comes with an extra kid and has to fight for water.
import { createWorld } from '../world.js?v=11';
import { createSound } from '../sound.js?v=3';

const P = new URLSearchParams(location.search);
const MODE = P.get('mode'), AUTO = P.has('auto');
const B = { x0: -18, x1: 18, z0: -12, z1: 12 };
const W = createWorld({ bounds: B, ground: () => .01, camBounds: { x0: -16.5, x1: 16.5, z0: -10.5, z1: 10.5 }, view: 15 });
const { THREE, scene, box, mesh, rnd, pick } = W;
const sound = createSound(W);
const $ = id => document.getElementById(id);
const GRAV = -11, CAN = 3.5;
const STATS = { shots: 0, hits: 0, face: 0 }; // gravity as the town's water uses it; litres in a jerry can

// ---------- the set: two wards of house blocks either side of a creek, two bridges ----------
for (const s of [-1, 1]) mesh(new THREE.PlaneGeometry(B.x1 - 1.3, B.z1 - B.z0).rotateX(-Math.PI / 2), '#d9cfbf', s * (B.x1 + 1.3) / 2, 0, 0, { cast: false }); // the two banks
mesh(new THREE.PlaneGeometry(2.6, B.z1 - B.z0).rotateX(-Math.PI / 2), '#5fa3c4', 0, -.04, 0, { cast: false }); // the creek
const BRIDGES = [{ z0: -1.6, z1: 1.6 }, { z0: 7, z1: 8.2 }];
for (const b of BRIDGES) box(3.2, .08, b.z1 - b.z0, b.z1 - b.z0 > 2 ? '#a99b88' : '#8a6a4a', 0, 0, (b.z0 + b.z1) / 2);
let zc = B.z0; // the creek's banks are walls, except at the bridges
for (const b of [...BRIDGES, { z0: B.z1, z1: B.z1 }]) { if (b.z0 > zc) W.solid(0, (zc + b.z0) / 2, 2.6, b.z0 - zc); zc = b.z1; }
const HOUSE = ['#efe3c8', '#e8c9a8', '#d8e2c8', '#e6d2e0', '#cfdbe6'], HOUSES = [];
for (const s of [-1, 1]) for (const [x, z, w, d] of [[12.5, -8.5, 5, 5], [5, -8.5, 4, 5], [12.5, 0, 5, 5], [5, 0, 4, 5], [12.5, 8.5, 5, 5], [5, 8.5, 4, 5]]) {
  const h = 2 + rnd(), X = s * x, c = pick(HOUSE);
  W.occluder(() => { // see-through when it stands between the camera and you
    box(w, h, d, c, X, 0, z); box(w + .3, .25, d + .3, '#b0553d', X, h, z); // walls + a tin roof
    for (let k = -1; k <= 1; k += 2) box(.6, .7, .05, '#3b3040', X + k * w * .25, 1, z + d / 2 + .01, { cast: false }); // windows facing the alley
  });
  W.solid(X, z, w, d); HOUSES.push({ x0: X - w / 2, x1: X + w / 2, z0: z - d / 2, z1: z + d / 2, h });
}

// ---------- modes: whose ward we fight in ----------
// home: ① (us) defends the west side, taps by our houses; ④ comes over with six. away: we go over to ④ with six.
const HOME = MODE === 'away' ? 'B' : 'A', SIDE = { A: -1, B: 1 };
const REFILL = [];
{ const s = SIDE[HOME], a = HOME === 'A' ? 'B' : 'A';
  for (const [x, z] of [[8.6, -4.6], [15.6, 4.4], [8.6, 4.6], [2.4, -5]]) REFILL.push({ x: s * x, z, rate: 1.7, kind: 'tap' }); // the home side's taps
  REFILL.push({ x: SIDE[a] * 3.2, z: -3.2, rate: .55, kind: 'drum' }); } // one slow drum on the far bank for the visitors
for (const r of REFILL) {
  if (r.kind === 'tap') { box(.18, .9, .18, '#7a7f88', r.x, 0, r.z); box(.36, .08, .12, '#9aa2ac', r.x, .82, r.z + .08); }
  else { mesh(new THREE.CylinderGeometry(.42, .38, .9, 12), '#3f6fa8', r.x, .45, r.z); }
  W.solid(r.x, r.z, .4, .4);
}

// ---------- the kids ----------
const TEAM = { A: { top: '#2f8fd6', hat: 'band' }, B: { top: '#e0574f', hat: 'none' } };
const kids = [];
const silver = new THREE.MeshLambertMaterial({ color: '#cfd5dc' }), green = new THREE.MeshLambertMaterial({ color: '#5fe04a' }), red = new THREE.MeshLambertMaterial({ color: '#d8352a' }),
  white = new THREE.MeshLambertMaterial({ color: '#f4f1e8' });
function gear(ch) { // the pump in the right hand, the jerry can on the back, the red hose between
  const hand = ch.arms[1].hand, g = new THREE.Group(); hand.add(g);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .82, 6), silver); pipe.position.y = -.3; g.add(pipe);
  for (const y of [-.02, -.52]) { const grip = new THREE.Mesh(new THREE.CylinderGeometry(.038, .038, .14, 6), green); grip.position.y = y; g.add(grip); }
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .06, 6), red); tip.position.y = -.72; g.add(tip);
  const can = new THREE.Mesh(new THREE.BoxGeometry(.24, .3, .13), white); can.position.set(0, .12, -.2); ch.spine.add(can);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .05, 6), red); cap.position.set(.07, .29, -.2); ch.spine.add(cap);
  const hose = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(.07, .3, -.2), new THREE.Vector3(.16, .36, -.05), new THREE.Vector3(.24, .2, .06)]), 8, .014, 4), red);
  ch.spine.add(hose);
}
function makeKid(team, i, me) {
  const s = SIDE[team], home = team === HOME;
  const n = SIZE[team], x = s * (16.4 + (i % 2) * .6), z = -8.5 + i * 17 / (n - 1); // both gangs start at the back of their own ward
  const goggles = team === 'B' && i === 1;
  const c = W.bean({ age: 'kid', tools: ['none'], tool: 'none', topStyle: pick(['tee', 'stripe', 'tank']), shirt: TEAM[team].top, hat: goggles ? 'goggles' : TEAM[team].hat, x, z, ry: -s * Math.PI / 2 });
  gear(c.ch); c.dry = true;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(.42, 18).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: team === 'A' ? '#2f8fd6' : '#e0574f', transparent: true, opacity: .55, depthWrite: false }));
  disc.position.y = .02; disc.scale.setScalar(1 / c.g.scale.x); if (!me) c.g.add(disc); // which gang, at a glance (you have your own ring) // our own water does the hitting (the town's only hits what's on screen)
  const emit = c.anim.emit; c.anim.emit = (t, o) => { if (t !== 'squirt' && t !== 'squirtStart') emit(t, o); }; // the pump shoots from game logic, not the pose
  const k = { c, team, me, i, grit: 1, water: CAN, state: 'fight', out: false, cool: 1 + rnd() * 1.5, think: 0, target: null, hitT: 9, dryT: 0, wipeT: 0, stuck: 0, side: 1, sideT: 0, navT: 0, wp: [0, 0], goal: [0, 0], faceAim: rnd() < .45, name: goggles ? 'ရေကူးမျက်မှန်' : '' };
  kids.push(k); return k;
}
const SIZE = { A: HOME === 'A' ? 5 : 6, B: HOME === 'B' ? 5 : 6 };
const me = makeKid('A', 0, true);
for (let i = 1; i < SIZE.A; i++) makeKid('A', i, false);
for (let i = 0; i < SIZE.B; i++) makeKid('B', i, false);
W.setPlayer(me.c);

// ---------- water: logical jets (they hit anyone, on screen or not) drawn as our own drops ----------
const NJ = 420, jetMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.075, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(.9, 1.25, 1.55) }), NJ);
jetMesh.frustumCulled = false; jetMesh.count = 0; scene.add(W.keep(jetMesh));
const drops = [], tm = new THREE.Matrix4(), tq = new THREE.Quaternion(), ts = new THREE.Vector3(), tv = new THREE.Vector3();
const pos = k => k.c.g.position, H = k => 1.45 * k.c.g.scale.x;
const sideOf = x => (x < -1.3 ? -1 : x > 1.3 ? 1 : 0);
function blocked(x, y, z) { for (const h of HOUSES) if (x > h.x0 && x < h.x1 && z > h.z0 && z < h.z1 && y < h.h + .25) return true; return false; }
function clear(a, b) { // line of sight between two kids, chest high
  const n = Math.ceil(a.distanceTo(b) / .5); for (let i = 1; i < n; i++) { const t = i / n; if (blocked(a.x + (b.x - a.x) * t, 1, a.z + (b.z - a.z) * t)) return false; } return true;
}
function fire(k, charge, target) {
  const cost = .15 + .3 * charge; if (k.water < cost) return false;
  k.water -= cost; k.c.anim.play('squirt'); sound.fx('squirt', pos(k)); STATS.shots++;
  const o = pos(k).clone(), f = new THREE.Vector3(Math.sin(k.c.g.rotation.y), 0, Math.cos(k.c.g.rotation.y));
  o.addScaledVector(f, .45); o.y += .95 * k.c.g.scale.x;
  let dir = f.clone(), d = 6, ty = o.y;
  if (target) { const tp = pos(target); dir.set(tp.x - o.x, 0, tp.z - o.z); d = Math.max(.5, dir.length()); dir.normalize(); ty = tp.y + H(target) * (k.faceAim || k.me ? .82 : .5); k.c.g.rotation.y = Math.atan2(dir.x, dir.z); }
  const sharp = k.me && !AUTO, vh = 5 + 8 * charge, err = (sharp ? .03 : .09) * (1 + d / 6);
  for (let j = 0; j < 7; j++) {
    const a = Math.atan2(dir.x, dir.z) + (rnd() - .5) * 2 * err, sp = vh * (.9 + rnd() * .14), t = d / sp;
    const vy = Math.min(3.6, (ty - o.y) / t - .5 * GRAV * t) + (rnd() - .5) * .6 * (sharp ? .3 : 1);
    drops.push({ p: o.clone(), v: new THREE.Vector3(Math.sin(a) * sp, vy, Math.cos(a) * sp), wait: j * .022, life: 1.4, own: k, dmg: .009 + .01 * charge });
  }
  return true;
}
function stepDrops(dt) { // in small steps, so a fast jet can't skip past a kid in one slow frame
  const n = Math.min(12, Math.ceil(dt * 60)); for (let i = 0; i < n; i++) moveDrops(dt / n);
  let m = 0; for (const d of drops) { if (d.wait > 0 || m >= NJ - 2) continue;
    for (let t = 0; t < 2; t++) jetMesh.setMatrixAt(m++, tm.compose(tv.copy(d.p).addScaledVector(d.v, -.018 * t), tq, ts.setScalar(1 - t * .25))); }
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
      if (k === d.own || k.team === d.own.team && !k.out) continue;
      const p = pos(k), r = .34 * k.c.g.scale.x;
      if (Math.abs(d.p.x - p.x) > r || Math.abs(d.p.z - p.z) > r || d.p.y > p.y + H(k) || d.p.y < p.y) continue;
      dead = true; hit(k, d, (d.p.y - p.y) / H(k) > .66); break;
    }
    if (dead) { if (d.p.y < .1 || rnd() < .3) W.spawn(d.p.clone().setY(Math.max(.1, d.p.y)), new THREE.Vector3((rnd() - .5) * 1.5, 1 + rnd(), (rnd() - .5) * 1.5), { spray: true, s: .5, life: .4 }); continue; }
    drops[n++] = d;
  }
  drops.length = n;
}
let hitSnd = 0;
function hit(k, d, face) {
  if (k.out) { if (d.own.me) foul(k); return; } // the unwritten rule: a kid sitting out is not a target
  const g = d.dmg * (face ? 2.5 : 1); STATS.hits++; if (face) STATS.face++;
  k.grit = Math.max(0, k.grit - g); k.hitT = 0; k.c.anim.soak(.25); if (k.wipeT > 0) k.wipeT = 0;
  if (hitSnd <= 0) { sound.fx('hit', pos(k)); hitSnd = .12; }
  if (k.me && face) sting = Math.min(1, sting + .25);
  if (k.grit <= 0) knockOut(k, 'grit');
}

// ---------- out: no grit left → run for it; dry and nowhere to fill → sit down where you are ----------
function knockOut(k, why) {
  if (k.state === 'flee' || k.out) return;
  if (why === 'grit' && !k.me) { k.state = 'flee'; k.c.anim.emote('drop'); return; }
  sitOut(k, why);
}
function sitOut(k, why) {
  k.out = true; k.state = 'out'; k.c.anim.setLoop('sit'); const disc = k.c.g.children.find(o => o.geometry?.type === 'CircleGeometry'); if (disc) disc.material = disc.material.clone(), disc.material.color.set('#9a9a9a');
  if (k.me) { say(why === 'water' ? 'ရေကုန်သွားလို့ ထိုင်ရပြီ…' : 'မခံနိုင်တော့ဘူး… ထွက်လိုက်ရပြီ', 3); W.frozen = true; }
  score(); checkEnd();
}

// ---------- the kids' heads ----------
const enemies = k => kids.filter(o => o.team !== k.team && !o.out && o.state !== 'flee');
const nearest = (k, list) => { let b = null, bd = 1e9; for (const o of list) { const d = pos(o).distanceTo(pos(k)); if (d < bd) { bd = d; b = o; } } return [b, bd]; };
function canRefill(k) { for (const r of REFILL) if (Math.hypot(r.x - pos(k).x, r.z - pos(k).z) < 1.15) return r; return null; }
// the alleys as a little graph: the back road, the middle alley and the creek road on each side, the cross alleys, two bridges
const NODES = [], EDGES = [];
for (const s of [-1, 1]) {
  const xs = [16.6, 8.5, 2.1].map(x => s * x), zs = [-10.6, -4.4, 0, 4.4, 7.6, 10.6];
  for (const x of xs) for (const z of zs) if (z !== 0 && z !== 7.6 || Math.abs(x) < 3) NODES.push({ x, z }); // z 0 and 7.6: only on the creek road (the bridges)
}
const at = (x, z) => NODES.findIndex(n => Math.abs(n.x - x) < .01 && Math.abs(n.z - z) < .01);
function walkable(ax, az, bx, bz) { // a straight line a kid could walk
  const n = Math.max(2, Math.ceil(Math.hypot(bx - ax, bz - az) / .3));
  for (let i = 1; i < n; i++) { const t = i / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
    if (Math.abs(x) < 1.6 && !BRIDGES.some(b => z > b.z0 + .2 && z < b.z1 - .2)) return false;
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
function brain(k, dt) {
  const c = k.c, p = pos(k);
  if (k.state === 'out') return;
  if (k.state === 'flee') { walk(k, SIDE[k.team] * 17, p.z, true, dt); if (Math.abs(p.x - SIDE[k.team] * 17) < 1) sitOut(k, 'grit'); return; }
  if (k.state === 'wipe') { if ((k.wipeT -= dt) <= 0) { k.grit = Math.min(1, k.grit + .3); k.state = 'fight'; } return; }
  const foes = enemies(k); if (!foes.length) { if (c.anim.loop !== 'idle') c.anim.setLoop('idle'); return; }
  if ((k.think -= dt) <= 0) {
    k.think = .3 + rnd() * .2; k.target = nearest(k, foes)[0];
    const [, near] = nearest(k, foes);
    if (k.water < .8 && k.state !== 'refill') k.state = 'refill';
    if (k.state === 'fight' && k.grit < .3 && near > 4) { k.state = 'wipe'; k.wipeT = 1.2; c.anim.setLoop('idle'); c.anim.emote('drop'); return; }
  }
  if (k.state === 'refill') {
    let best = null, bd = 1e9; for (const r of REFILL) { const dd = Math.hypot(r.x - p.x, r.z - p.z) + (sideOf(r.x) !== sideOf(p.x) ? 6 : 0); if (dd < bd) { bd = dd; best = r; } }
    const at = canRefill(k);
    if (at) { if (c.anim.loop !== 'idle') c.anim.setLoop('idle'); k.water = Math.min(CAN, k.water + at.rate * dt); k.dryT = 0; if (k.water > CAN - .5) k.state = 'fight'; }
    else { walk(k, best.x + .9 * Math.sign(p.x - best.x || 1), best.z, true, dt); k.dryT += dt; if (k.water < .12 && k.dryT > 14) knockOut(k, 'water'); }
    if (k.water >= .4 && k.target && pos(k.target).distanceTo(p) < 3) shootAt(k, dt); // cornered at the tap: still shoot back
    return;
  }
  const t = k.target; if (!t) return;
  const tp = pos(t), d = tp.distanceTo(p);
  if ((k.sideT -= dt) < 0) { k.sideT = 1 + rnd() * 1.5; k.side = rnd() < .5 ? -1 : 1; }
  if (d > 5.6 || !clear(p, tp)) walk(k, tp.x, tp.z, d > 8, dt);
  else if (d < 2.8) walk(k, p.x - (tp.x - p.x), p.z - (tp.z - p.z), false, dt);
  else { const a = Math.atan2(tp.x - p.x, tp.z - p.z) + k.side * Math.PI / 2; walk(k, p.x + Math.sin(a) * 2, p.z + Math.cos(a) * 2, false, dt); }
  shootAt(k, dt);
}
function shootAt(k, dt) {
  if ((k.cool -= dt) > 0 || k.c.anim.one) return;
  const t = k.target; if (!t || t.out) return;
  const d = pos(t).distanceTo(pos(k)); if (d > 7 || !clear(pos(k), pos(t))) return;
  k.faceAim = rnd() < .45;
  if (fire(k, .35 + rnd() * .55, t)) k.cool = .9 + rnd() * .7;
}

// ---------- you ----------
let charge = 0, holding = false, sting = 0;
const ringEl = $('ring');
function aim() { // the nearest enemy in front of you, else straight ahead
  const p = pos(me), f = me.c.g.rotation.y; let best = null, bd = 9.5;
  for (const o of enemies(me)) { const tp = pos(o), d = tp.distanceTo(p); let a = Math.atan2(tp.x - p.x, tp.z - p.z) - f; a = Math.atan2(Math.sin(a), Math.cos(a)); if (Math.abs(a) < 1 && d < bd && clear(p, tp)) { bd = d; best = o; } }
  if (!best) for (const o of kids) if (o.out && o.team !== me.team) { const tp = pos(o), d = tp.distanceTo(p); let a = Math.atan2(tp.x - p.x, tp.z - p.z) - f; a = Math.atan2(Math.sin(a), Math.cos(a)); if (Math.abs(a) < .5 && d < 6) { best = o; break; } } // you can still choose to spray one sitting out…
  return best;
}
const press = on => {
  if (!playing || me.out || me.state === 'wipe') return;
  if (on) { holding = true; $('fire').classList.add('on'); }
  else if (holding) { holding = false; $('fire').classList.remove('on'); if (!fire(me, Math.max(.15, charge), aim())) say('ရေကုန်ပြီ — ပိုက်ခေါင်း/ရေစည်ဆီ သွားဖြည့်', 2); charge = 0; }
};
const wipe = () => { if (!playing || me.out || me.state === 'wipe') return; me.state = 'wipe'; me.wipeT = 1.2; holding = false; charge = 0; W.frozen = true; $('wipe').classList.add('on'); };
$('fire').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); press(true); });
$('fire').addEventListener('pointerup', e => { e.stopPropagation(); press(false); });
$('fire').addEventListener('pointercancel', () => press(false));
$('wipe').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); wipe(); });
addEventListener('keydown', e => { if (e.repeat) return; if (e.code === 'Space' || e.code === 'KeyJ') { press(true); e.preventDefault(); } if (e.code === 'KeyF') wipe(); }, true);
addEventListener('keyup', e => { if (e.code === 'Space' || e.code === 'KeyJ') press(false); });
W.renderer.domElement.addEventListener('mousedown', e => { if (e.button === 0) press(true); });
addEventListener('mouseup', e => { if (e.button === 0) press(false); });
W.onAction = () => true; // E doesn't splash a bucket here

function mine(dt) {
  if (me.out) return;
  if (me.state === 'wipe') { if ((me.wipeT -= dt) <= 0) { me.grit = Math.min(1, me.grit + .3); sting = Math.max(0, sting - .6); me.state = 'fight'; W.frozen = false; $('wipe').classList.remove('on'); } return; }
  if (holding) charge = Math.min(1, charge + dt / .7);
  const at = canRefill(me);
  if (at) { me.water = Math.min(CAN, me.water + at.rate * dt); me.dryT = 0; }
  else if (me.water < .2) { me.dryT += dt; if (me.dryT > 12) knockOut(me, 'water'); }
}

// ---------- the match ----------
let playing = false, ended = false, msgT = 0;
function say(t, s = 2) { $('msg').textContent = t; $('msg').classList.remove('off'); msgT = s; }
let scored = '';
function score() {
  const h = t => kids.filter(k => k.team === t).map(k => `<i class="${k.out || k.state === 'flee' ? '' : 'on'}"></i>`).join('');
  const a = h('A'), b = h('B'); if (a + b === scored) return; scored = a + b; $('sa').innerHTML = a; $('sb').innerHTML = b;
}
function checkEnd() {
  if (ended) return;
  const left = t => kids.filter(k => k.team === t && !k.out && k.state !== 'flee').length;
  if (left('A') && left('B')) return;
  ended = true; const won = left('A') > 0;
  setTimeout(() => {
    if (won) { $('big').textContent = 'ဟေး!'; $('big').hidden = false; for (const k of kids) if (k.team === 'A' && !k.out) { k.c.anim.play('jump'); k.c.anim.emote('heart'); } }
    setTimeout(() => { $('big').hidden = true; end(won ? 'နိုင်ပြီ' : 'ရှုံးပြီ', won ? '④ ဂိုဏ်းရဲ့ နောက်ဆုံးလူ ထွက်ပြေးသွားပြီ' : '① ဘက်မှာ ဘယ်သူမှ မကျန်တော့ဘူး'); }, won ? 1800 : 600);
  }, 700);
}
function foul(k) { // you sprayed a kid sitting out: the whistle, and the game's off
  if (ended) return; ended = true; playing = false; sound.fx('handbell', pos(k)); k.c.anim.emote('bang');
  end('ဝီ!! ပွဲပျက်', 'ထိုင်နေတဲ့သူကို မပက်ရဘူးလေ… ပြန်စရမယ်');
}
function end(title, text) { $('etitle').textContent = title; $('etext').textContent = text; $('end').hidden = false; playing = false; W.frozen = true; window.war.result = title; }
const go = mode => { location.search = '?mode=' + mode + (AUTO ? '&auto' : '') + (P.has('debug') ? '&debug' : '') + (P.get('dt') ? '&dt=' + P.get('dt') : '') + (P.get('q') ? '&q=' + P.get('q') : ''); };
$('home').onclick = () => go('home'); $('away').onclick = () => go('away');
$('again').onclick = () => go(MODE || 'home'); $('menu').onclick = () => { location.search = AUTO ? '?auto' : ''; };
function begin() {
  $('start').hidden = true; playing = true; W.frozen = false; score();
  say(HOME === 'A' ? '④ ဂိုဏ်း ဝင်လာပြီ — ကိုယ့်ရပ်ကွက်ကို ခံတိုက်' : 'တံတားဖြတ်ပြီး ④ ထဲ ဝင်တိုက် — ရေဖြည့်စရာ ရှာရမယ်', 3.5);
}
if (MODE) begin(); else { W.frozen = true; score(); }

W.tick(dt => {
  hitSnd -= dt;
  if (msgT > 0 && (msgT -= dt) <= 0) $('msg').classList.add('off');
  if (playing) {
    for (const k of kids) { k.hitT += dt; if (!k.out && k.state !== 'flee' && k.hitT > 2) k.grit = Math.min(1, k.grit + .035 * dt); }
    if (AUTO) brain(me, dt); else mine(dt);
    for (const k of kids) if (!k.me) brain(k, dt);
    score();
  }
  stepDrops(dt);
  sting = Math.max(0, sting - dt * .35); $('sting').style.opacity = sting.toFixed(2); W.renderer.domElement.style.filter = sting > .25 ? `blur(${(sting * 2.2).toFixed(1)}px)` : '';
  $('water').firstChild.style.width = (me.water / CAN * 100) + '%'; $('grit').firstChild.style.width = (me.grit * 100) + '%';
  $('note').textContent = me.out ? 'ထွက်ပြီ' : canRefill(me) ? 'ရေဖြည့်နေတယ်…' : me.water < .2 ? `ရေကုန်ပြီ (${Math.max(0, 12 - me.dryT).toFixed(0)})` : '';
  ringEl.setAttribute('stroke-dashoffset', (333 * (1 - charge)).toFixed(0));
  if (me.out) { let sx = 0, sz = 0, n = 0; for (const k of kids) if (!k.out && k.state !== 'flee') { sx += pos(k).x; sz += pos(k).z; n++; } W.camFocus = n ? new THREE.Vector3(sx / n, 0, sz / n) : null; }
});

W.start();
window.war = { kids, me, state: () => ({ playing, ended, A: kids.filter(k => k.team === 'A' && !k.out && k.state !== 'flee').length, B: kids.filter(k => k.team === 'B' && !k.out && k.state !== 'flee').length, water: me.water, grit: me.grit }), result: null, fire, W, STATS };
