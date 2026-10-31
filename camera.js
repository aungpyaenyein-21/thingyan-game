// camera.js — Go-Go Town! ပုံစံ ကင်မရာ · ဒီဇိုင်း = docs/CAMERA.md (ကွဲလွဲရင် CAMERA.md ကို ယူ)
// follow (lag) + look-ahead · ၄၅° snap လှည့် (ကစားသူ) · zoom = အခြေအနေ (context) × ကစားသူ offset · ဇာတ်လမ်း scene API
// ရွေ့တာကို `forward()` / `right()` နဲ့ — snap tween အတွင်း *ပြနေတဲ့* az ကို သုံးလို့ လှည့်နေတုန်း ကစားသူ ဘေးမလွဲ
//
// API (CAMERA.md §၆):  update(dt, focus, motion?) · snap(focus?) · rotate(±1) · drag(px) / dragEnd() · zoom(k) (ကစားသူ offset)
//   context(name, on, data?)  run | ride | war | talk (data = NPC position) | room (data = { az }, cut)
//   focus(obj | Vector3, { dist, az, elev, t }) · lock(az) · shake(amp, sec) · release()   ← ဇာတ်လမ်း scene
//   forward() / right() · tune (lil-gui ?tune — CAMERA.md §၈)
import * as THREE from 'three';

const clamp = THREE.MathUtils.clamp;
export const STEP = Math.PI / 4;
// CAMERA.md §၈ — the numbers lil-gui (?tune) edits; copy the JSON back into the doc when they feel right
export const TUNE = { followK: 3.2, azK: 9, distOutK: 2, distInK: 4, base: 11, run: 3, ride: 5, war: 2, talk: -4, room: 6,
  lookWalk: 1.2, lookRun: 2, lookRide: 2.5, lookK: .5, elevMin: .22, elevMax: .85, fade: .25, autoRotate: false };
export const elevDefault = (d, t = TUNE) => t.elevMin + (t.elevMax - t.elevMin) * Math.pow(clamp((d - 5) / 19, 0, 1), .8); // close in = low and level (sky shows), far out = looking down
const PRI = { run: 1, ride: 2, war: 3, talk: 4, room: 5 }; // scene (6) sits above them all (CAMERA.md §၂)
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

// opts: base (dist at rest) · min/max (dist) · userMin/userMax (the player's zoom offset) · storageKey (remember the offset)
//       collide(target, camPos) → distance at which the camera would be inside a wall, or null (CAMERA.md §၅)
export function createOrbit(cam, { base, min = 5, max = 24, az = 0, userMin = .6, userMax = 1.6, storageKey = null, collide = null, tune = {} } = {}) {
  const t = { ...TUNE, ...tune }; if (base !== undefined) t.base = base;
  let user = 1; try { if (storageKey) user = clamp(+localStorage.getItem(storageKey) || 1, userMin, userMax); } catch {}
  const ctx = new Set(), data = {}, look = new THREE.Vector3(), aim = new THREE.Vector3(), tmp = new THREE.Vector3(), shakeOff = new THREE.Vector3();
  let runT = 0, stillT = 0, scene = null, sh = { amp: 0, t: 0, d: 1 }, clock = 0, azTalk = 0;
  const s = { az, azGoal: az, drag: 0, dist: t.base, target: new THREE.Vector3(), locked: false, min, max, ctx, get user() { return user; } };
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
    const el = elev(); let d = s.dist;
    tmp.copy(s.target).add(shakeOff);
    const dir = new THREE.Vector3(Math.sin(s.az) * Math.cos(el), Math.sin(el), Math.cos(s.az) * Math.cos(el));
    if (collide) { const hit = collide(tmp, tmp.clone().addScaledVector(dir, d)); if (hit !== null && hit < d) d = Math.max(2.5, hit - .3); } // never inside a wall
    cam.position.copy(tmp).addScaledVector(dir, d); cam.lookAt(tmp);
  };
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
    snap(focus) { if (focus) s.target.copy(focus); s.az = s.azGoal + s.drag; s.dist = goal(); place(); },
    // motion: { dir (ground, normalised, or null), kind: 'walk' | 'run' | 'ride' }
    update(dt, focus, motion = null) {
      clock += dt;
      // run: on after .3 s of running, off after 1 s of not (CAMERA.md §၂)
      if (motion?.kind === 'run' && motion.dir) { runT += dt; stillT = 0; if (runT > .3) ctx.add('run'); }
      else { runT = 0; stillT += dt; if (stillT > 1) ctx.delete('run'); }
      // look-ahead: a little of the way you're heading, slowly (≈ 2 s)
      const L = !motion?.dir ? 0 : motion.kind === 'ride' ? t.lookRide : motion.kind === 'run' ? t.lookRun : t.lookWalk;
      aim.set(0, 0, 0); if (L) aim.copy(motion.dir).multiplyScalar(L);
      look.lerp(aim, 1 - Math.exp(-dt * t.lookK));
      // where to look: a scene's subject, the two of you in a talk, else you (+ look-ahead)
      if (scene) { const p = scene.obj.isObject3D ? scene.obj.getWorldPosition(tmp) : tmp.copy(scene.obj); s.target.lerp(p, 1 - Math.exp(-dt * scene.k)); }
      else {
        aim.copy(focus).add(look);
        if (ctx.has('talk') && data.talk) aim.copy(focus).add(data.talk).multiplyScalar(.5).setY(focus.y);
        s.target.lerp(aim, 1 - Math.exp(-dt * t.followK));
      }
      // talk: swing up to ±20° so the two faces are side by side (back to 0 after)
      let want = 0;
      if (ctx.has('talk') && data.talk && !s.locked) {
        const a = Math.atan2(data.talk.x - focus.x, data.talk.z - focus.z); // the line you → them
        const p1 = wrap(a + Math.PI / 2 - s.azGoal), p2 = wrap(a - Math.PI / 2 - s.azGoal);
        want = clamp(Math.abs(p1) < Math.abs(p2) ? p1 : p2, -.35, .35);
      }
      azTalk += (want - azTalk) * (1 - Math.exp(-dt * 3));
      s.az += (s.azGoal + s.drag + azTalk - s.az) * (1 - Math.exp(-dt * t.azK));
      const g = goal(); s.dist += (g - s.dist) * (1 - Math.exp(-dt * (g > s.dist ? t.distOutK : t.distInK))); // out quick (see ahead when you run), in slow
      if (sh.t > 0) { sh.t -= dt; const k = sh.amp * Math.max(0, sh.t / sh.d); shakeOff.set(Math.sin(clock * 47) * k, Math.sin(clock * 53) * k * .5, Math.cos(clock * 41) * k); } else shakeOff.set(0, 0, 0);
      place();
    },
    // ground-plane directions from the angle on screen right now (input y = away from the camera)
    forward(v = new THREE.Vector3()) { return v.set(-Math.sin(s.az), 0, -Math.cos(s.az)); },
    right(v = new THREE.Vector3()) { return v.set(Math.cos(s.az), 0, -Math.sin(s.az)); },
  };
  return o;
}
