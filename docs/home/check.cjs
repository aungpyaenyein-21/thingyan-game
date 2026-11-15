// T15 — index.html redirects to yangon.html; yangon.html + labs still load; no 404s
// run: (cd the repo) python3 -m http.server 8802 &  node docs/home/check.cjs
const { chromium } = require('playwright');
const PORT = process.env.PORT || 8802, B = `http://localhost:${PORT}/`;
const fails = [], ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fails.push(m); };
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const open = async (url, wait) => {
    const p = await (await b.newContext({ viewport: { width: 640, height: 400 } })).newPage();
    p.logs = []; p.bad = [];
    p.on('console', m => m.type() === 'error' && p.logs.push(m.text())); p.on('pageerror', e => p.logs.push(e.message));
    p.on('response', r => r.status() >= 400 && p.bad.push(r.status() + ' ' + r.url()));
    p.navs = []; p.on('framenavigated', fr => fr === p.mainFrame() && p.navs.push(fr.url()));
    p.on('requestfailed', r => p.bad.push('FAILED ' + r.url()));
    await p.goto(B + url); if (wait) await wait(p); return p;
  };
  for (const [from, want] of [['', ['/yangon.html', '', '']], ['index.html?new&girl#x', ['/yangon.html', '?new&girl', '#x']]]) {
    const p = await open(from, p => p.waitForURL(/yangon\.html/, { timeout: 60000 }));
    const nav = p.navs.find(u => u.includes('yangon.html')), u = new URL(nav);
    ok(u.pathname + u.search + u.hash === want.join(''), `/${from} -> ${nav} (the game itself rewrites the address bar afterwards)`);
    await p.waitForLoadState('load', { timeout: 120000 }); await p.waitForTimeout(15000);
    ok(!p.bad.length, `no 404s (${p.bad.join(', ')})`);
    await p.context().close();
  }
  const p = await open('yangon.html?new&debug&dt=.2', p => p.waitForFunction(() => window.zone, null, { timeout: 180000 }));
  await p.waitForFunction(() => zone.S().step === 'pro', null, { timeout: 180000 });
  ok(true, 'yangon.html reaches the Prologue (step pro)');
  await p.screenshot({ path: __dirname + '/prologue.jpg', type: 'jpeg', quality: 70, timeout: 180000 });
  ok(!p.logs.length, 'console 0 ' + p.logs.join('|')); ok(!p.bad.length, 'no 404s ' + p.bad.join(', '));
  await p.context().close();
  for (const f of ['cast', 'camlab', 'carry-lab', 'diorama', 'character-lab', 'sound-test', 'war']) {
    const q = await open(f + '.html'); await q.waitForTimeout(8000);
    ok(!q.logs.length, `${f}.html console 0 ${q.logs.join('|')}`); ok(!q.bad.length, `${f}.html no 404s ${q.bad.join(', ')}`);
    await q.context().close();
  }
  await b.close(); console.log(fails.length ? 'FAILS ' + fails.length : 'ALL OK'); process.exit(fails.length ? 1 : 0);
})();
