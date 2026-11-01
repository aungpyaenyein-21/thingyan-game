// yangon/ai.js — the kids' heads in a water fight (T3 · TASKS.md T3 §F). Yuka does the legs, a small state machine the heads.
//   legs:  grid A* over the lot/alleys (our own — T1 review #3) → waypoints ≥ 1 m apart → Yuka FollowPath
//          + ObstacleAvoidance (drums, wall stubs, taps; weak near a waypoint so the two don't fight) + Separation (no bunching)
//   heads: Yuka StateMachine per kid — advance · hold · flank · ambush · lob · hide · supply · refill · rest · out
//          the role picks the fighting state; the gang's stance (war.js teams(): attack / defend) bends it
//   roles: ① ငဇွဲ advance · မေသူ lob (balloons from the back) · ဖိုးကျော် supply (carries water to whoever's dry) · ချိုချို hide
//          ④ သူရ ambush (waits on a real corner, goes for the face) · the rest advance / flank / hold / lob
// war.js keeps the rules of the match (hits, OUT, taps, rounds) and hands us what we need in `G`.
import { EntityManager, Vehicle, GameEntity, FollowPathBehavior, ObstacleAvoidanceBehavior, SeparationBehavior, Path, Vector3 as YV, State, StateMachine } from 'yuka';

export const ROLES = {
  A: [null, ['ငဇွဲ', 'advance'], ['မေသူ', 'lob'], ['ဖိုးကျော်', 'supply'], ['ချိုချို', 'hide'], ['', 'flank']], // i = 0 is you
  B: [['သူရ', 'ambush'], ['', 'advance'], ['', 'lob'], ['', 'flank'], ['', 'hold'], ['', 'advance']],
};

// ---------- the grid: half-metre cells, A* with no corner cutting ----------
export function createGrid(B, free, cell = .5) {
  const nx = Math.ceil((B.x1 - B.x0) / cell), nz = Math.ceil((B.z1 - B.z0) / cell), open = new Uint8Array(nx * nz);
  const cx = x => Math.max(0, Math.min(nx - 1, Math.floor((x - B.x0) / cell))), cz = z => Math.max(0, Math.min(nz - 1, Math.floor((z - B.z0) / cell)));
  const wx = i => B.x0 + (i + .5) * cell, wz = j => B.z0 + (j + .5) * cell;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) open[j * nx + i] = free(wx(i), wz(j)) ? 1 : 0;
  const ok = (i, j) => i >= 0 && j >= 0 && i < nx && j < nz && open[j * nx + i] === 1;
  function nearestOpen(i, j) { if (ok(i, j)) return [i, j]; for (let r = 1; r < 8; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) if (Math.max(Math.abs(di), Math.abs(dj)) === r && ok(i + di, j + dj)) return [i + di, j + dj]; return null; }
  const lineFree = (ax, az, bx, bz) => { const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / (cell * .5))); for (let k = 1; k <= n; k++) { const t = k / n; if (!ok(cx(ax + (bx - ax) * t), cz(az + (bz - az) * t))) return false; } return true; };
  const g = new Float32Array(nx * nz), from = new Int32Array(nx * nz), closed = new Uint8Array(nx * nz), heap = [];
  const D = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  function find(ax, az, bx, bz) { // → [[x, z], …] from (a) to (b), string-pulled, waypoints ≥ 1 m apart; null if there's no way
    const s = nearestOpen(cx(ax), cz(az)), e = nearestOpen(cx(bx), cz(bz)); if (!s || !e) return null;
    const S = s[1] * nx + s[0], E = e[1] * nx + e[0];
    g.fill(1e9); from.fill(-1); closed.fill(0); heap.length = 0; g[S] = 0;
    const h = c => { const dx = Math.abs(c % nx - e[0]), dz = Math.abs((c / nx | 0) - e[1]); return Math.max(dx, dz) + .414 * Math.min(dx, dz); };
    const push = (c, f) => { heap.push([f, c]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top[1]; };
    push(S, h(S)); let found = false, n = 0;
    while (heap.length && n++ < 6000) {
      const c = pop(); if (closed[c]) continue; closed[c] = 1; if (c === E) { found = true; break; }
      const i = c % nx, j = c / nx | 0;
      for (const [di, dj, w] of D) { const a = i + di, b = j + dj; if (!ok(a, b) || (di && dj && (!ok(i + di, j) || !ok(i, j + dj)))) continue;
        const d = b * nx + a, ng = g[c] + w; if (ng < g[d]) { g[d] = ng; from[d] = c; push(d, ng + h(d)); } }
    }
    if (!found) return null;
    const cells = []; for (let c = E; c !== -1; c = from[c]) cells.push([wx(c % nx), wz(c / nx | 0)]); cells.reverse(); cells[cells.length - 1] = [bx, bz];
    const out = []; let cur = [ax, az], k = 0; // string-pull: from where we are, jump to the furthest cell we can walk straight to
    while (k < cells.length - 1) { let far = k + 1; for (let m = cells.length - 1; m > k + 1; m--) if (lineFree(cur[0], cur[1], cells[m][0], cells[m][1])) { far = m; break; } out.push(cells[far]); cur = cells[far]; k = far; }
    if (!out.length) out.push([bx, bz]);
    const spaced = []; let last = [ax, az]; // waypoints at least 1 m apart (Fable: so FollowPath and avoidance don't fight); always keep the goal
    out.forEach((p, i) => { if (i === out.length - 1 || Math.hypot(p[0] - last[0], p[1] - last[1]) >= 1) { spaced.push(p); last = p; } });
    return spaced;
  }
  // a real corner: an open cell with something solid right beside it, between it and `toward` (± x)
  function corners(toward) { const out = []; for (let j = 1; j < nz - 1; j++) for (let i = 1; i < nx - 1; i++) if (ok(i, j) && !ok(i + toward, j) && ok(i, j - 1) && ok(i, j + 1)) out.push([wx(i), wz(j)]); return out; }
  const snap = (x, z) => { const c = nearestOpen(cx(x), cz(z)); return !c || ok(cx(x), cz(z)) ? [x, z] : [wx(c[0]), wz(c[1])]; }; // a goal inside a drum / tap / wall → the nearest open cell
  return { find, lineFree, corners, snap, ok: (x, z) => ok(cx(x), cz(z)), nx, nz, cell };
}

