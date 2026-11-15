# T5b-1 plan — day 1 up to line 31 (Prologue, Scene A, Scene B, wip stop)

Spec: docs/TASKS.md § T5b-1. Branch `claude/day1b`. Plan only; no code yet.

## Files
- New: `docs/day1b/check.cjs` (+ screenshots), this plan.
- Edited: `yangon/story.js` (new scenes `pro`, `1-1`, `1-2`, `wip`; `{son}` token; new `hold`), `yangon/day.js` (`STEPS[1]`, `PHASE_OF`, `BEFORE`), `yangon/save.js` (`v` 61, `S.girl`), `yangon/main.js` (stage / cues / flow / SPOTS / debug hooks), `yangon/set.js` (bench prop), `cast.js` (kit option), `yangon/hud.js` only if the card needs a second button (see Q5), `yangon.html` (wip card button), sw.js.
- Old T5 scenes 1-3 … 1-8 stay in `SCENES` / `CUES` / `stage()` untouched and unreachable. The old `1-1` / `1-2` entries are replaced (same ids), so the old 1-2 cues (`bike`, `maythu`, `peek`, `weapons`, `ball`) are kept only where reused.

## Staging and cues
All lines are pasted from the SCENARIO.md table by a one-off script into story.js (never retyped); the check re-parses SCENARIO.md and diffs.
- `pro` (new, no lines, ~15 s, tap skips): `stage('pro')` puts the hero outside at HOME_OUT but hidden/frozen, `day.phase('morning')`, Bwa Bwa at the bench, bowl on the bench, camera `W.orbit.focus` on the house front, title 「သင်္ကြန်ပွဲ」 via `day.title`-style overlay. Cue `polishBowl`: Bwa Bwa plays the T5 polish motion (currently only an emote in CUES.polish — I will look for a real motion; Q2), sets it down, walks to the door (`walk`), hides; `hud.fade`, then `advance('1-1'); stage('1-1')`; the 「ရက် ၁」 card shows after the cut (this also fixes the title overlapping Mum's first line).
- `1-1` (lines 1–9): stage as today inside the home (hero on the mat, Mum, Bwa Bwa on the chair) but the bowl is on the bench, not in her lap (stage()'s bowl branch changes: `1-1`/`1-2` leave it on the bench seat). Faces per the acting column: 2 `sly` + Mum `hips` act, 3 `worry`, 7 `pout`, 9 `pout` then `nod`. The T10 director cuts per speaker (all speakers are cast ids, so no `voice`). After line 9: `tutorial()` as now, door E 「အပြင် ထွက်」.
- `1-2` (lines 10–31): `goOut()` for `1-1` now does `advance('1-2'); stage('1-2')` and immediately `scene12()` (no `ngazwe` auto spot). Stage hides all four kids, bench + bowl in view. Cues are `[null,null,{cue}]` rows before lines 10, 14, 19: `ngazwe` (run in from the lane, empty-handed, then splash show), `maythuchocho` (both walk up together; each shows once: May Thu `lob` into the lane, Cho Cho `squirt`), `bike` (existing bike cue, then `ring`, then bucket `splash`). Splash shows are short and non-hitting (just the anims, no fx/damage). Acts: 12 `scratch`, 18 `sly`, 21 `shock`. Goal 「ငါတို့ ဘာသာ ငါတို့ ဆောက်မယ်」 as a cue after line 25 (new `GOALS['1-2']`). After 31: Chocho `point`, walk off along the lane, the gang follows ~3 s later, then `advance('wip'); stage('wip')`.
- `wip`: stage = free roam, gang standing at the house front, bowl on the bench, `day.card('ဆက်ရန်…', 'ရက် ၁ ရဲ့ …')`. A reload at `wip` re-shows the card; the second button closes it.

## Kit toggle (cast.js)
`makeCast(id, emit, { kit } = {})`. Default (no option) = today's build, so cast.html, camlab, carry-lab, and day 2+ are unchanged. (war.html does not use makeCast.) With `kit: 'day1'` the CAST entry's `build` is replaced by a table of day-1 builders: hero `opts.tools = ['bucket']` (the bucket is a chibi.js tool, no cast.js prop), ngazwe none (keeps `blushEars`), maythu `showerCap + notebook + balloonBag`, chocho existing `prop:'gun'` + scar/wall, phoekyaw `snack + bikeBell` with bucket in hand and no `pumpOnBack`. The `act('loop:shoulder'/'sulk')` code already guards `if (ch.pump)`. Hero/Chocho gun and bucket shown via `ch.tools`/`setTool`; main.js `person()` passes `{ kit: 'day1' }` while `S.day === 1`. Cast.js `?v=` bumped 13 -> 14 in main.js, carry-lab.html, cast.html, camlab.js.

## Reading time, save, flags
- `hold(text) = typingTime + max(1.6, chars × .05)` capped at 8 s, where typingTime = clusters / 28 (hud.js `TYPE`). Applies to all scenes (old ones included; they are unreachable). Needs a cluster counter: hud.js uses `Intl.Segmenter`-like clustering internally (`typeIn` `ends`); story.js will use `[...new Intl.Segmenter().segment(text)].length` unless hud exposes one (Q3). `lineT` starts when the line opens, as now; a tap still skips.
- Save: `fresh().v = 61`, load accepts only `v === 61`, KEY stays `thingyan.v6`; `S.girl: false`, `?girl` sets it (and persists). `{son}` replaced in `fill()` only on lines 1 and 5 (others have no 「သား」 hero-self reference; Q1).
- day.js: `STEPS[1] = ['pro','1-1','1-2','wip']`, `PHASE_OF` pro/1-1 morning, 1-2/wip day, `BEFORE` entries for pro/wip. `title()` text for day 1 unchanged.
- Version strings (importer chain): story.js, day.js, save.js, set.js, cast.js each +1 in main.js; main.js 32 -> 33 in boot.js; boot.js 33 -> 34 in yangon.html; sw.js `VERSION` y21 -> y22. If hud.js changes it is bumped the same way.

## Check script (`docs/day1b/check.cjs`, style of docs/talk and docs/day1; `?debug&dt=0.1`, port 8793)
Asserts: (1) 31 lines from `hud.onLine`, in order, text + speaker equal to the SCENARIO.md tables parsed at run time (with `{son}`/`{နာမည်}` substituted); (2) arrival order via first-visible timestamps: Nga Zwe, then May Thu + Cho Cho, then Phoe Kyaw, each `g.visible === false` before its cue; (3) no mesh named/flagged pump/can visible on any cast member (`ch.pump` null or hidden, no jerry-can mesh), hero `ch.tools` = bucket, Nga Zwe's hands empty, kit table per kid; (4) bowl `visible` and parented on the bench in pro, at 1-1 exit, in 1-2, at wip; Bwa Bwa inside during 1-1 (`inside() === 'home'`, her position in the home room); (5) Scene A ≤ 60 s and Scene B ≤ 100 s of game time with `fast` off (headless runs ~1–2 fps, so game time is used, as the other checks do); (6) `?girl` → lines 1 and 5 contain 「သမီး」; (7) `?day=1&step=1-2` and reload at 1-2 and at wip work, wip card visible after reload; (8) console errors 0.
Screenshots in `docs/day1b/`: pro, 1-1 ×3, 1-2 ×4, wip, phone 375×667.

## Open questions
1. `[သား/သမီး]` — only line 1 and 5 contain 「သား」 in SCENARIO; line 7/others are neutral. Confirm the token goes on exactly those two (the spec says so; I will assert no other line differs).
2. The polish motion: TASKS says "reuse T5's `polish` cue motion" but `CUES.polish` is only a heart emote, and no `polish` act exists in cast.js. May I add a small cast.js loop/one-shot (arm rub, sitting at the bench) for Bwa Bwa, or use `emote` + a short `note`-like gesture? chibi.js is off limits.
3. `hold` chars: Burmese string length counts code points (stacked syllables inflate it). Use code points (as the spec says "chars") or grapheme clusters? I plan code points for the .05 part and clusters/28 for typing.
4. Hero tool: chibi `tools: ['bucket']` is an opts field, but `main.js` `setTool(S.ball ? S.tool : 'bucket')` and swap (R) assume a balloon after 1-2's `ball` cue. The old `ball` cue is not in the new 1-2, so `S.ball` stays false in T5b-1 (no balloon for the hero). OK?
5. wip card: hud/`yangon.html` `#end` has one button (`#eagain`). I will add a second button in yangon.html + main.js; confirm that is allowed (hud.js untouched).
6. `1-2` kid cues: Nga Zwe's "arrival from the lane" start point (west lane head, `GATHER` side) and the walk-off direction for Cho Cho (spec: "down the lane") — I assume the west/lane axis used by the old `bike`/`maythu` cues.
7. Mum's `hips` and Nga Zwe's `scratch` exist in `GESTURES` (cast.js line ~178). Mum `mom0` has no `act` — gestures go through `anim.play`; confirm the director's gesture path is what is wanted rather than `act`.

## Decisions from the plan review (binding)
`{son}` on lines 1 and 5 only · a pose-only `polish` one-shot in cast.js (played twice) · `hold` = clusters / 28 + max(1.6, clusters × .06), cap 8 s · hero = bucket only (`S.ball` stays false, R does nothing) · a second wip button · arrivals from the west along the home lane, stopping in a loose arc 2–2.5 m in front of the hero · gestures through the line's `act` · the bowl sits on a carry target (`bench`, `bowl.at = bench`, no E label yet) · no 「ရက် ၂」 card.

## Results (T5b-1)
`node docs/day1b/check.cjs` (python3 -m http.server 8797, `?debug&dt=0.2`): **ALL PASS, console errors 0**.
- 31 lines shown, verbatim and with the right speaker, in order (SCENARIO.md parsed at run time); `?girl` → lines 1 and 5 say 「သမီး」 / 「သမီးတို့」, the other seven lines unchanged.
- Game time at reading pace: Prologue 11.2 s (tap skips it: 1-1 at 1.6 s) · Scene A 28.0 s (budget 60) · Scene B 86.6 s (budget 100; it includes the three arrivals, Phoe Kyaw's bike run and Cho Cho leading off).
- Arrivals: Nga Zwe at 42.9 → May Thu + Cho Cho together at 54.1 → Phoe Kyaw at 75.8 (game s); each hidden until its cue (checked at lines 10, 13, 15, 19).
- Kit: no pump or jerry can mesh on anyone; hero `tools ['bucket']`; Nga Zwe empty; May Thu balloon bag; Cho Cho the small gun; Phoe Kyaw bucket in hand + two on the bike's rack. Gestures really play (mom `hips`, hero `nod`, Nga Zwe `scratch`, Cho Cho `point`); arrival shows (`lob`, `squirt`, `splash` + `ring`) play, Nga Zwe shows nothing.
- Bowl: on the bench (world position within 5 cm of the bench socket, `bowl.at === bench`) at pro and at all 31 lines and at wip, also after a reload; Bwa Bwa is inside the house during 1-1.
- `?day=1&step=1-2` plays 10–31 then wip; a reload mid-1-2 restarts Scene B; a reload at wip shows the card again; `?day=1&step=1-3` is ignored (the save stays at `pro`). cast.html, war.html, camlab.html, carry-lab.html load with console 0.
- Screenshots in `docs/day1b/`: `pro`, `1-1-mum`, `1-1-hero`, `1-1-bwabwa`, `1-2-ngazwe`, `1-2-maythu-chocho`, `1-2-phoekyaw`, `1-2-gang` (the check swings the camera wide for this one so bench + bowl + the arc of kids show), `wip`, `phone-wip-375`, `phone-1-2-375`.
- Version strings: cast.js 14 (main, cast.html, camlab.js, carry-lab.html, war.js; camlab.html 6, war.html 17) · set.js 23 (main, day, life, downtown, docs/talk/check.cjs) · save.js 10 · story.js 4 · day.js 5 · life.js 21 · downtown.js 19 · main.js 33 · boot.js 34 · sw.js y22. chibi / world / camera / talk / hud untouched.

### Honest notes
- **wip gang position differs from the spec.** After Cho Cho leads off, the gang ends west on the home lane (`WIP` spots, 6–8 m from the door, bike parked at the lane corner) and the wip card appears there; a reload at wip puts them on the same spots, not at the house front. Walking them off and then back looked worse than waiting where they walked to. One-line change if you want them at the front (`WIP` in main.js).
- Mum stays outside at her T5 spot (`MUM_DAY`, just east of the bench) during Scene B. Silent.
- Squirt/lob/splash shows are anims plus a short jet (Cho Cho) and one balloon lobbed into the empty lot (May Thu); Phoe Kyaw's bucket splash is the animation only (no water fx).
- Faces use T5's emote bubbles (`sly` `worry` `pout` `shock`; `ok` has no bubble — line 9 is `pout` + the `nod` gesture); real faces wait for T6.5.
- The pro frame is not director-driven (focus on the bench, the title moved up so the bowl stays visible). Bwa Bwa stands at the bench's left end turned in, because from the lane she hid the bowl when she stood in front.
- The T5 check scripts `docs/day1/check.cjs` and `docs/talk/check.cjs` still describe T5's day-1 flow (1-1 → 1-8 / `step=1-3`) and are stale until T5b-2; the one edit I made there is the `set.js?v=` string in the talk check.
- Not touched: TASKS.md, SCENARIO.md; T5's scenes 1-3 … 1-8, their cues, spots and stage branches are still in main.js, unreachable.
