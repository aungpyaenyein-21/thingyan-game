// yangon/day.js — the daily rhythm (SCENARIO v6 §0, the same every day): morning at home → the gang and today's mission →
// five o'clock at the mandat → night at home with one question. This file owns the parts every day shares: the phase
// (and its light), the range Mum allows today, the goal line on the HUD, the 「ရက် N」 title and the end-of-day card, and
// the ?day=&step= debug start. What happens in each scene is story.js (lines) and main.js (play).
import { MM } from './set.js?v=19';

// W.setTime: 0 the morning/afternoon light · .6 the golden five o'clock · 1.7 night
export const PHASES = { morning: 0, day: 0, five: .6, night: 1.7 };
// every scene of a day, in order, and the phase it plays in
export const STEPS = { 1: ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8'] };
export const PHASE_OF = { '1-1': 'morning', '1-2': 'day', '1-3': 'day', '1-4': 'day', '1-5': 'day', '1-6': 'five', '1-7': 'five', '1-8': 'night', done: 'night' };
// the day's title card (SCENARIO §3 heading)
const TITLE = { 1: ['ရက် ၁', 'အကြိုနေ့ — 「မဏ္ဍပ် ဆောက်」'] };
// where Mum lets you go: a polygon on the ward's ground (x, z). Day 1 = ① only — the lane, the lot, the houses round it;
// the main street (②, z > 5.8) and everything east of the east lane (x > 10.6, ④'s compound) are out
export const RANGES = { 1: [[-9.8, -9.8], [10.5, -9.8], [10.5, 5.4], [-9.8, 5.4]] };
// what a save has to hold to start straight at a scene (?day=1&step=1-7): the parts and items the earlier scenes give
const BEFORE = {
  '1-1': {}, '1-2': {}, '1-3': { ball: true }, '1-4': { ball: true, got: ['cloth'] }, '1-5': { ball: true, got: ['cloth', 'speaker'] },
  '1-6': { ball: true, got: ['cloth', 'speaker', 'lights'] }, '1-7': { ball: true, parts: ['floor', 'cloth', 'speaker', 'lights'] },
  '1-8': { ball: true, parts: ['floor', 'cloth', 'speaker', 'lights'] },
};

// ?day=1&step=1-7 → the save is set up as if you had just got there (and it's saved, so a reload stays)
export function debugStart(S) {
  const P = new URLSearchParams(location.search), step = P.get('step'), day = +(P.get('day') || 0);
  if (!step && !day) return false;
  const d = day || +step.split('-')[0], st = step || STEPS[d]?.[0];
  if (!STEPS[d]?.includes(st)) return false;
  Object.assign(S, { day: d, step: st, parts: [], got: [], night: [], ball: false }, structuredClone(BEFORE[st] ?? {}));
  P.delete('day'); P.delete('step'); history.replaceState(null, '', location.pathname + (P.size ? '?' + P : '')); // a reload carries on from the save
  return true;
}

const $ = id => document.getElementById(id);
const inside = (poly, x, z) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };

// hud: yangon/hud.js · S: the save · opts.out(): Mum's call when you step out of range (main.js says the line)
export function createDay(W, hud, S, { out = () => {} } = {}) {
  const { THREE } = W;
  let at = null, poly = RANGES[S.day] ?? null, watching = false, steer = null;
  const last = new THREE.Vector3(), mid = new THREE.Vector3(), tmp = new THREE.Vector3();
  const centre = () => { mid.set(0, 0, 0); for (const [x, z] of poly) mid.x += x / poly.length, mid.z += z / poly.length; return mid; };

  // ---------- phase: the light and what life.js does (vendors pack up at night …) ----------
  function phase(p) { at = p; W.setTime(PHASES[p]); const d = $('where'); if (d) d.firstChild.nodeValue = `ရက် ${MM(S.day)} · ${{ morning: 'မနက်', day: 'နေ့လယ်', five: 'ညနေ ၅ နာရီ', night: 'ည' }[p]}\n  `; }

  // ---------- the goal line (SCENARIO §0 table) — '' hides the panel ----------
  function goal(text) { S.goal = text; $('gtext').textContent = text; $('goal').hidden = !text; }

  // ---------- title card 「ရက် N」 and the end-of-day card ----------
  function title(n = S.day, ms = 2600) {
    const t = $('title'), [a, b] = TITLE[n] ?? [`ရက် ${MM(n)}`, ''];
    t.innerHTML = ''; t.append(a); const s = document.createElement('small'); s.textContent = b; t.append(s);
    t.classList.remove('gone'); return new Promise(r => setTimeout(() => { t.classList.add('gone'); r(); }, ms));
  }
  function card(head, body = '') { $('ehead').textContent = head; $('ebody').textContent = body; $('end').hidden = false; }

  // ---------- range: step out and Mum calls your name, and you walk yourself back 2 m (no teleport) ----------
  function walkTo(to, done) { // the player walks there on their own (a cutscene); the world's input can't turn the walk off meanwhile
    const pa = W.player.anim, own = pa.setLoop;
    pa.setLoop = function () { return own.call(this, 'walk'); }; own.call(pa, 'walk');
    steer = { to: to.clone(), done: () => { pa.setLoop = own; own.call(pa, 'idle'); done?.(); }, t: 0 };
  }
  W.tick(dt => {
    if (steer) {
      const p = W.player.g.position, d = tmp.set(steer.to.x - p.x, 0, steer.to.z - p.z), l = d.length(), s = Math.min(l, (W.player.anim.speed || 1.4) * dt);
      steer.t += dt;
      if (l < .08 || steer.t > 4) { const f = steer.done; steer = null; f(); return; }
      W.player.g.rotation.y = Math.atan2(d.x, d.z); p.addScaledVector(d.normalize(), s); W.collide(p); p.y = W.ground(p.x, p.z);
      return;
    }
    if (!watching || !poly || W.frozen || hud.busy()) return;
    const p = W.player.g.position;
    if (inside(poly, p.x, p.z)) { last.copy(p); return; }
    // out: Mum's voice, then back to where you were and 2 m further in
    const back = tmp.copy(centre()).sub(last).setY(0).normalize().multiplyScalar(2).add(last);
    hud.cinematic(true); out();
    walkTo(back, () => hud.cinematic(false));
  });

  return {
    get at() { return at; }, phase, goal, title, card, walkTo,
    get steering() { return !!steer; },
    range: { get poly() { return poly; }, set(p) { poly = p; }, watch(on) { watching = on; }, inside: (x, z) => !poly || inside(poly, x, z) },
  };
}
