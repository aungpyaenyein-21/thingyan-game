// T16 — mood + addressee (docs/plans/T16.md), headless Chromium (swiftshader; everything waits on game time, ?dt=)
//   flow     ?new&autotalk (the old reading pace): at every one of the 31 lines, +1 s after it opens — the speaker's body / head faces `to` (TURNS loops: body ≤ 25°,
//            head ≤ 25°; others: head ≤ 35°), every visible cast member within 8 m looks at the speaker (head ≤ 30°, body ≤ 30° in a TURNS loop), the camera sees the
//            speaker's face (≤ 1.35 rad off its front) — and every tick, each idle character's painted face (no overlay / wet / one-shot) matches the mood table
//   restore  ?day=1&step=1-2: the four who know are `sad`, Phoe Kyaw is not · a reload mid-scene · the moods at wip are ok · wet wins and the mood comes back
//   wait     no ?autotalk: a line is still up after 15 s of game time with no input; one E press (typing finished) moves to the next
//            (people the camera has left out of frame are not animated by world.js, so they are not counted)
//   screenshots: lines 3, 9, 19 (Phoe Kyaw), 23, 25 → docs/mood/*.jpg
//   ots      three viewports (800x450, 375x667, 667x375), zone.fast: at every ots shot the listener's head box ≤ 18% of the viewport, off the speaker's head box;
//            no shot's line of sight to the speaker is blocked (talk.js clear()); line23-phone / -landscape / -desktop screenshots
// run: (repo root) python3 -m http.server 8804 &  node docs/mood/check.cjs   (ONLY=flow,ots,restore,wait; PORT=)
const { chromium } = require('playwright');
const path = require('path');
const OUT = __dirname, URL = `http://localhost:${process.env.PORT || 8804}/yangon.html`;
const DT = process.env.DT || '0.2', Q = '&debug&q=low&dt=' + DT;
const errs = [], ONLY = process.env.ONLY?.split(','), want = k => !ONLY || ONLY.includes(k);
const log = (...a) => console.log(...a);
const fails = [], ok = (c, m) => { log(c ? '  ok  ' : '  FAIL', m); if (!c) fails.push(m); };
const SHOTS = { 3: 'line03-hero-sad', 9: 'line09-hero-pout', 19: 'line19-phoekyaw-arrives', 23: 'line23-chocho-to-phoekyaw', 25: 'line25-everyone-ok' };

