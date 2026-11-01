// T5 — day 1 end to end (TASKS.md T5 ✅ list), headless Chromium (swiftshader, ~1–2 fps: everything waits on game time)
//   1. new game → auto-play 1-1 … 1-8 through the debug hooks (zone.next() = go where the goal points and press E) → the
//      「ရက် ၂ — မကြာခင်」 card; one screenshot per scene (docs/day1/1-1.jpg …); the night choice 「ရှိတယ်」
//   2. three throws at power 0 / .5 / 1 (?day=1&step=1-7) → all land on ④'s side of the fence
//   3. the other night choice 「…」 (?day=1&step=1-8) → red ears
//   4. reload mid-day (in 1-4) → carries on from the save
//   5. phone 375×667 screenshot · Mum's range (step out → called back, walked 2 m in) · console errors 0
// run: (cd the repo) python3 -m http.server 8793 &  node docs/day1/check.cjs   (ONLY=throws,night,m3,reload,phone,day to run some)
const { chromium } = require('playwright');
const path = require('path');
const OUT = __dirname, URL = 'http://localhost:8793/yangon.html', Q = '&debug&dt=0.1';
const errs = [], ONLY = process.env.ONLY?.split(','), want = k => !ONLY || ONLY.includes(k);
const log = (...a) => console.log(...a);

