// yangon/save.js — the day-1 save, shared by the ward (main.js) and downtown (downtown.js); the bus between them
// saves and reloads into the other map (boot.js picks by S.at). Progress is the player's own (docs/archive/STORY.md §၈).
import { LOOK0 } from './wardrobe.js?v=5';

const KEY = 'thingyan.day1.v2';
// nine favours, one part of the kids' coconut-frond mandat each; all are needed
export const ERRANDS = ['cloth', 'padauk', 'cat', 'tea', 'sign', 'fronds', 'lights', 'drum', 'nozzle'];
export const ITEMS = { fronds: 'အုန်းလက်နဲ့ ဝါး', cloth: 'ပိတ်စ', padauk: 'ပိတောက်ခက်', cat: 'အသံချဲ့စက်', tea: 'ရေပိုက်', sign: 'ဆိုင်းဘုတ်', lights: 'မီးကြိုး', drum: 'ရေစည်', nozzle: 'ရေပန်းခေါင်း' };
export const WHERE = { fronds: '③ ဈေး', cloth: '① အန်တီစိန်', padauk: '① အဘွား → ④ မူလတန်းကျောင်း', cat: '① ဦးဘတင်', tea: '③ လက်ဖက်ရည်ဆိုင်ကြီး', sign: '② ကွမ်းယာဆိုင်', lights: '③ ဈေး', drum: '④ ဘုန်းကြီးကျောင်း', nozzle: '⑤ မြို့လယ် (ဘတ်စ်ကား)' };
export const NEED = ERRANDS.length;

// step: arrive → quests (the favours, any order) → build → evening → done;  at: 'ward' | 'downtown'
export const fresh = () => ({ step: 'arrive', at: 'ward', q: Object.fromEntries(ERRANDS.map(k => [k, 'ask'])), parts: [], gifts: 3, served: [], water: 0, soaked: [],
  signName: 'ကလေးမဏ္ဍပ်', look: { ...LOOK0 }, intro: false, introDown: false });
export function load() {
  let S = fresh();
  try {
    const P = new URLSearchParams(location.search);
    if (P.has('new')) { localStorage.removeItem(KEY); P.delete('new'); history.replaceState(null, '', location.pathname + (P.size ? '?' + P : '')); } // so a bus ride's reload doesn't wipe it again
    const old = JSON.parse(localStorage.getItem(KEY) || '{}');
    S = { ...fresh(), ...old }; S.q = { ...fresh().q, ...old.q }; S.look = { ...LOOK0, ...old.look };
  } catch {}
  return S;
}
export const save = S => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
export const wipe = () => { try { localStorage.removeItem(KEY); } catch {} };
export const party = S => S.step === 'evening' || S.step === 'done';
// a favour done: its part goes on the mandat; true when that was the last one
export function finish(S, q) { S.q[q] = 'done'; if (!S.parts.includes(q)) S.parts.push(q); const all = S.parts.length >= NEED; if (all && S.step === 'quests') S.step = 'build'; save(S); return all; }
export function travel(S, to) { S.at = to; save(S); location.reload(); }
