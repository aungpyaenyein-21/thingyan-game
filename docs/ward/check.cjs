// T12 — the ward: clear, widen, near-lens fade (TASKS.md T12 ✅ list), headless Chromium (swiftshader, ~1 fps: everything waits on game time)
//   1. lane widths, measured from ground() (the walk heights RECTS make) — old (main before T12) / new
//   2. draw calls of the town at four spots (?q=off, people + pets hidden — they move about and swamp the count — one plain
//      renderer.render incl. the shadow pass) — before (main @ cf288db) / after
//   3. 3 extras put down round you, a scene starts → each one > 10 m off (or hidden there) within 3 s of game time
//   4. new game, 1-1 → 1-2 auto-played: no extra ever inside the quiet zones (the home lane, the east lane, the gathering spot) → docs/ward/1-2.jpg
//   5. a walk down the home lane, camera dist 6 and 11 × az 0 / 90 / 180 / 270 → docs/ward/lane-d{6,11}-az{0,90,180,270}.jpg,
//      + the dist-6 views with the fade off (…-nofade.jpg) to compare; console errors 0
// run: (cd the repo) python3 -m http.server 8798 &  node docs/ward/check.cjs   (ONLY=widths,calls,clear,quiet,lane,tuned to run some;
//      tuned: two lane views with the fade pushed out to nearIn 3 / nearOut 5, for comparing)
const { chromium } = require('playwright');
const path = require('path');
const OUT = __dirname, URL = `http://localhost:${process.env.PORT || 8798}/yangon.html`, Q = '&debug&dt=0.1';
const errs = [], ONLY = process.env.ONLY?.split(','), want = k => !ONLY || ONLY.includes(k);
const log = (...a) => console.log(...a);
// measured the same way on main before T12 (cf288db): widths by ground(), draw calls with the hero at the same spots (the door: HOME_OUT)
const OLD = { widths: { back: 2.0, side: 2.0, east: 1.6 }, calls: { 'home lane (door)': 404, lot: 464, street: 505, market: 432 }, meshes: 351 };

