// carry.js — ကောက်-သယ်-ချ system (T4 · docs/plans/T4.md)
// ပစ္စည်း = data (ITEMS) · လူ = makeCast() ရဲ့ { ch, anim } · chibi.js ရဲ့ socket (handR / chest / head) + anim.load (pose layer) + anim.reach (လက် IK)
// API: const cw = createCarry(scene, { onThrow, onMessage }) · cw.item(kind, x, z) · cw.carrier(person) · cw.target(socket, name) · cw.update(dt)
//      carrier.actions() → ['pick' | 'drop' | 'place' | 'give' | 'throw'] · pick() drop() place() give() throw() hit()
import * as THREE from 'three';

// size: hand (လက်ထဲ) · front (လက် ၂ ဖက် ရင်ဘတ်ရှေ့) · head (ခေါင်းရွက်) — bike rack ကို target အဖြစ် တင်
// weight 0..1 → ခြေလှမ်း ×(1 − .4·weight)၊ weight > .5 ခုန် မရ · melt: စက္ကန့် · wet: ရေထိရင် စို (ရင့်)
export const ITEMS = {
  purse: { name: 'ပိုက်ဆံအိတ်', size: 'hand', weight: .1 },
  bowl: { name: 'ငွေဖလား', size: 'front', weight: .3 },
  basket: { name: 'အဝတ်ခြင်း', size: 'front', weight: .5 },
  bucket: { name: 'ရေပုံး', size: 'head', weight: .6, wet: true },
  ice: { name: 'ရေခဲတုံး', size: 'head', weight: .8, melt: 90, wet: true },
  balloon: { name: 'ပူဖောင်း', size: 'hand', weight: .05, burst: true },
};
const FALL = { head: 3, front: 5, hand: Infinity, rack: 3 };   // ရေပက်ခံရ အချက် → ကျ
const PAL = { water: '#3fd3e0', splash: '#cff6fa', padauk: '#ffc83d', brick: '#c8553d', cream: '#f4e6c8', ink: '#5a3550' }; // docs/PALETTE.md
const PICK_T = .55, DROP_T = .5, GIVE_T = .6, THROW_REL = .44, THROW_T = .75; // match chibi.js ONESHOT pick / bigthrow

// ---------------------------------------------------------------- item meshes (procedural; origin = bottom centre, world size in metres)
const mats = {};
const lam = (c, o = {}) => mats[c + JSON.stringify(o)] ??= new THREE.MeshLambertMaterial({ color: c, ...o });
function part(geo, color, parent, x = 0, y = 0, z = 0, o) { const m = new THREE.Mesh(geo, o?.own ? new THREE.MeshLambertMaterial({ color, ...o.mat }) : lam(color, o?.mat)); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; }
// the silver bowl: camlab.js's lathe profile (rim up), scaled from metres
const BOWL = [[0, -.045], [.1, -.045], [.135, -.02], [.15, .04], [.155, .045], [.14, .045], [.125, -.005], [0, -.02]];
function build(kind, body) {
  let w = .2, h = .2; // grip half-width (x) and height, for the hands
  if (kind === 'purse') {
    part(new THREE.BoxGeometry(.13, .1, .05), '#b0563a', body, 0, .05).scale.set(1, 1, 1);
    part(new THREE.TorusGeometry(.04, .008, 4, 12, Math.PI), PAL.padauk, body, 0, .1);
    w = .07; h = .12;
  } else if (kind === 'bowl') {
    const m = new THREE.Mesh(new THREE.LatheGeometry(BOWL.map(([x, y]) => new THREE.Vector2(x * 1.15, (y + .045) * 1.15)), 24), new THREE.MeshPhongMaterial({ color: '#dfe5ea', specular: '#ffffff', shininess: 110, side: THREE.DoubleSide }));
    m.castShadow = true; body.add(m); w = .18; h = .1;
  } else if (kind === 'basket') { // a woven basket heaped with washing
    part(new THREE.CylinderGeometry(.22, .17, .2, 14, 1, true), '#c99a5b', body, 0, .1).material.side = THREE.DoubleSide;
    part(new THREE.CircleGeometry(.17, 14), '#a87a45', body, 0, .005).rotation.x = -Math.PI / 2;
    for (const [x, z, c] of [[-.07, .03, '#f06292'], [.06, -.04, PAL.water], [.0, .07, PAL.padauk], [.08, .06, '#fff6ea']]) part(new THREE.SphereGeometry(.09, 10, 8), c, body, x, .2, z).scale.set(1.2, .55, 1);
    w = .23; h = .26;
  } else if (kind === 'bucket') { // a water bucket, full, carried on the head
    part(new THREE.CylinderGeometry(.16, .12, .24, 16), PAL.brick, body, 0, .12);
    part(new THREE.CircleGeometry(.15, 16), PAL.water, body, 0, .225).rotation.x = -Math.PI / 2;
    part(new THREE.TorusGeometry(.155, .012, 4, 16, Math.PI), '#5a4a52', body, 0, .24);
    w = .17; h = .24;
  } else if (kind === 'ice') { // a block of ice on a sack, pale and see-through
    part(new THREE.BoxGeometry(.3, .02, .24), '#c9a57e', body, 0, .01);
    part(new THREE.BoxGeometry(.26, .2, .2), PAL.splash, body, 0, .12, 0, { mat: { transparent: true, opacity: .85 } });
    w = .15; h = .22;
  } else if (kind === 'balloon') {
    part(new THREE.SphereGeometry(.07, 12, 10), PAL.water, body, 0, .08).scale.set(1, 1.15, 1);
    part(new THREE.SphereGeometry(.015, 6, 4), PAL.water, body, 0, .005);
    w = .07; h = .16;
  }
  return { w, h };
}

