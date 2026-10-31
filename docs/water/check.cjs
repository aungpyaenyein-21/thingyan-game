// docs/water/check.cjs — T3 check: ?auto, three rounds, everyone on Yuka AI. Logs per round who won, OUT counts, fouls,
// A* paths / stuck events, kids that wanted to move but stood still for 5 s+ (a snag on a drum), console errors; a screenshot per round.
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
      paths: war.ai.STATS.paths, noPath: war.ai.STATS.noPath, stuckEvents: war.ai.STATS.stuck, snags: SNAG.n, gameT: +war.W.time().toFixed(0) }); } });
    war.W.tick(() => { const t = war.W.time(); for (const k of war.ai.kids) { const p = k.c.g.position, l = last.get(k);
      if (!l || !k.ai.want || k.out || k.state === 'wipe' || k.filling || k.waiting || k.c.anim.one) { last.set(k, { x: p.x, z: p.z, t }); continue; }
      if (Math.hypot(p.x - l.x, p.z - l.z) > .3) last.set(k, { x: p.x, z: p.z, t }); else if (t - l.t > 5) { SNAG.n++; SNAG.who.push(`${k.team}${k.i}@${p.x.toFixed(1)},${p.z.toFixed(1)} ${war.ai.state(k)}`); last.set(k, { x: p.x, z: p.z, t }); } } });
  });
  const rounds = [];
  for (let i = 0; i < 600; i++) {
    await p.waitForTimeout(2000);
    const r = await p.evaluate(() => ({ rounds: ROUNDS, final: !!war.final }));
    while (rounds.length < r.rounds.length) { const x = r.rounds[rounds.length]; rounds.push(x); console.log('round', JSON.stringify(x)); await p.screenshot({ path: path.join(out, `round${x.round}.jpg`), quality: 70 }); }
    if (r.final && rounds.length >= 3) break;
  }
  const snag = await p.evaluate(() => SNAG.who);
  console.log(JSON.stringify({ rounds, snagWho: snag.slice(0, 12), errors: errs.slice(0, 10) }, null, 1)); await b.close();
})();
