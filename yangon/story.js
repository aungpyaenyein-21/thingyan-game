// yangon/story.js — the scenes as data (SCENARIO v6 §3, day 1: 1-1 … 1-8) and the little runner that plays them.
// A scene: { id, when, where, lines: [[who, text, { face, act, cue, voice }]], beats: { name: lines }, then }.
//   who   — a cast id (who() in main.js turns it into a person) · null for a line that is only a cue
//   text  — the line, word for word from SCENARIO.md (never paraphrased); {name} = the player's name
//   face  — CHARACTERS §14 expression; until anim.face exists (T6.5) it shows as an emote bubble (+ red ears for 'lie')
//   act   — the speaker's own tic (cast.js acts: 'note', 'shrug', 'whistle', 'loop:peek' …) or a chibi one-shot
//   cue   — something main.js does before the line (someone arrives, the mandat goes up, a choice …); awaited
//   voice — heard, not seen (off screen): the camera stays where it is
// beats: lines a mission plays in the middle (1-5 the water on the lights, 1-7 after the throw). then: the next scene.
// No scene runs over 30 s: each line holds for a reading time and then moves on by itself (a tap moves it on sooner).

// who → the name over the line (CHARACTERS: kids say 「ငါ/မင်း」, Cho Cho her own name — that's in the text)
export const NAMES = { hero: '{name}', mom: 'အမေ', bwabwa: 'ဘွားဘွား', ngazwe: 'ငဇွဲ', maythu: 'မေသူ', phoekyaw: 'ဖိုးကျော်', chocho: 'ချိုချို',
  sayagyi: 'ဆရာကြီး', kozaw: 'ကိုဇော်', kid4: '④ ကလေး' };

// SCENARIO §0: the goal line, at 1-2 and 1-7
export const GOALS = { '1-2': 'ဂိုဏ်း စု — မဏ္ဍပ် ဆောက်မယ်', '1-7': 'ဖလား… ဘယ်သူမှ မပြောရ' };

export const SCENES = {
  // 1-1 wake (indoors): Mum's rule for the day; Bwa Bwa polishing the bowl (a plant); then walk / run / jump
  '1-1': { when: 'morning', where: 'home', lines: [
    [null, null, { cue: 'polish' }],
    ['mom', 'ဒီနေ့ လမ်းထဲကပဲ။ ၅ နာရီ အိမ်ပြန်', { act: 'scold' }],
  ], then: '1-2' },
  // 1-2 the gang gathers, in order: Nga Zwe at the lane head → Phoe Kyaw on the bike with two buckets → May Thu → Cho Cho peeking
  '1-2': { when: 'day', lines: [
    ['ngazwe', 'နောက်ကျတယ်', { act: 'loop:shoulder' }],
    [null, null, { cue: 'bike' }],
    [null, null, { cue: 'maythu' }],
    ['maythu', 'မဏ္ဍပ် ငါ စီမံမယ်', { act: 'note' }],
    [null, null, { cue: 'peek' }],
    ['chocho', 'ချိုချို သိတယ်၊ ဆရာကြီးက မဏ္ဍပ် ဆောက်ခွင့် ပေးထားတာ', { face: 'sly' }],
    [null, null, { cue: 'goal' }],
    [null, null, { cue: 'weapons' }],
    ['maythu', 'မင်း ပစ်တာ ကောင်းတယ်၊ ပူဖောင်း ယူ', { cue: 'ball' }],
  ], then: '1-3' },
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

// how long a line holds before it moves on by itself (s): enough to read it, never so long a scene passes 30 s
export const hold = text => Math.min(4.5, Math.max(2.4, 1.2 + text.length * .07));
export const budget = (id, beat) => { const sc = SCENES[id], ls = (beat ? sc.beats[beat] : sc.lines) ?? []; return ls.reduce((s, [, t]) => s + (t ? hold(t) : 0), 0); }; // reading time only (cues add their own)

const EMOTE = { shock: 'bang', joy: 'heart', worry: 'drop', lie: 'dots', sly: 'dots', mad: 'bang', pout: 'dots', wet: 'drop', cry: 'drop' };

// who(id) → { g, ch, anim, act? } or null · cue(name, sceneId) → Promise | void · name() → {နာမည်} · fast() → tests skip the reading time
export function createStory({ W, hud, who, cue = () => {}, name = () => '', fast = () => false }) {
  let playing = null, lineT = 0, lineN = 0;
  W.tick(dt => { if (playing && hud.talking() && (lineT -= dt) <= 0) { lineT = 1e9; hud.next(); } }); // a line that has been read moves on
  const fill = t => t.replaceAll('{name}', name());
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
      lineT = fast() ? .3 : hold(text); lineN++;
      await hud.say([[fill(NAMES[k] ?? ''), fill(text)]]);
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
