// docs/water/damage.cjs — the three weapons hit clearly differently (creator 2026-11-01): grit lost per hit, and the bar's red trail / chunk
const { chromium } = require('playwright'); const OUT = __dirname + '/';
(async () => { const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 900, height: 560 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8792/war.html?mode=home&dt=.1&clock=900'); await p.waitForFunction(() => window.war?.kids, null, { timeout: 120000 });
  const game = async s => { const t0 = await p.evaluate(() => war.W.time()); await p.waitForFunction(t => war.W.time() > t, t0 + s, { timeout: 300000, polling: 200 }); };
  await game(.4); const out = {};
  for (const [wpn, d] of [['pump', 3], ['balloon', 5], ['bucket', 1.2]]) {
    await p.evaluate(([wpn, d]) => { const { kids, me } = war; window.E = kids.find(k => k.team === 'B'); for (const k of kids) if (k !== me) { k.state = 'wipe'; k.wipeT = 999; if (k !== E) k.c.g.position.set(k.c.g.position.x, 0, 8.4); }
      me.c.g.position.set(0, 0, -5.5); E.c.g.position.set(d, 0, -5.5); E.grit = 1; E.trail = 1; E.state = 'wipe'; E.wipeT = 999; war.STATS.dealt = {}; me.water = 3.5; me.faceAim = false; war.setWeapon(wpn); window.G0 = E.grit;
      if (wpn === 'pump') war.stroke(me, E); else if (wpn === 'balloon') war.lob(me, 0, E); else war.heave(me, E); }, [wpn, d]);
    await game(wpn === 'balloon' ? 2.2 : .7);
    out[wpn] = await p.evaluate(() => ({ lost: war.STATS.dealt, trail: +E.trail.toFixed(2), chunk: E.tag.e.classList.contains('chunk') }));
    await p.screenshot({ path: OUT + 'damage-' + wpn + '.jpg', quality: 72, type: 'jpeg' });
  }
  console.log(JSON.stringify(out), 'errs', errs); await b.close(); })();
