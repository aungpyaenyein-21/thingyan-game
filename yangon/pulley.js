// yangon/pulley.js — the pulley bucket (ကြိုးဆွဲပုံး): Auntie Sein hauls it up four floors while you steer it from below with
// the rope's tail, past air-con boxes, laundry lines, flower pots and the tangle of wires. Knocks crack the eggs; the
// bucket gets there anyway (nothing to fail), and how many eggs survive is what she'll talk about.
const $ = (t, cls, html = '') => { const e = document.createElement(t); if (cls) e.className = cls; e.innerHTML = html; return e; };
const MM = n => String(n).replace(/\d/g, d => '၀၁၂၃၄၅၆၇၈၉'[d]);

const FLOOR = 1, TOP = 4.35, RISE = .17;  // floors (world units of this little scene), where she stands, how fast it comes up (/s)
// what's in the way, floor by floor: x0..x1 across the facade (0 = left edge, 1 = right), y its height
const STUFF = [ // spaced so there's always room to swing across between one and the next
  { k: 'pot', x0: .55, x1: .85, y: .8 }, { k: 'line', x0: 0, x1: .5, y: 1.45 },
  { k: 'ac', x0: .62, x1: .9, y: 1.95 }, { k: 'wire', x0: .25, x1: 1, y: 2.55 },
  { k: 'line', x0: 0, x1: .45, y: 3.05 }, { k: 'ac', x0: .6, x1: .88, y: 3.45 },
  { k: 'wire', x0: 0, x1: .6, y: 4.05 },
];
const BAND = { wire: [-.1, .01], line: [-.1, .07], ac: [0, .14], pot: [-.02, .15] }; // each thing's height span (y + …)
const CSS = `#pulley{position:fixed;inset:0;z-index:7;display:flex;flex-direction:column;background:#f9c9a8;font-family:"Myanmar Sangam MN","Noto Sans Myanmar",Padauk,sans-serif;color:#5a3550;touch-action:none;user-select:none;-webkit-user-select:none;
  padding:env(safe-area-inset-top,0) env(safe-area-inset-right,0) env(safe-area-inset-bottom,0) env(safe-area-inset-left,0)}
#pulley canvas{flex:1;min-height:0;display:block;width:100%}
#pulley .hud{position:absolute;left:12px;top:calc(10px + env(safe-area-inset-top,0px));padding:4px 12px;border-radius:12px;background:#fff6ea;font-size:15px;box-shadow:0 3px 0 rgba(90,53,80,.2)}
#pulley .msg{position:absolute;left:50%;top:calc(52px + env(safe-area-inset-top,0px));transform:translateX(-50%);max-width:86%;padding:5px 14px;border-radius:14px;background:#fff6ea;font-size:15px;line-height:1.6;text-align:center;box-shadow:0 3px 0 rgba(90,53,80,.2);transition:opacity .3s}
#pulley .msg.off{opacity:0}
#pulley .pads{display:flex;justify-content:space-between;gap:12px;padding:10px 16px 16px;background:#5a3a2e}
#pulley button{-webkit-tap-highlight-color:transparent;font:inherit;border:0;border-radius:18px;background:#fff6ea;color:#5a3550;box-shadow:0 4px 0 #b9a48f;touch-action:none;cursor:pointer}
#pulley .side{flex:1;max-width:180px;height:74px;font-size:28px}
#pulley .side.on{background:#f2c14e;transform:translateY(3px);box-shadow:0 1px 0 #b9a48f}
#pulley .mid{align-self:center;font-size:13px;color:#fff6ea;text-align:center;line-height:1.5}
#pulley .kb{display:block;font-size:10px;opacity:.6} @media (pointer:coarse){#pulley .kb{display:none}}`;

