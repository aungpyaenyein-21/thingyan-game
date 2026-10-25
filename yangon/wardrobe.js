// yangon/wardrobe.js — the barber (ဆံပင်ညှပ်ဆိုင်) and the clothes shop (အထည်ဆိုင်), opened inside their shops (rooms.js).
// Every option is shown as a picture of you wearing it; picking one restyles you at once (live preview), saved with the story.
import { makeChibi, HAIRS, HAIRS_DYED, TOPS } from '../chibi.js?v=26';

export const LOOK0 = { hair: 'short', hairColor: HAIRS[0], topStyle: 'tee', top: '#ffc83d', bottom: 'longyi', bottomColor: ['#3f7a5a', '#72b08b'], hat: 'goggles' };
// what never changes about the hero; S.look (hair, clothes, hat) goes on top
const BODY = { skin: '#efc29c', age: 'adult', prop: 'gun', accent: '#e0574f', shoes: 'sneaker', shoeColor: '#c8553d', garland: false, thanaka: 'round', print: 'သင်္ကြန်', eyes: 'round', brows: 'arc', lips: 'smile', marks: 'none', head: 'wide', flower: false, build: 'broad' };
export const makePlayer = (W, S, x, z, ry = 0) => W.bean({ ...BODY, ...S.look, tools: ['bucket', 'gun'], tool: S.tool ?? 'bucket', x, z, ry }); // carries both; R swaps
// rebuild the hero in place after a look change
export function redress(W, S) { const old = W.player, p = makePlayer(W, S, old.g.position.x, old.g.position.z, old.g.rotation.y); W.removeChar(old); W.setPlayer(p); p.anim.play('wave'); }

const HAIR_STYLES = [['short', 'အတို'], ['buzz', 'ဆံပင်ကပ်'], ['spiky', 'ထောင်ထောင်'], ['mohawk', 'မိုဟော့'], ['bob', 'ဘော့ကတ်'], ['bun', 'ဆံထုံး'], ['long', 'ဆံပင်ရှည်'], ['pigtails', 'ကျစ်ဆံမြီး']];
const HAIR_COLORS = [...HAIRS, ...HAIRS_DYED]; // natural, then the Thingyan dye jobs
const TOP_STYLES = [['tee', 'တီရှပ်'], ['stripe', 'အစင်းတီရှပ်'], ['shirt', 'ရှပ်အင်္ကျီ'], ['tank', 'စွပ်ကျယ်'], ['long', 'လက်ရှည်'], ['hoodie', 'ဟူဒီ'], ['jacket', 'ဂျာကင်'], ['yinphone', 'ရင်ဖုံး'], ['taikpon', 'တိုက်ပုံ']];
const TOP_COLORS = [...TOPS, '#86b96d', '#e9a0b4'];
const BOTTOMS = [['longyi', 'လုံချည် (ပုဆိုး)'], ['htamein', 'ထဘီ'], ['pants', 'ဘောင်းဘီရှည်'], ['shorts', 'ဘောင်းဘီတို'], ['skirt', 'စကတ်'], ['overalls', 'ဘောင်းဘီကြိုး']];
const BOTTOM_COLORS = [['#3f7a5a', '#72b08b'], ['#4a5aa8', '#7f8fd6'], ['#a8434a', '#d97a7f'], ['#7a4a9a', '#a985c8'], ['#a8743a', '#d6a76a'], ['#2e2e38', '#5a5a68']];
const HATS = [['none', 'မဆောင်းဘူး'], ['band', 'ခေါင်းစည်း'], ['goggles', 'ရေကူးမျက်မှန်'], ['bucket', 'ဦးထုပ်']];

