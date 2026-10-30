// cast.js — the named characters of the story (CHARACTERS.md), built on chibi.js: fixed looks, their props, and the
// animation tics that belong to each of them. makeCast(id) → { ch, anim, acts } where acts = this character's own buttons.
import * as THREE from 'three';
import { makeChibi, ChibiAnimator, LOOPS, ONESHOT, SKINS, HAIRS, HAIR_GREY, IRIS } from './chibi.js?v=30';

const BLUE = '#2f8fd6', RED = '#e0574f', YELLOW = '#ffc83d';
const mat = {}; const M = c => mat[c] ??= new THREE.MeshLambertMaterial({ color: c });
const mesh = (geo, c, parent, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, typeof c === 'string' ? M(c) : c); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
const ease = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2, clamp01 = t => Math.min(1, Math.max(0, t));

// ---------- props (added after makeChibi, on the rig's pivots, so they ride the animation) ----------
// the steel slide pump in the right hand, the jerry can on the back, the red hose between (same look as war.js gear())
function pump(ch, { long = 1, can = '#f4f1e8' } = {}) {
  const g = new THREE.Group(); ch.arms[1].hand.add(g); g.scale.setScalar(long);
  mesh(new THREE.CylinderGeometry(.022, .022, .82, 6), '#cfd5dc', g, 0, -.3);
  for (const y of [-.02, -.52]) mesh(new THREE.CylinderGeometry(.038, .038, .14, 6), '#5fe04a', g, 0, y);
  mesh(new THREE.CylinderGeometry(.03, .03, .06, 6), '#d8352a', g, 0, -.72);
  mesh(new THREE.BoxGeometry(.24, .3, .13), can, ch.spine, 0, .12, -.2);
  mesh(new THREE.CylinderGeometry(.035, .035, .05, 6), '#d8352a', ch.spine, .07, .29, -.2);
  ch.spine.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(.07, .3, -.2), new THREE.Vector3(.16, .36, -.05), new THREE.Vector3(.24, .2, .06)]), 8, .014, 4), M('#d8352a')));
  ch.pump = g; return g;
}
const R = .3; // head radius (chibi HEAD_R)
function showerCap(ch, c = '#f6a9c9') { // ရေချိုးခေါင်းစွပ်: a puffy dome over the hair with an elastic rim
  const d = mesh(new THREE.SphereGeometry(R * 1.12, 24, 14, 0, Math.PI * 2, 0, 1.5), c, ch.head, 0, .04, 0); d.scale.y = 1.1;
  mesh(new THREE.TorusGeometry(R * 1.1, .018, 6, 28), '#fff6ea', ch.head, 0, .05, 0).rotation.x = Math.PI / 2;
  for (let i = 0; i < 9; i++) { const a = i * .7, e = .55 + (i % 3) * .35; mesh(new THREE.SphereGeometry(.028, 6, 5), '#fff6ea', ch.head, Math.cos(a) * Math.sin(e) * R * 1.12, Math.cos(e) * R * 1.12 + .04, Math.sin(a) * Math.sin(e) * R * 1.12); }
}
function notebook(ch) { // အကြွေးစာအုပ် in the left hand + a pencil behind the ear
  mesh(new THREE.BoxGeometry(.12, .16, .025), '#d8b26a', ch.arms[0].hand, .02, -.06, .05).rotation.x = .3;
  mesh(new THREE.CylinderGeometry(.008, .008, .12, 6), '#ffd24d', ch.head, R * .95, .02, -.02).rotation.x = Math.PI / 2;
}
function balloonBag(ch) { // ပူဖောင်းအိတ် on the hip
  const bag = new THREE.Group(); bag.position.set(.2, -.02, .02); ch.hips.add(bag);
  mesh(new THREE.SphereGeometry(.09, 12, 10), '#f4f1e8', bag).scale.set(1, 1.2, .7);
  for (const [x, y, z, c] of [[.03, .09, .02, RED], [-.03, .1, .01, '#4fb3d9'], [0, .12, .04, YELLOW], [.04, .07, .05, '#8bd17c']]) mesh(new THREE.SphereGeometry(.035, 8, 6), c, bag, x, y, z);
}
function snack(ch) { mesh(new THREE.BoxGeometry(.07, .09, .03), '#f2c14e', ch.arms[0].hand, 0, -.06, .05); } // a packet of something, always
function bandage(ch) { mesh(new THREE.CylinderGeometry(.06, .06, .07, 10, 1, true), '#f4f1e8', ch.arms[0].sh, 0, -.07, 0); } // ပတ်တီး on the left upper arm
function whistle(ch) { // ဝီစီ on a cord round the neck
  mesh(new THREE.TorusGeometry(.17, .005, 4, 24, Math.PI), '#4a3428', ch.spine, 0, .26, .0).rotation.set(Math.PI / 2 + .3, 0, 0);
  const w = mesh(new THREE.CylinderGeometry(.02, .02, .06, 8), '#cfd5dc', ch.spine, 0, .13, .17); w.rotation.z = Math.PI / 2;
  mesh(new THREE.SphereGeometry(.022, 8, 6), '#cfd5dc', ch.spine, -.03, .13, .17);
}
function towel(ch, c = '#c9a27a') { const t = mesh(new THREE.BoxGeometry(.09, .32, .03), c, ch.spine, -.16, .18, .02); t.rotation.set(.2, 0, .25); } // ပဝါ over the left shoulder
function apron(ch) { mesh(new THREE.BoxGeometry(.3, .36, .01), '#f4f1e8', ch.spine, 0, .02, .19).rotation.x = -.12; }
function ladle(ch) { const g = new THREE.Group(); ch.arms[1].hand.add(g); mesh(new THREE.CylinderGeometry(.01, .01, .34, 6), '#cfd5dc', g, 0, -.14); mesh(new THREE.SphereGeometry(.05, 10, 8, 0, Math.PI * 2, 0, 1.6), '#cfd5dc', g, 0, -.32).rotation.x = Math.PI; }
function greens(ch) { const g = new THREE.Group(); g.position.set(0, -.06, .02); ch.arms[1].hand.add(g); for (let i = 0; i < 6; i++) mesh(new THREE.SphereGeometry(.045, 8, 6), i % 2 ? '#4f9a3a' : '#7cc45a', g, (i % 3 - 1) * .04, -.03 * i, (i % 2) * .03).scale.set(1, .6, 1.4); }
function umbrella(ch) { // closed, carried like a cane (the animator keeps ch.cane upright)
  const g = new THREE.Group(); g.position.set(0, -.02, .02); ch.arms[1].hand.add(g);
  mesh(new THREE.CylinderGeometry(.03, .012, .48, 8), '#2e3a59', g, 0, -.25); mesh(new THREE.TorusGeometry(.03, .01, 6, 12, Math.PI), '#7a4a2e', g, 0, .02);
  ch.cane = g; return g;
}
function goggles(ch, lens = '#ffb347') { // ရေကူးမျက်မှန်: a strap round the head and two cups that swing down over the eyes or up on the forehead
  mesh(new THREE.SphereGeometry(R * 1.12, 28, 3, 0, Math.PI * 2, .85, .2), '#2e3a59', ch.head);
  const hinge = new THREE.Group(); hinge.position.set(0, .14, .02); ch.head.add(hinge); // cups hang at eye level; swung up they sit on the hair above the forehead
  for (const s of [-1, 1]) { const g = new THREE.Group(); g.position.set(s * .1, -.12, .3); g.rotation.x = -.2; hinge.add(g); mesh(new THREE.TorusGeometry(.056, .02, 8, 18), '#2e3a59', g); mesh(new THREE.CircleGeometry(.05, 18), new THREE.MeshLambertMaterial({ color: lens, emissive: lens, emissiveIntensity: .4 }), g, 0, 0, .012); }
  const set = up => { hinge.rotation.x = up ? -1.1 : 0; }; set(true);
  return { hinge, set };
}
function earBlush(ch) { const ms = [-1, 1].map(s => mesh(new THREE.SphereGeometry(.052, 10, 8), '#ff8a8a', ch.head, s * R * .98, -.02, 0)); for (const m of ms) { m.scale.set(.5, 1, .8); m.visible = false; } return v => ms.forEach(m => m.visible = v); }

