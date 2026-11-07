// camera.js — Go-Go Town! ပုံစံ ကင်မရာ · ဒီဇိုင်း = docs/CAMERA.md (ကွဲလွဲရင် CAMERA.md ကို ယူ)
// follow (lag) + look-ahead · ၄၅° snap လှည့် (ကစားသူ) · zoom = အခြေအနေ (context) × ကစားသူ offset · ဇာတ်လမ်း scene API
// ရွေ့တာကို `forward()` / `right()` နဲ့ — snap tween အတွင်း *ပြနေတဲ့* az ကို သုံးလို့ လှည့်နေတုန်း ကစားသူ ဘေးမလွဲ
//
// API (CAMERA.md §၆):  update(dt, focus, motion?) · snap(focus?) · rotate(±1) · drag(px) / dragEnd() · zoom(k) (ကစားသူ offset)
//   context(name, on, data?)  run | ride | war | talk (data = NPC position) | room (data = { az }, cut)
//   focus(obj | Vector3, { dist, az, elev, t }) · lock(az) · shake(amp, sec) · release()   ← ဇာတ်လမ်း scene
//   forward() / right() · tune (lil-gui ?tune — CAMERA.md §၈)
//   talkShot(speaker, listener, kind, { group, room, side, face, t, dry }) · releaseTalk() ← T10 talk director (CAMERA.md §၆-ခ, yangon/talk.js)
import * as THREE from 'three';

const clamp = THREE.MathUtils.clamp;
export const STEP = Math.PI / 4;
// CAMERA.md §၈ — the numbers lil-gui (?tune) edits; copy the JSON back into the doc when they feel right
export const TUNE = { followK: 3.2, azK: 9, distOutK: 2, distInK: 4, base: 11, run: 3, ride: 5, war: 2, talk: -4, room: 6,
  lookWalk: 1.2, lookJog: 1.6, lookRun: 2, lookRide: 2.5, lookK: .5, elevMin: .22, elevMax: .85, fade: .25, autoRotate: false };
export const elevDefault = (d, t = TUNE) => t.elevMin + (t.elevMax - t.elevMin) * Math.pow(clamp((d - 5) / 19, 0, 1), .8); // close in = low and level (sky shows), far out = looking down
// T10 talk shots (CAMERA.md §၆-ခ) — ?tune 「စကားပြော」. ots: behind the listener's shoulder (back m behind them, the side offset solved
// per FOV so the speaker sits on the ⅓ line (third) and the listener's head towards the frame's edge (edge)); over otsMax m apart a
// close single instead, and a two when they stand too close for it (the listener would get under otsMin of the way out) · two: side-on
// to the pair (twoYaw towards the speaker's face) · close: the speaker's face · wide: the group, fitted + widePad m (wideYaw towards
// the speaker's face). pullMax: a camCollide pull-in past this share of the distance = "in a wall" → the other shoulder → two →
// wide → close; roomSpan: in a cut-away room the camera stays within ± this of the open side; boxLift: the faces raised by this
// share of the half-frame (the dialogue box covers the bottom); glide: seconds per cut; headDrop: the target under the head (m)
export const TALK = { glide: .35, back: 1.0, third: 1 / 3, edge: .7, otsElev: .26, otsMax: 4.5, otsMin: .7, headDrop: .08,
  twoMin: 3.2, twoK: 1.9, twoPad: 1.4, twoElev: .25, twoYaw: .35, closeDist: 2.0, closeElev: .08, closeYaw: .45, wideElev: .55, wideYaw: .8, widePad: 1, wideMin: 4.5,
  pullMax: .3, roomSpan: 60, boxLift: .22 };
const PRI = { run: 1, ride: 2, war: 3, talk: 4, room: 5 }; // scene (6) sits above them all (CAMERA.md §၂)
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

