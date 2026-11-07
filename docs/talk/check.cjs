// T10 — the talk director (docs/plans/T10.md "Checks"), headless Chromium (swiftshader, ~1 fps: everything waits on game time)
//   scenes  today's 1-1 (home) and 1-2 (house-front lane) through the director: one screenshot per line, taken while the line types
//           (docs/talk/1-1-NN.jpg, 1-2-NN.jpg) + the shot each line got (kind, wall pull-in, fallback)
//   walls   every NPC who talks on day 1 (+ shop talks): ots / two / wide with the listener at all 8 snapped azimuths round them →
//           how often camCollide (or a room's walls) pulled the first choice in > 30 %, how often the fallback was taken, and what's left
//   tap     20 lines at 10 taps/s → talking off for everyone, no one-shot stuck, the follow camera back (no scene), talk context off
//   phone   375×667: one screenshot per shot kind (docs/talk/phone-<kind>.jpg) · console errors 0 (all parts)
// run: (cd the repo) python3 -m http.server 8799 &  node docs/talk/check.cjs   (ONLY=scenes,walls,tap,phone to run some; PORT=)
const { chromium } = require('playwright');
const path = require('path');
const OUT = __dirname, URL = `http://localhost:${process.env.PORT || 8799}/yangon.html`, Q = '&debug&dt=0.1';
const errs = [], ONLY = process.env.ONLY?.split(','), want = k => !ONLY || ONLY.includes(k);
const log = (...a) => console.log(...a);
const results = {};

(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  async function open(q, viewport = { width: 640, height: 400 }) {
    const ctx = await b.newContext({ viewport }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await p.goto(URL + '?' + q + Q); await p.waitForFunction(() => window.zone, null, { timeout: 180000 });
    return p;
  }
  const shot = (p, name) => p.screenshot({ path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 72, timeout: 180000 });
  // in the page: when a line has been up a moment (the cut has glided in, the text is still typing, the speaker's mouth is open),
  // freeze the world (W.paused: nothing ticks or draws) so the screenshot shows that frame
  const hook = p => p.evaluate(() => {
    const z = zone; window.__q = [];
    z.hud.onLine((name, text, o) => { if (o?.closed) return; window.__line = { t: z.W.time(), name, text, who: o?.who ?? null, voice: !!o?.voice, scene: z.story.playing, done: false }; });
    z.W.tick(() => {
      const L = window.__line; if (!L || L.done || z.W.paused) return;
      const sp = z.director.scene?.speaker, age = z.W.time() - L.t, m = sp?.anim.out.mouth, typing = z.hud.typing();
      const dur = (L.text?.length ?? 0) * .6 / 28; // ≈ how long it types (28 clusters/s, ~.6 of the characters start one)
      if (typing && (m === 'open' || m === 'o') && age >= Math.min(.4, dur * .5) || !typing && age >= .15 || age > 1.2) {
        L.done = true; Object.assign(L, { mouth: m ?? null, talking: !!sp?.anim.talking, typing, one: sp?.anim.one ?? null, shot: z.director.log.at(-1) ?? null, age: +age.toFixed(2) });
        window.__q.push(L); z.W.paused = true;
      }
    });
  });

  // ---------- 1. today's 1-1 and 1-2 through the director ----------
  if (want('scenes')) {
    log('1. scenes 1-1, 1-2');
    const p = await open('new'); await hook(p);
    const per = { '1-1': 0, '1-2': 0 }, lines = [];
    const t0 = Date.now();
    for (;;) {
      const s = await p.evaluate(() => ({ step: zone.S().step, playing: zone.story.playing, busy: zone.hud.busy(), paused: zone.W.paused, q: window.__q.splice(0) }));
      for (const L of s.q) {
        const sc = (L.scene || s.step).split(':')[0], n = String(++per[sc] || 1).padStart(2, '0');
        await shot(p, `${sc}-${n}`); await p.evaluate(() => { zone.W.paused = false; });
        L.file = `${sc}-${n}.jpg`; lines.push(L); log('  ', L.file, L.who, JSON.stringify(L.shot), 'mouth', L.mouth, 'typing', L.typing, 'gesture', L.one);
      }
      if (s.step === '1-3' && !s.playing) break;
      if (Date.now() - t0 > 1500e3) throw new Error('scenes: timeout ' + JSON.stringify(s));
      if (!s.busy && !s.playing && !s.paused) await p.evaluate(() => zone.next());
      await p.waitForTimeout(600);
    }
    results.scenes = lines;
    await p.context().close();
  }

  await b.close();
  log('console errors:', errs.length, errs.slice(0, 5));
  require('fs').writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
