// T13 — restart + scene picker, headless Chromium (swiftshader, ~1 fps, ?dt=.2)
//   restart  mid-Scene-B + custom name/look/parts → ⚙ → 「အစက ပြန်စ」 → confirm → step 'pro', parts/got/night empty, name + look kept, no ?new left
//   cancel   the confirm's 「မလုပ်တော့ဘူး」 → the save bytes are identical, no reload
//   picker   the list has the day header + 4 buttons; each reaches its step (S.step after load)
//   girl     ?girl survives a restart
//   again    the wip card's 「အစက ပြန်ကြည့်」 restarts the same way (hero kept)
//   phone    375×667: buttons ≥ 40px tall, no horizontal overflow · screenshots: menu, confirm, picker (desktop + phone)
// run: (cd the repo) python3 -m http.server 8800 &  node docs/restart/check.cjs   (PORT=)
const { chromium } = require('playwright');
const path = require('path');
const OUT = __dirname, URL = `http://localhost:${process.env.PORT || 8800}/yangon.html`, Q = '&debug&dt=0.2&q=low';
const errs = [], fails = [], ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fails.push(m); };
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ready = p => p.waitForFunction(() => window.zone && !window.__old, null, { timeout: 180000 });
  async function open(q, viewport = { width: 800, height: 450 }, touch = false) {
    const ctx = await b.newContext({ viewport, ...(touch ? { hasTouch: true, isMobile: true } : {}) }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await p.goto(URL + '?' + q + Q); await ready(p); return p;
  }
  const click = (p, id) => p.evaluate(id => document.getElementById(id).click(), id);
  const reload = async (p, id) => { await p.evaluate(() => { window.__old = 1; }); await click(p, id); await ready(p); };
  const shot = (p, n) => p.screenshot({ path: path.join(OUT, n + '.jpg'), type: 'jpeg', quality: 72, timeout: 180000 });
  const st = p => p.evaluate(() => { const s = zone.S(); return { step: s.step, name: s.name, hair: s.look.hair, parts: s.parts.length, got: s.got.length, night: s.night.length, girl: s.girl, saved: localStorage.getItem('thingyan.v6'), search: location.search }; });
  const reach = async (p, tag) => { for (const id of ['redo', 'scn']) { const r = await p.evaluate(id => { const e = document.getElementById(id), b = e.getBoundingClientRect(); return { w: b.width, h: b.height, inside: b.left >= 0 && b.top >= 0 && b.right <= innerWidth && b.bottom <= innerHeight, top: document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2) === e }; }, id); ok(r.w > 0 && r.h > 0 && r.inside && r.top, `${tag}: #${id} visible, inside the viewport, not covered`); } };
  const seed = p => p.evaluate(() => { const s = zone.S(); Object.assign(s, { name: 'Kyaw', look: { ...s.look, hair: 'long' }, parts: ['floor'], got: ['x'], night: ['yes'], step: '1-2' }); localStorage.setItem('thingyan.v6', JSON.stringify(s)); });

  console.log('restart');
  let p = await open('day=1&step=1-2&girl'); await seed(p);
  await click(p, 'redo'); ok(await p.evaluate(() => !document.getElementById('confirm').hidden), 'confirm opens');
  await shot(p, 'confirm-desktop');
  await click(p, 'cno'); const a = await st(p);
  ok(await p.evaluate(() => document.getElementById('confirm').hidden) && a.saved.includes('"Kyaw"') && a.saved.includes('"1-2"'), 'cancel: panel closed, save untouched');
  await click(p, 'redo'); await reload(p, 'cyes'); const r = await st(p);
  ok(r.step === 'pro', 'restart → step pro'); ok(!r.parts && !r.got && !r.night, 'parts/got/night empty');
  ok(r.name === 'Kyaw' && r.hair === 'long', 'name + look kept'); ok(r.girl === true, '?girl survives'); ok(!/new/.test(r.search) && /girl/.test(r.search), 'URL keeps girl, no ?new: ' + r.search);

  console.log('picker + again + phone');
  p = await open('day=1&step=wip', { width: 375, height: 667 }, true);
  await click(p, 'ewalk');
  await p.evaluate(() => document.getElementById('opt').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  await reach(p, 'phone'); await shot(p, 'menu-phone');
  await click(p, 'scn'); await shot(p, 'picker-phone');
  const pk = await p.evaluate(() => ({ head: document.getElementById('phead').textContent, btns: [...document.querySelectorAll('#plist button')].map(b => ({ id: b.dataset.step, h: b.getBoundingClientRect().height })), ow: document.documentElement.scrollWidth > innerWidth }));
  ok(pk.head === 'ရက် ၁' && pk.btns.map(x => x.id).join() === 'pro,1-1,1-2,wip', 'header + 4 steps: ' + pk.head);
  ok(pk.btns.every(x => x.h >= 40) && !pk.ow, 'phone: buttons ≥ 40px, no horizontal overflow');
  await click(p, 'redo'); await shot(p, 'confirm-phone');
  for (const id of ['pro', '1-1', '1-2', 'wip']) {
    await click(p, 'scn'); await p.evaluate(() => { window.__old = 1; }); await p.evaluate(id => document.querySelector(`#plist button[data-step="${id}"]`).click(), id); await ready(p);
    const s = await st(p); ok(s.step === id, `picker → ${id} (S.step=${s.step})`);
  }
  p = await open('day=1&step=wip'); await seed(p); await p.evaluate(() => { zone.S().step = 'wip'; });
  await reload(p, 'eagain'); const g = await st(p); ok(g.step === 'pro' && g.name === 'Kyaw' && g.hair === 'long', 'wip card restart: pro, hero kept');

  p = await open('day=1&step=wip'); await click(p, 'ewalk');
  await reach(p, 'desktop'); await shot(p, 'menu-desktop');
  ok(await p.evaluate(() => document.getElementById('hintr').hidden), 'day 1 help line has no R part');
  await click(p, 'scn'); await shot(p, 'picker-desktop');

  ok(errs.length === 0, 'console errors: ' + errs.length + (errs.length ? ' ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close(); console.log(fails.length ? 'FAILED ' + fails.length : 'ALL PASS'); process.exit(fails.length ? 1 : 0);
})();
