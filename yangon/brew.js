// yangon/brew.js — the tea rush, first person from behind the counter: the tea master went home for Thingyan and you stand
// in. The waiter calls the orders in tea-shop shorthand; hold to pour condensed milk, evaporated milk and the strong tea in
// the right measure for each, pull it for a head of froth if you like, and serve before the table gives up waiting.
// Forgiving on purpose: a cup a little off still counts, a miss is only a miss; serve enough in time and you're done.
const $ = (t, cls, html = '') => { const e = document.createElement(t); if (cls) e.className = cls; e.innerHTML = html; return e; };
const MM = n => String(n).replace(/\d/g, d => '၀၁၂၃၄၅၆၇၈၉'[d]);

// [နို့ဆီ, နို့, ဖျော်ရည်] in parts: ချို = more condensed milk, ပေါ့ = more milk and less tea, ကျ = strong tea
export const KINDS = {
  normal: { name: 'ပုံမှန်', mix: [1.5, 1, 2] },
  chosein: { name: 'ချိုဆိမ့်', mix: [2.5, 1.5, 2] },
  pawsein: { name: 'ပေါ့ဆိမ့်', mix: [1, 2, 1.5] },
  kyasein: { name: 'ကျဆိမ့်', mix: [1, 1, 3] },
};
const ING = [
  { name: 'နို့ဆီ', icon: '🥫', col: [244, 227, 181], key: 'Digit1' },
  { name: 'နို့', icon: '🥛', col: [255, 250, 240], key: 'Digit2' },
  { name: 'ဖျော်ရည်', icon: '🫖', col: [107, 58, 28], key: 'Digit3' },
];
const MAX = 3.5, RATE = 1.35, CAP = 7.5;           // gauge top, parts poured per second held, what the glass holds
const PERFECT = .3, GOOD = .6;                      // how far off each part may be
const PLAN = ['pawsein', 'normal', 'kyasein', 'chosein', 'pawsein', 'normal', 'chosein', 'kyasein']; // easy ones first
const AT = [0, 7, 15, 21, 27, 32, 37, 42];          // when each order comes in (s)
const PASS = 6;                                     // served in time to be done

