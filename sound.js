// sound.js — the soundscape, all made in Web Audio (no sound files). No music yet.
// Continuous beds are kept few and quiet on purpose (a steady broadband hiss reads as "inside a plane"): people talking
// near you, an engine only while a vehicle is close, and the tea shop's room tone. Everything else comes as events —
// sparrows and crows by day, crickets, a tokay gecko and dogs by night, distant splashes, the kyaung bell — and the
// effects you trigger. A zone feeds it an env every frame. Audio starts on the first tap or key (browser rule).
// CATALOG lists every sound with where it's used; sound-test.html plays them one by one.
export const CATALOG = [
  { key: 'crowd', kind: 'loop', name: 'လူစကားပြောသံ', where: 'အနားမှာ လူများရင် (ဈေးထဲ ပိုကျယ်) — ညဘက် ဈေးပိတ်ရင် မရှိ' },
  { key: 'engine', kind: 'loop', name: 'ကားစက်သံ', where: 'ကား / ဘတ်စ်ကား အနားရောက်မှ — ဝေးရင် မကြားရ' },
  { key: 'tv', kind: 'loop', name: 'TV ဘောလုံးပွဲ အသံ', where: 'လက်ဖက်ရည်ဆိုင်ထဲ' },
  { key: 'roar', kind: 'loop', name: 'TV ထဲက ပွဲကြည့်ပရိသတ်', where: 'လက်ဖက်ရည်ဆိုင်ထဲ (တခါတလေ ကျယ်လာ)' },
  { key: 'fan', kind: 'loop', name: 'နံရံပန်ကာ', where: 'လက်ဖက်ရည်ဆိုင်ထဲ' },
  { key: 'sparrows', kind: 'once', name: 'စာကလေး တွန်သံ', where: 'နေ့ဘက် အပြင် (မနက် ပိုများ)' },
  { key: 'crow', kind: 'once', name: 'ကျီးအာသံ', where: 'နေ့ဘက် အပြင်' },
  { key: 'crickets', kind: 'once', name: 'ပုရစ်သံ', where: 'ညဘက် အပြင် (ဆက်တိုက်)' },
  { key: 'gecko', kind: 'once', name: 'တောက်တဲ့ အော်သံ', where: 'ညဘက် (မိနစ်ဝက်တစ်ခါလောက်)' },
  { key: 'dog', kind: 'once', name: 'ခွေးဟောင်သံ', where: 'ညဘက် ပိုများ၊ နေ့ဘက် တခါတလေ' },
  { key: 'farsplash', kind: 'once', name: 'ဝေးဝေးက ရေပက်သံ', where: 'ကလေးတွေ ရေကစားတဲ့နား / မြို့လယ်' },
  { key: 'clink', kind: 'once', name: 'ခွက်ချင်း ထိသံ', where: 'လက်ဖက်ရည်ဆိုင်ထဲ' },
  { key: 'bell', kind: 'once', name: 'ဘုန်းကြီးကျောင်း ခေါင်းလောင်း', where: 'ကျောင်းနား (မနက်) · ခေါင်းလောင်း ထိုးရင်' },
  { key: 'splash', kind: 'fx', name: 'ရေပုံးနဲ့ ပက်သံ', where: 'ရေပုံးနဲ့ ပက်ရင် (ကိုယ် / NPC)' },
  { key: 'squirt', kind: 'fx', name: 'ရေသေနတ်သံ', where: 'ရေသေနတ်နဲ့ ပက်ရင်' },
  { key: 'hit', kind: 'fx', name: 'ရေထိသံ', where: 'ရေက လူကို ထိရင်' },
  { key: 'horn', kind: 'fx', name: 'ကားဟွန်း (ပီ ပီ)', where: 'ကားရှေ့မှာ ရပ်နေရင်' },
  { key: 'bike', kind: 'fx', name: 'စက်ဘီး / ဆိုက်ကား ဘဲလ်', where: 'စက်ဘီး/ဆိုက်ကား ရှေ့မှာ လူရှိရင်' },
  { key: 'icebell', kind: 'fx', name: 'ရေခဲချောင်းလှည်း ခေါင်းလောင်း', where: 'ဈေးလမ်းမှာ လှည်းရပ်ရင်' },
];

// OFF until real recordings replace these synthesized sounds (the in-game ones didn't sound right). The test page (manual) still plays them.
export const ENABLED = false;

