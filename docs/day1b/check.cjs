// T5b-1 — day 1 up to line 31 (docs/plans/T5b.md), headless Chromium (swiftshader, ~1–3 fps: everything waits on game time, ?dt=)
//   flow   ?new at reading pace (fast OFF): pro → 1-1 → 1-2 → wip. Asserts: the 31 lines verbatim from SCENARIO.md (parsed here), in order, with the
//          right speaker · arrival order + hidden-before-cue · the day-1 kit (no pump / jerry can) · the bowl on the bench (pro, 1-1, 1-2, wip) · Bwa Bwa
//          indoors in 1-1 · Scene A / B durations · the gestures really play · the wip card (no 「ရက် ၂」 card) · screenshots
//   girl   ?girl → lines 1 and 5 say 「သမီး」 (and nothing else differs) · boy (flow) says 「သား」
//   skip   a tap skips the Prologue
//   jump   ?day=1&step=1-2 → plays 10–31 → wip · a reload mid-1-2 restarts the scene · a reload at wip shows the card again · ?step=1-3 (T5's old step) doesn't crash
//   phone  375×667 screenshots (wip card, 1-2)
// run: (cd the repo) python3 -m http.server 8797 &  node docs/day1b/check.cjs   (ONLY=flow,girl,skip,jump,phone to run some; PORT=)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const OUT = __dirname, ROOT = path.join(__dirname, '../..'), URL = `http://localhost:${process.env.PORT || 8797}/yangon.html`;
const DT = process.env.DT || '0.2', Q = '&debug&dt=' + DT;
const P5 = ['hero', 'ngazwe', 'maythu', 'chocho', 'phoekyaw'];
const errs = [], ONLY = process.env.ONLY?.split(','), want = k => !ONLY || ONLY.includes(k);
const log = (...a) => console.log(...a);
const fails = [], ok = (c, m) => { log(c ? '  ok  ' : '  FAIL', m); if (!c) fails.push(m); };

// ---- the 31 lines, from SCENARIO.md at run time ----
const WHO = { '`{နာမည်}`': 'hero', 'အမေ': 'mom', 'ဘွားဘွား': 'bwabwa', 'ငဇွဲ': 'ngazwe', 'မေသူ': 'maythu', 'ချိုချို': 'chocho', 'ဖိုးကျော်': 'phoekyaw' };
const MMN = s => +s.replace(/[၀-၉]/g, d => '၀၁၂၃၄၅၆၇၈၉'.indexOf(d));
function expected(girl) {
  const sc = fs.readFileSync(path.join(ROOT, 'SCENARIO.md'), 'utf8').split('\n');
  const a = sc.findIndex(l => l.startsWith('### ၁-၁')), z = sc.findIndex(l => l.startsWith('### ၁-၃')), rows = [];
  for (const l of sc.slice(a, z)) { const m = l.match(/^\| ([၀-၉]+) \| (.+?) \| (.+?) \|(.*)\|\s*$/); if (m) rows.push({ n: MMN(m[1]), who: WHO[m[2]], text: m[3].replaceAll('`{နာမည်}`', 'မောင်မောင်').replaceAll('{နာမည်}', 'မောင်မောင်') }); }
  if (girl) for (const r of rows) if (r.n === 1 || r.n === 5) r.text = r.text.replace('သား', 'သမီး');
  return rows;
}