const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Quaternion();
const ease = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
const clamp01 = t => Math.min(1, Math.max(0, t));

export function createCarry(scene, { onThrow = null, onMessage = () => {}, onBurst = () => {} } = {}) {
  const items = [], carriers = [], targets = [], drops = [];
  const dripGeo = new THREE.SphereGeometry(.018, 6, 4), dripMat = new THREE.MeshBasicMaterial({ color: PAL.splash });

  // ---------------------------------------------------------------- items
  function item(kind, x = 0, z = 0) {
    const def = ITEMS[kind], g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const { w, h } = build(kind, body);
    const grips = { L: new THREE.Object3D(), R: new THREE.Object3D() }; // where the hands go: left side (+x) and right side (−x) of the item
    grips.L.position.set(w, h * .45, 0); grips.R.position.set(-w, h * .45, 0); body.add(grips.L, grips.R);
    const it = { kind, def, g, body, grips, h, state: 'ground', by: null, at: null, hits: 0, wob: 0, life: def.melt ?? null, wetK: 0, vel: new THREE.Vector3(), t: 0 };
    if (def.melt) it.drips = Array.from({ length: 3 }, () => { const m = new THREE.Mesh(dripGeo, dripMat); m.visible = false; scene.add(m); return { m, v: 0, on: false }; });
    g.position.set(x, 0, z); scene.add(g); items.push(it);
    g.traverse(m => { if (m.isMesh) { m.userData.item = it; if (def.wet) { m.material = m.material.clone(); m.userData.base = m.material.color.clone(); } } });
    return it;
  }
  // parent an item to a socket so it keeps its size in the world (sockets ride scaled chibis); mode: where the socket is on the item
  function seat(it, socket, mode) {
    socket.add(it.g); const s = socket.getWorldScale(_v).x || 1; it.g.scale.setScalar(1 / s); it.g.quaternion.identity();
    const h = it.h / s;
    it.g.position.set(0, mode === 'hang' ? -h * .75 : mode === 'center' ? -h * .45 : 0, mode === 'hang' ? .03 / s : 0);
    it.body.rotation.set(0, 0, 0);
  }
  function toWorld(it) { scene.attach(it.g); it.g.scale.setScalar(1); it.g.rotation.set(0, it.g.rotation.y, 0); }
  function remove(it) {
    if (it.by) it.by.release(false);
    if (it.at) it.at.item = null;
    it.g.removeFromParent(); for (const d of it.drips ?? []) d.m.removeFromParent();
    it.state = 'gone'; items.splice(items.indexOf(it), 1);
  }
  function fall(it, from, push) { // knocked off a head / out of the arms / off the rack: tumbles to the ground, has to be picked up again
    const p = it.g.getWorldPosition(_v).clone(); toWorld(it); it.g.position.copy(p);
    it.state = 'flying'; it.at = null; it.hits = 0; it.wob = 0;
    it.vel.set((Math.random() - .5) * 1.4 + (push?.x ?? 0), 1.8, (Math.random() - .5) * 1.4 + (push?.z ?? 0)); it.spin = (Math.random() - .5) * 8;
    onMessage(`${it.def.name} ကျသွားပြီ — ပြန်ကောက်`);
  }

  // ---------------------------------------------------------------- targets (a mandapa shelf slot, a bike rack): somewhere to 「တင်」
  function target(socket, name, { accepts = () => true } = {}) { const t = { socket, name, item: null, rider: null, accepts }; targets.push(t); return t; }

  // ---------------------------------------------------------------- carriers
  function carrier(person, { npc = false } = {}) {
    const ch = person.ch, anim = person.anim, baseGait = ch.gait;
    const c = {
      person, npc, item: null, busy: null,
      get pos() { return ch.root.getWorldPosition(new THREE.Vector3()); },
      get canJump() { return !this.item || this.item.def.weight <= .5; },
      near(maxD) { // the closest loose item in reach, in front first
        let best = null, bd = maxD; const p = this.pos;
        for (const it of items) if (it.state === 'ground') { const d = it.g.position.distanceTo(_w.set(p.x, 0, p.z)); if (d < bd) { bd = d; best = it; } }
        return best;
      },
      freeTarget(maxD) { const p = this.pos; let best = null, bd = maxD; for (const t of targets) if (!t.item && !t.rider && t.accepts(this.item)) { const d = t.socket.getWorldPosition(_w).setY(0).distanceTo(_v.set(p.x, 0, p.z)); if (d < bd) { bd = d; best = t; } } return best; },
      mate(maxD) { const p = this.pos; let best = null, bd = maxD; for (const o of carriers) if (o !== this && !o.item && !o.busy && !o.riding) { const d = o.pos.distanceTo(p); if (d < bd) { bd = d; best = o; } } return best; },
      actions() {
        if (this.busy || this.riding) return [];
        if (!this.item) return this.near(1) ? ['pick'] : [];
        const a = ['drop']; if (this.freeTarget(1.2)) a.push('place'); if (this.mate(1.1)) a.push('give'); if (this.item.def.size !== 'head') a.push('throw');
        return a;
      },
      // ---- pick up: bend, hands to the item, it comes up to the socket
      pick(it = this.near(1)) {
        if (!it || this.item || this.busy) return false;
        if (it.at) { it.at.item = null; it.at = null; }
        it.state = 'lift'; it.by = this; this.item = it; anim.play('pick'); faceTo(ch.root, it.g.position);
        const from = it.g.getWorldPosition(new THREE.Vector3()), fromQ = it.g.getWorldQuaternion(new THREE.Quaternion());
        this.busy = { kind: 'pick', t: 0, it, from, fromQ };
        anim.reach.R = { target: it.def.size === 'hand' ? it.g : it.grips.R, w: 0 };
        if (it.def.size !== 'hand') anim.reach.L = { target: it.grips.L, w: 0 };
        return true;
      },
      // ---- put down in front, or 「တင်」 on a target, or 「ပေး」 to a friend, or throw
      drop() { return this._putDown(null); },
      place(t = this.freeTarget(1.2)) { return t ? this._putDown(t) : false; },
      _putDown(t) {
        const it = this.item; if (!it || this.busy) return false;
        const r = ch.root, f = _v.set(Math.sin(r.rotation.y), 0, Math.cos(r.rotation.y));
        const to = t ? t.socket.getWorldPosition(new THREE.Vector3()) : r.position.clone().addScaledVector(f, .55).setY(0);
        if (t) { faceTo(r, to); t.item = it; it.at = t; }
        const from = it.g.getWorldPosition(new THREE.Vector3()); toWorld(it); it.g.position.copy(from);
        it.state = 'lift'; anim.play('pick'); this.busy = { kind: 'put', t: 0, it, from, to, target: t };
        anim.reach.R = { target: it.def.size === 'hand' ? it.g : it.grips.R, w: 1 }; if (it.def.size !== 'hand') anim.reach.L = { target: it.grips.L, w: 1 };
        this._unload(); return true;
      },
      give(o = this.mate(1.1)) {
        const it = this.item; if (!it || !o || this.busy) return false;
        faceTo(ch.root, o.pos); faceTo(o.person.ch.root, this.pos);
        const mid = this.pos.add(o.pos).multiplyScalar(.5).setY(.62 * ch.scale + .1);
        this.busy = { kind: 'give', t: 0, it, o, mid }; o.busy = { kind: 'take', t: 0 };
        anim.reach.R = { target: mid, w: 0 }; o.person.anim.reach.R = { target: mid, w: 0 }; return true;
      },
      throw() {
        const it = this.item; if (!it || this.busy || it.def.size === 'head') return false;
        anim.play('bigthrow'); this.busy = { kind: 'throw', t: 0, it }; anim.reach.L = anim.reach.R = null; return true;
      },
      // ---- hit by water: head things wobble and go after 3, armfuls after 5, a hand never lets go
      hit(push) {
        anim.soak(.35);
        const it = this.item; if (!it || this.busy?.kind === 'pick') return;
        wetten(it);
        if (it.def.size === 'hand') return;
        it.hits++; it.wob = 1;
        if (it.hits >= FALL[it.def.size]) { this.release(true); fall(it, this, push); }
      },
      release(clearItem = true) { if (clearItem) { this.item = null; } this._unload(); anim.reach.L = anim.reach.R = null; if (ch.pump) ch.pump.visible = true; },
      _load(it) {
        const size = it.def.size; this.item = it; it.by = this; it.state = 'held'; it.hits = 0;
        seat(it, size === 'hand' ? ch.sockets.handR : size === 'front' ? ch.sockets.chest : ch.sockets.head, size === 'hand' ? 'hang' : size === 'front' ? 'center' : 'base');
        anim.load = size; ch.gait = baseGait * (1 - .4 * it.def.weight);
        anim.reach.L = size === 'front' ? { target: it.grips.L, w: 1 } : null;
        anim.reach.R = size === 'front' ? { target: it.grips.R, w: 1 } : size === 'head' ? { target: headSide(ch), w: 1 } : null;
        if (ch.pump) ch.pump.visible = false; // the hero's squirter goes away while the hands are full
      },
      _unload() { anim.load = null; ch.gait = baseGait; this.item = null; },
      update(dt) {
        const b = this.busy; if (!b) return;
        b.t += dt;
        if (b.kind === 'pick') {
          const k = clamp01(b.t / .22), m = ease(clamp01((b.t - .22) / (PICK_T - .27)));
          if (anim.reach.R) anim.reach.R.w = k; if (anim.reach.L) anim.reach.L.w = k;
          const it = b.it, sock = it.def.size === 'hand' ? ch.sockets.handR : it.def.size === 'front' ? ch.sockets.chest : ch.sockets.head;
          if (m > 0) { sock.getWorldPosition(_w); it.g.position.lerpVectors(b.from, _w, m); if (it.def.size !== 'front') it.g.position.y -= it.h * m * (it.def.size === 'hand' ? .75 : 0); }
          if (b.t >= PICK_T) { this.busy = null; this._load(it); }
        } else if (b.kind === 'put') {
          const m = ease(clamp01((b.t - .12) / (DROP_T - .17))), it = b.it;
          it.g.position.lerpVectors(b.from, b.to, m); it.g.position.y += Math.sin(m * Math.PI) * .08;
          const fade = 1 - clamp01((b.t - DROP_T + .15) / .15); if (anim.reach.R) anim.reach.R.w = fade; if (anim.reach.L) anim.reach.L.w = fade;
          if (b.t >= DROP_T) {
            this.busy = null; anim.reach.L = anim.reach.R = null; if (ch.pump) ch.pump.visible = true; it.by = null;
            if (b.target) { seat(it, b.target.socket, 'base'); it.state = 'placed'; onMessage(`${it.def.name} — ${b.target.name} ပေါ် တင်ပြီ`); }
            else { it.state = 'ground'; it.g.position.y = 0; }
          }
        } else if (b.kind === 'give') {
          const k = ease(clamp01(b.t / .3)), o = b.o, oa = o.person.anim;
          if (!b.done) { anim.reach.R.w = k; oa.reach.R.w = k; }
          if (b.t >= .35 && !b.done) { b.done = true; const it = b.it; this.release(true); o._load(it); if (it.def.size === 'hand') oa.reach.R = { target: b.mid, w: 1 }; const who = o.person.def?.name ?? ''; onMessage(`${it.def.name} — ${who.includes('{') ? 'ကိုယ့်' : who} ကို ပေးပြီ`); }
          if (b.done && o.item?.def.size === 'hand' && oa.reach.R) oa.reach.R.w = 1 - clamp01((b.t - .35) / .25); // the hand comes back down with it
          if (b.t >= GIVE_T) { this.busy = null; o.busy = null; if (o.item?.def.size === 'hand') oa.reach.R = null; }
        } else if (b.kind === 'throw') {
          if (b.t >= THROW_REL && !b.out) {
            b.out = true; const it = b.it, p = ch.sockets.handR.getWorldPosition(new THREE.Vector3()), r = ch.root;
            this.release(true); toWorld(it); it.g.position.copy(p); it.state = 'flying'; it.by = null; it.spin = 6; it.thrower = this;
            it.vel.set(Math.sin(r.rotation.y) * 4.2, 3.4, Math.cos(r.rotation.y) * 4.2);
            if (onThrow?.(it, it.vel.clone())) it.state = 'external'; // physics hook (Rapier in T3); otherwise our own arc
          }
          if (b.t >= THROW_T) this.busy = null;
        } else if (b.kind === 'take') { /* the receiving side is driven by the giver */ }
      },
    };
    carriers.push(c); return c;
  }
  // chibi arms (~.29 of rig) can't reach the top of the big head: for a head load the right hand comes up beside the cheek, elbow out —
  // that reads as 「လက်တစ်ဖက် ထောက်」 without the arm vanishing into the head
  function headSide(ch) { if (!ch.headSide) { const o = new THREE.Object3D(), sh = ch.arms[1].sh.position; o.position.set(sh.x - .13, sh.y + .25, .06); ch.spine.add(o); ch.headSide = o; } return ch.headSide; }
  function faceTo(root, p) { root.rotation.y = Math.atan2(p.x - root.position.x, p.z - root.position.z); }
  function wetten(it) { if (it.def.wet) it.wetK = 1; }

  // ---------------------------------------------------------------- per frame
  let T = 0;
  function update(dt) {
    T += dt;
    for (const c of carriers) c.update(dt);
    for (const it of [...items]) {
      if (it.state === 'flying') { // own arc: tumble, land, settle (a balloon bursts)
        it.vel.y -= 9.8 * dt; it.g.position.addScaledVector(it.vel, dt); it.g.rotation.x += (it.spin ?? 0) * dt;
        if (it.def.burst) for (const c of carriers) if (c !== it.thrower && !c.busy && c.pos.distanceTo(_v.copy(it.g.position).setY(c.pos.y)) < .3 && it.g.position.y < .9 * c.person.ch.scale + .1 && it.g.position.y > .1) { c.hit(it.vel); onBurst(it.g.position.clone(), c); remove(it); break; }
        if (it.state === 'gone') continue;
        if (it.g.position.y <= 0 && it.vel.y < 0) {
          if (it.def.burst) { onBurst(it.g.position.clone(), null); remove(it); continue; }
          it.g.position.y = 0; it.vel.set(0, 0, 0); it.g.rotation.set(0, it.g.rotation.y, 0); it.state = 'ground'; it.thrower = null;
        }
      }
      if (it.wob > 0) { it.wob = Math.max(0, it.wob - dt * 1.4); it.body.rotation.z = Math.sin(T * 19) * .32 * it.wob; it.body.rotation.x = Math.sin(T * 13) * .12 * it.wob; } // wobble on the head
      if (it.wetK > 0) { it.wetK = Math.max(0, it.wetK - dt / 6); it.g.traverse(m => { if (m.isMesh && m.userData.base) m.material.color.copy(m.userData.base).multiplyScalar(1 - .3 * it.wetK); }); }
      if (it.life !== null && it.state !== 'gone') { // ice: shrinks, drips, gone at zero
        it.life = Math.max(0, it.life - dt * (it.shade ? .5 : 1));
        const f = it.life / it.def.melt; it.body.scale.setScalar(.3 + .7 * f);
        it.g.getWorldPosition(_v); const s = it.g.getWorldScale(_w).x * it.body.scale.x;
        for (const d of it.drips) {
          if (!d.on) { if (Math.random() < dt * 3) { d.on = true; d.v = 0; d.m.position.set(_v.x + (Math.random() - .5) * .2 * s, _v.y, _v.z + (Math.random() - .5) * .16 * s); d.m.visible = true; } continue; }
          d.v -= 9 * dt; d.m.position.y += d.v * dt; if (d.m.position.y < .01) { d.on = false; d.m.visible = false; }
        }
        if (it.life <= 0) { onMessage('ရေခဲ ကုန်ပြီ'); remove(it); }
      }
    }
  }

  return { items, carriers, targets, item, carrier, target, update, remove, fall, ITEMS, FALL };
}