export function createSound(W, { manual = false } = {}) {
  if (!ENABLED && !manual) { const b = document.getElementById('snd'); if (b) b.hidden = true; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC || (!ENABLED && !manual)) return { env() {}, fx() {}, play() {}, setLoop() {}, tick() {}, start() {}, toggle() {}, muted: () => true, level: () => 0 };
  let ctx = null, meter = null, master, amb, fxBus, noise, pinkBuf, brownBuf, layers = {}, started = false;
  let muted = false; try { muted = !manual && localStorage.getItem('thingyan.mute') === '1'; } catch {}
  const R = Math.random, rr = (a, b) => a + R() * (b - a);

  function buffers() {
    const n = ctx.sampleRate * 2, w = ctx.createBuffer(1, n, ctx.sampleRate), p = ctx.createBuffer(1, n, ctx.sampleRate), b = ctx.createBuffer(1, n, ctx.sampleRate);
    const wd = w.getChannelData(0), pd = p.getChannelData(0), bd = b.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0, last = 0;
    for (let i = 0; i < n; i++) {
      const x = R() * 2 - 1; wd[i] = x;
      b0 = .99765 * b0 + x * .099046; b1 = .963 * b1 + x * .2965164; b2 = .57 * b2 + x * 1.0526913; pd[i] = (b0 + b1 + b2 + x * .1848) * .2; // pink
      last = (last + .02 * x) / 1.02; bd[i] = last * 3.5;                                                                         // brown
    }
    noise = w; pinkBuf = p; brownBuf = b;
  }
  const src = (buf, loop = true) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = loop; return s; };
  const filt = (type, f, q = 1) => { const n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; return n; };
  const gain = v => { const g = ctx.createGain(); g.gain.value = v; return g; };
  const chain = (...n) => { for (let i = 0; i + 1 < n.length; i++) n[i].connect(n[i + 1]); return n[n.length - 1]; };

  // ---------- the few continuous beds ----------
  function layer(name, buf, nodes) { const g = gain(0), s = src(buf); chain(s, ...nodes, g, amb); s.start(0, R()); layers[name] = { g, v: 0 }; return layers[name]; }
  function babble(name, n, lo, hi) { // voices: narrow formant band-passes that hop at syllable rate, talking in runs with pauses
    const g = gain(0); g.connect(amb); const voices = [];
    for (let i = 0; i < n; i++) { const s = src(pinkBuf), f1 = filt('bandpass', rr(lo, hi), 9), f2 = filt('bandpass', rr(lo * 2, hi * 2), 11), vg = gain(0); chain(s, f1, vg, g); s.connect(f2); f2.connect(vg); s.start(0, R()); voices.push({ f1, f2, vg, t: 0, lo, hi, talk: 0 }); }
    layers[name] = { g, v: 0, voices }; return layers[name];
  }
  function build() {
    buffers();
    master = gain(muted ? 0 : .9); const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; chain(master, comp, ctx.destination);
    meter = ctx.createAnalyser(); meter.fftSize = 1024; master.connect(meter);
    amb = gain(.8); amb.connect(master); fxBus = gain(1); fxBus.connect(master);
    babble('crowd', 4, 380, 950);
    { // an engine: a low growl that only sounds while something with a motor is close
      const g = gain(0), o = ctx.createOscillator(), lp = filt('lowpass', 240, 1.2), n = src(brownBuf), nl = filt('lowpass', 300, .8), ng = gain(.5);
      o.type = 'sawtooth'; o.frequency.value = 52; chain(o, lp, g, amb); chain(n, nl, ng, g); o.start(); n.start();
      const lfo = ctx.createOscillator(), lg = gain(5); lfo.frequency.value = 7; chain(lfo, lg, o.frequency); lfo.start(); layers.engine = { g, v: 0 };
    }
    babble('tv', 1, 600, 1400);
    layer('roar', pinkBuf, [filt('bandpass', 750, 1.2)]);
    layer('fan', brownBuf, [filt('lowpass', 110, 1)]);
  }
  function start() {
    if (started) return; started = true;
    ctx = new AC(); build();
    removeEventListener('pointerdown', start, true); removeEventListener('keydown', start, true);
  }
  if (!manual) { addEventListener('pointerdown', start, true); addEventListener('keydown', start, true); }
  const btn = !manual && document.getElementById('snd'), label = () => { if (btn) { btn.textContent = muted ? '♪ အသံပိတ်' : '♪ အသံ'; btn.classList.toggle('off', muted); } };
  label(); if (btn) btn.addEventListener('click', e => { e.stopPropagation(); toggle(); label(); });

  // ---------- one-off sounds ----------
  const now = () => ctx.currentTime;
  function env(g, t, a, peak, d) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); }
  function out(pos, vol = 1) { // a per-sound gain + pan, from where it is relative to you
    const g = gain(vol), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pos && W?.player) {
      const pp = W.player.g.position, dx = pos.x - pp.x, dz = pos.z - pp.z, d = Math.hypot(dx, dz);
      if (d > 26) return null;
      g.gain.value = vol / (1 + d * d / 30); if (p) p.pan.value = Math.max(-1, Math.min(1, (dx - dz) * .09)); // screen-right is +x −z
    }
    if (p) { g.connect(p); p.connect(fxBus); } else g.connect(fxBus); return g;
  }
  function tone(o, type, f0, f1, t, a, d, peak, filter) {
    const s = ctx.createOscillator(), g = gain(0); s.type = type; s.frequency.setValueAtTime(f0, t); if (f1 !== f0) s.frequency.exponentialRampToValueAtTime(f1, t + a + d * .8);
    if (filter) chain(s, filter, g, o); else chain(s, g, o); env(g, t, a, peak, d); s.start(t); s.stop(t + a + d + .05);
  }
  function hiss(o, t, a, d, peak, ...nodes) { const s = src(noise, false), g = gain(0); chain(s, ...nodes, g, o); env(g, t, a, peak, d); s.start(t, R()); s.stop(t + a + d + .05); }
  const ONE = {
    splash(o, t) { const lp = filt('lowpass', 3200, .7); lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(500, t + .55); hiss(o, t, .02, .55, .9, lp); tone(o, 'sine', 190, 80, t + .05, .01, .18, .35); },
    squirt(o, t) { hiss(o, t, .03, .5, .28, filt('bandpass', 3800, .9)); },
    hit(o, t) { hiss(o, t, .003, .09, .35, filt('bandpass', rr(1400, 2200), 1.2)); },
    horn(o, t) { for (const k of [0, .3]) { tone(o, 'square', 415, 415, t + k, .01, .2, .12, filt('lowpass', 1600, .7)); tone(o, 'square', 520, 520, t + k, .01, .2, .09, filt('lowpass', 1600, .7)); } },
    bike(o, t) { for (const k of [0, .22]) { tone(o, 'sine', 2350, 2350, t + k, .002, .45, .16); tone(o, 'sine', 3120, 3120, t + k, .002, .3, .08); } },
    icebell(o, t) { for (const k of [0, .25, .5]) tone(o, 'triangle', 1760, 1760, t + k, .002, .35, .12); },
    bell(o, t) { for (const [f, v, d] of [[196, .35, 4], [494, .2, 3], [784, .12, 2.2], [1180, .06, 1.4]]) tone(o, 'sine', f, f * .998, t, .005, d, v); },
    sparrows(o, t) { const n = 2 + (R() * 5 | 0), f = rr(3200, 5200); for (let i = 0; i < n; i++) tone(o, 'sine', f * rr(.9, 1.1), f * rr(.7, 1.3), t + i * rr(.07, .14), .004, .06, .12); },
    crow(o, t) { for (let i = 0, n = 1 + (R() * 3 | 0); i < n; i++) { tone(o, 'sawtooth', 640, 430, t + i * .42, .02, .28, .16, filt('bandpass', 1100, 1.4)); hiss(o, t + i * .42, .02, .22, .05, filt('bandpass', 1400, 1)); } },
    crickets(o, t) { const f = rr(4300, 5200); for (let i = 0; i < 3; i++) tone(o, 'sine', f, f, t + i * .045, .003, .025, .08); },
    gecko(o, t) { // တောက်တဲ့: a throaty build-up, then "tok-kay" five to seven times, slowing
      hiss(o, t, .2, .5, .05, filt('bandpass', 300, 2));
      for (let i = 0, n = 5 + (R() * 3 | 0); i < n; i++) { const k = t + .8 + i * (.75 + i * .06); tone(o, 'square', 300, 230, k, .005, .09, .1, filt('lowpass', 900, 1)); tone(o, 'square', 190, 140, k + .17, .01, .2, .09, filt('lowpass', 700, 1)); }
    },
    dog(o, t) { for (let i = 0, n = 1 + (R() * 3 | 0); i < n; i++) { tone(o, 'sawtooth', 380, 210, t + i * .3, .01, .13, .12, filt('lowpass', 1200, 1)); hiss(o, t + i * .3, .005, .1, .06, filt('bandpass', 700, 1)); } },
    farsplash(o, t) { hiss(o, t, .02, .4, .18, filt('lowpass', 1800, .7)); },
    clink(o, t) { const f = rr(2600, 4200); tone(o, 'sine', f, f, t, .002, .18, .08); tone(o, 'sine', f * 1.5, f * 1.5, t, .002, .1, .04); },
  };
  function fx(name, pos, vol = 1) { if (!started || muted || !ONE[name]) return; const o = out(pos, vol); if (o) ONE[name](o, now()); }
  function play(key, vol = 1) { start(); if (ctx.state === 'suspended') ctx.resume(); if (ONE[key]) ONE[key](out(null, vol), now()); } // for the test page

  // ---------- the beds' levels + scheduled creatures ----------
  const SCH = { bird: 2, crow: 6, cricket: 0, gecko: 20, dog: 15, clink: 3, bellK: 30, splash: 2 };
  const setL = (n, v, t = now()) => { const L = layers[n]; if (L && Math.abs(L.v - v) > .002) { L.v = v; L.g.gain.setTargetAtTime(v, t, .35); } };
  function voices(dt, t) { // syllables: each voice hops pitch and talks in short runs, with pauses between
    for (const n of ['crowd', 'tv']) { if (!layers[n].v) continue; for (const v of layers[n].voices) {
      if ((v.t -= dt) > 0) continue;
      if (v.talk <= 0) { v.talk = rr(.6, 2.2); v.t = rr(.3, 1.4); v.vg.gain.setTargetAtTime(0, t, .05); continue; } // a pause
      v.t = rr(.07, .18); v.talk -= v.t;
      v.f1.frequency.setTargetAtTime(rr(v.lo, v.hi), t, .02); v.f2.frequency.setTargetAtTime(rr(v.lo * 2, v.hi * 2.2), t, .02); v.vg.gain.setTargetAtTime(R() < .8 ? rr(.6, 1.3) : .1, t, .03);
    } }
  }
  // e: { phase, night 0..1, inside, market 0..1, crowd 0..1, water 0..1, kyaung 0..1, engine 0..1 }
  let last = 0;
  function update(e, force) { // force: the test page plays a scene through the same rules
    if (!started || !ctx || (manual && !force)) return;
    const t = now(), dt = Math.min(.25, t - last); last = t; if (dt <= 0) return;
    const night = e.night || 0, inn = !!e.inside, outside = inn ? 0 : 1, tea = e.inside === 'tea';
    setL('crowd', ((e.crowd || 0) * .4 + (e.market || 0) * .3) * outside + (tea ? .12 : 0));
    setL('engine', (e.engine || 0) * .35 * outside);
    setL('fan', tea ? .12 : 0); setL('tv', tea ? .25 : 0); setL('roar', tea ? .02 * Math.max(0, Math.sin(t * .23)) ** 6 : 0);
    voices(dt, t);
    if (inn) { if ((SCH.clink -= dt) < 0) { SCH.clink = rr(1.5, 5); if (tea) ONE.clink(out(null, .5), t); } return; }
    const day = 1 - night, morning = e.phase === 'morning' ? 1 : 0;
    if ((SCH.bird -= dt) < 0) { SCH.bird = rr(1.2, 5) / (.4 + morning + day * .4); if (day > .5) ONE.sparrows(out(null, .5 + morning * .4), t); }
    if ((SCH.crow -= dt) < 0) { SCH.crow = rr(6, 16); if (day > .3) ONE.crow(out(null, .7), t); }
    if ((SCH.cricket -= dt) < 0) { SCH.cricket = rr(.25, .7); if (night > .3) ONE.crickets(out(null, night * .9), t); }
    if ((SCH.gecko -= dt) < 0) { SCH.gecko = rr(35, 70); if (night > .5) ONE.gecko(out(null, .8), t); }
    if ((SCH.dog -= dt) < 0) { SCH.dog = rr(12, 30); if (night > .3 || R() < .3) ONE.dog(out(null, .5), t); }
    if ((SCH.splash -= dt) < 0) { SCH.splash = rr(.6, 2.5); if ((e.water || 0) > .1) ONE.farsplash(out(null, e.water * .7), t); }
    if ((SCH.bellK -= dt) < 0) { SCH.bellK = rr(20, 40); if ((e.kyaung || 0) > .1 && (morning || R() < .3)) ONE.bell(out(null, e.kyaung * .6), t); }
  }
  function setLoop(key, v) { start(); if (ctx.state === 'suspended') ctx.resume(); setL(key, v); } // for the test page
  function tick(dt) { if (started) voices(dt, now()); }                                          // the test page drives the voices itself
  function toggle() {
    muted = !muted; try { localStorage.setItem('thingyan.mute', muted ? '1' : '0'); } catch {}
    if (!started) start(); master.gain.setTargetAtTime(muted ? 0 : .9, now(), .1); return muted;
  }
  const level = () => { if (!meter) return 0; const a = new Float32Array(meter.fftSize); meter.getFloatTimeDomainData(a); return Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length); };
  return { env: update, fx, play, setLoop, tick, start, toggle, muted: () => muted, level };
}
