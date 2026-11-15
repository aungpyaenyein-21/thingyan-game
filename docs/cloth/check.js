// T18 geometry checks (no rendering): cloth vs legs when seated, top vs bottom in every pose. Driven by check.cjs.
import * as THREE from 'three';
import * as M from '../../chibi.js?v=36';
import { CAST, ticsReady } from '../../cast.js?v=18';
const { makeChibi, ChibiAnimator, LOOPS, ONESHOT, BUILDS, SKINS, HAIRS } = M;
await ticsReady;

const COL = { longyi: ['#3f7a5a', '#72b08b'], htamein: ['#a8434a', '#e08a8f'], pants: ['#3f5a8a', '#3f5a8a'], shorts: ['#5b7fa8', '#f6ead2'], skirt: ['#e9a0b4', '#e9a0b4'], overalls: ['#4a6a9a', '#4a6a9a'] };
const MARGIN = { leg: .012, top: .005, tuck: .01 };               // hips-local units (a unit is ~ .75 m): ~1 cm / ~4 mm / ~8 mm
const rc = new THREE.Raycaster(), V = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], mat = new THREE.Matrix4();
const q = new THREE.Quaternion(), e = new THREE.Euler();

function outfits() {
  const list = [];
  for (const bottom of Object.keys(COL)) for (const build of ['round', 'slim', 'broad']) for (const age of ['adult', 'kid']) for (const topStyle of ['tee', 'yinphone'])
    list.push({ name: `${bottom}/${build}/${age}/${topStyle}`, o: { skin: SKINS[0], hair: 'short', hairColor: HAIRS[0], top: '#4fb3d9', topStyle, print: topStyle === 'tee' ? 'သင်္ကြန်' : '', bottom, bottomColor: COL[bottom], build, age, size: age === 'kid' ? .72 : 1, thanaka: 'round', shoes: 'slipper', shoeColor: '#5a3a2a', accent: '#e0574f' } });
  for (const c of CAST) list.push({ name: 'cast/' + c.id, o: c.opts }); // every real character (elders with a hunch, kids, ...)
  return list;
}
function poses() { // [label, setup(anim), settle seconds]
  const P = [], skip = new Set(['sitdown', 'standup']);
  for (const l of Object.keys(LOOPS)) for (const ph of [0, .31, .77]) P.push({ id: `loop:${l}@${ph}`, loop: l, wait: 1.2 + ph });
  for (const c of ['speak', 'listen']) for (const l of ['idle', 'sit']) P.push({ id: `chat:${c}/${l}`, loop: l, chat: c, wait: 1.5 });
  for (const [one, d] of Object.entries(ONESHOT)) {
    const dur = typeof d === 'number' ? d : 1;
    const from = ['sit', 'eat', 'squat'].includes(one) ? 'sit' : one === 'standup' ? 'sit' : 'idle';
    for (const k of [.1, .25, .4, .55, .7, .9]) P.push({ id: `one:${one}@${k}`, loop: from, one, at: dur * k, wait: 1.2 });
  }
  return P;
}
const seatedness = ch => { const [a, b] = ch.legs; return Math.min(-a.hip.rotation.x, -b.hip.rotation.x); };