// ---------- the characters ----------
const kid = { age: 'kid', size: .72, print: '', outline: false };
export const CAST = [
  { id: 'hero', name: '{နာမည်}', side: 1, note: 'ကစားသူ · အဝါ · ခေါင်းစည်း · ခေါင်းငုံ့',
    opts: { ...kid, top: YELLOW, topStyle: 'tee', bottom: 'shorts', bottomColor: ['#5b7fa8', '#f6ead2'], hat: 'band', accent: BLUE, thanaka: 'leaf', eyes: 'round', brows: 'arc', lips: 'smile', marks: 'none', head: 'wide', shoes: 'sneaker', shoeColor: '#c8553d' },
    build: ch => pump(ch), acts: [['bow', 'ခေါင်းငုံ့'], ['lift', 'ခေါင်းမော့']] },
  { id: 'ngazwe', name: 'ငဇွဲ', side: 1, note: 'ပခုံးကျယ် · အပြာနက် · ပြွတ်ရှည် · မျက်နှာ မသုတ်',
    opts: { ...kid, build: 'broad', hair: 'spiky', top: '#1f4e8c', topStyle: 'tank', bottom: 'shorts', bottomColor: ['#8a7a5a', '#f6ead2'], hat: 'band', accent: BLUE, thanaka: false, eyes: 'almond', brows: 'bold', lips: 'small', marks: 'none', head: 'wide', shoes: 'slipper', shoeColor: '#2e3a59' },
    build: ch => { pump(ch, { long: 1.15 }); ch.blushEars = earBlush(ch); },
    acts: [['loop:shoulder', 'ပြွတ် ပခုံးတင်'], ['loop:sulk', 'ထိုင်ကြည့် (ရက် ၃)'], ['redeye', 'မျက်လုံးနီ'], ['ears', 'နားရွက်နီ']] },
  { id: 'maythu', name: 'မေသူ', side: 1, note: 'ခေါင်းစွပ် · အကြွေးစာအုပ် · ပူဖောင်း',
    opts: { ...kid, build: 'slim', hair: 'bob', top: '#6a5acd', topStyle: 'long', bottom: 'pants', bottomColor: ['#3f5a8a', '#3f5a8a'], hat: 'none', accent: '#f6a9c9', thanaka: 'square', eyes: 'almond', brows: 'flat', lips: 'small', marks: 'none', head: 'tall', shoes: 'sneaker', shoeColor: '#f4f1e8' },
    build: ch => { showerCap(ch); notebook(ch); balloonBag(ch); }, acts: [['note', 'စာအုပ်ထဲ ရေး'], ['lob', 'ပူဖောင်း ပစ်']] },
  { id: 'phoekyaw', name: 'ဖိုးကျော်', side: 1, note: '၁၃ နှစ် · ဝ · olive · လုံချည် · ဘဲလ်',
    opts: { ...kid, size: .82, build: 'round', hair: 'buzz', top: '#6b7a3a', topStyle: 'tee', bottom: 'longyi', bottomColor: ['#4a4a5a', '#8a8a9a'], hat: 'none', accent: BLUE, thanaka: 'round', eyes: 'sleepy', brows: 'thin', lips: 'grin', marks: 'mole', head: 'soft', shoes: 'slipper', shoeColor: '#5a3a2a' },
    build: ch => { pump(ch); snack(ch); }, acts: [['loop:eat', 'မုန့်စား'], ['loop:coast', 'စက်ဘီးပေါ် ထိုင်']] },
  { id: 'chocho', name: 'ချိုချို', side: 1, note: '၇ နှစ် · လိမ္မော် · ပတ်တီး · ရေသေနတ်',
    opts: { ...kid, size: .6, build: 'round', hair: 'pigtails', top: '#f08a3c', topStyle: 'tee', bottom: 'skirt', bottomColor: ['#f08a3c', '#f08a3c'], hat: 'none', accent: '#e0574f', thanaka: 'dots', eyes: 'round', brows: 'arc', lips: 'grin', marks: 'blush', head: 'round', shoes: 'slipper', shoeColor: '#7a4a2e', prop: 'gun' },
    build: ch => bandage(ch), acts: [['loop:peek', 'ချောင်းကြည့်'], ['loop:listen', 'နားစွင့်'], ['squirt', 'ရေသေနတ် ပစ်']] },
  { id: 'sayagyi', name: 'ဆရာကြီး', side: 0, note: 'ကျောမတ် · အဖြူ+အညို · မျက်မှန် · ဝီစီ',
    opts: { age: 'elder', hunch: .15, build: 'slim', hair: 'buzz', hairColor: HAIR_GREY, top: '#f4f1e8', topStyle: 'shirt', print: '', bottom: 'longyi', bottomColor: ['#5a3a2a', '#5a3a2a'], thanaka: false, eyes: 'bead', brows: 'flat', lips: 'small', marks: 'none', head: 'tall', shoes: 'slipper', shoeColor: '#3a2a1a', cane: false, skin: SKINS[1], smileEyes: false },
    build: ch => whistle(ch), acts: [['loop:handsback', 'လက် နောက်ပစ်'], ['whistle', 'ဝီစီ']] },
  { id: 'thura', name: 'သူရ', side: 4, note: 'သွယ် · အနီရင့် · ရေကူးမျက်မှန် · ဖိနပ်မပါ',
    opts: { ...kid, build: 'slim', hair: 'short', top: '#b8322a', topStyle: 'tank', bottom: 'shorts', bottomColor: ['#2e3a59', '#f6ead2'], hat: 'none', accent: RED, thanaka: false, eyes: 'almond', brows: 'bold', lips: 'cat', marks: 'freckles', head: 'tall', shoes: 'none', skin: SKINS[1] },
    build: ch => { pump(ch, { long: 1.15, can: '#d8352a' }); ch.goggles = goggles(ch); }, acts: [['goggles', 'မျက်မှန် ချ/တင်']] },
  { id: 'kid4', name: '④ ဂိုဏ်းသား', side: 4, note: 'လည်ပဝါ အနီ · ဆီပုံး အနီ',
    opts: { ...kid, build: 'round', hair: 'short', hairColor: HAIRS[2], top: '#ff8a5b', topStyle: 'stripe', bottom: 'shorts', bottomColor: ['#4a4a5a', '#f6ead2'], hat: 'none', accent: RED, thanaka: 'round', eyes: 'round', brows: 'arc', lips: 'smile', marks: 'none', head: 'round', shoes: 'slipper', shoeColor: '#2e3a59' },
    build: ch => { pump(ch, { can: '#d8352a' }); mesh(new THREE.TorusGeometry(.13, .035, 8, 20), RED, ch.spine, 0, .27, .02).rotation.x = Math.PI / 2 + .3; }, acts: [] },
  { id: 'utinmaung', name: 'ဦးတင်မောင်', side: 0, note: 'ဗိုက် · စွပ်ကျယ် · အစိမ်းကွက် · ပဝါ',
    opts: { age: 'elder', build: 'round', hair: 'short', hairColor: '#bdb5a8', top: '#f4f1e8', topStyle: 'tank', print: '', bottom: 'longyi', bottomColor: ['#2f6a4a', '#7cc45a'], thanaka: false, eyes: 'sleepy', brows: 'thin', lips: 'grin', marks: 'mole', head: 'soft', shoes: 'slipper', shoeColor: '#5a3a2a', glasses: false, cane: false, skin: SKINS[2] },
    build: ch => towel(ch), acts: [['towel', 'ပဝါနဲ့ သုတ်'], ['loop:sit', 'ထိုင်']] },
  { id: 'mom1', name: 'ငဇွဲ့အမေ', side: 1, note: 'မုန့်ဟင်းခါး · ပဝါ အပြာ · ယောက်မ',
    opts: { build: 'round', hair: 'bun', top: '#9ec9ee', topStyle: 'yinphone', print: '', bottom: 'htamein', bottomColor: ['#2e2a3a', '#6a5a7a'], hat: 'band', accent: BLUE, thanaka: 'round', eyes: 'almond', brows: 'bold', lips: 'small', marks: 'mole', head: 'wide', shoes: 'slipper', shoeColor: '#5a3a2a', skin: SKINS[1] },
    build: ch => { apron(ch); ladle(ch); }, acts: [['loop:vend', 'ဆိုင်ထိုင်']] },
  { id: 'mom4', name: 'သူရ့အမေ', side: 4, note: 'ဟင်းသီးဟင်းရွက် · ပဝါ အနီ · ခြင်းတောင်း',
    opts: { build: 'round', hair: 'bun', top: '#f6b8c8', topStyle: 'yinphone', print: '', bottom: 'htamein', bottomColor: ['#2e2a3a', '#6a5a7a'], hat: 'band', accent: RED, thanaka: 'round', eyes: 'almond', brows: 'bold', lips: 'small', marks: 'mole', head: 'wide', shoes: 'slipper', shoeColor: '#5a3a2a', skin: SKINS[1] },
    build: ch => greens(ch), acts: [['loop:vend', 'ဆိုင်ထိုင်']] },
  { id: 'mom0', name: '{နာမည်} အမေ', side: 1, note: 'သွယ် · အစိမ်းနု · သနပ်ခါး ရွက် (မိသားစု)',
    opts: { build: 'slim', hair: 'long', top: '#bfe3b4', topStyle: 'yinphone', print: '', bottom: 'htamein', bottomColor: ['#5a3a6a', '#b08ac0'], thanaka: 'leaf', eyes: 'round', brows: 'arc', lips: 'smile', marks: 'none', head: 'soft', shoes: 'slipper', shoeColor: '#5a3a2a' },
    build: () => {}, acts: [['call', 'ဟဲ့!']] },
  { id: 'bwabwa', name: 'ဘွားဘွား', side: 1, note: 'ကုန်း · အဖြူ+အညို · ထီး · နှေး',
    opts: { age: 'elder', hunch: .35, build: 'round', hair: 'bun', hairColor: HAIR_GREY, top: '#f4f1e8', topStyle: 'yinphone', print: '', bottom: 'htamein', bottomColor: ['#6a4a2a', '#b08a5a'], thanaka: 'round', eyes: 'sleepy', brows: 'thin', lips: 'smile', marks: 'none', head: 'round', shoes: 'slipper', shoeColor: '#3a2a1a', cane: false, accent: '#f4f1e8' },
    build: ch => { umbrella(ch); ch.gait = .6; }, acts: [['loop:walk', 'လမ်းလျှောက် (နှေး)']] },
];

