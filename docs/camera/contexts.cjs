// T2 · CAMERA.md §၉ — context zoom / look-ahead / room cut / talk / user zoom / wall / ?tune ကို ဂဏန်းနဲ့ စစ်
// run: python3 -m http.server 8790 → node docs/camera/contexts.cjs
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 640, height: 448 } }), errs = [];
  const open = async (q = '?new&debug&q=low&dt=0.1') => {
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await p.goto('http://localhost:8790/yangon.html' + q); await p.waitForFunction(() => window.zone, null, { timeout: 120000 });
    await p.waitForTimeout(2500); for (let i = 0; i < 4; i++) { await p.keyboard.press('KeyE'); await p.waitForTimeout(300); } return p;
  };
  const st = p => p.evaluate(() => { const o = zone.W.orbit, s = o.state; return { ctx: [...s.ctx].join(','), dist: +s.dist.toFixed(2), goal: +s.distGoal.toFixed(2), user: +s.user.toFixed(2), locked: s.locked, az: +s.az.toFixed(2) }; });
  const p = await open();
  await p.evaluate(() => { const W = zone.W; W.player.g.position.set(4, W.ground(4, 8), 8); W.snapCam(); }); // the open road, clear of the median
  await p.waitForTimeout(1500); console.log('1 rest      ', JSON.stringify(await st(p)), '(base 11)');
  await p.keyboard.down('ShiftLeft'); await p.keyboard.down('KeyD'); await p.waitForTimeout(9000); // headless frames are slow: give it game time
  console.log('2 running   ', JSON.stringify(await st(p)), '(run → goal 14, dist climbing)');
  await p.keyboard.up('KeyD'); await p.keyboard.up('ShiftLeft'); await p.waitForTimeout(12000);
  console.log('3 stopped   ', JSON.stringify(await st(p)), '(run off after 1 s, back toward 11)');
  // talk: the barber's / any NPC talk — use ဦးဘတင် (cat mission start)
  await p.evaluate(() => { const S = zone.S(); S.step = 'quests'; S.q.cat = 'ask'; const W = zone.W, sp = zone.SPOTS.find(s => String(s.at).includes('UNCLE')), a = sp.at(); W.player.g.position.set(a.x + .3, W.ground(a.x, a.z), a.z + .3); W.snapCam(); });
  await p.waitForTimeout(3000); await p.keyboard.press('KeyE'); await p.waitForTimeout(4000);
  console.log('4 talking   ', JSON.stringify(await st(p)), '(talk → goal 7, az pulled ≤ .35)');
  for (let i = 0; i < 10 && await p.evaluate(() => zone.talking()); i++) { await p.keyboard.press('KeyE'); await p.waitForTimeout(400); }
  await p.waitForTimeout(3000); console.log('5 talk over ', JSON.stringify(await st(p)));
  // user zoom offset: survives a room, and a reload
  await p.evaluate(() => zone.W.orbit.zoom(1.3)); await p.waitForTimeout(500);
  await p.evaluate(() => { const S = zone.S(); const W = zone.W, sp = zone.SPOTS.find(s => String(s.at).includes('L.BARBER')), a = sp.at(); W.player.g.position.set(a.x + .3, W.ground(a.x, a.z), a.z + .3); W.snapCam(); });
  await p.waitForTimeout(3000); await p.keyboard.press('KeyE'); await p.waitForTimeout(1200);
  console.log('6 in a room ', JSON.stringify(await st(p)), '(cut: dist 6 at once, locked)');
  await p.evaluate(() => { const W = zone.W, d = zone.SPOTS.filter(s => { try { return s.label() === 'အပြင် ထွက်'; } catch { return false; } }).map(s => s.at()).sort((a, b) => a.distanceTo(W.player.g.position) - b.distanceTo(W.player.g.position))[0]; W.player.g.position.set(d.x, W.ground(d.x, d.z), d.z); });
  await p.waitForTimeout(3000); await p.keyboard.press('KeyE'); await p.waitForTimeout(1200);
  console.log('7 back out  ', JSON.stringify(await st(p)), '(cut back, user 1.3 kept → 14.3)');
  // the wall: stand tight against the flats with the camera behind them
  const wall = await p.evaluate(() => { const W = zone.W; W.player.g.position.set(-3.6, W.ground(-3.6, -4.3), -4.3); W.orbit.state.azGoal = Math.PI; W.snapCam(); return null; });
  await p.waitForTimeout(2500);
  console.log('8 wall      ', JSON.stringify(await p.evaluate(() => { const W = zone.W, c = W.cam.position, s = W.orbit.state; return { dist: +s.dist.toFixed(2), camInsideBuilding: zone.W.scene.children.length > 0 && false, cam: [c.x, c.y, c.z].map(v => +v.toFixed(1)) }; })));
  await p.close();
  // reload: the zoom offset is remembered (localStorage thingyan.zoom); ?tune opens lil-gui
  const q = await open('?debug&q=low&dt=0.1&tune'); await q.waitForTimeout(3000);
  console.log('9 reload    ', JSON.stringify(await st(q)), '| ?tune panel:', await q.evaluate(() => !!document.querySelector('.lil-gui')));
  console.log('errors', errs); await b.close();
})();
