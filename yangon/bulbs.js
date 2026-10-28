// yangon/bulbs.js — Ko Zaw's string of lights (မီးသီး ပဟေဠိ): twelve bulbs in series, one dead, so none of them light.
// Clip the tester's two leads across a stretch of the string: if the dead bulb is inside, the jumper carries the current
// past it and every bulb outside the stretch lights up. Find it, swap it, and the whole string comes on. Nothing to fail.
const $ = (t, cls, html = '') => { const e = document.createElement(t); if (cls) e.className = cls; e.innerHTML = html; return e; };
const MM = n => String(n).replace(/\d/g, d => '၀၁၂၃၄၅၆၇၈၉'[d]);
const N = 12, COLORS = ['#ff5a5a', '#ffd23f', '#5fe08a', '#4fb4ff', '#ff8ad8', '#ffa94d'];
const ZAW = 'ကိုဇော်';
const CSS = `#bulbs{position:fixed;inset:0;z-index:7;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:radial-gradient(#3a2f4a,#1c1726);font-family:"Myanmar Sangam MN","Noto Sans Myanmar",Padauk,sans-serif;color:#fff6ea;touch-action:manipulation;user-select:none;-webkit-user-select:none;
  padding:calc(12px + env(safe-area-inset-top,0px)) 12px calc(12px + env(safe-area-inset-bottom,0px))}
#bulbs .top{display:flex;gap:10px;align-items:center;font-size:14px}
#bulbs .pill{padding:3px 12px;border-radius:12px;background:rgba(255,246,234,.12)}
#bulbs .msg{min-height:3.2em;max-width:min(560px,92vw);padding:6px 14px;border-radius:14px;background:#fff6ea;color:#5a3550;font-size:15px;line-height:1.6;text-align:center;box-shadow:0 3px 0 rgba(0,0,0,.3)}
#bulbs .msg b{color:#a8434a}
#bulbs .str{position:relative;display:grid;grid-template-columns:repeat(6,1fr);gap:22px 10px;width:min(560px,92vw);padding:18px 8px 6px}
#bulbs .b.r2{grid-row:2;grid-column:var(--col)} /* the second half doubles back, so the cable snakes */
@media (orientation:landscape) and (min-width:700px){#bulbs .str{grid-template-columns:repeat(12,1fr);width:min(900px,94vw)}#bulbs .b.r2{grid-row:auto;grid-column:auto}}
#bulbs svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}
#bulbs .b{-webkit-tap-highlight-color:transparent;position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;border:0;background:none;color:#cfc4d8;font:inherit;font-size:12px;cursor:pointer;padding:0}
#bulbs .g{width:30px;height:38px;border-radius:50% 50% 45% 45%;background:#5d5468;border:2px solid #7a7088;box-shadow:inset -4px -5px 0 rgba(0,0,0,.25);transition:background .2s,box-shadow .2s}
#bulbs .b::before{content:'';width:12px;height:8px;background:#9a8f7a;border-radius:2px;order:-1}
#bulbs .b.lit .g{background:var(--c);border-color:#fff6ea;box-shadow:0 0 18px 6px var(--c),inset -4px -5px 0 rgba(0,0,0,.12)}
#bulbs .b.sel .g{outline:3px solid #f2c14e;outline-offset:3px}
#bulbs .b.span .g{border-style:dashed;border-color:#f2c14e}
#bulbs .b.new .g{border-color:#5fe08a}
#bulbs .clip{position:absolute;top:-16px;font-size:16px}
#bulbs .row{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
#bulbs button.act{-webkit-tap-highlight-color:transparent;font:inherit;font-size:16px;border:0;border-radius:16px;padding:10px 18px;background:#fff6ea;color:#5a3550;box-shadow:0 4px 0 #b9a48f;cursor:pointer}
#bulbs button.act.on{background:#f2c14e}
#bulbs button.act.ghost{background:transparent;color:#cfc4d8;box-shadow:none;text-decoration:underline}`;

