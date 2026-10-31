// rules.js — the unwritten rules of a Thingyan water fight (T3 · TASKS.md T3 §E · from SCENARIO v5). Shared: war.js now,
// the ward (T5/T6) later. Pure logic — no three.js, no DOM; the caller shows the one HUD line and plays the reaction.
//   1 fights are silent — kids don't talk in a round; the only word is "ဟေး!" on a win (emotes only)
//   2 grit gone → OUT: walk back, no pushing forward, refill grit at your own water-pot stand
//   3 never splash someone who's OUT — if you do, it costs you grit and earns a "ဟဲ့!"
//   4 no splashing in the mandat (its zone) — the splash button is off in there
//   5 grown-ups, monks and anyone sitting down are not splashed (people.protected)
export const RULE_TEXT = {
  silent: 'ရေစစ်ထဲ စကား မပြောရ',
  out: 'OUT ဖြစ်နေတဲ့သူကို မပက်ရ',
  mandat: 'မဏ္ဍပ်ထဲမှာ မပက်ရ',
  protected: 'လူကြီး · ဘုန်းကြီး · ထိုင်နေသူ မပက်ရ',
};
export const PENALTY = { out: .3 }; // grit lost by whoever splashes an OUT kid

// zones: [{ x, z, r, kind: 'mandat' }] · onBreak(rule, who) — show the line, play the "ဟဲ့!"
export function createRules({ zones = [], onBreak = () => {} } = {}) {
  let round = false, lastBreak = { key: '', t: -9 }, clock = 0;
  const inZone = (p, kind) => zones.some(z => z.kind === kind && Math.hypot(p.x - z.x, p.z - z.z) < z.r);
  const r = {
    zones,
    start() { round = true; }, stop() { round = false; }, get inRound() { return round; },
    tick(dt) { clock += dt; },
    // may `who` say this out loud? (rule 1) — in a round only the win shout gets through
    speak(text) { return !round || text === 'ဟေး!'; },
    // is the splash button live where you stand? (rule 4)
    canFire(p) { return !inZone(p, 'mandat'); },
    // would this splash be fair? from/to: { out, protected, pos }
    canSpray(from, to) {
      if (from && !r.canFire(from.pos)) return { ok: false, why: 'mandat' };
      if (to?.out) return { ok: false, why: 'out' };
      if (to?.protected) return { ok: false, why: 'protected' };
      return { ok: true };
    },
    // a splash landed on someone it shouldn't have: the penalty for the thrower (rule 3), and the line (once a second)
    broke(why, from) {
      const key = why + (from?.id ?? ''), now = clock; if (key === lastBreak.key && now - lastBreak.t < 1) return 0;
      lastBreak = { key, t: now }; onBreak(why, from);
      return why === 'out' ? PENALTY.out : 0;
    },
    inMandat: p => inZone(p, 'mandat'),
    text: why => RULE_TEXT[why] ?? '',
  };
  return r;
}
