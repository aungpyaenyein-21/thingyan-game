// T2 — yangon.html (ရပ်ကွက်) ကို orbit ကင်မရာနဲ့ headless Chromium (Playwright) မှာ စစ်ပြီး docs/camera/*.jpg ထုတ်
// run: python3 -m http.server 8790 (repo root) → node docs/camera/check.cjs [shots…]
// GPU မရှိရင် frame တစ်ခု အချိန်ကြာလို့ ?q=low&dt=0.1 + viewport 800×560 · ?debug → window.zone
const { chromium } = require('playwright'), path = require('path');
const OUT = path.join(__dirname, '/'), ONLY = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 800, height: 560 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.addInitScript(() => { try { localStorage.clear(); } catch {} });
  await p.goto('http://localhost:8790/yangon.html?new&debug&q=low&dt=0.1'); await p.waitForFunction(() => window.zone, null, { timeout: 90000 });
  await p.addStyleTag({ url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Myanmar:wght@500;700&display=swap' }).catch(() => {});
  await p.waitForTimeout(2500); for (let i = 0; i < 4; i++) { await p.keyboard.press('KeyE'); await p.waitForTimeout(300); }
  const set = (o) => p.evaluate(o => { const W = zone.W, P = W.player.g.position; if (o.at) { P.set(o.at[0], W.ground(o.at[0], o.at[1]), o.at[1]); if (o.ry !== undefined) W.player.g.rotation.y = o.ry; }
    if (o.az !== undefined) { W.orbit.state.azGoal = o.az; } if (o.dist) W.orbit.setDist(o.dist); if (o.t !== undefined) W.setTime(o.t); W.snapCam(); }, o);
  const shot = async (name, o, wait = 1800) => { if (ONLY.length && !ONLY.includes(name)) return; await set(o); await p.waitForTimeout(wait); await p.screenshot({ path: OUT + name + '.jpg', type: 'jpeg', quality: 72, timeout: 180000 }); console.log('shot', name); };
  await shot('pal-after', { at: [4.6, 6.25], az: 0, dist: 12.8, t: 0 }); // same spot as pal-before.jpg (main, iso camera, the old colours)
  const C = [11, 9.4]; // the main street, middle of the ward
  await shot('corner-0', { at: C, az: 0, dist: 11, t: 0 });
  await shot('corner-90', { at: C, az: Math.PI / 2, dist: 11 });
  await shot('corner-180', { at: C, az: Math.PI, dist: 11 });
  await shot('corner-270', { at: C, az: -Math.PI / 2, dist: 11 });
  const S = { at: [26, 9.4], ry: Math.PI / 2, az: -Math.PI / 2, dist: 5 }; // east down the main street, past the island's edge (the Shwedagon band is that way)
  await shot('sky-afternoon', { ...S, t: 0 });
  await shot('sky-dusk', { ...S, t: 1 });
  await shot('sky-night', { ...S, t: 2 });
  await shot('edge-west', { at: [-3, 9.4], az: Math.PI / 2, dist: 15, t: 0 }); // looking west along the main street off the island
  await p.waitForTimeout(4000); // the hero .glb files
  console.log('heroes swapped', await p.evaluate(() => zone.W.scene.children.filter(c => c.type === 'Group' && c.children.some(m => m.isMesh && m.name && m.name.startsWith('sign-'))).length));
  await shot('hero-home', { at: [5.6, -2.6], az: Math.PI / 5, dist: 9, t: 0 });
  await shot('hero-home-back', { at: [5.6, -2.6], az: Math.PI - Math.PI / 5, dist: 11 });
  await shot('hero-tea', { at: [12.8, 32.5], az: Math.PI / 2 - .5, dist: 10 });
  await shot('hero-stalls', { at: [9.4, 17.2], az: .35, dist: 7 });
  // a phone held upright (375 × 740, touch): the HUD, the turn buttons, the joystick
  if (!ONLY.length || ONLY.includes('phone')) {
    const q = await b.newPage({ viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: true });
    q.on('pageerror', e => errs.push(e.message)); q.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await q.goto('http://localhost:8790/yangon.html?debug&q=low&dt=0.1'); await q.waitForFunction(() => window.zone, null, { timeout: 90000 });
    await q.addStyleTag({ url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Myanmar:wght@500;700&display=swap' }).catch(() => {});
    await q.waitForTimeout(6000); await q.screenshot({ path: OUT + 'phone.jpg', type: 'jpeg', quality: 72, timeout: 180000 }); console.log('shot phone');
  }
  console.log('errors', errs);
  await b.close();
})();