// ---------- the heads ----------
// G (from war.js): kids, me, pos, side(team), stance(team), lane(k), rest(team), enemies(k), nearest(k, list), clear(a, b),
//   pickRefill(k), fillAt(k, r, dt), atRest(k), shootAt(k, dt), weapons, CAN, rnd, B, free(x, z), obstacles [{ x, z, r }], auto
export function createAI(G) {
  const grid = createGrid(G.B, G.free), em = new EntityManager(), obstacles = G.obstacles.map(o => { const e = new GameEntity(); e.position.set(o.x, 0, o.z); e.boundingRadius = o.r; return e; });
  const pos = G.pos, R = G.rnd;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const STATS = { paths: 0, noPath: 0, stuck: 0, maxStuck: 0 };

  // the legs: go to (x, z) — a new A* path only when the goal has moved a metre or the old one is done
  function goTo(k, x, z, run = true) {
    const a = k.ai, p = pos(k);
    a.run = run; a.want = true; [x, z] = grid.snap(x, z); // never aim for a point inside something solid (Cho Cho behind a mate by the tap)
    if (a.goal && Math.hypot(a.goal[0] - x, a.goal[1] - z) < 1 && a.pathT > 0 && !a.path.finished()) return;
    if (dist(p, { x, z }) < .3) { stop(k); return; }
    a.goal = [x, z]; a.pathT = 1.2;
    const w = grid.find(p.x, p.z, x, z); STATS.paths++;
    a.path.clear(); if (!w) { STATS.noPath++; a.path.add(new YV(x, 0, z)); } else for (const [wx, wz] of w) a.path.add(new YV(wx, 0, wz));
    a.follow.active = true;
  }
  function stop(k) { const a = k.ai; a.want = false; a.follow.active = false; a.v.velocity.set(0, 0, 0); }
  const face = (k, t) => { const p = pos(k), q = pos(t); k.c.g.rotation.y = Math.atan2(q.x - p.x, q.z - p.z); };

  // where to stand against one kid: close in, back off, or step sideways (from the old war.js engage())
  function engage(k, t) {
    const p = pos(k), tp = pos(t), d = dist(p, tp);
    if ((k.sideT -= .4) < 0) { k.sideT = 2 + R() * 3; k.side = R() < .5 ? -1 : 1; }
    if (d > 5 || !G.clear(p, tp)) return [tp.x, tp.z, d > 8];
    if (d < 2.8) return [p.x - (tp.x - p.x) * .6, p.z - (tp.z - p.z) * .6, false];
    const a = Math.atan2(tp.x - p.x, tp.z - p.z) + k.side * Math.PI / 2; return [p.x + Math.sin(a) * 2, p.z + Math.cos(a) * 2, false];
  }
  const nearestFoe = k => G.nearest(k, G.enemies(k));

  // ---------- states ----------
  const S = {};
  const state = (name, o) => { const s = new State(); s.name = name; s.enter = o.enter ?? (() => {}); s.execute = o.execute; s.exit = o.exit ?? (() => {}); S[name] = s; };
  // fighting states (the role's choice, bent by the stance)
  state('advance', { execute(v) { const k = v.kid, s = G.side(k.team), [t, d] = nearestFoe(k); k.target = t;
    if (t && d < 5.5 && G.clear(pos(k), pos(t))) { const [x, z] = engage(k, t); goTo(k, x - s * 1.2, z, false); }
    else goTo(k, -s * (G.alley ? 8.5 : 7.5), G.lane(k), Math.abs(pos(k).x + s * 7.5) > 4); } });
  state('hold', { execute(v) { const k = v.kid, s = G.side(k.team), foes = G.enemies(k).filter(o => pos(o).x * s > (G.alley ? 2 : -1.5)); const [t, d] = G.nearest(k, foes);
    if (t && d < 7) { k.target = t; const [x, z, run] = engage(k, t); goTo(k, x, z, run); } else { k.target = nearestFoe(k)[0]; goTo(k, s * (G.alley ? 8.5 : 5.2), G.lane(k), Math.abs(pos(k).x - s * 5.2) > 4); } } });
  state('flank', { execute(v) { const k = v.kid, s = G.side(k.team), [t, d] = nearestFoe(k); k.target = t; const edge = Math.sign(G.lane(k) || (k.i % 2 ? 1 : -1)) * (G.B.z1 - 1.4);
    if (t && d < 4.5 && G.clear(pos(k), pos(t))) { const [x, z] = engage(k, t); goTo(k, x, z, false); }
    else if (pos(k).x * s > -2) goTo(k, -s * 2.5, edge, true); else goTo(k, -s * (G.alley ? 12 : 9.5), edge * .6, true); } });
  state('ambush', { // a real corner, facing where they'll come from; out for the face when they're close
    enter(v) { v.kid.ai.spot = pickCorner(v.kid); v.kid.ai.spotT = 14 + R() * 6; },
    execute(v) { const k = v.kid, a = k.ai, [t, d] = nearestFoe(k); k.target = t; k.faceAim = true;
      if ((a.spotT -= .4) < 0 || (k.hitT < .5 && d < 3)) { a.spot = pickCorner(k); a.spotT = 14 + R() * 6; }
      if (t && d < 3.2) { const [x, z] = engage(k, t); goTo(k, x, z, false); return; }
      if (a.spot && dist(pos(k), { x: a.spot[0], z: a.spot[1] }) > .4) goTo(k, a.spot[0], a.spot[1], true); else { stop(k); if (t) face(k, t); } } });
  state('lob', { // from the back of the gang: balloons over the walls
    execute(v) { const k = v.kid, s = G.side(k.team), [t, d] = nearestFoe(k); k.target = t; const mates = G.kids.filter(o => o.team === k.team && !o.out && o !== k);
      const front = mates.length ? Math.min(...mates.map(o => pos(o).x * s)) : s * 5; // the front line, in our own x
      if (t && d < 2.5) { const [x, z] = engage(k, t); goTo(k, x, z, false); return; }
      goTo(k, s * Math.min(G.alley ? 15 : 11, front + 3), G.lane(k), false); } });
  state('hide', { // behind a mate, away from the trouble; shoots only up close
    execute(v) { const k = v.kid, s = G.side(k.team), [t, d] = nearestFoe(k); k.target = t;
      const mate = G.nearest(k, G.kids.filter(o => o.team === k.team && !o.out && o !== k && !o.me))[0] ?? G.me;
      if (t && d < 3) { const [x, z] = engage(k, t); goTo(k, x, z, false); return; }
      const m = pos(mate), away = t ? Math.atan2(m.x - pos(t).x, m.z - pos(t).z) : Math.atan2(s, 0); goTo(k, m.x + Math.sin(away) * 1.3, m.z + Math.cos(away) * 1.3, d < 6); } });
  state('supply', { // carries water to whoever's running dry (on foot until the bike rack — T4)
    execute(v) { const k = v.kid, [t, d] = nearestFoe(k); k.target = t;
      const dry = G.kids.filter(o => o.team === k.team && !o.out && o !== k && o.water < G.CAN * .3).sort((a, b) => a.water - b.water)[0];
      if (dry && k.water > G.CAN * .55) {
        if (dist(pos(k), pos(dry)) < 1.1) { const give = Math.min(k.water - G.CAN * .3, G.CAN - dry.water); k.water -= give; dry.water += give; k.ai.gave = (k.ai.gave ?? 0) + give; k.c.anim.play('pick'); G.onSupply?.(k, dry); }
        else goTo(k, pos(dry).x, pos(dry).z, true); return; }
      if (k.water < G.CAN * .9 && (!t || d > 5)) { v.sm.changeTo('refill'); return; }
      const s = G.side(k.team); if (t && d < 4) { const [x, z] = engage(k, t); goTo(k, x, z, false); } else goTo(k, s * 6.5, G.lane(k) * .5, false); } });
  // the needs
  state('refill', {
    enter(v) { v.kid.tap = null; v.kid.state = 'refill'; }, exit(v) { if (v.kid.state === 'refill') v.kid.state = 'fight'; },
    execute(v) { const k = v.kid, p = pos(k); if (!k.tap || (k.tap.user && k.tap.user !== k && R() < .3)) k.tap = G.pickRefill(k);
      const r = k.tap, dd = Math.hypot(r.x - p.x, r.z - p.z);
      if (dd < 1.15) { stop(k); if (!G.fillAt(k, r, 0)) k.waiting = true; }
      else if (r.user && r.user !== k && dd < 2.4) { stop(k); k.waiting = true; }
      else goTo(k, r.x + .9 * Math.sign(p.x - r.x || 1), r.z, true);
      if (k.water >= G.CAN - .05) { k.tap = null; back(v); } } });
  state('rest', { // a drink at the water-pot stand
    enter(v) { v.kid.state = 'rest'; }, exit(v) { if (v.kid.state === 'rest') v.kid.state = 'fight'; },
    execute(v) { const k = v.kid, Rs = G.rest(k.team); if (!G.atRest(k)) goTo(k, Rs.gx, Rs.z + (k.i - 2.5) * .35, true); else stop(k); if (k.grit >= .7) back(v); } });
  state('out', { // OUT: back to your own stand, nothing else
    execute(v) { const k = v.kid, Rs = G.rest(k.team); if (!G.atRest(k)) goTo(k, Rs.gx, Rs.z + (k.i - 2.5) * .35, true); else stop(k); if (!k.out) back(v); } });
  // which fighting state, now: the role, bent by the gang's stance
  function fight(k) {
    const st = G.stance(k.team), role = k.role;
    if (role === 'lob' || role === 'ambush' || role === 'supply' || role === 'hide') return role;
    if (st === 'defend') return 'hold';
    if (role === 'hold') return st === 'attack' && G.homeTeam !== k.team ? 'advance' : 'hold';
    return role;
  }
  const back = v => v.sm.changeTo(fight(v.kid));
  function pickCorner(k) { // a corner on the way the other gang comes, near our lane, in the middle third
    const s = G.side(k.team), list = grid.corners(-s).filter(([x]) => x * s > -6 && x * s < 6);
    let best = null, bs = 1e9; for (const c of list) { const sc = Math.abs(c[1] - G.lane(k)) + Math.abs(c[0] - s * 1.5) * .6 + R() * 2.5; if (sc < bs) { bs = sc; best = c; } }
    return best;
  }

  // ---------- one Yuka vehicle per kid ----------
  for (const k of G.kids) {
    if (k.me && !G.auto) continue;
    const [nm, role] = ROLES[k.team][k.i] ?? ['', 'advance']; k.role = role; if (nm) k.name = nm;
    if (role === 'lob') k.weapon = 'balloon';
    const v = new Vehicle(), p = pos(k); v.kid = k; v.position.set(p.x, 0, p.z); v.boundingRadius = .34; v.maxForce = 30; v.mass = 1;
    v.updateNeighborhood = true; v.neighborhoodRadius = 1.6;
    const path = new Path(), follow = new FollowPathBehavior(path, .6); follow.active = false; follow._arrive.deceleration = 1.5;
    const avoid = new ObstacleAvoidanceBehavior(obstacles); avoid.weight = 1.5; avoid.dBoxMinLength = 1.2;
    const sep = new SeparationBehavior(); sep.weight = 1.2;
    v.steering.add(follow); v.steering.add(avoid); v.steering.add(sep);
    const sm = new StateMachine(v); for (const s of Object.values(S)) sm.add(s.name, s); v.sm = sm;
    k.ai = { v, path, follow, avoid, sep, goal: null, pathT: 0, run: true, want: false, think: R() * .4, spot: null, spotT: 0, last: [p.x, p.z], stuckT: 0 };
    sm.currentState = null; sm.changeTo(fight(k)); em.add(v);
  }
  const mine = G.kids.filter(k => k.ai);

  function reset() { for (const k of mine) { const a = k.ai, p = pos(k); a.v.position.set(p.x, 0, p.z); a.v.velocity.set(0, 0, 0); a.path.clear(); a.follow.active = false; a.goal = null; a.v.sm.changeTo(fight(k)); } }

  function update(dt) {
    for (const k of mine) {
      const a = k.ai, v = a.v, sm = v.sm, p = pos(k);
      a.pathT -= dt; v.position.set(p.x, 0, p.z); // hits, the bucket's shove and walls move the kid outside Yuka: start from where they are
      // the needs come first: OUT → back · wiping → stand · dry → tap · worn out → the stand
      if ((a.think -= dt) <= 0) {
        a.think = .35 + R() * .15; k.waiting = false;
        const cur = sm.currentState?.name, [, near] = nearestFoe(k);
        if (k.out) { if (cur !== 'out') sm.changeTo('out'); }
        else if (cur === 'out') back(v);
        else if (k.state !== 'wipe' && cur !== 'refill' && cur !== 'rest') {
          const dry = k.weapon === 'balloon' ? k.water < G.weapons.balloon.cost * G.CAN + .2 : k.water < .7;
          if (dry) sm.changeTo('refill');
          else if (k.grit < .15 && near > 4) sm.changeTo('rest');
          else if (k.grit < .4 && near > 5 && R() < .15) { k.state = 'wipe'; k.wipeT = 1.2; k.c.anim.emote('drop'); }
          else if (fight(k) !== cur) back(v);
        }
        if (k.state !== 'wipe') sm.update();
      }
      if (k.state === 'wipe') { if ((k.wipeT -= dt) <= 0) { k.grit = Math.min(1, k.grit + .12); k.state = 'fight'; } stop(k); }
      if (sm.currentState?.name === 'refill' && k.tap && Math.hypot(k.tap.x - p.x, k.tap.z - p.z) < 1.15) G.fillAt(k, k.tap, dt);
      // the legs: Yuka steers, the kid's own walk/run speed caps it; a one-shot that stands you still (squirt, splash, throw) stops you
      const still = !!k.c.anim.one && k.c.anim.speed === 0;
      const run = a.run ? a.runSpeed ??= speedOf(k, 'run') : a.walkSpeed ??= speedOf(k, 'walk');
      v.maxSpeed = still || !a.want ? .001 : run;
      const wp = a.path._waypoints[a.path._index]; a.avoid.weight = wp && wp.squaredDistanceTo(v.position) < 1 ? .3 : 1.5; // near a waypoint: let the path lead
      if (still || !a.want) v.velocity.set(0, 0, 0);
      // stuck (a wall the grid didn't know, a kid in a doorway): a fresh path, then a step sideways
      const moved = Math.hypot(p.x - a.last[0], p.z - a.last[1]); a.last = [p.x, p.z];
      if (a.want && !still && moved < run * dt * .2) { a.stuckT += dt; if (a.stuckT > 1.2) { a.stuckT = 0; a.pathT = 0; a.goal = null; STATS.stuck++; v.position.x += (R() - .5) * .4; v.position.z += (R() - .5) * .4; } }
      else a.stuckT = Math.max(0, a.stuckT - dt);
      STATS.maxStuck = Math.max(STATS.maxStuck, a.stuckT);
    }
    em.update(dt);
    for (const k of mine) {
      const a = k.ai, v = a.v, p = pos(k), c = k.c;
      p.x = v.position.x; p.z = v.position.z; G.collide(p); v.position.set(p.x, 0, p.z);
      const sp = Math.hypot(v.velocity.x, v.velocity.z);
      if (sp > .15) { const want = Math.atan2(v.velocity.x, v.velocity.z); let d = want - c.g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); c.g.rotation.y += d * Math.min(1, dt * 10); }
      if (!c.anim.one) { const loop = sp > .15 ? (a.run && sp > (a.walkSpeed ?? 1) * 1.1 ? 'run' : 'walk') : 'idle'; if (c.anim.loop !== loop) c.anim.setLoop(loop); }
      if (!k.out && k.state !== 'wipe' && k.state !== 'rest' || (k.state === 'rest' && k.target && dist(pos(k.target), p) < 4 && k.water >= .4)) G.shootAt(k, dt);
    }
  }
  function speedOf(k, loop) { const an = k.c.anim, l = an.loop, one = an.one; an.loop = loop; an.one = null; const s = an.speed; an.loop = l; an.one = one; return s || 2; }
  return { update, reset, grid, STATS, kids: mine, state: k => k.ai?.v.sm.currentState?.name };
}
