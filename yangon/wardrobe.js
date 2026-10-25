// yangon/wardrobe.js — the barber (ဆံပင်ညှပ်ဆိုင်) and the clothes shop (အထည်ဆိုင်) on the main street.
// Each choice rebuilds the player at once (live preview); the look is saved with the story.
import { HAIRS, HAIRS_DYED, TOPS } from '../chibi.js?v=26';

export const LOOK0 = { hair: 'short', hairColor: HAIRS[0], topStyle: 'tee', top: '#ffc83d', bottom: 'longyi', bottomColor: ['#3f7a5a', '#72b08b'], hat: 'goggles' };
// what never changes about the hero; S.look (hair, clothes, hat) goes on top
const BODY = { skin: '#efc29c', age: 'adult', prop: 'gun', accent: '#e0574f', shoes: 'sneaker', shoeColor: '#c8553d', garland: false, thanaka: 'round', print: 'သင်္ကြန်', eyes: 'round', brows: 'arc', lips: 'smile', marks: 'none', head: 'wide', flower: false, build: 'broad' };
export const makePlayer = (W, S, x, z, ry = 0) => W.bean({ ...BODY, ...S.look, x, z, ry });
// rebuild the hero in place after a look change
export function redress(W, S) { const old = W.player, p = makePlayer(W, S, old.g.position.x, old.g.position.z, old.g.rotation.y); W.removeChar(old); W.setPlayer(p); p.anim.play('wave'); }

const HAIR_STYLES = [['short', 'အတို'], ['buzz', 'ဆံပင်ကပ်'], ['spiky', 'ထောင်ထောင်'], ['mohawk', 'မိုဟော့'], ['bob', 'ဘော့ကတ်'], ['bun', 'ဆံထုံး'], ['long', 'ဆံပင်ရှည်'], ['pigtails', 'ကျစ်ဆံမြီး']];
const HAIR_COLORS = [...HAIRS, ...HAIRS_DYED]; // natural, then the Thingyan dye jobs
const TOP_STYLES = [['tee', 'တီရှပ်'], ['stripe', 'အစင်းတီရှပ်'], ['shirt', 'ရှပ်အင်္ကျီ'], ['tank', 'စွပ်ကျယ်'], ['long', 'လက်ရှည်'], ['hoodie', 'ဟူဒီ'], ['jacket', 'ဂျာကင်'], ['yinphone', 'ရင်ဖုံး'], ['taikpon', 'တိုက်ပုံ']];
const TOP_COLORS = [...TOPS, '#86b96d', '#e9a0b4'];
const BOTTOMS = [['longyi', 'လုံချည် (ပုဆိုး)'], ['htamein', 'ထဘီ'], ['pants', 'ဘောင်းဘီရှည်'], ['shorts', 'ဘောင်းဘီတို'], ['skirt', 'စကတ်'], ['overalls', 'ဘောင်းဘီကြိုး']];
const BOTTOM_COLORS = [['#3f7a5a', '#72b08b'], ['#4a5aa8', '#7f8fd6'], ['#a8434a', '#d97a7f'], ['#7a4a9a', '#a985c8'], ['#a8743a', '#d6a76a'], ['#2e2e38', '#5a5a68']];
const HATS = [['none', 'မဆောင်းဘူး'], ['band', 'ခေါင်းစည်း'], ['goggles', 'ရေကူးမျက်မှန်'], ['bucket', 'ဦးထုပ်']];

// ctx: { hud, S, dress(look) } — dress rebuilds the player from S.look and saves
export function openBarber({ hud, S, dress }) {
  const set = (k, v) => () => { S.look[k] = v; dress(); return true; };
  hud.menu({ title: '✂ ဆံပင်ညှပ်ဆိုင် — သင်္ကြန်ပုံစံ ဘာညှပ်မလဲ', close: 'ပြီးပြီ', items: [
    { head: 'ဆံပင်ပုံ' }, ...HAIR_STYLES.map(([k, n]) => ({ label: n, cls: 'chip', on: set('hair', k) })),
    { head: 'အရောင် (နောက်ဆုံး ၄ ခုက သင်္ကြန် ဆေးဆိုး)' }, ...HAIR_COLORS.map(c => ({ label: '', swatch: c, cls: 'chip sw', on: set('hairColor', c) })),
  ] });
}
export function openClothes({ hud, S, dress }) {
  const set = (k, v) => () => { S.look[k] = v; dress(); return true; };
  hud.menu({ title: '👕 အထည်ဆိုင် — ဘာဝတ်မလဲ', close: 'ပြီးပြီ', items: [
    { head: 'အပေါ်ပိုင်း' }, ...TOP_STYLES.map(([k, n]) => ({ label: n, cls: 'chip', on: set('topStyle', k) })),
    { head: 'အင်္ကျီ အရောင်' }, ...TOP_COLORS.map(c => ({ label: '', swatch: c, cls: 'chip sw', on: set('top', c) })),
    { head: 'အောက်ပိုင်း' }, ...BOTTOMS.map(([k, n]) => ({ label: n, cls: 'chip', on: set('bottom', k) })),
    { head: 'အောက်ပိုင်း အရောင်' }, ...BOTTOM_COLORS.map(c => ({ label: '', swatch: `linear-gradient(90deg,${c[0]} 50%,${c[1]} 50%)`, cls: 'chip sw', on: set('bottomColor', c) })),
    { head: 'ခေါင်း' }, ...HATS.map(([k, n]) => ({ label: n, cls: 'chip', on: set('hat', k) })),
  ] });
}