// pictures: each option drawn as your own hero wearing it, on a small offscreen renderer; cached by look
let TR = null; const shots = {};
function shot(W, look, frame) {
  const key = JSON.stringify(look) + frame; if (shots[key]) return shots[key];
  const { THREE } = W;
  if (!TR) {
    const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true }); r.setPixelRatio(1); r.setSize(144, 144);
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight('#fff4e6', '#b39bd1', 2.2)); const d = new THREE.DirectionalLight('#ffe2c4', 1.8); d.position.set(2, 3, 4); sc.add(d);
    TR = { r, sc, cam: new THREE.PerspectiveCamera(28, 1, .1, 30) };
  }
  const ch = makeChibi({ ...BODY, ...look, outline: true }); TR.sc.add(ch.root);
  if (frame === 'head') { TR.cam.position.set(.6, 1.32, 1.9); TR.cam.lookAt(0, 1.13, 0); } else { TR.cam.position.set(1.1, 1.25, 3.7); TR.cam.lookAt(0, .76, 0); }
  TR.r.render(TR.sc, TR.cam); const url = TR.r.domElement.toDataURL(); TR.sc.remove(ch.root);
  return shots[key] = url;
}

// ctx: { W, hud, S, dress(), onClose } — dress() rebuilds the hero from S.look and saves. Picking re-opens the menu so every
// picture shows the rest of your current look (pick a dye, and all the cuts show in that colour).
export function openBarber(ctx) {
  const { W, hud, S, dress, onClose } = ctx;
  const set = (k, v) => () => { S.look[k] = v; dress(); openBarber(ctx); return true; };
  hud.menu({ title: '✂ ဆံပင်ညှပ်ဆိုင် — ဘယ်ပုံ ညှပ်မလဲ', close: 'ပြီးပြီ', side: true, onClose, items: [
    { head: 'ဆံပင်ပုံ' }, ...HAIR_STYLES.map(([k, n]) => ({ label: n, img: shot(W, { ...S.look, hair: k, hat: 'none' }, 'head'), cls: S.look.hair === k ? 'on' : '', on: set('hair', k) })),
    { head: 'ဆေးဆိုး (နောက်ဆုံး ၄ ရောင်က သင်္ကြန် အရောင်)' }, ...HAIR_COLORS.map(c => ({ label: '', swatch: c, cls: 'chip sw' + (S.look.hairColor === c ? ' on' : ''), on: set('hairColor', c) })),
  ] });
}
export function openClothes(ctx) {
  const { W, hud, S, dress, onClose } = ctx;
  const set = (k, v) => () => { S.look[k] = v; dress(); openClothes(ctx); return true; };
  hud.menu({ title: '👕 အထည်ဆိုင် — မှန်ရှေ့မှာ ဝတ်ကြည့်', close: 'ပြီးပြီ', side: true, onClose, items: [
    { head: 'အပေါ်ပိုင်း' }, ...TOP_STYLES.map(([k, n]) => ({ label: n, img: shot(W, { ...S.look, topStyle: k }, 'body'), cls: S.look.topStyle === k ? 'on' : '', on: set('topStyle', k) })),
    { head: 'အင်္ကျီ အရောင်' }, ...TOP_COLORS.map(c => ({ label: '', swatch: c, cls: 'chip sw' + (S.look.top === c ? ' on' : ''), on: set('top', c) })),
    { head: 'အောက်ပိုင်း' }, ...BOTTOMS.map(([k, n]) => ({ label: n, img: shot(W, { ...S.look, bottom: k }, 'body'), cls: S.look.bottom === k ? 'on' : '', on: set('bottom', k) })),
    { head: 'အောက်ပိုင်း အရောင်' }, ...BOTTOM_COLORS.map(c => ({ label: '', swatch: `linear-gradient(90deg,${c[0]} 50%,${c[1]} 50%)`, cls: 'chip sw' + (S.look.bottomColor?.[0] === c[0] ? ' on' : ''), on: set('bottomColor', c) })),
    { head: 'ခေါင်း' }, ...HATS.map(([k, n]) => ({ label: n, img: shot(W, { ...S.look, hat: k }, 'head'), cls: S.look.hat === k ? 'on' : '', on: set('hat', k) })),
  ] });
}
