// yangon/story.js — the scenes as data (SCENARIO v6.1 §2–§3: day 1 is pro · 1-1 · 1-2 · wip so far; 1-3 … 1-8 are T5's, unreachable until T5b-2) and the little runner that plays them.
// A scene: { id, when, where, lines: [[who, text, { face, act, cue, voice }]], beats: { name: lines }, then }.
//   who   — a cast id (who() in main.js turns it into a person) · null for a line that is only a cue
//   text  — the line, word for word from SCENARIO.md (never paraphrased); {name} = the player's name
//   face  — CHARACTERS §14 expression; until anim.face exists (T6.5) it shows as an emote bubble (+ red ears for 'lie')
//   act   — the speaker's own tic (cast.js acts: 'note', 'shrug', 'whistle', 'loop:peek' …) or a chibi one-shot
//   cue   — something main.js does before the line (someone arrives, the mandat goes up, a choice …); awaited
//   voice — heard, not seen (off screen): the camera stays where it is
// beats: lines a mission plays in the middle (1-5 the water on the lights, 1-7 after the throw). then: the next scene.
// Each line holds for its typing time plus a reading pause (hold below) and then moves on by itself; a tap moves it on sooner.

import { clusters } from './hud.js?v=6';

// who → the name over the line (CHARACTERS: kids say 「ငါ/မင်း」, Cho Cho her own name — that's in the text)
export const NAMES = { hero: '{name}', mom: 'အမေ', bwabwa: 'ဘွားဘွား', ngazwe: 'ငဇွဲ', maythu: 'မေသူ', phoekyaw: 'ဖိုးကျော်', chocho: 'ချိုချို',
  sayagyi: 'ဆရာကြီး', kozaw: 'ကိုဇော်', kid4: '④ ကလေး' };

// SCENARIO §0: the goal line, at 1-2 (after line 25: 「ငါတို့ ဘာသာ ငါတို့ ဆောက်မယ်」) and 1-7
export const GOALS = { '1-2': 'ငါတို့ ဘာသာ ငါတို့ ဆောက်မယ်', '1-7': 'ဖလား… ဘယ်သူမှ မပြောရ' };

