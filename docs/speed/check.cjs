// docs/speed/check.cjs — T9 "kids move quick and nimble": the player kid (Thura, size .72) in the real ward (yangon.html, step 1-3, free play)
//   · ground speed in walk / jog / run, time to full speed, time to a stop, turn time (90°) — before (main) → after (this branch)
//   · foot skate: the stance foot's world drift while it is planted, per step (walk / jog / run) — target ≤ 2 cm
//   · the camera: where the runner sits on screen (NDC x) during a long run → does she run off the leading edge?
//   · a frame sequence: stand → jog → run → turn a corner → stop (docs/speed/seq-*.jpg)
// node docs/speed/check.cjs [after=8796] [before=8797] [only=speed,shots]   (static servers on the repo roots; headless Chromium, swiftshader)
// Game time only: ?dt=.02 caps a frame at 20 ms of game time, and the browser draws far slower than that, so every frame is exactly .02 s.
const { chromium } = require('playwright'); const path = require('path');
const AFTER = +process.argv[2] || 8796, BEFORE = +process.argv[3] || 8797, ONLY = (process.argv[4] || 'speed,shots').split(','), OUT = __dirname;
const errs = [];

async function open(b, port, dt, vp = { width: 320, height: 200 }) {
  const p = await b.newPage({ viewport: vp });
  p.on('pageerror', e => errs.push(`${port}: ${e.message}`)); p.on('console', m => m.type() === 'error' && errs.push(`${port}: ${m.text()}`));
  await p.goto(`http://localhost:${port}/yangon.html?new&day=1&step=1-3&debug&dt=${dt}`); await p.waitForFunction(() => window.zone?.W?.player, null, { timeout: 180000 });
  await p.evaluate(() => { zone.fast = true; });
  await p.waitForFunction(() => !zone.story.playing && !zone.hud.busy() && !zone.W.frozen, null, { timeout: 180000, polling: 500 });
  // in-page driver: a script of [game seconds, action] steps run from a W.tick (so inputs land on exact frames), a recorder on the player's animator
  await p.evaluate(() => {
    const W = zone.W, pl = W.player, pa = pl.anim, V = W.THREE.Vector3, a = new V(), ndc = new V();
    window.REC = []; window.RUN = null;
    const upd = pa.update.bind(pa);
    pa.update = dt => { upd(dt); if (!RUN?.rec) return; const f = pl.ch.legs.map(l => l.foot.getWorldPosition(a).toArray());
      ndc.copy(pl.g.position).setY(pl.g.position.y + .5).project(W.cam);
      REC.push({ t: W.time(), x: pl.g.position.x, z: pl.g.position.z, ry: pl.g.rotation.y, loop: pa.loop, v: W.move?.speed() ?? null, f, sx: ndc.x, hop: pa.hopK ?? -1 }); };
    const cv = W.renderer.domElement, ev = (type, x, y) => (type === 'pointerdown' ? cv : window).dispatchEvent(new PointerEvent(type, { pointerId: 9, pointerType: 'touch', clientX: x, clientY: y, bubbles: true }));
    window.DO = {
      at: (x, z, ry) => { pl.g.position.set(x, pl.g.position.y, z); pl.g.rotation.y = ry; pa.setLoop('idle'); W.snapCam(); },
      key: (k, on) => { W.keys[k] = on; },
      stick: (dx, dy) => { const x0 = 120, y0 = innerHeight - 120; if (dx === null) { ev('pointerup', x0, y0); return; } ev('pointerdown', x0, y0); ev('pointermove', x0 + dx, y0 + dy); },
      rec: on => { RUN.rec = on; }, mark: name => { RUN.marks.push([name, W.time()]); }, pause: name => { RUN.shot = name; W.paused = true; },
    };
    W.tick(() => { const r = RUN; if (!r || r.i >= r.steps.length) return; const t = W.time() - r.t0;
      while (r.i < r.steps.length && t >= r.steps[r.i][0] && !W.paused) { const [, fn, ...args] = r.steps[r.i++]; DO[fn](...args); }
      if (r.i >= r.steps.length) r.done = true; });
    W.orbit.lock(0); // the camera south of you: D runs east across the screen (a side view of the legs), W runs north, away
  });
  return p;
}
// run a script; screenshots when it pauses
async function play(p, steps, shot) {
  await p.evaluate(steps => { REC.length = 0; RUN = { steps, i: 0, t0: zone.W.time(), marks: [], rec: false, done: false, shot: null }; }, steps);
  for (;;) {
    await p.waitForFunction(() => RUN.done || RUN.shot, null, { timeout: 900000, polling: 250 });
    const s = await p.evaluate(() => RUN.shot);
    if (!s) break;
    if (shot) await shot(s);
    await p.evaluate(() => { RUN.shot = null; zone.W.paused = false; });
  }
  return p.evaluate(() => ({ rec: REC.splice(0), marks: RUN.marks }));
}

