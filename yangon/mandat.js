// yangon/mandat.js — the kids' mandat on the empty lot (SCENARIO v6 §0 "the mandat grows"): every part has a fixed place on
// the lot, so day after day you watch it fill in. Day 1: floor · cloth · speaker · lights. Day 2: sign. Day 3: drum + ice.
// Day 4: the bowl, back on its seat. add(part) lifts a part up into place; drop(part) leaves a mission's haul on the ground
// by the lot until five o'clock. The seat at the front is a carry.js target (Bwa Bwa sets the bowl there in 1-6, and 4-7).
// Around it: rules.js's mandat zone (rule 4, no splashing within 2 m).
import { createRules } from '../rules.js?v=1';

export const PARTS = { floor: 1, cloth: 1, speaker: 1, lights: 1, sign: 2, drum: 3, ice: 3, bowl: 4 }; // part → the day it goes up
export const PART_NAME = { floor: 'ကြမ်းပြင်', cloth: 'ပိတ်စ', speaker: 'အသံချဲ့စက်', lights: 'မီးကြိုး', sign: 'ဆိုင်းဘုတ်', drum: 'ရေစည်', ice: 'ရေခဲတုံး', bowl: 'ငွေဖလား' };

// W: world · at: the lot's centre (set.js L.STAGE) · carry: a createCarry() world (for the seat) · onBreak(why): a rule broken
export function createMandat(W, { at, carry, onBreak = () => {} }) {
  const { THREE, scene, mesh, box, cyl, stripeTex } = W;
  const SX = at.x, SZ = at.z, H = .45; // the platform's top
  const root = W.keep(new THREE.Group()); scene.add(root);
  const parts = {}, piles = {};
  const part = k => { const g = new THREE.Group(); g.visible = false; root.add(g); parts[k] = g; return { parent: g }; };
  const pile = k => { const g = new THREE.Group(); g.visible = false; root.add(g); piles[k] = g; return { parent: g }; };
  const BAMBOO = '#c9a45c';

  // ---------- the parts, each on its own anchor ----------
  { const o = part('floor'); // a bamboo platform, four posts, the beams across the top, a little stand at the front for the bowl
    box(3.2, H, 2.0, BAMBOO, SX, .02, SZ, o); box(3.3, .05, 2.1, '#b8924a', SX, H, SZ, o);
    for (const [px, pz] of [[-1.5, -.9], [1.5, -.9], [-1.5, .9], [1.5, .9]]) cyl(.07, .07, 2.5, BAMBOO, SX + px, H, SZ + pz, 6, o);
    for (const pz of [-.9, .9]) box(3.3, .08, .08, BAMBOO, SX, 2.9, SZ + pz, o);
    box(.36, .3, .36, '#8a5a3a', SX + .9, H, SZ + .62, o); box(.42, .04, .42, '#d9a84a', SX + .9, H + .3, SZ + .62, o); // the bowl's stand
  }
  { const o = part('cloth'); // the striped backdrop and the platform's skirt
    mesh(new THREE.PlaneGeometry(3.0, 2.2), new THREE.MeshLambertMaterial({ map: stripeTex('#f48fb1', '#fff6ea', 6), side: THREE.DoubleSide }), SX, 1.6, SZ - .88, { ...o, cast: false });
    mesh(new THREE.PlaneGeometry(3.2, .42), new THREE.MeshLambertMaterial({ map: stripeTex('#ffc83d', '#c8553d', 10) }), SX, .25, SZ + 1.01, { ...o, cast: false });
  }
  { const o = part('speaker'); // U Ba Tin's two speaker boxes at the back corners
    for (const px of [-1.25, 1.25]) { box(.36, .55, .32, '#26222b', SX + px, H, SZ - .6, o); mesh(new THREE.CircleGeometry(.11, 14), '#4a4452', SX + px, H + .32, SZ - .43, { ...o, cast: false }); }
  }
  const bulbs = [];
  { const o = part('lights'); // Ko Zaw's string along the front beam, sagging a little
    for (let i = 0; i <= 12; i++) { const base = i % 2 ? new THREE.Color(2.8, 2.3, 1.2) : new THREE.Color(2.8, 1.5, 1.4), m = mesh(new THREE.SphereGeometry(.06, 8, 6), new THREE.MeshBasicMaterial({ color: base.clone() }), SX - 1.6 + i * .27, 2.86 - Math.sin(i / 12 * Math.PI) * .12, SZ + .95, { ...o, cast: false }); m.userData.base = base; bulbs.push(m); } // over 1: they glow under bloom
  }
  { const o = part('sign'); // day 2 (T6 paints it): a blank board on the front beam
    mesh(new THREE.PlaneGeometry(2.4, .5), new THREE.MeshLambertMaterial({ color: '#ffe7a3' }), SX, 2.55, SZ + .95, { ...o, cast: false });
  }
  { const o = part('drum'); cyl(.32, .32, .8, '#3f8fd0', SX + 2.1, .02, SZ - .6, 14, o); cyl(.33, .33, .05, '#2f73c4', SX + 2.1, .8, SZ - .6, 14, o); } // day 3
  { const o = part('ice'); mesh(new THREE.BoxGeometry(.4, .3, .32), new THREE.MeshLambertMaterial({ color: '#cff6fa', transparent: true, opacity: .85 }), SX + 2.1, 1.0, SZ - .6, o); } // day 3, on the drum
  { const o = part('bowl'); mesh(new THREE.RingGeometry(.2, .26, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffe7a3' }), SX + .9, H + .35, SZ + .62, { ...o, cast: false }); } // day 4: a garland round the seat

  // ---------- today's hauls, waiting on the ground at the lot's edge until five o'clock ----------
  const PX = SX - 2.6, PZ = SZ + 1.6; // the corner by the lane
  { const o = pile('cloth'); mesh(new THREE.BoxGeometry(.5, .2, .36), new THREE.MeshLambertMaterial({ map: stripeTex('#f48fb1', '#fff6ea', 6) }), PX, .1, PZ, o); }
  { const o = pile('speaker'); for (const dx of [-.22, .22]) box(.36, .55, .32, '#26222b', PX + .9 + dx, .02, PZ, o); }
  { const o = pile('lights'); for (let i = 0; i < 10; i++) mesh(new THREE.SphereGeometry(.05, 6, 5), i % 2 ? '#ffd23f' : '#ff8ad8', PX + 1.9 + Math.cos(i * .63) * .22, .07, PZ + Math.sin(i * .63) * .22, { ...o, cast: false }); }

  // ---------- the bowl's seat: a carry target on the stand ----------
  const socket = new THREE.Object3D(); socket.position.set(SX + .9, H + .34, SZ + .62); root.add(socket);
  const seat = carry?.target(socket, 'မဏ္ဍပ်', { accepts: it => it?.kind === 'bowl' });

  // ---------- rule 4: no splashing in the mandat (from the floor going up) ----------
  const zone = { x: SX, z: SZ, r: 2, kind: 'mandat' };
  const rules = createRules({ zones: [], onBreak });

  // ---------- add: up it comes — from below the ground, a little overshoot, settle ----------
  const lifts = []; let lastGlow = -1;
  function add(k, { instant = false } = {}) {
    const g = parts[k]; if (!g) return Promise.resolve();
    if (piles[k]) piles[k].visible = false;
    if (k === 'floor') { W.solid(SX, SZ, 3.3, 2.1); if (!rules.zones.includes(zone)) rules.zones.push(zone); }
    g.visible = true;
    if (instant) { g.position.y = 0; g.scale.setScalar(1); return Promise.resolve(); }
    g.position.y = -1.2; return new Promise(r => lifts.push({ g, t: 0, r }));
  }
  W.tick(dt => {
    for (let i = lifts.length - 1; i >= 0; i--) {
      const L = lifts[i]; L.t += dt / 1.1; const t = Math.min(1, L.t), e = 1 - (1 - t) ** 3, over = Math.sin(t * Math.PI) * .12;
      L.g.position.y = -1.2 * (1 - e) + over * (t > .6 ? 1 : 0); L.g.scale.y = .4 + .6 * e;
      if (t >= 1) { L.g.position.y = 0; L.g.scale.y = 1; lifts.splice(i, 1); L.r(); }
    }
    const glow = .6 + .4 * W.night(); if (glow !== lastGlow) { lastGlow = glow; for (const m of bulbs) m.material.color.copy(m.userData.base).multiplyScalar(glow); } // brighter after dark
  });

  return {
    parts, add, has: k => !!parts[k]?.visible && !lifts.some(l => l.g === parts[k]),
    drop: (k, on = true) => { if (piles[k]) piles[k].visible = on; },
    seat, zone, rules, centre: at.clone(), front: new THREE.Vector3(SX, 0, SZ + 1.9),
    pileAt: new THREE.Vector3(PX + 1, 0, PZ), seatAt: socket.position.clone(), // root sits at the origin
    // rule 4: may you splash here? (only once the floor is up)
    canFire: p => rules.canFire(p),
  };
}