// inside: cast a ray from `axis` (a point inside) through `p`; the first hit on `mesh` must be beyond p by margin (world distance, margin given in hips-local units)
function beyond(mesh, axis, p, margin, scale) {
  const d = V[3].copy(p).sub(axis); d.x += 2e-4; const len = d.length(); if (len < 1e-5) return { ok: true, slack: 9 };
  d.divideScalar(len); rc.set(axis, d); rc.near = 0; rc.far = 2;
  const h = rc.intersectObject(mesh, false)[0];
  if (!h) return { ok: false, slack: -9, miss: true };
  const slack = (h.distance - len) / scale; return { ok: slack >= margin, slack };
}
const _d = new THREE.Vector3(), _e = new THREE.Vector3();
function segDist(p, a, b) { _d.copy(b).sub(a); const t = Math.max(0, Math.min(1, _e.copy(p).sub(a).dot(_d) / _d.lengthSq())); return _e.copy(a).addScaledVector(_d, t).distanceTo(p); }
function check(ch, rec) {
  ch.root.updateMatrixWorld(true);
  const sc = ch.scale, o = ch.opts, skirtMesh = ch.skirtMesh, torso = ch.torso, hips = ch.hips, spine = ch.spine;
  torso.material.side = THREE.DoubleSide;
  if (skirtMesh) skirtMesh.geometry.computeBoundingSphere();
  torso.geometry.computeBoundingSphere();
  const w2 = new THREE.Vector3(), hl = new THREE.Vector3(), A = new THREE.Vector3();
  const inHips = p => hips.worldToLocal(hl.copy(p));
  const sat = seatedness(ch);
  // ---- A: cloth vs legs (seated: the thigh pitch is past the drape's full-blend point) ----
  if (skirtMesh && sat >= 1.1) {
    const pos = skirtMesh.geometry.attributes.position, sk = ch.skirtSeat; let hem = 0, nh = 0; for (let i = 0; i < pos.count; i++) if (sk.u[i] > .999) { hem += pos.getY(i); nh++; } hem /= nh; /* the hem ring's own height */
    for (const lg of ch.legs) {
      const hp = lg.hip.getWorldPosition(new THREE.Vector3()), kp = lg.knee.getWorldPosition(new THREE.Vector3()), fp = lg.foot.getWorldPosition(new THREE.Vector3());
      for (const [a, b, r] of [[hp, kp, .066], [kp, fp, .058]]) {
        const ax = V[0].copy(b).sub(a).normalize(), u = V[1].set(1, 0, 0).addScaledVector(ax, -ax.x).normalize(), w = V[2].crossVectors(ax, u);
        if (!ch.longSkirt && r < .06) continue; /* a knee-length skirt shows the shins */
      for (let s = r > .06 ? 3 : 0; s <= (ch.longSkirt ? 8 : 6); s++) for (let k = 0; k < 12; k++) { /* the thigh root is under the shirt: its upward rays leave through the open waist */
          A.copy(a).lerp(b, s / 8); const ang = k / 12 * 6.2832;
          const dir = new THREE.Vector3().copy(u).multiplyScalar(Math.cos(ang)).addScaledVector(w, Math.sin(ang));
          const ay = inHips(A).y; if (ay < hem + .07) continue; // below the hem the leg is meant to show
          const P = A.clone().addScaledVector(dir, r * sc);
          const o2 = r > .06 ? [kp, fp, .058] : [hp, kp, .066]; if (segDist(P, o2[0], o2[1]) < o2[2] * sc + .002) continue; /* inside the other bone: the joint, not the surface */
          const res = beyond(skirtMesh, A, P, MARGIN.leg, sc);
          if (res.miss) { /* a ray that leaves through the open waist (under the shirt) is fine */
            const a = hips.worldToLocal(A.clone()), d = hips.worldToLocal(P.clone()).sub(a), top = ch.skirtSeat.top;
            if (d.y < -1e-4) continue; /* a ray that leaves down the open hem: the leg comes out of the cloth there, as it should */
            if (d.y > 1e-4) { const t = (top - a.y) / d.y, x = a.x + d.x * t, z = a.z + d.z * t; if (Math.hypot(x, z) < ch.skirtSeat.r0 + .005) continue; }
            
          }
          rec('leg', res.slack, `${r > .06 ? 'thigh' : 'shin'}@s${s} k${k} ay${ay.toFixed(3)}` + (res.miss ? ' MISS a=' + hips.worldToLocal(A.clone()).toArray().map(v => v.toFixed(3)) + ' d=' + hips.worldToLocal(P.clone()).sub(hips.worldToLocal(A.clone())).normalize().toArray().map(v => v.toFixed(2)) : ''));
        }
      }
    }
  }
  // ---- B: top vs bottom ----
  const base = ch.torsoBase; let hemY = 9, topY = -9; for (let i = 0; i < base.length; i += 3) hemY = Math.min(hemY, base[i + 1]);
  const spineLocal = p => spine.worldToLocal(hl.copy(p));
  const samples = []; // world points of the hip-level parts
  const addMesh = (m, filter) => { const g = m.geometry.attributes.position; m.updateWorldMatrix(true, false); for (let i = 0; i < g.count; i += (g.count > 300 ? 3 : 1)) { const v = new THREE.Vector3().fromBufferAttribute(g, i).applyMatrix4(m.matrixWorld); if (filter(inHips(v))) samples.push(v); } };
  const hipBall = hips.children.find(m => m.isMesh && m.geometry.type === 'SphereGeometry'); if (hipBall) addMesh(hipBall, () => true);
  if (!ch.tuck) {
    if (skirtMesh) { const g = skirtMesh.geometry.attributes.position, sk = ch.skirtSeat; skirtMesh.updateWorldMatrix(true, false); /* the waist ring (the lap is meant to leave the shirt's front) */
      for (let i = 0; i < g.count; i++) if (sk.u[i] < .13) samples.push(new THREE.Vector3().fromBufferAttribute(g, i).applyMatrix4(skirtMesh.matrixWorld)); }
    for (const lg of ch.legs) for (const m of lg.hip.children) if (m.isMesh && m !== undefined && (m.geometry.type === 'CapsuleGeometry' || m.geometry.type === 'CylinderGeometry')) addMesh(m, l => l.y > -.04);
    for (const p of samples) { const h = inHips(p).clone(); if (h.y < hemY + .066 || h.y > .14) continue; /* the shirt's lower rows ride the hips, so the axis is the hips' */
      A.copy(hips.localToWorld(new THREE.Vector3(0, h.y, 0))); const r = beyond(torso, A, p, MARGIN.top, sc);
      rec('top', r.slack, 'untucked@' + h.toArray().map(v => v.toFixed(3)) + (r.miss ? ' MISS' : '')); }
  } else { // tucked: the shirt's lower rows inside the band
    const tp = torso.geometry.attributes.position;
    for (let i = 0; i < tp.count; i++) { if (base[i * 3 + 1] > .075 || base[i * 3 + 1] < hemY - 1e-4 && false) continue;
      const v = new THREE.Vector3().fromBufferAttribute(tp, i).applyMatrix4(torso.matrixWorld), h = inHips(v); if (Math.hypot(h.x, h.z) < .01) continue;
      A.copy(hips.localToWorld(new THREE.Vector3(0, h.y, 0))); const r = beyond(skirtMesh, A, v, MARGIN.tuck, sc); rec('tuck', r.slack, 'shirt in band@' + h.toArray().map(x => x.toFixed(3)) + ' by' + base[i * 3 + 1].toFixed(2) + (r.miss ? ' MISS' : '')); }
    for (const p of samples) { const h = inHips(p); A.copy(hips.localToWorld(new THREE.Vector3(0, h.y, 0))); { const r = beyond(skirtMesh, A, p, .005, sc); rec('tuck', r.slack, 'ball in band@' + h.toArray().map(x => x.toFixed(3)) + (r.miss ? ' MISS' : '')); } }
  }
}