const CSS = `#brew{position:fixed;inset:0;z-index:7;display:flex;flex-direction:column;background:#3a2620;color:#5a3550;font-family:"Myanmar Sangam MN","Noto Sans Myanmar",Padauk,sans-serif;
  padding:env(safe-area-inset-top,0) env(safe-area-inset-right,0) env(safe-area-inset-bottom,0) env(safe-area-inset-left,0);user-select:none;-webkit-user-select:none;touch-action:none}
#brew .rail{position:relative;display:flex;gap:8px;padding:10px 12px 6px;min-height:76px;align-items:flex-start;background:linear-gradient(#2a1a16,#3a2620);overflow:hidden}
#brew .rail::before{content:'';position:absolute;left:0;right:0;top:14px;height:2px;background:#8a6a52}
#brew .tk{position:relative;flex:0 0 auto;width:112px;padding:6px 8px 7px;border-radius:6px 6px 10px 10px;background:#fff6ea;box-shadow:0 3px 0 rgba(0,0,0,.25);cursor:pointer;transition:transform .15s,opacity .4s}
#brew .tk.on{outline:3px solid #f2c14e;transform:translateY(3px)} #brew .tk.gone{opacity:0;transform:translateY(-20px)}
#brew .tk b{display:block;font-size:15px;font-weight:normal;line-height:1.5;text-align:center}
#brew .tk .mix{display:flex;gap:3px;align-items:flex-end;height:22px;justify-content:center;margin:2px 0 4px}
#brew .tk .mix i{display:block;width:16px;border-radius:2px 2px 0 0;border:1px solid #c9b8a6}
#brew .tk .time{height:5px;border-radius:3px;background:#e9dccb;overflow:hidden} #brew .tk .time i{display:block;height:100%;background:#7fbf6a}
#brew .mid{position:relative;flex:1;display:flex;min-height:0}
#brew canvas{flex:1;min-width:0;display:block}
#brew .gauges{display:flex;gap:10px;align-items:flex-end;padding:10px 14px 10px 4px}
#brew .g{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:12px;color:#fff6ea}
#brew .g .bar{position:relative;width:26px;height:min(34vh,190px);border-radius:8px;background:rgba(255,246,234,.18);overflow:hidden;border:2px solid rgba(255,246,234,.5)}
#brew .g .ok{position:absolute;left:0;right:0;background:rgba(127,191,106,.35)} #brew .g .best{position:absolute;left:0;right:0;background:rgba(127,191,106,.75)}
#brew .g .fill{position:absolute;left:0;right:0;bottom:0}
#brew .msg{position:absolute;left:50%;top:10px;transform:translateX(-50%);max-width:80%;padding:5px 14px;border-radius:14px;background:#fff6ea;font-size:15px;line-height:1.6;text-align:center;box-shadow:0 3px 0 rgba(0,0,0,.25);transition:opacity .3s}
#brew .msg.off{opacity:0}
#brew .top{position:absolute;right:12px;top:10px;color:#fff6ea;font-size:13px;text-align:right;line-height:1.5}
#brew .pads{display:flex;gap:10px;justify-content:center;align-items:center;padding:8px 10px 14px;background:#2a1a16;flex-wrap:wrap}
#brew button{-webkit-tap-highlight-color:transparent;font:inherit;border:0;border-radius:16px;cursor:pointer;color:#5a3550;background:#fff6ea;box-shadow:0 4px 0 #b9a48f;touch-action:none}
#brew button:active,#brew button.on{transform:translateY(3px);box-shadow:0 1px 0 #b9a48f}
#brew .pour{width:86px;height:76px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:13px;line-height:1.3}
#brew .pour span{font-size:30px;line-height:1.1}
#brew .pour.on{background:#f2c14e}
#brew .side{display:flex;flex-direction:column;gap:8px}
#brew .small{padding:7px 12px;font-size:13px}
#brew .serve{height:76px;padding:0 18px;font-size:16px;background:#7fbf6a;color:#fff;box-shadow:0 4px 0 #4f8f45}
#brew .kb{opacity:.55;font-size:10px}
@media (pointer:coarse){#brew .kb{display:none}}
@media (max-height:480px){#brew .rail{min-height:64px;padding-top:6px}#brew .tk{width:100px;padding:4px 6px}#brew .tk b{font-size:13px}#brew .pour{height:60px;width:76px}#brew .serve{height:60px}#brew .pads{padding:6px 8px 8px}#brew .g .bar{height:min(30vh,150px)}}
#brew .end{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(42,26,22,.7)}
#brew .end div{background:#fff6ea;border-radius:16px;padding:18px 22px;text-align:center;line-height:1.9;max-width:min(360px,86vw)}
#brew .end h3{margin:0 0 4px;font-weight:normal;font-size:19px}
#brew .end button{display:block;width:100%;margin-top:10px;padding:10px;font-size:15px}
#brew .end button.go{background:#5a3550;color:#fff6ea;box-shadow:0 4px 0 #3a2234}`;

