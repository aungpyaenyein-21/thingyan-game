// T17 — landscape on phones, headless Chromium (swiftshader, ?dt=.2)
//   card     portrait phone → #rot visible; 「ရပြီ」 closes; rotate to landscape → gone, and doesn't return rotating back
//            landscape at launch → no card · desktop → no card · lock attempt (stubbed, rejecting) logs nothing
//   layout   667×375 + 844×390: Scene A line, Scene B line, ⚙ menu, wip card, ⚙ restart picker — every visible HUD control inside the viewport, no two overlap
//   manifest orientation 'landscape'
// run: (cd the repo) python3 -m http.server 8805 &  node docs/landscape/check.cjs   (PORT=)
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const OUT = __dirname, URL = `http://localhost:${process.env.PORT || 8805}/yangon.html`, Q = '&debug&dt=0.2&q=low';
const errs = [], fails = [], ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fails.push(m); };
const LOCK = () => { window.__lock = 0; try { Object.defineProperty(navigator, 'standalone', { get: () => true }); } catch (e) {} const o = screen.orientation; if (o) o.lock = () => { window.__lock++; return Promise.reject(new Error('NotSupportedError')); }; };
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ready = p => p.waitForFunction(() => window.zone, null, { timeout: 180000 });
  async function open(q, viewport, touch = true, lock = false) {
    const ctx = await b.newContext({ viewport, ...(touch ? { hasTouch: true, isMobile: true } : {}) }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    if (lock) await p.addInitScript(LOCK);
    await p.goto(URL + '?' + q + Q); await ready(p); return p;
  }
  const shot = (p, n) => p.screenshot({ path: path.join(OUT, n + '.jpg'), type: 'jpeg', quality: 72, timeout: 180000 });
  const rotVis = p => p.evaluate(() => { const r = document.getElementById('rot'); return !r.hidden && r.getBoundingClientRect().width > 0; });
  const click = (p, id) => p.evaluate(id => document.getElementById(id).click(), id);

  // every visible HUD control: inside the viewport, no two overlapping
  const IDS = ['goal', 'where', 'opt', 'opts', 'splash', 'jump', 'tool', 'rotl', 'rotr', 'stick', 'prompt', 'dlg', 'toast', 'end', 'confirm', 'pick', 'mini', 'menu', 'upd', 'inst'];
  const hud = (p, tag, extra = []) => p.evaluate(([ids, tag]) => {
    const vw = innerWidth, vh = innerHeight, boxes = [];
    for (const id of ids) {
      const e = document.getElementById(id); if (!e) continue;
      const cs = getComputedStyle(e); if (e.hidden || cs.display === 'none' || cs.visibility === 'hidden') continue;
      if (id === 'opts' && cs.display === 'contents') continue;
      const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
      boxes.push({ id, l: r.left, t: r.top, r: r.right, b: r.bottom });
    }
    if (document.body.classList.contains('opts')) for (const e of document.querySelectorAll('#opts>button')) { const cs = getComputedStyle(e), r = e.getBoundingClientRect(); if (cs.display !== 'none' && !e.hidden && r.width > 1) boxes.push({ id: '#' + e.id, l: r.left, t: r.top, r: r.right, b: r.bottom, child: 1 }); }
    const out = boxes.filter(x => x.l < -0.5 || x.t < -0.5 || x.r > vw + 0.5 || x.b > vh + 0.5).map(x => `${x.id} outside (${x.l | 0},${x.t | 0},${x.r | 0},${x.b | 0}) of ${vw}x${vh}`);
    const hit = [];
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], c = boxes[j]; if (a.id === '#opts' || c.id === 'opts' || (a.id === 'opts' && c.child) || (c.id === 'opts' && a.child)) continue;
      if (a.l < c.r - 1 && c.l < a.r - 1 && a.t < c.b - 1 && c.t < a.b - 1) hit.push(`${a.id} x ${c.id}`);
    }
    return { n: boxes.map(x => x.id).join(','), out, hit };
  }, [IDS, tag]);
  const layout = async (p, tag) => { const r = await hud(p, tag); ok(r.out.length === 0 && r.hit.length === 0, `${tag}: ${r.n} — inside the viewport, no overlap ${r.out.concat(r.hit).join('; ')}`); };
  const waitDlg = p => p.waitForFunction(() => !document.getElementById('dlg').hidden && document.getElementById('dtext').textContent.length > 3, null, { timeout: 180000 });
  const tap = p => p.evaluate(() => document.getElementById('dlg').click());

  console.log('manifest');
  ok(JSON.parse(fs.readFileSync(path.join(OUT, '../../manifest.webmanifest'))).orientation === 'landscape', 'orientation landscape');

  console.log('card');
  let p = await open('day=1&step=1-1', { width: 375, height: 667 }, true, true);
  ok(await rotVis(p), 'portrait phone: card visible'); await shot(p, 'card-portrait');
  await p.mouse.click(30, 30); /* first gesture: the lock attempt */
  ok(await p.evaluate(() => window.__lock) >= 1, 'first gesture tried the lock (stub, standalone)');
  await click(p, 'rotx'); ok(!(await rotVis(p)), '「ရပြီ」 closes');
  await p.setViewportSize({ width: 667, height: 375 }); await p.setViewportSize({ width: 375, height: 667 });
  ok(!(await rotVis(p)), 'closed card does not return');
  await p.context().close();
  p = await open('day=1&step=1-1', { width: 375, height: 667 }, true);
  ok(await rotVis(p), 'new portrait launch: card visible');
  ok(await p.evaluate(() => { const r = document.getElementById('rot'), b = r.getBoundingClientRect(); return b.width === innerWidth && b.height === innerHeight && getComputedStyle(r).zIndex >= 10 && document.elementFromPoint(5, 5) === r; }), 'card is a full-screen modal backdrop on top');
  await p.mouse.click(5, 5); ok(!(await rotVis(p)), 'tapping the backdrop closes it');
  await p.context().close();
  p = await open('day=1&step=1-1', { width: 375, height: 667 }, true); await p.waitForTimeout(300);
  await p.setViewportSize({ width: 667, height: 375 }); await p.waitForFunction(() => document.getElementById('rot').hidden, null, { timeout: 20000 });
  ok(!(await rotVis(p)), 'rotate to landscape: card gone');
  await p.setViewportSize({ width: 375, height: 667 }); await p.waitForTimeout(500);
  ok(!(await rotVis(p)), 'rotate back: not shown again');
  await p.context().close();
  p = await open('day=1&step=1-1', { width: 667, height: 375 }, true, true);
  ok(!(await rotVis(p)), 'landscape at launch: no card');
  await p.mouse.click(300, 200); ok(await p.evaluate(() => window.__lock) >= 1, 'landscape: lock attempted, silently'); await p.context().close();
  p = await open('day=1&step=1-1', { width: 1280, height: 800 }, false);
  ok(!(await rotVis(p)), 'desktop: no card'); await p.context().close();
  p = await open('day=1&step=1-1', { width: 700, height: 900 }, false);
  ok(!(await rotVis(p)), 'narrow desktop (pointer fine): no card'); await p.context().close();

  for (const [w, h] of [[667, 375], [844, 390]]) {
    const tag = `${w}x${h}`;
    console.log('layout ' + tag);
    p = await open('day=1&step=1-1', { width: w, height: h }, true);
    await waitDlg(p); await layout(p, tag + ' Scene A line'); await shot(p, `A-${tag}`);
    await p.context().close();
    p = await open('day=1&step=1-2', { width: w, height: h }, true);
    await waitDlg(p); const first = await p.evaluate(() => document.getElementById('dname').textContent);
    for (let i = 0; i < 12; i++) { const n = await p.evaluate(() => document.getElementById('dname').textContent); if (n && n !== first) break; await tap(p); await p.waitForTimeout(400); await waitDlg(p); }
    await layout(p, tag + ' Scene B gang line'); await shot(p, `B-${tag}`);
    await p.context().close();
    p = await open('day=1&step=wip', { width: w, height: h }, true);
    await p.waitForFunction(() => !document.getElementById('end').hidden, null, { timeout: 180000 });
    await layout(p, tag + ' wip card'); await shot(p, `wip-${tag}`);
    await click(p, 'ewalk'); await p.waitForTimeout(500);
    await layout(p, tag + ' walking HUD');
    await p.evaluate(() => document.getElementById('opt').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
    await layout(p, tag + ' ⚙ menu'); await shot(p, `menu-${tag}`);
    await click(p, 'scn'); await layout(p, tag + ' scene picker'); await shot(p, `picker-${tag}`);
    await click(p, 'pno');
    await p.evaluate(() => document.getElementById('opt').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
    await click(p, 'redo'); await layout(p, tag + ' restart confirm'); await shot(p, `confirm-${tag}`);
    await p.context().close();
  }
  ok(errs.length === 0, 'console errors: ' + errs.length + (errs.length ? ' ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close();
  console.log(fails.length ? 'FAILED ' + fails.length : 'ALL PASS'); process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
