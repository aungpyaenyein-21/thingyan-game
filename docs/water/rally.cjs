// docs/water/rally.cjs — T11 home rally: the ward's grown-ups rain balloons on the visitors (docs/plans/T11.md). Asserts numbers:
//   ① ?mode=home&auto&rally=force — balloons thrown = RALLY.balloons · every rally burst on the visitors' side (x × SIDE[away] > 0) ·
//     OUTS[away] unchanged by every rally burst (and no rally OUT in STATS.rally's round) · OUT kids never touched (no foul) ·
//     home kids' grit untouched · a visitor loses ≤ RALLY.grit and never goes below RALLY.floor · the adults never cross the
//     chalk line, are not in `kids`, and are gone afterwards · screenshots rally-call / rally-barrage / rally-exit
//   ② ?mode=away&rally=force — the same, against you (① are the visitors) · screenshot rally-away (the rings)
//   ③ ?mode=home&rally=force — the player's pump splashes a grown-up: wet, STATS.adultHits up, STATS.fouls and the adult's tLeave untouched
//   ④ (with `alley`) ?map=alley&mode=home&auto&rally=force — ① again in the alleys (out of the house doors) · screenshot rally-alley
// node docs/water/rally.cjs [port=8800] [alley]
const { chromium } = require('playwright'); const OUT = __dirname + '/'; const port = process.argv[2] || 8800, ALLEY = process.argv[3] === 'alley';
const fails = []; const ok = (name, cond, info = '') => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (info !== '' ? ' — ' + (typeof info === 'string' ? info : JSON.stringify(info)) : '')); if (!cond) fails.push(name); };
async function open(b, q) {
  const p = await b.newPage({ viewport: { width: 900, height: 560 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto(`http://localhost:${port}/war.html?${q}&dt=.1`); await p.waitForFunction(() => window.war?.kids && window.war.W, null, { timeout: 120000 });
  await p.evaluate(() => { // in-page watcher: phase changes (game time), the adults' furthest step toward the chalk line, rings on screen
    const home = new URLSearchParams(location.search).get('mode') === 'away' ? 'B' : 'A', sh = home === 'A' ? -1 : 1;
    window.RW = { home, phases: [], minX: 1e9, rings: 0, inKids: false }; let last = null;
    war.W.tick(() => { const r = war.rally; if (r.phase !== last) { last = r.phase; RW.phases.push([r.phase, +war.W.time().toFixed(1), war.state().clock]); }
      for (const a of war.adults) if (a.c.g.parent) RW.minX = Math.min(RW.minX, a.c.g.position.x * sh);
      RW.inKids = RW.inKids || war.adults.some(a => war.kids.includes(a)); RW.rings = Math.max(RW.rings, war.W.scene.children.filter(o => o.isMesh && o.visible && o.geometry?.type === 'RingGeometry' && o.material.color?.getHexString() === 'ffe26b').length); });
  });
  const game = async s => { const t0 = await p.evaluate(() => war.W.time()); await p.waitForFunction(t => war.W.time() > t, t0 + s, { timeout: 600000, polling: 300 }); };
  const until = async (f, arg, s = 600000) => p.waitForFunction(f, arg, { timeout: s, polling: 300 });
  return { p, errs, game, until };
}
const shot = (p, name) => p.screenshot({ path: OUT + name, quality: 72, type: 'jpeg', timeout: 180000 });
function check(tag, r) { // the numbers from one rally
  const away = r.home === 'A' ? 'B' : 'A';
  ok(`${tag}: fired once`, r.rally.length === 1, r.rally);
  ok(`${tag}: balloons thrown = RALLY.balloons`, r.thrown === r.RALLY.balloons, `${r.thrown} / ${r.RALLY.balloons}`);
  ok(`${tag}: every balloon burst (none lost)`, r.bursts.length === r.thrown, `${r.bursts.length} bursts`);
  const sides = r.bursts.map(e => e.side); ok(`${tag}: every rally burst on ${away}'s side (x × SIDE[away] > 0)`, sides.every(x => x > 0), `min ${Math.min(...sides)} · max ${Math.max(...sides)}`);
  ok(`${tag}: OUTS[away] unchanged by every rally burst`, r.bursts.every(e => e.outs === e.outsAfter), `OUTS[${away}] before → after the rally ${r.outs0} → ${r.outs1} (the kids' own OUTs count too)`);
  ok(`${tag}: no rally hit leaves a visitor OUT`, r.bursts.every(e => e.hits.every(h => h.home || h.before === undefined || !h.out)));
  const outs = r.bursts.flatMap(e => e.hits.filter(h => h.before === undefined)); ok(`${tag}: OUT kids never hit (and no foul from a rally burst)`, r.bursts.every(e => e.fouls === e.foulsAfter), `${outs.length} OUT kid(s) inside a ring, left alone`);
  const homes = r.bursts.flatMap(e => e.hits.filter(h => h.home)); ok(`${tag}: home kids' grit untouched`, homes.every(h => h.before === h.after), `${homes.length} home kid(s) splashed for show`);
  const vis = r.bursts.flatMap(e => e.hits.filter(h => !h.home && h.before !== undefined));
  ok(`${tag}: visitors lose ≤ RALLY.grit, never below RALLY.floor`, vis.every(h => h.before - h.after <= r.RALLY.grit + 1e-6 && h.after >= Math.min(h.before, r.RALLY.floor) - 1e-6),
    `${vis.length} visitor hits · lost ${vis.map(h => +(h.before - h.after).toFixed(3)).join(' ')} · lowest after ${Math.min(...vis.map(h => h.after))}`);
  ok(`${tag}: the adults never cross the chalk line`, r.minX > 0, `closest x × SIDE[home] = ${r.minX.toFixed(2)}`);
  ok(`${tag}: adults not in kids · all gone after`, !r.inKids && r.left === 0, `left on the lot ${r.left}`);
  ok(`${tag}: landing rings shown`, r.rings > 0, `max ${r.rings} at once`);
  console.log(tag, 'phases', JSON.stringify(r.phases), '· trigger', JSON.stringify(r.rally[0]));
}
const grab = p => p.evaluate(() => ({ home: RW.home, phases: RW.phases, minX: RW.minX, rings: RW.rings, inKids: RW.inKids, rally: war.STATS.rally, thrown: war.STATS.rallyThrown, bursts: war.STATS.rallyBursts,
  RALLY: war.RALLY, outs1: war.state().outs[RW.home === 'A' ? 'B' : 'A'], left: war.adults.filter(a => a.c.g.parent).length, hits: war.STATS.rallyHits, homeHits: war.STATS.rallyHome, adultHits: war.STATS.adultHits }));
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [];
  if (ALLEY) { // ④ the alleys only
    const { p, errs: e, until } = await open(b, 'map=alley&mode=home&auto&rally=force&clock=180');
    await until(() => war.rally.phase === 'call'); const outs0 = await p.evaluate(() => war.state().outs.B);
    await until(() => war.rally.phase === 'barrage' && RW.rings > 0); await until(() => war.STATS.rallyThrown >= 10); await shot(p, 'rally-alley.jpg');
    await until(() => war.rally.phase === 'idle' && war.rally.n === 1);
    const r = await grab(p); r.outs0 = outs0; check('alley', r); errs.push(...e); await p.close();
    ok('console errors 0', errs.length === 0, errs.slice(0, 5)); console.log(fails.length ? `${fails.length} FAILED: ${fails.join(' · ')}` : 'ALL PASS'); await b.close(); process.exit(fails.length ? 1 : 0);
  }
  { // ① home, everyone on AI
    const { p, errs: e, until, game } = await open(b, 'mode=home&auto&rally=force&clock=180');
    await until(() => war.rally.phase === 'call'); const outs0 = await p.evaluate(() => war.state().outs.B); await shot(p, 'rally-call.jpg');
    await until(() => war.rally.phase === 'barrage' && RW.rings > 0); await until(() => war.STATS.rallyThrown >= 12); await shot(p, 'rally-barrage.jpg');
    await until(() => war.rally.phase === 'back'); await until(() => war.adults.some(a => a.leaving && !a.gone));
    await p.evaluate(() => war.W.orbit?.focus(war.adults.find(a => a.leaving && !a.gone).c.g, { dist: 9, t: .1 })); await game(.6); await shot(p, 'rally-exit.jpg'); await p.evaluate(() => war.W.orbit?.release()); // the camera on them walking off
    await until(() => war.rally.phase === 'idle' && war.rally.n === 1);
    const r = await grab(p); r.outs0 = outs0; check('home', r); console.log('home: visitor hits', r.hits, '· home kids splashed', r.homeHits, '· adults hit by kids', r.adultHits); errs.push(...e); await p.close();
  }
  { // ② away: the rally is against you
    const { p, errs: e, until } = await open(b, 'mode=away&rally=force&clock=180');
    await until(() => war.rally.phase === 'out'); const outs0 = await p.evaluate(() => war.state().outs.A);
    await p.evaluate(() => { war.me.c.g.position.set(-2.6, 0, 1.2); war.W.snapCam(); }); // you, up near the line where they'll land
    await until(() => war.rally.phase === 'barrage' && RW.rings > 0 && war.W.scene.children.some(o => o.isMesh && o.visible && o.geometry?.type === 'RingGeometry' && o.material.color?.getHexString() === 'ffe26b' && o.position.distanceTo(war.me.c.g.position) < 6));
    await shot(p, 'rally-away.jpg');
    await until(() => war.rally.phase === 'idle' && war.rally.n === 1);
    const r = await grab(p); r.outs0 = outs0; check('away', r); errs.push(...e); await p.close();
  }
  { // ③ you splash a grown-up
    const { p, errs: e, until, game } = await open(b, 'mode=home&rally=force&clock=900');
    await until(() => war.rally.phase === 'barrage');
    const before = await p.evaluate(() => { const { kids, me } = war; for (const k of kids) if (k !== me) { k.state = 'wipe'; k.wipeT = 999; } // everyone else stands still: no fouls but ours
      const a = war.adults.find(x => x.arrived && !x.gone), q = a.c.g.position; window.A = a; me.c.g.position.set(q.x + 2.6, 0, q.z); me.c.g.rotation.y = -Math.PI / 2; me.water = 3.5; war.setWeapon('pump');
      return { fouls: war.STATS.fouls, tLeave: a.tLeave, adultHits: war.STATS.adultHits, wet: a.c.ch.wet, inKids: kids.includes(a) }; });
    await p.evaluate(() => { const d = A.c.g.position.clone().sub(war.me.c.g.position).setY(0).normalize(); war.stroke(war.me, null, d); });
    await game(.8);
    const after = await p.evaluate(() => ({ fouls: war.STATS.fouls, tLeave: A.tLeave, adultHits: war.STATS.adultHits, wet: +A.c.ch.wet.toFixed(2), inKids: war.kids.includes(A), phase: war.rally.phase }));
    ok('splash: the player\'s water hits the adult', after.adultHits > before.adultHits && after.wet > before.wet, { before, after });
    ok('splash: STATS.fouls untouched', after.fouls === before.fouls, `${before.fouls} → ${after.fouls}`);
    ok('splash: the adult\'s tLeave untouched', after.tLeave === before.tLeave, `${before.tLeave} → ${after.tLeave}`);
    ok('splash: the adult is not a kid', !after.inKids);
    // ③b staged, so the home / OUT / floor rules aren't left to chance: a home kid, an OUT visitor and a visitor on .2 grit under a landing balloon
    await until(() => war.balloons.some(b => b.rally && b.tLand - war.W.time() > .7 && b.at.x > 1.5));
    const st = await p.evaluate(() => { const b = war.balloons.find(o => o.rally && o.tLand - war.W.time() > .7 && o.at.x > 1.5), K = id => war.kids.find(k => k.id === id);
      const h = K('A1'), o = K('B2'), v = K('B3'); window.STAGE = { h, o, v, n: war.STATS.rallyBursts.length, fouls: war.STATS.fouls, outsB: war.state().outs.B };
      war.goOut(o); for (const k of [h, o, v]) { k.state = 'wipe'; k.wipeT = 999; } v.grit = .2; h.grit = .9;
      h.c.g.position.set(b.at.x - .3, 0, b.at.z); o.c.g.position.set(b.at.x + .3, 0, b.at.z); v.c.g.position.set(b.at.x, 0, b.at.z + .25);
      return { at: [+b.at.x.toFixed(2), +b.at.z.toFixed(2)], outsB: STAGE.outsB }; });
    await until(() => war.STATS.rallyBursts.length > STAGE.n && war.STATS.rallyBursts.slice(STAGE.n).some(e => e.hits.length >= 3));
    const sr = await p.evaluate(() => { const e = war.STATS.rallyBursts.slice(STAGE.n).find(x => x.hits.length >= 3); return { burst: e, h: STAGE.h.grit, o: STAGE.o.grit, oOut: STAGE.o.out, v: +STAGE.v.grit.toFixed(4), vOut: STAGE.v.out, fouls: war.STATS.fouls, fouls0: STAGE.fouls, outsB: war.state().outs.B }; });
    console.log('staged', JSON.stringify(st), JSON.stringify(sr));
    const hh = sr.burst.hits.find(x => x.id === 'A1'), oh = sr.burst.hits.find(x => x.id === 'B2'), vh = sr.burst.hits.find(x => x.id === 'B3');
    ok('staged: the home kid in the ring keeps its grit', hh?.home && hh.before === hh.after && sr.h === .9, hh);
    ok('staged: the OUT visitor in the ring is left alone — no foul, no grit change', oh?.out && oh.before === undefined && sr.fouls === sr.fouls0 && sr.oOut, oh);
    ok('staged: the visitor on .2 stops at the floor (.1), not OUT', vh && vh.before === .2 && vh.after === .1 && !sr.vOut && sr.v === .1, vh);
    ok('staged: OUTS[B] only counts the goOut we did', sr.outsB === st.outsB + 1 && sr.burst.outs === sr.burst.outsAfter, `${st.outsB} → ${sr.outsB}`);
    errs.push(...e); await p.close();
  }
  ok('console errors 0', errs.length === 0, errs.slice(0, 5));
  console.log(fails.length ? `${fails.length} FAILED: ${fails.join(' · ')}` : 'ALL PASS'); await b.close(); process.exit(fails.length ? 1 : 0);
})();
