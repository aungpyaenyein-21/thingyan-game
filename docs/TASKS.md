# သင်္ကြန်ပွဲ · Task စာရင်း

> **အခန်းကဏ္ဍ** — ဒီဇိုင်း/အတည်ပြု/review = Fable (ဒီစာ ရေးသူ)။ **ဆောက်တာ = အခြား model session**။ Task တစ်ခု ပြီးရင် အခြေအနေ ပြောင်းပြီး Fable က review လုပ်။
> ဒီဇိုင်းစာ: [DIRECTION.md](../DIRECTION.md) · [SCENARIO.md](../SCENARIO.md) (v6 ငွေဖလား — ပုံသေ) · [CHARACTERS.md](../CHARACTERS.md)
> အခြေအနေ: ⏳ မစသေး · 🔨 ဆောက်နေ · 👀 review စောင့် · ✅ ပြီး
> **Language (creator, 2026-10-31):** model-to-model text — task specs here, `docs/plans/*`, PR descriptions, review comments — is written in **English** from now on (saves tokens). Specs already written in Burmese (T2/T3/T5) stay as they are. Docs the creator reads (DIRECTION, SCENARIO, CHARACTERS, PALETTE, CAMERA) stay Burmese; chat with the creator stays Burmese.
> **ပင်မ မူ (ဖန်တီးသူ 2026-10-31): ဒီဂိမ်းရဲ့ အဓိကက ရေပက်တာ။** Mission တိုင်း၊ scene တိုင်း ရေပက်တာ ပါရမယ် — ရေ မပါတဲ့ mission မထည့်ရ (SCENARIO M1 ပုံးဆွဲ၊ M2 ကြောင်ချော့ ကို ရေပါအောင် ပြင်ရန် 💭)။ Library/feature ရွေးရင် 「ရေပက်ခံစားမှု ပိုကောင်းလား」 ကို အရင် မေး။
> **Branch စည်းကမ်း** — `main` ကို တိုက်ရိုက် မရေး။ Task တစ်ခု = branch တစ်ခု `claude/<task>` (T1 = `claude/camlab`)၊ worktree သီးသန့်။ ပြီးရင် PR ဖွင့် → Fable review → ပြင်စရာ ရှိရင် အဲဒီ branch မှာပဲ ပြင် → OK မှ `main` ထဲ merge (squash) — **ပြဿနာ မရှိရင် Fable ကိုယ်တိုင် merge လုပ်လို့ရ** (ဖန်တီးသူ ခွင့်ပြုချက် 2026-10-31)။ Push: `gh auth switch --user aungpyaenyein-21` → push → `gh auth switch --user Aung-Pyae-Nyein`။ Pages က `main` ကနေ ထွက်လို့ merge မှ live ဖြစ်မယ်။

