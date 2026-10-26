// sound.js — the soundscape from real recordings (audio/*.mp3, cut from free-licence files on Wikimedia Commons and from
// radio aporee field recordings made in Myanmar (Internet Archive); who made each one is in audio/credits.json and on the
// in-game credits panel). No music yet.
// Beds loop quietly under everything and follow where you are (the Shwedagon crows-bells-voices by day, Scott Market talk
// where people are, crickets at night, traffic only near a vehicle, the football crowd on the tea-shop TV); creatures and effects play as one-shots, placed in
// the world so they pan and fade with distance. Audio starts on the first tap or key (browser rule).
export const ENABLED = true;
const FILES = { pagoda: 'pagoda', crowd: 'crowd', night: 'night', traffic: 'traffic', stadium: 'stadium', gecko: 'gecko', dog: 'dog', horn: 'horn', bike: 'bike',
  bell: 'bell', handbell: 'handbell', splash: 'splash', hit: 'hit', squirt: 'squirt', sparrow: ['sparrow1', 'sparrow2', 'sparrow3', 'sparrow4'], crow: ['crow1', 'crow2', 'crow3', 'crow4'] };
const BEDS = ['pagoda', 'crowd', 'night', 'traffic', 'stadium'];
const url = name => new URL(`./audio/${name}.mp3?v=3`, import.meta.url).href; // bump when the files change

// for the test page: every sound, where it plays
export const CATALOG = [
  { key: 'pagoda', kind: 'loop', name: 'ဘုရား/ကျောင်း နောက်ခံ (ကျီး၊ ခေါင်းလောင်း၊ လူသံ)', where: 'နေ့ဘက် အပြင် တိုးတိုး — ဘုန်းကြီးကျောင်းနား ကျယ်' },
  { key: 'crowd', kind: 'loop', name: 'လူစကားပြောသံ (ရန်ကုန် ဘိုချုပ်ဈေး)', where: 'လူများတဲ့နေရာ၊ ဈေးထဲ (ညဘက် ဈေးပိတ်ရင် မရှိ)' },
  { key: 'night', kind: 'loop', name: 'ည ပုရစ်သံ', where: 'ညဘက် အပြင်' },
  { key: 'traffic', kind: 'loop', name: 'ကားသံ', where: 'ကား / ဘတ်စ်ကား အနားရောက်မှ' },
  { key: 'stadium', kind: 'loop', name: 'TV ဘောလုံးပွဲ ပရိသတ်', where: 'လက်ဖက်ရည်ဆိုင်ထဲ' },
  { key: 'sparrow', kind: 'once', name: 'စာကလေး တွန်သံ', where: 'နေ့ဘက် အပြင် (မနက် ပိုများ)' },
  { key: 'crow', kind: 'once', name: 'ကျီးအာသံ', where: 'နေ့ဘက် အပြင်' },
  { key: 'gecko', kind: 'once', name: 'တောက်တဲ့ အော်သံ', where: 'ညဘက် (မိနစ်ဝက်တစ်ခါလောက်)' },
  { key: 'dog', kind: 'once', name: 'ခွေးဟောင်သံ', where: 'ညဘက် ပိုများ၊ နေ့ဘက် တခါတလေ' },
  { key: 'bell', kind: 'once', name: 'ဘုန်းကြီးကျောင်း ခေါင်းလောင်း', where: 'ဘုန်းကြီးကျောင်းနား (မနက် ပိုများ)' },
  { key: 'handbell', kind: 'fx', name: 'လက်ခေါင်းလောင်း', where: 'ရေခဲချောင်းလှည်း' },
  { key: 'splash', kind: 'fx', name: 'ရေပုံးနဲ့ ပက်သံ', where: 'ရေပုံးနဲ့ ပက်ရင် · ဝေးဝေးက ရေကစားသံ (တိုး)' },
  { key: 'squirt', kind: 'fx', name: 'ရေသေနတ်သံ', where: 'ရေသေနတ်နဲ့ ပက်ရင်' },
  { key: 'hit', kind: 'fx', name: 'ရေထိသံ', where: 'ရေက လူကို ထိရင်' },
  { key: 'horn', kind: 'fx', name: 'ကားဟွန်း (ပီ ပီ)', where: 'ကားရှေ့မှာ ရပ်နေရင်' },
  { key: 'bike', kind: 'fx', name: 'စက်ဘီး / ဆိုက်ကား ဘဲလ်', where: 'စက်ဘီး/ဆိုက်ကား ရှေ့မှာ လူရှိရင်' },
];

