// docs/water/damage.cjs — the three weapons hit clearly differently (creator 2026-11-01): grit lost per hit, and the bar's red trail / chunk
// T8: the same three on the ④ kid in swim goggles (down) and on Thura (goggles down + thuraK) — a face-aimed pump stroke −.08 vs −.12
// node docs/water/damage.cjs [port=8792]
const { chromium } = require('playwright'); const OUT = __dirname + '/'; const port = process.argv[2] || 8792;
(async () => { const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 900, height: 560 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto(`http://localhost:${port}/war.html?mode=home&dt=.1&clock=900`); await p.waitForFunction(() => window.war?.kids, null, { timeout: 120000 });
  const game = async s => { const t0 = await p.evaluate(() => war.W.time()); await p.waitForFunction(t => war.W.time() > t, t0 + s, { timeout: 300000, polling: 200 }); };
  await game(.4); const out = {};
  const who = { plain: 'B3', goggles: 'B1', thura: 'B0' }; // B3: a ④ kid with nothing · B1: the goggles kid (down) · B0: Thura (down, ×.8)
  for (const [tag, id] of Object.entries(who)) for (const [wpn, d] of [['pump', 3], ['balloon', 5], ['bucket', 1.2]]) {
    await p.evaluate(([wpn, d, id]) => { const { kids, me } = war; window.E = kids.find(k => k.id === id); for (const k of kids) if (k !== me) { k.state = 'wipe'; k.wipeT = 999; if (k !== E) k.c.g.position.set(k.c.g.position.x, 0, 8.4); }
      me.c.g.position.set(0, 0, -5.5); E.c.g.position.set(d, 0, -5.5); E.grit = 1; E.trail = 1; E.state = 'wipe'; E.wipeT = 999; war.STATS.dealt = {}; war.STATS.face = 0; war.STATS.hits = 0; me.water = 3.5; me.faceAim = false; war.setWeapon(wpn); window.G0 = E.grit;
      if (wpn === 'pump') war.stroke(me, E); else if (wpn === 'balloon') war.lob(me, 0, E); else war.heave(me, E); }, [wpn, d, id]);
    await game(wpn === 'balloon' ? 2.2 : .7);
    out[tag + ' ' + wpn] = await p.evaluate(() => ({ goggles: E.goggles, lost: war.STATS.dealt, hits: war.STATS.hits, face: war.STATS.face, trail: +E.trail.toFixed(2), chunk: E.tag.e.classList.contains('chunk') }));
    if (tag === 'plain') await p.screenshot({ path: OUT + 'damage-' + wpn + '.jpg', quality: 72, type: 'jpeg' });
  }
  for (const [k, v] of Object.entries(out)) console.log(k.padEnd(16), JSON.stringify(v));
  console.log('errs', errs); await b.close(); })();
