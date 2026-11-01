// yangon/save.js — the story save (SCENARIO v6): which day, which scene, what's up on the mandat, what you said at night.
// One key per story version: the v4 "nine favours" save (thingyan.day1.v2) is wiped the first time this loads.
import { LOOK0 } from './wardrobe.js?v=5';

const KEY = 'thingyan.v6', OLD = ['thingyan.day1.v2'];
// day: 1–4 · step: the scene you're in ('1-1' … '1-8'; 'done' once the day card is up) — saved after every scene
// parts: what's up on the mandat (mandat.js PARTS) · got: today's mission items, delivered to the lot but not lifted yet
// night: what you answered each night ('yes' | 'dots') · name: {နာမည်} · ball: May Thu gave you the balloon (1-2)
export const fresh = () => ({ v: 6, day: 1, step: '1-1', parts: [], got: [], night: [], name: 'မောင်မောင်', ball: false, look: { ...LOOK0 } });
export function load() {
  let S = fresh();
  try {
    for (const k of OLD) localStorage.removeItem(k);
    const P = new URLSearchParams(location.search);
    if (P.has('new')) { localStorage.removeItem(KEY); P.delete('new'); history.replaceState(null, '', location.pathname + (P.size ? '?' + P : '')); } // so a reload doesn't wipe it again
    const old = JSON.parse(localStorage.getItem(KEY) || '{}');
    S = { ...fresh(), ...(old.v === 6 ? old : {}) }; S.look = { ...LOOK0, ...old.look };
    if (P.get('name')) S.name = P.get('name');
  } catch {}
  return S;
}
export const save = S => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
export const wipe = () => { try { localStorage.removeItem(KEY); } catch {} };

// ---------- v4 leftovers: only downtown.js (⑤, unreachable in the v6 story) still imports these; they keep it loading ----------
export const ITEMS = { nozzle: 'ရေပန်းခေါင်း' }, NEED = 9, ERRANDS = [], WHERE = {}; // ERRANDS/WHERE: the old main.js, until the day-1 flow replaces it
export const party = S => S.step === 'done';
export function finish(S, q) { if (!(S.parts ??= []).includes(q)) S.parts.push(q); save(S); return false; }
export function travel(S, to) { S.at = to; save(S); location.reload(); }
