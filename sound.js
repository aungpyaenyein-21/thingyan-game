// sound.js — the soundscape, all made in Web Audio (no sound files): street murmur, traffic, crows and sparrows by day,
// crickets, a tokay gecko and the odd dog by night, the market's chatter, the tea shop's TV, and the effects
// (bucket, water gun, splats, horns, bells). No music yet. A zone feeds it an "env" every frame; effects are placed
// in the world and get quieter / pan with distance from you. Audio starts on your first tap or key (browser rule).
export function createSound(W) {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return { env() {}, fx() {}, toggle() {}, muted: () => true };
  let ctx = null, meter = null, master, amb, fxBus, noise, pinkBuf, brownBuf, layers = {}, started = false;
  let muted = false; try { muted = localStorage.getItem('thingyan.mute') === '1'; } catch {}
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
  const src = (buf, loop = true) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = loop; if (loop) s.loopStart = R(); return s; };
  const filt = (type, f, q = 1) => { const n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; return n; };
  const gain = v => { const g = ctx.createGain(); g.gain.value = v; return g; };
  const chain = (...n) => { for (let i = 0; i + 1 < n.length; i++) n[i].connect(n[i + 1]); return n[n.length - 1]; };

  // ---------- continuous layers: a looped noise through filters into a gain the env steers ----------
  function layer(name, buf, nodes, out = amb) { const g = gain(0), s = src(buf); chain(s, ...nodes, g, out); s.start(); layers[name] = { g, nodes, v: 0 }; return layers[name]; }
  function babble(name, n, lo, hi, out = amb) { // distant voices: formant-ish band-passes that wander at syllable rate, gated on and off
    const g = gain(0); g.connect(out); const voices = [];
    for (let i = 0; i < n; i++) { const s = src(pinkBuf), f1 = filt('bandpass', rr(lo, hi), 4), f2 = filt('bandpass', rr(lo * 2, hi * 2), 5), vg = gain(0); chain(s, f1, vg, g); s.connect(f2); f2.connect(vg); s.start(); voices.push({ f1, f2, vg, t: 0, lo, hi }); }
    layers[name] = { g, v: 0, voices }; return layers[name];
  }
  function build() {
    buffers();
    master = gain(muted ? 0 : .9); const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; chain(master, comp, ctx.destination);
    meter = ctx.createAnalyser(); meter.fftSize = 1024; master.connect(meter);
    amb = gain(.8); amb.connect(master); fxBus = gain(1); fxBus.connect(master);
    layer('air', pinkBuf, [filt('lowpass', 900, .5)]);                              // the city's general hum
    layer('traffic', brownBuf, [filt('lowpass', 220, .7)]);                         // engines on the main street
    layer('spray', noise, [filt('highpass', 2600, .5), filt('lowpass', 7000, .5)]);  // hoses and buckets somewhere nearby
    layer('fan', brownBuf, [filt('lowpass', 140, 1)]);                              // the tea shop's wall fan
    babble('crowd', 5, 350, 900);                                                   // people talking all round
    babble('tv', 2, 500, 1300);                                                     // the football commentator on the tea-shop TV
    layer('roar', pinkBuf, [filt('bandpass', 700, .6)]);                            // …and the stadium crowd behind him
  }
  function start() {
    if (started) return; started = true;
    ctx = new AC(); build();
    removeEventListener('pointerdown', start, true); removeEventListener('keydown', start, true);
  }
  addEventListener('pointerdown', start, true); addEventListener('keydown', start, true);
  const btn = document.getElementById('snd'), label = () => { if (btn) { btn.textContent = muted ? '♪ အသံပိတ်' : '♪ အသံ'; btn.classList.toggle('off', muted); } };
  label(); btn?.addEventListener('click', e => { e.stopPropagation(); toggle(); label(); });

  // ---------- one-off sounds ----------
  const now = () => ctx.currentTime;
  function env(g, t, a, peak, d) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); }
  function out(pos, vol = 1) { // a per-sound gain + pan, from where it is relative to you and the camera
    const g = gain(vol), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pos && W.player) {
      const pp = W.player.g.position, dx = pos.x - pp.x, dz = pos.z - pp.z, d = Math.hypot(dx, dz);
      g.gain.value = vol / (1 + d * d / 30); if (p) p.pan.value = Math.max(-1, Math.min(1, (dx - dz) * .09)); // screen-right is +x −z
      if (d > 26) return null;
    }
    if (p) { g.connect(p); p.connect(fxBus); } else g.connect(fxBus); return g;
  }
  function tone(o, type, f0, f1, t, a, d, peak, filter) {
    const s = ctx.createOscillator(), g = gain(0); s.type = type; s.frequency.setValueAtTime(f0, t); if (f1 !== f0) s.frequency.exponentialRampToValueAtTime(f1, t + a + d * .8);
    if (filter) chain(s, filter, g, o); else chain(s, g, o); env(g, t, a, peak, d); s.start(t); s.stop(t + a + d + .05);
  }
  function hiss(o, t, a, d, peak, ...nodes) { const s = src(noise, false), g = gain(0); chain(s, ...nodes, g, o); env(g, t, a, peak, d); s.start(t, R()); s.stop(t + a + d + .05); }
  const FX = {
    splash(o, t) { // a bucketful: a heavy whoosh and a slap
      const lp = filt('lowpass', 3200, .7); lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(500, t + .55);
      hiss(o, t, .02, .55, .9, lp); tone(o, 'sine', 190, 80, t + .05, .01, .18, .35);
    },
    squirt(o, t) { const bp = filt('bandpass', 3800, .9); hiss(o, t, .03, .5, .28, bp); },
    hit(o, t) { hiss(o, t, .003, .09, .35, filt('bandpass', rr(1400, 2200), 1.2)); },
    horn(o, t) { for (const k of [0, .3]) { const lp = filt('lowpass', 1600, .7); tone(o, 'square', 415, 415, t + k, .01, .2, .12, lp); tone(o, 'square', 520, 520, t + k, .01, .2, .09, filt('lowpass', 1600, .7)); } },
    bike(o, t) { for (const k of [0, .22]) { tone(o, 'sine', 2350, 2350, t + k, .002, .45, .16); tone(o, 'sine', 3120, 3120, t + k, .002, .3, .08); } },
    icebell(o, t) { for (const k of [0, .25, .5]) tone(o, 'triangle', 1760, 1760, t + k, .002, .35, .12); },
    bell(o, t) { for (const [f, v, d] of [[196, .35, 4], [494, .2, 3], [784, .12, 2.2], [1180, .06, 1.4]]) tone(o, 'sine', f, f * .998, t, .005, d, v); }, // the kyaung's brass bell
    pop(o, t) { tone(o, 'sine', 660, 990, t, .005, .07, .08); },
  };
  function fx(name, pos, vol = 1) { if (!started || muted || !FX[name]) return; const o = out(pos, vol); if (o) FX[name](o, now()); }

  // ---------- creatures and random life, scheduled from env ----------
  const SCH = { bird: 2, crow: 6, cricket: 0, gecko: 20, dog: 15, clink: 3, bellK: 30 };
  function sparrows(t, v) { const n = 2 + (R() * 5 | 0), f = rr(3200, 5200), o = out(null, v); for (let i = 0; i < n; i++) tone(o, 'sine', f * rr(.9, 1.1), f * rr(.7, 1.3), t + i * rr(.07, .14), .004, .06, .12); }
  function crow(t, v) { const o = out(null, v); for (let i = 0, n = 1 + (R() * 3 | 0); i < n; i++) { const bp = filt('bandpass', 1100, 1.4); tone(o, 'sawtooth', 640, 430, t + i * .42, .02, .28, .16, bp); hiss(o, t + i * .42, .02, .22, .05, filt('bandpass', 1400, 1)); } }
  function crickets(t, v) { const o = out(null, v), f = rr(4300, 5200); for (let i = 0; i < 3; i++) tone(o, 'sine', f, f, t + i * .045, .003, .025, .08); }
  function gecko(t, v) { // တောက်တဲ့: a throaty build-up, then "tok-kay" five or six times, slowing
    const o = out(null, v); hiss(o, t, .2, .5, .05, filt('bandpass', 300, 2));
    for (let i = 0, n = 5 + (R() * 3 | 0); i < n; i++) { const k = t + .8 + i * (.75 + i * .06); tone(o, 'square', 300, 230, k, .005, .09, .1, filt('lowpass', 900, 1)); tone(o, 'square', 190, 140, k + .17, .01, .2, .09, filt('lowpass', 700, 1)); }
  }
  function dog(t, v) { const o = out(null, v); for (let i = 0, n = 1 + (R() * 3 | 0); i < n; i++) { tone(o, 'sawtooth', 380, 210, t + i * .3, .01, .13, .12, filt('lowpass', 1200, 1)); hiss(o, t + i * .3, .005, .1, .06, filt('bandpass', 700, 1)); } }
  function clink(t, v) { const o = out(null, v), f = rr(2600, 4200); tone(o, 'sine', f, f, t, .002, .18, .08); tone(o, 'sine', f * 1.5, f * 1.5, t, .002, .1, .04); }

  // e: { phase: 'morning'|'day'|'late'|'evening', night 0..1, inside: null|'tea'|'barber'|'clothes', street 0..1, market 0..1, crowd 0..1, water 0..1, kyaung 0..1 }
  let last = 0;
  function update(e) {
    if (!started || !ctx) return;
    const t = now(), dt = Math.min(.25, t - last); last = t; if (dt <= 0) return;
    const night = e.night || 0, inn = !!e.inside, outdoors = inn ? .12 : 1, tea = e.inside === 'tea';
    const set = (n, v) => { const L = layers[n]; if (L && Math.abs(L.v - v) > .002) { L.v = v; L.g.gain.setTargetAtTime(v, t, .4); } };
    set('air', (.05 + .05 * (1 - night)) * outdoors + (inn ? .02 : 0));
    set('traffic', (e.street || 0) * .5 * (1 - night * .5) * outdoors);
    set('spray', (e.water || 0) * .1 * outdoors);
    set('crowd', ((e.crowd || 0) * .55 + (e.market || 0) * .4) * outdoors + (tea ? .15 : 0));
    set('fan', tea ? .18 : 0); set('tv', tea ? .3 : 0); set('roar', tea ? .025 + .05 * Math.max(0, Math.sin(t * .23)) ** 6 : 0);
    for (const n of ['crowd', 'tv']) for (const v of layers[n].voices) { // syllables: each voice hops pitch and switches on/off
      if ((v.t -= dt) > 0) continue; v.t = rr(.08, .22);
      v.f1.frequency.setTargetAtTime(rr(v.lo, v.hi), t, .03); v.f2.frequency.setTargetAtTime(rr(v.lo * 2, v.hi * 2.2), t, .03); v.vg.gain.setTargetAtTime(R() < .7 ? rr(.5, 1.2) : 0, t, .04);
    }
    if (inn) { if ((SCH.clink -= dt) < 0) { SCH.clink = rr(1.5, 5); if (tea) clink(t, .5); } return; }
    // outdoors: who's about depends on the hour
    const day = 1 - night, morning = e.phase === 'morning' ? 1 : 0;
    if ((SCH.bird -= dt) < 0) { SCH.bird = rr(1.2, 5) / (.4 + morning + day * .4); if (day > .5) sparrows(t, .5 + morning * .4); }
    if ((SCH.crow -= dt) < 0) { SCH.crow = rr(6, 16); if (day > .3) crow(t, .7); }
    if ((SCH.cricket -= dt) < 0) { SCH.cricket = rr(.25, .7); if (night > .3) crickets(t, night * .9); }
    if ((SCH.gecko -= dt) < 0) { SCH.gecko = rr(35, 70); if (night > .5) gecko(t, .8); }
    if ((SCH.dog -= dt) < 0) { SCH.dog = rr(12, 30); if (night > .3 || R() < .3) dog(t, .5); }
    if ((SCH.bellK -= dt) < 0) { SCH.bellK = rr(20, 40); if ((e.kyaung || 0) > .1 && (morning || R() < .3)) { const o = out(null, e.kyaung * .6); FX.bell(o, t); } }
  }
  function toggle() {
    muted = !muted; try { localStorage.setItem('thingyan.mute', muted ? '1' : '0'); } catch {}
    if (!started) start(); master.gain.setTargetAtTime(muted ? 0 : .9, now(), .1); return muted;
  }
  const level = () => { if (!meter) return 0; const a = new Float32Array(meter.fftSize); meter.getFloatTimeDomainData(a); return Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length); }; // for tests
  return { env: update, fx, toggle, muted: () => muted, level };
}
