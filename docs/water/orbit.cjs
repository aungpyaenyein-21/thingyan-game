// docs/water/orbit.cjs — T3 review: aiming with the orbit camera turned (pump aim line, balloon arc + ring) and the soak overlay at its cap
const { chromium } = require('playwright'); const OUT = __dirname + '/';
(async () => { const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 900, height: 560 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8792/war.html?mode=home&dt=.1&clock=900'); await p.waitForFunction(() => window.war?.kids, null, { timeout: 120000 });
  const game = async s => { const t0 = await p.evaluate(() => war.W.time()); await p.waitForFunction(t => war.W.time() > t, t0 + s, { timeout: 300000, polling: 200 }); };
  await game(.4);
  const stage = (wpn, turns) => p.evaluate(([wpn, turns]) => { const { kids, me, W } = war; window.E = kids.find(k => k.team === 'B'); for (const k of kids) if (k !== me) { k.state = 'wipe'; k.wipeT = 999; if (k !== E) k.c.g.position.set(k.c.g.position.x, 0, 8.4); }
    me.c.g.position.set(0, 0, -5.5); E.c.g.position.set(4.5, 0, -4.2); me.water = 3.5; war.setWeapon(wpn); for (let i = 0; i < turns; i++) W.orbit.rotate(1); }, [wpn, turns]);
  const pad = await p.locator('#fire').boundingBox(), cx = pad.x + pad.width / 2, cy = pad.y + pad.height / 2;
  for (const [wpn, turns, name] of [['pump', 2, 'orbit-pump-turned'], ['balloon', 3, 'orbit-balloon-turned']]) {
    await stage(wpn, turns); await game(1.2);
    await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx - 60, cy - 40, { steps: 4 }); await game(.6); // press and drag: aim the way the drag points (camera-relative)
    const az = await p.evaluate(() => +war.W.orbit.state.az.toFixed(2)); await p.screenshot({ path: OUT + name + '.jpg', quality: 72, type: 'jpeg' }); await p.mouse.up(); console.log(name, 'az', az);
  }
  await p.evaluate(() => { war.setWeapon('pump'); }); await p.evaluate(() => { const s = document.getElementById('sting'); window.__soak = 1; }); // max soak: as if six kids got your face
  await p.evaluate(() => { for (let i = 0; i < 40; i++) war.soak(war.me, { grit: 0, face: true, push: new war.W.THREE.Vector3(), at: war.me.c.g.position.clone().setY(1.2), from: null }); });
  await game(.2); await p.screenshot({ path: OUT + 'soak-cap.jpg', quality: 72, type: 'jpeg' });
  const o = await p.evaluate(() => ({ sting: document.getElementById('sting').style.opacity, film: document.getElementById('drown').style.opacity, filter: war.W.renderer.domElement.style.filter }));
  await p.keyboard.press('KeyF'); await game(.3); const w = await p.evaluate(() => ({ sting: document.getElementById('sting').style.opacity, film: document.getElementById('drown').style.opacity, filter: war.W.renderer.domElement.style.filter }));
  await p.screenshot({ path: OUT + 'soak-wiped.jpg', quality: 72, type: 'jpeg' });
  console.log('soak', JSON.stringify(o), 'after wipe', JSON.stringify(w), 'errs', errs); await b.close(); })();
