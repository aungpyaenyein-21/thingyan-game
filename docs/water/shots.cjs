const { chromium } = require('playwright'); const OUT = __dirname + '/';
(async () => { const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [vp, tag] of [[{ width: 900, height: 560 }, ''], [{ width: 375, height: 667 }, '-phone']]) {
  const p = await b.newPage({ viewport: vp, hasTouch: tag !== '' });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8792/war.html?mode=home&dt=.1&clock=900'); await p.waitForFunction(() => window.war?.kids, null, { timeout: 120000 });
  const game = async s => { const t0 = await p.evaluate(() => war.W.time()); await p.waitForFunction(t => war.W.time() > t, t0 + s, { timeout: 300000, polling: 200 }); };
  await game(.4);
  const stage = (wpn, ex) => p.evaluate(([wpn, ex]) => { const { kids, me } = war; window.E = kids.find(k => k.team === 'B'); for (const k of kids) if (k !== me && k !== E) { k.state = 'wipe'; k.wipeT = 999; k.c.g.position.set(k.c.g.position.x, 0, 8.4); }
    E.state = 'wipe'; E.wipeT = 999; me.c.g.position.set(0, 0, -5.5); E.c.g.position.set(ex, 0, -5.5); me.water = 3.5; me.c.g.rotation.y = Math.PI / 2; war.setWeapon(wpn); }, [wpn, ex]);
  // pump: hold the pad (stroke every .4 s) with the aim line
  await stage('pump', 3.5); const box = await p.locator('#fire').boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.mouse.down(); await game(.9); await p.screenshot({ path: OUT + 'pump' + tag + '.jpg', quality: 72, type: 'jpeg' }); await p.mouse.up();
  // balloon: hold to wind up — arc + landing ring, then the burst
  await stage('balloon', 6); await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.mouse.down(); await game(.5); await p.screenshot({ path: OUT + 'balloon-aim' + tag + '.jpg', quality: 72, type: 'jpeg' }); await p.mouse.up();
  await game(1.3); await p.screenshot({ path: OUT + 'balloon-burst' + tag + '.jpg', quality: 72, type: 'jpeg' });
  // bucket
  await stage('bucket', 1.3); await p.evaluate(() => war.heave(war.me, E)); await game(.5); await p.screenshot({ path: OUT + 'bucket' + tag + '.jpg', quality: 72, type: 'jpeg' });
  await game(1.5); await p.screenshot({ path: OUT + 'wet' + tag + '.jpg', quality: 72, type: 'jpeg' });
  console.log(tag || 'laptop', 'errs', errs.slice(0, 4)); await p.close(); }
  await b.close(); })();
