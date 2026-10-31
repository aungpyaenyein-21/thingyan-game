# သင်္ကြန်ပွဲ · Task စာရင်း

> **အခန်းကဏ္ဍ** — ဒီဇိုင်း/အတည်ပြု/review = Fable (ဒီစာ ရေးသူ)။ **ဆောက်တာ = အခြား model session**။ Task တစ်ခု ပြီးရင် အခြေအနေ ပြောင်းပြီး Fable က review လုပ်။
> ဒီဇိုင်းစာ: [DIRECTION.md](../DIRECTION.md) · [SCENARIO.md](../SCENARIO.md) (v6 ငွေဖလား — ပုံသေ) · [CHARACTERS.md](../CHARACTERS.md)
> အခြေအနေ: ⏳ မစသေး · 🔨 ဆောက်နေ · 👀 review စောင့် · ✅ ပြီး
> **ပင်မ မူ (ဖန်တီးသူ 2026-10-31): ဒီဂိမ်းရဲ့ အဓိကက ရေပက်တာ။** Mission တိုင်း၊ scene တိုင်း ရေပက်တာ ပါရမယ် — ရေ မပါတဲ့ mission မထည့်ရ (SCENARIO M1 ပုံးဆွဲ၊ M2 ကြောင်ချော့ ကို ရေပါအောင် ပြင်ရန် 💭)။ Library/feature ရွေးရင် 「ရေပက်ခံစားမှု ပိုကောင်းလား」 ကို အရင် မေး။
> **Branch စည်းကမ်း** — `main` ကို တိုက်ရိုက် မရေး။ Task တစ်ခု = branch တစ်ခု `claude/<task>` (T1 = `claude/camlab`)၊ worktree သီးသန့်။ ပြီးရင် PR ဖွင့် → Fable review → ပြင်စရာ ရှိရင် အဲဒီ branch မှာပဲ ပြင် → OK မှ `main` ထဲ merge (squash) — **ပြဿနာ မရှိရင် Fable ကိုယ်တိုင် merge လုပ်လို့ရ** (ဖန်တီးသူ ခွင့်ပြုချက် 2026-10-31)။ Push: `gh auth switch --user aungpyaenyein-21` → push → `gh auth switch --user Aung-Pyae-Nyein`။ Pages က `main` ကနေ ထွက်လို့ merge မှ live ဖြစ်မယ်။

| # | task | အခြေအနေ | ဘယ်သူ |
|---|---|---|---|
| T1 | [camlab — Go-Go Town! ပုံစံ ကင်မရာ + library ၃ ခု prototype](#t1-camlab) | ✅ 2026-10-31 (PR #28) | အခြား model |
| T2 | [ဂိမ်းအစစ် ကင်မရာ ပြောင်း + PALETTE](#t2-ဂိမ်းအစစ်-ကင်မရာ-ပြောင်း--palette) — `world.js`/`yangon/*` ကို camlab ကင်မရာ၊ sky dome၊ ဖျော့၊ `palette.js`၊ ① အဆောက်အအုံ ၄ ဘက် | ⏳ spec ✅ · plan 👀 [plans/T2.md](plans/T2.md) | အခြား model · branch `claude/camera` |
| T3 | **ရေပက် core loop** + ရက် ၄ vertical slice — ပက်ရတာ ကောင်းအောင် အရင် (→ [T3 အသေးစိတ်](#t3-ရေပက်-core-loop))၊ ပြီးမှ တံတားထိပ် ၅v၅ → ဖလား ချောင်းထဲ → ၁၀ ယောက် ဆယ် → ၅ နာရီ ပြေး → ရေသွန်း · **Yuka** (NPC steering/flock) · **three.quarks** (particle + editor) | ⏳ | — |
| T4 | [ကောက်-သယ်-ချ system](#t4-ကောက်-သယ်-ချ-system) (လက်/ရင်ဘတ်/ခေါင်းပေါ်/စက်ဘီးနောက်၊ ရေခဲ timer၊ ပက်ခံရရင် ကျ) · arm IK | ✅ 2026-10-31 (PR #29) | အခြား model |
| T5 | ရက် ၁ — ရက်စဉ် စည်းချက်၊ M1–M3၊ ၁-၇ ဖလား ပစ်လွတ်၊ မဏ္ဍပ် ကြီးလာ | ⏳ | — |
| T6 | ရက် ၂ + ၃ — M4–M7၊ ဖိုးဝ၊ ဖလားဦးထုပ်၊ ရေဒီယို | ⏳ | — |
| T6.5 | **Pose/tic editor + face editor** — `cast.html` ပေါ် ထပ်ဆောက်: pivot ထောင့် slider၊ keyframe → JSON၊ chibi.js က JSON tic ဖတ် · **face**: expression = data ၄ ပိုင်း (eyes/brows/mouth/extra)၊ 🆕 part ၁၄ ခု ဆွဲ၊ `FACE` table ၁၀ ခု၊ `anim.face(name, sec)`၊ blink-cut — spec [CHARACTERS §၁၄](../CHARACTERS.md#၁၄-မျက်နှာ-expression-v12--2026-10-31)။ Blender/Mixamo မသုံး | ⏳ | — |
| T7 | ဇာတ်ကောင် အကျင့် ဂိမ်းထဲ (CHARACTERS §၁၃) + Prologue/နိဂုံး — T6.5 editor နဲ့ ချိန် | ⏳ | — |

အစဉ်: T1 → T2 ∥ T4 (ဖိုင် မထပ်: T2 = world/yangon/art, T4 = chibi/cast/carry/bike) → T3 → T5 → T6 → T6.5 → T7။ Library ဆုံးဖြတ်ချက် (2026-10-31): Yuka ✅ · CCDIKSolver ✅ · GSAP ✕ · Mixamo/VRoid/Cascadeur ✕ (chibi ပုံစံ ပျက်) · KayKit/Kenney/Quaternius CC0 pack = အဆောက်အအုံ/ကား/ပစ္စည်း အတွက်ပဲ (T2)၊ ဇာတ်ကောင် ✕။ Spec ကို အရှေ့ task ရဲ့ review ပြီးမှ ရေး (ရလဒ်ပေါ် မူတည်လို့)။

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

### ✅ ရလဒ် (Fable review 2026-10-31 · PR #29 merge)
- `carry.js` (ITEMS data ၆ ခု၊ procedural mesh၊ PALETTE) · `bike.js` (rack + `seatOn`) · `carry-lab.html` · chibi.js socket ၅ ခု + `anim.load` + `anim.reach` IK (swing+twist quaternion) + one-shot `pick`/`bigthrow` · `chibi.js?v=31`
- စစ်ပြီး: pose ၃ မျိုး ကွဲ · drop/place(rack)/give(မေသူ)/throw(burst) · head item ၃ ချက် ကျ · ရေခဲ ၉၀ s · စက်ဘီး စီး · cast.html ၁၃ ယောက် regression error 0 · 60 fps · 375px
- T3 ထဲ ယူသွားတာ: war.js `hit()` → `carry.hit(k)` ၁ ကြောင်း · life.js → bike.js ပြောင်းသုံး · `hold` HUD item ကျရင် text ရှင်း · `item.shade` 💭

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
