// node docs/cloth/check.cjs [filter] [--fast] [--timing]   (serve the repo root on :8806: python3 -m http.server 8806)
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const arg = process.argv.slice(2), filter = arg.find(a => !a.startsWith('--')) || null, fast = arg.includes('--fast'), tim = arg.includes('--timing');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('http://localhost:8806/docs/cloth/check.html'); await p.waitForFunction('window.ready', null, { timeout: 120000 });
  if (tim) { console.log(JSON.stringify(await p.evaluate(() => window.timing()))); await b.close(); return; }
  const r = await p.evaluate(([f, fa]) => window.runAll(f, fa), [filter, fast]);
  console.log(`outfits ${r.outfits} poses ${r.poses} samples ${r.n}  max spine rot x ${r.maxSpine.x.toFixed(2)} y ${r.maxSpine.y.toFixed(2)} z ${r.maxSpine.z.toFixed(2)}`);
  for (const [k, w] of Object.entries(r.worst).sort((a, c) => a[1].slack - c[1].slack)) console.log(k.padEnd(28), 'worst slack', w.slack.toFixed(4), w.at);
  const rows = Object.entries(r.byPose).sort((a, c) => a[1].worst - c[1].worst);
  console.log('failing samples', r.nFail, 'in', rows.length, 'groups (kind|bottom|pose: count, worst slack, where)');
  for (const [k, w] of rows.slice(0, +(process.env.ROWS || 30))) console.log(' ', k.padEnd(34), String(w.n).padStart(4), w.worst.toFixed(4), w.at);
  r.fails.length = r.nFail;
  console.log('console errors', errs.length, errs.slice(0, 3)); console.log(r.fails.length === 0 && !errs.length ? 'ALL PASS' : 'FAIL');
  await b.close(); process.exit(r.fails.length || errs.length ? 1 : 0);
})();
