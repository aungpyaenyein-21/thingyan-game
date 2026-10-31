// critters.js — Yangon street dogs and cats (ခွေး / ကြောင်) in the same chibi style: code-built rig + procedural gait. No model files.
import * as THREE from 'three';
import { outline, emoteTex, shade } from './chibi.js?v=31';

// coats: main fur, belly / muzzle, mark (patches), pattern ('plain' | 'patch' | 'tabby' | 'calico')
export const DOG_COATS = [
  { main: '#c98d4f', belly: '#f3e2c4', pattern: 'plain' },                    // the classic tan pariah dog
  { main: '#3a302c', belly: '#c98d4f', pattern: 'plain' },                    // black & tan
  { main: '#f3ead8', belly: '#fff8ee', mark: '#a8743a', pattern: 'patch' },   // white with brown patches
  { main: '#8a6a4a', belly: '#f3ead8', pattern: 'plain' },
];
export const CAT_COATS = [
  { main: '#e8954a', belly: '#fff1dc', pattern: 'tabby' },                    // orange tabby
  { main: '#9aa0a8', belly: '#eceae6', pattern: 'tabby' },                    // grey tabby
  { main: '#2e2a2e', belly: '#f3ead8', pattern: 'plain' },                    // tuxedo
  { main: '#f3ead8', belly: '#fff8ee', mark: '#e8954a', mark2: '#3a302c', pattern: 'calico' },
];

function tabbyTex(a, b) { // rings round the body / head
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  g.fillStyle = a; g.fillRect(0, 0, 64, 64); g.fillStyle = b;
  for (let y = 4; y < 64; y += 16) { g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 64; x += 8) g.lineTo(x, y + 5 + Math.sin(x * .4) * 2); g.lineTo(64, y); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); return t;
}

