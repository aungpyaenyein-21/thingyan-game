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

  // ---------- 2. walls: every day-1 talker where they talk, the listener at the 8 snapped azimuths, ots / two / wide ----------
  if (want('walls')) {
    log('2. walls');
    const p = await open('new&day=1&step=1-3');
    const r = await p.evaluate(async () => {
      const { OZ, OX } = await import('./yangon/set.js?v=22'), z = zone, W = z.W, V = (x, zz) => new W.THREE.Vector3(x, 0, zz), P = z.people;
      const lift = c => c.ch.head.getWorldPosition(new W.THREE.Vector3()).y - c.g.position.y; // head height over the feet
      const room = n => { const b = z.rooms[n].bounds; return { open: Math.PI / 4, x0: b.x0, z0: b.z0 }; };
      const H = z.rooms.home, T = z.rooms.tea, B = z.rooms.barber, C = z.rooms.clothes;
      // where each line of day 1 is said (main.js / story.js: stage(), the cues, FRONT, LOT …) — voice lines (Mum at 1-7, the ④ kid) aren't shot
      const spots = [
        ['mom', '1-1 home', P.mom, V(H.mom.x, H.mom.z), room('home')],
        ['bwabwa', '1-6 mandat', P.bwabwa, V(3.6, 3.45), null], ['bwabwa', '1-8 home', P.bwabwa, V(H.chair.x, H.chair.z), room('home')],
        ['ngazwe', '1-2 lane', P.ngazwe, V(-3.3, -2.3), null], ['ngazwe', '1-7 front', P.ngazwe, V(3.4, 4.0), null],
        ['maythu', '1-2 lane', P.maythu, V(-2.6, -3.0), null], ['maythu', '1-7 front', P.maythu, V(4.2, 4.4), null],
        ['phoekyaw', '1-7 front', P.phoekyaw, V(5.9, 3.8), null],
        ['chocho', '1-2 peek', P.chocho, V(-3.95, -3.35 + OZ), null], ['chocho', '1-4 amp', P.chocho, V(-3.3, .3), null], ['chocho', '1-7 front', P.chocho, V(6.5, 3.2), null],
        ['sayagyi', '1-6 front', P.sayagyi, V(5.2, 4.3), null], ['kozaw', '1-5 table', P.kozaw, V(-.5, 3.3), null],
        ['vendor', 'shop: corner', P.mom, V(-2.0, -.3), null], ['teaboss', 'shop: tea', P.mom, V(T.boss.x, T.boss.z + 1.2), room('tea')],
        ['barber', 'shop: barber', P.mom, V(B.boss.x, B.boss.z), room('barber')], ['tailor', 'shop: clothes', P.mom, V(C.boss.x, C.boss.z), room('clothes')],
      ];
      const rows = [], hl = lift(z.hero);
      for (const [id, where, c, at, rm] of spots) {
        const S = at.clone().setY((rm ? .05 : W.ground(at.x, at.z)) + lift(c));
        // people: everyone else standing about (as staged for 1-3, life.js's extras too) within 16 m — not the stand-ins for this pair
        const others = W.chars.filter(o => o !== c && o !== z.hero && o.g.visible && o.g.parent && Math.hypot(o.g.position.x - at.x, o.g.position.z - at.z) < 16).map(o => o.ch.head.getWorldPosition(new W.THREE.Vector3()));
        for (let k = 0; k < 8; k++) {
          const a = k * Math.PI / 4, lx = at.x + Math.sin(a) * 1.6, lz = at.z + Math.cos(a) * 1.6, L = V(lx, lz).setY((rm ? .05 : W.ground(lx, lz)) + hl);
          for (const kind of ['ots', 'two', 'wide']) {
            const s = W.orbit.talkShot(S, L, kind, { room: rm, others, dry: true });
            rows.push({ id, where, az: k * 45, want: kind, got: s.kind, pull0: +s.pull0.toFixed(2), why0: s.why0, pull: +s.pull.toFixed(2), why: s.why ?? null, fallback: s.fallback });
          }
        }
      }
      return rows;
    });
    const by = {}, sum = { shots: r.length, blocked0: 0, byWall: 0, byRoom: 0, byPeople: 0, fallback: 0, blocked: 0 };
    for (const x of r) {
      const k = `${x.id} (${x.where})`, o = by[k] ??= { shots: 0, blocked0: 0, fallback: 0, blocked: 0, kinds: {} };
      o.shots++; o.kinds[x.want + '→' + x.got] = (o.kinds[x.want + '→' + x.got] ?? 0) + 1;
      if (x.pull0 > .3) { o.blocked0++; sum.blocked0++; sum[{ wall: 'byWall', room: 'byRoom', people: 'byPeople' }[x.why0] ?? 'byWall']++; o[x.why0] = (o[x.why0] ?? 0) + 1; } if (x.fallback > 0) { o.fallback++; sum.fallback++; } if (x.pull > .3) { o.blocked++; sum.blocked++; }
    }
    for (const [k, o] of Object.entries(by)) log('  ', k.padEnd(26), `shots ${o.shots} · first choice blocked ${o.blocked0} (wall ${o.wall ?? 0}, room ${o.room ?? 0}, people ${o.people ?? 0}) · fallback ${o.fallback} · still blocked ${o.blocked}`, JSON.stringify(o.kinds));
    log('   total', JSON.stringify(sum));
    for (const want of ['ots', 'two', 'wide']) { const xs = r.filter(x => x.want === want); log(`   ${want}: ${xs.length} shots · first choice > 30 % pulled in ${xs.filter(x => x.pull0 > .3).length} · fallback ${xs.filter(x => x.fallback > 0).length} · after fallback > 30 % ${xs.filter(x => x.pull > .3).length}`); }
    results.walls = { sum, by, rows: r };
    await p.context().close();
  }

  // a made-up scene (docs only, never in the game): injected into story.js's SCENES and played through main.js's story.play
  // the gang stood round you on the lot, 1.5–2 m apart, once the day's title card has gone
  const inject = (p, id, lines) => p.evaluate(async ([id, lines]) => { const z = zone; z.story.SCENES[id] = { lines };
    await new Promise(r => { const t = z.W.time(); z.W.tick(() => { if (z.W.time() > t + 2.5) r(); }); });
    const at = { hero: [1.6, 1.2, Math.PI], ngazwe: [.1, .9, 1.4], maythu: [1.9, -.4, -.3], chocho: [3.1, .8, -1.6], phoekyaw: [2.0, 2.8, 2.9] };
    for (const [k, [x, zz, ry]] of Object.entries(at)) { const c = z.people[k]; c.g.position.set(x, z.W.ground(x, zz), zz); c.g.rotation.y = ry; c.g.visible = true; c.anim.setLoop('idle'); }
    z.W.snapCam(); }, [id, lines]);
  const LONG = 'မဏ္ဍပ် ငါ စီမံမယ်၊ မင်းတို့ ပစ္စည်း သယ်ခဲ့';

  // ---------- 3. tap-through: 20 lines at 10 taps / s ----------
  if (want('tap')) {
    log('3. tap-through');
    const LINES = [['ngazwe', LONG], ['maythu', LONG, { act: 'note' }], ['phoekyaw', 'ရတယ် ရတယ်', { act: 'shrug' }], ['chocho', LONG + '?'], ['hero', LONG],
      [null, null, { cue: 'none' }], ['ngazwe', LONG + '!', { react: 'bang' }], ['ngazwe', LONG], ['maythu', LONG, { shot: 'two' }], ['chocho', LONG, { shot: 'close' }],
      ['phoekyaw', LONG, { shot: 'wide' }], ['maythu', LONG, { to: 'chocho' }], ['chocho', LONG + '?'], ['ngazwe', LONG + '!'], ['hero', LONG], ['maythu', LONG, { voice: true }],
      ['phoekyaw', LONG, { act: 'ring' }], ['chocho', LONG, { face: 'sly' }], ['ngazwe', LONG, { act: 'scold' }], ['maythu', LONG + '?'], ['phoekyaw', LONG, { act: 'shrug' }]];
    const check = p => p.evaluate(() => window.__check());
    const defCheck = p => p.evaluate(() => { window.__check = () => { const z = zone, o = z.W.orbit, P = Object.entries(z.people);
      return { talking: P.filter(([, c]) => c.anim.talking).map(([k]) => k), oneShots: P.filter(([, c]) => c.anim.one).map(([k, c]) => k + ':' + c.anim.one), chat: P.filter(([, c]) => c.anim.chat).map(([k]) => k),
        camScene: o.talking, locked: o.state.locked, talkCtx: o.state.ctx.has('talk'), talkWith: !!z.W.talkWith, hudTalking: z.hud.talking(), director: !!z.director?.scene, busy: z.hud.busy() }; }; });
    const run = async (q, how) => {
      const p = await open(q); await inject(p, 'tap', LINES); await defCheck(p);
      const r = await p.evaluate(async how => {
        const z = zone, dlg = document.getElementById('dlg'), tap = () => dlg.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        let taps = 0, ctxSeen = false, lines = 0, gestures = new Set(); z.hud.onLine((n, t, o) => { if (!o?.closed) lines++; });
        const off = how === 'tick' ? (() => { let on = true; z.W.tick(() => { if (!on) return; ctxSeen ||= z.W.orbit.state.ctx.has('talk'); for (const c of Object.values(z.people)) if (c.anim.one) gestures.add(c.anim.one); if (z.hud.talking()) { tap(); taps++; } }); return () => { on = false; }; })()
          : (() => { const id = setInterval(() => { ctxSeen ||= z.W.orbit.state.ctx.has('talk'); if (z.hud.talking()) { tap(); taps++; } }, 100); return () => clearInterval(id); })();
        const t0 = z.W.time(); await z.story.play('tap'); off(); const after = window.__check(); // the moment the scene is over (no frame in between)
        return { taps, lines, gameSecs: +(z.W.time() - t0).toFixed(1), ctxSeen, gestures: [...gestures], shots: z.director?.log.length ?? 0, after };
      }, how);
      const after = r.after;
      await p.evaluate(() => new Promise(r => { const t = zone.W.time(); zone.W.tick(() => { if (zone.W.time() > t + 1.5) r(); }); }));
      const later = await check(p);
      await p.context().close();
      return { ...r, after, later };
    };
    results.tap = {};
    for (const [name, q, how] of [['director, a tap every frame (10/s game time)', 'new&day=1&step=1-3', 'tick'], ['director, 10 taps/s wall clock (~10 per frame)', 'new&day=1&step=1-3', 'wall'], ['?talk=0 (old talk context)', 'new&day=1&step=1-3&talk=0', 'tick']]) {
      const r = await run(q, how); results.tap[name] = r;
      const a = r.after, ok = !a.talking.length && !a.oneShots.length && !a.camScene && !a.locked && !a.talkCtx && !a.talkWith && !a.hudTalking && !a.director;
      log(`   ${name}: ${r.lines} lines, ${r.taps} taps, ${r.gameSecs} s game, ${r.shots} shots, gestures seen ${r.gestures.join(' ') || '-'} · talk context seen during: ${r.ctxSeen}`);
      log(`     right after: ${q.includes('talk=0') ? '(no director: old behaviour — the talk context drops a frame later, story acts run their course)' : ok ? 'OK' : 'NOT OK'} ${JSON.stringify(a)}`);
      log(`     1.5 s later (1-3's own splashes / hops may be on): ${JSON.stringify(r.later)}`);
    }
  }

  // ---------- 4. phone 375×667: one screenshot per shot kind ----------
  if (want('phone')) {
    log('4. phone');
    const p = await open('new&day=1&step=1-3', { width: 375, height: 667 }); await hook(p);
    await inject(p, 'phone', [['ngazwe', LONG, { shot: 'ots', to: 'maythu' }], ['maythu', LONG, { shot: 'two', to: 'ngazwe' }], ['chocho', LONG, { shot: 'close', to: 'maythu' }], ['phoekyaw', LONG, { shot: 'wide', to: 'maythu' }]]);
    await p.evaluate(() => { window.__done = false; zone.story.play('phone').then(() => { window.__done = true; }); });
    const kinds = ['ots', 'two', 'close', 'wide'], got = []; let i = 0;
    for (const t0 = Date.now(); Date.now() - t0 < 900e3;) {
      const s = await p.evaluate(() => ({ q: window.__q.splice(0), done: window.__done }));
      for (const L of s.q) { const k = kinds[i++] ?? 'x' + i; await shot(p, 'phone-' + k); await p.evaluate(() => { zone.W.paused = false; }); got.push({ file: `phone-${k}.jpg`, shot: L.shot, mouth: L.mouth, one: L.one }); log('  ', `phone-${k}.jpg`, JSON.stringify(L.shot), 'mouth', L.mouth); }
      if (s.done) break; await p.waitForTimeout(600);
    }
    results.phone = got;
    await p.context().close();
  }

  await b.close();
  log('console errors:', errs.length, errs.slice(0, 5));
  const fs = require('fs'), RJ = path.join(OUT, 'results.json'); let all = {}; try { all = JSON.parse(fs.readFileSync(RJ, 'utf8')); } catch {}
  fs.writeFileSync(RJ, JSON.stringify({ ...all, ...results, errors: errs }, null, 1)); // the parts run this time replace theirs
})().catch(e => { console.error(e); process.exit(1); });
