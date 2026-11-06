// cast.js — the named characters of the story (CHARACTERS.md), built on chibi.js: fixed looks, their props, and the
// animation tics that belong to each of them. makeCast(id) → { ch, anim, acts } where acts = this character's own buttons.
import * as THREE from 'three';
import { makeChibi, ChibiAnimator, LOOPS, ONESHOT, SKINS, HAIRS, HAIR_GREY, IRIS } from './chibi.js?v=31';

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
  g.rotation.x = PUMP_REST; ch.pump = g; return g; // held level at the hip, nozzle forward — pointed down it read as a walking stick
}
const PUMP_REST = -1.35;
// Phoe Kyaw's: slung across the back over the jerry can, nozzle up by the left shoulder — he's the one who carries the water
function pumpOnBack(ch) {
  mesh(new THREE.BoxGeometry(.24, .3, .13), '#f4f1e8', ch.spine, 0, .12, -.2); mesh(new THREE.CylinderGeometry(.035, .035, .05, 6), '#d8352a', ch.spine, .07, .29, -.2);
  const g = new THREE.Group(); g.position.set(0, .16, -.3); g.rotation.z = .75; ch.spine.add(g);
  mesh(new THREE.CylinderGeometry(.022, .022, .82, 6), '#cfd5dc', g); for (const y of [-.2, .28]) mesh(new THREE.CylinderGeometry(.038, .038, .14, 6), '#5fe04a', g, 0, y);
  mesh(new THREE.CylinderGeometry(.03, .03, .06, 6), '#d8352a', g, 0, .42);
}
function bikeBell(ch) { // the bicycle bell he talks with — off the bike, it lives in his right hand
  const g = new THREE.Group(); g.position.set(0, -.07, .04); ch.arms[1].hand.add(g);
  mesh(new THREE.SphereGeometry(.065, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#dfe5ec', g).rotation.x = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(.012, .012, .05, 6), '#9aa2ac', g, 0, 0, -.03).rotation.x = Math.PI / 2; mesh(new THREE.BoxGeometry(.04, .012, .02), '#9aa2ac', g, .04, .02, 0);
  ch.bell = g;
}
function pouch(ch) { const p = mesh(new THREE.BoxGeometry(.11, .12, .05), '#8a5a3a', ch.hips, -.19, -.04, .06); p.rotation.y = -.4; mesh(new THREE.TorusGeometry(.19, .01, 5, 24), '#6a4028', ch.hips, 0, .04, 0).rotation.x = Math.PI / 2; } // money pouch on a string at the waist
function pot(ch) { // the big mohinga pot on its stand, in front of her (shown while she stirs)
  const g = new THREE.Group(); g.position.set(0, 0, .42); ch.root.add(g); g.visible = false;
  for (const a of [0, 2.1, 4.2]) mesh(new THREE.CylinderGeometry(.015, .015, .42, 5), '#3a3030', g, Math.cos(a) * .17, .21, Math.sin(a) * .17);
  mesh(new THREE.CylinderGeometry(.24, .2, .3, 18), '#b8bec6', g, 0, .55, 0); mesh(new THREE.CylinderGeometry(.22, .22, .01, 18), '#c98a3a', g, 0, .69, 0);
  ch.pot = g; return g;
}
const R = .3; // head radius (chibi HEAD_R)
function showerCap(ch, c = '#f6a9c9') { // ရေချိုးခေါင်းစွပ်: a puffy dome over the hair with an elastic rim
  const d = mesh(new THREE.SphereGeometry(R * 1.12, 24, 14, 0, Math.PI * 2, 0, 1.5), c, ch.head, 0, .04, 0); d.scale.y = 1.1;
  mesh(new THREE.TorusGeometry(R * 1.1, .018, 6, 28), '#fff6ea', ch.head, 0, .05, 0).rotation.x = Math.PI / 2;
  for (let i = 0; i < 9; i++) { const a = i * .7, e = .55 + (i % 3) * .35; mesh(new THREE.SphereGeometry(.028, 6, 5), '#fff6ea', ch.head, Math.cos(a) * Math.sin(e) * R * 1.12, Math.cos(e) * R * 1.12 + .04, Math.sin(a) * Math.sin(e) * R * 1.12); }
}
function notebook(ch) { // အကြွေးစာအုပ် in the left hand + a pencil behind the ear
  const book = mesh(new THREE.BoxGeometry(.13, .17, .025), '#d8b26a', ch.arms[0].hand, .02, -.07, .05); book.rotation.x = .3; ch.book = book; ch.bookHome = { parent: ch.arms[0].hand, pos: book.position.clone(), rot: book.rotation.clone() };
  const page = mesh(new THREE.BoxGeometry(.11, .15, .004), '#fff6ea', book, 0, 0, .015); // the open page, with lines of debts on it
  for (let i = 0; i < 5; i++) mesh(new THREE.BoxGeometry(.07 - (i % 2) * .02, .006, .002), '#5a3550', page, -.01, .05 - i * .025, .003);
  const pencil = mesh(new THREE.CylinderGeometry(.008, .008, .14, 6), '#ffd24d', ch.head, R * .95, .02, -.02); pencil.rotation.x = Math.PI / 2;
  ch.pencil = pencil; ch.pencilHome = { parent: ch.head, pos: pencil.position.clone(), rot: pencil.rotation.clone() };
}
function balloonBag(ch) { // ပူဖောင်းအိတ် on the hip
  const bag = new THREE.Group(); bag.position.set(.2, -.02, .02); ch.hips.add(bag);
  mesh(new THREE.SphereGeometry(.09, 12, 10), '#f4f1e8', bag).scale.set(1, 1.2, .7);
  for (const [x, y, z, c] of [[.03, .09, .02, RED], [-.03, .1, .01, '#4fb3d9'], [0, .12, .04, YELLOW], [.04, .07, .05, '#8bd17c']]) mesh(new THREE.SphereGeometry(.035, 8, 6), c, bag, x, y, z);
  const b = mesh(new THREE.SphereGeometry(.095, 12, 10), '#4fb3d9', ch.arms[1].hand, 0, -.11, .03); b.scale.set(1, 1.15, 1); b.visible = false; ch.balloon = b; // one in the throwing hand while winding up
}
function snack(ch) { mesh(new THREE.BoxGeometry(.07, .09, .03), '#f2c14e', ch.arms[0].hand, 0, -.06, .05); } // a packet of something, always
function scar(ch) { const m = mesh(new THREE.BoxGeometry(.018, .11, .012), '#e89a9a', ch.arms[0].sh, .02, -.09, .05); m.rotation.z = .25; } // last year's break: a pale line on the left upper arm, no bandage
function whistle(ch) { // ဝီစီ on a cord round the neck
  mesh(new THREE.TorusGeometry(.17, .005, 4, 24, Math.PI), '#4a3428', ch.spine, 0, .26, .0).rotation.set(Math.PI / 2 + .3, 0, 0);
  const w = new THREE.Group(); w.position.set(0, .13, .17); ch.spine.add(w);
  mesh(new THREE.CylinderGeometry(.02, .02, .06, 8), '#cfd5dc', w).rotation.z = Math.PI / 2; mesh(new THREE.SphereGeometry(.022, 8, 6), '#cfd5dc', w, -.03, 0, 0);
  ch.whistle = w; ch.whistleHome = { parent: ch.spine, pos: w.position.clone(), rot: w.rotation.clone() };
}
function towel(ch, c = '#c9a27a') { const t = mesh(new THREE.BoxGeometry(.09, .32, .03), c, ch.spine, -.16, .18, .02); t.rotation.set(.2, 0, .25); ch.towel = t; ch.towelHome = { parent: ch.spine, pos: t.position.clone(), rot: t.rotation.clone() }; } // ပဝါ over the left shoulder
function apron(ch) { // ရှေ့ဖုံး tied at the waist, hanging to the knees (it read as a sheet of paper when it sat on the chest)
  mesh(new THREE.TorusGeometry(.19, .014, 6, 24), '#e8d8c0', ch.hips, 0, .06, 0).rotation.x = Math.PI / 2;
  const a = mesh(new THREE.BoxGeometry(.26, .34, .012), '#f4f1e8', ch.hips, 0, -.12, .17); a.rotation.x = -.08;
  for (const y of [-.1, -.2]) mesh(new THREE.BoxGeometry(.2, .03, .004), '#c9a27a', a, 0, y + .14, .008); // two faded curry stains
}
function ladle(ch) { const g = new THREE.Group(); ch.arms[1].hand.add(g); mesh(new THREE.CylinderGeometry(.01, .01, .34, 6), '#cfd5dc', g, 0, -.14); mesh(new THREE.SphereGeometry(.05, 10, 8, 0, Math.PI * 2, 0, 1.6), '#cfd5dc', g, 0, -.32).rotation.x = Math.PI; }
function greens(ch) { const g = new THREE.Group(); g.position.set(0, -.06, .02); ch.arms[0].hand.add(g); for (let i = 0; i < 6; i++) mesh(new THREE.SphereGeometry(.045, 8, 6), i % 2 ? '#4f9a3a' : '#7cc45a', g, (i % 3 - 1) * .04, -.03 * i, (i % 2) * .03).scale.set(1, .6, 1.4); }
function umbrella(ch) { // closed, carried like a cane (the animator keeps ch.cane upright)
  const g = new THREE.Group(); g.position.set(0, -.02, .02); ch.arms[1].hand.add(g);
  mesh(new THREE.CylinderGeometry(.03, .012, .48, 8), '#1e1a20', g, 0, -.25); mesh(new THREE.TorusGeometry(.03, .01, 6, 12, Math.PI), '#7a4a2e', g, 0, .02);
  ch.cane = g; return g;
}
function goggles(ch, lens = '#ffb347') { // ရေကူးမျက်မှန်: a strap round the head and two cups that swing down over the eyes or up on the forehead
  mesh(new THREE.SphereGeometry(R * 1.12, 28, 3, 0, Math.PI * 2, .85, .2), '#2e3a59', ch.head);
  const hinge = new THREE.Group(); hinge.position.set(0, .14, .02); ch.head.add(hinge); // cups hang at eye level; swung up they sit on the hair above the forehead
  for (const s of [-1, 1]) { const g = new THREE.Group(); g.position.set(s * .1, -.12, .3); g.rotation.x = -.2; hinge.add(g); mesh(new THREE.TorusGeometry(.056, .02, 8, 18), '#2e3a59', g); mesh(new THREE.CircleGeometry(.05, 18), new THREE.MeshLambertMaterial({ color: lens, emissive: lens, emissiveIntensity: .4 }), g, 0, 0, .012); }
  const set = up => { hinge.rotation.x = up ? -1.1 : 0; }; set(true);
  return { hinge, set };
}
function wall(ch) { // a corner of brick wall, in front and to her right, that she leans out past
  const w = new THREE.Group(); w.position.set(-.3, 0, .22); ch.root.add(w); w.visible = false;
  mesh(new THREE.BoxGeometry(.62, 1.35, .1), '#c98a6a', w, 0, .675, 0); mesh(new THREE.BoxGeometry(.66, .06, .14), '#8a5a4a', w, 0, 1.38, 0);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) mesh(new THREE.BoxGeometry(.17, .09, .012), '#b5765a', w, -.2 + c * .2 + (r % 2) * .1, .12 + r * .21, .053);
  ch.wall = w; return w;
}
export function earBlush(ch) { // red ears over the real ones (exported: the ward puts them on {နာမည်} too — 1-8): they sit on the skull pivot, which carries the head shape's squash
  const sk = ch.head.children.find(o => !o.isMesh) ?? ch.head;
  const ms = [-1, 1].map(s => mesh(new THREE.SphereGeometry(.056, 10, 8), '#ff3a3a', sk, s * R * .99, -.02, 0)); for (const m of ms) { m.scale.set(.6, 1.1, .9); m.visible = false; } return v => ms.forEach(m => m.visible = v); }

// ---------- the characters ----------
const kid = { age: 'kid', size: .72, print: '', outline: false };
export const CAST = [
  { id: 'hero', name: '{နာမည်}', side: 1, note: 'ကစားသူ · အဝါ · သနပ်ခါး ရွက် · ခေါင်းငုံ့',
    opts: { ...kid, top: YELLOW, topStyle: 'tee', bottom: 'shorts', bottomColor: ['#5b7fa8', '#f6ead2'], hat: 'none', accent: BLUE, thanaka: 'leaf', eyes: 'round', brows: 'arc', lips: 'smile', marks: 'none', head: 'wide', shoes: 'sneaker', shoeColor: '#c8553d' },
    build: ch => pump(ch), acts: [['bow', 'ခေါင်းငုံ့'], ['lift', 'ခေါင်းမော့']] },
  { id: 'ngazwe', name: 'ငဇွဲ', side: 1, note: 'ပခုံးကျယ် · အပြာနက် · ပြွတ်ရှည် · မျက်နှာ မသုတ်',
    opts: { ...kid, build: 'broad', hair: 'spiky', top: '#1f4e8c', topStyle: 'tank', bottom: 'shorts', bottomColor: ['#8a7a5a', '#f6ead2'], hat: 'none', accent: BLUE, thanaka: false, eyes: 'almond', brows: 'bold', lips: 'small', marks: 'none', head: 'wide', shoes: 'slipper', shoeColor: '#2e3a59' },
    build: ch => { pump(ch, { long: 1.15 }); ch.blushEars = earBlush(ch); },
    acts: [['loop:shoulder', 'ပြွတ် ပခုံးတင်'], ['loop:sulk', 'ထိုင်ကြည့် (ရက် ၃)'], ['redeye', 'မျက်လုံးနီ'], ['ears', 'နားရွက်နီ']] },
  { id: 'maythu', name: 'မေသူ', side: 1, note: 'ခေါင်းစွပ် · အကြွေးစာအုပ် · ပူဖောင်း',
    opts: { ...kid, build: 'slim', hair: 'bob', top: '#6a5acd', topStyle: 'long', bottom: 'pants', bottomColor: ['#3f5a8a', '#3f5a8a'], hat: 'none', accent: '#f6a9c9', thanaka: 'square', eyes: 'almond', brows: 'flat', lips: 'small', marks: 'none', head: 'tall', shoes: 'sneaker', shoeColor: '#f4f1e8' },
    build: ch => { showerCap(ch); notebook(ch); balloonBag(ch); }, acts: [['note', 'စာအုပ်ထဲ ရေး'], ['lob', 'ပူဖောင်း ပစ်'], ['loop:refuse', 'ရေစို မခံ']] },
  { id: 'phoekyaw', name: 'ဖိုးကျော်', side: 1, note: '၁၃ နှစ် · ဝ · olive · လုံချည် · ဘဲလ်',
    opts: { ...kid, size: .82, build: 'round', hair: 'buzz', top: '#6b7a3a', topStyle: 'tee', bottom: 'longyi', bottomColor: ['#4a4a5a', '#8a8a9a'], hat: 'none', accent: BLUE, thanaka: 'round', eyes: 'sleepy', brows: 'thin', lips: 'grin', marks: 'mole', head: 'soft', shoes: 'slipper', shoeColor: '#5a3a2a' },
    build: ch => { pumpOnBack(ch); snack(ch); bikeBell(ch); }, acts: [['loop:munch', 'မုန့်စား'], ['shrug', 'ရတယ် ရတယ်'], ['ring', 'ဘဲလ် ကလင်']] },
  { id: 'chocho', name: 'ချိုချို', side: 1, note: '၇ နှစ် · လိမ္မော် · လက်မောင်း အမာရွတ် · ရေသေနတ်',
    opts: { ...kid, size: .6, build: 'round', hair: 'pigtails', top: '#f08a3c', topStyle: 'tee', bottom: 'shorts', bottomColor: ['#7a5a3a', '#f6ead2'], hat: 'none', accent: '#e0574f', thanaka: 'dots', eyes: 'round', brows: 'arc', lips: 'grin', marks: 'blush', head: 'round', shoes: 'slipper', shoeColor: '#7a4a2e', prop: 'gun' },
    build: ch => { scar(ch); wall(ch); }, acts: [['loop:peek', 'ချောင်းကြည့်'], ['loop:listen', 'နားစွင့်'], ['squirt', 'ရေသေနတ် ပစ်']] },
  { id: 'sayagyi', name: 'ဆရာကြီး', side: 0, note: 'ကျောမတ် · အဖြူ+အညို · မျက်မှန် · ဝီစီ',
    opts: { age: 'elder', hunch: .15, build: 'slim', hair: 'buzz', hairColor: HAIR_GREY, top: '#f4f1e8', topStyle: 'shirt', print: '', bottom: 'longyi', bottomColor: ['#5a3a2a', '#5a3a2a'], thanaka: false, eyes: 'bead', brows: 'bold', lips: 'small', marks: 'none', head: 'tall', shoes: 'slipper', shoeColor: '#3a2a1a', cane: false, skin: SKINS[1], smileEyes: false },
    build: ch => whistle(ch), acts: [['loop:handsback', 'လက် နောက်ပစ်'], ['whistle', 'ဝီစီ']] },
  { id: 'thura', name: 'သူရ', side: 4, note: 'သွယ် · အနီရင့် · ရေကူးမျက်မှန် · ဖိနပ်မပါ',
    opts: { ...kid, build: 'slim', hair: 'short', top: '#b8322a', topStyle: 'tank', bottom: 'shorts', bottomColor: ['#26262c', '#f6ead2'], hat: 'none', accent: RED, thanaka: false, eyes: 'almond', brows: 'bold', lips: 'cat', marks: 'freckles', head: 'tall', shoes: 'none', skin: SKINS[1] },
    build: ch => { pump(ch, { long: 1.15, can: '#d8352a' }); ch.goggles = goggles(ch); }, acts: [['goggles', 'မျက်မှန် ချ/တင်']] },
  { id: 'kid4', name: '④ ဂိုဏ်းသား', side: 4, note: 'အနီ/လိမ္မော် အင်္ကျီ · ဆီပုံး အနီ',
    opts: { ...kid, build: 'round', hair: 'short', hairColor: HAIRS[2], top: '#ff8a5b', topStyle: 'stripe', bottom: 'shorts', bottomColor: ['#4a4a5a', '#f6ead2'], hat: 'none', accent: RED, thanaka: 'round', eyes: 'round', brows: 'arc', lips: 'smile', marks: 'none', head: 'round', shoes: 'slipper', shoeColor: '#2e3a59' },
    build: ch => pump(ch, { can: '#d8352a' }), acts: [] },
  { id: 'utinmaung', name: 'ဦးတင်မောင်', side: 0, note: 'ဗိုက် · စွပ်ကျယ် · အစိမ်းကွက် · ပဝါ',
    opts: { age: 'elder', build: 'round', hair: 'short', hairColor: '#bdb5a8', top: '#f4f1e8', topStyle: 'tank', print: '', bottom: 'longyi', bottomColor: ['#2f6a4a', '#7cc45a'], thanaka: false, eyes: 'sleepy', brows: 'thin', lips: 'grin', marks: 'mole', head: 'wide', shoes: 'slipper', shoeColor: '#5a3a2a', glasses: false, cane: false, skin: SKINS[2] },
    build: ch => towel(ch), acts: [['towel', 'ပဝါနဲ့ သုတ်'], ['loop:sit', 'ထိုင်']] },
  { id: 'mom1', name: 'ငဇွဲ့အမေ', side: 1, note: 'မုန့်ဟင်းခါး · ဆံထုံး · ဝ · ယောက်မ · ရှေ့ဖုံး',
    opts: { build: 'round', hair: 'bun', top: '#9ec9ee', topStyle: 'yinphone', print: '', bottom: 'htamein', bottomColor: ['#2e2a3a', '#6a5a7a'], hat: 'none', accent: BLUE, thanaka: 'round', eyes: 'almond', brows: 'bold', lips: 'small', marks: 'mole', head: 'wide', shoes: 'slipper', shoeColor: '#5a3a2a', skin: SKINS[1] },
    build: ch => { apron(ch); ladle(ch); pot(ch); }, acts: [['loop:stir', 'အိုး မွှေ']] },
  { id: 'mom4', name: 'သူရ့အမေ', side: 4, note: 'ဟင်းသီးဟင်းရွက် · ဆံမြီး · သွယ် · ခေါင်းရှည် · ဟင်းရွက်စည်း',
    opts: { build: 'slim', hair: 'long', hairColor: HAIRS[2], top: '#f6b8c8', topStyle: 'yinphone', print: '', bottom: 'htamein', bottomColor: ['#6a2a2a', '#c0705a'], hat: 'none', accent: RED, thanaka: 'square', eyes: 'round', brows: 'thin', lips: 'grin', marks: 'none', head: 'tall', shoes: 'slipper', shoeColor: '#5a3a2a', skin: SKINS[2] },
    build: ch => { greens(ch); pouch(ch); }, acts: [['loop:sprinkle', 'ဟင်းရွက် ရေဖြန်း']] },
  { id: 'mom0', name: '{နာမည်} အမေ', side: 1, note: 'သွယ် · အစိမ်းနု · သနပ်ခါး ရွက် (မိသားစု)',
    opts: { build: 'slim', hair: 'long', top: '#bfe3b4', topStyle: 'yinphone', print: '', bottom: 'htamein', bottomColor: ['#5a3a6a', '#b08ac0'], thanaka: 'leaf', eyes: 'round', brows: 'arc', lips: 'smile', marks: 'none', head: 'soft', shoes: 'slipper', shoeColor: '#5a3a2a' },
    build: () => {}, acts: [['scold', 'ဟဲ့!']] },
  { id: 'bwabwa', name: 'ဘွားဘွား', side: 1, note: 'ကုန်း · အဖြူ+အညို · ထီး · နှေး',
    opts: { age: 'elder', hunch: .35, build: 'round', hair: 'bun', hairColor: HAIR_GREY, top: '#f4f1e8', topStyle: 'yinphone', print: '', bottom: 'htamein', bottomColor: ['#6a4a2a', '#b08a5a'], thanaka: 'round', eyes: 'sleepy', brows: 'thin', lips: 'smile', marks: 'none', head: 'round', shoes: 'slipper', shoeColor: '#3a2a1a', cane: false, accent: '#f4f1e8' },
    build: ch => { umbrella(ch); ch.gait = .6; }, acts: [['loop:walk', 'လမ်းလျှောက် (နှေး)']] },
];

// ---------- the tics: extra loops and one-shots, patched onto the shared animator ----------
// Rule: a tic has to read from across the street — the prop goes where the eye expects it (whistle at the lips, towel in
// the hand, pencil on the page), the pose is exaggerated, and it holds long enough to be seen.
const loopPose = ChibiAnimator.prototype._loopPose;
const osc = (T, f, a = 1) => a * Math.sin(T * f);
const EXTRA_LOOPS = {
  // pump resting on the right shoulder: upper arm down, forearm folded up so the pump runs up past the shoulder and leans back
  shoulder(p, T) { Object.assign(p, { armRx: -.55, armRz: -.12, elbowR: -2.75, handRz: 0, spineRz: -.05, headRz: .04 + osc(T, 1.3, .02), armLx: -.1, armLz: .12 }); return p; },
  // sat out on the kerb: knees up, pump laid across the knees, chin down, one foot scraping the ground
  sulk(p, T) { Object.assign(p, { y: -.2, legLx: -1.45, legRx: -1.45, kneeL: 1.45, kneeR: 1.45, legLz: .14, legRz: -.14, spineRx: .32, headRx: .5, armLx: -1.05, armRx: -1.05, armLz: .2, armRz: -.2, elbowL: -.35, elbowR: -.35, footR: .35 * Math.max(0, osc(T, 1.1)), expr: 'normal', mouth: 'smile' }); return p; },
  // peeking: body tucked behind the wall (to her right), leaning out to the left with a hand on the wall's edge, head turned to look
  peek(p, T) { Object.assign(p, { x: -.1, spineRz: -.42, hipsRz: .06, headRz: -.12, headRy: .45 + osc(T, 1.6, .1), armLx: -.75, elbowL: -1.1, armLz: 1.0, handLz: -.5, armRx: -.35, armRz: .15, elbowR: -.9, legLz: .35, kneeL: .25, expr: 'normal', mouth: 'smile' }); return p; },
  // listening in: leaning over sideways, hand cupped behind the right ear, the other hand behind the back
  listen(p, T) { Object.assign(p, { spineRz: .18, headRz: .42, headRy: -.25, armRx: -1.5, armRz: -1.55, elbowR: -2.3, handRz: -.6, armLx: .5, elbowL: -1.0, armLz: .25, headRx: .03 * osc(T, 1.7), expr: 'normal', mouth: 'smile' }); return p; },
  // the headmaster's stance: chest out, hands clasped behind the back, a slow look left and right
  handsback(p, T) { Object.assign(p, { armLx: .75, armRx: .75, armLz: .28, armRz: -.28, elbowL: -1.15, elbowR: -1.15, handLz: .4, handRz: -.4, spineRx: -.1, headRx: -.06, headRy: osc(T, .5, .3), expr: 'normal', mouth: 'smile' }); return p; },
  // standing and eating: the snack hand comes up to the mouth every few seconds, then chewing
  munch(p, T) { const c = (T % 3.6), up = ease(clamp01(c / .35)) * (1 - ease(clamp01((c - 1.6) / .3))), chew = c > .5 && c < 3.0; /* hand stays at the mouth a good while, then chewing */ Object.assign(p, { armLx: -1.95 * up, elbowL: -2.55 * up, armLz: .22 * up, headRx: .12 * up + (chew ? .03 * osc(T, 11) : 0), headRz: chew ? .04 * osc(T, 5.5) : 0, mouth: chew && osc(T, 11) > 0 ? 'open' : 'smile', expr: 'normal' }); return p; },
  // stirring the big pot: leaning over it, the ladle going round and round in front
  stir(p, T) { const a = T * 2.6; Object.assign(p, { spineRx: .2, headRx: .25, armRx: -.95 + .12 * Math.sin(a), armRz: -.1 + .18 * Math.cos(a), elbowR: -.75, armLx: -.3, elbowL: -.9, armLz: .25, expr: 'normal', mouth: 'smile' }); return p; },
  // keeping the greens fresh: the bunch held out in the left hand, the right hand dips and flicks water over it
  sprinkle(p, T) { const c = T % 1.4, f = c < .9 ? 0 : Math.sin((c - .9) / .5 * Math.PI); Object.assign(p, { armLx: -1.05, elbowL: -.7, armLz: .15, armRx: -.8 - .5 * f, elbowR: -1.4 + .9 * f, armRz: .15, handRz: 1.2 * f, spineRx: .1, headRx: .2, headRy: .15, expr: 'normal', mouth: 'smile' }); return p; },
  // hates getting wet: turned away, shoulders up, both forearms shielding the face
  refuse(p, T) { Object.assign(p, { spineRy: .5, spineRx: .18, headRy: .4, headRz: .18, armLx: -1.7, armRx: -1.7, elbowL: -2.4, elbowR: -2.4, armLz: .35, armRz: -.35, sy: .97, expr: 'squint', mouth: 'open' }); return p; },
};
for (const k in EXTRA_LOOPS) LOOPS[k] = { f: 0, A: 0, speed: 0 };
ChibiAnimator.prototype._loopPose = function (name) { if (!EXTRA_LOOPS[name]) return loopPose.call(this, name); const p = loopPose.call(this, 'idle'); return EXTRA_LOOPS[name](p, this.T + this.seed); };
const bell = (t, a, b, r = .3) => ease(clamp01((t - a) / .3)) * (1 - ease(clamp01((t - b) / r))); // 0 → 1 after a, back to 0 after b
const moveTo = (m, parent, x, y, z, rx = 0, ry = 0, rz = 0) => { parent.add(m); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); };
const moveHome = (m, h) => { h.parent.add(m); m.position.copy(h.pos); m.rotation.copy(h.rot); };
Object.assign(ONESHOT, { bow: 2.4, lift: 2.6, note: 2.2, lob: 1.5, whistle: 1.6, towel: 2.0, goggles: .9, shrug: 1.6, scold: 1.6, ring: 1.4 });
Object.assign(ChibiAnimator.prototype, {
  // scolded: head drops, shoulders slump, both hands clasped low in front, and it holds
  _bow(p, t) { const k = bell(t, 0, 2.0, .35); Object.assign(p, { headRx: .7 * k, spineRx: .18 * k, armLx: -.3 * k, armRx: -.3 * k, armLz: -.22 * k, armRz: .22 * k, elbowL: -.55 * k, elbowR: -.55 * k, handLz: .5 * k, handRz: -.5 * k, sy: 1 - .03 * k, expr: 'normal', mouth: 'smile' }); return p; },
  // from that bow: the head comes up slowly, chin lifts, chest out, hands open at the sides — and he speaks
  _lift(p, t) { const k = 1 - ease(clamp01((t - .6) / 1.0)), talk = t > 1.5; Object.assign(p, { headRx: .7 * k - .14 * (1 - k), spineRx: .18 * k - .08 * (1 - k), armLx: -.3 * k, armRx: -.3 * k, armLz: -.22 * k + .18 * (1 - k), armRz: .22 * k - .18 * (1 - k), elbowL: -.55 * k - .3 * (1 - k), elbowR: -.55 * k - .3 * (1 - k), handLz: .5 * k + .9 * (1 - k), handRz: -.5 * k - .9 * (1 - k), expr: 'normal', mouth: talk && Math.sin(t * 14) > 0 ? 'open' : 'smile' }); return p; },
  // the debt book: left hand holds it open at chest height, the pencil leaves the ear for the right hand and scribbles, head down reading
  _note(p, t) { const k = bell(t, 0, 1.8, .35), c = this.ch, scr = k > .9 ? Math.sin(t * 26) : 0; Object.assign(p, { armLx: -.7 * k, elbowL: -1.9 * k, armLz: .3 * k, handLz: -.6 * k, armRx: -.95 * k, elbowR: -1.95 * k + .06 * scr, armRz: -.55 * k, handRz: .9 * k + .3 * scr, headRx: .5 * k, headRy: .15 * k, spineRx: .1 * k, expr: 'normal', mouth: 'smile' });
    // while she writes, the open book sits in front of her chest tilted up to her eyes (on the spine, so it can't vanish inside an arm) and the pencil is in the right hand
    if (k > .5 && !this.thrown) { this.thrown = true; if (c.book) moveTo(c.book, c.spine, .02, .1, .24, -.95, 0, 0); if (c.pencil) moveTo(c.pencil, c.arms[1].hand, .02, -.06, .04, 1.5, 0, .3); }
    if (t > 1.9 && this.thrown === true) { this.thrown = 'back'; if (c.book) moveHome(c.book, c.bookHome); if (c.pencil) moveHome(c.pencil, c.pencilHome); } return p; },
  // overhand throw: wind up with the balloon high behind, lean back; snap forward, step through, and let it fly (cast.html spawns it)
  _lob(p, t) { const w = ease(clamp01(t / .5)), f = ease(clamp01((t - .55) / .18)), c = this.ch; if (c.balloon) c.balloon.visible = t < .62;
    Object.assign(p, { armRx: -3.0 * w + 2.3 * f, armRz: -.25 * w + .1 * f, elbowR: -.9 * w + .5 * f, handRz: -.3 * w, armLx: -1.1 * w * (1 - f) - .4 * f, elbowL: -.8 * w, armLz: .3, spineRx: -.25 * w + .45 * f, spineRy: -.3 * w + .35 * f, headRx: -.15 * w + .15 * f, legLx: -.45 * f, kneeR: .35 * f, legRx: .25 * f, x: .05 * f, expr: f > .5 ? 'happy' : 'normal', mouth: w > .5 ? 'open' : 'smile' });
    if (!this.thrown && t > .6) { this.thrown = true; this.emit('lob', c.arms[1].hand); } return p; },
  // the whistle comes up to the lips on its cord, chin up, a sharp blow (cheeks: mouth open) — and the kids freeze
  _whistle(p, t) { const k = bell(t, 0, 1.2, .3), c = this.ch; Object.assign(p, { armRx: -1.95 * k, elbowR: -2.45 * k, armRz: -.42 * k, handRz: .2 * k, headRx: -.18 * k, spineRx: -.08 * k, armLx: .3 * k, elbowL: -.6 * k, expr: 'normal', mouth: k > .8 && t < 1.25 ? 'open' : 'smile' });
    if (c.whistle) { if (k > .4 && !this.thrown) { this.thrown = true; moveTo(c.whistle, c.arms[1].hand, 0, -.06, .07, 0, 0, 0); } if (k < .4 && this.thrown === true && t > 1) { this.thrown = 'back'; moveHome(c.whistle, c.whistleHome); } } return p; },
  // the shoulder towel comes off into the right hand and rubs the neck and face side to side, head rolling with it
  _towel(p, t) { const k = bell(t, 0, 1.6, .35), s = Math.sin(t * 8.5), c = this.ch; Object.assign(p, { armRx: -1.75 * k, elbowR: -2.55 * k, armRz: (-.55 + .25 * s) * k, handRz: .3 * s * k, headRz: -.22 * k, headRy: .3 * s * k, headRx: .05 * k, spineRz: -.05 * k, expr: 'happy', mouth: 'smile' });
    if (c.towel) { if (k > .3 && !this.thrown) { this.thrown = true; moveTo(c.towel, c.arms[1].hand, 0, -.02, .08, .5, 0, 0); } if (k < .3 && this.thrown === true && t > 1) { this.thrown = 'back'; moveHome(c.towel, c.towelHome); } } return p; },
  // hand up to the forehead; the cups swing down over the eyes (or back up)
  _goggles(p, t) { const k = bell(t, 0, .5, .3); Object.assign(p, { armRx: -2.5 * k, elbowR: -2.6 * k, armRz: -.3 * k, headRx: -.12 * k, expr: 'normal' }); if (!this.thrown && t > .32) { this.thrown = true; this.ch.gogglesUp = !this.ch.gogglesUp; this.ch.goggles?.set(this.ch.gogglesUp); } return p; },
  // 「ရတယ် ရတယ်」: both hands out and open, palms up, a shrug of the shoulders and a tilt of the head, grinning
  _shrug(p, t) { const k = bell(t, 0, 1.2, .35); if (this.ch.pump) this.ch.pump.visible = t > 1.5; Object.assign(p, { armLx: -.4 * k, armRx: -.4 * k, armLz: 1.0 * k, armRz: -1.0 * k, elbowL: -1.7 * k, elbowR: -1.7 * k, handLz: -1.1 * k, handRz: 1.1 * k, sy: 1 + .035 * k, headRz: .22 * k, spineRz: -.04 * k, expr: 'happy', mouth: 'open' }); return p; },
  // 「ကလင်」: the bell comes up in front of the chest and the thumb flicks it, twice
  _ring(p, t) { const k = bell(t, 0, 1.0, .3), fl = k > .8 ? Math.max(0, Math.sin(t * 22)) : 0; Object.assign(p, { armRx: -1.25 * k, elbowR: -1.5 * k, armRz: -.2 * k, handRz: .5 * fl, headRz: .1 * k, expr: 'happy', mouth: 'smile' }); if (!this.thrown && t > .45) { this.thrown = true; this.emote('note', 1); } return p; },
  // 「ဟဲ့!」: a step forward, hand on the hip, the other arm pointing straight at you, chin out
  _scold(p, t) { const k = bell(t, 0, 1.2, .3); Object.assign(p, { armRx: -1.35 * k, armRz: -.55 * k, elbowR: -.05, handRz: 0, armLx: -.35 * k, armLz: .65 * k, elbowL: -1.9 * k, handLz: -.4 * k, spineRx: .12 * k, headRx: -.06 * k, legRx: -.3 * k, kneeL: .15 * k, expr: 'normal', mouth: t > .3 && t < .9 ? 'open' : 'smile' }); if (!this.thrown && t > .2) { this.thrown = true; this.emote('bang', 1.2); } return p; },
});