| # | task | အခြေအနေ | ဘယ်သူ |
|---|---|---|---|
| T1 | [camlab — Go-Go Town! ပုံစံ ကင်မရာ + library ၃ ခု prototype](#t1-camlab) | ✅ 2026-10-31 (PR #28) | အခြား model |
| T2 | [ဂိမ်းအစစ် ကင်မရာ ပြောင်း + PALETTE](#t2-ဂိမ်းအစစ်-ကင်မရာ-ပြောင်း--palette) — `camera.js` / `sky.js` / `palette.js`၊ အဆောက်အအုံ ၄ ဘက်၊ hero glTF ၃၊ font self-host | ✅ 2026-11-01 (PR #30) | အခြား model |
| T3 | [**ရေပက် core loop**](#t3-ရေပက်-core-loop) — weapons ×3, ammo, hit feel, fx (three.quarks), rules.js, Yuka AI, orbit | ✅ 2026-11-01 (PR #31) | other model |
| T3b | [ရက် ၄ vertical slice](#t3b-ရက်-၄-vertical-slice-t2--t3-ပြီးမှ) — ၅v၅ → ဖလား ချောင်းထဲ (script) → အတူ ဆယ် → ၅ နာရီ ပြေး → ရေသွန်း | ⏳ (T2+T3 ပြီးမှ spec) | — |
| T4 | [ကောက်-သယ်-ချ system](#t4-ကောက်-သယ်-ချ-system) (လက်/ရင်ဘတ်/ခေါင်းပေါ်/စက်ဘီးနောက်၊ ရေခဲ timer၊ ပက်ခံရရင် ကျ) · arm IK | ✅ 2026-10-31 (PR #29) | အခြား model |
| T5 | [ရက် ၁ + ရက်စဉ် system](#t5-ရက်-၁--ရက်စဉ်-system) — `day.js` / `mandat.js` / `story.js`၊ ၁-၁ → ၁-၈ အစအဆုံး ကစားလို့ရ၊ M1–M3 ရေပါ၊ ၁-၇ ဖလား ပစ်လွတ် | ⏳ spec ✅ (T2 merge ပြီးမှ စ) | အခြား model · branch `claude/day1` |
| T6 | [Day 2 + Day 3](#t6-day-2--day-3) — ④ lane, M4 drain / M5 lane 4 / M6 laundry / M7 ice run, Thura's bowl helmet, Phoe Wa, U Tin Maung's ice truck | ⏳ spec ✅ (after T5 + T3 merge) | other model · branch `claude/day23` |
| T6.5 | **Pose/tic editor + face editor** — `cast.html` ပေါ် ထပ်ဆောက်: pivot ထောင့် slider၊ keyframe → JSON၊ chibi.js က JSON tic ဖတ် · **face**: expression = data ၄ ပိုင်း (eyes/brows/mouth/extra)၊ 🆕 part ၁၄ ခု ဆွဲ၊ `FACE` table ၁၀ ခု၊ `anim.face(name, sec)`၊ blink-cut — spec [CHARACTERS §၁၄](../CHARACTERS.md#၁၄-မျက်နှာ-expression-v12--2026-10-31)။ Blender/Mixamo မသုံး | ⏳ | — |
| T7 | ဇာတ်ကောင် အကျင့် ဂိမ်းထဲ (CHARACTERS §၁၃) + Prologue/နိဂုံး — T6.5 editor နဲ့ ချိန် | ⏳ | — |
| T8 | [Swim goggles = grit vs face hits](#t8-swim-goggles-issue-33) — issue #33 · war.js side now, the stall in T6 | ⏳ spec ✅ — start now | other model · branch `claude/goggles` |
| T9 | [Kids move quick and nimble](#t9-kids-move-quick-and-nimble-issue-34) — issue #34 · chibi.js gait + jog loop + snappy world.js movement | ⏳ spec ✅ — start now (∥ T8) | other model · branch `claude/speed` |
| T10 | [Talk director](#t10-talk-director-issue-35) — issue #35 · camera cuts to the speaker, mouth + gesture + listener, `{ face, act, shot }` line data | ⏳ spec ✅ (after T5 + T9 merge) | other model · branch `claude/talk` |
| T11 | [Home rally](#t11-home-rally-issue-36) — issue #36 · the ward's grown-ups rain balloons on the visitors once a round | ⏳ spec ✅ (after T8 merge — same war.js) | other model · branch `claude/rally` |

အစဉ်: T1 ✅ → T4 ✅ → T2 ✅ → T3 ✅ → **now: T5 (coding) ∥ T8 ∥ T9** → T11 (after T8) · T10 (after T5 + T9) → T6 → T3b → T6.5 → T7။ Files: T8/T11 = war.js/ai.js/rules.js (serial) · T9 = chibi.js LOOPS + world.js player move · T10 = camera.js/hud.js/cast.js/chibi.js mouth (after T9) · T5 = yangon/* story. Library ဆုံးဖြတ်ချက် (2026-10-31): Yuka ✅ · CCDIKSolver ✅ · GSAP ✕ · Mixamo/VRoid/Cascadeur ✕ (chibi ပုံစံ ပျက်) · KayKit/Kenney/Quaternius CC0 pack = အဆောက်အအုံ/ကား/ပစ္စည်း အတွက်ပဲ (T2)၊ ဇာတ်ကောင် ✕။ · **lil-gui** ✅ (three addons — `?tune` param နဲ့ပဲ ပေါ်၊ ချိန်ပြီး JSON သိမ်း: T2 ကင်မရာ lag/elevation၊ T3 hit-stop/လက်နက် ဂဏန်း) · **Noto Sans Myanmar woff2 self-host** ✅ (`fonts/` — Android/Windows မှာ ဗမာစာ ပျက်မှာ ကာကွယ်၊ sw.js cache ထဲ ထည့် — T2 မှာ ဂိမ်းအစစ်ထဲ) · **three `PositionalAudio`** ✅ (ကင်မရာ လှည့်ရင် အသံ ဘက် — T3 ရေပက်သံ၊ sound.js ပေါ် ထပ်ဆင့်) · three-mesh-bvh / postprocessing = တိုင်းပြီး နှေးမှ · ink/Yarn/nipplejs/Howler/theatre.js ✕။ Spec ကို အရှေ့ task ရဲ့ review ပြီးမှ ရေး (ရလဒ်ပေါ် မူတည်လို့)။

## T2 ဂိမ်းအစစ် ကင်မရာ ပြောင်း + PALETTE

**ရည်ရွယ်ချက်** — T1 camlab မှာ အလုပ်လုပ်ပြီးသား ကင်မရာကို **ဂိမ်းအစစ်** (ရက် ၁ ရန်ကုန် ရပ်ကွက် — `yangon.html`, `world.js`, `yangon/*`) ထဲ ရွှေ့။ တစ်ခါတည်း [PALETTE.md](PALETTE.md) အရောင် ပြောင်း၊ အဆောက်အအုံ ၄ ဘက် ဖြစ်အောင်။ ဇာတ်လမ်း/mission/ကစားနည်း **မပြောင်း** — ကြည့်ပုံပဲ ပြောင်း။

**ကြိုတင်** — PR #28 (camlab) `main` ထဲ ရောက်ပြီးမှ စ။ `docs/plans/T2.md` အရင်။ Branch `claude/camera`။

**ဖိုင် ပိုင်ဆိုင်မှု (T4 နဲ့ ပြိုင်လုပ်နေလို့)** — T2 = `world.js` · `yangon/*` · `yangon.html` · 🆕 `palette.js` · 🆕 `sky.js` · `art/*` (glTF) · `camlab.js` (ပြန်သုံးဖို့ ခွဲထုတ်ရင်)။ **T2 က `chibi.js` / `cast.js` / `carry.js` မထိ** (T4 ပိုင်)။ `war.js` မထိ (T3)။

### ၁။ ကင်မရာ (camlab.js ကနေ ယူ)
- `world.js:56` OrthographicCamera + ISO ပုံသေ → PerspectiveCamera၊ camlab ရဲ့ `placeCamera` (lag၊ ၄၅° snap၊ zoom 5–24၊ elevation curve)။ ကင်မရာ code ကို `camera.js` module အဖြစ် ခွဲပြီး camlab.html ကလည်း ဒါ import — copy ၂ ခု မထားရ
- ထိန်းချုပ်မှု — `world.js:489` ကစားသူ ရွေ့တာ ကင်မရာ ဦးတည်ချက်အလိုက်။ ခလုတ် ဘယ်/ညာ လှည့် + Q/E + ဘေးတိုက် drag + pinch (HUD ထဲ ထည့် — `yangon/hud.js`)
- **ဖျော့** — camlab ရဲ့ raycast ၂ ကြောင်း ပုံစံ၊ ဒါပေမဲ့ T1 review #1: `needsUpdate` မသုံး — material တိုင်း `transparent:true` variant ကြို clone၊ fade ချိန် swap
- shadow — PCFShadowMap (Soft မဟုတ်)၊ shadow camera ကစားသူ ပတ်လည် ၁၂ m ပဲ၊ ဖုန်း pixel ratio ≤ 1.5 (`PHONE` flag ရှိပြီး)

### ၁-ခ။ Auto-zoom + ကြိုကြည့် (Go-Go Town! ပုံစံ — 2026-10-31 ထပ်ထည့်)
**ဒီဇိုင်း အပြည့်အစုံ → [CAMERA.md](CAMERA.md)** (context ၇ ခု၊ ဦးစားပေး၊ lerp နှုန်း၊ look-ahead၊ scene API၊ ဖုန်း၊ `?tune` ဂဏန်း၊ စမ်းသပ်ချက် ၈ ခု) — ကွဲလွဲရင် CAMERA.md ကို ယူ။ အောက်က ဇယားက အကျဉ်း။
ကင်မရာက follow ပဲ မဟုတ်၊ **အခြေအနေ အလိုက် ကိုယ်တိုင် zoom** — ကစားသူ ကိုင်ရတာ လှည့်တာ + zoom offset ပဲ။

| အခြေအနေ | dist (base 11) | ဘာကြောင့် |
|---|---|---|
| ရပ် / လမ်းလျှောက် | 11 | ပုံမှန် |
| ပြေး | +3 (→ 14) | ရှေ့ မြင်ရ |
| စက်ဘီး (T4 `ride`) | +5၊ elevation ပိုမြင့် | မြန်လို့ |
| ဆိုင်ထဲ / အိမ်ထဲ (rooms) | −5 (→ 6)၊ az lock | အခန်း သေး |
| NPC နဲ့ စကားပြော (hud.say ဖွင့်ချိန်) | −4၊ target = ၂ ယောက် အလယ် | မျက်နှာ မြင်ရ |
| ရေပက်စစ် (war zone ထဲ) | +2 | ပစ်မှတ် မြင်ရ |
| ဇာတ်လမ်း scene | script သတ်မှတ် (`camera.js` `lock(az)` + `focus(obj, dist)`) | ၁-၇၊ ၄-၄ |

- **ကစားသူ zoom = offset** (×.6 … ×1.6) — auto ပေါ် ထပ်ပေါင်း၊ ပြောင်းလည်း မပျောက် (ဆိုင်ထဲက ထွက်လာလည်း ကစားသူ ရွေးထားတာ ပြန်ရ)
- **ကြိုကြည့် (look-ahead)** — target ကို ရွေ့တဲ့ဘက် ၁.၂ m (ပြေးရင် ၂ m) ရွှေ့၊ lerp ၂ s — ကစားသူ screen အလယ် အောက်နည်းနည်း
- **အကုန် lerp** — dist `1−e^(−dt·2)`၊ target `1−e^(−dt·3.2)` (ရှိ) — ခုန်မသွားရ၊ ခေါင်းမမူး
- lil-gui `?tune` ထဲ ဒီ ဂဏန်း ၇ ခုလုံး
- auto-rotate (ကစားသူ့ နောက်က လိုက်လှည့်) **မထည့်** — ပုံသေ ပိတ်၊ option ပဲ

### ၂။ ကောင်းကင် (`sky.js`)
- `world.js` ရဲ့ canvas gradient + screen ပုံသေ နေ → **sky dome shader** (camlab ပုံစံ) · ဒါပေမဲ့ `setTime` (dusk 0→1→night 2) ကို **ဆက်ထောက်ပံ့** — SKY/NIGHT stop ၄ ခု ကို dome shader uniform အဖြစ် ထည့်၊ နေ ကမ္ဘာ ပုံသေ ဦးတည်ချက် + dusk အလိုက် နိမ့်/နီ · ကြယ် (night) ပါ
- `paintSky` hook (ရှိပြီး — ပိတောက်ပွင့် စတာ) ဆက်အလုပ်လုပ်ရ — မရရင် ဘာ ပျက်လဲ plan ထဲ ပြော

### ၃။ အရောင် (`palette.js`)
- `export const PAL = {...}` PALETTE.md token အကုန် — hex ကို ဖိုင်တိုင်း ပြန်မရေး
- ပြောင်းရမှာ: `world.js` floor → `sand`၊ hemisphere ground → `shade`၊ `yangon/set.js` `downtown.js` အဆောက်အအုံ → cream/mint/pink/ochre/teal ၅ ရောင်ထဲကပဲ၊ ရေ (ချောင်း၊ ရေစည်၊ ပူဖောင်း) → `water`၊ ① ဂိုဏ်းသား အင်္ကျီ `#2f8fd6` → `gang1` (world.js/life.js ထဲ ရှိတာပဲ — chibi.js မထိ)
- ရက် ၃ "ဖျော့ဆုံး" / ရက် ၄ padauk များ — **မလုပ်သေး** (T5/T6)

### ၄။ အဆောက်အအုံ ၄ ဘက်
- `yangon/set.js` code-built အဆောက်အအုံ: ဆိုင်းဘုတ်/ပြတင်း/အစွန်းအထင်း ရှေ့မျက်နှာစာ တစ်ဖက်တည်း → ၄ ဘက်လုံး (ဘေး/နောက် = ပြတင်း + ပိုက်/ရေတိုင်ကီ/လျှော်ထားတဲ့ အဝတ် — ရှေ့ထက် ရိုးရိုး)
- **hero အဆောက်အအုံ ၃ ခု glTF** (`art/building.py` ပုံစံ ထပ်ရေး): မုန့်ဟင်းခါးဆိုင် + ဟင်းရွက်ဆိုင် (ဆိုင်ချင်းကပ်)၊ `{နာမည်}` အိမ်၊ မဏ္ဍပ် (ရက် ၁ ပုံ) — ကျန်တာ code-built ပဲ
- ကင်မရာ လှည့်ရင် ဘာမှ "အပေါက်" မမြင်ရ — ၄ ထောင့် screenshot

### ၄-ခ။ ထပ်ထည့် (2026-10-31)
- `fonts/NotoSansMyanmar-*.woff2` self-host + `@font-face` (yangon.html, war.html, cast.html, camlab.html) + `sw.js` cache · lil-gui panel `?tune` — ကင်မရာ lag / elevation curve / zoom ကန့်သတ် / fade opacity ချိန်ပြီး `console` ကနေ JSON copy

### ၅။ မလုပ်ရ
- navmesh/NPC လမ်းရှာ (life.js collide ဆက်သုံး — T3) · Rapier · ဇာတ်လမ်း · `chibi.js` `cast.js` `war.js`

### ✅ ပြီးတယ် ဆိုတာ
- `yangon.html` ရက် ၁ ရပ်ကွက် — ကင်မရာ လှည့်/zoom/ဖျော့ · ၄ ထောင့် screenshot · ကောင်းကင် afternoon/dusk/night ၃ ပုံ (`setTime`)
- ရှိပြီးသား ရက် ၁ mission (ပုံးဆွဲ၊ ကြောင်ချော့၊ မီးသီး၊ ဆိုင်းဘုတ်) **ကင်မရာ အသစ်နဲ့ ဆက်ကစားလို့ရ** — တစ်ခုချင်း စမ်းပြီး မှတ်
- PALETTE: ရေ = `#3fd3e0` တစ်ခုတည်း အေး — screenshot မှာ ရေက ပေါ်လွင်
- laptop 60fps (Browser pane) · ဖုန်း ≥ 30fps (ဖန်တီးသူ Pages မှာ စစ်) · console error 0
- camlab.html က `camera.js` / `sky.js` / `palette.js` ကို import ပြောင်းပြီး ဆက်အလုပ်လုပ် (copy မကျန်)
- `docs/plans/T2.md` + PR

### ✅ Result (Fable review 2026-11-01 · PR #30 merged)
- camera.js per CAMERA.md (contexts, look-ahead, scene API, ?tune) · sky.js dome + surround · palette.js · `backs()` four sides · home / teashop / stalls .glb · Noto Sans Myanmar self-hosted · war.html stays iso until T3
- Verified in the Browser pane: 45° snaps, user zoom .6 → 6.6, talk framing (dist 7.4), afternoon/dusk/night, fonts loaded, console 0. FPS: orbit 36 · `?q=off` 61 · iso baseline 35 → camera is not a regression; the post chain is the cost (both modes)
- Review fix ffe9d1a: the white smear came from unlit ghost mandat parts (v4 flow) + bloom/blur at a low camera — now lit/faded, bloom tightened, blur fades below elevation .5
- Hand-offs: T5 drops the ghost mandat · night water droplets read as cyan cubes (dim with `night()`) · phone bloom at level 2 — measure on a phone

## T4 ကောက်-သယ်-ချ system

**ရည်ရွယ်ချက်** — SCENARIO v6 ရဲ့ mission ၇ ခုလုံး "တစ်ခုခု သယ်" (ပိုက်ဆံအိတ်၊ ဆေး၊ အဝတ်၊ ရေခဲ၊ ဖလား၊ ပူဖောင်း) ဖြစ်လို့ **တစ်ခါ ဆောက် အကုန် သုံး**တဲ့ system။ Go-Go Town! ရဲ့ ကောက်-ခေါင်းပေါ် သယ်-ချ ပုံစံ။ ကင်မရာနဲ့ မဆိုင်လို့ T1/T2 မစောင့်ဘဲ စလို့ရ။

**ဖိုင်** — `carry.js` (module: API) · `carry-lab.html` (စမ်းကွင်း) · `chibi.js` (socket + carry pose — ရှိပြီးသား animation မပျက်ရ) · `yangon/life.js` ရဲ့ စက်ဘီးကို rack ပါတဲ့ variant (ဖိုးကျော်)။ `world.js` / ဂိမ်း flow မထိ။ Branch `claude/carry`။

### ၁။ ပစ္စည်း (item) = data

```js
{ id:'ice', name:'ရေခဲတုံး', size:'head', weight:.8, melt:90, wet:true }
// size: hand (ပိုက်ဆံအိတ်၊ ခဲတံ၊ ဆေးဗူး) · front (ဖလား၊ အဝတ်ခြင်း၊ ပုံး — လက်နှစ်ဖက် ရင်ဘတ်ရှေ့) · head (ရေခဲတုံး၊ ရေပုံး — ခေါင်းပေါ် ရွက်) · bike (စက်ဘီးနောက် rack)
// weight 0..1 → ပြေးနှုန်း ×(1 − .4·weight)၊ ခုန် မရ (weight > .5)
// melt: စက္ကန့် (null = မပျော်) · wet: ရေထိရင် texture စို
```
စမ်းကွင်း item ၆ ခု: ပိုက်ဆံအိတ် (hand .1)၊ ငွေဖလား (front .3)၊ အဝတ်ခြင်း (front .5)၊ ရေပုံး (head .6, wet)၊ ရေခဲတုံး (head .8, melt 90)၊ ပူဖောင်း (hand .05 — ပစ်လို့ရ)။

### ၂။ Socket ၄ ခု (chibi.js)
`handR` (ရှိပြီး — prop က လက်ဖျံအတိုင်း ထွက်) · 🆕 `chest` (spine ရှေ့ — cast.js က notebook ကို spine မှာ ချိတ်တဲ့ နည်း ပုံသေ လုပ်) · 🆕 `head` (ခေါင်းထိပ်၊ hunch/size အလိုက်) · 🆕 `back` (ကျောပိုး — ဆီပုံး ရှိပြီး)။ Socket = Object3D pivot ပေါ် child; animation နဲ့ အတူ လိုက်။

### ၃။ လက် IK
Rig က `THREE.Skeleton` သုံးထား (chibi.js:438) → `CCDIKSolver` သုံးလို့ရ **ဒါပေမဲ့ လက် = ပခုံး-တံတောင်-လက် ၂ ဆစ်ပဲ** မို့ analytic two-bone IK (~၃၀ ကြောင်း) က ပိုရိုးရှင်း၊ ပိုတည်ငြိမ်။ Plan ထဲ ဘယ်ဟာ ရွေးလဲ ပြော။ သုံးတဲ့နေရာ: ကောက်တဲ့ .35s (လက် item ဆီ ရောက်)၊ `front` ကိုင်တုန်း လက်နှစ်ဖက် item ဘေး၊ `head` ကိုင်တုန်း လက်တစ်ဖက် ထောက်၊ ကမ်းပေးတုန်း လက် တစ်ဖက်ဆီ ဆန့်။

### ၄။ State + animation
| state | ဖြစ်ပုံ |
|---|---|
| `pickup` | item ၁ m အတွင်း → highlight ring + ခလုတ် 「ကောက်」 → ကိုယ် ကုန်း (`bow` ပုံစံ .35s)၊ item world → socket lerp၊ ပြီးရင် carry |
| `carry` | loop variant: idle/walk/run **× size ၃ မျိုး** (hand = ပုံမှန် · front = လက် ရင်ဘတ်ရှေ့၊ ကိုယ် နည်းနည်း နောက်လန် · head = လက်တစ်ဖက် ထောက်၊ ခေါင်း ငြိမ်၊ ကိုယ် ယိမ်း) · weight အလိုက် ခြေလှမ်း နှေး |
| `drop` | 「ချ」 → မြေပေါ် (ရှေ့ .5 m) · target socket ရှိရင် 「တင်」 (မဏ္ဍပ် စင်၊ စက်ဘီး rack) · ကလေး တစ်ယောက် ၁ m အတွင်း ဆို 「ပေး」 (hand-off: ၂ ယောက်လုံး လက် ဆန့်၊ item ကူး) |
| `throw` | hand/front item ပဲ: `bigthrow` (CHARACTERS §၁) → ballistic (cast.html lob လို — Rapier hook ထားပေး: `onThrow(item, vel)`) |
| `hit` | **ရေပက်ခံရရင်** `head` item ယိမ်း (wobble)၊ ၃ ချက် ထိ → ကျ (ပြန်ကောက်ရ) · `front` item ၅ ချက် · `hand` မကျ — ဒါက ရေစစ်နဲ့ သယ်တာ ချိတ်တဲ့ နေရာ (M7 ရေခဲ သယ်) |

### ၅။ ရေခဲ timer
`melt` ရှိတဲ့ item: HUD bar + mesh scale ၁ → .3 + အောက်က ရေစက် particle (three.quarks မရှိသေးရင် sphere ၃ လုံး) · ပျော်ကုန်ရင် item ပျောက် + 「ရေခဲ ကုန်ပြီ」 · အရိပ်ထဲ (building AABB အောက်) ဆို ×.5 နှေး 💭

### ၆။ ဖိုးကျော့် စက်ဘီး
life.js စက်ဘီး + 🆕 နောက် rack socket (item ၁ ခု **ဒါမှမဟုတ်** ကလေး ၁ ယောက် ထိုင် — ၄-၆) · ကစားသူ စီးလို့ရ (ခလုတ် 「စီး」 — မြန်နှုန်း ×၁.၈၊ ချိုး ကျယ်၊ ဘဲလ်) · rack item ရှိရင် ယိမ်း · ပက်ခံရရင် rack item ၃ ချက် → ကျ

### စမ်းကွင်း (`carry-lab.html`)
ကြမ်းပြင် ၂၀×၂၀ · ကစားသူ + ဖိုးကျော် (NPC၊ စက်ဘီးနဲ့) + မေသူ (hand-off target) · item ၆ ခု · မဏ္ဍပ် စင် (target socket) · ④ ကလေး ၂ ယောက် ပူဖောင်း ပစ်နေ (war.js ရဲ့ hit ကို ခေါ် — hit state စမ်းဖို့) · ခလုတ် ဗမာလို · 375px ရ။ `window.carry = { player, items, pick(id), drop(), give(), throw() }` debug hook (ship မလုပ်ခင် ဖြုတ်)။

### ✅ ပြီးတယ် ဆိုတာ
- item ၆ ခုလုံး ကောက်/သယ်/ချ/တင်/ပေး ရ၊ size ၃ မျိုး pose **ကြည့်ရုံနဲ့ ကွဲ** (screenshot ၃ ပုံ)
- ရေခဲ ၉၀ စက္ကန့် ပျော်၊ bar + scale + ကုန်ရင် ပျောက်
- ပက်ခံရရင် head item ၃ ချက် ကျ (screenshot)
- စက်ဘီး rack ပေါ် item/ကလေး တင်ပြီး စီး (screenshot)
- ရှိပြီးသား animation (cast.html tic ၂၀ ကျော်) **မပျက်** — cast.html ဖွင့် စစ်
- console error ၀၊ laptop 60fps၊ `docs/plans/T4.md` + PR

### မလုပ်ရ
`world.js` · ဂိမ်း flow · Rapier ထည့်တာ (T1 က ထည့်မယ် — hook ပဲ ထား) · ပြောမှ commit

### ✅ ရလဒ် (Fable review 2026-10-31 · PR #29 merge)
- `carry.js` (ITEMS data ၆ ခု၊ procedural mesh၊ PALETTE) · `bike.js` (rack + `seatOn`) · `carry-lab.html` · chibi.js socket ၅ ခု + `anim.load` + `anim.reach` IK (swing+twist quaternion) + one-shot `pick`/`bigthrow` · `chibi.js?v=31`
- စစ်ပြီး: pose ၃ မျိုး ကွဲ · drop/place(rack)/give(မေသူ)/throw(burst) · head item ၃ ချက် ကျ · ရေခဲ ၉၀ s · စက်ဘီး စီး · cast.html ၁၃ ယောက် regression error 0 · 60 fps · 375px
- T3 ထဲ ယူသွားတာ: war.js `hit()` → `carry.hit(k)` ၁ ကြောင်း · life.js → bike.js ပြောင်းသုံး · `hold` HUD item ကျရင် text ရှင်း · `item.shade` 💭

---

## T3 ရေပက် core loop

**ရည်ရွယ်ချက်** — ဂိမ်းရဲ့ ပင်မ = ရေပက်တာ။ `yangon/war.js` (grit / OUT / ရေအိုးစင် / ၃ ပွဲ / faceAim ရှိပြီး) ပေါ်မှာ **ပက်ရတာ လက်ထဲ ကောင်းအောင်** ချိန်၊ ပြီးမှ ဇာတ်လမ်း scene (T3b)။ ဖန်တီးသူ ကိုယ်တိုင် ၂ မိနစ် ပက်ပြီး 「ထပ်ပက်ချင်သေးလား」 ဆိုတာ ဖြေနိုင်ရမယ်။

**ကြိုတင်** — T2 (#30) merge ပြီးမှ `war.html` ကို `camera:'orbit'` ပြောင်း (လှည့်ရင်း ချိန်ပစ်)။ **T2 မပြီးခင် စလို့ရတာ**: A/B/C/D (iso ကင်မရာနဲ့ စမ်း) — ဒါပေမဲ့ `world.js`/`life.js` မထိ။ `docs/plans/T3.md` အရင်။ Branch `claude/water`။

**ဖိုင်** — T3 ပိုင် = `yangon/war.js` · `war.html` · 🆕 `fx.js` (particle/decal/wet-map) · 🆕 `rules.js` (စည်းကမ်း — T3b/T5 ပြန်သုံး) · `carry.js` (hit ချိတ် ၁ ကြောင်း)။ T2 merge ပြီးမှ: `yangon/life.js` → `bike.js` ပြောင်းသုံး (T4 ကျန်)။ `chibi.js` မထိ (lob/bigthrow ရှိပြီး)။

### A. လက်နက် ၃ မျိုး — လက်ထဲ မတူရ
| | ပြွတ် (စတီး) | ပူဖောင်း | ပုံး |
|---|---|---|---|
| ပစ်ပုံ | ဖိထား → ဖြောင့် stream၊ အကွာ ၆ m | ချိန် → `lob` ကွေး (arc ပြ)၊ ထောင့်ချိုး ကျော်၊ ကျရာ ဝိုင်း .၈ m စို | နီး ၁.၅ m၊ ကျယ် ၉၀°၊ တစ်ခါတည်း ကုန် |
| ရေ ကုန် | ၁ စက္ကန့် = ၁၀% | ၁ လုံး = ၁၅% | ၁ ခါ = ၁၀၀% |
| ထိရင် | grit −.15/s | −.35 | −.6 + knockback |
| အသံ | `pssh` ဆက် | `splat` | `whoosh`+`splash` |
war.js မှာ ပြွတ်/ပူဖောင်း ရှိပြီး → ပုံး ထည့်၊ ၃ ခု ကွာခြားမှု ဒီဇယားအတိုင်း ချိန် · လက်နက် ပြောင်း R (ရှိ)

**Creator (2026-11-01): the three weapons must feel clearly different in damage** — widen the gaps (pump ≈ −.08/stroke-hit, balloon −.35, bucket −.7 + shove + full soak), per-weapon hit feedback (bar chips vs chunks, hit-stop 60 ms for the bucket), costs that make the choice matter. In `?tune`.

### B. ရေ = ကျည်
ကျောပိုးပုံး HUD (ရှိ) · **ကုန်ခါနီး ၂၀% အောက်** ပြွတ်က stream အားနည်း + စက်စက် ကျ (particle နည်း) · ရေအိုးစင် (ရှိ) / ရေစည် / ပိုက်ခေါင်း မှာ ဖြည့် `glug` + ပုံး ပြန်ပြည့် animation (၁.၅ s၊ ဖြည့်နေတုန်း ပက်ခံရရင် ပျက်) · ဖိုးကျော် `supply` role (war.js — ရေကုန်ခါနီးသူဆီ ဆီပုံး သယ်ပေး၊ T4 bike rack နဲ့)

### C. ထိတဲ့ခဏ (game feel)
1. hit-stop **၄၀ ms** (world `dt` ကို ၀ ၂–၃ frame) · ကင်မရာ ယိမ်း .၁၅ s (orbit target offset)
2. ခံရသူ squash (`sy .85` ၁ frame → ပြန်) + `drop` emote + ဆံပင် ပြား/အင်္ကျီ ရင့် (ရှိ) + မျက်နှာ `wet` (CHARACTERS §၁၄)
3. ပစ်သူ — ပြွတ် recoil .၀၅ m၊ ပူဖောင်း ပစ်ရင် `lob` + ခြေလှမ်း
4. OUT ဖြစ်ရင် — `shake` + ခေါင်းပေါ် 「OUT」 (ရှိ) + အသံ
5. ဖုန်း Vibration API ၃၀ ms (Android)

### D. ရွှဲတာ မြင်ရ (`fx.js`)
- **three.quarks** (CDN) — ပြွတ် stream = ribbon + droplet · ပူဖောင်း ပေါက် = burst ၃၀ · ပုံး = sheet + droplet · ကုန်ခါနီး drip။ Browser VFX editor နဲ့ ချိန်ပြီး JSON `fx/*.json` သိမ်း (ဖန်တီးသူ ကိုယ်တိုင် ချိန်လို့ရအောင်)
- `DecalGeometry` — နံရံ/ဒရမ်/ကလေးပေါ် ရေစို အကွက် (`wet #2aa7b8`၊ ၆ s ကြာ ပျောက်)၊ decal ≤ ၆၀ ခု pool
- **wet-map** — ကြမ်းပြင် RenderTarget 512² ပေါ် စက်ဝိုင်း ဆွဲ၊ ၂၀ s ကြာ ခြောက် · ဘယ်ဘက် ပက်ပြီးပြီလဲ မြင်ရ (library မလို)
- `Water2` — ရေအိုးစင်/ရေစည် ရေမျက်နှာပြင်
- ဖုန်း: particle ≤ ၂,၀၀၀၊ LEVELS low မှာ decal/wet-map ပိတ်

### E. မရေးထားတဲ့ စည်းကမ်း (`rules.js` — v5 ကနေ ယူ)
1. တိုက်ရင် **အသံ မထွက်** — နိုင်မှ 「ဟေး!」 (bubble မပြ၊ emote ပဲ)
2. grit ကုန်ရင် **OUT** → ရှေ့ မတက်ရ၊ ရေအိုးစင် ပြန် (ရှိ)
3. **OUT ကို မပက်ရ** (ရှိ) — ပက်မိရင် ပက်သူ grit −.3 + 「ဟဲ့!」 (ဒဏ်)
4. **မဏ္ဍပ်ထဲ မသွင်းရ** — မဏ္ဍပ် zone ထဲ ရောက်ရင် ပက်ခလုတ် ပိတ်
5. ထိုင်နေသူ/လူကြီး/ဘုန်းကြီး မပက်ရ (DIRECTION — ရှိ)
HUD ထဲ စည်းကမ်း ချိုးရင် ၁ ကြောင်း ပြ · ဒီ module ကို T5/T6 ရပ်ကွက်ထဲ ရေပက်တာမှာလည်း သုံး

### F. NPC — **Yuka** steering
- `SeekBehavior`/`ArriveBehavior` + `ObstacleAvoidance` (ဒရမ်/နံရံ) + `Alignment/Cohesion/Separation` (flock — ၁၀ ယောက် အတူ ပြေး T3b) · state machine: `advance / hold / flank / retreat(OUT) / refill / supply`
- သူရ = `ambush` (ထောင့်မှာ စောင့်၊ faceAim) · ငဇွဲ = `advance` ပုံသေ · မေသူ = နောက်တန်း lob · ချိုချို = `hide-behind`
- war.js ရဲ့ `STANCE`/`think` ကို Yuka ဖြင့် အစားထိုး (၅၁၂ ကြောင်းထဲ AI အပိုင်း ပြန်ရေး) — လမ်းရှာက grid A* ကိုယ်ပိုင် (T1 review #3)

### G. carry ချိတ်
`hit(k)` ထဲ `carry.hit(k)` ၁ ကြောင်း — ကိုင်ထားတဲ့ item ယိမ်း/ကျ (T4) · OUT ဖြစ်ရင် item ကျ

### ✅ Result (Fable review 2026-11-01 · PR #31 merged)
- war.js on the orbit camera · WEAPONS pump (strokes) / balloon (lob) / bucket (heave) with damage −.12 / −.35 / −.70 + chunk feedback · ammo < 20% + 1.5 s refill · soak()/hit-stop/shake/squash/vibrate · fx.js (three.quarks 0.16, decals, wet-map) + fx/*.json + fx/make.html · rules.js · yangon/ai.js (Yuka 0.7.8 + grid A*) · soak cap (TUNE.soakCap .5, blurMax 1.2) · ?tune
- Verified: orbit aim after turns, damage numbers, soak cap, 50 fps, phone 375, `?auto` 3 rounds 0 snags, creator accepted the feel
- Leftover: `navigator.vibrate` before a user gesture logs console errors → tiny follow-up PR (guard with `navigator.userActivation.hasBeenActive`)
- Hand-offs: T5 teaches the three weapons in 1-2 via WEAPONS/rules.js · T6 uses the skirmish entry point for 2-6 · life.js → bike.js still pending (T6 or T3b)

### H. ကိရိယာ
- lil-gui `?tune`: hit-stop ms · ကင်မရာ ယိမ်း · လက်နက် ၃ မျိုး ဂဏန်း (အကွာ၊ ရေကုန်၊ grit) · particle အရေအတွက် — ဖန်တီးသူ ချိန်ပြီး JSON → `rules.js`/`fx/*.json` · `PositionalAudio` — ပြွတ်/ပူဖောင်း/ပုံး/ဘဲလ် အသံကို ဇာတ်ကောင်ပေါ် ချိတ် (sound.js ရှိပြီးသား buffer သုံး)

### ✅ ပြီးတယ် ဆိုတာ
- C ၅ ချက်လုံး ရှိ (screenshot/video) · A ၃ မျိုး ကိုင်ကြည့်ရင် ကွဲ · B ကုန်/ဖြည့် loop
- ဖုန်း (375, LEVELS low) ၁၀ ယောက် တစ်ပြိုင်နက် ပက်ရင် **≥ 30 fps** · laptop 60
- Yuka NPC ၅v၅ ၃ ပွဲ ကိုယ်တိုင် ဆော့ — NPC က ဒရမ်မှာ မငြိ၊ OUT ဆို ပြန်
- `fx/*.json` ၄ ခု + editor ဖွင့်ပုံ README
- console error 0 · `docs/plans/T3.md` + PR
- **ဖန်တီးသူ: ၂ မိနစ် ပက်ပြီး 「ထပ်ပက်ချင်သေးလား」** — ဒါ မဟုတ်ရင် merge မလုပ် → **✅ 2026-11-01 creator played the Browser pane build: 「いいと思う」** (camera T2 and the T3 splash feel both accepted; T3 merge waits only on the rebase + blur cap)

### မလုပ်ရ
`world.js` `chibi.js` `cast.js` · ဇာတ်လမ်း scene (T3b) · ပြောမှ commit

---

## T3b ရက် ၄ vertical slice (T2 + T3 ပြီးမှ)

တံတားထိပ် ၅v၅ (T3 ပွဲ ၃ ပွဲ) → ၄-၄ ဖလား ချောင်းထဲ (**script**: ပွဲ ၂ အလယ်မှာ kinematic ဖလား + ချောင်းဘက် တွန်းအား — T1 review #4) → ၄-၅ ၁၀ ယောက် အတူ ဆယ် (co-op mini: ကြိုး+ပူဖောင်း ပစ် `bigthrow`၊ ④ ပြွတ် ၅ ချောင်း ရေထိုး၊ ချိုချို 「ရေက ဒီဘက်」၊ Yuka flock) → ၄-၆ ၅ နာရီ timer ပြေး (ဖိုးကျော် စက်ဘီး rack ပေါ် `{နာမည်}`+ဖလား၊ ဖိုးဝ၊ ဈေး အမေ ၂ ယောက်) → ၄-၇ ဘွားဘွား ရယ် (CHARACTERS §၁၄ `joy`၊ ဆရာကြီး 「ကောင်းတယ်」) → ၄-၈ `pour` + လူကြီးတွေကိုပါ ရေပက်။ Spec အသေးစိတ် T3 review ပြီးမှ။

---

## T5 ရက် ၁ + ရက်စဉ် system

**ရည်ရွယ်ချက်** — SCENARIO v6 §၃ ရက် ၁ (၁-၁ → ၁-၈) ကို **အစကနေ အဆုံး ကစားလို့ရ**အောင် — ပြီးတော့ ရက် ၂–၄ ပြန်သုံးမယ့် **ရက်စဉ် system** (မနက် အမေ → mission → ၅ နာရီ မဏ္ဍပ် → ည 「ဘာလုပ်ခဲ့လဲ」)။ ကစားသူ ပထမဆုံး ထိတဲ့ ၁၅ မိနစ်။

**ကြိုတင်** — T2 (#30) merge ပြီးမှ (yangon/* ကို T2 ပိုင်နေလို့)။ T3 ရဲ့ `rules.js` ရှိရင် သုံး၊ မရှိသေးရင် ရေပက် ခလုတ် ပိတ်/ဖွင့် ရိုးရိုးနဲ့ (T3 merge ရင် ပြောင်း)။ `docs/plans/T5.md` အရင်။ Branch `claude/day1`။

**ဖိုင်** — T5 ပိုင် = `yangon/main.js` (favour ၉ ခု flow **ဖြုတ်** → ရက် ၁ flow) · `yangon/save.js` (ERRANDS/ITEMS ဖြုတ် → `S.day S.step S.parts S.night[]`၊ KEY bump — v4 save ဖျက်) · `yangon/hud.js` (ရည်မှန်းချက် စာကြောင်း + ည ရွေးစရာ ၂ ခု) · 🆕 `yangon/day.js` · 🆕 `yangon/mandat.js` · 🆕 `yangon/story.js` · `yangon/set.js` (ကွက်လပ် မဏ္ဍပ်နေရာ၊ ④ ခြံစည်းရိုး)။ **မထိ**: `world.js` `camera.js` (T2) · `war.js` `fx.js` (T3) · `chibi.js` `carry.js` (T4 ✅ — သုံးရုံ)။ `downtown.js` ⑤ = v6 ဇာတ်မှာ မပါ — code ထား၊ ရက် ၁ မှာ မရောက်ရ (ဘတ်စ်ကား ဖြုတ်)။

### ၁။ `day.js` — ရက်စဉ် system (ရက် ၁–၄ တူ)
| phase | ဖြစ်တာ | code |
|---|---|---|
| `morning` | အိမ်ထဲ နိုး · အမေ: သွားလို့ရတဲ့ နေရာ + 「၅ နာရီ」 (ရက် ၁ = လမ်းထဲကပဲ → `range` = ① ပဲ၊ ဈေး/④ ဝင်ရင် အမေ့အသံ 「`{နာမည်}`!」 ပြန်ပို့) | `setTime(0)` · `range` polygon |
| `day` | ဂိုဏ်း စု → mission · HUD ရည်မှန်းချက် (SCENARIO §၀ ဇယား) | `goal(text)` |
| `five` | ၅ နာရီ — မဏ္ဍပ်မှာ ပစ္စည်း တင် (`mandat.add`) · ဆရာကြီး ဝီစီ + 「ဟွန်း… မဆိုးဘူး」 · ဖလား နေရာ ပြ (ရက် ၂ ကစ) | `setTime(.6)` ရွှေရောင် |
| `night` | အိမ်ထဲ · အမေ/ဘွားဘွား မေးခွန်း → **ရွေးစရာ ၂ ခု** (hud menu) — ဘာရွေးရွေး ဇာတ် မပြောင်း၊ 「…」 ရွေးရင် `{နာမည်}` နားရွက် နီ (chibi `redEar`) · `S.night.push(choice)` · အိပ် → 「ရက် N」 title | `setTime(1.7)` |
ရက် ၁ ပြီးရင် 「ရက် ၂ — မကြာခင်」 card (T6)။ `?day=1&step=…` debug param။

### ၂။ `mandat.js` — ကြီးလာတဲ့ မဏ္ဍပ် (progress မြင်ရ)
ကွက်လပ် (set.js ရှိပြီး) မှာ ပုံသေ နေရာ · `parts`: `floor` `cloth` `speaker` `lights` (ရက် ၁) · `sign` (ရက် ၂) · `drum`+`ice` (ရက် ၃) · `bowl` (ရက် ၄) · `add(part)` → ghost → ပေါ် animation (`lift`) · မဏ္ဍပ်ပေါ် ဖလား ထိုင်ရာ (၁-၆ ဘွားဘွား တင်) · main.js ရဲ့ favour-part ghost ပုံစံ ပြန်သုံးလို့ရ · ရေပက်စစ် zone (rules #4) = မဏ္ဍပ် ပတ်လည် ၂ m

### ၃။ `story.js` — scene data (စကားပြော SCENARIO v6 အတိုင်း၊ ဗမာလို၊ calque မပါ)
`{ id:'1-7', when: 'day', lines:[[who,'…', {face:'shock'}]], then: … }` · hud.say (ရှိ) နဲ့ ပြ · မျက်နှာ CHARACTERS §၁၄ (`anim.face` ရှိရင်၊ မရှိရင် expr/mouth) · ၃၀ စက္ကန့် ထက် မပို

### ၄။ ရက် ၁ scene (SCENARIO §၃ အတိုင်း)
| | ဘာ | reuse / အသစ် |
|---|---|---|
| ၁-၁ | နိုး · အမေ · ဘွားဘွား ဖလား ပွတ် (plant) · လမ်းလျှောက်/ပြေး/ခုန် သင် | rooms.js အိမ် (ရှိ) · 🆕 ဘွားဘွား NPC + ငွေဖလား prop (carry.js `bowl`) |
| ၁-၂ | ဂိုဏ်း စု (ငဇွဲ → ဖိုးကျော် စက်ဘီး → မေသူ → ချိုချို ချောင်း) · **လက်နက် ၃ မျိုး သင်** (ပြွတ်/ပူဖောင်း/ပုံး — ကစားသူ ပူဖောင်း ရ) · HUD 「ဂိုဏ်း စု — မဏ္ဍပ် ဆောက်မယ်」 | main.js kids (ရှိ) · cast.js ဇာတ်ကောင် opts · war.js လက်နက် code (T3 မပြီးရင် ရိုးရိုး splash) |
| ၁-၃ M1 ပိတ်စ | အန်တီစိန် ၄ ထပ် ကြိုးပုံး — **ရေ**: ပုံး ဗလာ ဆို လေလို့ မဆင်း → အောက်က **ပုံးထဲ ရေ ပက်ထည့်** (ပြွတ် ချိန်) → လေးလာ → ဆင်း၊ ပိတ်စ ပါ · ၂ ယောက် (ငဇွဲ ပက်၊ `{နာမည်}` ခံ) | pulley.js (ရှိ) + ရေ ထည့်တာ 🆕 |
| ၁-၄ M2 အသံချဲ့စက် | ကြောင် ရွှေဝါ စက်ပေါ် — **ကြောင်ကို မပက်ရ** (rules #5 ပုံစံ) · ဘေးက သွပ်မိုး ပက် → အသံ → ကြောင် ခုန် → ချိုချို 「ငါးခြောက်」 ချော့ · စက် ၂ ယောက် မ | main.js cat (ရှိ) + သွပ်မိုး target 🆕 |
| ၁-၅ M3 မီးကြိုး | ကိုဇော် မီးသီး ပဟေဠိ (ရှိ) · **ရေထိရင် ပြန်စ** — ကလေးတွေ ဘေးမှာ ပက်နေ၊ `{နာမည်}` ပုံးနဲ့ ကာ (carry `front`) / ကိုဇော် 「ရေနဲ့ မီး」 | bulbs.js (ရှိ) + ရေ ကာတာ 🆕 |
| ၁-၆ | ၅ နာရီ · မဏ္ဍပ် ပထမပုံ (`mandat.add ×4`) · ဆရာကြီး 「ဟွန်း… မဆိုးဘူး」 · ဘွားဘွား ဖလား တင် 「မကိုင်နဲ့」 | 🆕 |
| ၁-၇ | **ဖလား ပျောက်** — ငဇွဲ 「တစ်ချက်တည်း」 · `{နာမည်}` ဖလား ကောက် (carry `front`) · ရေခပ် · **ပစ် mini**: အားဖြည့် bar → `bigthrow` → **ဘယ်လိုပဲ ပစ်ပစ် ချော်** (script — ကစားသူ အမှား မဟုတ်ဘူး ဆိုတာ မြင်အောင် ဖလား လက်က ချော်တဲ့ ပုံ + 「ဟာ」) → ④ ခြံစည်းရိုး ကျော် → 「ဒင်း」 သံ + ④ ကလေးအသံ · အမေ 「၅ နာရီ!」 · ကတိ scene (မေသူ စာအုပ် `note`၊ ချိုချို လက်) · HUD 「ဖလား… ဘယ်သူမှ မပြောရ」 | carry.js throw + script 🆕 · set.js ④ ခြံစည်းရိုး 🆕 |
| ၁-၈ | ည · ဘွားဘွား 「ဖလား ရှိတယ်နော်」 → ရွေးစရာ 「ရှိတယ်」/「…」 → နားရွက် နီ · အိပ် → 「ရက် ၂」 | day.js night |

### ၅။ ဖြုတ်ရမှာ
main.js favour ၉ ခု (tea/padauk/fronds/drum/nozzle) + Mandalay ဘတ်စ်ကား + Phoe Tha သူငယ်ချင်း · save.js ERRANDS · ⑤ downtown ရောက်လမ်း (ဘတ်စ်ကား) — code ဖိုင် မဖျက်၊ flow ကပဲ မခေါ်။ `docs/archive/` မှာ v4 flow ရှိနေလို့ မှတ်စရာ မလို

### ✅ ပြီးတယ် ဆိုတာ
- new game → ၁-၁ … ၁-၈ → 「ရက် ၂」 အထိ **၁၂–၁၅ မိနစ်** ကစားလို့ရ · scene တိုင်း screenshot ၁ ပုံ
- HUD ရည်မှန်းချက် ၂ ခါ ပြောင်း (၁-၂၊ ၁-၇) · range ① ပဲ (ဈေး ဝင်ရင် အမေ ပြန်ခေါ်)
- M1–M3 ၃ ခုလုံး ရေပက်ရင်း ဖြေရ (ရေ မပါ mission မရှိ)
- ၁-၇ ပစ်တာ ၃ ကြိမ် စမ်း — ဘယ်လိုပဲ ပစ်ပစ် ဖလား ④ ဘက် ရောက်
- ည ရွေးစရာ ၂ ခုလုံး စမ်း — 「…」 ဆို နားရွက် နီ · save/reload ရက်လယ်မှာ ပြန်ဆက်လို့ရ
- စကားပြော ဗမာလို SCENARIO အတိုင်း (Fable review မှာ calque စစ်မယ်)
- ဖုန်း 375 · console error 0 · laptop 60fps · `docs/plans/T5.md` + PR

### မလုပ်ရ
ရက် ၂–၄ content · `world.js` `war.js` `chibi.js` · ⑤ downtown ပြင်တာ · ပြောမှ commit

---

## T6 Day 2 + Day 3

**Goal** — SCENARIO v6 §4 (day 2, 2-1 … 2-8) and §5 (day 3, 3-1 … 3-7) playable end to end on top of T5's daily system. Day 2 = the adventure day (into ward ④, the bowl seen on Thura's head, a fight you are meant to lose). Day 3 = the squeeze (gang short-handed, Nga Zwe scared, the bowl spotted on the ice truck, the match for tomorrow set). Each day 12–15 min.

**Prereqs** — T5 merged (`day.js`, `mandat.js`, `story.js`, home interior, carry people wrapper) · T3 merged (`rules.js`, weapons, `fx.js`, `ai.js`) · T4 (carry, bike). Write `docs/plans/T6.md` first. Branch `claude/day23`.

**Files** — T6 owns `yangon/main.js` (day 2/3 flow), `yangon/story.js` (scenes 2-x, 3-x), `yangon/set.js` (④ lane + fence gate, drain run, May Thu's porch + washing line, ice truck spot), `yangon/day.js` (day 2/3 ranges), `yangon/mandat.js` (sign, drum, ice parts), 🆕 `yangon/missions/` (`drain.js`, `lane4.js`, `laundry.js`, `icerun.js`), `cast.js` (Thura bowl helmet + goggles-up, U Tin Maung ice truck/radio props, Phoe Wa dog via critters.js). Not: `world.js`, `camera.js`, `war.js` core (call its skirmish API), `chibi.js`.

### Day 2 (SCENARIO §4)
| scene | what | gameplay / reuse |
|---|---|---|
| 2-1 | Mum: market allowed, ④ forbidden, 5 o'clock · Bwa Bwa's one look | `day.range` = ① + market street · goal 「④ ဘက် ဝင်ရှာမယ်」 (the player chooses to disobey — the range check for ④ shows Mum's line once, then lets you through with a 「…」) |
| 2-2 | gang gathers · Saya Gyi: sign paint from the betel uncle · Phoe Kyaw brought the purse (plant) · May Thu / Nga Zwe argue, Cho Cho resolves | story.js |
| 2-3 / 2-4 **M4 purse** | on the main street grown-ups are splashing · Phoe Kyaw dodges → purse drops into the roadside drain and floats off · goal 「ဖိုးကျော့် ပိုက်ဆံအိတ် အရင်」 | 🆕 `drain.js`: a flowing drain along the street (visible current, the purse bobbing); **two kids needed** — Nga Zwe (NPC) sprays from upstream to push the purse, the player waits at one of **three grates** downstream and presses E at the right moment to catch; miss → next grate; miss all three → restart. Use `rules`/weapons for Nga Zwe's spray, `carry` for the purse (hand). Phoe Kyaw rings the bell ×3 on success |
| 2-5 | betel uncle sells the paint · hint 「④ kids are wearing something shiny on their heads」 | story.js |
| 2-6 **M5 lane ④** | Phoe Wa the dog at the lane mouth (Phoe Kyaw won't pass) · Cho Cho knows its name and that it likes fried rice → buy fried rice at the market → the dog sits · inside: **Thura wearing the silver bowl as a helmet** + five ④ kids · dialogue · **4 v 5 skirmish you are meant to lose** (no refill on ① side, ④ has a drum; it ends when the ① cans are empty) · goal 「သူရတို့ဆီမှာ — ပြန်ယူမယ်」 | 🆕 `lane4.js`: set.js ④ lane + gate; critters.js dog with a `sit` state and a food trigger; war.js skirmish API (`startSkirmish({ map:'lane4', sides, refill:{A:false,B:true}, endWhen:'A-empty' })` — add that entry point to war.js if missing, nothing else in war.js); Thura's helmet = carry `bowl` on his `head` socket + goggles up; the bowl stays on him when it ends |
| 2-7 | back soaked · **paint the gang name on the sign** (mini: trace 3 strokes with the pointer, any result is accepted, it goes on the mandat) · Saya Gyi 「…ဖလား ဘယ်မှာလဲ」 → Cho Cho's lie → 「ဟွန်း」 | `mandat.add('sign')` with the painted texture (CanvasTexture) · story.js |
| 2-8 | night: Mum 「④ ဘက် မကူးဘူးနော်」 → 「မကူးဘူး」 / 「…」 · Bwa Bwa smiles · bowl location card 「④ · သူရ ခေါင်းပေါ်」 | day.js night + 🆕 bowl-location card |

### Day 3 (SCENARIO §5)
| scene | what | gameplay / reuse |
|---|---|---|
| 3-1 | Mum: hottest day, ice needed, ④ **allowed** today · goal 「ရေခဲ လိုတယ် — ဦးတင်မောင့်ဆီ」 | range = ① + market + ④ · world saturation −20% today (PALETTE "hottest day") |
| 3-2 | only Nga Zwe at the corner — Phoe Kyaw on water runs (10 trips), May Thu doing the laundry · Cho Cho free → three of you | story.js · Phoe Kyaw NPC cycling market ↔ shop on a loop (bike.js), May Thu NPC at her porch |
| 3-3 | Nga Zwe's trouble: 「…ငါ မသွားရဲဘူး」 (the radio) · red ears · goal 「ငဇွဲ မသွားရဲ — အရင် ပြင်ပေး」 · plan: fetch the other two by helping with their chores | story.js, `earBlush` |
| 3-4 **M6 laundry** | May Thu's porch, basket of 10 clothes · **three roles**: Nga Zwe (NPC) sprays the clothes clean (a water bar per item), the player wrings and **throws each onto the washing line** (`bigthrow` power → lands on the line or falls back), Cho Cho / May Thu peg them · an item that is not pegged in time slips off → re-wash · May Thu takes off the shower cap and joins (CHARACTERS §3) | 🆕 `laundry.js`: line with 10 peg spots, throw arc + catch zone; carry `front` for the basket |
| 3-5 **M7 ice run** | Phoe Kyaw at the market: 3 trips left → May Thu's plan: fetch the ice and deliver ice water to the shop in one trip · at U Tin Maung's truck Nga Zwe stands with his back turned; the radio is **playing** — 「၁၀ ခါ ပျက်… ၁၀ ခါ ပြင်…」 (not looking at him) · red ears + smile · Cho Cho peeks: **the bowl is the ice-water scoop on the truck** · U Tin Maung: Thura traded it for one block; tomorrow ① v ④ at the bridge head, winner takes it, he referees · goal 「ဖလား ရေခဲကားပေါ် ရောက်နေပြီ」 · **the run**: ice block on the bike rack (carry `bike`), Phoe Kyaw pedals (or the player rides, see T4), the others run alongside; **melt timer**; ④ kids ambush along the street → shield the ice (hit → rack item wobbles, 3 hits → it falls, pick it up again), spray back; one stop at the shop; then the mandat | 🆕 `icerun.js`: route with 2 ambush points (ai.js `ambush`), melt timer HUD, shop stop; ice truck + radio props on U Tin Maung (CHARACTERS §7); bowl visible on the truck (not takeable) |
| 3-6 | ice into the drum → `mandat.add('drum')`, `mandat.add('ice')` · Saya Gyi 「ဟွန်း… မဆိုးဘူး」 · U Tin Maung arrives, one game of chess with Saya Gyi (background, no scene) | mandat.js · two NPCs seated at the tea shop |
| 3-7 | night: Mum 「မနက်ဖြန် ၅ နာရီ မဖြစ်မနေ」 · Bwa Bwa 「ဖလား ရှိတယ်နော်」 → choice · card 「ရေခဲကား → မနက်ဖြန် တံတားထိပ်」 · 「Day 4」 title → "coming soon" until T3b | day.js |

### Rules of thumb
- Water in every mission: M4 pushes the purse with water, M5 is a water fight, M6 washes with water, M7 defends the ice with water. No fetch-only steps.
- Every mission needs ≥ 2 kids; the NPC partner's role is visible (Nga Zwe spraying, Cho Cho pegging).
- Dialogue verbatim from SCENARIO §4/§5; faces from CHARACTERS §14; no scene over 30 s.
- Thura is named from 2-6 (Cho Cho says it); HUD shows 「သူရ」.
- Bowl location card appears every night from day 2 (a small drawing: ④ lane / Thura's head / the truck).

### ✅ Done means
- `?day=2` and `?day=3` from a fresh save play through to the next day's title: 12–15 min each (I measure), one screenshot per scene
- M4 catch at each of the three grates; M5 skirmish ends when ① is empty and the bowl stays on Thura; M6 all 10 clothes on the line; M7 ice arrives with ≥ 30% left on a normal run, falls and is recovered after 3 hits
- goal line changes per SCENARIO §0 (2-1, 2-3, 2-6, 3-1, 3-3, 3-5)
- phone 375, console errors 0, 60 fps laptop, `docs/plans/T6.md` + PR

### Don't
Day 4 content (T3b) · `world.js` `camera.js` `chibi.js` · war.js beyond the skirmish entry point · commit unless asked

---

## Issues → tasks (2026-11-01, Fable)

Four issues from the creator are already written as near-specs. The sections below only add the design decisions, the deltas and the file ownership; **the issue text is the spec** — read it first.

## T8 Swim goggles (issue #33)

Spec: [#33](https://github.com/aungpyaenyein-21/thingyan-game/issues/33). Fits CHARACTERS §8 (Thura: goggles down in a fight, face ×1, the toughest kid) and the no-drawback decision.

**Decisions**
- Numbers as proposed: `goggleFaceK 1.0`, `goggleSoakK .4`, `thuraK .8`, all in `?tune`.
- **Where you buy them (T6, not T8):** a market stall on day 2 (the betel uncle's neighbour), price 500 ks from **Thingyan pocket money** — Mum gives 1,000 ks on the day-2 morning when she allows the market (2-1). That is the only money in the game; `save.js` gets `S.money` and `S.goggles`. Never a goal line; a kid at the stall wearing them is the hint. T6 owns this.
- T8 scope = war.js only: `soak()` reads `k.goggles` / `k.toughK`, HUD pad **G** (uses cast.js `goggles` one-shot, ~.9 s, no firing meanwhile), Thura + the ④ goggles kid down by default, town kids up, `?goggles` to test, the flat 「ဖျန်း」 + lens flash feedback.
- Branch `claude/goggles`. Plan file first. Acceptance = the issue's list (damage.cjs −.08 vs −.12, Thura outlasts everyone in `?auto`, overlay light under 40 face hits, up/down reads).

## T9 Kids move quick and nimble (issue #34)

Spec: [#34](https://github.com/aungpyaenyein-21/thingyan-game/issues/34).

**Decisions**
- **chibi.js is open for this task** (T4 is merged): kid `gait` 1.15 → ~1.45, new `jog` loop (f ~2.0, A ~.6), the hop-skip flourish. Targets: player kid walk ~1.6 m/s, jog ~2.6, run ~3.8. Adults/elders unchanged.
- world.js player move: accel to full speed ~.1 s, stop ~.08 s, turn ~.08 s, stick bands walk / jog / run (jog is the default band), `?tune` for all of it.
- Camera: bump CAMERA.md look-ahead if the kid runs off the leading edge (lookRun 2 → ~2.6) — update `docs/CAMERA.md` §3 numbers in the PR.
- Re-run T3's `?auto` and `damage.cjs` after: the pump's 6 m range vs the new run speed must still feel fair; if kids now outrun the stream, raise `WEAPONS.pump.range` to 7 and say so.
- cast.html tics must not change (regress.cjs from T4).
- Branch `claude/speed`. Can run now, in parallel with T8 (no shared files) — but **not** with T10 (both touch chibi.js): T10 waits for this.

## T10 Talk director (issue #35)

Spec: [#35](https://github.com/aungpyaenyein-21/thingyan-game/issues/35).

**Decisions**
- **CAMERA.md §2 `talk` changes**: not one held two-shot but per-line shots. `talkShot(speaker, listener, kind)` in camera.js, kinds `ots | two | close | wide`, default `ots`; same speaker twice = hold; 3+ people = `wide` first line then `ots`; cut when the box advances, glide .35 s; `release()` after the last line. Collision fallback flips sides, then `two`. I will update CAMERA.md after the PR.
- Gestures live in **cast.js** (`point`, `hips`, `scratch`, `nod` next to `shrug/scold/bow`), the **mouth rhythm in chibi.js** (`p.mouth` flaps while `hud.typing`); chibi.js is open after T9 merges.
- Line data `[who, text, { face, act, shot }]` — **T5 writes story.js in this format from the start** (I'm telling the T5 session now); T10 makes the options do something. Until T10 lands, hud.talk ignores the options.
- Listener: head/eyes on the speaker, nod every ~3 s, emote on `{ react: 'bang' | 'drop' | 'heart' | 'note' }`.
- Skippable; after a fast tap-through the camera and poses must be sane (acceptance item).
- Branch `claude/talk`, after T5 and T9 merge. Owns camera.js (talkShot), hud.js (onLine / typing), cast.js gestures, chibi.js mouth, a talk director module (`yangon/talk.js`), and the one scene wiring in main.js.

## T11 Home rally (issue #36)

Spec: [#36](https://github.com/aungpyaenyein-21/thingyan-game/issues/36). Fits DIRECTION's "adults 20%": a cameo event, not a system.

**Decisions**
- Trigger, barrage, rules exactly as the issue (once a round, not in the first 30 s, not when decided; 2–4 adults, 25–30 balloons over 6–8 s, landing rings .6 s ahead, −.25 and never below .1 grit, `canOut` false).
- The event's adults are `immune` (hittable, no grit, no foul, no schedule change) — **not** `protected`; rules.js keeps "sitting / elders / monks are protected" for everyone else. Kids' silence rule stays; adults may shout.
- ai.js gains `duck` (visitors scatter out of rings, behind walls/drums) — reuse for T6's ambushes later.
- `?mode=away` mirrors it against the player; `?rally=force` for testing.
- Branch `claude/rally`, **after T8 merges** (both edit war.js `soak` / HUD). Plan file first.

---

## Task တစ်ခုရဲ့ သွားပုံ (task တိုင်း တူ)

```
spec (Fable, TASKS.md) → plan (အခြား model, docs/plans/T<n>.md) → plan review (Fable) → code (branch claude/<task>) → PR → review (Fable) → merge (Fable, ပြဿနာ မရှိရင်)
```

**Plan အရင်၊ code နောက်** — code မရေးခင် `docs/plans/T<n>.md` (½ စာမျက်နှာ၊ ဗမာလို) ရေး: ဘယ်ဖိုင် အသစ်/ပြင်၊ library ဘယ်လို ချိတ်၊ အဆင့် ၅–၈ ခု၊ မသေချာတာ/မေးစရာ။ Fable က plan ကို ကြည့်ပြီး OK ပေးမှ code စ (code review ထက် plan review က ပေါ့လို့ — လမ်းမှားရင် ဒီမှာ တားမယ်)။ Plan ကို branch ထဲ commit ပြီး PR ထဲ ပါစေ။

## Review လုပ်ပုံ (Fable)

PR: base `main` ← head `claude/<task>`။ Plan ပြီးရင် 「plan review」၊ PR ဖွင့်ပြီးရင် 「review」 လို့ ပြောရုံ။

1. **Code ဖတ်** — `gh pr diff` နဲ့ diff တစ်ခုလုံး။ `docs/plans/T<n>.md` နဲ့ ကိုက်မကိုက်။ TASKS.md ရဲ့ spec အပိုင်းတိုင်း ရှိ/မရှိ၊ 「မလုပ်ရ」 စာရင်း မထိဘူး ဆိုတာ
2. **ကိုယ်တိုင် run** — branch ကို worktree ထဲ checkout (`git worktree add ../<task> claude/<task>`)၊ preview ဖွင့်ပြီး in-app Browser pane မှာ စမ်း။ Console error၊ FPS၊ 375px layout
3. **ဒီဇိုင်းနဲ့ တိုက်** — SCENARIO v6 / CHARACTERS / DIRECTION နဲ့ ကိုက်မကိုက်၊ နောက် task တွေ ဒီအပေါ် ဆောက်လို့ ရမရ
4. **Review ရေး** — `gh pr review` နဲ့ PR ပေါ် comment (line အလိုက်)။ TASKS.md ထဲ အခြေအနေ 👀 → ✅ ဒါမှမဟုတ် ပြင်ရန် စာရင်း
5. ပြင်စရာ ရှိရင် အခြား model က **အဲဒီ branch မှာပဲ** ပြင် → Fable ထပ်စစ် → OK မှ **Fable** squash merge (`gh pr merge --squash`) → Pages live

Fable က code မရေး — review comment၊ merge (OK ရင်)၊ TASKS.md အခြေအနေ၊ နောက် task ရဲ့ spec ပဲ။

---

## T1 camlab — Go-Go Town! ပုံစံ ကင်မရာ + library ၃ ခု prototype

**ရည်ရွယ်ချက်** — ဂိမ်းအစစ် (`world.js`) ကို မထိဘဲ၊ စာမျက်နှာ တစ်ခုတည်းမှာ အောက်က ၄ ချက် အလုပ်လုပ်မလုပ်၊ ဖုန်းမှာ ပေါ့မပေါ့ စမ်း။ ဒါ ကြည့်ပြီးမှ ဂိမ်းအစစ်ကို ပြောင်းမယ်။

**ဖိုင်** — `camlab.html` (+ လိုရင် `camlab.js`)၊ `art/building.py` (Blender script)၊ `art/shop.glb`။ Library တွေကို ရှိပြီးသား စာမျက်နှာတွေလို CDN importmap နဲ့ (three 0.170 jsdelivr + `@dimforge/rapier3d-compat` + `three-pathfinding` + `three/addons/loaders/GLTFLoader.js`)။ build tool မသုံး။

**စမ်းကွင်း** — ကြမ်းပြင် ~40×40၊ box အဆောက်အအုံ အနည်းငယ်၊ ချောင်း အစင်း ၁ ခု၊ တံတား ၁ ခု။ ကစားသူက `./chibi.js?v=30` ရဲ့ `makeChibi` / `ChibiAnimator` chibi (`cast.js` ကို နမူနာ ယူ)။

### ၁။ ကင်မရာ
- Perspective။ ကစားသူနောက် lag နဲ့ လိုက်
- **၄၅° snap** လှည့် (ခလုတ် + ဘေးတိုက် drag)၊ smooth tween။ pinch / wheel zoom
- ကင်မရာနဲ့ ကစားသူကြား ပိတ်နေတဲ့ အဆောက်အအုံ **ဖျော့** (raycast → opacity ~.25)
- ကောင်းကင်/နေ — လှည့်လည်း မှန်ရမယ်။ `world.js` ရဲ့ canvas gradient + screen နေရာ ပုံသေ နေ ပုံစံက လှည့်ရင် ပျက်လို့ **ဒီမှာ မသုံး** — sky dome ဒါမှမဟုတ် ကင်မရာ azimuth အလိုက် နေ ရွှေ့
- ကစားသူ ရွေ့တာ keyboard / joystick — **ကင်မရာ ဦးတည်ချက်နဲ့ ဆက်စပ်**

### ၂။ Rapier (physics)
- ကြမ်းပြင်၊ တံတား လက်ရန်း၊ ချောင်း = collider
- **ငွေဖလား** (cylinder အသေး) rigid body — ခလုတ် နှိပ်ရင် ကစားသူ လက်ထဲက ပစ်၊ ခုန်၊ တံတားက ချောင်းထဲ ကျ → ဘယ် zone ကျလဲ စာ ပြ (SCENARIO ၄-၄ အတွက်)
- ရေပူဖောင်း **၁၀ လုံး** တစ်ပြိုင်နက် ချ — ဖုန်း performance စစ်

### ၃။ three-pathfinding
- စမ်းကွင်းအတွက် navmesh (အဆောက်အအုံ + ချောင်း ဖယ်၊ တံတား ပါ) → Zone
- NPC chibi **၃ ယောက်** — နှိပ်/tap တဲ့ နေရာဆီ အဆောက်အအုံ ပတ်ပြီး၊ တံတား ကျော်ပြီး လမ်းလျှောက်

### ၄။ glTF (Blender → three)
- `art/building.py` — Blender python: ၄ ဘက်လုံး ဆိုင်းဘုတ် ပါတဲ့ ဆိုင်အိမ် ၁ လုံး ထုတ်ပြီး `art/shop.glb` export
- Blender မရှိရင် three ရဲ့ `GLTFExporter` နဲ့ code ကနေ `.glb` ထုတ်ပြီး အဲဒီလို လုပ်ထားကြောင်း မှတ်
- ကွင်းထဲ ထည့် — ကင်မရာ လှည့်ရင် ၄ ဘက်လုံး မြင်ရ

### စစ်ဆေးပုံ
- Preview `thingyan` (port 8790)၊ in-app Browser pane — Chrome အစစ် မသုံး
- Console error **၀**
- Screenshot: လှည့်ထားတဲ့ ထောင့် ၂ ခု · ဖလား ချောင်းထဲ · NPC လမ်း · glTF ဆိုင် ၂ ထောင့်
- Laptop FPS + ဖုန်းအတွက် လေးမယ့် အချက် မှတ်
- `camlab.html` ထိပ်မှာ comment: library တစ်ခုချင်း KB ဘယ်လောက်၊ တွေ့တဲ့ ပြဿနာ (ဗမာလို)
- ခလုတ် စာသား ဗမာလို (`cast.html` လို)၊ 375px မှာ ရ

### မလုပ်ရ
- `world.js`၊ `yangon/*`၊ ဂိမ်းအစစ် မထိ
- ပြောမှ commit

### ✅ ရလဒ် (Fable review 2026-10-31 · PR #28 merge)
- ၄ ချက်လုံး အလုပ်လုပ် — `camlab.html` / `camlab.js` · `art/building.py` (Blender 4.2 run) → `art/shop.glb` · ဆိုင်းဘုတ် `art/signs.html` → PNG · screenshot `docs/camlab/*.jpg` · Playwright `docs/camlab/check.cjs`
- Laptop (Browser pane 1024×768, dpr 2): **60 fps** လှည့်ရင်း · 120 draw / 61k tri (အနီးကပ်) · navmesh 19 ms · Rapier init 2.2 s · console error 0
- ဖုန်း FPS **မတိုင်းရသေး** — Pages `camlab.html` မှာ ဖန်တီးသူ ကြည့်ရန်
- T2 ထဲ ယူသွားတာ: ဖျော့ချိန် `needsUpdate` shader recompile (fps 9 ခဏ) → material ကြို clone · ရေ အရောင် PALETTE · A* ကို grid ပေါ် ကိုယ်ပိုင် (T3) · Rapier 816 KB ကို T3 မှ ဆုံးဖြတ် · ၄-၄ ဖလား ကျတာ script

---

## T2 ဂိမ်းအစစ် ကင်မရာ ပြောင်း + PALETTE

**ရည်ရွယ်ချက်** — T1 camlab မှာ အလုပ်လုပ်ပြီးသား ကင်မရာကို **ဂိမ်းအစစ်** (ရက် ၁ ရန်ကုန် ရပ်ကွက် — `yangon.html`, `world.js`, `yangon/*`) ထဲ ရွှေ့။ တစ်ခါတည်း [PALETTE.md](PALETTE.md) အရောင် ပြောင်း၊ အဆောက်အအုံ ၄ ဘက် ဖြစ်အောင်။ ဇာတ်လမ်း/mission/ကစားနည်း **မပြောင်း** — ကြည့်ပုံပဲ ပြောင်း။

**ကြိုတင်** — PR #28 (camlab) `main` ထဲ ရောက်ပြီးမှ စ။ `docs/plans/T2.md` အရင်။ Branch `claude/camera`။

**ဖိုင် ပိုင်ဆိုင်မှု (T4 နဲ့ ပြိုင်လုပ်နေလို့)** — T2 = `world.js` · `yangon/*` · `yangon.html` · 🆕 `palette.js` · 🆕 `sky.js` · `art/*` (glTF) · `camlab.js` (ပြန်သုံးဖို့ ခွဲထုတ်ရင်)။ **T2 က `chibi.js` / `cast.js` / `carry.js` မထိ** (T4 ပိုင်)။ `war.js` မထိ (T3)။

### ၁။ ကင်မရာ (camlab.js ကနေ ယူ)
- `world.js:56` OrthographicCamera + ISO ပုံသေ → PerspectiveCamera၊ camlab ရဲ့ `placeCamera` (lag၊ ၄၅° snap၊ zoom 5–24၊ elevation curve)။ ကင်မရာ code ကို `camera.js` module အဖြစ် ခွဲပြီး camlab.html ကလည်း ဒါ import — copy ၂ ခု မထားရ
- ထိန်းချုပ်မှု — `world.js:489` ကစားသူ ရွေ့တာ ကင်မရာ ဦးတည်ချက်အလိုက်။ ခလုတ် ဘယ်/ညာ လှည့် + Q/E + ဘေးတိုက် drag + pinch (HUD ထဲ ထည့် — `yangon/hud.js`)
- **ဖျော့** — camlab ရဲ့ raycast ၂ ကြောင်း ပုံစံ၊ ဒါပေမဲ့ T1 review #1: `needsUpdate` မသုံး — material တိုင်း `transparent:true` variant ကြို clone၊ fade ချိန် swap
- shadow — PCFShadowMap (Soft မဟုတ်)၊ shadow camera ကစားသူ ပတ်လည် ၁၂ m ပဲ၊ ဖုန်း pixel ratio ≤ 1.5 (`PHONE` flag ရှိပြီး)

### ၂။ ကောင်းကင် (`sky.js`)
- `world.js` ရဲ့ canvas gradient + screen ပုံသေ နေ → **sky dome shader** (camlab ပုံစံ) · ဒါပေမဲ့ `setTime` (dusk 0→1→night 2) ကို **ဆက်ထောက်ပံ့** — SKY/NIGHT stop ၄ ခု ကို dome shader uniform အဖြစ် ထည့်၊ နေ ကမ္ဘာ ပုံသေ ဦးတည်ချက် + dusk အလိုက် နိမ့်/နီ · ကြယ် (night) ပါ
- `paintSky` hook (ရှိပြီး — ပိတောက်ပွင့် စတာ) ဆက်အလုပ်လုပ်ရ — မရရင် ဘာ ပျက်လဲ plan ထဲ ပြော

### ၃။ အရောင် (`palette.js`)
- `export const PAL = {...}` PALETTE.md token အကုန် — hex ကို ဖိုင်တိုင်း ပြန်မရေး
- ပြောင်းရမှာ: `world.js` floor → `sand`၊ hemisphere ground → `shade`၊ `yangon/set.js` `downtown.js` အဆောက်အအုံ → cream/mint/pink/ochre/teal ၅ ရောင်ထဲကပဲ၊ ရေ (ချောင်း၊ ရေစည်၊ ပူဖောင်း) → `water`၊ ① ဂိုဏ်းသား အင်္ကျီ `#2f8fd6` → `gang1` (world.js/life.js ထဲ ရှိတာပဲ — chibi.js မထိ)
- ရက် ၃ "ဖျော့ဆုံး" / ရက် ၄ padauk များ — **မလုပ်သေး** (T5/T6)

### ၄။ အဆောက်အအုံ ၄ ဘက်
- `yangon/set.js` code-built အဆောက်အအုံ: ဆိုင်းဘုတ်/ပြတင်း/အစွန်းအထင်း ရှေ့မျက်နှာစာ တစ်ဖက်တည်း → ၄ ဘက်လုံး (ဘေး/နောက် = ပြတင်း + ပိုက်/ရေတိုင်ကီ/လျှော်ထားတဲ့ အဝတ် — ရှေ့ထက် ရိုးရိုး)
- **hero အဆောက်အအုံ ၃ ခု glTF** (`art/building.py` ပုံစံ ထပ်ရေး): မုန့်ဟင်းခါးဆိုင် + ဟင်းရွက်ဆိုင် (ဆိုင်ချင်းကပ်)၊ `{နာမည်}` အိမ်၊ မဏ္ဍပ် (ရက် ၁ ပုံ) — ကျန်တာ code-built ပဲ
- ကင်မရာ လှည့်ရင် ဘာမှ "အပေါက်" မမြင်ရ — ၄ ထောင့် screenshot

### ၅။ မလုပ်ရ
- navmesh/NPC လမ်းရှာ (life.js collide ဆက်သုံး — T3) · Rapier · ဇာတ်လမ်း · `chibi.js` `cast.js` `war.js`

### ✅ ပြီးတယ် ဆိုတာ
- `yangon.html` ရက် ၁ ရပ်ကွက် — ကင်မရာ လှည့်/zoom/ဖျော့ · ၄ ထောင့် screenshot · ကောင်းကင် afternoon/dusk/night ၃ ပုံ (`setTime`)
- ရှိပြီးသား ရက် ၁ mission (ပုံးဆွဲ၊ ကြောင်ချော့၊ မီးသီး၊ ဆိုင်းဘုတ်) **ကင်မရာ အသစ်နဲ့ ဆက်ကစားလို့ရ** — တစ်ခုချင်း စမ်းပြီး မှတ်
- PALETTE: ရေ = `#3fd3e0` တစ်ခုတည်း အေး — screenshot မှာ ရေက ပေါ်လွင်
- laptop 60fps (Browser pane) · ဖုန်း ≥ 30fps (ဖန်တီးသူ Pages မှာ စစ်) · console error 0
- camlab.html က `camera.js` / `sky.js` / `palette.js` ကို import ပြောင်းပြီး ဆက်အလုပ်လုပ် (copy မကျန်)
- `docs/plans/T2.md` + PR

## T4 ကောက်-သယ်-ချ system

**ရည်ရွယ်ချက်** — SCENARIO v6 ရဲ့ mission ၇ ခုလုံး "တစ်ခုခု သယ်" (ပိုက်ဆံအိတ်၊ ဆေး၊ အဝတ်၊ ရေခဲ၊ ဖလား၊ ပူဖောင်း) ဖြစ်လို့ **တစ်ခါ ဆောက် အကုန် သုံး**တဲ့ system။ Go-Go Town! ရဲ့ ကောက်-ခေါင်းပေါ် သယ်-ချ ပုံစံ။ ကင်မရာနဲ့ မဆိုင်လို့ T1/T2 မစောင့်ဘဲ စလို့ရ။

**ဖိုင်** — `carry.js` (module: API) · `carry-lab.html` (စမ်းကွင်း) · `chibi.js` (socket + carry pose — ရှိပြီးသား animation မပျက်ရ) · `yangon/life.js` ရဲ့ စက်ဘီးကို rack ပါတဲ့ variant (ဖိုးကျော်)။ `world.js` / ဂိမ်း flow မထိ။ Branch `claude/carry`။

### ၁။ ပစ္စည်း (item) = data

```js
{ id:'ice', name:'ရေခဲတုံး', size:'head', weight:.8, melt:90, wet:true }
// size: hand (ပိုက်ဆံအိတ်၊ ခဲတံ၊ ဆေးဗူး) · front (ဖလား၊ အဝတ်ခြင်း၊ ပုံး — လက်နှစ်ဖက် ရင်ဘတ်ရှေ့) · head (ရေခဲတုံး၊ ရေပုံး — ခေါင်းပေါ် ရွက်) · bike (စက်ဘီးနောက် rack)
// weight 0..1 → ပြေးနှုန်း ×(1 − .4·weight)၊ ခုန် မရ (weight > .5)
// melt: စက္ကန့် (null = မပျော်) · wet: ရေထိရင် texture စို
```
စမ်းကွင်း item ၆ ခု: ပိုက်ဆံအိတ် (hand .1)၊ ငွေဖလား (front .3)၊ အဝတ်ခြင်း (front .5)၊ ရေပုံး (head .6, wet)၊ ရေခဲတုံး (head .8, melt 90)၊ ပူဖောင်း (hand .05 — ပစ်လို့ရ)။

### ၂။ Socket ၄ ခု (chibi.js)
`handR` (ရှိပြီး — prop က လက်ဖျံအတိုင်း ထွက်) · 🆕 `chest` (spine ရှေ့ — cast.js က notebook ကို spine မှာ ချိတ်တဲ့ နည်း ပုံသေ လုပ်) · 🆕 `head` (ခေါင်းထိပ်၊ hunch/size အလိုက်) · 🆕 `back` (ကျောပိုး — ဆီပုံး ရှိပြီး)။ Socket = Object3D pivot ပေါ် child; animation နဲ့ အတူ လိုက်။

### ၃။ လက် IK
Rig က `THREE.Skeleton` သုံးထား (chibi.js:438) → `CCDIKSolver` သုံးလို့ရ **ဒါပေမဲ့ လက် = ပခုံး-တံတောင်-လက် ၂ ဆစ်ပဲ** မို့ analytic two-bone IK (~၃၀ ကြောင်း) က ပိုရိုးရှင်း၊ ပိုတည်ငြိမ်။ Plan ထဲ ဘယ်ဟာ ရွေးလဲ ပြော။ သုံးတဲ့နေရာ: ကောက်တဲ့ .35s (လက် item ဆီ ရောက်)၊ `front` ကိုင်တုန်း လက်နှစ်ဖက် item ဘေး၊ `head` ကိုင်တုန်း လက်တစ်ဖက် ထောက်၊ ကမ်းပေးတုန်း လက် တစ်ဖက်ဆီ ဆန့်။

### ၄။ State + animation
| state | ဖြစ်ပုံ |
|---|---|
| `pickup` | item ၁ m အတွင်း → highlight ring + ခလုတ် 「ကောက်」 → ကိုယ် ကုန်း (`bow` ပုံစံ .35s)၊ item world → socket lerp၊ ပြီးရင် carry |
| `carry` | loop variant: idle/walk/run **× size ၃ မျိုး** (hand = ပုံမှန် · front = လက် ရင်ဘတ်ရှေ့၊ ကိုယ် နည်းနည်း နောက်လန် · head = လက်တစ်ဖက် ထောက်၊ ခေါင်း ငြိမ်၊ ကိုယ် ယိမ်း) · weight အလိုက် ခြေလှမ်း နှေး |
| `drop` | 「ချ」 → မြေပေါ် (ရှေ့ .5 m) · target socket ရှိရင် 「တင်」 (မဏ္ဍပ် စင်၊ စက်ဘီး rack) · ကလေး တစ်ယောက် ၁ m အတွင်း ဆို 「ပေး」 (hand-off: ၂ ယောက်လုံး လက် ဆန့်၊ item ကူး) |
| `throw` | hand/front item ပဲ: `bigthrow` (CHARACTERS §၁) → ballistic (cast.html lob လို — Rapier hook ထားပေး: `onThrow(item, vel)`) |
| `hit` | **ရေပက်ခံရရင်** `head` item ယိမ်း (wobble)၊ ၃ ချက် ထိ → ကျ (ပြန်ကောက်ရ) · `front` item ၅ ချက် · `hand` မကျ — ဒါက ရေစစ်နဲ့ သယ်တာ ချိတ်တဲ့ နေရာ (M7 ရေခဲ သယ်) |

### ၅။ ရေခဲ timer
`melt` ရှိတဲ့ item: HUD bar + mesh scale ၁ → .3 + အောက်က ရေစက် particle (three.quarks မရှိသေးရင် sphere ၃ လုံး) · ပျော်ကုန်ရင် item ပျောက် + 「ရေခဲ ကုန်ပြီ」 · အရိပ်ထဲ (building AABB အောက်) ဆို ×.5 နှေး 💭

### ၆။ ဖိုးကျော့် စက်ဘီး
life.js စက်ဘီး + 🆕 နောက် rack socket (item ၁ ခု **ဒါမှမဟုတ်** ကလေး ၁ ယောက် ထိုင် — ၄-၆) · ကစားသူ စီးလို့ရ (ခလုတ် 「စီး」 — မြန်နှုန်း ×၁.၈၊ ချိုး ကျယ်၊ ဘဲလ်) · rack item ရှိရင် ယိမ်း · ပက်ခံရရင် rack item ၃ ချက် → ကျ

### စမ်းကွင်း (`carry-lab.html`)
ကြမ်းပြင် ၂၀×၂၀ · ကစားသူ + ဖိုးကျော် (NPC၊ စက်ဘီးနဲ့) + မေသူ (hand-off target) · item ၆ ခု · မဏ္ဍပ် စင် (target socket) · ④ ကလေး ၂ ယောက် ပူဖောင်း ပစ်နေ (war.js ရဲ့ hit ကို ခေါ် — hit state စမ်းဖို့) · ခလုတ် ဗမာလို · 375px ရ။ `window.carry = { player, items, pick(id), drop(), give(), throw() }` debug hook (ship မလုပ်ခင် ဖြုတ်)။

### ✅ ပြီးတယ် ဆိုတာ
- item ၆ ခုလုံး ကောက်/သယ်/ချ/တင်/ပေး ရ၊ size ၃ မျိုး pose **ကြည့်ရုံနဲ့ ကွဲ** (screenshot ၃ ပုံ)
- ရေခဲ ၉၀ စက္ကန့် ပျော်၊ bar + scale + ကုန်ရင် ပျောက်
- ပက်ခံရရင် head item ၃ ချက် ကျ (screenshot)
- စက်ဘီး rack ပေါ် item/ကလေး တင်ပြီး စီး (screenshot)
- ရှိပြီးသား animation (cast.html tic ၂၀ ကျော်) **မပျက်** — cast.html ဖွင့် စစ်
- console error ၀၊ laptop 60fps၊ `docs/plans/T4.md` + PR

### မလုပ်ရ
`world.js` · ဂိမ်း flow · Rapier ထည့်တာ (T1 က ထည့်မယ် — hook ပဲ ထား) · ပြောမှ commit

---

## T3 ရေပက် core loop

**ရည်ရွယ်ချက်** — ရက် ၄ ဇာတ်လမ်း scene မဆောက်ခင် **ပက်ရတာ လက်ထဲ ကောင်းမကောင်း** ချိန်။ `war.js` ပေါ် ထပ်ဆောက်။ T2 ကင်မရာ ပြီးမှ (လှည့်ရင်း ချိန်ပစ်)။

**Library** — **three.quarks** (particle + browser VFX editor → JSON; ပြွတ် ရေလုံး + ribbon trail၊ ပူဖောင်း ပေါက် ရေစက်၊ ပုံး ရေကူး) · `DecalGeometry` (three addons — နံရံ/ကြမ်း/ဇာတ်ကောင်ပေါ် ရေစို အကွက်) · ground **wet-map** (RenderTarget ပေါ် စက်ဝိုင်း ဆွဲ၊ ကြာရင် ခြောက် — ~၄၀ ကြောင်း၊ library မလို) · `Water2` (ချောင်း၊ ရေစည်) · Vibration API (Android ၃၀ms)။ **မသုံး**: postprocessing (ဖုန်း လေး — T3 ပြီးမှ ပြန်စဉ်းစား)၊ fluid sim၊ three-nebula။

**ခံစားမှု checklist (၅ ချက်လုံး ရှိမှ ✅)**
1. **ထိတဲ့ခဏ** — hit-stop ~၄၀ms · ကင်မရာ ခဏ ယိမ်း · ခံရသူ squash · `drop` emote · `splat` အသံ
2. **လက်နက် ၃ မျိုး လက်ထဲ မတူ** — ပြွတ် = ဖြောင့်/မြန်/ရေ ကုန်မြန် · ပူဖောင်း = ကွေး၊ ထောင့်ချိုး ကျော်၊ ကျတဲ့နေရာ ဝိုင်းစို · ပုံး = နီး၊ ကျယ်၊ တစ်ခါတည်း ကုန်
3. **ရေ ကုန်/ဖြည့်** — ကျောပိုးပုံး HUD ကျ · ကုန်ခါနီး ပြွတ်က စက်စက် ကျ (particle နည်း) · ရေစည်မှာ ဖြည့် `glug` + ပုံး ပြန်ပြည့်
4. **ရွှဲတာ မြင်ရ** — ဆံပင် ပြား/အင်္ကျီ ရင့် (ရှိပြီ) + ကြမ်းပြင် wet-map + ပစ်မှတ်ပေါ် decal
5. **ချိန်ပစ်** — ကင်မရာ လှည့်ရင်း reticle၊ ထောင့်ချိုး ကျော် ပူဖောင်း arc ပြ

**စစ်ဆေးပုံ** — ဖုန်း (375px) မှာ ၁၀ ယောက် တစ်ပြိုင်နက် ပက်ရင် 30fps အောက် မကျ · ကစားသူ ၂ မိနစ် ပက်ပြီး 「ထပ်ပက်ချင်သေးလား」 — ဒါ ဖန်တီးသူ ကိုယ်တိုင် ဆုံးဖြတ်။

---

## Task တစ်ခုရဲ့ သွားပုံ (task တိုင်း တူ)

```
spec (Fable, TASKS.md) → plan (အခြား model, docs/plans/T<n>.md) → plan review (Fable) → code (branch claude/<task>) → PR → review (Fable) → merge (ဖန်တီးသူ)
```

**Plan အရင်၊ code နောက်** — code မရေးခင် `docs/plans/T<n>.md` (½ စာမျက်နှာ၊ ဗမာလို) ရေး: ဘယ်ဖိုင် အသစ်/ပြင်၊ library ဘယ်လို ချိတ်၊ အဆင့် ၅–၈ ခု၊ မသေချာတာ/မေးစရာ။ Fable က plan ကို ကြည့်ပြီး OK ပေးမှ code စ (code review ထက် plan review က ပေါ့လို့ — လမ်းမှားရင် ဒီမှာ တားမယ်)။ Plan ကို branch ထဲ commit ပြီး PR ထဲ ပါစေ။

## Review လုပ်ပုံ (Fable)

PR: base `main` ← head `claude/<task>`။ Plan ပြီးရင် 「plan review」၊ PR ဖွင့်ပြီးရင် 「review」 လို့ ပြောရုံ။

1. **Code ဖတ်** — `gh pr diff` နဲ့ diff တစ်ခုလုံး။ `docs/plans/T<n>.md` နဲ့ ကိုက်မကိုက်။ TASKS.md ရဲ့ spec အပိုင်းတိုင်း ရှိ/မရှိ၊ 「မလုပ်ရ」 စာရင်း မထိဘူး ဆိုတာ
2. **ကိုယ်တိုင် run** — branch ကို worktree ထဲ checkout (`git worktree add ../<task> claude/<task>`)၊ preview ဖွင့်ပြီး in-app Browser pane မှာ စမ်း။ Console error၊ FPS၊ 375px layout
3. **ဒီဇိုင်းနဲ့ တိုက်** — SCENARIO v6 / CHARACTERS / DIRECTION နဲ့ ကိုက်မကိုက်၊ နောက် task တွေ ဒီအပေါ် ဆောက်လို့ ရမရ
4. **Review ရေး** — `gh pr review` နဲ့ PR ပေါ် comment (line အလိုက်)။ TASKS.md ထဲ အခြေအနေ 👀 → ✅ ဒါမှမဟုတ် ပြင်ရန် စာရင်း
5. ပြင်စရာ ရှိရင် အခြား model က **အဲဒီ branch မှာပဲ** ပြင် → Fable ထပ်စစ် → OK မှ **ဖန်တီးသူ** merge (squash) → Pages live

Fable က code မရေး၊ merge မလုပ် — review comment နဲ့ TASKS.md အခြေအနေ၊ နောက် task ရဲ့ spec ပဲ။

---

## T1 camlab — Go-Go Town! ပုံစံ ကင်မရာ + library ၃ ခု prototype

**ရည်ရွယ်ချက်** — ဂိမ်းအစစ် (`world.js`) ကို မထိဘဲ၊ စာမျက်နှာ တစ်ခုတည်းမှာ အောက်က ၄ ချက် အလုပ်လုပ်မလုပ်၊ ဖုန်းမှာ ပေါ့မပေါ့ စမ်း။ ဒါ ကြည့်ပြီးမှ ဂိမ်းအစစ်ကို ပြောင်းမယ်။

**ဖိုင်** — `camlab.html` (+ လိုရင် `camlab.js`)၊ `art/building.py` (Blender script)၊ `art/shop.glb`။ Library တွေကို ရှိပြီးသား စာမျက်နှာတွေလို CDN importmap နဲ့ (three 0.170 jsdelivr + `@dimforge/rapier3d-compat` + `three-pathfinding` + `three/addons/loaders/GLTFLoader.js`)။ build tool မသုံး။

**စမ်းကွင်း** — ကြမ်းပြင် ~40×40၊ box အဆောက်အအုံ အနည်းငယ်၊ ချောင်း အစင်း ၁ ခု၊ တံတား ၁ ခု။ ကစားသူက `./chibi.js?v=30` ရဲ့ `makeChibi` / `ChibiAnimator` chibi (`cast.js` ကို နမူနာ ယူ)။

### ၁။ ကင်မရာ
- Perspective။ ကစားသူနောက် lag နဲ့ လိုက်
- **၄၅° snap** လှည့် (ခလုတ် + ဘေးတိုက် drag)၊ smooth tween။ pinch / wheel zoom
- ကင်မရာနဲ့ ကစားသူကြား ပိတ်နေတဲ့ အဆောက်အအုံ **ဖျော့** (raycast → opacity ~.25)
- ကောင်းကင်/နေ — လှည့်လည်း မှန်ရမယ်။ `world.js` ရဲ့ canvas gradient + screen နေရာ ပုံသေ နေ ပုံစံက လှည့်ရင် ပျက်လို့ **ဒီမှာ မသုံး** — sky dome ဒါမှမဟုတ် ကင်မရာ azimuth အလိုက် နေ ရွှေ့
- ကစားသူ ရွေ့တာ keyboard / joystick — **ကင်မရာ ဦးတည်ချက်နဲ့ ဆက်စပ်**

### ၂။ Rapier (physics)
- ကြမ်းပြင်၊ တံတား လက်ရန်း၊ ချောင်း = collider
- **ငွေဖလား** (cylinder အသေး) rigid body — ခလုတ် နှိပ်ရင် ကစားသူ လက်ထဲက ပစ်၊ ခုန်၊ တံတားက ချောင်းထဲ ကျ → ဘယ် zone ကျလဲ စာ ပြ (SCENARIO ၄-၄ အတွက်)
- ရေပူဖောင်း **၁၀ လုံး** တစ်ပြိုင်နက် ချ — ဖုန်း performance စစ်

### ၃။ three-pathfinding
- စမ်းကွင်းအတွက် navmesh (အဆောက်အအုံ + ချောင်း ဖယ်၊ တံတား ပါ) → Zone
- NPC chibi **၃ ယောက်** — နှိပ်/tap တဲ့ နေရာဆီ အဆောက်အအုံ ပတ်ပြီး၊ တံတား ကျော်ပြီး လမ်းလျှောက်

### ၄။ glTF (Blender → three)
- `art/building.py` — Blender python: ၄ ဘက်လုံး ဆိုင်းဘုတ် ပါတဲ့ ဆိုင်အိမ် ၁ လုံး ထုတ်ပြီး `art/shop.glb` export
- Blender မရှိရင် three ရဲ့ `GLTFExporter` နဲ့ code ကနေ `.glb` ထုတ်ပြီး အဲဒီလို လုပ်ထားကြောင်း မှတ်
- ကွင်းထဲ ထည့် — ကင်မရာ လှည့်ရင် ၄ ဘက်လုံး မြင်ရ

### စစ်ဆေးပုံ
- Preview `thingyan` (port 8790)၊ in-app Browser pane — Chrome အစစ် မသုံး
- Console error **၀**
- Screenshot: လှည့်ထားတဲ့ ထောင့် ၂ ခု · ဖလား ချောင်းထဲ · NPC လမ်း · glTF ဆိုင် ၂ ထောင့်
- Laptop FPS + ဖုန်းအတွက် လေးမယ့် အချက် မှတ်
- `camlab.html` ထိပ်မှာ comment: library တစ်ခုချင်း KB ဘယ်လောက်၊ တွေ့တဲ့ ပြဿနာ (ဗမာလို)
- ခလုတ် စာသား ဗမာလို (`cast.html` လို)၊ 375px မှာ ရ

### မလုပ်ရ
- `world.js`၊ `yangon/*`၊ ဂိမ်းအစစ် မထိ
- ပြောမှ commit

### ဆောက်ပြီး ရလဒ် (👀 review စောင့်)
- ၄ ချက်လုံး ရှိ — `camlab.html` / `camlab.js` · `art/building.py` (Blender 4.2 နဲ့ တကယ် run) → `art/shop.glb` · ဆိုင်းဘုတ် စာ `art/signs.html` → `art/signs/*.png`
- library အရွယ်အစား၊ တွေ့တဲ့ ပြဿနာ ၁၂ ချက် → `camlab.html` ထိပ်က comment
- screenshot → `docs/camlab/*.jpg` (လှည့်ထောင့် ၂ · ဖလား လေထဲ/ဝါးတိုင်မှာ ငြိ · လက်ရန်း+ရေပူဖောင်း · ချောင်းထဲ ကျ · NPC လမ်း · ဆိုင် ၂ ဘက် · အဆောက်အအုံ ဖျော့ · ဖုန်း 375px)၊ ပြန်စစ်ရင် `node docs/camlab/check.cjs`
- Console error ၀ (warning ၂ မျိုး — Rapier init, chibi.js ရှိပြီးသား)
- **Laptop / ဖုန်း FPS မတိုင်းရသေး** — container မှာ GPU မရှိ။ fps စာတန်းကို စက်အစစ်မှာ ကြည့်ရန်

### ပြီးရင် (Fable review)
- ၄ ချက်လုံး ရှိ/မရှိ · ဖုန်း performance · SCENARIO v6 ၄-၄/၄-၅ (ဖလား ချောင်းထဲ၊ ၁၀ ယောက် ဆယ်) ဒီ engine နဲ့ ဆောက်လို့ ရမရ · ဂိမ်းအစစ်ကို ပြောင်းမယ့် အစီအစဉ် (T2) ရေး