export const SCENES = {
  // pro: the Prologue — morning at the house front, the bowl on the bamboo bench, Bwa Bwa polishes it and goes in. No lines (a tap skips).
  pro: { when: 'morning', lines: [], then: '1-1' },
  // 1-1 Scene A (indoors, lines 1–9 — SCENARIO §3): Mum's rule for the day; {son} = သား / သမီး by the hero's gender
  '1-1': { when: 'morning', where: 'home', lines: [
    ['hero', 'အမေ ဒီနှစ် လမ်းထိပ်က မဏ္ဍပ်မှာ {son} သွားကစားမယ်နော်။'],
    ['mom', 'ဟဲ့ ဒီနှစ် လမ်းထိပ်မှာ မဏ္ဍပ် မဆောက်ဘူးတဲ့။ နင့်အမေ ဂျီးထော်တွေပဲ ရှိတယ်။', { face: 'sly', act: 'hips' }],
    ['hero', 'ဟင်! ဟုတ်လား ဒီနှစ် ဘာလို့ မဆောက်တာလဲ။ ငဇွဲတို့နဲ့ အတူ သွားဖို့တောင် ပြောထားပြီးပြီ။', { face: 'worry' }],
    ['mom', 'ဆရာကြီးက တာဝန်ယူပြီး မလုပ်နိုင်တော့ဘူးတဲ့။ နင်တို့ ဒုက္ခပေးလို့ နေမှာပေါ့။'],
    ['hero', 'ဟာ အမေကလည်း {son}တို့ ဘာမှ မလုပ်ပါဘူးဗျ။'],
    ['bwabwa', 'ဆရာကြီးလဲ အသက်ကြီးပြီလေ မြေးရဲ့။ အသက်ကြီးလာရင် စိတ်သွားတိုင်း ကိုယ်မပါတော့ဘူး။'],
    ['hero', 'ဟာ ဒီနှစ် သင်္ကြန်တော့ သွားပါပြီ။ ပျင်းစရာကြီး။ ငဇွဲတို့နဲ့ သွားဆော့လိုက်ဦးမယ်။', { face: 'pout' }],
    ['mom', 'ဆော့မယ်ဆို အိမ်ရှေ့မှာပဲ ဆော့။ လမ်းထိပ်မှာလဲ ဘာမှ ရှိတာ မဟုတ်ဘူး။'],
    ['hero', 'ဟုတ်ကဲ့', { face: 'pout', act: 'nod' }],
  ], then: '1-2' },
  // 1-2 Scene B (the house front, lines 10–31): the gang gathers in order — Nga Zwe → May Thu + Cho Cho → Phoe Kyaw — and Cho Cho leads off
  '1-2': { when: 'day', lines: [
    [null, null, { cue: 'ngazwe' }],
    ['ngazwe', '{name}! ဒီနှစ် လမ်းထိပ်မှာ မဏ္ဍပ် မရှိဘူးတဲ့။'],
    ['hero', 'ဟုတ်တယ် အမေ ပြောလို့ သိပြီးပြီ။'],
    ['ngazwe', 'ဘာဆက်လုပ်ကြမလဲ', { act: 'scratch' }],
    ['hero', 'တို့ကောင်တွေ လာမှ တိုင်ပင်ကြမယ်။'],
    [null, null, { cue: 'maythuchocho' }],
    ['ngazwe', 'မေသူ နင် သိပြီးပြီလား။'],
    ['maythu', 'သိပြီးပါပြီ။'],
    ['ngazwe', 'ချိုချိုရော သိပြီးပြီလား။'],
    ['maythu', 'ဒီရပ်ကွက်ထဲမှာ သူ မသိတာ ဘာရှိလို့လဲ၊ ငါ့တောင် သူ ပြောပြတာ။'],
    ['chocho', 'ဟီးဟီး!', { face: 'sly' }],
    [null, null, { cue: 'bike' }],
    ['phoekyaw', 'ဘာတွေ ပြောနေကြတာလဲ၊ ငါ နောက်ကျသွားတယ်၊ အန်တီစိန် ရေမှာထားလို့ ဝင်ပို့နေတာ။ လမ်းထိပ်က မဏ္ဍပ် ဆောက်တာ သွားကြည့်ရအောင်။'],
    ['maythu', 'သူ မသိသေးဘူး။'],
    ['phoekyaw', 'ဘာလဲ! ဘာဖြစ်လို့လဲ!', { face: 'shock' }],
    ['maythu', 'ချိုချို ပြောပြလိုက်။'],
    ['chocho', 'လမ်းထိပ်က မဏ္ဍပ် မဆောက်တော့ဘူးတဲ့။ ဆရာကြီးတို့ ဒီနှစ် သင်္ကြန် အေးအေးဆေးဆေး နားချင်လို့တဲ့။ ကြီးမေ ပြောတာ ကြားခဲ့တာ။'],
    ['phoekyaw', 'ဟုတ်လား။ ဒါဆို ဘာလုပ်ကြမှာလဲ။'],
    ['hero', 'လမ်းထိပ်က မဏ္ဍပ် မရှိတော့လည်း ဘာဖြစ်၊ ငါတို့ ဘာသာ ငါတို့ ဆောက်မယ်။'],
    [null, null, { cue: 'goal' }],
    ['phoekyaw', 'အေး ကောင်းတယ်။'],
    ['ngazwe', 'ဘာပစ္စည်း ရှိလို့ ဘာနဲ့ ဆောက်မှာလဲ။'],
    ['hero', 'လိုက်ရှာမှာပေါ့။'],
    ['ngazwe', 'လိုက်ရှာရအောင် ဘယ်သူ့ဆီမှာ ဘာရှိလဲ မင်း သိလို့လား။'],
    ['maythu', 'အဲ့ဒါတော့ ငါတို့ ချိုချိုကို မေး။ ရပ်ကွက်ထဲ အပ်ကျတာ သူ အကုန်သိတယ်။'],
    ['chocho', 'ဘာလိုချင်လဲ လာ လိုက်ခဲ့။'],
    [null, null, { cue: 'leave' }],
  ], then: 'wip' },
  // wip: the stop after line 31 (a 「ဆက်ရန်」 card, main.js) — T5b-2 carries on from here
  wip: { when: 'day', lines: [], then: 'done' },
  // 1-3 M1 the cloth · 1-4 M2 the speaker · 1-5 M3 the lights — played in the ward (main.js); these are their lines
  '1-3': { when: 'day', lines: [], then: '1-4' },
  '1-4': { when: 'day', lines: [
    ['chocho', 'ရွှေဝါက ငါးခြောက် ကြိုက်တယ်', { face: 'sly' }],
  ], then: '1-5' },
  '1-5': { when: 'day', lines: [], beats: {
    wet: [['kozaw', 'ရေနဲ့ မီး မရောရ', { face: 'mad' }]],
  }, then: '1-6' },
  // 1-6 five o'clock: the mandat's first look; Saya Gyi's whistle; Bwa Bwa sets the bowl down
  '1-6': { when: 'five', lines: [
    [null, null, { cue: 'lift' }],
    [null, null, { cue: 'whistle' }],
    ['sayagyi', 'ဟွန်း… မဆိုးဘူး', { act: 'loop:handsback' }],
    [null, null, { cue: 'bowl' }],
    ['bwabwa', 'ဒီမှာ တင်ထား၊ မကိုင်နဲ့'],
    [null, null, { cue: 'home' }],
  ], then: '1-7' },
  // 1-7 the bowl goes (the story starts): the dare → the throw (main.js) → the 「ဒင်း」 → the promise
  '1-7': { when: 'five', lines: [
    ['ngazwe', 'ဒီဖလားနဲ့ ရေခပ်ပက်ရင် ဘယ်လောက် ဝေးမလဲ'],
    ['maythu', 'မကိုင်ရဘူး ပြောထားတာ'],
    ['ngazwe', 'တစ်ချက်တည်း'],
    ['phoekyaw', 'ရတယ် ရတယ်', { act: 'shrug' }],
  ], beats: {
    after: [
      [null, null, { cue: 'ding' }],
      ['kid4', 'ဟေး ဘာကျလာတာလဲ', { voice: true }],
      [null, null, { cue: 'back' }],
      ['mom', '{name}! ၅ နာရီ!', { voice: true }],
      ['maythu', 'ဖလား ၁ — ဘွားဘွားကို အကြွေး', { act: 'note' }],
      ['ngazwe', 'ဘယ်သူမှ မပြောရ။ မနက်ဖြန် ငါတို့ ကိုယ်တိုင် ပြန်ယူမယ်', { face: 'lie' }],
      ['chocho', 'ချိုချို မပြောဘူး', { cue: 'pinky' }],
      [null, null, { cue: 'goal' }],
    ],
  }, then: '1-8' },
  // 1-8 night, at home: Bwa Bwa's question → two choices (either way she only says 「အင်း」) → sleep → day 2
  '1-8': { when: 'night', where: 'home', lines: [
    ['bwabwa', 'ဖလား မဏ္ဍပ်ပေါ် ရှိတယ်နော်'],
    [null, null, { cue: 'choice' }],
    ['bwabwa', 'အင်း'],
    [null, null, { cue: 'ears' }],
    [null, null, { cue: 'sleep' }],
  ], then: 'done' },
  // stepping out of today's range: Mum's voice (day.js walks you back)
  out: { lines: [['mom', '{name}!', { voice: true }]] },
};
// 1-8's two answers (hud.menu); the one that gives the red ears (TASKS T5 §1: 「…」 → red ears)
export const NIGHT = [['yes', 'ရှိတယ်'], ['dots', '…']]; // either answer: the ears go red (SCENARIO §3 1-8 — Fable review)

