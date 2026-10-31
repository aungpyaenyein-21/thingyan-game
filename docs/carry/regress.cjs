// cast.html regression (T4): every character × every loop / one-shot / own tic, posed with the same random seed on main and on this branch;
// bone rotations must match exactly. run: main worktree served on :8791, this branch on :8790 → node docs/carry/regress.cjs
const { chromium } = require('playwright');
const seed = `(() => { let s = 12345; Math.random = () => ((s = Math.imul(s ^ (s >>> 15), 2246822519) + 1013904223 | 0) >>> 0) / 4294967296; })();`;
async function sample(b, port) {
  const p = await b.newPage(); await p.addInitScript(seed);
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto(`http://localhost:${port}/cast.html`); await p.waitForFunction(() => window.cast?.all?.length);
  const out = await p.evaluate(() => {
    const res = {}, LOOPS = ['idle', 'walk', 'run', 'dance', 'sit', 'eat', 'vend', 'squat', 'ready', 'push', 'carry', 'cycle', 'coast'];
    const ONES = ['jump', 'splash', 'squirt', 'shake', 'wave', 'kadaw', 'kick', 'laugh', 'call', 'sitdown', 'standup', 'bow', 'lift', 'note', 'lob', 'whistle', 'towel', 'goggles', 'shrug', 'scold', 'ring'];
    const rec = c => { const ch = c.ch, r = []; for (const o of [ch.hips, ch.spine, ch.head, ...ch.arms.flatMap(a => [a.sh, a.elbow, a.hand]), ...ch.legs.flatMap(l => [l.hip, l.knee, l.foot])]) r.push(...o.rotation.toArray().slice(0, 3).map(v => +v.toFixed(5))); r.push(+ch.body.position.y.toFixed(5)); return r; };
    for (const c of cast.all) {
      const id = c.def.id, tics = [...LOOPS.map(l => 'loop:' + l), ...ONES, ...c.def.acts.map(a => 'act:' + a[0])];
      for (const t of tics) {
        c.anim.setLoop('idle'); c.anim.one = null; for (let i = 0; i < 20; i++) c.anim.update(1 / 30);
        c.anim.T = 0; c.anim.phi = 0; c.anim.seed = 1;
        if (t.startsWith('loop:')) c.anim.setLoop(t.slice(5)); else if (t.startsWith('act:')) c.act(t.slice(4)); else c.anim.play(t);
        const frames = []; for (let i = 0; i < 24; i++) { c.anim.update(1 / 30); if (i % 6 === 5) frames.push(rec(c)); }
        res[id + ' ' + t] = frames;
      }
    }
    return res;
  });
  await p.close(); return { out, errs };
}
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const A = await sample(b, 8791), B = await sample(b, 8790);
  let n = 0, worst = 0; const bad = [];
  for (const k of Object.keys(A.out)) { n++; const a = A.out[k].flat(), c = (B.out[k] || []).flat(); let d = a.length === c.length ? 0 : 99; for (let i = 0; i < a.length && d < 99; i++) d = Math.max(d, Math.abs(a[i] - c[i])); worst = Math.max(worst, d); if (d > 1e-4) bad.push([k, d.toFixed(4)]); }
  console.log(`tics compared: ${n} · worst diff ${worst.toExponential(2)} · differing: ${bad.length}`); if (bad.length) console.log(bad.slice(0, 20));
  console.log('errors main:', A.errs, 'branch:', B.errs);
  await b.close();
})();
