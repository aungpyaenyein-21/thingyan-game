// yangon/life.js — the ward going about its day (STORY.md §၄): people chatting in knots, eating at the mohinga stall,
// vendors on their stools calling out, shoppers and old folk with offering trays in the morning, a trishaw doing the
// market run, bicycles, the odd car, the yellow YBS bus and the people waiting for it, kids with a drum of water by the
// road, chinlone once the day cools. None of it is a quest; it's the street. main.js owns the story people.
import { PAL } from '../world.js?v=3';

export function startLife(W, { L, BOUNDS, ground, phase }) {
  const { THREE, scene, bean, mesh, box, cyl, textTex, bubbleTex, rnd, pick } = W;
  const V = (x, z) => new THREE.Vector3(x, 0, z);
  const group = () => { const g = W.keep(new THREE.Group()); scene.add(g); return g; };
  const npc = (o = {}) => { const c = bean({ prop: 'none', print: '', ...o }); c.g.position.y = ground(c.g.position.x, c.g.position.z); return c; };
  const show = (c, on) => { c.g.visible = on; };
  const isNight = () => W.night() > .3; // after dark the market packs up, the kids go in, the shops shut
  const morning = () => phase() === 'morning', evening = () => phase() === 'late' || phase() === 'evening';
  const lift = (c, y, k = .45) => { c.ty = { from: c.g.position.y, to: y, t: 0, k }; }; // ease the body up/down onto a seat

  // ---------- speech bubbles (street calls), one sprite per speaker, textures shared ----------
  const TEX = new Map(), tex = t => TEX.get(t) ?? (TEX.set(t, bubbleTex(t)), TEX.get(t));
  function say(c, text, dur = 2.4, y = 2.3) {
    if (!c.say) { c.say = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(text), depthWrite: false })); c.say.scale.set(2.6, .82, 1); c.g.add(c.say); }
    c.say.material.map = tex(text); c.say.position.y = y / c.g.scale.x; c.say.visible = true; c.sayT = dur;
  }

  // ---------- a tiny script runtime: scripts are async functions that walk paths and wait ----------
  const jobs = [], walkers = new Set(), drivers = new Set(), people = [];
  const wait = s => new Promise(r => jobs.push({ t: s, r }));
  const until = f => new Promise(r => jobs.push({ f, r }));
  const pts = list => list.map(p => p.isVector3 ? p.clone() : V(p[0], p[1]));
  function walk(c, list, loop = 'walk') { return new Promise(r => { c.path = pts(list); c.pi = 0; c.walkLoop = loop; c.arrive = r; walkers.add(c); }); }
  const back = list => [...list].reverse();
  function stepWalker(c, dt) {
    const p = c.g.position, t = c.path[c.pi], dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz);
    if (d < .12) { if (++c.pi >= c.path.length) { walkers.delete(c); c.anim.setLoop('idle'); const r = c.arrive; c.arrive = null; r(); } return; }
    const pp = W.player.g.position, blocked = Math.hypot(pp.x - (p.x + dx / d * .45), pp.z - (p.z + dz / d * .45)) < .5; // give way to you
    if (blocked) { if (c.anim.loop !== 'idle' && !c.anim.one) c.anim.setLoop('idle'); return; }
    if (c.anim.loop !== c.walkLoop) c.anim.setLoop(c.walkLoop);
    let a = Math.atan2(dx, dz) - c.g.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a)); c.g.rotation.y += a * Math.min(1, dt * 8);
    const s = Math.min(d, c.anim.speed * dt); p.x += dx / d * s; p.z += dz / d * s; p.y = ground(p.x, p.z);
  }
  // vehicles: a group that faces +x locally, moved along a path at its own speed (bike, trishaw, cart)
  function drive(v, list) { return new Promise(r => { v.path = pts(list); v.pi = 0; v.arrive = r; drivers.add(v); }); }
  function stepDriver(v, dt) {
    const p = v.g.position, t = v.path[v.pi], dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz);
    if (d < .15) { if (++v.pi >= v.path.length) { drivers.delete(v); v.moving = false; const r = v.arrive; v.arrive = null; r(); } return; }
    const sx = Math.sin(v.g.rotation.y) * (v.side || 0), sz = Math.cos(v.g.rotation.y) * (v.side || 0); // a sidecar sweeps its own strip
    const what = blockedAhead(v, p.x, p.z, dx / d, dz / d, 1.4, .15) || (v.side ? blockedAhead(v, p.x + sx, p.z + sz, dx / d, dz / d, 1.2, .2) : null);
    v.blockT = what ? (v.blockT || 0) + dt : 0; v.moving = !what || (what !== 'you' && v.blockT > (v.giveUp ?? 1e9)); // never through you
    if (!v.moving) { if (v.bell && (what === 'you' || what?.g) && !(v.bellT > 0)) { v.bellT = 3; say(v.rider ?? v.who, v.bell, 1.4, 2.2); W.onFx?.('bike', v.g.position); } return; } // stop for whoever's in the way (and ring the bell)
    let a = Math.atan2(dx, dz) - Math.PI / 2 - v.g.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a)); v.g.rotation.y += a * Math.min(1, dt * 5);
    const s = Math.min(d, v.speed * dt); p.x += dx / d * s; p.z += dz / d * s; v.roll?.(s);
  }

  // what's in front of a vehicle heading (ux, uz): you, someone standing or walking, a car, the bus, another bike — so nobody drives through anybody
  function blockedAhead(self, px, pz, ux, uz, reach, pad = 0) {
    const hit = (x, z, w) => { const ax = x - px, az = z - pz, along = ax * ux + az * uz; return along > .05 && along < reach && Math.abs(-ax * uz + az * ux) < w + pad; };
    const pp = W.player.g.position; if (hit(pp.x, pp.z, .4)) return 'you';
    for (const c of W.chars) if (c.g.visible && c.g.parent === scene && c !== W.player && hit(c.g.position.x, c.g.position.z, .3)) return c;
    for (const o of CARS) if (o.on && o !== self) for (const k of [-.9, 0, .9]) if (hit(o.g.position.x + k, o.g.position.z, .5)) return 'car';
    if (self !== BUS && BUS.away <= 0) for (const k of [-2.1, -1, 0, 1, 2.1]) if (hit(bus.position.x + k, bus.position.z, .75)) return 'car';
    for (const o of [trike, ...bikes]) if (o !== self && o.g.visible) for (const k of o === trike ? [0, .78] : [0]) if (hit(o.g.position.x + Math.sin(o.g.rotation.y) * k, o.g.position.z + Math.cos(o.g.rotation.y) * k, .35)) return 'bike'; // the trishaw's sidecar too
    return null;
  }

  // ---------- people talking in a knot: one speaks (hands going), the others nod; now and then they all laugh ----------
  const knots = [];
  function knot(list, seated = false) { const k = { ppl: list, t: rnd() * 2, who: -1, seated }; list.forEach(c => { c.anim.chat = 'listen'; }); knots.push(k); return k; }
  function standingKnot(cx, cz, n, look = () => ({}), r = .62) {
    const list = [];
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + rnd() * .4; const c = npc({ x: cx + Math.sin(a) * r, z: cz + Math.cos(a) * r, ...look(i) }); c.g.rotation.y = a + Math.PI; list.push(c); }
    return knot(list);
  }
  function stepKnot(k, dt) {
    if ((k.t -= dt) > 0 || !k.ppl.some(c => c.g.visible)) return;
    if (rnd() < .22 && k.who >= 0) { // something funny
      k.ppl.forEach((c, i) => { if (!c.anim.one) setTimeout(() => c.anim.play('laugh'), i * 90); }); k.ppl[k.who].anim.emote('haha', 1.4); k.t = 1.6; return;
    }
    let w; do w = (rnd() * k.ppl.length) | 0; while (w === k.who && k.ppl.length > 1);
    k.who = w; k.ppl.forEach((c, i) => { c.anim.chat = i === w ? 'speak' : 'listen'; }); if (rnd() < .3) k.ppl[w].anim.emote('dots', 1.2);
    k.t = 2.4 + rnd() * 3.5;
  }
  standingKnot(-.5, 2.6, 2, i => ({ age: i ? 'adult' : 'elder', hair: pick(['bun', 'bob', 'long']), topStyle: 'yinphone', bottom: 'htamein', flower: true })); // ① aunties by the lot
  standingKnot(23.6, 9.9, 2, () => ({ age: 'adult', bottom: pick(['longyi', 'longyi', 'pants']), hat: 'none' }), .5);                                // ② men on the corner
  const marketKnot = standingKnot(8.7, 20.3, 3, () => ({ age: pick(['adult', 'elder']), hair: pick(['bun', 'short']), bottom: pick(['htamein', 'longyi']) }));        // ③ in the market lane
  const yardElders = standingKnot(20.4, 12.1, 2, () => ({ age: 'elder', topStyle: 'taikpon', bottom: 'longyi', hat: 'none' }), .5);              // ④ in the kyaung yard

  // ---------- ③ vendors on their low stools: fanning, watching, calling you over ----------
  const CALLS = ['ဝယ်ကြ~ ဝယ်ကြ~', 'လတ်လတ်ဆတ်ဆတ်~', 'ဈေးချိုတယ်နော်~', 'လာ လာ ကြည့်ဦး~', 'သင်္ကြန် ရေသေနတ်~'];
  const vendors = L.SEATS.filter((_, i) => !(i % 2)).map(st => {
    const c = npc({ age: pick(['adult', 'adult', 'elder']), hair: pick(['bun', 'bun', 'short']), topStyle: pick(['yinphone', 'tee', 'shirt']), bottom: pick(['htamein', 'longyi']), hat: pick(['none', 'bucket']), x: st.x, z: st.z, ry: st.ry });
    c.anim.setLoop('vend'); c.g.position.y = .04; c.callT = 3 + rnd() * 8; return c;
  });
  // ③ the mohinga stall's low tables: breakfast eaters (two each, on tiny stools)
  const dayOnly = []; // market folk: gone home after dark
  for (const tx of [8.0, 10.8]) {
    for (const [sx, ry] of [[.45, -Math.PI / 2], [-.45, Math.PI / 2]]) { const c = npc({ age: pick(['adult', 'adult', 'elder', 'kid']), x: tx + sx, z: 11.2, ry }); c.anim.setLoop('eat'); c.g.position.y = -.08; dayOnly.push(c); }
    cyl(.1, .1, .16, '#e0574f', tx - .45, .02, 11.2, 8);
    for (const s of [-1, 1]) { cyl(.1, .07, .07, '#fff6ea', tx + s * .14, .32, 11.2, 10); cyl(.085, .085, .01, '#d9a04a', tx + s * .14, .39, 11.2, 10); } // bowls of mohinga
  }
  // browsers squatting over the trays
  for (const [x, z, ry] of [[-5.6, 13.25, Math.PI], [2.2, 14.15, 0], [-.4, 19.85, Math.PI], [7.2, 20.75, 0]]) { const c = npc({ age: pick(['adult', 'elder']), hair: pick(['bun', 'long', 'short']), x, z, ry }); c.anim.setLoop('squat'); dayOnly.push(c); }

  // ---------- the YBS bus (yellow, 2017–) westbound on the north lane: stops, the conductor calls, people get on and off ----------
  const BUS = { len: 4.6, lane: 7.3, speed: 2.4, wait: 0, stopped: false, away: 2, boarding: 0, alight: false };
  const bus = group(), STOPX = L.STOP.x - 1.6; // bus x when its front door is at the shelter
  {
    const o = { parent: bus }, Y = '#f2c230';
    box(BUS.len, 1.5, 1.5, Y, 0, .32, 0, o); box(BUS.len + .02, .3, 1.52, '#3b3040', 0, .3, 0, o); box(BUS.len + .02, .1, 1.53, '#c8553d', 0, .78, 0, o);
    box(BUS.len - .2, .08, 1.3, '#e9e1d2', 0, 1.82, 0, o);
    for (let x = -1.8; x < 1.5; x += .7) for (const z of [-.76, .76]) box(.58, .5, .02, PAL.window, x, 1.02, z, o);
    box(.04, .7, 1.3, PAL.window, BUS.len / 2, .9, 0, o); box(.5, .9, .02, '#5a4a52', 1.7, .4, .76, o); // windscreen, front door
    for (const z of [-.77, .77]) { const t = mesh(new THREE.PlaneGeometry(.8, .3), new THREE.MeshLambertMaterial({ map: textTex('YBS', Y, '#2b2730', 256, 96, 70) }), -1.2, .58, z, { ...o, cast: false }); if (z < 0) t.rotation.y = Math.PI; }
    mesh(new THREE.PlaneGeometry(1.1, .26), new THREE.MeshLambertMaterial({ map: textTex('၃၆ ဆူးလေ', '#2b2730', '#ffb347', 256, 64, 40) }), BUS.len / 2 + .03, 1.62, 0, { ...o, cast: false }).rotation.y = Math.PI / 2;
    for (const wx of [-1.5, 1.4]) for (const wz of [-.72, .72]) { const w = mesh(new THREE.CylinderGeometry(.3, .3, .2, 12), '#2b2730', wx, .3, wz, o); w.rotation.x = Math.PI / 2; }
    bus.rotation.y = Math.PI; bus.position.set(BOUNDS.x1 + 6, .045, BUS.lane); // front (+x) faces west
  }
  const conductor = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex('ဆူးလေ~ ဆူးလေ~'), depthWrite: false })); conductor.scale.set(2.8, .88, 1); conductor.position.set(1.7, 2.7, .9); conductor.visible = false; bus.add(conductor);
  // waiting on the bench: walk up, sit down; when the bus stops, stand up and get on
  const BENCH_Y = .36, DOOR = () => V(bus.position.x - 1.7, 6.5);
  async function waiter(c, seatX) {
    for (;;) {
      show(c, false); await wait(3 + rnd() * 14);
      const from = rnd() < .5 ? [[-3.6, -1.6], [-3.6, 2.5], [-3.05, 2.8], [-3.05, 5.9], [-2.8, 6.45]] : [[14.5, 5.1], [11.4, 6.45]];
      c.g.position.copy(V(...from[0])); show(c, true);
      await walk(c, [...from.slice(1), [seatX, 6.45], [seatX, 6.08]]);
      c.g.rotation.y = 0; c.anim.setLoop('sit'); c.anim.play('sitdown'); lift(c, BENCH_Y);
      await until(() => BUS.stopped && BUS.wait > 0);
      BUS.boarding++; c.anim.setLoop('idle'); c.anim.play('standup'); lift(c, .14, .55); await wait(.6);
      await walk(c, [[seatX, 6.45], DOOR()]); BUS.boarding = Math.max(0, BUS.boarding - 1);
    }
  }
  [[2.6, { age: 'elder' }]].forEach(([x, o]) => waiter(npc(o), x));
  const alighter = npc({ age: 'adult', hair: 'long', topStyle: 'shirt', bottom: 'htamein' }); alighter.ch.hang = shopBag(alighter); show(alighter, false);
  async function getOff() { const c = alighter; c.g.position.copy(DOOR()); show(c, true); await walk(c, [[-2.8, 6.45], [-3.05, 5.9], [-3.05, 2.8], [-3.6, 2.5], [-3.6, -1.6]]); show(c, false); }
  function stepBus(dt) {
    if (BUS.away > 0) { BUS.away -= dt; return; }
    if (BUS.wait > 0 || BUS.boarding > 0) { BUS.wait -= dt; conductor.visible = BUS.wait > .8; if (BUS.wait < -8) BUS.boarding = 0; return; }
    const toStop = bus.position.x - STOPX, slow = BUS.stopped || toStop < 0 ? 1 : THREE.MathUtils.clamp(toStop / 2.5, .15, 1);
    if (!clearAhead(bus, -1, BUS.lane, BUS.len / 2 + .6)) return;
    bus.position.x -= BUS.speed * slow * dt;
    if (!BUS.stopped && toStop < .03) { BUS.stopped = true; BUS.wait = 5; if (rnd() < .6 && !alighter.g.visible) getOff(); }
    if (bus.position.x + BUS.len / 2 < BOUNDS.x0 - 4) { bus.position.x = BOUNDS.x1 + BUS.len; BUS.stopped = false; BUS.away = 6 + rnd() * 10; }
  }

  // ---------- cars: now and then one goes by (westbound north lane, eastbound south lane) ----------
  const CARS = [];
  function car(kind) {
    const g = group(), o = { parent: g }, col = { taxi: '#f3f1ea', sedan: pick(['#c8553d', '#3f6fa8', '#9aa3ad', '#2b2730']), wagon: '#e9e1d2', pickup: '#4f8f5a' }[kind];
    box(1.9, .42, .95, col, 0, .16, 0, o); box(.3, .1, .9, '#2b2730', -.95, .2, 0, o);
    if (kind === 'pickup') { box(.8, .5, .9, col, .45, .58, 0, o); box(.06, .3, .86, PAL.window, .86, .66, 0, o); for (const z of [-.44, .44]) box(1.0, .2, .05, col, -.45, .58, z, o); }
    else { const L2 = kind === 'wagon' ? 1.45 : 1.05, cx = kind === 'wagon' ? -.15 : -.05; box(L2, .4, .88, PAL.window, cx, .58, 0, o); box(L2 + .04, .06, .9, col, cx, .98, 0, o); for (const x of [cx - L2 / 2 + .05, cx + .1]) box(.08, .4, .9, col, x, .58, 0, o); }
    if (kind === 'taxi') { box(.4, .14, .22, '#f2c230', -.05, 1.04, 0, o); }
    for (const [x, z] of [[.6, .47], [.6, -.47], [-.6, .47], [-.6, -.47]]) { const w = mesh(new THREE.CylinderGeometry(.19, .19, .12, 10), '#2b2730', x, .19, z, o); w.rotation.x = Math.PI / 2; }
    for (const z of [-.3, .3]) box(.04, .08, .16, '#fff6ea', .96, .34, z, o);
    const v = { g, kind, on: false, dir: 1, lane: 8.3, speed: 0, max: 3.2 + rnd() * .8, honkT: 0, who: { g } }; g.visible = false; CARS.push(v); return v;
  }
  ['taxi', 'sedan', 'wagon', 'pickup', 'taxi'].forEach(car);
  let carT = 4;
  function clearAhead(g, dir, lane, half) { // nothing in this lane just ahead: you, people, the bus, cars, bikes, the trishaw
    const self = g === bus ? BUS : CARS.find(o => o.g === g);
    self.why = blockedAhead(self, g.position.x + dir * (half - .4), lane, dir, 0, 1.9, self === BUS ? .45 : .25);
    if (!self.why) self.since = W.time();
    return !self.why || (self.why !== 'you' && W.time() - self.since > 12); // never through you; anything else, after a long wait, it squeezes past
  }
  function stepCars(dt) {
    if ((carT -= dt) < 0) {
      carT = 12 + rnd() * 14; const v = pick(CARS.filter(c => !c.on)); // a car now and then, not traffic
      if (v) { v.since = W.time(); v.on = true; v.dir = rnd() < .5 ? 1 : -1; v.lane = v.dir > 0 ? 8.3 : 7.3; v.g.rotation.y = v.dir > 0 ? 0 : Math.PI; v.g.position.set(v.dir > 0 ? BOUNDS.x0 - 3 : BOUNDS.x1 + 3, .045, v.lane); v.g.visible = true; v.speed = v.max; }
    }
    for (const v of CARS) {
      if (!v.on) continue;
      const free = clearAhead(v.g, v.dir, v.lane, 1);
      v.speed = free ? Math.min(v.max, v.speed + dt * 2.5) : Math.max(0, v.speed - dt * 9);
      if (!free && v.speed < .3 && (v.honkT -= dt) < 0) { v.honkT = 4; const pp = W.player.g.position; if (Math.abs(pp.z - v.lane) < .8) { say(v.who, 'ပီ ပီ!', 1.2, 1.9); W.onFx?.('horn', v.g.position); } }
      v.g.position.x += v.dir * v.speed * dt;
      if (v.g.position.x > BOUNDS.x1 + 4 || v.g.position.x < BOUNDS.x0 - 4) { v.on = false; v.g.visible = false; }
    }
  }
  // you can't walk through a bus or a car
  function shove(px, pz, cx, cz, hx, hz) {
    const p = W.player.g.position, dx = p.x - cx, dz = p.z - cz;
    if (Math.abs(dx) < hx + .3 && Math.abs(dz) < hz + .3) { p.z = cz + Math.sign(dz || -1) * (hz + .3); W.collide(p); p.y = ground(p.x, p.z); }
  }

  // ---------- bicycles and the trishaw ----------
  function bikeFrame(o, col) {
    for (const x of [-.45, .45]) { const w = mesh(new THREE.TorusGeometry(.28, .025, 6, 16), '#2b2730', x, .3, 0, o); w.userData.wheel = true; }
    const bar = (a, b) => { const m = mesh(new THREE.CylinderGeometry(.022, .022, a.distanceTo(b), 5), col, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, o); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); };
    const H = new THREE.Vector3(.35, .78, 0), S = new THREE.Vector3(-.12, .72, 0), B = new THREE.Vector3(0, .32, 0);
    bar(new THREE.Vector3(-.45, .3, 0), S); bar(S, H); bar(B, S); bar(B, H); bar(H, new THREE.Vector3(.45, .3, 0)); bar(new THREE.Vector3(-.45, .3, 0), B);
    box(.05, .05, .5, '#2b2730', .38, .9, 0, o); box(.22, .05, .12, '#3b3040', -.14, .74, 0, o);
  }
  const wheelsOf = g => { const w = []; g.traverse(m => m.userData.wheel && w.push(m)); return w; };
  function rideOn(g, c, x = -.12, seatY = .76) { // a rider pedalling, facing the bike's +x
    g.add(c.g); c.g.position.set(x - .05, seatY - (c.ch.hipH + .02) * c.g.scale.x, 0); c.g.rotation.y = Math.PI / 2; c.anim.setLoop('cycle'); c.rideG = g;
  }
  function bike(col, o) {
    const g = group(); bikeFrame({ parent: g }, col); const c = npc(o); rideOn(g, c); people.push(c);
    const v = { g, speed: 2.4, rider: c, wheels: wheelsOf(g), bell: 'ကလင် ကလင်!', roll(s) { for (const w of this.wheels) w.rotation.z -= s / .28; } };
    g.visible = false; return v;
  }
  const ROUTES = [
    [[BOUNDS.x0 - 2, 8.85], [BOUNDS.x1 + 2, 8.85]], [[BOUNDS.x1 + 2, 6.75], [BOUNDS.x0 - 2, 6.75]],
    [[-1.5, -2.95], [-1.5, -2.4], [9.8, -2.4], [9.8, -9.4]], [[9.8, -9.4], [9.8, -2.4], [-1.5, -2.4], [-1.5, -2.95]], // from / to the flats
    [[13.6, 25.6], [13.6, 10.2], [13.6, 8.85], [BOUNDS.x1 + 2, 8.85]],                                                  // down the market street (the ice cart keeps to the other side)
  ];
  async function cyclist(v, first) {
    for (let k = first; ; k++) {
      v.g.visible = false; await wait(2 + rnd() * 10);
      const r = ROUTES[(k + (rnd() * 2 | 0)) % ROUTES.length]; v.g.position.set(r[0][0], .03, r[0][1]); v.g.rotation.y = Math.atan2(r[1][0] - r[0][0], r[1][1] - r[0][1]) - Math.PI / 2;
      v.g.visible = true; await drive(v, r.slice(1));
    }
  }
  const bikes = [bike('#3f6fa8', { age: 'adult', topStyle: 'shirt', bottom: 'longyi', hat: 'none' }), bike('#4f8f5a', { age: 'adult', hair: 'long', bottom: 'htamein', hat: 'none' })];
  bikes.forEach((v, i) => { v.giveUp = 12; cyclist(v, i * 2); });
  // the trishaw (ဆိုက်ကား): sidecar on the right, back-to-back seats; takes an auntie with a basket to market and comes back empty
  const trike = { g: group(), speed: 1.7, bell: 'ဆိုက်ကား~ ဆိုက်ကား~', side: .78, giveUp: 14 };
  {
    const g = trike.g, o = { parent: g }, tm = '#2f6f8f'; bikeFrame(o, tm);
    const w = mesh(new THREE.TorusGeometry(.24, .025, 6, 14), '#2b2730', -.1, .24, .78, o); w.userData.wheel = true;
    box(.95, .06, .1, tm, -.05, .5, .4, o); box(.75, .08, .55, tm, -.1, .42, .78, o); box(.08, .38, .55, tm, -.1, .5, .78, o); box(.66, .06, .48, '#c8553d', -.1, .5, .78, o);
    trike.wheels = wheelsOf(g); trike.roll = s => { for (const m of trike.wheels) m.rotation.z -= s / .27; };
    trike.rider = npc({ age: 'adult', topStyle: 'tank', shirt: '#fff6ea', bottom: 'longyi', hat: 'bucket' }); rideOn(g, trike.rider); people.push(trike.rider);
    g.position.set(-2.2, .03, 1.0); g.rotation.y = -Math.PI / 2; // waits on the verge by the side lane (clear of the old car)
  }
  const fare = npc({ age: 'adult', hair: 'bun', topStyle: 'yinphone', bottom: 'htamein', flower: true }); fare.ch.hang = basket(fare); people.push(fare); show(fare, false);
  const TRIKE_OUT = [[-2.2, 5.0], [-2.6, 8.3], [12.0, 8.3], [12.6, 10.6], [12.6, 12.3]], TRIKE_BACK = [[13.4, 11.6], [13.4, 9.9], [12.4, 6.85], [-2.0, 6.85], [-2.2, 5.0], [-2.2, 1.0]];
  async function trishawRun() {
    for (;;) {
      await wait(6 + rnd() * 8); await until(() => !isNight()); // parked for the night
      const fetch = !fare.g.visible && (morning() || rnd() < .4);
      if (fetch) { // she walks out of the flats, climbs into the sidecar
        fare.g.position.set(-1.2, 0, -3.0); show(fare, true); await walk(fare, [[-3.0, -2.4], [-3.0, .4], [-2.6, .9]]);
        trike.g.add(fare.g); fare.g.position.set(-.15, .5 - .24, .78); fare.g.rotation.y = Math.PI; fare.anim.setLoop('sit'); fare.anim.play('sitdown');
      }
      await drive(trike, TRIKE_OUT);
      if (fetch) { // off at the market lane; she goes shopping and walks home
        scene.add(fare.g); fare.g.position.set(12.0, ground(12, 12.3), 12.3); fare.anim.setLoop('idle'); fare.anim.play('standup'); await wait(.6);
        shopper(fare, 0);
      }
      await drive(trike, TRIKE_BACK);
    }
  }
  trishawRun();

  // ---------- morning: shoppers with baskets, old people taking food to the monks ----------
  function basket(c) { // a woven basket hanging from the left hand
    const g = new THREE.Group(); c.g.add(g); const o = { parent: g };
    cyl(.15, .12, .18, '#b8925a', 0, -.28, 0, 10, o); mesh(new THREE.TorusGeometry(.13, .012, 4, 12, Math.PI), '#8a6a3a', 0, -.1, 0, o);
    for (let i = 0; i < 3; i++) mesh(new THREE.IcosahedronGeometry(.06, 0), pick([PAL.leaf, '#e0574f', '#f2c14e']), -.06 + i * .06, -.1, 0, o);
    return g;
  }
  function shopBag(c) { const g = new THREE.Group(); c.g.add(g); box(.24, .26, .1, '#e9e1d2', 0, -.32, 0, { parent: g }); mesh(new THREE.TorusGeometry(.08, .01, 4, 10, Math.PI), '#e9e1d2', 0, -.16, 0, { parent: g }); return g; }
  function tray(c) { // a lacquer tray: rice bowl, curry pots, a bunch of flowers — food for the monks
    const g = new THREE.Group(); c.g.add(g); g.position.set(0, .86, .34); const o = { parent: g };
    cyl(.24, .2, .04, '#8a3a2a', 0, 0, 0, 14, o); cyl(.09, .07, .1, '#fff6ea', -.08, .04, 0, 10, o); mesh(new THREE.SphereGeometry(.075, 8, 6, 0, 6.3, 0, 1.5), '#fffaf0', -.08, .14, 0, o);
    cyl(.05, .05, .07, '#c99a4a', .1, .04, -.07, 8, o); cyl(.05, .05, .07, '#c99a4a', .1, .04, .08, 8, o);
    for (let i = 0; i < 4; i++) mesh(new THREE.IcosahedronGeometry(.04, 0), PAL.padauk, .02 + (i % 2) * .05, .1 + (i >> 1) * .04, .02, o); return g;
  }
  const SIDEWALK = [[-3.2, 8.85], [.2, 8.85], [.6, 9.45], [5.0, 9.45], [5.6, 9.1], [6.2, 9.45], [12.2, 9.45]]; // the south pavement: past the kids' drum on the road edge, round the padauk tree
  const HOME = [[-1.2, -3.0], [-3.0, -2.4], [-3.6, -2.4], [-3.6, 2.5], [-3.05, 2.8], [-3.05, 5.9], [-3.1, 6.3]], /* round the old car */ TO_MARKET = [...SIDEWALK, [12.6, 10.4], [12.6, 13.7]];
  const LANE_X = [-6.9, -4.3, -1.7, .9, 3.5, 6.1, 8.7];
  async function shopper(c, laneI = rnd() < .5 ? 0 : 1) {
    const lz = laneI ? 20.3 : 13.7;
    if (laneI) await walk(c, [[12.6, 20.3]]);
    for (const x of [...LANE_X].sort(() => rnd() - .5).slice(0, 2 + (rnd() * 2 | 0)).sort((a, b) => b - a)) {
      const side = rnd() < .5 ? -1 : 1; await walk(c, [[x, lz], [x, lz + side * .45]]); c.g.rotation.y = side < 0 ? Math.PI : 0;
      c.anim.setLoop('squat'); await wait(2 + rnd() * 3); c.anim.setLoop('idle'); if (rnd() < .4) c.anim.play('laugh');
      await wait(.6);
    }
    await walk(c, [[11.6, lz], [12.6, lz], ...back(TO_MARKET).slice(laneI ? 0 : 1), ...back(HOME)]); show(c, false);
  }
  async function marketGoer(c, delay) {
    for (;;) {
      show(c, false); await wait(delay + rnd() * 12); await until(() => morning() || (!isNight() && rnd() < .002));
      c.g.position.set(...[HOME[0][0] + rnd() * 6, 0, HOME[0][1]]); show(c, true);
      await walk(c, [...HOME.slice(1), ...TO_MARKET]); await shopper(c); delay = 6;
    }
  }
  [{ hair: 'bun', topStyle: 'yinphone', bottom: 'htamein' }, { age: 'elder', hair: 'bun', bottom: 'htamein' }, { hair: 'long', topStyle: 'tee', bottom: 'skirt' }]
    .forEach((o, i) => { const c = npc({ age: 'adult', ...o }); c.ch.hang = basket(c); people.push(c); marketGoer(c, i * 7); });
  // offerings to the kyaung: trays held out in front, in at the gate, three bows to the abbot, home again
  const TO_KYAUNG = [...SIDEWALK, [12.8, 10.4], [12.8, 15.6], [14.4, 15.6], [15.8, 15.6], [17.3, 15.8], [17.4, 18.6]];
  async function pilgrim(c, i) {
    show(c, false); await wait(4 + i * 3); await until(morning);
    c.g.position.set(-1.2 - i * .5, 0, -3.0); show(c, true);
    await walk(c, [...HOME.slice(1), ...TO_KYAUNG, [20.2 + i * .7, 19.7]], 'carry');
    c.g.rotation.y = Math.PI; for (let k = 0; k < 3; k++) { c.anim.play('kadaw'); await wait(2.7); }
    c.tray.visible = false; c.dry = false; c.anim.chat = 'listen'; await wait(8 + rnd() * 6); c.anim.chat = null;
    await walk(c, [[17.4, 18.6], ...back(TO_KYAUNG).slice(1), ...back(HOME)]); show(c, false);
  }
  [{ age: 'elder', hair: 'bun', topStyle: 'yinphone', bottom: 'htamein', flower: true }, { age: 'elder', topStyle: 'taikpon', bottom: 'longyi', hat: 'none' }]
    .forEach((o, i) => { const c = npc(o); c.tray = tray(c); c.dry = true; people.push(c); pilgrim(c, i); }); // nobody splashes someone carrying food for the monks

  // ---------- ② push cart on the market street: ice lollies, the little bell ----------
  const lolly = npc({ age: 'adult', topStyle: 'tank', bottom: 'longyi', hat: 'bucket', x: 12.9, z: 10.4 }); people.push(lolly);
  const icecart = group(); {
    const o = { parent: icecart }; box(.9, .55, .6, '#4fb3d9', 0, .3, 0, o); box(.95, .06, .65, '#fff6ea', 0, .86, 0, o); for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(.18, .03, 6, 12), '#2b2730', 0, .2, s * .32, o);
    mesh(new THREE.PlaneGeometry(.8, .3), new THREE.MeshLambertMaterial({ map: textTex('ရေခဲချောင်း', '#4fb3d9', '#fff6ea', 256, 96, 48) }), 0, .6, .31, { ...o, cast: false });
    cyl(.015, .015, 1.1, '#8f8794', -.35, .86, 0, 4, o); mesh(new THREE.CylinderGeometry(.02, .6, .25, 8, 1, true), new THREE.MeshLambertMaterial({ color: '#f48fb1', side: THREE.DoubleSide }), -.35, 2.0, 0, o);
  }
  async function lollyRun() {
    for (let up = true; ; up = !up) {
      const z0 = up ? 10.4 : 25.2, z1 = up ? 25.2 : 10.4;
      for (let z = z0; up ? z < z1 : z > z1; z += up ? 3.7 : -3.7) {
        await walk(lolly, [[12.9, z + (up ? 3.7 : -3.7)]], 'push'); if (rnd() < .6) { say(lolly, 'ဒင် ဒင်~ ရေခဲချောင်း~', 2.2); W.onFx?.('icebell', lolly.g.position); await wait(2.6); }
      }
    }
  }
  lollyRun();

  // ---------- ② kids with a drum of water by the road: they get whoever comes past ----------
  const DRUM = V(-1.7, 9.45); cyl(.3, .3, .7, '#3f8fd0', DRUM.x, .14, DRUM.z, 12); mesh(new THREE.CircleGeometry(.27, 12), '#8fd3f0', DRUM.x, .85, DRUM.z, { cast: false }).rotation.x = -Math.PI / 2;
  W.solid(DRUM.x, DRUM.z, .6, .6);
  const roadKids = [npc({ age: 'kid', tool: 'bucket', hat: 'none', x: -2.5, z: 9.4, ry: Math.PI }), npc({ age: 'kid', tool: 'gun', hat: 'goggles', x: -.9, z: 9.4, ry: Math.PI })];
  roadKids.forEach(k => { k.home = k.g.position.clone(); k.coolT = 1 + rnd() * 2; k.dryT = 0; });
  function stepRoadKids(dt) {
    for (const k of roadKids) {
      if (!k.g.visible || (k.coolT -= dt) > 0 || k.anim.one) continue;
      const range = k.ch.tool === 'gun' ? 4.5 : 1.9, kp = k.g.position;
      let best = null, bd = range;
      const consider = (g, pos) => { const d = Math.hypot(pos.x - kp.x, pos.z - kp.z); if (d < bd && d > .5) { bd = d; best = pos; } };
      consider(W.player.g, W.player.g.position);
      for (const c of people) if (c.g.visible && !c.dry && !roadKids.includes(c)) consider(c.g, c.g.getWorldPosition(v3).clone());
      if (best) { k.g.rotation.y = Math.atan2(best.x - kp.x, best.z - kp.z); k.anim.play('splash'); k.coolT = k.ch.tool === 'gun' ? 1.6 : 2.6; if (rnd() < .5) setTimeout(() => k.anim.emote('haha', 1.2), 700); }
      else if (k.ch.tool === 'bucket' && k.anim.loop !== 'squat' && rnd() < .3) { k.g.rotation.y = Math.atan2(DRUM.x - kp.x, DRUM.z - kp.z); k.anim.setLoop('squat'); k.coolT = 1.5; setTimeout(() => k.anim.setLoop('idle'), 1400); } // fill up again
      else k.coolT = .5;
    }
  }
  const v3 = new THREE.Vector3();

  // ---------- chinlone (ခြင်းလုံး) in the lot behind the shops: only once the day cools ----------
  const CL = L.FIELD, ring = [0, 1, 2, 3].map(i => { const a = i / 4 * Math.PI * 2 + .4; return npc({ age: i === 3 ? 'kid' : 'adult', bottom: i % 2 ? 'longyi' : 'shorts', topStyle: pick(['tank', 'tee']), hat: 'none', x: CL.x + Math.sin(a) * 1.35, z: CL.z + Math.cos(a) * 1.35 }); });
  ring.forEach(c => { c.anim.setLoop('ready'); c.home = c.g.position.clone(); });
  const ball = W.keep(mesh(new THREE.IcosahedronGeometry(.13, 1), new THREE.MeshLambertMaterial({ color: '#d9b06a', wireframe: false }), CL.x, 1, CL.z));
  const CB = { from: 0, to: 1, t: 0, dur: 1, kicked: false };
  const footOf = c => v3.copy(c.g.position).setY(.35);
  function stepChinlone(dt) {
    const on = evening() && !isNight(); ring.forEach(c => show(c, on)); ball.visible = on; if (!on) return;
    CB.t += dt / CB.dur;
    const a = footOf(ring[CB.from]).clone(), b = footOf(ring[CB.to]).clone(), k = Math.min(1, CB.t), h = CB.from === CB.to ? .9 : 1.9;
    ball.position.lerpVectors(a, b, k); ball.position.y = .35 + Math.sin(k * Math.PI) * h; ball.rotation.x += dt * 9; ball.rotation.z += dt * 5;
    const R = ring[CB.to]; if (!CB.kicked && (1 - k) * CB.dur < .27) { CB.kicked = true; R.anim.play('kick'); }
    if (k >= 1) { // the receiver plays it on: often to someone else, sometimes keeps it up himself
      CB.from = CB.to; CB.to = rnd() < .3 ? CB.from : (CB.from + 1 + (rnd() * 3 | 0)) % 4; CB.dur = CB.from === CB.to ? .7 : .95 + rnd() * .3; CB.t = 0; CB.kicked = false;
    }
    for (const c of ring) { let d = Math.atan2(ball.position.x - c.g.position.x, ball.position.z - c.g.position.z) - c.g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); c.g.rotation.y += d * Math.min(1, dt * 4); }
  }

  let lastDay = true;
  // ---------- the frame ----------
  W.tick(dt => {
    for (let i = jobs.length - 1; i >= 0; i--) { const j = jobs[i]; if (j.f ? j.f() : (j.t -= dt) <= 0) { jobs.splice(i, 1); j.r(); } }
    for (const c of walkers) stepWalker(c, dt);
    for (const v of drivers) stepDriver(v, dt);
    for (const c of [...people, ...vendors, lolly, alighter]) {
      if (c.ty) { const t = c.ty; t.t += dt / t.k; c.g.position.y = t.from + (t.to - t.from) * Math.min(1, t.t * t.t * (3 - 2 * t.t)); if (t.t >= 1) c.ty = null; }
    }
    for (const c of [...people, ...vendors, lolly, ...CARS.map(v => v.who), trike.rider]) if (c.say?.visible && (c.sayT -= dt) < 0) c.say.visible = false;
    for (const v of [trike, ...CARS]) v.bellT = (v.bellT || 0) - dt;
    for (const k of knots) stepKnot(k, dt);
    for (const c of vendors) { // call out when someone's near
      if ((c.callT -= dt) > 0) continue; c.callT = 6 + rnd() * 9;
      const pp = W.player.g.position; if (Math.hypot(pp.x - c.g.position.x, pp.z - c.g.position.z) < 5 || rnd() < .3) { c.anim.play('call'); say(c, pick(CALLS), 2.2, 1.9); }
    }
    yardElders.ppl.forEach(c => show(c, morning() || phase() === 'day'));
    { const day = !isNight(); if (day !== lastDay) { lastDay = day; for (const c of [...vendors, ...dayOnly, ...marketKnot.ppl, ...roadKids, lolly]) show(c, day); icecart.visible = day; } }
    // the ice cart rides in front of its man
    { const p = lolly.g.position, ry = lolly.g.rotation.y; icecart.position.set(p.x + Math.sin(ry) * .8, ground(p.x, p.z) + .02, p.z + Math.cos(ry) * .8); icecart.rotation.y = ry - Math.PI / 2; }
    stepBus(dt); stepCars(dt); stepRoadKids(dt); stepChinlone(dt);
    shove(0, 0, bus.position.x, bus.position.z, BUS.len / 2, .75);
    for (const v of CARS) if (v.on) shove(0, 0, v.g.position.x, v.g.position.z, 1, .5);
  });
  people.push(...ring, ...roadKids, alighter);
  const vehicles = () => [...(BUS.away <= 0 ? [bus.position] : []), ...CARS.filter(v => v.on).map(v => v.g.position)]; // for the engine sound
  return { bus, BUS, knot, people, say, vehicles };
}