// the credits panel: who recorded each sound, its licence, a link to the original (CC BY-SA asks for this)
export async function showCredits() {
  let box = document.getElementById('credits');
  if (!box) {
    box = document.createElement('div'); box.id = 'credits'; box.className = 'panel'; document.body.appendChild(box);
    box.addEventListener('click', e => { e.stopPropagation(); if (e.target === box || e.target.dataset.close != null) box.hidden = true; });
  }
  const c = await fetch(new URL('./audio/credits.json?v=3', import.meta.url)).then(r => r.json()).catch(() => ({}));
  const seen = new Map(); for (const v of Object.values(c)) { const k = v.page; if (!seen.has(k)) seen.set(k, { ...v, whats: new Set() }); seen.get(k).whats.add(v.what); }
  box.innerHTML = '<b>အသံ — ကျေးဇူးတင်ပါတယ်</b><p>Wikimedia Commons နဲ့ radio aporee (Internet Archive — မြန်မာပြည်မှာ ဖမ်းထားတဲ့ အသံ) ပေါ်က အခမဲ့ အသံဖိုင်တွေကို ဖြတ်ညှိပြီး သုံးထားပါတယ်။</p><ul></ul><button type="button" data-close>ပိတ်မယ်</button>';
  const ul = box.querySelector('ul');
  for (const v of seen.values()) { const li = document.createElement('li'); const a = document.createElement('a'); a.href = v.page; a.target = '_blank'; a.rel = 'noopener'; a.textContent = v.title;
    li.append([...v.whats].join(' · ') + ' — ', a, ` · ${v.author} · ${v.license}`); ul.appendChild(li); }
  box.hidden = false;
}