// ---------- analysis ----------
const r2 = v => +v.toFixed(2), r3 = v => +v.toFixed(3);
function segment(rec, t0, t1) { return rec.filter(s => s.t > t0 && s.t <= t1); }
function speedOf(rec, t0, t1) { const s = segment(rec, t0, t1); if (s.length < 2) return 0; const a = s[0], b = s[s.length - 1]; return Math.hypot(b.x - a.x, b.z - a.z) / (b.t - a.t); }
function stepSpeeds(rec) { const o = []; for (let i = 1; i < rec.length; i++) { const a = rec[i - 1], b = rec[i]; o.push({ t: b.t, v: Math.hypot(b.x - a.x, b.z - a.z) / (b.t - a.t) }); } return o; }
function rampUp(rec, tPress, top) { const s = stepSpeeds(rec).filter(x => x.t > tPress); const hit = s.find(x => x.v >= .95 * top); return hit ? hit.t - tPress : null; }
function stopT(rec, tRel) { const s = stepSpeeds(rec).filter(x => x.t > tRel); let last = tRel; for (const x of s) if (x.v > .02) last = x.t; return last - tRel; }
// foot skate: the lower foot is the stance foot; while it is within 1 cm of its lowest in that stance, how far does it slide (max spread, metres)?
function skate(rec, t0, t1) {
  const s = segment(rec, t0, t1), out = []; let cur = null;
  const flush = () => { if (!cur || cur.length < 3) return; const lo = Math.min(...cur.map(f => f[1])), planted = cur.filter(f => f[1] <= lo + .01);
    let d = 0; for (const a of planted) for (const b of planted) d = Math.max(d, Math.hypot(a[0] - b[0], a[2] - b[2])); out.push({ d, n: planted.length }); };
  let side = -1;
  for (const x of s) { const k = x.f[0][1] < x.f[1][1] ? 0 : 1; if (k !== side) { flush(); cur = []; side = k; } cur.push(x.f[k]); }
  flush(); out.shift(); // the first stance is cut by the window
  if (!out.length) return null;
  const ds = out.map(o => o.d).sort((a, b) => a - b);
  return { steps: ds.length, median: r3(ds[ds.length >> 1]), max: r3(ds[ds.length - 1]), samplesPerStance: Math.round(out.reduce((a, o) => a + o.n, 0) / out.length) };
}
function turnT(rec, tPress, want) {
  const s = rec.filter(x => x.t >= tPress), err = x => Math.abs(Math.atan2(Math.sin(want - x.ry), Math.cos(want - x.ry)));
  const t10 = s.find(x => err(x) < 10 * Math.PI / 180), t2 = s.find(x => err(x) < 2 * Math.PI / 180);
  return { to10deg: t10 ? r2(t10.t - tPress) : null, to2deg: t2 ? r2(t2.t - tPress) : null };
}