// opts: base (dist at rest) · min/max (dist) · userMin/userMax (the player's zoom offset) · storageKey (remember the offset)
//       collide(target, camPos) → distance at which the camera would be inside a wall, or null (CAMERA.md §၅)
export function createOrbit(cam, { base, min = 5, max = 24, az = 0, userMin = .6, userMax = 1.6, storageKey = null, collide = null, tune = {} } = {}) {
  const t = { ...TUNE, ...tune }; if (base !== undefined) t.base = base;
  let user = 1; try { if (storageKey) user = clamp(+localStorage.getItem(storageKey) || 1, userMin, userMax); } catch {}
  const ctx = new Set(), data = {}, look = new THREE.Vector3(), aim = new THREE.Vector3(), tmp = new THREE.Vector3(), shakeOff = new THREE.Vector3();
  let runT = 0, stillT = 0, scene = null, sh = { amp: 0, t: 0, d: 1 }, clock = 0, azTalk = 0, relT = 0, talkFrom = null;
  const s = { az, azGoal: az, drag: 0, dist: t.base, el: null, target: new THREE.Vector3(), locked: false, min, max, ctx, get user() { return user; } };
  const delta = () => { // the context zoom: the highest priority wins; run + war add up (the only pair that does)
    let top = null; for (const c of ctx) if (!top || PRI[c] > PRI[top]) top = c;
    if (!top) return 0; if (top === 'war' && ctx.has('run')) return t.war + t.run; return t[top];
  };
  const goal = () => {
    if (scene?.dist) return clamp(scene.dist, 2, max);
    if (ctx.has('room')) return t.room; // a designed view: the player's zoom doesn't apply
    return clamp((t.base + delta()) * user, min, max);
  };
  Object.defineProperty(s, 'distGoal', { get: goal, set(d) { user = clamp(d / Math.max(1, t.base + delta()), userMin, userMax); save(); }, enumerable: true }); // old callers (camlab) set a distance
  const save = () => { try { if (storageKey) localStorage.setItem(storageKey, user.toFixed(3)); } catch {} };
  const elev = () => {
    if (scene?.elev !== undefined) return scene.elev;
    if (ctx.has('room')) return .35;
    let e = elevDefault(s.dist, t); if (ctx.has('ride')) e += .1; if (ctx.has('talk')) e = Math.max(.3, e);
    return e;
  };
  const place = () => {
    const el = s.el ?? elev(); let d = s.dist;
    tmp.copy(s.target).add(shakeOff);
    const dir = new THREE.Vector3(Math.sin(s.az) * Math.cos(el), Math.sin(el), Math.cos(s.az) * Math.cos(el));
    if (collide) { const hit = collide(tmp, tmp.clone().addScaledVector(dir, d)); if (hit !== null && hit < d) d = Math.max(2.5, hit - .3); } // never inside a wall
    cam.position.copy(tmp).addScaledVector(dir, d); cam.lookAt(tmp);
  };
  const curEl = () => { const d = cam.position.distanceTo(s.target); return d > 1e-3 ? Math.asin(clamp((cam.position.y - s.target.y) / d, -1, 1)) : elev(); };
  // ---------- T10 talk shots ----------
  const halfTan = () => { const v = Math.tan(THREE.MathUtils.degToRad(cam.fov ?? 40) / 2); return { v, h: v * (cam.aspect || 1) }; };
  const flat = v => new THREE.Vector3(v.x, 0, v.z);
  const shotOf = (kind, S, L, n, group, face = null) => { // → { target, az, dist, elev } for one side n; face = the speaker's yaw (a wide / two swings towards it)
    const toward = (a, max) => face === null ? a : a + clamp(wrap(face - a), -max, max);
    const { h: th, v: tv } = halfTan(), u = flat(S).sub(flat(L)), SL = Math.max(.3, u.length()); u.divideScalar(SL);
    if (kind === 'ots' && SL > TALK.otsMax) kind = 'close'; // too far apart for one frame: a single on the speaker
    if (kind === 'ots') {
      const b = TALK.back, want = Math.atan(th * TALK.third) + Math.atan(th * TALK.edge), sep = x => Math.atan(x / b) - Math.atan(x / (b + SL));
      let hi = Math.sqrt(b * (b + SL)), lo = 0; if (sep(hi) > want) for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (sep(m) < want) lo = m; else hi = m; }
      if (sep(hi) < want * TALK.otsMin) return shotOf('two', S, L, n, group, face); // standing too close for one over the other's shoulder (the big heads would cover each other)
      const C = flat(L).addScaledVector(u, -b).addScaledVector(n, hi), dS = flat(S).sub(C), D = dS.length(); dS.divideScalar(D);
      const np = n.clone().addScaledVector(dS, -n.dot(dS)).normalize(), a = Math.atan(th * TALK.third);
      const axis = dS.clone().multiplyScalar(Math.cos(a)).addScaledVector(np, -Math.sin(a)); // the speaker on the ⅓ line, the listener's shoulder at the other edge
      const target = C.clone().addScaledVector(axis, D).setY(S.y - TALK.headDrop);
      return { kind, target, az: Math.atan2(-axis.x, -axis.z), dist: D / Math.cos(TALK.otsElev), elev: TALK.otsElev };
    }
    if (kind === 'close') {
      const f = u.clone().negate(), dir = f.multiplyScalar(Math.cos(TALK.closeYaw)).addScaledVector(n, Math.sin(TALK.closeYaw)).normalize();
      return { kind, target: S.clone().setY(S.y - TALK.headDrop * .5), az: Math.atan2(dir.x, dir.z), dist: TALK.closeDist, elev: TALK.closeElev };
    }
    if (kind === 'wide') {
      const all = [S, L, ...group], c = new THREE.Vector3(); let y = 0; for (const p of all) { c.add(flat(p)); y += p.y; } c.divideScalar(all.length); y /= all.length;
      let R = 0; for (const p of all) R = Math.max(R, flat(p).distanceTo(c)); R += TALK.widePad;
      const d = Math.max(TALK.wideMin, R / th, R * .8 / tv) * 1.05;
      return { kind, target: c.setY(y - .35), az: toward(Math.atan2(n.x, n.z), TALK.wideYaw), dist: d, elev: TALK.wideElev };
    }
    // two: side-on to the pair, both in frame
    const d = Math.max(TALK.twoMin, SL * TALK.twoK, (SL + TALK.twoPad) / (2 * th));
    return { kind: 'two', target: flat(S).add(flat(L)).multiplyScalar(.5).setY((S.y + L.y) / 2 - .3), az: toward(Math.atan2(n.x, n.z), TALK.twoYaw), dist: d, elev: TALK.twoElev };
  };
  const raise = sh => { // tilt down a little (the camera stays put): the faces sit above the dialogue box, which covers the bottom of the frame
    const { target: T, az: a, dist: d, elev: e } = sh, C = T.clone().add(new THREE.Vector3(Math.sin(a) * Math.cos(e) * d, Math.sin(e) * d, Math.cos(a) * Math.cos(e) * d));
    T.y -= d * halfTan().v * TALK.boxLift; sh.dist = C.distanceTo(T); sh.elev = Math.asin(clamp((C.y - T.y) / sh.dist, -1, 1)); return sh;
  };
  const pullOf = (sh, room) => { // the share of the distance a wall would take off (0 = clear, 1 = not allowed)
    const { target: T, az: a, dist: d, elev: e } = sh, dir = new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
    let p = 0;
    if (collide) { const hit = collide(T, T.clone().addScaledVector(dir, d)); if (hit !== null && hit < d) p = Math.max(p, 1 - Math.max(0, hit - .3) / d); }
    if (room) { // a cut-away room (rooms.js): walls at x0 and z0 only; the camera stays in front of them and on the open half
      if (Math.abs(wrap(a - room.open)) > THREE.MathUtils.degToRad(TALK.roomSpan) + 1e-6) return 1;
      for (const [k, w] of [['x', room.x0], ['z', room.z0]]) if (dir[k] < 0) { const reach = (T[k] - w - .25) / -dir[k]; if (reach < d) p = Math.max(p, 1 - Math.max(0, reach) / d); }
    }
    return p;
  };
  const fit = (sh, room) => { // a room: two / close / wide swing round into the open half (an ots has to be where it is: it falls back instead)
    if (room && sh.kind !== 'ots') { const off = wrap(sh.az - room.open), span = THREE.MathUtils.degToRad(TALK.roomSpan); if (Math.abs(off) > span) sh.az = room.open + Math.sign(off) * span; }
    return sh;
  };
  const sideOf = (S, L) => { const u = flat(S).sub(flat(L)).normalize(); return new THREE.Vector3(-u.z, 0, u.x); };
  function talkPlan(S, L, kind, group, room, side, face) {
    const n0 = sideOf(S, L); let n = n0;
    if (side) { if (n.dot(side) < 0) n = n0.clone().negate(); }
    else { // a new scene: the side that is clear (in a room: nearer the open side), else the one nearer where the camera is now
      const a = fit(shotOf(kind, S, L, n0, group, face), room), b = fit(shotOf(kind, S, L, n0.clone().negate(), group, face), room), pa = pullOf(a, room), pb = pullOf(b, room);
      const near = sh => Math.abs(wrap(sh.az - (room ? room.open : s.az)));
      n = pa < pb - .05 || (Math.abs(pa - pb) <= .05 && near(a) <= near(b)) ? n0 : n0.clone().negate();
    }
    const other = n.clone().negate(), tries = kind === 'wide' ? [['wide', n], ['wide', other], ['two', n], ['two', other], ['close', n]]
      : kind === 'two' ? [['two', n], ['two', other], ['wide', n], ['close', n], ['close', other]]
      : [[kind, n], [kind, other], ['two', n], ['two', other], ['wide', n], ['close', n], ['close', other]]; // the other shoulder, then side-on, then the group, last a single (short: rarely blocked)
    let best = null, pull0 = null;
    for (let i = 0; i < tries.length; i++) {
      const sh = shotOf(tries[i][0], S, L, tries[i][1], group, face);
      raise(fit(sh, room)); const p = pullOf(sh, room); if (pull0 === null) pull0 = p;
      if (!best || p < best.pull - 1e-3) best = { ...sh, pull: p, fallback: i, flip: tries[i][1] !== n };
      if (p <= TALK.pullMax) { best = { ...sh, pull: p, fallback: i, flip: tries[i][1] !== n }; break; }
    }
    return { ...best, side: n, pull0 };
  }
  const o = {
    state: s, tune: t,
    get az() { return s.az; },
    rotate(dir) { if (!s.locked) s.azGoal += dir * STEP; },
    drag(px) { if (!s.locked) s.drag = -px * .006; },                                // the view follows the finger …
    dragEnd() { s.azGoal = Math.round((s.azGoal + s.drag) / STEP) * STEP; s.drag = 0; }, // … and snaps to the nearest 45° on release
    zoom(k) { user = clamp(user * k, userMin, userMax); save(); },                    // the player's offset, kept through every context
    context(name, on, d) {
      const had = ctx.has(name);
      if (on) { ctx.add(name); if (d !== undefined) data[name] = d; } else { ctx.delete(name); delete data[name]; }
      if (name === 'room' && on !== had) { // in / out of a shop is a cut, not a glide
        if (on) { o.lock(d?.az ?? 0); s.dist = t.room; } else { s.locked = !!scene?.lock; s.dist = goal(); }
        place();
      }
    },
    lock(a = null) { s.locked = a !== null; if (s.locked) { s.az = s.azGoal = a; s.drag = 0; } },
    focus(obj, { dist, az: fa, elev: fe, t: ft = .6 } = {}) { scene = { obj, dist, elev: fe, k: 3 / Math.max(.05, ft), lock: fa !== undefined }; if (fa !== undefined) o.lock(fa); },
    shake(amp = .12, sec = .15) { sh = { amp, t: sec, d: sec }; },
    release() { const wasLocked = scene?.lock; scene = null; if (wasLocked && !ctx.has('room')) s.locked = false; }, // the player has it back; the previous context comes back by itself
    snap(focus) { if (focus) s.target.copy(focus); s.az = s.azGoal + s.drag; s.dist = goal(); s.el = null; place(); },
    // T10: a talk director's shot. speaker / listener = head positions (Vector3); group = more heads (wide); room = { open, x0, z0 }
    // (a cut-away room: walls only at x0 and z0, the camera stays on the open side); side = the scene's side of the line of action
    // (a ground Vector3, kept for the whole scene — the 180° rule), null = pick the clearer one. t = glide seconds (0 = a cut).
    // Returns { kind, side, pull0 (the first choice's pull-in), pull, fallback, az, dist, elev, target }; dry = only measure.
    talkShot(S, L, kind = 'ots', { group = [], room = null, side = null, face = null, t: gt = TALK.glide, dry = false } = {}) {
      const r = talkPlan(S, L, kind, group, room, side, face);
      if (dry) return r;
      if (!scene?.talk) talkFrom = s.azGoal; // where the follow camera was: back there after the scene
      const goalAz = s.az + wrap(r.az - s.az);
      scene = { obj: r.target, dist: r.dist, elev: r.elev, k: 3 / Math.max(.05, gt), lock: true, talk: true, glide: gt > 0 };
      s.locked = true; s.drag = 0; s.azGoal = goalAz;
      if (gt <= 0) { s.az = goalAz; s.dist = r.dist; s.el = null; s.target.copy(r.target); place(); } // a cut (zone.fast)
      else if (s.el === null) s.el = curEl();
      return r;
    },
    releaseTalk({ t: rt = .5 } = {}) { // the director is done: back to the follow camera (or the room's view) in ~rt s
      if (!scene?.talk) return;
      scene = null; relT = rt;
      if (ctx.has('room')) { const a = data.room?.az ?? 0; s.locked = true; s.azGoal = s.az + wrap(a - s.az); }
      else { s.locked = false; if (talkFrom !== null) s.azGoal = s.az + wrap(talkFrom - s.az); }
      talkFrom = null;
    },
    get talking() { return !!scene?.talk; },
    // motion: { dir (ground, normalised, or null), kind: 'walk' | 'jog' | 'run' | 'ride' }
    update(dt, focus, motion = null) {
      clock += dt;
      // run: on after .3 s of running, off after 1 s of not (CAMERA.md §၂)
      if (motion?.kind === 'run' && motion.dir) { runT += dt; stillT = 0; if (runT > .3) ctx.add('run'); }
      else { runT = 0; stillT += dt; if (stillT > 1) ctx.delete('run'); }
      // look-ahead: a little of the way you're heading, slowly (≈ 2 s)
      const L = !motion?.dir ? 0 : motion.kind === 'ride' ? t.lookRide : motion.kind === 'run' ? t.lookRun : motion.kind === 'jog' ? t.lookJog : t.lookWalk;
      aim.set(0, 0, 0); if (L) aim.copy(motion.dir).multiplyScalar(L);
      look.lerp(aim, 1 - Math.exp(-dt * t.lookK));
      // where to look: a scene's subject, the two of you in a talk, else you (+ look-ahead)
      const glide = scene?.glide || relT > 0, gk = scene?.glide ? scene.k : 6; if (relT > 0) relT -= dt; // T10: a talk cut glides target, angle, distance and height together
      if (scene) { const p = scene.obj.isObject3D ? scene.obj.getWorldPosition(tmp) : tmp.copy(scene.obj); s.target.lerp(p, 1 - Math.exp(-dt * scene.k)); }
      else {
        aim.copy(focus).add(look);
        if (ctx.has('talk') && data.talk) aim.copy(focus).add(data.talk).multiplyScalar(.5).setY(focus.y);
        s.target.lerp(aim, 1 - Math.exp(-dt * (glide ? Math.max(gk, t.followK) : t.followK)));
      }
      // talk: swing up to ±20° so the two faces are side by side (back to 0 after)
      let want = 0;
      if (ctx.has('talk') && data.talk && !s.locked) {
        const a = Math.atan2(data.talk.x - focus.x, data.talk.z - focus.z); // the line you → them
        const p1 = wrap(a + Math.PI / 2 - s.azGoal), p2 = wrap(a - Math.PI / 2 - s.azGoal);
        want = clamp(Math.abs(p1) < Math.abs(p2) ? p1 : p2, -.35, .35);
      }
      azTalk += (want - azTalk) * (1 - Math.exp(-dt * 3));
      s.az += (s.azGoal + s.drag + azTalk - s.az) * (1 - Math.exp(-dt * (glide ? Math.max(gk, t.azK) : t.azK)));
      const g = goal(); s.dist += (g - s.dist) * (1 - Math.exp(-dt * (glide ? gk : g > s.dist ? t.distOutK : t.distInK))); // out quick (see ahead when you run), in slow
      if (glide) { const e = elev(); s.el = (s.el ?? e) + (e - (s.el ?? e)) * (1 - Math.exp(-dt * gk)); } else s.el = null; // the height eases only in a talk glide (other scenes cut it, as before)
      if (sh.t > 0) { sh.t -= dt; const k = sh.amp * Math.max(0, sh.t / sh.d); shakeOff.set(Math.sin(clock * 47) * k, Math.sin(clock * 53) * k * .5, Math.cos(clock * 41) * k); } else shakeOff.set(0, 0, 0);
      place();
    },
    // ground-plane directions from the angle on screen right now (input y = away from the camera)
    forward(v = new THREE.Vector3()) { return v.set(-Math.sin(s.az), 0, -Math.cos(s.az)); },
    right(v = new THREE.Vector3()) { return v.set(Math.cos(s.az), 0, -Math.sin(s.az)); },
  };
  return o;
}