// opts: { onDone(eggs) } — returns { close, auto } (auto: tests steer it perfectly)
export function pulley({ onDone, sound } = {}) {
  if (!document.getElementById('pulleyCss')) { const s = $('style'); s.id = 'pulleyCss'; s.textContent = CSS; document.head.appendChild(s); }
  const root = $('div'); root.id = 'pulley';
  const cv = $('canvas'), hud = $('div', 'hud'), msg = $('div', 'msg off'), pads = $('div', 'pads');
  const L = $('button', 'side', '◀<span class="kb">A / ←</span>'), R = $('button', 'side', '▶<span class="kb">D / →</span>');
  const mid = $('div', 'mid', 'ကြိုးကို ဘယ်ညာ ဆွဲပြီး<br>ပုံးကို ရှောင်ပေး');
  pads.append(L, mid, R); root.append(cv, hud, msg, pads); document.body.appendChild(root);
  const g = cv.getContext('2d');

  let y = .25, x = .5, vx = 0, swing = 0, sv = 0, wind = 0, windT = 3, eggs = 10, cool = 0, msgT = 0, done = false, auto = false, T = 0, raf = 0, last = performance.now();
  const hold = { l: false, r: false };
  const say = (t, s = 1.8) => { msg.textContent = t; msg.classList.remove('off'); msgT = s; };
  say('အန်တီစိန် — “ဆွဲတင်ပြီနော်! ကြက်ဥတွေ မကွဲစေနဲ့!”', 2.6);
  const bind = (b, k) => { const on = e => { e.preventDefault(); hold[k] = true; b.classList.add('on'); }, off = () => { hold[k] = false; b.classList.remove('on'); };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off); };
  bind(L, 'l'); bind(R, 'r');
  const KEYS = { KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
  const kd = e => { if (e.code in KEYS) { hold[KEYS[e.code]] = true; (KEYS[e.code] === 'l' ? L : R).classList.add('on'); e.preventDefault(); e.stopPropagation(); } };
  const ku = e => { if (e.code in KEYS) { hold[KEYS[e.code]] = false; (KEYS[e.code] === 'l' ? L : R).classList.remove('on'); } };
  addEventListener('keydown', kd, true); addEventListener('keyup', ku, true);

  function size() { const r = cv.getBoundingClientRect(), k = Math.min(2, devicePixelRatio || 1); cv.width = Math.max(1, r.width * k); cv.height = Math.max(1, r.height * k); g.setTransform(k, 0, 0, k, 0, 0); }
  addEventListener('resize', size); size();

  // ---------- the facade, scrolled so the bucket stays in the lower middle ----------
  function draw() {
    const k = Math.min(2, devicePixelRatio || 1), w = cv.width / k, h = cv.height / k;
    const fw = Math.min(w * .86, h * .62), fx = (w - fw) / 2, U = fw * .62;            // facade width/left, px per floor-unit
    const cam = Math.min(Math.max(y - .55, 0), TOP + .5 - h / U), sy = v => h - (v - cam) * U - 30; // world y → screen y
    g.fillStyle = '#f9c9a8'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#efdcc0'; g.fillRect(fx, sy(TOP + .8), fw, sy(-.2) - sy(TOP + .8));                 // the wall
    g.fillStyle = '#d9c3a3'; for (let f = 0; f <= 4; f++) g.fillRect(fx, sy(f * FLOOR) - 3, fw, 5);    // floor lines
    for (let f = 1; f <= 4; f++) for (const u of [.18, .82]) { const wx = fx + fw * u - 22, wy = sy(f * FLOOR - .25); g.fillStyle = '#3b3040'; g.fillRect(wx, wy - 40, 44, 40); g.fillStyle = '#6f9fc8'; g.fillRect(wx + 4, wy - 36, 16, 32); g.fillRect(wx + 24, wy - 36, 16, 32); }
    g.fillStyle = '#9aa38f'; g.fillRect(0, sy(0), w, h);                                             // the lane below
    for (const s of STUFF) { const a = fx + fw * s.x0, b = fx + fw * s.x1, yy = sy(s.y);
      const u = v => v * U; // sizes in floor-units, so what you see is what you hit (BAND)
      if (s.k === 'wire') { g.strokeStyle = '#2b2730'; g.lineWidth = 3; for (const o of [0, .035]) { g.beginPath(); g.moveTo(a, yy + u(o)); g.quadraticCurveTo((a + b) / 2, yy + u(o + .06), b, yy + u(o)); g.stroke(); } }
      else if (s.k === 'line') { const top = yy - u(.07); g.strokeStyle = '#efe3c8'; g.lineWidth = 2; g.beginPath(); g.moveTo(a, top); g.lineTo(b, top); g.stroke(); let lx = a + u(.03);
        for (const [cw, ch, c] of [[.11, .17, '#a8434a'], [.08, .12, '#4a5aa8'], [.12, .17, '#f2c14e'], [.09, .14, '#3f7a5a'], [.11, .16, '#e9a0b4'], [.08, .13, '#7a4a9a']]) { if (lx + u(cw) > b) break; g.fillStyle = c; g.fillRect(lx, top, u(cw), u(ch)); lx += u(cw + .035); } }
      else if (s.k === 'ac') { g.fillStyle = '#e9e6ea'; g.fillRect(a, yy - u(.14), b - a, u(.14)); g.strokeStyle = '#b4bcc4'; g.lineWidth = 2; g.beginPath(); g.arc((a + b) / 2, yy - u(.07), u(.05), 0, 7); g.stroke(); }
      else { g.fillStyle = '#8a5a3a'; g.fillRect(a, yy - u(.02), b - a, u(.03)); for (let px = a + u(.06); px < b - u(.03); px += u(.11)) { g.fillStyle = '#c0683f'; g.fillRect(px - u(.035), yy - u(.09), u(.07), u(.07)); g.fillStyle = '#86b96d'; g.beginPath(); g.arc(px, yy - u(.11), u(.045), 0, 7); g.fill(); } }
    }
    // the pulley up top, the rope, and the auntie at her balcony
    const px = fx + fw * .5, py = sy(TOP + .45); g.fillStyle = '#5a4a52'; g.beginPath(); g.arc(px, py, 9, 0, 7); g.fill();
    g.fillStyle = '#efdcc0'; g.fillRect(px - 50, sy(TOP) - 6, 100, 8); g.font = `${Math.round(U * .26)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText('👵', px + 34, sy(TOP));
    const bx = fx + fw * x + swing * 26, by = sy(y);
    g.strokeStyle = '#d9c9a8'; g.lineWidth = 2; g.beginPath(); g.moveTo(px, py); g.lineTo(bx, by - 36); g.stroke();
    g.beginPath(); g.moveTo(bx, by + 14); g.quadraticCurveTo(bx - 10, sy(0) - 10, fx + fw * x, sy(0)); g.stroke(); // the tail you steer with
    g.save(); g.translate(bx, by); g.rotate(swing * .5); const ks = fw * .12 / 44; g.scale(ks, ks);
    g.strokeStyle = '#5a4a52'; g.lineWidth = 2; g.beginPath(); g.arc(0, -16, 18, Math.PI, 0); g.stroke();
    g.fillStyle = '#e0574f'; g.beginPath(); g.moveTo(-22, -16); g.lineTo(22, -16); g.lineTo(16, 14); g.lineTo(-16, 14); g.closePath(); g.fill();
    g.fillStyle = '#5fa04a'; g.beginPath(); g.ellipse(-8, -18, 10, 6, -.3, 0, 7); g.fill(); g.fillStyle = '#e8463a'; g.beginPath(); g.arc(9, -19, 6, 0, 7); g.fill();
    for (let e = 0; e < Math.min(3, eggs); e++) { g.fillStyle = '#fff6ea'; g.beginPath(); g.ellipse(-10 + e * 8, -22, 4, 5.5, 0, 0, 7); g.fill(); }
    g.restore();
    if (cool > .6) { g.font = '26px sans-serif'; g.fillText('💥', bx + fw * .07, by - 10); }
  }
  const hitBox = () => ({ y0: y - .065, y1: y + .08 }); // the bucket's body and the bottom of its handle
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now; T += dt;
    if (!done) {
      if ((windT -= dt) < 0) { windT = 2.5 + Math.random() * 2.5; wind = (Math.random() - .5) * .5; if (Math.abs(wind) > .15) say(wind > 0 ? 'လေတိုက်လာပြီ ➡' : '⬅ လေတိုက်လာပြီ', 1.2); }
      const want = auto ? autoSteer() : (hold.r ? 1 : 0) - (hold.l ? 1 : 0);
      vx += (want * 1.6 + wind - vx * 2.2) * dt; x = Math.min(.94, Math.max(.06, x + vx * dt));
      sv += (-swing * 9 - sv * 1.5 + (want * -.6 + wind) * 1.5) * dt; swing = Math.max(-.6, Math.min(.6, swing + sv * dt)); // the bucket sways behind your pull
      y += RISE * dt; cool = Math.max(0, cool - dt);
      if (!cool) { const b = hitBox(), bx = x + swing * .04;
        for (const s of STUFF) { const [d0, d1] = BAND[s.k], sy0 = s.y + d0, sy1 = s.y + d1; if (b.y1 > sy0 && b.y0 < sy1 && bx + .06 > s.x0 && bx - .06 < s.x1) {
          cool = 1; const lost = s.k === 'wire' ? 1 : 2; eggs = Math.max(0, eggs - lost); vx = (bx < (s.x0 + s.x1) / 2 ? -1 : 1) * .5; sv += 3;
          say(eggs ? `ဒုံး! ကြက်ဥ ${MM(lost)} လုံး ကွဲသွားပြီ 🥚` : 'ကြက်ဥတွေ အကုန် ကွဲကုန်ပြီ… 😅'); sound?.fx?.('hit'); break; } } }
      if (y >= TOP - .1) { done = true; say(eggs >= 9 ? 'ရောက်ပြီ! ကြက်ဥတွေ မကွဲဘူး ✨' : 'ရောက်ပြီ!', 1.6); setTimeout(() => { close(); onDone?.(eggs); }, 1300); }
      hud.textContent = `🥚 ×${MM(eggs)}`;
    }
    if (msgT > 0 && (msgT -= dt) <= 0) msg.classList.add('off');
    draw(); raf = requestAnimationFrame(frame);
  }
  function autoSteer() { // tests: aim for the widest gap at the next thing up
    const s = STUFF.find(s => s.y + BAND[s.k][1] > y - .07); if (!s) return (.5 - x) * 4;
    const gx = s.x0 > 1 - s.x1 ? Math.max(.08, s.x0 / 2) : Math.min(.92, (s.x1 + 1) / 2); return Math.max(-1, Math.min(1, (gx - x) * 8 - vx * 2));
  }
  raf = requestAnimationFrame(frame);
  function close() { cancelAnimationFrame(raf); removeEventListener('keydown', kd, true); removeEventListener('keyup', ku, true); removeEventListener('resize', size); root.remove(); }
  return { close, auto: () => { auto = true; }, eggs: () => eggs, done: () => done, state: () => ({ x, y, swing, eggs }) };
}
