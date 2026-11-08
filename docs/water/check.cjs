// docs/water/check.cjs — T3 check: ?auto, three rounds, everyone on Yuka AI. Logs per round who won, OUT counts, fouls,
// A* paths / stuck events, kids that wanted to move but stood still for 5 s+ (a snag on a drum), console errors; a screenshot per round.
// T8: also per kid (cumulative over the match): OUTs, hits taken, grit taken, grit per hit — Thura (B0) should take the least per hit
// T11: also the home rally per round — when it fired and the trigger values (STATS.rally: round, clock, why, homeLeft, awayLeft, outs);
//   at most once a round, and only with the home side behind (why: left = home ≤ 2 in vs away ≥ 4 · outs = 3+ more OUTs · late = behind in the last 45 s)
//   (the rally can't fire before 30 s into a round — use clock ≥ 90 to see it; ?rally=force is docs/water/rally.cjs's job)
// node docs/water/check.cjs [port=8792] [clock=40]   (a static server on the repo root; headless Chromium — slow on swiftshader)
const { chromium } = require('playwright'); const path = require('path');
const port = process.argv[2] || 8792, clock = process.argv[3] || 40, out = __dirname;
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 800, height: 500 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto(`http://localhost:${port}/war.html?mode=home&auto&dt=.1&clock=${clock}`); await p.waitForFunction(() => window.war?.ai, null, { timeout: 120000 });
  await p.evaluate(() => { // in-page watcher: a kid who wants to walk but hasn't moved 0.3 m in 5 game seconds is snagged
    window.SNAG = { n: 0, who: [] }; window.ROUNDS = []; const last = new Map(); let res = null;
    war.W.tick(() => { if (war.result !== res) { res = war.result; if (res) ROUNDS.push({ round: war.round, result: res, outs: war.state().outs, fouls: war.STATS.fouls, shots: war.STATS.shots, hits: war.STATS.hits,
      rally: (war.STATS.rally ?? []).filter(r => r.round === war.round), rallyThrown: war.STATS.rallyThrown, paths: war.ai.STATS.paths, noPath: war.ai.STATS.noPath, stuckEvents: war.ai.STATS.stuck, snags: SNAG.n, gameT: +war.W.time().toFixed(0),
      kids: war.kids.map(k => `${k.id} ${k.goggles ?? '-'} outs ${k.outs} hits ${k.hitN ?? 0} took ${(k.took ?? 0).toFixed(2)} per ${((k.took ?? 0) / (k.hitN || 1)).toFixed(4)}`) }); } }); // T8: per kid, so far (Thura B0 takes ×.8, goggles face ×1)
    war.W.tick(() => { const t = war.W.time(); for (const k of war.ai.kids) { const p = k.c.g.position, l = last.get(k);
      if (!l || !k.ai.want || k.out || k.state === 'wipe' || k.filling || k.waiting || k.c.anim.one) { last.set(k, { x: p.x, z: p.z, t }); continue; }
      if (Math.hypot(p.x - l.x, p.z - l.z) > .3) last.set(k, { x: p.x, z: p.z, t }); else if (t - l.t > 5) { SNAG.n++; SNAG.who.push(`${k.team}${k.i}@${p.x.toFixed(1)},${p.z.toFixed(1)} ${war.ai.state(k)} t${t.toFixed(0)} rally:${war.rally?.phase ?? '-'}`); last.set(k, { x: p.x, z: p.z, t }); } } });
  });
  const rounds = [];
  for (let i = 0; i < 3000; i++) { // T11: up to 100 min — 3 rounds of 120 s run ~35 min on swiftshader
    await p.waitForTimeout(2000);
    const r = await p.evaluate(() => ({ rounds: ROUNDS, final: !!war.final }));
    while (rounds.length < r.rounds.length) { const x = r.rounds[rounds.length]; rounds.push(x); console.log('round', JSON.stringify(x)); await p.screenshot({ path: path.join(out, `round${x.round}.jpg`), quality: 70 }); }
    if (r.final && rounds.length >= 3) break;
  }
  const snag = await p.evaluate(() => SNAG.who);
  const per = await p.evaluate(() => war.kids.map(k => ({ id: k.id, name: k.name, goggles: k.goggles, toughK: k.toughK ?? 1, outs: k.outs, hits: k.hitN ?? 0, took: +(k.took ?? 0).toFixed(3), perHit: +((k.took ?? 0) / (k.hitN || 1)).toFixed(4) })));
  console.table(per); const B = per.filter(k => k.id[0] === 'B'), th = B.find(k => k.id === 'B0');
  console.log('T8 Thura: least per hit on ④', B.every(k => k === th || th.perHit <= k.perHit), '· fewest OUTs on ④', B.every(k => k === th || th.outs <= k.outs));
  const fired = await p.evaluate(() => war.STATS.rally ?? []), R = await p.evaluate(() => war.RALLY ?? {}); // T11
  console.log('T11 rally fired', fired.length, 'time(s):', JSON.stringify(fired));
  console.log('T11 at most once a round', [1, 2, 3].every(n => fired.filter(f => f.round === n).length <= R.perRound),
    '· only with the home side behind', fired.every(f => (f.why === 'left' && f.homeLeft <= R.homeLeft && f.awayLeft >= R.awayLeft) || (f.why === 'outs' && f.outs.A - f.outs.B >= R.outGap) || (f.why === 'late' && f.clock <= R.lastSec && f.outs.A > f.outs.B)),
    '· never before minRoundT', fired.every(f => +clock - f.clock >= R.minRoundT));
  console.log(JSON.stringify({ rounds, snagWho: snag.slice(0, 12), errors: errs.slice(0, 10) }, null, 1)); await b.close();
})();