// how long a line holds before it moves on by itself (s): the time it takes to type (hud.js TYPE = 28 clusters/s) plus a reading
// pause of max(1.6, clusters × .06), never more than 8 s — no line leaves before it is typed and readable (a tap still skips)
export const hold = text => { const n = clusters(text).length; return Math.min(8, n / 28 + Math.max(1.6, n * .06)); };
export const budget = (id, beat) => { const sc = SCENES[id], ls = (beat ? sc.beats[beat] : sc.lines) ?? []; return ls.reduce((s, [, t]) => s + (t ? hold(t) : 0), 0); }; // reading time only (cues add their own)

const EMOTE = { shock: 'bang', joy: 'heart', worry: 'drop', lie: 'dots', sly: 'dots', mad: 'bang', pout: 'dots', wet: 'drop', cry: 'drop' };

// who(id) → { g, ch, anim, act? } or null · cue(name, sceneId) → Promise | void · name() → {နာမည်} · fast() → tests skip the reading time
export function createStory({ W, hud, who, cue = () => {}, name = () => '', son = () => 'သား', fast = () => false }) {
  let playing = null, lineT = 0, lineN = 0;
  W.tick(dt => { if (playing && hud.talking() && (lineT -= dt) <= 0) { lineT = 1e9; hud.next(); } }); // a line that has been read moves on
  const fill = t => t.replaceAll('{name}', name()).replaceAll('{son}', son());
  function face(p, f) {
    if (!f || !p) return;
    if (p.anim.face) return p.anim.face(f, 2);
    if (EMOTE[f]) p.anim.emote(EMOTE[f], 2);
    if (f === 'lie' && p.ch.blushEars) { p.ch.blushEars(true); setTimeout(() => p.ch.blushEars(false), 4000); } // Nga Zwe's ears give him away
  }
  async function run(id, lines) {
    hud.cinematic(true);
    for (const [k, text, o = {}] of lines) {
      if (o.cue) await cue(o.cue, id);
      if (!text) continue;
      const p = k && who(k);
      if (p && !o.voice && p !== W.player) { W.talkWith = p; p.g.rotation.y = Math.atan2(W.player.g.position.x - p.g.position.x, W.player.g.position.z - p.g.position.z); }
      if (p && o.act) p.act ? p.act(o.act) : p.anim.play(o.act);
      face(p, o.face);
      lineT = fast() ? .3 : hold(fill(text)); lineN++;
      await hud.say([[fill(NAMES[k] ?? ''), fill(text), { ...o, who: k }]]); // T10: the line's options + the cast id reach the talk director (hud.onLine)
    }
    W.talkWith = null; hud.cinematic(false);
  }
  // play a scene's opening lines, or one of its beats
  async function play(id, beat) {
    const sc = SCENES[id]; if (!sc) return;
    const lines = beat ? sc.beats?.[beat] : sc.lines; if (!lines?.length) return;
    const t0 = W.time(); playing = id + (beat ? ':' + beat : '');
    try { await run(id, lines); } finally { playing = null; }
    return W.time() - t0;
  }
  return { play, get playing() { return playing; }, lines: () => lineN, SCENES };
}
