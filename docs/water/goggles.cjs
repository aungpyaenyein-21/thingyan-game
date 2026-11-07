// docs/water/goggles.cjs — T8 swim goggles: up / down on you and on Thura (close orbit view), the lens flash on a face hit,
// and the soak overlay under 40 face hits with your goggles up vs down (two rates: a dribble, 1 hit / .25 s, and a held pump, 10 hits / .4 s)
// node docs/water/goggles.cjs [port=8792]
const { chromium } = require('playwright'); const OUT = __dirname + '/'; const port = process.argv[2] || 8792;
(async () => { const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 900, height: 560 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.setDefaultTimeout(180000);
  await p.goto(`http://localhost:${port}/war.html?mode=home&dt=.1&clock=900&goggles`); await p.waitForFunction(() => window.war?.kids, null, { timeout: 120000 });
  const game = async s => { const t0 = await p.evaluate(() => war.W.time()); await p.waitForFunction(t => war.W.time() > t, t0 + s, { timeout: 300000, polling: 200 }); };
  const shot = name => p.screenshot({ path: OUT + name + '.jpg', quality: 75, type: 'jpeg', timeout: 180000 });
  await game(.4);
  await p.evaluate(() => { const { kids, me } = war; window.T = kids.find(k => k.id === 'B0'); // Thura
    for (const k of kids) if (k !== me) { k.state = 'wipe'; k.wipeT = 1e9; if (k !== T) k.c.g.position.set(k.c.g.position.x, 0, 8.4); }
    T.gogNext = 1e9; me.c.g.position.set(0, 0, -5.5); me.c.g.rotation.y = 0; T.c.g.position.set(1.6, 0, -5.5); T.c.g.rotation.y = 0; });
  const look = (who, az) => p.evaluate(([who, az]) => { const k = who === 'me' ? war.me : T, v = k.c.g.position.clone(); v.y = 1.05 * k.c.g.scale.x; war.W.orbit.focus(v, { dist: 2.3, az, elev: .12, t: .05 }); }, [who, az]);
  const res = {};
  await look('me', .45); await game(1.5); res.meStart = await p.evaluate(() => war.me.goggles); await shot('goggles-me-up');
  await p.keyboard.press('KeyG'); await game(.2); res.meMid = await p.evaluate(() => ({ one: war.me.c.anim.one, speed: war.me.c.anim.speed, pad: document.getElementById('gog').className }));
  await game(1.2); res.meAfter = await p.evaluate(() => ({ goggles: war.me.goggles, pad: document.getElementById('gog').className })); await shot('goggles-me-down');
  await look('T', .45); await game(1.5); res.thuraStart = await p.evaluate(() => T.goggles); await shot('goggles-thura-down');
  await p.evaluate(() => war.flipGoggles(T)); await game(1.3); res.thuraAfter = await p.evaluate(() => T.goggles); await shot('goggles-thura-up');
  await p.evaluate(() => war.flipGoggles(T)); await game(1.3); res.thuraBack = await p.evaluate(() => T.goggles);
  // a face hit into the goggles: the lenses flash for .15 s (held on for the picture: ~1 fps here) and the word is the flat 「ဖျန်း」
  res.flash = await p.evaluate(() => { war.soak(T, { grit: .008, face: true, push: new war.W.THREE.Vector3(0, 0, -1), at: T.c.g.position.clone().setY(1.1), from: war.me, kind: 'pump' });
    T.state = 'wipe'; T.wipeT = 1e9; return { lens: T.c.ch.goggles.lens.map(m => m.emissiveIntensity), word: [...document.querySelectorAll('b')].map(e => e.textContent).filter(t => /ဖျန်း|မျက်နှာ/.test(t)) }; }); // a hit stops a wipe: put him back
  await p.evaluate(() => { T.flashT = 99; }); await shot('goggles-thura-flash'); await p.evaluate(() => { T.flashT = .01; });
  await game(.4); res.flashAfter = await p.evaluate(() => T.c.ch.goggles.lens.map(m => m.emissiveIntensity));
  await p.evaluate(() => { war.W.orbit.release(); T.c.g.position.set(1.6, 0, 8.4); });
  // the overlay: 40 face hits on you from Thura, sampled every frame (what's on screen: sting tint, the water film, the blur)
  await p.evaluate(() => { const { W, me } = war, el = id => document.getElementById(id);
    window.RUN = (rate, win) => { window.DONE = null; const t0 = W.time(); let n = 0, on = true; const S = { sting: [], film: [], blur: [], drown: [], stingRaw: [] };
      W.tick(() => { if (!on) return; const t = W.time() - t0, due = Math.min(40, rate === 'dribble' ? Math.floor(t / .25) + 1 : (Math.floor(t / .4) + 1) * 10);
        while (n < due) { n++; me.grit = 1; war.soak(me, { grit: .008, face: true, push: new W.THREE.Vector3(-1, 0, 0), at: me.c.g.position.clone().setY(1.1), from: T, kind: 'pump' }); }
        const f = W.renderer.domElement.style.filter.match(/blur\(([\d.]+)px\)/), st = war.state();
        S.sting.push(+el('sting').style.opacity || 0); S.film.push(+el('drown').style.opacity || 0); S.blur.push(f ? +f[1] : 0); S.drown.push(st.drown); S.stingRaw.push(st.sting);
        if (t > win) { on = false; const sum = a => +a.reduce((x, y) => x + y, 0).toFixed(2), mx = a => +Math.max(...a).toFixed(3);
          window.DONE = { hits: n, frames: S.sting.length, peak: { sting: mx(S.sting), film: mx(S.film), blur: mx(S.blur), drown: mx(S.drown), stingRaw: mx(S.stingRaw) }, area: { sting: sum(S.sting), film: sum(S.film), blur: sum(S.blur), drown: sum(S.drown), stingRaw: sum(S.stingRaw) } }; } }); }; });
  for (const rate of ['pump', 'dribble']) for (const g of ['up', 'down']) {
    await p.waitForFunction(() => war.state().drown === 0 && war.state().sting === 0, null, { timeout: 300000, polling: 300 });
    await p.evaluate(g => { if (war.me.goggles !== g) { war.me.goggles = g; war.me.c.ch.gogglesUp = g === 'up'; war.me.c.ch.goggles.set(g === 'up'); } }, g);
    await p.evaluate(([rate]) => RUN(rate, rate === 'dribble' ? 13 : 6), [rate]);
    if (rate === 'pump') { await game(1.7); await shot(g === 'down' ? 'goggles-soak' : 'goggles-soak-none'); }
    await p.waitForFunction(() => window.DONE, null, { timeout: 600000, polling: 300 }); res[`soak ${rate} goggles ${g}`] = await p.evaluate(() => DONE);
  }
  for (const rate of ['pump', 'dribble']) { const a = res[`soak ${rate} goggles up`], d = res[`soak ${rate} goggles down`], r = {};
    for (const m of ['peak', 'area']) for (const k of Object.keys(a[m])) r[m + ' ' + k] = a[m][k] ? +(d[m][k] / a[m][k]).toFixed(2) : null; res[`ratio down/up ${rate}`] = r; }
  for (const [k, v] of Object.entries(res)) console.log(k.padEnd(26), JSON.stringify(v));
  console.log('errs', errs); await b.close(); })();
