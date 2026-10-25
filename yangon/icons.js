// yangon/icons.js — little hand-drawn pictures for the tea-shop menu (and its wall board): the cup tells you the brew.
const cache = {};
export const TEA_MENU = {
  drinks: [
    ['pawsein', 'ပေါ့ဆိမ့်', 'နို့များ၊ အချိုလျော့'], ['chosein', 'ချိုဆိမ့်', 'ချို၊ ဆိမ့်'], ['kyasein', 'ကျဆိမ့်', 'လက်ဖက်ရည် အပြင်း'],
    ['coffee', 'ကော်ဖီ', 'နို့ဆီ ကော်ဖီ'], ['greentea', 'ရေနွေးကြမ်း', 'အလကား — အမြဲ ပါပြီးသား'],
  ],
  snacks: [
    ['palata', 'ပလာတာ', 'ကြက်ဥ ပလာတာ'], ['echakway', 'အီကြာကွေး', 'လက်ဖက်ရည်ထဲ နှစ်စား'], ['paukse', 'ပေါက်စီ', 'ကြက်သား ပေါက်စီ'],
    ['naan', 'နံပြား ပဲပြုတ်', 'မနက်စာ ဘုရင်'], ['none', 'မစားတော့ဘူး', ''],
  ],
};
const TEA = { pawsein: '#e2c49a', chosein: '#d2a46c', kyasein: '#a8703f', coffee: '#6b4a32', greentea: '#c8b860' };

export function icon(kind) {
  if (cache[kind]) return cache[kind];
  const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d');
  g.fillStyle = '#fff6ea'; g.beginPath(); g.roundRect(0, 0, 96, 96, 18); g.fill();
  g.lineWidth = 3; g.strokeStyle = '#5a3550';
  if (TEA[kind] && kind !== 'greentea') { // a glass cup on a saucer, filled with the brew
    g.fillStyle = '#e9e1d2'; g.beginPath(); g.ellipse(48, 76, 30, 8, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(28, 28); g.lineTo(68, 28); g.lineTo(62, 74); g.lineTo(34, 74); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = TEA[kind]; g.beginPath(); g.moveTo(30, 38); g.lineTo(66, 38); g.lineTo(61, 72); g.lineTo(35, 72); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(48, 39, 17, 3, 0, 0, 7); g.fill(); // the froth from the long pour
    g.strokeStyle = 'rgba(90,53,80,.35)'; for (const x of [40, 50]) { g.beginPath(); g.moveTo(x, 22); g.quadraticCurveTo(x + 6, 14, x, 6); g.stroke(); } // steam
  } else if (kind === 'greentea') { // the free green tea: a thermos and a small cup
    g.fillStyle = '#4f8f5a'; g.beginPath(); g.roundRect(22, 18, 30, 60, 8); g.fill(); g.stroke(); g.fillStyle = '#e9e1d2'; g.fillRect(26, 12, 22, 8); g.strokeRect(26, 12, 22, 8);
    g.fillStyle = '#fff'; g.beginPath(); g.roundRect(58, 50, 22, 26, 5); g.fill(); g.stroke(); g.fillStyle = TEA.greentea; g.fillRect(61, 56, 16, 6);
  } else if (kind === 'palata') { g.fillStyle = '#e8b85a'; g.beginPath(); g.ellipse(48, 56, 34, 22, 0, 0, 7); g.fill(); g.stroke(); g.strokeStyle = '#b8803a'; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(48, 56, 30 - i * 7, 18 - i * 4, 0, .3, 2.6); g.stroke(); } }
  else if (kind === 'echakway') { g.fillStyle = '#d99a4a'; for (const [x, y, r] of [[30, 30, .5], [52, 44, .45], [38, 60, .55]]) { g.save(); g.translate(x, y); g.rotate(r); g.beginPath(); g.roundRect(0, 0, 34, 12, 6); g.fill(); g.stroke(); g.restore(); } }
  else if (kind === 'paukse') { g.fillStyle = '#fbf4e6'; g.beginPath(); g.arc(48, 56, 26, Math.PI, 0); g.quadraticCurveTo(74, 74, 48, 74); g.quadraticCurveTo(22, 74, 22, 56); g.fill(); g.stroke(); g.fillStyle = '#c8553d'; g.beginPath(); g.arc(48, 34, 3, 0, 7); g.fill(); }
  else if (kind === 'naan') { g.fillStyle = '#e8c48a'; g.beginPath(); g.ellipse(40, 48, 26, 18, -.3, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#c99a4a'; g.beginPath(); g.ellipse(64, 66, 18, 12, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#e0c060'; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(56 + (i % 4) * 5, 62 + (i >> 2) * 6, 3, 0, 7); g.fill(); } }
  else { g.strokeStyle = '#c8553d'; g.lineWidth = 6; g.beginPath(); g.moveTo(30, 30); g.lineTo(66, 66); g.moveTo(66, 30); g.lineTo(30, 66); g.stroke(); }
  return cache[kind] = c.toDataURL();
}
export const teaColor = k => TEA[k] ?? '#d2a46c';
