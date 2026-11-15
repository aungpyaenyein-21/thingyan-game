// T6.5 migration proof: a code tic vs its tics/<name>.json twin (page opened with ?jsontics), same character, same seed, same frames.
// Bone rotations every 1/30 s for the whole tic, plus the events that are not bones: emit('lob'), prop parents, balloon visibility.
// run (branch on :8798): node docs/carry/ticcmp.cjs [port]
const { chromium } = require('playwright');
const port = +process.argv[2] || 8798, seed = `(() => { let s = 12345; Math.random = () => ((s = Math.imul(s ^ (s >>> 15), 2246822519) + 1013904223 | 0) >>> 0) / 4294967296; })();`;
const CASES = [['hero', 'bow', 2.4], ['maythu', 'note', 2.2], ['maythu', 'lob', 1.5]];
async function run(b, q) {
  const p = await b.newPage(); await p.addInitScript(seed); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto(`http://localhost:${port}/cast.html${q}`); await p.waitForFunction(() => window.cast?.all?.length); await p.evaluate(() => cast.ready);
  const out = await p.evaluate(CASES => {
    const res = {};
    for (const [id, tic, dur] of CASES) {
      const c = cast.all.find(c => c.def.id === id), ch = c.ch, a = c.anim, ev = [], fr = [];
      const rec = () => { const r = []; for (const o of [ch.hips, ch.spine, ch.head, ...ch.arms.flatMap(a => [a.sh, a.elbow, a.hand]), ...ch.legs.flatMap(l => [l.hip, l.knee, l.foot])]) r.push(...o.rotation.toArray().slice(0, 3)); r.push(ch.body.position.y, ch.body.position.x, ch.body.scale.y); return r; };
      const e0 = a.emit; a.emit = (t, o) => ev.push([t, fr.length]); a.setLoop('idle'); a.one = null; for (let i = 0; i < 20; i++) a.update(1 / 30);
      a.T = 0; a.phi = 0; a.seed = 1; a.play(tic);
      for (let i = 0; i < Math.ceil(dur * 30) + 2; i++) { a.update(1 / 30); const sp = ch.spine; fr.push({ r: rec(), bv: ch.balloon?.visible, book: ch.book?.parent === ch.spine, pen: ch.pencil?.parent === ch.arms[1].hand, face: ch.faceKey }); }
      a.emit = e0; res[tic] = { fr, ev, one: a.one, home: [ch.book?.parent === ch.arms[0].hand, ch.pencil?.parent === ch.head, ch.balloon?.visible] };
    }
    return res;
  }, CASES);
  await p.close(); return { out, errs };
}
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const A = await run(b, ''), B = await run(b, '?jsontics'); let fail = 0;
  for (const [, tic] of CASES) {
    const a = A.out[tic], j = B.out[tic]; let worst = 0, worstAt = 0, motion = 0;
    for (let i = 0; i < a.fr.length; i++) { let d = 0; a.fr[i].r.forEach((v, k) => d = Math.max(d, Math.abs(v - j.fr[i].r[k]))); if (d > worst) { worst = d; worstAt = i; }
      if (i) a.fr[i].r.forEach((v, k) => motion = Math.max(motion, Math.abs(v - a.fr[i - 1].r[k]))); }
    const bad = ['bv', 'book', 'pen', 'face'].map(k => a.fr.filter((f, i) => f[k] !== j.fr[i][k]).length);
    const same = JSON.stringify(a.ev) === JSON.stringify(j.ev), home = JSON.stringify(a.home) === JSON.stringify(j.home);
    console.log(`${tic}: frames ${a.fr.length} · worst bone diff ${worst.toFixed(4)} rad (frame ${worstAt}) · code tic's biggest 1-frame step ${motion.toFixed(4)} · balloon/book/pencil/face frames differing ${bad} · emit code ${JSON.stringify(a.ev)} json ${JSON.stringify(j.ev)} · props home after: ${home} · ended: ${a.one === null && j.one === null}`);
    if (worst > motion || bad.some(Boolean) || !home) fail++;
  }
  console.log('errors code:', A.errs, 'json:', B.errs); process.exitCode = fail || A.errs.length || B.errs.length ? 1 : 0; await b.close();
})();
