// T2 — ရက် ၁ mission ၄ ခု (ပုံးဆွဲ · ကြောင်ချော့ · မီးသီး · ဆိုင်းဘုတ်) + ဆိုင်ထဲ ဝင်/ထွက် + လှည့် ခလုတ် ကို orbit ကင်မရာနဲ့ စစ်
// mission တစ်ခုချင်း (စာမျက်နှာ အသစ်): save state ကို အဲဒီ အဆင့်ထား → ကစားသူကို spot နားပို့ → E prompt ပေါ်/မပေါ် → E → ဖွင့်လာတာ စစ်
// run: python3 -m http.server 8790 → node docs/camera/missions.cjs
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const open = async () => {
    const p = await b.newPage({ viewport: { width: 800, height: 560 } });
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await p.goto('http://localhost:8790/yangon.html?new&debug&q=low&dt=0.1'); await p.waitForFunction(() => window.zone, null, { timeout: 90000 });
    await p.waitForTimeout(2500); for (let i = 0; i < 4; i++) { await p.keyboard.press('KeyE'); await p.waitForTimeout(300); }
    return p;
  };
  const go = (p, k) => p.evaluate(k => { const W = zone.W, sp = zone.SPOTS.find(s => String(s.at).includes(k)), at = sp.at(); W.player.g.position.set(at.x + .3, W.ground(at.x, at.z), at.z + .3); W.snapCam(); return sp.label(); }, k);
  const prompt = p => p.evaluate(() => !document.getElementById('prompt').hidden && document.getElementById('ptext').textContent);
  const one = async (name, setup, key, after) => {
    const p = await open();
    await p.evaluate(setup => { const S = zone.S(); S.step = 'quests'; new Function('S', setup)(S); }, setup);
    const label = await go(p, key); await p.waitForTimeout(3500);
    const pr = await prompt(p); await p.keyboard.press('KeyE'); await p.waitForTimeout(3000);
    console.log(name.padEnd(10), '| spot:', label, '| prompt:', pr, '| after E:', JSON.stringify(await p.evaluate(after)));
    return p;
  };
  await (await one('ပုံးဆွဲ', "S.q.cloth = 'ask'", 'BUCKET_SPOT', () => ({ talking: zone.talking(), pulley: !!zone.pulley() }))).close();
  await (await one('ကြောင်ချော့', "S.q.cat = 'ask'", 'UNCLE', () => ({ talking: zone.talking(), cat: zone.cat() }))).close();
  await (await one('မီးသီး', "S.q.lights = 'fix'", 'L.LIGHTS', () => ({ talking: zone.talking(), bulbs: !!zone.bulbs() }))).close();
  await (await one('ဆိုင်းဘုတ်', "S.q.sign = 'ask'", 'L.BETEL', () => ({ talking: zone.talking() }))).close();
  // a shop: in (the camera locks at 0°, comes closer, no fog / sky), then out again, then the turn keys and buttons
  const p = await one('ဆိုင်ထဲ', '', 'L.BARBER', () => ({ locked: zone.W.orbit.state.locked, az: +zone.W.orbit.state.az.toFixed(3), dist: +zone.W.orbit.state.distGoal.toFixed(2), fog: !!zone.W.scene.fog, sky: zone.W.sky.group.visible }));
  await p.evaluate(() => { const W = zone.W, doors = zone.SPOTS.filter(s => { try { return s.label() === 'အပြင် ထွက်'; } catch { return false; } });
    const d = doors.map(s => s.at()).sort((a, b) => a.distanceTo(W.player.g.position) - b.distanceTo(W.player.g.position))[0]; W.player.g.position.set(d.x, W.ground(d.x, d.z), d.z); });
  await p.waitForTimeout(3500); await p.keyboard.press('KeyE'); await p.waitForTimeout(3000);
  console.log('ပြန်ထွက်'.padEnd(10), '|', JSON.stringify(await p.evaluate(() => ({ locked: zone.W.orbit.state.locked, dist: +zone.W.orbit.state.distGoal.toFixed(2), fog: !!zone.W.scene.fog, sky: zone.W.sky.group.visible }))));
  const az0 = await p.evaluate(() => zone.W.orbit.state.azGoal); await p.keyboard.press('KeyC'); await p.click('#rotl'); await p.click('#rotl');
  console.log('လှည့်'.padEnd(10), '| C, ⟲, ⟲ →', (await p.evaluate(() => zone.W.orbit.state.azGoal) - az0).toFixed(3), '(expect −0.785)');
  console.log('errors', errs);
  await b.close();
})();