function runAll(filter = null, fast = false) {
  const res = { worst: {}, byPose: {}, nFail: 0, fails: [], n: 0, maxSpine: { x: 0, y: 0, z: 0 } }, DT = .05;
  const OF = outfits().filter(f => !filter || f.name.includes(filter)), PO = poses().filter((p, i) => !fast || i % 5 === 0);
  for (const f of OF) {
    const ch = makeChibi(f.o), an = new ChibiAnimator(ch, () => {}); ch.root.rotation.y = 0;
    for (const po of PO) {
      an.chat = po.chat ?? null; an.setLoop(po.loop); an.one = null;
      for (let t = 0; t < po.wait; t += DT) an.update(DT);
      if (po.one) { an.play(po.one); for (let t = 0; t < po.at; t += DT) an.update(DT); an.update(1e-3); }
      for (const k of ['x', 'y', 'z']) res.maxSpine[k] = Math.max(res.maxSpine[k], Math.abs(ch.spine.rotation[k]));
      check(ch, (kind, slack, tag) => {
        res.n++; const key = kind + '|' + tag.split(' MISS')[0].split('@')[0] + '|' + (f.name.split('/')[0]); const w = res.worst[key] ??= { slack: 9, at: '' };
        const lim = MARGIN[kind] ?? .005; if (slack < w.slack) { w.slack = slack; w.at = f.name + ' ' + po.id; }
        if (slack < lim - 1e-9) { const k2 = kind + '|' + f.name.split('/')[0] + '|' + po.id.replace(/@.*/, ''); const w2 = res.byPose[k2] ??= { n: 0, worst: 9, at: '' }; w2.n++; if (slack < w2.worst) { w2.worst = slack; w2.at = f.name + ' ' + tag; } res.nFail++; if (res.fails.length < 400) res.fails.push([kind, tag, +slack.toFixed(4), f.name, po.id]); }
      });
    }
  }
  res.outfits = OF.length; res.poses = PO.length; return res;
}
// CPU cost of the animator for a town's worth of people (no rendering)
function timing(N = 40, frames = 400) {
  const people = [];
  const loops = ['sit', 'idle', 'walk', 'sit', 'eat', 'idle', 'vend', 'walk'], bots = ['longyi', 'htamein', 'pants', 'shorts', 'skirt', 'longyi'];
  for (let i = 0; i < N; i++) { const b = bots[i % bots.length]; const ch = makeChibi({ skin: SKINS[0], hair: 'short', hairColor: HAIRS[0], top: '#4fb3d9', topStyle: i % 2 ? 'tee' : 'yinphone', print: '', bottom: b, bottomColor: COL[b], build: ['round', 'slim', 'broad'][i % 3], age: 'adult' });
    const an = new ChibiAnimator(ch, () => {}); an.setLoop(loops[i % loops.length]); an.seed = i; people.push(an); }
  for (let f = 0; f < 60; f++) for (const an of people) an.update(1 / 60); // settle
  const out = {}; for (const [name, sel] of [['all', () => true], ['seated', an => ['sit', 'eat', 'vend'].includes(an.loop)], ['walking', an => an.loop === 'walk']]) {
    const sub = people.filter(sel), t0 = performance.now(); for (let f = 0; f < frames; f++) for (const an of sub) an.update(1 / 60);
    out[name] = { n: sub.length, msPerPersonFrame: +((performance.now() - t0) / (frames * sub.length)).toFixed(4) }; }
  return out;
}
window.runAll = runAll; window.timing = timing; window.ready = true;