(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 640, height: 400 } });
  async function open(q, page) {
    const p = page ?? await ctx.newPage();
    if (!page) { p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text())); }
    await p.goto(URL + '?' + q + Q); await p.waitForFunction(() => window.zone, null, { timeout: 180000 });
    await p.evaluate(() => { zone.fast = true; });
    return p;
  }
  const state = p => p.evaluate(() => ({ step: zone.S().step, t: +zone.W.time().toFixed(1), playing: zone.story.playing, busy: zone.hud.busy(), menu: !document.getElementById('menu').hidden, mini: !!zone.mini()?.power, bulbs: !!zone.bulbs(), goal: document.getElementById('goal').hidden ? '' : document.getElementById('gtext').textContent, card: !document.getElementById('end').hidden }));
  const shot = (p, name) => p.screenshot({ path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 72 });
  // one beat of the auto-player: answer whatever is open, else go do what the goal points at
  async function beat(p, { power = .5, night = 0 } = {}) {
    const s = await state(p);
    if (s.bulbs) { const go = await p.evaluate(() => { const f = zone.bulbs(); if (f.autoing) return false; f.autoing = true; f.auto(); return true; }); return go ? 'bulbs: auto' : 'wait'; } // (auto() never resolves if a splash closes the puzzle: don't await it)
    if (s.mini) { await p.evaluate(x => zone.hud.release(x), power); return 'power ' + power; }
    if (s.menu) { await p.evaluate(i => document.querySelectorAll('#mlist button')[i].click(), night); return 'menu ' + night; }
    if (s.busy || s.playing) return 'wait';
    return await p.evaluate(() => zone.next()) ?? 'idle';
  }
  async function until(p, done, opts = {}, max = 900) {
    const t0 = Date.now();
    for (;;) {
      const s = await state(p); if (await done(s)) return s;
      if (Date.now() - t0 > max * 1000) throw new Error('timeout in ' + JSON.stringify(s));
      const did = await beat(p, opts); if (did !== 'wait' && did !== 'busy' && did !== 'idle') log('   ·', s.step, did);
      await p.waitForTimeout(did === 'wait' || did === 'busy' ? 700 : 1500);
    }
  }

  // ---------- 1. the whole day ----------
  if (want('day')) {
  log('1. new game → day 2 card');
  const p = await open('new');
  const T0 = await p.evaluate(() => zone.W.time()), w0 = Date.now(), seen = {}, goals = new Set();
  const per = {};
  await until(p, async s => {
    if (s.goal) goals.add(s.goal);
    if (!seen[s.step]) { seen[s.step] = true; per[s.step] = s.t; log(' scene', s.step, 'at game t', s.t); }
    // a screenshot per scene: while its lines play if we catch them, else once it's under way; the mandat once 1-6 has lifted it
    const key = 'shot' + s.step;
    if (!seen[key] && s.step !== 'done' && (s.playing || per[s.step] < s.t - 1)) { seen[key] = true; await shot(p, s.step); }
    if (s.step === '1-7' && !seen.mandat && !s.playing && !s.busy && await p.evaluate(() => zone.bowl.state === 'placed')) { // the mandat after 1-6: the floor + three parts, the bowl on its seat
      seen.mandat = true; await p.evaluate(() => zone.W.orbit.focus(zone.mandat.centre.clone().setY(1), { dist: 11, elev: .65, t: .3 })); await p.waitForTimeout(3500); await shot(p, 'mandat-day1'); await p.evaluate(() => zone.W.orbit.release()); }
    return s.card;
  }, { power: .5, night: 0 });
  await p.waitForTimeout(800); await shot(p, 'day2-card');
  const end = await p.evaluate(() => ({ card: document.getElementById('ehead').textContent, night: zone.S().night, parts: zone.S().parts, ears: zone.hero.ch.earsOn ?? null, t: zone.W.time(), throw: zone.lastThrow }));
  log(' card:', end.card, '| night:', JSON.stringify(end.night), '| parts:', end.parts.join(' '), '| goal lines seen:', [...goals].join(' / '));
  log(' game time', (end.t - T0).toFixed(0), 's (auto-play, dialogue fast) · wall', ((Date.now() - w0) / 1000).toFixed(0), 's');
  log(' throw at power .5:', JSON.stringify(end.throw));
  // the mandat from the lane, at night (the floor + three parts)
  await p.close();
  }

  // ---------- 2. three throws ----------
  if (want('throws')) {
  log('2. three throws');
  for (const pw of [0, .5, 1]) {
    const q = await open('new&day=1&step=1-7');
    let shotT = false;
    await until(q, async s => { if (pw === 1 && !shotT && await q.evaluate(() => zone.throwing())) { shotT = true; await shot(q, '1-7-throw'); } return s.step === '1-8'; }, { power: pw }, 600);
    const r = await q.evaluate(() => zone.lastThrow);
    log(`  power ${pw}: land ${JSON.stringify(r.land)} · over the fence by ${r.clear} m → ${r.land?.side4 ? '④ side ✓' : '✗'}`);
    await q.close();
  }
  }

  // ---------- 3. the other night choice ----------
  if (want('night')) {
  log('3. night: 「…」');
    const q = await open('new&day=1&step=1-8');
    let ears = null;
    await until(q, async s => { if (s.menu === false && ears === null && s.step === '1-8') { const e = await q.evaluate(() => zone.S().night[0]); if (e) { await q.waitForTimeout(1500); ears = await q.evaluate(() => zone.hero.ch.head.children.flatMap(k => k.children ?? []).some(m => m.isMesh && m.visible && m.material?.color?.getHexString() === 'ff3a3a')); await shot(q, '1-8-red-ears'); } } return s.card; }, { night: 1 }, 600);
    log('  answer:', JSON.stringify(await q.evaluate(() => zone.S().night)), '· red ears seen:', ears);
    await q.close();
  }

  // ---------- M3: a splash on the puzzle starts it over; the bucket held up keeps it off ----------
  if (want('m3')) {
  log('M3 shield');
    const q = await open('new&day=1&step=1-5');
    const idle = () => q.waitForFunction(() => !zone.hud.busy() && !zone.story.playing, null, { timeout: 300000 });
    await idle(); log('  E at the table →', await q.evaluate(() => zone.next()));
    await q.waitForFunction(() => zone.mission.wet > 0, null, { timeout: 300000 }); log('  splash → puzzle closed:', await q.evaluate(() => !zone.bulbs()), '· Ko Zaw:', await q.evaluate(() => document.getElementById('dtext').textContent));
    await idle(); log('  →', await q.evaluate(() => zone.next())); await q.waitForFunction(() => zone.pc.item?.def.name === 'ပုံး' && !zone.pc.busy, null, { timeout: 120000 });
    log('  →', await q.evaluate(() => zone.next()), '(holding the bucket)');
    await q.waitForFunction(() => zone.mission.blocked > 0, null, { timeout: 300000 }); await shot(q, '1-5-shield');
    log('  splash blocked:', await q.evaluate(() => ({ blocked: zone.mission.blocked, open: !!zone.bulbs() })));
    await q.evaluate(() => zone.bulbs().auto()); await q.waitForFunction(() => zone.pc.item?.def.name === 'မီးကြိုး', null, { timeout: 300000 }); log('  solved → holding the lights ✓');
    await q.close();
  }

  // ---------- 4. reload mid-day ----------
  if (want('reload')) {
  log('4. reload in 1-4');
    const q = await open('new&day=1&step=1-4');
    await q.waitForTimeout(2000); const before = await state(q);
    await q.reload(); await q.waitForFunction(() => window.zone, null, { timeout: 180000 }); await q.evaluate(() => { zone.fast = true; });
    const after = await q.evaluate(() => ({ step: zone.S().step, got: zone.S().got, pile: zone.mandat.pileAt && true }));
    log('  before', before.step, '→ after reload', JSON.stringify(after));
    await until(q, s => s.step === '1-5', {}, 600); log('  … and 1-4 plays on to', (await state(q)).step);
    // Mum's range: walk out onto the main street
    const gt = () => q.evaluate(() => zone.W.time());
    await q.evaluate(() => zone.hero.g.position.set(-3.0, 0, 5.0)); let t0 = await gt(); while (await gt() < t0 + .5) await q.waitForTimeout(500);
    await q.evaluate(() => zone.hero.g.position.set(-3.0, 0, 6.4)); // onto the main street's sidewalk
    t0 = await gt(); while (await gt() < t0 + 1) await q.waitForTimeout(500);
    await q.waitForFunction(() => !zone.day.steering, null, { timeout: 200000 });
    const back = await q.evaluate(() => ({ z: +zone.hero.g.position.z.toFixed(2), said: document.getElementById('dtext').textContent }));
    log('  range: stepped to z 6.4 → back at z', back.z, '· Mum:', back.said);
    await shot(q, 'range-mum');
    await q.close();
  }

  // ---------- 5. phone ----------
  if (want('phone')) {
  log('5. phone 375×667');
    const ph = await b.newContext({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true });
    const q = await ph.newPage(); q.on('pageerror', e => errs.push(e.message)); q.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await q.goto(URL + '?new&day=1&step=1-3' + Q); await q.waitForFunction(() => window.zone, null, { timeout: 180000 });
    await q.waitForTimeout(4000); await shot(q, 'phone-375');
    await ph.close();
  }
  log('console errors:', errs.length, errs.slice(0, 5));
  await b.close();
})().catch(e => { console.error('FAILED', e.message); console.log('console errors:', errs); process.exit(1); });