async function measure(b, port, configs) {
  const p = await open(b, port, .02), res = {};
  const kidOn = await p.evaluate(() => !!zone.W.move?.kid);
  const gears = kidOn ? [['walk', 'stick', 18], ['jog', 'key'], ['run', 'shift']] : [['walk', 'key'], ['run', 'shift']];
  for (const cfg of configs) {
    if (cfg) await p.evaluate(c => Object.assign(zone.W.move.kid, c), cfg);
    const name = cfg ? `gait ${cfg.gait} · stride ${cfg.stride}` : 'main';
    const R = res[name] = {};
    for (const [gear, how, px] of gears) {
      const press = how === 'stick' ? [['stick', px, 0]] : [['key', 'KeyD', true], ...(how === 'shift' ? [['key', 'ShiftLeft', true]] : [])];
      const release = how === 'stick' ? [['stick', null]] : [['key', 'KeyD', false], ['key', 'ShiftLeft', false]];
      const hold = 2.2;
      const steps = [[0, 'at', -5, -3, Math.PI / 2], [.02, 'rec', true], [.3, 'mark', 'press'], ...press.map(s => [.3, ...s]), [.3 + hold, 'mark', 'release'], ...release.map(s => [.3 + hold, ...s]), [.3 + hold + .6, 'rec', false]];
      const { rec, marks } = await play(p, steps);
      const tP = marks.find(m => m[0] === 'press')[1], tR = marks.find(m => m[0] === 'release')[1];
      const top = speedOf(rec, tR - 1.2, tR);
      R[gear] = { loop: rec.find(x => x.t > tR - .5)?.loop, speed: r2(top), toFull: rampUp(rec, tP, top) === null ? null : r2(rampUp(rec, tP, top)), toStop: r2(stopT(rec, tR)),
        skate: skate(rec, tR - 1.4, tR), hops: new Set(rec.filter(x => x.hop >= 0).map(x => Math.round(x.t * 10))).size > 0, screenX: [r2(Math.min(...segment(rec, tP, tR).map(x => x.sx))), r2(Math.max(...segment(rec, tP, tR).map(x => x.sx)))] };
      console.log(port, name, gear, JSON.stringify(R[gear]));
    }
    // a 90° turn while jogging (main: walking): east, then north
    const steps = [[0, 'at', -1.6, 2, Math.PI / 2], [.02, 'rec', true], [.3, 'key', 'KeyD', true], [1.3, 'key', 'KeyD', false], [1.3, 'key', 'KeyW', true], [1.3, 'mark', 'turn'], [2.1, 'key', 'KeyW', false], [2.6, 'rec', false]];
    const { rec, marks } = await play(p, steps);
    R.turn = turnT(rec, marks[0][1], Math.PI); console.log(port, name, 'turn', JSON.stringify(R.turn));
  }
  await p.close(); return res;
}

async function shots(b, port) { // the sequence: stand → jog → run → turn a corner → stop, paused at each beat for the screenshot
  const p = await open(b, port, .05, { width: 800, height: 500 }); let n = 0;
  const steps = [[0, 'at', -5, 2, Math.PI / 2], [.6, 'pause', 'stand'], // east across the screen, then the corner: north, away from the camera
    [.7, 'key', 'KeyD', true], [1.4, 'pause', 'jog'], [1.5, 'key', 'ShiftLeft', true], [2.3, 'pause', 'run'], [2.4, 'pause', 'run-2'],
    [2.55, 'key', 'KeyD', false], [2.55, 'key', 'KeyW', true], [2.6, 'pause', 'turn'], [2.65, 'pause', 'turn-2'], [3.3, 'pause', 'run-north'],
    [3.4, 'key', 'KeyW', false], [3.4, 'key', 'ShiftLeft', false], [3.45, 'pause', 'stopping'], [4.0, 'pause', 'stopped']];
  await play(p, steps, async s => { n++; await p.screenshot({ path: path.join(OUT, `seq-${n}-${s}.jpg`), type: 'jpeg', quality: 72, timeout: 180000 }); console.log('shot', n, s); });
  // close-ups of one stride (side view) for the walk and the jog, and a hop-skip on the run
  await p.evaluate(() => { zone.W.orbit.lock(0); zone.W.orbit.zoom(.6); });
  for (const [gear, keys] of [['walk', []], ['jog', ['KeyD']], ['run', ['KeyD', 'ShiftLeft']]]) {
    const st = [[0, 'at', -5, -3, Math.PI / 2], ...(gear === 'walk' ? [[.1, 'stick', 18, 0]] : keys.map(k => [.1, 'key', k, true]))];
    for (let i = 0; i < 4; i++) st.push([1.2 + i * .1, 'pause', `${gear}-${i}`]);
    st.push([1.65, ...(gear === 'walk' ? ['stick', null] : ['key', 'KeyD', false])], [1.65, 'key', 'ShiftLeft', false], [2.2, 'mark', 'end']);
    await play(p, st, async s => { await p.screenshot({ path: path.join(OUT, `stride-${s}.jpg`), type: 'jpeg', quality: 72, timeout: 180000 }); console.log('shot', s); });
  }
  await p.close();
}

(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const out = {};
  if (ONLY.includes('speed')) {
    out.before = await measure(b, BEFORE, [null]);
    out.after = await measure(b, AFTER, [{ gait: 1.6, stride: 1 }, { gait: 1.45, stride: 1.1 }]);
  }
  if (ONLY.includes('shots')) await shots(b, AFTER);
  console.log(JSON.stringify(out, null, 1));
  console.log('console errors:', errs.length, errs.slice(0, 10));
  await b.close();
})();
