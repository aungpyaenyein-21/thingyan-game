const { chromium } = require('playwright');
const q = process.argv[2] ?? '', tag = process.argv[3] || 'x', OUT = process.argv[4] || require('path').join(__dirname, '/');
(async () => { const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 800, height: 560 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.addInitScript(() => { try { localStorage.clear(); } catch {} });
  await p.goto(`http://localhost:8790/yangon.html?new&debug&dt=0.1${q ? '&q=' + q : ''}`); await p.waitForFunction(() => window.zone, null, { timeout: 120000 });
  await p.waitForTimeout(2500); for (let i = 0; i < 4; i++) { await p.keyboard.press('KeyE'); await p.waitForTimeout(300); }
  const set = (o) => p.evaluate(o => { const W = zone.W, P = W.player.g.position; if (o.at) { P.set(o.at[0], W.ground(o.at[0], o.at[1]), o.at[1]); }
    if (o.az !== undefined) W.orbit.state.azGoal = o.az; if (o.dist) W.orbit.state.distGoal = o.dist; if (o.t !== undefined) W.setTime(o.t);
    if (o.talk) { const who = W.chars.find(c => c !== W.player && c.g.position.distanceTo(P) < 6) ?? W.chars.find(c => c !== W.player); W.talkWith = who; W.frozen = true; } else { W.talkWith = null; W.frozen = false; }
    W.snapCam(); return { dist: W.orbit.state.dist, el: W.orbit.state.el, ctx: [...W.orbit.state.ctx] }; }, o);
  const shot = async (name, o) => { const s = await set(o); await p.waitForTimeout(3500); await p.screenshot({ path: OUT + name + '-' + tag + '.jpg', type: 'jpeg', quality: 72, timeout: 180000 }); console.log('shot', name, JSON.stringify(s));
    if (o.probe) console.log(JSON.stringify(await p.evaluate(pts => { const W = zone.W, T = W.THREE, ray = new T.Raycaster(); W.cam.updateMatrixWorld(); return { cam: W.cam.position.toArray().map(v => +v.toFixed(1)), hits: pts.map(([x, y]) => { ray.setFromCamera(new T.Vector2(x, y), W.cam);
      return [x, y, ray.intersectObjects(W.scene.children, true).slice(0, 3).map(h => { const m = Array.isArray(h.object.material) ? h.object.material[0] : h.object.material; let vis = true; for (let q = h.object; q; q = q.parent) vis = vis && q.visible;
        return `${h.distance.toFixed(1)}m ${h.object.type}/${m?.type} ${m?.color?.getHexString()} op${m?.opacity} vis${vis} ${h.object.name}|${h.object.parent?.name}`; })]; }) }; }, o.probe))); };
  await shot('stop-d66', { at: [2.6, 6.2], az: 3.93, dist: 6.6, t: 0 });
  await shot('talk', { at: [2.6, 6.2], az: 3.93, t: 0, talk: true });
  await shot('night-d66', { at: [2.6, 6.2], az: 3.93, dist: 6.6, t: 2, probe: [[-.75, .55], [-.72, .4], [-.68, .2], [-.7, -.3], [-.65, -.6], [-.8, 0]] });
  console.log('errs', errs.slice(0, 5)); await b.close(); })();