export function createSound(W, { manual = false } = {}) {
  const AC = window.AudioContext || window.webkitAudioContext;
  const none = { env() {}, fx() {}, play() {}, setLoop() {}, tick() {}, start() {}, toggle() {}, muted: () => true, level: () => 0 };
  if (!AC || (!ENABLED && !manual)) { const b = document.getElementById('snd'); if (b) b.hidden = true; return none; }
  let ctx = null, master, fxBus, meter = null, started = false;
  const buf = {}, beds = {};
  let muted = false; try { muted = !manual && localStorage.getItem('thingyan.mute') === '1'; } catch {}
  const R = Math.random, rr = (a, b) => a + R() * (b - a), pickOne = a => a[(R() * a.length) | 0];

  function start() {
    if (started) return; started = true;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 1;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3; master.connect(comp); comp.connect(ctx.destination);
    meter = ctx.createAnalyser(); meter.fftSize = 1024; master.connect(meter);
    fxBus = ctx.createGain(); fxBus.connect(master);
    for (const [k, f] of Object.entries(FILES)) for (const n of [].concat(f)) fetch(url(n)).then(r => r.arrayBuffer()).then(a => ctx.decodeAudioData(a)).then(b => {
      (buf[k] ??= []).push(b);
      if (BEDS.includes(k)) { // a bed starts looping, silent, as soon as it's loaded
        const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = b; s.loop = true; g.gain.value = 0; s.connect(g); g.connect(master); s.start(0, R() * b.duration);
        beds[k] = { g, v: 0, want: beds[k]?.want ?? 0 }; setBed(k, beds[k].want);
      }
    }).catch(() => {});
    removeEventListener('pointerdown', start, true); removeEventListener('keydown', start, true);
  }
  if (!manual) { addEventListener('pointerdown', start, true); addEventListener('keydown', start, true); }
  const btn = !manual && document.getElementById('snd'), label = () => { if (btn) { btn.textContent = muted ? '♪ အသံပိတ်' : '♪ အသံ'; btn.classList.toggle('off', muted); } };
  label(); if (btn) btn.addEventListener('click', e => { e.stopPropagation(); toggle(); label(); });
  document.getElementById('cred')?.addEventListener('click', e => { e.stopPropagation(); showCredits(); });

  function setBed(k, v) { const b = beds[k]; if (!b) { beds[k] = { want: v }; return; } b.want = v; if (b.g && Math.abs(b.v - v) > .003) { b.v = v; b.g.gain.setTargetAtTime(v, ctx.currentTime, .6); } }
  function out(pos, vol) { // gain + pan from where the sound is relative to you; null if too far to hear
    const g = ctx.createGain(); g.gain.value = vol; let p = null;
    if (pos && W?.player) {
      const pp = W.player.g.position, dx = pos.x - pp.x, dz = pos.z - pp.z, d = Math.hypot(dx, dz); if (d > 24) return null;
      g.gain.value = vol / (1 + d * d / 40);
      if (ctx.createStereoPanner) { p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, (dx - dz) * .08)); } // screen-right is +x −z
    }
    if (p) { g.connect(p); p.connect(fxBus); } else g.connect(fxBus); return g;
  }
  function shot(k, pos, vol = 1, rate = 1) {
    if (!started || !buf[k]) return; const o = out(pos, vol); if (!o) return;
    const s = ctx.createBufferSource(); s.buffer = pickOne(buf[k]); s.playbackRate.value = rate * rr(.96, 1.04); s.connect(o); s.start();
  }
  const FX = { splash: [1], squirt: [.7], hit: [.6], horn: [.8], bike: [.8], bell: [.9], handbell: [.6], icebell: [.6, 'handbell', 1.6] }; // name: [volume, sample?, rate]
  function fx(name, pos) { if (muted) return; const f = FX[name]; if (f) shot(f[1] || name, pos, f[0], f[2] || 1); }
  function play(key) { start(); if (ctx.state === 'suspended') ctx.resume(); shot(key, null, 1); } // test page

  // e: { phase, night 0..1, inside, market 0..1, crowd 0..1, water 0..1, kyaung 0..1, engine 0..1 }
  const SCH = { bird: 2, crow: 5, gecko: 25, dog: 14, bell: 25, splash: 2 };
  let last = 0;
  function update(e, force) {
    if (!started || (manual && !force)) return;
    const t = ctx.currentTime, dt = Math.min(.25, t - last); last = t; if (dt <= 0) return;
    const night = e.night || 0, day = 1 - night, inn = !!e.inside, outside = inn ? 0 : 1, tea = e.inside === 'tea', morning = e.phase === 'morning' ? 1 : 0;
    setBed('pagoda', outside * day * (.12 + .5 * (e.kyaung || 0)));
    setBed('crowd', outside * ((e.crowd || 0) * .35 + (e.market || 0) * .35) + (tea ? .15 : 0));
    setBed('night', outside * night * .45);
    setBed('traffic', outside * (e.engine || 0) * .6);
    setBed('stadium', tea ? .12 : 0);
    if (inn) return;
    if ((SCH.bird -= dt) < 0) { SCH.bird = rr(2, 7) / (.5 + morning); if (day > .5) shot('sparrow', null, .35 + morning * .25); }
    if ((SCH.crow -= dt) < 0) { SCH.crow = rr(6, 15); if (day > .3) shot('crow', null, .45); }
    if ((SCH.gecko -= dt) < 0) { SCH.gecko = rr(40, 75); if (night > .5) shot('gecko', null, .5); }
    if ((SCH.dog -= dt) < 0) { SCH.dog = rr(12, 30); if (night > .3 || R() < .25) shot('dog', null, .3); }
    if ((SCH.splash -= dt) < 0) { SCH.splash = rr(.8, 3); if ((e.water || 0) > .1) shot('splash', null, .15 * e.water, rr(.85, 1.1)); }
    if ((SCH.bell -= dt) < 0) { SCH.bell = rr(45, 90); if ((e.kyaung || 0) > .1 && (morning || R() < .3)) shot('bell', null, .5 * e.kyaung); }
  }
  function setLoop(key, v) { start(); if (ctx.state === 'suspended') ctx.resume(); setBed(key, v); } // test page
  function toggle() {
    muted = !muted; try { localStorage.setItem('thingyan.mute', muted ? '1' : '0'); } catch {}
    if (!started) start(); master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, .1); return muted;
  }
  const level = () => { if (!meter) return 0; const a = new Float32Array(meter.fftSize); meter.getFloatTimeDomainData(a); return Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length); };
  return { env: update, fx, play, setLoop, tick() {}, start, toggle, muted: () => muted, level };
}
