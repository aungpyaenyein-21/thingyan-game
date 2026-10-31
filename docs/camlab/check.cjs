const { chromium } = require('playwright');
// camlab.html ကို headless Chromium (Playwright) နဲ့ စစ်ပြီး docs/camlab/*.jpg screenshot ထုတ်
// run:  python3 -m http.server 8790  (repo root မှာ)  →  node docs/camlab/check.cjs
// software GPU (SwiftShader) မှာ frame နှေးလို့ lab.advance() နဲ့ render မလုပ်ဘဲ ကမ္ဘာကို ရှေ့တိုးပြီးမှ ရိုက်
const path = require('path'), S = path.join(__dirname, '/');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const run = async (vp, fn) => {
    const p = await b.newPage({ viewport: vp, hasTouch: vp.width < 600, isMobile: vp.width < 600 });
    const logs = []; p.on('console', m => { if (m.type() !== 'log') logs.push(`[${m.type()}] ${m.text()}`); }); p.on('pageerror', e => logs.push('[pageerror] ' + e.message));
    await p.goto('http://localhost:8790/camlab.html' + (vp.width < 600 ? '?joy' : ''));
    await p.waitForFunction(() => window.lab, null, { timeout: 60000 });
    await p.evaluate(() => Promise.all([lab.physicsReady, lab.shopReady]));
    await fn(p); console.log('console:', [...new Set(logs)].join('\n')); await p.close();
  };
  const ev = (p, f, a) => p.evaluate(f, a), wait = (p, ms) => p.waitForTimeout(ms);
  const shot = async (p, n) => { await wait(p, 400); await p.screenshot({ path: S + n + '.jpg', type: 'jpeg', quality: 72 }); };
  await run({ width: 1000, height: 700 }, async p => {
    await ev(p, () => { lab.camS.distGoal = 5.5; lab.snap(); lab.advance(.5); }); await shot(p, '1-rot-a');
    await ev(p, () => { lab.rotate(1); lab.rotate(1); lab.rotate(1); lab.advance(1.5); }); await shot(p, '2-rot-b');
    await ev(p, () => { lab.camS.azGoal = -Math.PI / 4; lab.camS.distGoal = 9; lab.place(0, .3, Math.PI / 2); lab.snap(); lab.throwBowl(); lab.advance(1.2); });
    await shot(p, '3a-bowl-air'); await ev(p, () => lab.advance(1.5));
    console.log('throw:', await ev(p, () => [lab.bowlMsg, lab.bowlPos]));
    for (let i = 0; i < 4; i++) { await ev(p, () => lab.advance(3)); const r = await ev(p, () => [lab.bowlMsg, lab.bowlPos]); console.log('drift', i, r[0], r[1] && [r[1].x.toFixed(2), r[1].z.toFixed(2)]); }
    await ev(p, () => { lab.camS.azGoal = -Math.PI / 4; lab.place(4.6, 2.2, Math.PI / 2); lab.snap(); }); await shot(p, '3c-bowl-pole');
    // rail + balloons
    let fell = false;
    for (let k = 0; k < 8 && !fell; k++) {
      await ev(p, () => { lab.bowlBack(); lab.place(-.2, -1.9, Math.PI / 2); lab.camS.azGoal = -Math.PI / 4; lab.camS.distGoal = 8; lab.snap(); lab.bowlOnRail(); lab.advance(1); lab.dropBalloons(10); lab.advance(.35); });
      if (k === 0) await shot(p, '4-balloons');
      await ev(p, () => lab.advance(2.5)); const m = await ev(p, () => lab.bowlMsg); console.log('rail try', k, m);
      if (m.includes('ချောင်း')) { fell = true; await shot(p, '5-rail-fall'); }
    }
    // NPCs
    await ev(p, () => { lab.bowlBack(); lab.place(0, 3.5, Math.PI); lab.camS.azGoal = 0; lab.camS.distGoal = 21; lab.snap(); lab.showNav(true); lab.sendNpcs(-8, -9.4); lab.advance(2.2); });
    await shot(p, '6-npc-path'); await ev(p, () => lab.advance(12));
    console.log('npcs at', await ev(p, () => lab.npcs.map(n => [n.ch.root.position.x.toFixed(1), n.ch.root.position.z.toFixed(1), !!n.path])));
    await ev(p, () => { lab.place(-8, -10.6, Math.PI); lab.camS.azGoal = Math.PI / 2; lab.camS.distGoal = 12; lab.snap(); lab.showNav(false); }); 
    // shop
    await ev(p, () => { lab.place(4.5, 5.2, 0); lab.camS.azGoal = Math.PI - Math.PI / 4; lab.camS.distGoal = 10; lab.snap(); lab.advance(.3); }); await shot(p, '7-shop-front');
    await ev(p, () => { lab.place(4.5, 11.6, Math.PI); lab.camS.azGoal = Math.PI / 4; lab.snap(); lab.advance(.3); }); await shot(p, '8-shop-back');
    // occlusion
    await ev(p, () => { lab.place(-8, -8.2, Math.PI); lab.camS.azGoal = 0; lab.camS.distGoal = 10; lab.snap(); }); await wait(p, 3000); console.log('fades', JSON.stringify(await ev(p, () => lab.fades()))); await shot(p, '9-fade');
    console.log('timings', JSON.stringify(await ev(p, () => [lab.timings, lab.fps, lab.tickMs, lab.info])));
  });
  await run({ width: 375, height: 740 }, async p => {
    await wait(p, 1500); await shot(p, '10-phone');
    const j = await p.locator('#joy').boundingBox(); const z0 = await ev(p, () => lab.player.ch.root.position.z);
    await p.mouse.move(j.x + 58, j.y + 58); await p.mouse.down(); await p.mouse.move(j.x + 58, j.y + 5, { steps: 4 }); await wait(p, 1500); await p.mouse.up();
    console.log('joystick moved z', z0, '->', await ev(p, () => lab.player.ch.root.position.z));
    const az0 = await ev(p, () => lab.camS.azGoal);
    await p.mouse.move(150, 300); await p.mouse.down(); await p.mouse.move(260, 305, { steps: 6 }); await p.mouse.up(); await wait(p, 600);
    console.log('drag az', az0, '->', await ev(p, () => lab.camS.azGoal));
    await p.mouse.click(120, 260); await wait(p, 300); console.log('tap:', await ev(p, () => [document.getElementById('status').textContent, lab.npcs.map(n => !!n.path)]));
    await ev(p, () => lab.dropBalloons(10)); await wait(p, 500);
    console.log('phone', JSON.stringify(await ev(p, () => [lab.fps, lab.tickMs, lab.info])));
  });
  await b.close();
})();