// opts: kind ('dog'|'cat'), coat (see above), ears ('point'|'floppy', dogs), socks (white paws), size, outline
export function makeCritter(opts = {}) {
  const o = { kind: 'dog', ears: 'point', socks: false, size: 1, outline: false, ...opts };
  const dog = o.kind === 'dog', coat = o.coat ?? (dog ? DOG_COATS : CAT_COATS)[0];
  const mats = []; // per critter so a soaked one darkens alone
  const M = (c, map) => { const m = new THREE.MeshLambertMaterial({ color: map ? '#fff' : c, map }); m.userData.base = m.color.clone(); mats.push(m); return m; };
  const fur = coat.pattern === 'tabby' ? M(null, tabbyTex(coat.main, shade(coat.main, .28))) : M(coat.main), plain = M(coat.main), under = M(coat.belly);
  const part = (geo, m, parent, x = 0, y = 0, z = 0, ol = o.outline) => {
    const mesh = new THREE.Mesh(geo, typeof m === 'string' ? M(m) : m); mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh);
    if (ol) mesh.add(new THREE.Mesh(geo, outline));
    return mesh;
  };
  const pivot = (parent, x, y, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };

  const S = dog ? { r: .1, len: .16, leg: .17, head: .1 } : { r: .072, len: .17, leg: .12, head: .088 };
  const root = new THREE.Group(); root.scale.setScalar(o.size);
  const bodyY = S.leg + S.r * .7;
  const torso = pivot(root, 0, bodyY);
  part(new THREE.CapsuleGeometry(S.r, S.len, 6, 14), fur, torso).rotation.x = Math.PI / 2;
  part(new THREE.SphereGeometry(S.r * .9, 14, 10), under, torso, 0, -S.r * .34, 0, false).scale.set(.95, .6, (S.len / 2 + S.r) / S.r * .82); // pale belly
  const patches = coat.pattern === 'patch' ? [[coat.mark, .05, .06, -.04], [coat.mark, -.06, .03, .07]]
    : coat.pattern === 'calico' ? [[coat.mark, .04, .05, -.05], [coat.mark2, -.05, .04, .05], [coat.mark, -.03, .06, -.09]] : [];
  for (const [c, x, y, z] of patches) part(new THREE.SphereGeometry(S.r * .62, 12, 8), M(c), torso, x, y, z, false).scale.set(1, .55, 1.3);

  // head + face (simple beads; the face is small at gameplay zoom)
  const neck = pivot(torso, 0, S.r * .5, S.len / 2 + S.r * .45);
  const head = pivot(neck, 0, S.head * .55, S.head * .35);
  part(new THREE.SphereGeometry(S.head, 18, 14), coat.pattern === 'calico' ? M(coat.main) : plain, head).scale.set(1.08, .95, 1);
  if (coat.pattern === 'calico') part(new THREE.SphereGeometry(S.head * .7, 12, 8), M(coat.mark2), head, -.04, .045, -.01, false).scale.set(.9, .6, .9);
  const eyes = [-1, 1].map(s => {
    const e = part(new THREE.SphereGeometry(dog ? .019 : .021, 10, 8), '#1e1418', head, s * S.head * .44, .02, S.head * .86, false);
    part(new THREE.SphereGeometry(.006, 6, 4), '#ffffff', e, -.006, .008, .015, false);
    return e;
  });
  if (dog) {
    part(new THREE.SphereGeometry(.058, 14, 10), under, head, 0, -.03, S.head * .78).scale.set(.95, .72, 1.05); // snout
    part(new THREE.SphereGeometry(.02, 8, 6), '#2a1e1c', head, 0, -.008, S.head * .78 + .058, false).scale.set(1.3, .9, 1); // nose
  } else {
    for (const s of [-1, 1]) part(new THREE.SphereGeometry(.027, 10, 8), under, head, s * .019, -.032, S.head * .82, false);
    part(new THREE.SphereGeometry(.012, 8, 6), '#e8848a', head, 0, -.014, S.head * .97, false);
  }
  const earList = [-1, 1].map(s => {
    const e = pivot(head, s * S.head * .6, S.head * .7, -.005);
    if (!dog || o.ears === 'point') {
      e.rotation.z = -s * (dog ? .32 : .22);
      part(new THREE.ConeGeometry(dog ? .036 : .04, dog ? .075 : .08, dog ? 8 : 3), plain, e, 0, .03, 0).rotation.y = dog ? 0 : Math.PI / 6;
      if (!dog) part(new THREE.ConeGeometry(.022, .05, 3), '#f2a6a6', e, 0, .024, .012, false).rotation.y = Math.PI / 6;
    } else { e.position.y = S.head * .45; e.position.x = s * S.head * .88; e.rotation.z = s * .35; part(new THREE.SphereGeometry(.045, 10, 8), plain, e, 0, -.035, 0).scale.set(.35, 1, .8); } // floppy
    return e;
  });

  // legs: [front-left, front-right, back-left, back-right]; +x is the critter's left (it faces +z)
  const legLen = S.leg + S.r * .3 - .03, legR = dog ? .03 : .022;
  const legs = [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz]) => {
    const hip = pivot(torso, sx * S.r * .55, -S.r * .4, sz * S.len * .42);
    part(new THREE.CapsuleGeometry(legR, legLen - legR * 2, 4, 10), plain, hip, 0, -legLen / 2);
    part(new THREE.SphereGeometry(legR * 1.35, 10, 8), o.socks ? under : plain, hip, 0, -legLen + .004, .008).scale.set(1, .75, 1.25);
    return hip;
  });

  // tail: a chain of segments; dogs curl theirs over the back, cats hold a tall J
  const tail = [];
  let tp = pivot(torso, 0, S.r * .35, -S.len / 2 - S.r * .7);
  const n = dog ? 3 : 5, seg = dog ? .055 : .062;
  for (let i = 0; i < n; i++) {
    const r = (dog ? .028 : .02) * (1 - i / (n * 1.6));
    part(new THREE.CapsuleGeometry(r, seg, 4, 8), i === n - 1 && dog ? under : fur, tp, 0, seg / 2);
    tail.push(tp); tp = pivot(tp, 0, seg);
  }

  const blob = new THREE.Mesh(new THREE.CircleGeometry(dog ? .26 : .2, 18), new THREE.MeshBasicMaterial({ color: '#46284f', transparent: true, opacity: .22, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = .005; root.add(blob);

  return { root, torso, head, neck, eyes, ears: earList, legs, tail, blob, S, bodyY, dog, mats, wet: 0, bubble: null, opts: o };
}

// loops: idle | walk | run | sit | sleep ; one-shots: shake (wet-dog) | hop (startled)
export class CritterAnimator {
  constructor(c, emit = () => {}) {
    this.c = c; this.emit = emit; this.loop = 'idle'; this.one = null; this.t1 = 0;
    this.T = Math.random() * 10; this.phi = 0; this.f = 0; this.amp = 0; this.happy = 0;
    this.p = { y: 0, pitch: 0, headX: 0, headY: 0, eyes: 1, fF: 0, fB: 0, tailX: 0, tailZ: 0 }; // smoothed posture
  }
  setLoop(name) { this.loop = name; }
  play(name) { this.one = name; this.t1 = 0; }
  soak() { this.c.wet = 1; }
  get speed() { if (this.one === 'shake') return 0; return ({ walk: this.c.dog ? .45 : .38, run: this.c.dog ? 1.5 : 1.9 }[this.loop] || 0) * this.c.root.scale.x; }
  emote(kind, dur = 1.6) {
    const c = this.c;
    if (!c.bubble) { c.bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: emoteTex(kind), depthWrite: false })); c.bubble.renderOrder = 10; c.root.add(c.bubble); }
    c.bubble.material.map = emoteTex(kind); c.bubble.visible = true; this.emT = 0; this.emDur = dur;
  }

  update(dt) {
    const c = this.c, S = c.S, T = this.T += dt, L = this.loop;
    const gaitF = { walk: c.dog ? 2.2 : 2.0, run: c.dog ? 3.6 : 4.2 }[L] || 0;
    this.f += (gaitF - this.f) * Math.min(1, dt * 6); this.phi += this.f * Math.PI * 2 * dt;
    this.amp += ((L === 'run' ? .85 : L === 'walk' ? .5 : 0) - this.amp) * Math.min(1, dt * 6);
    const ph = this.phi, A = this.amp, run = L === 'run';
    // posture targets
    const t = { y: 0, pitch: 0, headX: 0, headY: 0, eyes: 1, fF: 0, fB: 0, tailX: 0, tailZ: 0 };
    if (L === 'idle') { t.headY = Math.sin(T * .45) * .55 * (Math.sin(T * .17) > 0 ? 1 : .2); t.headX = Math.sin(T * .3) * .08; }
    if (L === 'sit') { t.pitch = -.5; t.y = -.03; t.fF = .5; t.fB = 1.25; t.headX = .42; t.tailX = c.dog ? .5 : .6; t.tailZ = c.dog ? 0 : .9; t.headY = Math.sin(T * .35) * .4; }
    if (L === 'sleep') { t.y = -(S.leg - .03); t.fF = -1.35; t.fB = 1.25; t.headX = .3; t.headY = .55; t.eyes = .12; t.tailX = .9; t.tailZ = 1.1; }
    const k = Math.min(1, dt * 8);
    for (const key in t) this.p[key] += (t[key] - this.p[key]) * k;
    const p = this.p;
    // gait on top of the posture
    const legs = run ? [A * Math.sin(ph), A * Math.sin(ph + .35), A * Math.sin(ph + 2.6), A * Math.sin(ph + 2.95)] // bounding: front pair, then back pair
      : [A * Math.sin(ph), A * Math.sin(ph + Math.PI), A * Math.sin(ph + Math.PI), A * Math.sin(ph)]; // trot: diagonal pairs
    let y = p.y + (run ? .035 * Math.max(0, Math.sin(ph + .4)) : .008 * Math.abs(Math.cos(ph))), pitch = p.pitch + (run ? .12 * Math.sin(ph + .5) : 0), roll = 0;
    let headX = p.headX + (A ? .06 * Math.sin(2 * ph) : 0), headY = p.headY, headZ = 0;
    // one-shots
    if (this.one) {
      const u = this.t1 += dt;
      if (this.one === 'shake') { const d = Math.max(0, 1 - u); roll = .55 * Math.sin(u * 32) * d; headZ = -roll * 1.3; headY = 0;
        if (u < .7 && Math.floor(u * 25) !== Math.floor((u - dt) * 25)) this.emit('drip', c.head);
        if (u > 1) this.one = null; }
      if (this.one === 'hop') { const q = Math.min(1, u / .45); y += .2 * 4 * q * (1 - q); if (u > .45) this.one = null; }
    }
    // apply
    c.torso.position.y = c.bodyY + y; c.torso.rotation.set(pitch, 0, roll);
    c.torso.scale.y = 1 + (L === 'sleep' ? .03 * Math.sin(T * 2) : .012 * Math.sin(T * 3)); // breathing
    c.legs[0].rotation.x = legs[0] - p.fF; c.legs[1].rotation.x = legs[1] - p.fF; // front legs: counter the sit pitch / tuck forward when lying
    c.legs[2].rotation.x = legs[2] + p.fB; c.legs[3].rotation.x = legs[3] + p.fB;
    c.head.rotation.set(headX, headY, headZ);
    const blink = L !== 'sleep' && (T % 4.3) < .12;
    for (const e of c.eyes) e.scale.y = blink ? .15 : p.eyes;
    // tail
    this.happy = Math.max(0, this.happy - dt * .25);
    const wag = c.dog ? (.35 + .4 * this.happy) * Math.sin(T * (8 + 8 * this.happy)) : .25 * Math.sin(T * 1.6);
    c.tail.forEach((s, i) => {
      if (c.dog) s.rotation.set(i ? .55 + p.tailX * .2 : -.45 + p.tailX, 0, i ? 0 : wag * (1 - p.tailX * .8) + p.tailZ);
      else s.rotation.set(i ? .3 - p.tailX * .33 + (A ? .1 * Math.sin(ph + i) : 0) : -1.25 - p.tailX * .35, 0, i ? wag * .3 + p.tailZ * .55 : wag + p.tailZ * .9); // a J up the back; asleep it lies flat and wraps round
    });
    c.ears.forEach((e, i) => { e.rotation.x = run ? -.35 : 0; });
    c.blob.scale.setScalar(1 - Math.min(.5, Math.max(0, y) * 2));
    // wet fur darkens, then dries
    if (c.wet > 0) { c.wet = Math.max(0, c.wet - dt / 8); for (const m of c.mats) m.color.copy(m.userData.base).multiplyScalar(1 - .3 * c.wet); }
    if (c.bubble?.visible) {
      const u = this.emT += dt, s = .42 * Math.min(1, u / .12) * Math.min(1, Math.max(0, (this.emDur - u) / .2));
      c.bubble.scale.set(s, s, 1); c.bubble.position.set(0, c.bodyY + S.r + S.head * 2.4 + .18 + Math.sin(u * 5) * .02, S.len * .4); if (u > this.emDur) c.bubble.visible = false;
    }
  }
}