(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  async function open(q, viewport = { width: 640, height: 400 }) {
    const ctx = await b.newContext({ viewport }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await p.goto(URL + '?' + q + Q); await p.waitForFunction(() => window.zone, null, { timeout: 180000 });
    return p;
  }
  const shot = (p, name) => p.screenshot({ path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 72, timeout: 180000 });
  const S = p => p.evaluate(() => ({ step: zone.S().step, t: +zone.W.time().toFixed(1), playing: zone.story.playing, busy: zone.hud.busy(), paused: zone.W.paused, end: !document.getElementById('end').hidden, q: window.__q?.splice(0) ?? [] }));
  async function drive(p, stop, limitS = 3000) {
    const t0 = Date.now();
    for (;;) {
      const s = await S(p);
      for (const name of s.q) { await shot(p, name); await p.evaluate(() => { zone.W.paused = false; }); log('   shot', name); }
      if (stop(s)) return s;
      if (Date.now() - t0 > limitS * 1e3) throw new Error('timeout ' + JSON.stringify(s));
      if (!s.busy && !s.playing && !s.paused && !s.end) await p.evaluate(() => zone.next());
      await p.waitForTimeout(500);
    }
  }
  // in the page: sample every line (+1 s) and the faces every tick
  const hook = (p, shots = {}) => p.evaluate(shots => {
    const z = zone, W = z.W, P = z.people, V = W.THREE.Vector3, TURNS = ['idle', 'shoulder', 'handsback', 'munch'];
    const R = window.__R = { lines: [], mood: { checks: 0, bad: [] } }; window.__q = [];
    const wrap = a => Math.atan2(Math.sin(a), Math.cos(a)), deg = r => Math.abs(r) * 180 / Math.PI;
    const yawTo = (a, c) => Math.atan2(c.g.position.x - a.g.position.x, c.g.position.z - a.g.position.z);
    const bodyYaw = c => { const d = new V(0, 0, 1).applyQuaternion(c.g.getWorldQuaternion(new W.THREE.Quaternion())); return Math.atan2(d.x, d.z); }; /* the world heading, not g.rotation.y */
    const headYaw = c => { const d = new V(0, 0, 1).applyQuaternion(c.ch.head.getWorldQuaternion(new W.THREE.Quaternion())); return Math.atan2(d.x, d.z); };
    const flat = (a, c) => Math.hypot(a.g.position.x - c.g.position.x, a.g.position.z - c.g.position.z);
    const here = c => c.g.visible && c.g.parent && c.on !== false; /* world.js only animates (and draws) people in view: an off-screen one is frozen and does not count */
    const want = (id, n) => { if (z.S().step === '1-2' && n < 10) n = 10; return id === 'hero' ? (n >= 3 && n <= 24 ? 'sad' : 'ok') : ['ngazwe', 'maythu', 'chocho'].includes(id) ? (n >= 10 && n <= 24 ? 'sad' : 'ok') : id === 'phoekyaw' ? (n === 24 ? 'sad' : 'ok') : 'ok'; };
    let cur = null, lastN = 0;
    z.hud.onLine((name, text, o) => {
      if (o?.closed) { cur = null; return; }
      if (!o?.who) return;
      const n = R.lines.length + 1; lastN = n; cur = { n, who: o.who, to: o.to ?? null, voice: !!o.voice, t: W.time(), sampled: false, shot: shots[n] ?? null, queued: false };
      R.lines.push(cur);
    });
    W.tick(() => {
      if (cur && !cur.sampled && W.time() - cur.t >= 1.0 && cur.who) {
        cur.sampled = true; const S = P[cur.who], T = cur.to && P[cur.to];
        if (S && T && !cur.voice) {
          const loop = S.anim.loop, turns = TURNS.includes(loop), want0 = yawTo(S, T);
          cur.members = [...(z.director?.scene?.members.keys() ?? [])].map(m => m.id); const dl = z.director?.log.at(-1); cur.cam = dl && { kind: dl.kind, want: dl.want, fb: dl.fallback, pull: dl.pull }; cur.speaker = { loop, turns, body: deg(wrap(want0 - bodyYaw(S))), head: deg(wrap(want0 - headYaw(S))) };
          const cam = W.cam.position; cur.camErr = Math.abs(wrap(bodyYaw(S) - Math.atan2(cam.x - S.g.position.x, cam.z - S.g.position.z)));
          cur.listeners = Object.entries(P).filter(([k, c]) => c !== S && here(c) && flat(c, S) < 8).map(([k, c]) => ({ id: k, loop: c.anim.loop, turns: TURNS.includes(c.anim.loop), body: deg(wrap(yawTo(c, S) - bodyYaw(c))), gz: +(c.anim.gaze || 0).toFixed(2), gv: +(c.anim.gazeV || 0).toFixed(2), hr: +c.ch.head.rotation.y.toFixed(2), sp: +c.ch.spine.rotation.y.toFixed(2), hp: +c.ch.hips.rotation.y.toFixed(2), one: c.anim.one, age: +(W.time() - cur.t).toFixed(2), ry: +c.g.rotation.y.toFixed(2), by: +bodyYaw(c).toFixed(2), hy: +headYaw(c).toFixed(2), want: +yawTo(c, S).toFixed(2), head: deg(wrap(yawTo(c, S) - headYaw(c))) }));
        }
      }
      if (cur && cur.shot && cur.sampled && !cur.queued && !W.paused && W.time() - cur.t >= 1.1) { cur.queued = true; window.__q.push(cur.shot); W.paused = true; }
      for (const [k, c] of Object.entries(P)) { // the painted face against the table (idle / sitting, no overlay, not wet, past the blink-cut, a moment after the line opened)
        const a = c.anim; if (!here(c) || a.fx || a.hitT > 0 || a.cutT > 0 || (a.fn == null && a.moodName) /* first frame after arriving */ || a.one || !['idle', 'sit'].includes(a.loop) || (cur && W.time() - cur.t < .6 && cur.n === lastN) || !c.ch.faceKey) continue;
        const exp = z.FACE?.[want(k, lastN)]; if (!exp) continue;
        const [e, br, m, x] = c.ch.faceKey.split('|'); R.mood.checks++;
        const good = (e === 'blink' || (exp.eyes === 'normal' ? ['normal', 'happy'].includes(e) : e === exp.eyes)) && br === String(exp.brows) && (m === exp.mouth || ['open', 'o'].includes(m) /* a talker's flap */) && x === (exp.extra || '');
        if (!good && R.mood.bad.length < 8) R.mood.bad.push({ k, n: lastN, want: want(k, lastN), got: c.ch.faceKey });
        if (!good) { R.mood.badN = (R.mood.badN || 0) + 1; const kk = k + '@' + lastN + ' ' + want(k, lastN) + ' ← ' + c.ch.faceKey + ' mood=' + a.moodName + ' loop=' + a.loop + ' fn=' + a.fn; R.mood.hist = R.mood.hist || {}; R.mood.hist[kk] = (R.mood.hist[kk] || 0) + 1; }
      }
    });
  }, shots);

  if (want('flow')) {
    log('flow: ?new&autotalk');
    const p = await open('new&autotalk'); await p.evaluate(async () => { const m = await import('/chibi.js?v=35'); zone.FACE = m.FACE; });
    await hook(p, SHOTS);
    await drive(p, s => s.step === 'wip' && !s.playing, 3000);
    const R = await p.evaluate(() => window.__R);
    ok(R.lines.length === 31, `31 lines opened (${R.lines.length})`);
    const sp = R.lines.filter(l => l.speaker), ls = sp.flatMap(l => l.listeners.map(x => ({ ...x, n: l.n })));
    ok(sp.length === 31, `every line was sampled (${sp.length})`);
    const wb = Math.max(...sp.filter(l => l.speaker.turns).map(l => l.speaker.body)), wh = Math.max(...sp.filter(l => l.speaker.turns).map(l => l.speaker.head));
    const whn = Math.max(0, ...sp.filter(l => !l.speaker.turns).map(l => l.speaker.head));
    log(`   speakers: worst body ${wb.toFixed(1)}° · worst head (turning loops) ${wh.toFixed(1)}° · worst head (other loops) ${whn.toFixed(1)}° · non-turning: ${sp.filter(l => !l.speaker.turns).map(l => l.n + ':' + l.speaker.loop).join(' ') || '-'}`);
    ok(wb <= 25 && wh <= 25 && whn <= 35, 'the speaker faces `to` at all 31 lines (body ≤ 25°, head ≤ 25°; non-turning loops head ≤ 35°)');
    const lh = Math.max(...ls.map(x => x.head)), lb = Math.max(0, ...ls.filter(x => x.turns).map(x => x.body)), worst = ls.reduce((a, x) => x.head > a.head ? x : a, ls[0]);
    log(`   listeners (${ls.length} samples): worst head ${lh.toFixed(1)}° (${worst.id} at line ${worst.n}) · worst body ${lb.toFixed(1)}° · fewest listeners ${Math.min(...sp.map(l => l.listeners.length))}`);
    ok(lh <= 30 && lb <= 30, 'every visible cast member within 8 m looks at the speaker (head ≤ 30°, body ≤ 30°)');
    const p19 = R.lines.filter(l => l.n >= 19 && l.members).every(l => l.members.includes('phoekyaw'));
    ok(p19, 'Phoe Kyaw is in the director\'s group (a listener) at every line from 19 on');
    const ce = Math.max(...sp.map(l => l.camErr)), cn = sp.filter(l => l.camErr > .9).length;
    for (const l of sp) { if (l.speaker.head > 25 || l.camErr > .9 || l.listeners.some(x => x.head > 30)) log('   line', l.n, l.who, '→', l.to, 'speaker', JSON.stringify({ loop: l.speaker.loop, body: +l.speaker.body.toFixed(0), head: +l.speaker.head.toFixed(0) }), 'cam', l.camErr.toFixed(2), JSON.stringify(l.cam), 'bad listeners', JSON.stringify(l.listeners.filter(x => x.head > 30).map(x => [x.id, x.loop, +x.body.toFixed(0), +x.head.toFixed(0), 'gz', x.gz, 'gv', x.gv, 'hr', x.hr, 'sp', x.sp, 'hp', x.hp, 'one', x.one, 'age', x.age, 'ry', x.ry, 'by', x.by, 'hy', x.hy, 'want', x.want]))); }
    log(`   camera: worst ${ce.toFixed(2)} rad off the speaker's front · ${cn} lines beyond TALK.face .9`);
    ok(ce <= 1.85, 'the camera never shows the speaker\'s back (profile `two` shots are ≤ 1.85 rad)');
    log(`   mood: ${R.mood.checks} face checks, ${R.mood.badN || 0} mismatches`, JSON.stringify(R.mood.hist));
    ok(R.mood.checks > 200 && !R.mood.badN, 'every idle character\'s resting face matches the mood table');
    const fin = await p.evaluate(() => Object.fromEntries(Object.entries(zone.people).map(([k, c]) => [k, c.anim.moodName])));
    ok(['hero', 'ngazwe', 'maythu', 'chocho', 'phoekyaw'].every(k => fin[k] === 'ok'), 'at wip everyone is `ok` ' + JSON.stringify(fin));
    await p.context().close();
  }

  // ots framing (T16 review): at every over-the-shoulder shot the listener's head box covers ≤ 18% of the viewport and doesn't cover the speaker's head box; no shot's view of the speaker is blocked
  if (want('ots')) {
    const VPS = [['desk-800x450', { width: 800, height: 450 }], ['phone-375x667', { width: 375, height: 667 }], ['land-667x375', { width: 667, height: 375 }]];
    for (const [vn, vp] of VPS) {
      log('ots:', vn);
      const p = await open('new&day=1&step=1-2', vp); await p.evaluate(() => { zone.fast = true; });
      await p.evaluate(({ shotAt, nm }) => {
        const z = zone, W = z.W, P = z.people, T = W.THREE, R = window.__O = { rows: [] }; window.__q = []; let cur = null, tk = 0;
        const rect = c => { c.g.updateMatrixWorld(true); const bx = new T.Box3().setFromObject(c.ch.head).expandByScalar(.04); let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
          for (const x of [bx.min.x, bx.max.x]) for (const y of [bx.min.y, bx.max.y]) for (const zz of [bx.min.z, bx.max.z]) { const v = new T.Vector3(x, y, zz).project(W.cam); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
          return { x0, x1, y0, y1 }; };
        z.hud.onLine((name, text, o) => { if (o?.closed) { cur = null; return; } if (!o?.who) return; cur = { n: R.rows.length + 1, who: o.who, to: o.to, voice: !!o.voice, tk: 0 }; R.rows.push(cur); });
        W.tick(() => {
          if (!cur || cur.sampled) return; if (++cur.tk < 1) return; cur.sampled = true; W.cam.updateMatrixWorld(true);
          const lg = z.director.log.at(-1); cur.kind = lg?.kind; cur.blocked = lg?.blocked; cur.blocked0 = lg?.blocked0; cur.by = lg?.by; cur.replaced = lg?.replaced; cur.dist = lg?.dist;
          if (lg?.kind === 'ots' && P[cur.to]) { const L = rect(P[cur.to]), S = rect(P[cur.who]); const cl = (a, b) => Math.max(0, Math.min(1, b) - Math.max(-1, a));
            cur.cov = cl(L.x0, L.x1) * cl(L.y0, L.y1) / 4 * 100; cur.ov = Math.max(0, Math.min(L.x1, S.x1) - Math.max(L.x0, S.x0)) * Math.max(0, Math.min(L.y1, S.y1) - Math.max(L.y0, S.y0)); cur.Lx = [+L.x0.toFixed(2), +L.x1.toFixed(2)]; cur.Sx = [+S.x0.toFixed(2), +S.x1.toFixed(2)]; }
          if (cur.n === shotAt && !W.paused) { W.paused = true; window.__q.push(nm); }
        });
      }, { shotAt: 14, nm: 'line23-' + (vn.startsWith('desk') ? 'desktop' : vn.startsWith('phone') ? 'phone' : 'landscape') });
      await drive(p, s => s.step === 'wip' && !s.playing, 1500);
      const O = await p.evaluate(() => window.__O.rows);
      const ots = O.filter(r => r.kind === 'ots'), worst = Math.max(0, ...ots.map(r => r.cov)), wOv = Math.max(0, ...ots.map(r => r.ov));
      log(`   ${O.length} lines · ${ots.length} ots · worst foreground coverage ${worst.toFixed(1)}% · worst overlap ${wOv.toFixed(3)} · kinds ${JSON.stringify(O.reduce((a, r) => (a[r.kind] = (a[r.kind] || 0) + 1, a), {}))}`);
      log('   blocked first choice → replaced:', O.filter(r => r.blocked0).map(r => r.n + (r.replaced ? '(replaced→' + r.kind + ')' : '(kept)')).join(' ') || 'none', '· still blocked:', O.filter(r => r.blocked).map(r => r.n).join(' ') || 'none');
      ok(O.length === 22, `${vn}: lines 10–31 (22)`);
      for (const r of O) if (r.blocked || r.ov > 0 || r.cov > 12) log('   line', r.n, r.kind, 'dist', r.dist, 'cov', r.cov?.toFixed(1), 'ov', r.ov?.toFixed(3), 'L', r.Lx, 'S', r.Sx, r.blocked ? 'BLOCKED by ' + JSON.stringify(r.by) : '');
      ok(worst <= 18, `${vn}: every ots shot keeps the listener's head box ≤ 18% of the viewport`);
      ok(wOv === 0, `${vn}: ... and off the speaker's head box`);
      ok(!O.some(r => r.blocked), `${vn}: no shot's view of the speaker is blocked`);
      await p.context().close();
    }
  }

  if (want('restore')) {
    log('restore: ?day=1&step=1-2');
    let p = await open('new&day=1&step=1-2'); await hook(p); await p.evaluate(() => { zone.fast = true; });
    const mo = () => p.evaluate(() => Object.fromEntries(['hero', 'ngazwe', 'maythu', 'chocho', 'phoekyaw'].map(k => [k, zone.people[k].anim.moodName])));
    let m = await mo(); log('   ', JSON.stringify(m));
    ok(m.hero === 'sad' && m.ngazwe === 'sad' && m.maythu === 'sad' && m.chocho === 'sad' && !m.phoekyaw, '?step=1-2: hero + Nga Zwe + May Thu + Cho Cho sad, Phoe Kyaw not');
    await p.waitForFunction(() => window.__R.lines.length >= 4, null, { timeout: 600000 });
    await p.reload(); await p.waitForFunction(() => window.zone, null, { timeout: 180000 }); m = await mo();
    ok(m.hero === 'sad' && m.chocho === 'sad' && !m.phoekyaw, 'a reload mid-scene: the same moods');
    // wet wins, then the mood returns
    await p.evaluate(() => { const a = zone.people.hero.anim; a.soak(.2); window.__w = () => zone.people.hero.ch.faceKey; });
    await p.waitForTimeout(300);
    const k1 = await p.evaluate(() => window.__w()); await p.waitForFunction(() => zone.W.time() > 0 && zone.people.hero.anim.hitT < 0 && !zone.people.hero.anim.fx, null, { timeout: 120000 }); await p.waitForTimeout(500);
    const k2 = await p.evaluate(() => window.__w()); log('   wet:', k1, ' after:', k2);
    ok(k1.startsWith('><|') && k2.startsWith('half|out|'), 'wet shows ><, then the sad face comes back');
    await p.context().close();
    p = await open('new&day=1&step=1-1'); m = await mo();
    ok(!m.hero && !m.ngazwe, '?step=1-1: no moods set (everyone their own)');
    await p.context().close();
  }

  if (want('wait')) {
    log('wait: no ?autotalk');
    const p = await open('new&day=1&step=1-1'); await hook(p);
    await p.waitForFunction(() => window.__R.lines.length >= 1 && zone.hud.talking(), null, { timeout: 600000 });
    const t0 = await p.evaluate(() => zone.W.time());
    await p.waitForFunction(t0 => zone.W.time() - t0 > 15, t0, { timeout: 600000 });
    const st = await p.evaluate(() => ({ n: window.__R.lines.length, talking: zone.hud.talking(), typing: zone.hud.typing(), ready: document.getElementById('dlg').classList.contains('ready') }));
    ok(st.n === 1 && st.talking && !st.typing, `line 1 is still on screen after 15 s with no input (${JSON.stringify(st)})`);
    ok(st.ready, 'the hint pulses (#dlg.ready) once the line is typed');
    await p.keyboard.press('KeyE');
    await p.waitForFunction(() => window.__R.lines.length >= 2, null, { timeout: 60000 });
    ok(true, 'one E press: line 2');
    await p.context().close();
  }

  log('console errors', errs.length, errs.slice(0, 5));
  ok(errs.length === 0, 'console errors 0');
  await b.close();
  log(fails.length ? 'FAILED ' + fails.length : 'ALL PASS'); process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