(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  async function open(q, viewport = { width: 640, height: 400 }) {
    const ctx = await b.newContext({ viewport }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await p.goto(URL + '?' + q + Q); await p.waitForFunction(() => window.zone, null, { timeout: 180000 });
    return p;
  }
  const shot = (p, name) => p.screenshot({ path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 72, timeout: 180000 });
  const S = p => p.evaluate(() => ({ step: zone.S().step, t: +zone.W.time().toFixed(1), playing: zone.story.playing, busy: zone.hud.busy(), paused: zone.W.paused, inside: zone.inside(), end: !document.getElementById('end').hidden, q: window.__q?.splice(0) ?? [] }));
  // in the page: log every line (with who sees whom), snapshot the stage at each line, queue screenshots, track scene times, wrap anim.play
  const hook = (p, shots = {}) => p.evaluate(shots => {
    const z = zone, W = z.W, P = z.people; window.__lines = []; window.__q = []; window.__plays = []; window.__scene = {}; window.__shots = shots; window.__first = {};
    for (const [id, c] of Object.entries(P)) { const o = c.anim.play.bind(c.anim); c.anim.play = (n, ...a) => { window.__plays.push([id, n, +W.time().toFixed(2)]); return o(n, ...a); }; }
    window.__fx = []; { const f0 = W.onFx; W.onFx = (n, p) => { window.__fx.push([n, +W.time().toFixed(2)]); return f0?.(n, p); }; }
    const hudHidden = () => ['where', 'turn', 'opt', 'opts', 'tool'].every(id => getComputedStyle(document.getElementById(id)).display === 'none');
    const vis = () => Object.fromEntries(['ngazwe', 'maythu', 'chocho', 'phoekyaw'].map(k => [k, P[k].g.visible]));
    z.hud.onLine((name, text, o) => {
      if (o?.closed) return;
      const n = window.__lines.length + 1, c = o?.who && P[o.who];
      const snap = { n, t: W.time(), name, text, who: o?.who ?? null, step: z.S().step, vis: vis(), inside: z.inside(), bwabwaX: P.bwabwa.g.position.x, momX: P.mom.g.position.x, momVis: P.mom.g.visible, hudHidden: hudHidden(), heroTool: P.hero.ch.tool, bowl: null,
        dist: Object.fromEntries(['ngazwe', 'maythu', 'chocho', 'phoekyaw'].map(k => [k, P[k].g.visible ? +P[k].g.position.distanceTo(P.hero.g.position).toFixed(2) : null])), face: Object.fromEntries(['ngazwe', 'maythu', 'chocho', 'phoekyaw'].map(k => { const d = P.hero.g.position.clone().sub(P[k].g.position), want = Math.atan2(d.x, d.z); let a = Math.abs(((P[k].g.rotation.y - want) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI); return [k, +(a * 180 / Math.PI).toFixed(0)]; })) };
      const bw = z.bowl; if (bw) { const w = bw.g.getWorldPosition(new W.THREE.Vector3()), bt = z.bench.socket.getWorldPosition(new W.THREE.Vector3()); snap.bowl = { visible: bw.g.visible, at: bw.at === z.bench, state: bw.state, d: +w.distanceTo(bt).toFixed(3) }; }
      if (n === 31) { z.W.orbit?.focus(new W.THREE.Vector3(3.9, 1.0, -3.2), { dist: 10, elev: 1.0, az: 0.3, t: .01 }); } /* the whole gang + the bench, from the lane */
      window.__lines.push(snap); window.__cur = { ...snap, shot: window.__shots[n] ?? null, done: false };
    });
    W.tick(() => {
      const L = window.__cur; if (L && !L.done && L.shot && !W.paused && W.time() - L.t >= (z.fast ? .2 : .9)) { L.done = true; window.__q.push(L.shot); W.paused = true; }
      const sp = z.story.playing?.split(':')[0]; if (sp) { const s = window.__scene[sp] ??= { t0: W.time(), t1: 0 }; s.t1 = W.time(); }
      for (const k of ['ngazwe', 'maythu', 'chocho', 'phoekyaw']) if (P[k].g.visible && !(k in window.__first)) window.__first[k] = +W.time().toFixed(2);
    });
  }, shots);
  // one beat of the auto-player: pause-shots first, else go do what the goal points at
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
  function linesCheck(L, exp, label) {
    ok(L.length === 31, `${label}: 31 lines shown (got ${L.length})`);
    const bad = exp.filter((e, i) => !L[i] || L[i].text !== e.text || L[i].who !== e.who);
    ok(!bad.length, `${label}: every line verbatim + the right speaker, in order${bad.length ? ' — first diff: #' + bad[0].n + ' ' + JSON.stringify(L[bad[0].n - 1]) : ''}`);
  }

  // ---------- flow ----------
  if (want('flow')) {
    log('flow: ?new at reading pace');
    const p = await open('new&autotalk');
    await hook(p, { 2: '1-1-mum', 3: '1-1-hero', 6: '1-1-bwabwa', 10: '1-2-ngazwe', 15: '1-2-maythu-chocho', 19: '1-2-phoekyaw', 31: '1-2-gang' });
    // pro
    const pro = await p.evaluate(() => { const z = zone, P = z.people, bw = z.bowl, W = z.W, V = W.THREE.Vector3;
      const wp = bw.g.getWorldPosition(new V()), bt = z.bench.socket.getWorldPosition(new V());
      return { step: z.S().step, bowlVisible: bw.g.visible, onBench: bw.at === z.bench, d: wp.distanceTo(bt), bwDist: P.bwabwa.g.position.distanceTo(bt), bwVisible: P.bwabwa.g.visible, inside: z.inside(), titleShown: !document.getElementById('title').classList.contains('gone'), titleText: document.getElementById('title').textContent }; });
    ok(pro.step === 'pro' && pro.bowlVisible && pro.onBench && pro.d < .05, `pro: the bowl sits on the bench (carry target, d ${pro.d.toFixed(3)})`);
    ok(pro.bwVisible && pro.bwDist < 1.5 && !pro.inside, `pro: Bwa Bwa at the bench (${pro.bwDist.toFixed(2)} m), outdoors`);
    ok(await p.evaluate(() => ['where', 'turn', 'opt', 'opts', 'tool'].every(id => getComputedStyle(document.getElementById(id)).display === 'none')), 'pro: the HUD is hidden');
    ok(pro.titleShown && pro.titleText.includes('သင်္ကြန်ပွဲ'), 'pro: the title 「သင်္ကြန်ပွဲ」 is up');
    await p.waitForFunction(() => zone.W.time() > 1.5, null, { timeout: 600000 });
    await p.evaluate(() => { zone.W.paused = true; }); await shot(p, 'pro'); await p.evaluate(() => { zone.W.paused = false; }); log('   shot pro');
    const tPro0 = await p.evaluate(() => zone.W.time());
    await drive(p, s => s.step === '1-1');
    const tPro1 = await p.evaluate(() => zone.W.time()); const proDur = tPro1 - 0; // the prologue starts at game time ≈ 0
    ok(proDur >= 8 && proDur <= 20, `pro: about 15 s of game time (${proDur.toFixed(1)} s)`);
    ok((await p.evaluate(() => window.__plays.filter(x => x[0] === 'bwabwa' && x[1] === 'polish').length)) === 2, 'pro: Bwa Bwa polishes twice');
    // 1-1 → 1-2 → wip
    const end = await drive(p, s => s.step === 'wip' && !s.playing);
    const R = await p.evaluate(() => ({ fx: window.__fx, lines: window.__lines, scene: window.__scene, first: window.__first, plays: window.__plays, step: zone.S().step }));
    linesCheck(R.lines, expected(false), 'boy');
    const L = R.lines;
    ok(L[0].text.includes('သား') && !L[0].text.includes('သမီး') && L[4].text.includes('သားတို့'), 'boy: lines 1 and 5 say 「သား」');
    // order + hidden before the cue
    const v = n => L[n - 1].vis;
    ok(v(10).ngazwe && !v(10).maythu && !v(10).chocho && !v(10).phoekyaw, 'line 10: only Nga Zwe is there');
    ok(v(13).ngazwe && !v(13).maythu && !v(13).chocho && !v(13).phoekyaw, 'line 13: May Thu and Cho Cho are still hidden (they come on the cue before line 14)');
    ok(v(15).maythu && v(15).chocho && !v(15).phoekyaw, 'line 15–18: May Thu + Cho Cho have arrived together, Phoe Kyaw not yet');
    ok(v(19).phoekyaw && v(19).maythu && v(19).chocho && v(19).ngazwe, 'line 19: Phoe Kyaw last, all four there');
    ok(R.first.ngazwe < R.first.maythu && Math.abs(R.first.maythu - R.first.chocho) < 1 && R.first.chocho < R.first.phoekyaw, `arrival order Nga Zwe ${R.first.ngazwe} → May Thu ${R.first.maythu} + Cho Cho ${R.first.chocho} → Phoe Kyaw ${R.first.phoekyaw}`);
    // the speaker is close, the arc is a half-ring, Mum is indoors, the HUD is away, the bucket stays outside
    for (const [n, k] of [[10, 'ngazwe'], [14, 'ngazwe'], [19, 'phoekyaw']]) ok(L[n - 1].dist[k] !== null && L[n - 1].dist[k] <= 3, `line ${n}: ${k} speaks from ${L[n - 1].dist[k]} m (≤ 3)`);
    const d25 = L[24].dist, f25 = L[24].face;
    ok(Object.values(d25).every(d => d >= 1.8 && d <= 2.5), 'line 25: all four stand 1.8–2.5 m from the hero ' + JSON.stringify(d25));
    { const fa = [L[9].face.ngazwe, L[13].face.maythu, L[13].face.chocho, L[18].face.phoekyaw]; ok(fa.every(a => a <= 30), 'each arrival stops facing the hero (±30° at the first line after the cue): ' + fa.join(', ') + '° (mid-talk the director turns them to whoever speaks: line 25 ' + JSON.stringify(f25) + ')'); }
    ok(L.slice(9).every(l => l.momX > 100 || !l.momVis), 'Scene B: Mum is indoors (not at the door)');
    ok(L.every(l => l.hudHidden), 'minimap, turn buttons, ⚙ menu and tool pad are hidden at all 31 lines');
    ok(L.slice(0, 9).every(l => l.heroTool === 'none') && L.slice(9).every(l => l.heroTool === 'bucket'), 'the bucket is not in the hero\'s hand indoors (1-1), and is outdoors (1-2)');
    // water on every arrival
    { const fx = R.fx, pl2 = R.plays, tL = pl2.find(x => x[0] === 'maythu' && x[1] === 'lob')[2], tP = pl2.find(x => x[0] === 'phoekyaw' && x[1] === 'splash')[2], tC = pl2.find(x => x[0] === 'chocho' && x[1] === 'squirt')[2];
      ok(fx.some(([n, t]) => n === 'splash' && t > tL + .5 && t < tL + 1.65), `May Thu's balloon flies and pops on the ground (a splash fx ${tL}→)`);
      ok(fx.some(([n, t]) => n === 'splash' && t >= tP && t < tP + 1.2), `Phoe Kyaw's bucket throws water (a splash fx ${tP}→)`);
      ok(fx.some(([n, t]) => n === 'squirt' && t >= tC && t < tC + 1.2), `Cho Cho's squirt runs (${tC}→)`); }
    // bowl + Bwa Bwa
    ok(L.every(l => l.bowl.visible && l.bowl.at && l.bowl.state === 'placed' && l.bowl.d < .05), 'the bowl is on the bench at every one of the 31 lines (1-1 and 1-2)');
    ok(L.slice(0, 9).every(l => l.inside === 'home') && L.slice(0, 9).every(l => l.step === '1-1'), '1-1: lines 1–9 are played indoors');
    ok(L[5].bwabwaX > 100, '1-1: Bwa Bwa is inside the house (line 6)');
    ok(L.slice(9).every(l => !l.inside && l.step === '1-2'), '1-2: lines 10–31 are played at the house front');
    // durations
    const A = R.scene['1-1'], B = R.scene['1-2'], dA = A.t1 - A.t0, dB = B.t1 - B.t0;
    ok(dA <= 60, `Scene A ${dA.toFixed(1)} s ≤ 60 s`); ok(dB <= 100, `Scene B ${dB.toFixed(1)} s ≤ 100 s`);
    // gestures
    const pl = (id, n) => R.plays.some(x => x[0] === id && x[1] === n);
    ok(pl('mom', 'hips') && pl('hero', 'nod') && pl('ngazwe', 'scratch') && pl('chocho', 'point'), 'gestures play: mom hips, hero nod, Nga Zwe scratch, Cho Cho point');
    ok(pl('maythu', 'lob') && pl('chocho', 'squirt') && pl('phoekyaw', 'splash') && pl('phoekyaw', 'ring'), 'arrival shows: May Thu lob, Cho Cho squirt, Phoe Kyaw splash + ring');
    ok(!pl('ngazwe', 'splash') && !pl('ngazwe', 'squirt') && !pl('ngazwe', 'lob'), 'Nga Zwe shows nothing (empty-handed)');
    // kit (everyone is on stage at wip)
    const kit = await p.evaluate(() => { const P = zone.people, out = {}; const can = ch => { let f = false; ch.root.traverse(m => { const g = m.geometry; if (m.isMesh && g?.type === 'BoxGeometry' && Math.abs(g.parameters.width - .24) < .001 && Math.abs(g.parameters.height - .3) < .001 && Math.abs(g.parameters.depth - .13) < .001) f = true; }); return f; };
      for (const k of ['hero', 'ngazwe', 'maythu', 'chocho', 'phoekyaw']) { const ch = P[k].ch; out[k] = { pump: !!ch.pump, can: can(ch), tools: ch.tools, tool: ch.tool, gun: !!ch.gun, balloon: !!ch.balloon, bucketOut: ch.bucket.visible, size: ch.opts.size ?? null }; }
      out.pails = zone.pails.visible && zone.pails.parent === zone.bike.g; out.bike = zone.bike.g.visible; return out; });
    ok(Object.entries(kit).filter(([k]) => P5.includes(k)).every(([, o]) => !o.pump && !o.can), 'no pump / jerry can on anyone: ' + JSON.stringify(Object.fromEntries(Object.entries(kit).filter(([k]) => P5.includes(k)).map(([k, o]) => [k, [o.pump, o.can]]))));
    ok(kit.hero.tools.join() === 'bucket' && kit.hero.tool === 'bucket', 'hero: the bucket is the only tool');
    ok(kit.ngazwe.tool === 'none' && !kit.ngazwe.gun && !kit.ngazwe.balloon && !kit.ngazwe.bucketOut, 'Nga Zwe: nothing in his hands');
    ok(kit.maythu.balloon && !kit.maythu.gun && !kit.maythu.bucketOut, 'May Thu: the balloon bag');
    ok(kit.chocho.gun && kit.chocho.tool === 'gun' && kit.chocho.size < .7, 'Cho Cho: the small toy water gun');
    ok(kit.phoekyaw.bucketOut && kit.pails && kit.bike, 'Phoe Kyaw: a bucket in hand + two on the bike');
    // wip
    ok(R.step === 'wip' && end.end, 'wip: the 「ဆက်ရန်」 card is up after line 31');
    const card = await p.evaluate(() => ({ head: document.getElementById('ehead').textContent, body: document.getElementById('ebody').textContent, walk: !document.getElementById('ewalk').hidden, again: document.getElementById('eagain').textContent, goal: document.getElementById('gtext').textContent, all: document.getElementById('end').textContent }));
    ok(card.head === 'ဆက်ရန်…' && card.walk && card.again === 'အစက ပြန်ကြည့်' && !card.all.includes('ရက် ၂'), 'wip card: head, two buttons, no 「ရက် ၂」 card ' + JSON.stringify(card));
    ok(card.goal === 'ငါတို့ ဘာသာ ငါတို့ ဆောက်မယ်', 'goal line 「ငါတို့ ဘာသာ ငါတို့ ဆောက်မယ်」 is up');
    ok((await p.evaluate(() => { const bw = zone.bowl, V = zone.W.THREE.Vector3; return bw.at === zone.bench && bw.g.visible && bw.g.getWorldPosition(new V()).distanceTo(zone.bench.socket.getWorldPosition(new V())) < .05; })), 'wip: the bowl is on the bench');
    await p.evaluate(() => { zone.W.paused = true; }); await shot(p, 'wip'); await p.evaluate(() => { zone.W.paused = false; }); log('   shot wip');
    const wipPos = await p.evaluate(() => { const P = zone.people; return Object.fromEntries(['ngazwe', 'maythu', 'chocho', 'phoekyaw'].map(k => [k, +P[k].g.position.distanceTo(P.hero.g.position).toFixed(2)])); });
    ok(Object.values(wipPos).every(d => d >= 1.8 && d <= 2.5), 'wip: the gang stands round the hero at the house front ' + JSON.stringify(wipPos));
    await p.evaluate(() => document.getElementById('ewalk').click());
    ok(await p.evaluate(() => getComputedStyle(document.getElementById('where')).display !== 'none' && !document.getElementById('tool').querySelector('small')), 'wip free roam: the HUD is back, the tool pad has no 「R · ပြောင်း」 hint');
    await p.evaluate(() => { zone.W.orbit?.release(); zone.W.snapCam(); }); await p.waitForTimeout(1500); await p.evaluate(() => { zone.W.paused = true; }); await shot(p, 'wip-roam'); await p.evaluate(() => { zone.W.paused = false; }); log('   shot wip-roam');
    ok(await p.evaluate(() => document.getElementById('end').hidden && !zone.hud.busy()), 'wip: 「လမ်းလျှောက်ကြည့်」 closes the card, free roam');
    ok(await p.evaluate(() => Object.values(zone.people).filter(c => ['ngazwe', 'maythu', 'chocho', 'phoekyaw'].includes(c.id)).every(c => c.g.visible)), 'wip: the gang waits');
    await p.context().close();
  }

  // ---------- girl ----------
  if (want('girl')) {
    log('girl: ?girl');
    const p = await open('new&girl&day=1&step=1-1'); await hook(p);
    await p.evaluate(() => { zone.fast = true; });
    const s = await drive(p, s => s.step === '1-1' && !s.playing && s.t > 3 && s.inside === 'home', 1200);
    const R = await p.evaluate(() => window.__lines); const exp = expected(true).slice(0, 9);
    ok(R.length === 9, `girl: lines 1–9 played (${R.length})`);
    ok(exp.every((e, i) => R[i]?.text === e.text), 'girl: lines 1 and 5 say 「သမီး」, the other seven are unchanged');
    ok(R[0].text.includes('သမီး') && R[4].text.includes('သမီးတို့'), 'girl: 「သမီး」 / 「သမီးတို့」');
    await p.context().close();
  }

  // ---------- skip ----------
  if (want('skip')) {
    log('skip: a tap skips the Prologue');
    const p = await open('new&day=1&step=pro'); await p.waitForFunction(() => zone.W.time() > 1, null, { timeout: 300000 });
    await p.mouse.click(100, 100);
    await p.waitForFunction(() => zone.S().step === '1-1', null, { timeout: 300000 }); const t = await p.evaluate(() => zone.W.time());
    ok(t < 8, `skip: 1-1 reached at game time ${t.toFixed(1)} s (< 8)`);
    ok(await p.evaluate(() => zone.people.hero.g.visible), 'skip: the hero is back'); await p.context().close();
  }

  // ---------- jump ----------
  if (want('jump')) {
    log('jump: ?day=1&step=1-2 · reloads · the old step 1-3');
    let p = await open('new&day=1&step=1-2'); await hook(p); await p.evaluate(() => { zone.fast = true; });
    await drive(p, s => s.step === 'wip' && !s.playing, 1500);
    let L = await p.evaluate(() => window.__lines);
    ok(L.length === 22 && L[0].text === expected(false)[9].text && L[21].text === expected(false)[30].text, `?step=1-2: lines 10–31 play (${L.length}), then wip`);
    ok(await p.evaluate(() => !document.getElementById('end').hidden), 'wip card up');
    await p.reload(); await p.waitForFunction(() => window.zone, null, { timeout: 180000 });
    await p.waitForFunction(() => zone.S().step === 'wip' && !document.getElementById('end').hidden, null, { timeout: 120000 });
    ok(true, 'a reload at wip shows the card again');
    ok(await p.evaluate(() => { const V = zone.W.THREE.Vector3, bw = zone.bowl; return bw.at === zone.bench && bw.g.visible && bw.g.getWorldPosition(new V()).distanceTo(zone.bench.socket.getWorldPosition(new V())) < .05 && ['ngazwe', 'maythu', 'chocho', 'phoekyaw'].every(k => zone.people[k].g.visible && zone.people[k].g.position.distanceTo(zone.people.hero.g.position) < 3); }), 'wip after a reload: bowl on the bench, the gang waiting');
    await p.context().close();
    // a reload mid-1-2 restarts the scene (at line 10)
    p = await open('new&day=1&step=1-2'); await hook(p); await p.evaluate(() => { zone.fast = true; });
    await p.waitForFunction(() => window.__lines.length >= 3, null, { timeout: 600000 });
    await p.reload(); await p.waitForFunction(() => window.zone, null, { timeout: 180000 }); await hook(p); await p.evaluate(() => { zone.fast = true; });
    await drive(p, s => s.step === 'wip' && !s.playing, 1500);
    L = await p.evaluate(() => window.__lines);
    ok(L.length === 22 && L[0].text === expected(false)[9].text, 'a reload mid-1-2 restarts Scene B from line 10 and reaches wip');
    await p.context().close();
    // T5's old step
    p = await open('new&day=1&step=1-3'); const s = await S(p);
    ok(s.step === 'pro', `?day=1&step=1-3 is ignored (step ${s.step})`);
    await p.waitForTimeout(3000); await p.context().close();
  }

  // ---------- phone ----------
  if (want('phone')) {
    log('phone 375×667');
    let p = await open('new&day=1&step=wip', { width: 375, height: 667 });
    await p.waitForFunction(() => !document.getElementById('end').hidden, null, { timeout: 120000 });
    await p.waitForTimeout(1500); await p.evaluate(() => { zone.W.paused = true; }); await shot(p, 'phone-wip-375'); log('   shot phone-wip-375'); await p.context().close();
    p = await open('new&day=1&step=1-2', { width: 375, height: 667 }); await hook(p, { 15: 'phone-1-2-375' }); await p.evaluate(() => { zone.fast = true; });
    await drive(p, s => s.step === 'wip', 1500); await p.context().close();
  }

  log('console errors', errs.length, errs.slice(0, 5));
  ok(errs.length === 0, 'console errors 0');
  await b.close();
  log(fails.length ? 'FAILED ' + fails.length : 'ALL PASS'); process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