// opts: { onWin(stats), onQuit(stats), sound } — returns { close, auto } (auto: tests pour each order perfectly)
export function brew({ onWin, onQuit, sound } = {}) {
  if (!document.getElementById('brewCss')) { const s = $('style'); s.id = 'brewCss'; s.textContent = CSS; document.head.appendChild(s); }
  const root = $('div'); root.id = 'brew';
  const rail = $('div', 'rail'), mid = $('div', 'mid'), cv = $('canvas'), gauges = $('div', 'gauges'), msg = $('div', 'msg off'), top = $('div', 'top'), pads = $('div', 'pads');
  mid.append(cv, gauges, msg, top); root.append(rail, mid, pads); document.body.appendChild(root);
  const g = cv.getContext('2d');

  // ---------- state ----------
  let T = 0, orders = [], next = 0, sel = null, glass = [], froth = 0, done = false, msgT = 0, raf = 0, last = performance.now();
  const stats = { perfect: 0, good: 0, off: 0, missed: 0 };
  const poured = () => ING.map((_, i) => glass.filter(s => s.i === i).reduce((a, s) => a + s.amt, 0));
  const total = () => glass.reduce((a, s) => a + s.amt, 0);
  const say = (t, s = 2.2) => { msg.textContent = t; msg.classList.remove('off'); msgT = s; };

  // ---------- gauges: how much of each is in, against the selected order's measure ----------
  const gs = ING.map((ing, i) => {
    const el = $('div', 'g', `<div class="bar"><div class="ok"></div><div class="best"></div><div class="fill" style="background:rgb(${ing.col})"></div></div><span>${ing.icon}</span>`);
    gauges.appendChild(el); return { ok: el.querySelector('.ok'), best: el.querySelector('.best'), fill: el.querySelector('.fill') };
  });
  const band = (el, v, d) => { el.style.bottom = `${Math.max(0, v - d) / MAX * 100}%`; el.style.height = `${(Math.min(MAX, v + d) - Math.max(0, v - d)) / MAX * 100}%`; };
  function drawGauges() {
    const p = poured(), mix = sel && KINDS[sel.kind].mix;
    gs.forEach((q, i) => { q.fill.style.height = `${Math.min(1, p[i] / MAX) * 100}%`; q.ok.style.display = q.best.style.display = mix ? 'block' : 'none'; if (mix) { band(q.ok, mix[i], GOOD); band(q.best, mix[i], PERFECT); } });
  }

  // ---------- pads: hold to pour; pull for froth; serve; tip it out ----------
  const holding = new Set();
  const pourBtns = ING.map((ing, i) => {
    const b = $('button', 'pour', `<span>${ing.icon}</span>${ing.name}<em class="kb">${i + 1}</em>`);
    const on = e => { e.preventDefault(); holding.add(i); b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch {} }; // capture: a thumb sliding off still ends the pour
    const off = () => { holding.delete(i); b.classList.remove('on'); };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
    pads.appendChild(b); return b;
  });
  const side = $('div', 'side');
  const pull = $('button', 'small', '↕ ဆွဲ <em class="kb">F</em>'), dump = $('button', 'small', '🗑 သွန် <em class="kb">X</em>');
  side.append(pull, dump); pads.appendChild(side);
  const serveB = $('button', 'serve', '✅ ချမယ် <em class="kb">Space</em>'); pads.appendChild(serveB);
  const doPull = () => { if (!total()) return; froth = Math.min(3, froth + 1); if (froth === 3) say('အမြှုပ် ထူလိုက်တာ ✨', 1.2); };
  const doDump = () => { glass = []; froth = 0; };
  pull.addEventListener('click', doPull); dump.addEventListener('click', doDump); serveB.addEventListener('click', () => serve());
  const KEYS = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 };
  const kd = e => { if (done) return; if (e.code in KEYS) { holding.add(KEYS[e.code]); pourBtns[KEYS[e.code]].classList.add('on'); } else if (e.code === 'Space' || e.code === 'Enter') serve(); else if (e.code === 'KeyF') doPull(); else if (e.code === 'KeyX' || e.code === 'Backspace') doDump(); else return; e.preventDefault(); e.stopPropagation(); };
  const ku = e => { if (e.code in KEYS) { holding.delete(KEYS[e.code]); pourBtns[KEYS[e.code]].classList.remove('on'); } };
  addEventListener('keydown', kd, true); addEventListener('keyup', ku, true);

  // ---------- orders: tickets on the rail, each with how long that table will wait ----------
  function addOrder() {
    const kind = PLAN[next], patience = next < 3 ? 30 : 25, el = $('div', 'tk');
    const mix = KINDS[kind].mix;
    el.innerHTML = `<b>${KINDS[kind].name}</b><div class="mix">${mix.map((v, i) => `<i style="height:${v / 3 * 100}%;background:rgb(${ING[i].col})"></i>`).join('')}</div><div class="time"><i></i></div>`;
    const o = { kind, left: patience, patience, el, bar: el.querySelector('.time i') };
    el.addEventListener('pointerdown', e => { e.stopPropagation(); select(o); });
    rail.appendChild(el); orders.push(o); next++;
    say(`စားပွဲထိုး — “${KINDS[kind].name} တစ်ခွက်!”`);
    if (!sel) select(o);
  }
  function select(o) { sel = o; for (const x of orders) x.el.classList.toggle('on', x === o); drawGauges(); }
  function retire(o, how) {
    stats[how]++; o.el.classList.add('gone'); orders = orders.filter(x => x !== o); setTimeout(() => o.el.remove(), 400);
    if (sel === o) select(orders[0] ?? null);
    if (next >= PLAN.length && !orders.length) finish();
  }
  function serve() {
    if (done || !sel) return;
    if (total() < .4) { say('ခွက်ထဲ ဘာမှ မရှိသေးဘူး'); return; }
    const p = poured(), mix = KINDS[sel.kind].mix, d = p.map((v, i) => v - mix[i]), worst = Math.max(...d.map(Math.abs));
    let how = worst <= PERFECT ? 'perfect' : worst <= GOOD ? 'good' : 'off', line;
    if (how === 'perfect') line = froth >= 2 ? 'အမြှုပ်နဲ့ ဒါမှ လက်ဖက်ရည်ကွ! ✨' : ['အချိုးကျတယ်! ✨', 'ဒါမှ လက်ဖက်ရည်ကွ! ✨', 'အဖျော်ဆရာထက် ကောင်းနေပြီ ✨'][stats.perfect % 3];
    else if (how === 'good') line = ['ရတယ် ရတယ် 👍', 'ကောင်းပါတယ် 👍'][stats.good % 2];
    else { const k = d.map(Math.abs).indexOf(worst), more = d[k] > 0;
      line = [more ? 'ချိုလွန်းတယ်ကွ 😅' : 'မချိုဘူးကွ 😅', more ? 'နို့တွေ များလိုက်တာ 😅' : 'မဆိမ့်ဘူးကွ 😅', more ? 'ခါးလိုက်တာ! 😅' : 'ပေါ့လွန်းတယ်… 😅'][k]; }
    say(`${KINDS[sel.kind].name} — ${line}`); sound?.fx?.('hit');
    retire(sel, how); glass = []; froth = 0;
  }
  function finish() {
    done = true; holding.clear(); pourBtns.forEach(b => b.classList.remove('on'));
    const served = stats.perfect + stats.good + stats.off, win = served >= PASS;
    const end = $('div', 'end'), box = $('div');
    box.innerHTML = `<h3>${win ? 'ဆိုင်ကို ကယ်လိုက်ပြီ! ☕' : 'စားပွဲတွေ စောင့်ရလွန်းသွားတယ်…'}</h3>
      <div>✨ ${MM(stats.perfect)} · 👍 ${MM(stats.good)} · 😅 ${MM(stats.off)} · ⌛ ${MM(stats.missed)}</div>
      <div style="font-size:13px;opacity:.7">${win ? `${MM(PLAN.length)} ခွက်မှာ ${MM(served)} ခွက် အချိန်မီ ချနိုင်ခဲ့တယ်` : `${MM(PASS)} ခွက် အချိန်မီ ချရမယ် — ${MM(served)} ခွက်ပဲ ရသေးတယ်`}</div>`;
    const b1 = $('button', 'go', win ? 'ပြီးပြီ' : 'ပြန်ဖျော်မယ်'); box.appendChild(b1);
    if (win) b1.onclick = () => { close(); onWin?.(stats); };
    else { b1.onclick = () => { close(); brew({ onWin, onQuit, sound }); }; const b2 = $('button', '', 'နောက်မှ'); b2.onclick = () => { close(); onQuit?.(stats); }; box.appendChild(b2); }
    end.appendChild(box); root.appendChild(end);
  }

  // ---------- the view: the counter, the glass filling in layers (mixed once pulled), what you're pouring from ----------
  function size() { const r = cv.getBoundingClientRect(), k = Math.min(2, devicePixelRatio || 1); cv.width = Math.max(1, r.width * k); cv.height = Math.max(1, r.height * k); g.setTransform(k, 0, 0, k, 0, 0); }
  addEventListener('resize', size); size();
  const rgb = c => `rgb(${c.map(Math.round)})`;
  function draw() {
    const w = cv.width / (Math.min(2, devicePixelRatio || 1)), h = cv.height / (Math.min(2, devicePixelRatio || 1));
    g.clearRect(0, 0, w, h);
    const wall = g.createLinearGradient(0, 0, 0, h); wall.addColorStop(0, '#5a3a2e'); wall.addColorStop(1, '#6b4a3a'); g.fillStyle = wall; g.fillRect(0, 0, w, h);
    const sy = h * .3; g.fillStyle = '#8a5a3a'; g.fillRect(w * .08, sy, w * .84, 8); g.fillStyle = 'rgba(255,246,234,.85)';
    for (let k = 0; k < 7; k++) { const cx = w * .14 + k * w * .1; g.beginPath(); g.roundRect(cx - 9, sy - 16, 18, 16, [2, 2, 6, 6]); g.fill(); }
    g.font = `${Math.round(Math.min(w, h) * .09)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText('🫖', w * .86, sy);
    const cy = h * .78; g.fillStyle = '#a8743a'; g.fillRect(0, cy, w, h - cy); g.fillStyle = '#8a5a2a'; for (let y = cy + 10; y < h; y += 14) g.fillRect(0, y, w, 2); g.fillStyle = '#c8945a'; g.fillRect(0, cy - 4, w, 6);
    const Wt = Math.min(w * .5, h * .34), Wb = Wt * .8, Hg = Wt * 1.25, x0 = w / 2, yb = cy;
    const edge = t => Wb / 2 + (Wt - Wb) / 2 * t; // half width at height fraction t
    const fillTo = (a0, a1, col) => { const t0 = a0 / CAP, t1 = Math.min(1, a1 / CAP); if (t1 <= t0) return; g.fillStyle = col; g.beginPath();
      g.moveTo(x0 - edge(t0), yb - t0 * Hg); g.lineTo(x0 + edge(t0), yb - t0 * Hg); g.lineTo(x0 + edge(t1), yb - t1 * Hg); g.lineTo(x0 - edge(t1), yb - t1 * Hg); g.closePath(); g.fill(); };
    const tot = total();
    if (froth > 0 && tot > 0) { // pulled: one colour, the tea-shop tan, with a head of froth
      const p = poured(), BREW = [150, 80, 30], wt = [p[0], p[1], p[2] * 2.5], cols = [ING[0].col, ING[1].col, BREW], mixC = [0, 1, 2].map(c => cols.reduce((a, col, i) => a + col[c] * wt[i], 0) / (wt[0] + wt[1] + wt[2]));
      fillTo(0, tot, rgb(mixC)); fillTo(tot, tot + froth * .18, 'rgba(250,236,210,.95)');
    } else { let a = 0; for (const s of glass) { fillTo(a, a + s.amt, rgb(ING[s.i].col)); a += s.amt; } }
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0 - Wt / 2, yb - Hg); g.lineTo(x0 - Wb / 2, yb); g.lineTo(x0 + Wb / 2, yb); g.lineTo(x0 + Wt / 2, yb - Hg); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 5; g.beginPath(); g.moveTo(x0 - Wt / 2 + 10, yb - Hg + 10); g.lineTo(x0 - Wb / 2 + 8, yb - 8); g.stroke();
    if (tot > 0 && poured()[2] > 0) { g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2; for (let k = 0; k < 3; k++) { const sx = x0 - 18 + k * 18; g.beginPath(); for (let y = 0; y < 40; y += 4) g.lineTo(sx + Math.sin(T * 3 + y * .2 + k) * 4, yb - Math.min(1, tot / CAP) * Hg - 8 - y); g.stroke(); } } // steam
    for (const i of holding) { // the tin / can / kettle tipped over the glass, and its stream
      const sx = x0 + (i - 1) * Wt * .18, top = Math.max(18, yb - Hg - h * .2), lvl = yb - Math.min(1, tot / CAP) * Hg;
      g.fillStyle = rgb(ING[i].col); g.fillRect(sx - (i === 2 ? 3 : 4), top + 30, i === 2 ? 6 : 8, lvl - top - 30);
      g.save(); g.translate(sx, top + 10); g.rotate(i === 0 ? .9 : i === 1 ? .7 : -.8); g.font = `${Math.round(Wt * .32)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ING[i].icon, 0, 0); g.restore();
    }
  }

  // ---------- loop ----------
  function frame(now) {
    const dt = Math.min(.1, (now - last) / 1000); last = now; T += dt;
    if (!done) {
      while (next < PLAN.length && T >= AT[next] && orders.length < 3) addOrder();
      if (next < PLAN.length && orders.length >= 3 && T >= AT[next]) AT[next] = T + .5; // a full rail: the next one waits its turn
      for (const i of holding) { if (total() >= CAP) break; const s = glass[glass.length - 1]; if (s && s.i === i) s.amt += RATE * dt; else glass.push({ i, amt: RATE * dt }); if (froth) froth = Math.max(0, froth - dt * 2); }
      for (const o of [...orders]) { o.left -= dt; o.bar.style.width = `${Math.max(0, o.left / o.patience) * 100}%`; o.bar.style.background = o.left < 8 ? '#e0574f' : o.left < 15 ? '#f2c14e' : '#7fbf6a'; if (o.left <= 0) { say(`${KINDS[o.kind].name} — ကြာလိုက်တာ… ⌛`); retire(o, 'missed'); } }
      const n = stats.perfect + stats.good + stats.off; top.innerHTML = `ချပြီ ${MM(n)}/${MM(PLAN.length)}<br>လိုတာ ${MM(PASS)}` + (n + stats.missed < 1 ? '<br><span style="opacity:.8">ဖိထား = လောင်း<br>အစိမ်းထဲရောက်ရင် လွှတ်</span>' : '');
      drawGauges();
    }
    if (msgT > 0 && (msgT -= dt) <= 0) msg.classList.add('off');
    draw(); raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  function close() { cancelAnimationFrame(raf); removeEventListener('keydown', kd, true); removeEventListener('keyup', ku, true); removeEventListener('resize', size); root.remove(); }
  // tests: pour the selected order exactly and serve it, over and over
  const auto = () => { for (const o of orders) select(o), (glass = KINDS[o.kind].mix.map((amt, i) => ({ i, amt }))), serve(); };
  return { close, auto, stats: () => ({ ...stats, done }) };
}