// opts: { onWin({tests}), onQuit({tests}), sound } — returns { close, auto, dead } (auto: tests solve it by halving)
export function bulbs({ onWin, onQuit, sound, dead = 2 + Math.floor(Math.random() * (N - 4)) } = {}) {
  if (!document.getElementById('bulbsCss')) { const s = $('style'); s.id = 'bulbsCss'; s.textContent = CSS; document.head.appendChild(s); }
  const root = $('div'); root.id = 'bulbs';
  const top = $('div', 'top'), count = $('span', 'pill'), how = $('span', 'pill', '🔌 ကြိုးတစ်ချောင်းတည်း ဆက်ထား');
  const msg = $('div', 'msg'), str = $('div', 'str'), row = $('div', 'row');
  const swap = $('button', 'act', '🔧 မီးသီး လဲမယ်'), later = $('button', 'act ghost', 'နောက်မှ');
  top.append(how, count); row.append(swap, later); root.append(top, msg, str, row); document.body.appendChild(root);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); str.appendChild(svg);
  const B = [...Array(N)].map((_, i) => { const b = $('button', 'b', `<i class="g"></i>${MM(i + 1)}`); b.type = 'button'; b.style.setProperty('--c', COLORS[i % COLORS.length]); if (i >= N / 2) { b.classList.add('r2'); b.style.setProperty('--col', N - i); } b.onclick = () => tap(i); str.appendChild(b); return b; });

  let tests = 0, first = -1, mode = 'test', busy = false, done = false, hinted = false, timer = 0;
  const say = h => { msg.innerHTML = h; };
  const show = () => { count.textContent = `စမ်းတာ ${MM(tests)} ခါ`; };
  say(`<b>${ZAW}</b> — “မီးသီး တစ်လုံး ပျက်ရင် တစ်ကြိုးလုံး မလင်းဘူး။ မီးစစ်ညှပ် နှစ်ဖက်ကို မီးသီး နှစ်လုံးမှာ ညှပ်ကြည့် — ပျက်တဲ့ အလုံးက ကြားထဲမှာ ရှိရင် ကျန်တာတွေ လင်းလာမယ်။”`); show();

  function wire() { // the cable snakes through the bulbs in order, from the plug
    const r = str.getBoundingClientRect(), pts = B.map(b => { const q = b.getBoundingClientRect(); return [q.left - r.left + q.width / 2, q.top - r.top + 2]; });
    svg.innerHTML = `<polyline points="${[[pts[0][0] - 26, pts[0][1] - 10], ...pts].map(p => p.join(',')).join(' ')}" fill="none" stroke="#2b2730" stroke-width="3" stroke-linejoin="round"/><text x="${pts[0][0] - 40}" y="${pts[0][1] - 6}" font-size="16">🔌</text>`;
  }
  addEventListener('resize', wire); requestAnimationFrame(wire);
  const light = on => B.forEach((b, i) => b.classList.toggle('lit', on(i)));
  const clear = () => { B.forEach(b => { b.classList.remove('sel', 'span'); b.querySelector('.clip')?.remove(); }); };
  const clip = (i, c) => { const e = $('span', 'clip', c); B[i].appendChild(e); };

  function test(a, b) { // the jumper across a..b
    [a, b] = [Math.min(a, b), Math.max(a, b)]; tests++; show(); busy = true;
    for (let i = a; i <= b; i++) B[i].classList.add('span');
    const inside = dead >= a && dead <= b, outside = i => i < a || i > b;
    sound?.fx?.('hit');
    if (inside) { light(outside); say(a === b ? `${MM(a + 1)} နံပါတ်ကို ကျော်လိုက်တော့ ကျန်တာ အကုန် လင်းလာပြီ! <b>ဒီအလုံး ပျက်နေတာ</b> — 🔧 နဲ့ လဲလိုက်။`
      : a === 0 && b === N - 1 ? 'အကုန် ကျော်လိုက်ရင်တော့ ဘာမှ မလင်းဘူးပေါ့… 😅' : `လင်းလာပြီ! ပျက်တဲ့ အလုံးက <b>${MM(a + 1)} – ${MM(b + 1)}</b> ကြားထဲမှာ ရှိတယ်။`); }
    else say(`မလင်းဘူး… <b>${MM(a + 1)} – ${MM(b + 1)}</b> ကြားထဲမှာ မဟုတ်ဘူး။`);
    if (tests >= 6 && !hinted) { hinted = true; setTimeout(() => !done && say(msg.innerHTML + `<br><b>${ZAW}</b> — “တစ်ဝက်ခွဲပြီး စမ်းကြည့်လေ။ ၁ ကနေ ၆ အထိ ညှပ်ကြည့်… လင်းရင် အဲဒီထဲမှာ။”`), 900); }
    timer = setTimeout(() => { busy = false; clear(); light(() => false); }, 1600);
  }
  function replace(i) {
    mode = 'test'; swap.classList.remove('on');
    if (i !== dead) { tests++; show(); B[i].classList.add('new'); return say(`${MM(i + 1)} နံပါတ်ကို လဲကြည့်တယ်… ဒါပေမဲ့ မလင်းသေးဘူး။ အဲဒီ အလုံးက ကောင်းနေတာ။`); }
    done = true; busy = true; clearTimeout(timer); clear(); B[i].classList.add('new');
    let k = 0; const run = () => { if (!root.isConnected) return; light(j => j <= k); if (k++ < N) setTimeout(run, 70); }; run();
    say(tests <= 4 ? `✨ လင်းပြီ! စမ်းတာ ${MM(tests)} ခါတည်း — ${ZAW}ထက်တောင် မြန်သေးတယ်!` : `လင်းပြီ! 🎉 အရောင်စုံ လင်းနေပြီ။`);
    sound?.fx?.('bell');
    setTimeout(() => { close(); onWin?.({ tests }); }, 2400);
  }
  function tap(i) {
    if (busy || done) return;
    if (mode === 'swap') return replace(i);
    if (first < 0) { first = i; B[i].classList.add('sel'); clip(i, '🔴'); return say(`ညှပ် တစ်ဖက် ${MM(i + 1)} မှာ။ နောက်တစ်ဖက်ကို ဘယ်မှာ ညှပ်မလဲ? (အလုံးတစ်လုံးတည်း စမ်းချင်ရင် အဲဒီ အလုံးကိုပဲ ထပ်နှိပ်)`); }
    clip(i, '⚫'); const a = first; first = -1; test(a, i);
  }
  swap.onclick = () => { if (busy || done) return; mode = mode === 'swap' ? 'test' : 'swap'; swap.classList.toggle('on', mode === 'swap'); if (first >= 0) { first = -1; clear(); }
    say(mode === 'swap' ? 'ဘယ် မီးသီးကို လဲမလဲ? နှိပ်လိုက်။' : 'ညှပ် နှစ်ဖက်ကို မီးသီး နှစ်လုံးမှာ ညှပ်ကြည့်။'); };
  later.onclick = () => { if (done) return; close(); onQuit?.({ tests }); };
  function close() { clearTimeout(timer); removeEventListener('resize', wire); root.remove(); }
  // tests: halve the string until one bulb is left, then swap it
  async function auto() {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    let lo = 0, hi = N - 1;
    while (lo < hi && !done) { const mid = (lo + hi) >> 1; while (busy) await wait(100); tap(lo); tap(mid); const lit = B.some(b => b.classList.contains('lit')); if (lit) hi = mid; else lo = mid + 1; await wait(50); }
    while (busy) await wait(100); swap.onclick(); tap(lo);
  }
  return { close, auto, dead: () => dead, tests: () => tests };
}
