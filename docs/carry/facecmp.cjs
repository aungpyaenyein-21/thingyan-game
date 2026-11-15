// T6.5: the default faces must not change. Every cast member × every expr × mouth the loops use, painted on main and on this branch,
// compared as canvas pixels (regress.cjs only sees bones). run: main on :8791, branch on :8798 → node docs/carry/facecmp.cjs [mainPort] [branchPort]
// Meant to differ: U Tin Maung's (normal, smile) — his base face is `joy` now (T6.5).
const { chromium } = require('playwright');
async function sample(b, port) {
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://localhost:${port}/cast.html`); await p.waitForFunction(() => window.cast?.all?.length);
  const out = await p.evaluate(() => {
    const res = {};
    for (const c of cast.all) for (const expr of ['normal', 'blink', 'happy', 'squint']) for (const mouth of ['smile', 'open', 'o']) {
      c.anim.T = 1; c.ch.faceKey = ''; const pose = { ...c.anim.out, expr, mouth }; c.anim.hitT = 0; c.anim._apply(pose, .2); c.anim._apply(pose, .2); /* twice: the first may show a blink-cut */
      res[c.def.id + ' ' + expr + ' ' + mouth] = c.ch.face.material.map.image.toDataURL();
    }
    return res;
  });
  await p.close(); return { out, errs };
}
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const A = await sample(b, +process.argv[2] || 8791), B = await sample(b, +process.argv[3] || 8798);
  const bad = [], meant = []; let n = 0;
  for (const k of Object.keys(A.out)) { n++; if (A.out[k] !== B.out[k]) (k === 'utinmaung normal smile' ? meant : bad).push(k); }
  console.log(`faces compared: ${n} · differing: ${bad.length} · meant to differ: ${meant.length}`); if (bad.length) console.log(bad.slice(0, 20));
  console.log('errors:', A.errs, B.errs); process.exitCode = bad.length || A.errs.length || B.errs.length ? 1 : 0; await b.close();
})();