export function makeCast(id, emit) {
  const def = CAST.find(c => c.id === id);
  const ch = makeChibi(def.opts); def.build(ch); ch.gogglesUp = true;
  const anim = new ChibiAnimator(ch, emit);
  const act = (k) => { // what this character's own buttons do
    if (k.startsWith('loop:')) {
      const name = k.slice(5); anim.setLoop(name);
      if (ch.pump) { ch.pump.rotation.set(PUMP_REST, 0, 0); if (name === 'shoulder') ch.pump.rotation.set(.45, 0, -.45); if (name === 'sulk') ch.pump.rotation.set(0, 0, Math.PI / 2 + .1); } // up past the shoulder and out to the side, so the head doesn't hide it / flat across the knees
      if (ch.pot) ch.pot.visible = name === 'stir';
      if (ch.wall) ch.wall.visible = name === 'peek';
      return;
    }
    if (k === 'redeye' || k === 'ears') { if (anim.loop !== 'idle' && anim.loop !== 'shoulder') act('loop:idle'); } // the face has to be up to see it
    if (k === 'redeye') { ch.opts.redEye = !ch.opts.redEye; ch.faceKey = ''; return; }
    if (k === 'ears') return ch.blushEars?.(ch.earsOn = !ch.earsOn);
    anim.play(k);
  };
  return { def, ch, anim, act };
}