// ---------- the tics: extra loops and one-shots, patched onto the shared animator ----------
const loopPose = ChibiAnimator.prototype._loopPose;
const EXTRA_LOOPS = {
  shoulder(p, T) { p.armRx = -2.7; p.armRz = -.3; p.elbowR = -2.5; p.handRz = .2; p.spineRz = .04; p.headRz = -.05 + .02 * Math.sin(T * 1.3); return p; }, // pump resting on the right shoulder
  sulk(p, T) { Object.assign(p, { y: -.2, legLx: -1.45, legRx: -1.45, kneeL: 1.45, kneeR: 1.45, legLz: .12, legRz: -.12, spineRx: .3, headRx: .45, armLx: -.9, armRx: -2.1, armRz: -.3, elbowL: -1.1, elbowR: -1.9, footR: .3 * Math.max(0, Math.sin(T * 1.1)) }); return p; }, // sat out with the pump across the knees, a foot scraping the ground
  peek(p, T) { Object.assign(p, { spineRz: .32, hipsRz: -.08, headRz: .25, headRy: .35, armLx: -.6, elbowL: -1.5, armLz: .25, armRz: -.08, x: .06, expr: 'normal' }); p.headRx = .05 * Math.sin(T * 2); return p; }, // leaning out past a corner
  listen(p, T) { Object.assign(p, { headRz: .35, headRy: .2, armRx: -.5, armRz: -1.2, elbowR: -2.3, handRz: .4, spineRz: .06 }); p.headRx = .04 * Math.sin(T * 1.7); return p; }, // a hand cupped to the ear
  handsback(p, T) { Object.assign(p, { armLx: .55, armRx: .55, armLz: .22, armRz: -.22, elbowL: -.9, elbowR: -.9, spineRx: -.04, headRx: -.04 + .02 * Math.sin(T * .9) }); return p; }, // hands clasped behind the back
};
for (const k in EXTRA_LOOPS) LOOPS[k] = { f: 0, A: 0, speed: 0 };
ChibiAnimator.prototype._loopPose = function (name) { if (!EXTRA_LOOPS[name]) return loopPose.call(this, name); const p = loopPose.call(this, 'idle'); return EXTRA_LOOPS[name](p, this.T + this.seed); };
const bell = (t, a, b) => ease(clamp01((t - a) / .25)) * (1 - ease(clamp01((t - b) / .3))); // 0 → 1 after a, back to 0 after b
Object.assign(ONESHOT, { bow: 1.6, lift: 1.8, note: 1.1, lob: .9, whistle: 1.2, towel: 1.4, goggles: .8 });
Object.assign(ChibiAnimator.prototype, {
  _bow(p, t) { const k = ease(clamp01(t / .4)) * (1 - ease(clamp01((t - 1.25) / .3))); Object.assign(p, { headRx: .55 * k, spineRx: .12 * k, armLx: p.armLx * (1 - k), armRx: p.armRx * (1 - k), armLz: .05, armRz: -.05, expr: 'normal', mouth: 'smile' }); return p; }, // head down, arms at the sides
  _lift(p, t) { const k = 1 - ease(clamp01((t - .5) / .9)); Object.assign(p, { headRx: .55 * k - .08 * (1 - k), spineRx: .12 * k - .03 * (1 - k), armLx: p.armLx * (1 - k), armRx: p.armRx * (1 - k), expr: 'normal', mouth: k < .3 ? 'open' : 'smile' }); return p; }, // from bowed, slowly up — and speak
  _note(p, t) { const k = bell(t, 0, .8), s = Math.sin(t * 28); Object.assign(p, { armLx: -1.1 * k, elbowL: -1.3 * k, armLz: .15, armRx: -1.0 * k, elbowR: -1.5 * k, armRz: -.25 * k, handRz: .35 * k * s, headRx: .35 * k, expr: 'normal', mouth: 'smile' }); return p; }, // notebook up, pencil scribbling
  _lob(p, t) { const w = ease(clamp01(t / .3)), f = ease(clamp01((t - .35) / .2)); Object.assign(p, { armRx: -2.9 * w + 2.2 * f, armRz: -.2, elbowR: -1.4 * w + 1.2 * f, spineRx: -.12 * w + .35 * f, legLx: -.3 * f, kneeR: .3 * f, expr: f > .5 ? 'happy' : 'normal', mouth: 'open' }); if (!this.thrown && t > .45) { this.thrown = true; this.emit('lob', this.ch.arms[1].hand); } return p; }, // overhand
  _whistle(p, t) { const k = bell(t, 0, .85); Object.assign(p, { armRx: -1.9 * k, elbowR: -2.3 * k, armRz: -.3 * k, headRx: -.12 * k, spineRx: -.05 * k, expr: 'normal', mouth: k > .6 ? 'open' : 'smile' }); return p; }, // whistle to the mouth, chin up
  _towel(p, t) { const k = bell(t, 0, 1.0), s = Math.sin(t * 9); Object.assign(p, { armRx: -1.6 * k, elbowR: -2.4 * k, armRz: (-.6 + .2 * s) * k, headRz: -.15 * k, headRy: .2 * s * k, expr: 'happy', mouth: 'smile' }); return p; }, // wiping the neck
  _goggles(p, t) { const k = bell(t, 0, .45); Object.assign(p, { armRx: -2.4 * k, elbowR: -2.5 * k, armRz: -.25 * k, headRx: -.1 * k, expr: 'normal' }); if (!this.thrown && t > .3) { this.thrown = true; this.ch.gogglesUp = !this.ch.gogglesUp; this.ch.goggles?.set(this.ch.gogglesUp); } return p; }, // hand up to the forehead; the cups swing
});

export function makeCast(id, emit) {
  const def = CAST.find(c => c.id === id);
  const ch = makeChibi(def.opts); def.build(ch); ch.gogglesUp = true;
  const anim = new ChibiAnimator(ch, emit);
  const act = (k) => { // what this character's own buttons do
    if (k.startsWith('loop:')) { anim.setLoop(k.slice(5)); if (ch.pump) ch.pump.rotation.x = k === 'loop:shoulder' ? Math.PI - .3 : 0; return; } // on the shoulder the pump points up and back
    if (k === 'redeye') { ch.opts.redEye = !ch.opts.redEye; ch.faceKey = ''; return; }
    if (k === 'ears') return ch.blushEars?.(ch.earsOn = !ch.earsOn);
    anim.play(k);
  };
  return { def, ch, anim, act };
}