(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 640, height: 400 } });
  async function open(q) {
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await p.goto(URL + '?' + q + Q); await p.waitForFunction(() => window.zone, null, { timeout: 180000 });
    await p.evaluate(() => { zone.fast = true; window.gwait = async s => { const t0 = zone.W.time(); while (zone.W.time() < t0 + s) await new Promise(r => setTimeout(r, 100)); }; });
    return p;
  }
  const shot = (p, name) => p.screenshot({ path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 72, timeout: 180000 });

  // ---------- 1 + 2. widths, draw calls ----------
  if (want('widths') || want('calls')) {
    const p = await open('new&q=off&day=1&step=1-3');
    const r = await p.evaluate(async () => {
      const W = zone.W, g = W.ground, span = (f, a, b) => { let lo = null, hi = null; for (let t = a; t <= b; t += .01) if (Math.abs(f(t) - .05) < 1e-6) { lo ??= t; hi = t; } return +(hi - lo + .01).toFixed(2); };
      const widths = { back: span(z => g(4, z), -8, 0), side: span(x => g(x, 2), -9, 0), east: span(x => g(x, -6), 6, 14) };
      const calls = {}, door = zone.SPOTS[0].at(), meshes = W.scene.children.filter(m => m.isMesh).length;
      for (const [k, x, z] of [['home lane (door)', door.x, door.z], ['lot', 2.6, 1.9], ['street', 10, 9.4], ['market', 0, 20]]) {
        zone.hero.g.position.set(x, W.ground(x, z), z); W.snapCam(); await gwait(.6); for (const c of [...W.chars, ...W.pets]) c.g.visible = false;
        const info = W.renderer.info; info.autoReset = false; info.reset(); W.renderer.render(W.scene, W.cam); calls[k] = info.render.calls; info.autoReset = true;
      }
      const near = W.scene.children.filter(m => m.isMesh && m.material?.userData?.near).length;
      return { widths, calls, near, meshes, bounds: W.bounds };
    });
    log('1. lane widths (m), old → new:'); for (const k in r.widths) log(`   ${k.padEnd(5)} ${OLD.widths[k].toFixed(1)} → ${r.widths[k].toFixed(1)}  (×${(r.widths[k] / OLD.widths[k]).toFixed(2)})`);
    log('   bounds', JSON.stringify(r.bounds));
    log('2. draw calls (one render incl. shadows, q=off), before → after:'); for (const k in r.calls) log(`   ${k.padEnd(17)} ${OLD.calls[k]} → ${r.calls[k]}  (${r.calls[k] - OLD.calls[k] >= 0 ? '+' : ''}${r.calls[k] - OLD.calls[k]})`);
    log(`   meshes in the scene after bake: ${OLD.meshes} → ${r.meshes} (${r.near} of them near-fade furniture)`);
    await p.close();
  }

  // ---------- 3. a scene clears the stage ----------
  if (want('clear')) {
    log('3. clearFor: 3 extras round you, a scene starts');
    const p = await open('new&day=1&step=1-5');
    await p.waitForFunction(() => !zone.story.playing && !zone.hud.busy(), null, { timeout: 180000 });
    const r = await p.evaluate(async () => {
      const W = zone.W, at = new W.THREE.Vector3(2.6, 0, 1.9); zone.hero.g.position.set(at.x, W.ground(at.x, at.z), at.z); W.snapCam(); zone.fast = false;
      const ex = W.chars.filter(c => c.extra && c.g.parent === W.scene && !c.ch.hang && !c.tray).slice(0, 3); // three free walkers
      [[1.6, .4], [-2.2, 1.2], [.6, -2.6]].forEach(([dx, dz], i) => { const c = ex[i]; c.g.position.set(at.x + dx, .01, at.z + dz); c.g.visible = true; });
      await gwait(.3);
      const d = c => Math.hypot(c.g.position.x - at.x, c.g.position.z - at.z), t0 = W.time(), track = [];
      const before = ex.map(c => +d(c).toFixed(1));
      zone.story.play('1-5', 'wet'); // Ko Zaw's line — any story.play clears
      let all = null;
      while (W.time() < t0 + 6) { await gwait(.25); const ds = ex.map(d); track.push([+(W.time() - t0).toFixed(1), ...ds.map(x => +x.toFixed(1))]); if (all === null && ds.every(x => x > 10)) all = +(W.time() - t0).toFixed(2); }
      return { before, all, end: ex.map(c => ({ d: +d(c).toFixed(1), vis: c.g.visible })), track: track.filter((_, i) => i % 3 === 0), cleared: zone.life.cleared() };
    });
    log('   start distances', r.before.join(' / '), 'm → all > 10 m after', r.all, 's of game time', r.all !== null && r.all <= 3 ? '✓' : '✗');
    log('   track [t, d1, d2, d3]:', JSON.stringify(r.track));
    log('   end', JSON.stringify(r.end), '· clear', JSON.stringify({ n: r.cleared?.n, popped: r.cleared?.popped, away: r.cleared?.away }));
    await p.close();
  }

  // ---------- 4. no extras in the quiet zones during 1-1 / 1-2 ----------
  if (want('quiet')) {
    log('4. new game, 1-1 → 1-2: extras in the quiet zones');
    const p = await open('new');
    const st = () => p.evaluate(() => ({ step: zone.S().step, playing: zone.story.playing, busy: zone.hud.busy(), t: zone.W.time() }));
    const probe = () => p.evaluate(() => { const v = new zone.W.THREE.Vector3(), bad = [];
      let n = 0; for (const c of zone.W.chars) { if (!c.extra || !c.g.parent) continue; let on = true; for (let q = c.g; on && q; q = q.parent) on = q.visible; if (!on) continue;
        n++; c.g.getWorldPosition(v); if (zone.life.inQuiet(v.x, v.z)) bad.push([+v.x.toFixed(1), +v.z.toFixed(1)]); } return { n, bad }; });
    let samples = 0, worst = [], shot12 = false, seen = 0; const t0 = Date.now();
    for (;;) {
      const s = await st(); if (s.step !== '1-1' && s.step !== '1-2') break;
      const q = await probe(); samples++; seen = Math.max(seen, q.n); if (q.bad.length) worst.push({ step: s.step, t: +s.t.toFixed(1), at: q.bad });
      if (s.step === '1-2' && s.playing && !shot12) { const lines = await p.evaluate(() => zone.story.lines()); if (lines >= 2) { shot12 = true; await shot(p, '1-2'); } }
      if (!s.playing && !s.busy) await p.evaluate(() => zone.next());
      if (Date.now() - t0 > 900000) { log('   timeout'); break; }
      await p.waitForTimeout(800);
    }
    log(`   ${samples} samples, up to ${seen} extras on view at once · inside a quiet zone: ${worst.length ? JSON.stringify(worst.slice(0, 5)) : 'none ✓'} · 1-2.jpg ${shot12 ? 'saved' : 'missed'}`);
    await p.close();
  }

  // ---------- 5. the home lane, near the lens ----------
  // for each camera angle you stand where a piece of street furniture is between the lens and you (a pole, the padauk), along
  // the home lane and the east lane off it; the dist-6 views are shot again with the fade off (…-nofade) to compare
  if (want('lane') || want('tuned')) {
    log('5. the home lane at dist 6 / 11 × az 0 / 90 / 180 / 270');
    const p = await open('new&day=1&step=1-3');
    await p.waitForFunction(() => !zone.story.playing && !zone.hud.busy(), null, { timeout: 180000 });
    const view = (x, z, dist, az) => p.evaluate(async ([x, z, dist, az]) => { const W = zone.W; zone.hero.g.position.set(x, W.ground(x, z), z); zone.hero.g.rotation.y = az + Math.PI;
      W.orbit.tune.base = dist; W.orbit.state.azGoal = az; W.snapCam(); await gwait(1.2); const c = W.cam.position;
      return { cam: [+c.x.toFixed(2), +c.y.toFixed(2), +c.z.toFixed(2)], dist: +c.distanceTo(zone.hero.g.position).toFixed(2) }; }, [x, z, dist, az]);
    const fade = on => p.evaluate(on => { zone.W.near.uNearIn.value = on ? 1.5 : 0; zone.W.near.uNearOut.value = on ? 3 : 0; }, on);
    const lz = await p.evaluate(() => zone.SPOTS[0].at().z + .1); // the home lane's flats edge (HOME_OUT is at the door)
    // az 0: the east lane, the padauk at its mouth towards the lens · 90: the pole by the home (p3) · 180: the transformer pole + the padauk by flats A · 270: the corner pole (p1)
    const SPOT = { 0: [9.8, -5.8], 90: [2.1, lz], 180: [1.9, -2.4], 270: [0.0, lz] };
    if (want('lane')) for (const dist of [6, 11]) for (const deg of [0, 90, 180, 270]) {
      const [x, z] = SPOT[deg], r = await view(x, z, dist, deg * Math.PI / 180); await shot(p, `lane-d${dist}-az${deg}`);
      log(`   dist ${dist} az ${deg}: you at (${x.toFixed(1)}, ${z.toFixed(2)}), camera ${JSON.stringify(r.cam)}, ${r.dist} m from you${r.dist < dist - .3 ? ' (pulled in off a wall)' : ''}`);
      if (dist === 6) { await fade(false); await p.evaluate(() => gwait(.3)); await shot(p, `lane-d${dist}-az${deg}-nofade`); await fade(true); }
    }
    if (want('tuned')) for (const deg of [0, 180]) { // for tuning: the same view with the fade pushed out (nearIn 3 / nearOut 5 instead of 1.5 / 3)
      const [x, z] = SPOT[deg]; await view(x, z, 6, deg * Math.PI / 180);
      await p.evaluate(() => { zone.W.near.uNearIn.value = 3; zone.W.near.uNearOut.value = 5; }); await p.evaluate(() => gwait(.3)); await shot(p, `lane-d6-az${deg}-in3-out5`); await fade(true);
    }
    await p.close();
  }
  log('console errors:', errs.length, errs.slice(0, 5));
  await b.close();
})().catch(e => { console.error('FAILED', e.message); console.log('console errors:', errs); process.exit(1); });
