# သင်္ကြန်ပွဲ · Task စာရင်း

> **အခန်းကဏ္ဍ** — ဒီဇိုင်း/အတည်ပြု/review = Fable (ဒီစာ ရေးသူ)။ **ဆောက်တာ = အခြား model session**။ Task တစ်ခု ပြီးရင် အခြေအနေ ပြောင်းပြီး Fable က review လုပ်။
> ဒီဇိုင်းစာ: [DIRECTION.md](../DIRECTION.md) · [SCENARIO.md](../SCENARIO.md) (v6 ငွေဖလား — ပုံသေ) · [CHARACTERS.md](../CHARACTERS.md)
> အခြေအနေ: ⏳ မစသေး · 🔨 ဆောက်နေ · 👀 review စောင့် · ✅ ပြီး
> **ပင်မ မူ (ဖန်တီးသူ 2026-10-31): ဒီဂိမ်းရဲ့ အဓိကက ရေပက်တာ။** Mission တိုင်း၊ scene တိုင်း ရေပက်တာ ပါရမယ် — ရေ မပါတဲ့ mission မထည့်ရ (SCENARIO M1 ပုံးဆွဲ၊ M2 ကြောင်ချော့ ကို ရေပါအောင် ပြင်ရန် 💭)။ Library/feature ရွေးရင် 「ရေပက်ခံစားမှု ပိုကောင်းလား」 ကို အရင် မေး။
> **Branch စည်းကမ်း** — `main` ကို တိုက်ရိုက် မရေး။ Task တစ်ခု = branch တစ်ခု `claude/<task>` (T1 = `claude/camlab`)၊ worktree သီးသန့်။ ပြီးရင် PR ဖွင့် → Fable review → ပြင်စရာ ရှိရင် အဲဒီ branch မှာပဲ ပြင် → OK မှ `main` ထဲ merge (squash)။ Push: `gh auth switch --user aungpyaenyein-21` → push → `gh auth switch --user Aung-Pyae-Nyein`။ Pages က `main` ကနေ ထွက်လို့ merge မှ live ဖြစ်မယ်။

| # | task | အခြေအနေ | ဘယ်သူ |
|---|---|---|---|
| T1 | [camlab — Go-Go Town! ပုံစံ ကင်မရာ + library ၃ ခု prototype](#t1-camlab) | 🔨 | အခြား model · branch `claude/camlab` |
| T2 | ဂိမ်းအစစ် ကင်မရာ ပြောင်း (`world.js` perspective + လှည့် + ဖျော့ + sky dome၊ ① အဆောက်အအုံ ၄ ဘက်) + **အရောင် [PALETTE.md](PALETTE.md) အတိုင်း ပြန်ဆေး** (`palette.js` token ဖိုင်) | ⏳ (T1 review ပြီးမှ spec) | — |
| T3 | **ရေပက် core loop** + ရက် ၄ vertical slice — ပက်ရတာ ကောင်းအောင် အရင် (→ [T3 အသေးစိတ်](#t3-ရေပက်-core-loop))၊ ပြီးမှ တံတားထိပ် ၅v၅ → ဖလား ချောင်းထဲ → ၁၀ ယောက် ဆယ် → ၅ နာရီ ပြေး → ရေသွန်း · **Yuka** (NPC steering/flock) · **three.quarks** (particle + editor) | ⏳ | — |
| T4 | [ကောက်-သယ်-ချ system](#t4-ကောက်-သယ်-ချ-system) (လက်/ရင်ဘတ်/ခေါင်းပေါ်/စက်ဘီးနောက်၊ ရေခဲ timer၊ ပက်ခံရရင် ကျ) · arm IK — T1/T2 မစောင့်ဘဲ စလို့ရ | ⏳ spec ✅ · plan 👀 [plans/T4.md](plans/T4.md) | အခြား model · branch `claude/carry` |
| T5 | ရက် ၁ — ရက်စဉ် စည်းချက်၊ M1–M3၊ ၁-၇ ဖလား ပစ်လွတ်၊ မဏ္ဍပ် ကြီးလာ | ⏳ | — |
| T6 | ရက် ၂ + ၃ — M4–M7၊ ဖိုးဝ၊ ဖလားဦးထုပ်၊ ရေဒီယို | ⏳ | — |
| T6.5 | **Pose/tic editor + face editor** — `cast.html` ပေါ် ထပ်ဆောက်: pivot ထောင့် slider၊ keyframe → JSON၊ chibi.js က JSON tic ဖတ် · **face**: expression = data ၄ ပိုင်း (eyes/brows/mouth/extra)၊ 🆕 part ၁၄ ခု ဆွဲ၊ `FACE` table ၁၀ ခု၊ `anim.face(name, sec)`၊ blink-cut — spec [CHARACTERS §၁၄](../CHARACTERS.md#၁၄-မျက်နှာ-expression-v12--2026-10-31)။ Blender/Mixamo မသုံး | ⏳ | — |
| T7 | ဇာတ်ကောင် အကျင့် ဂိမ်းထဲ (CHARACTERS §၁၃) + Prologue/နိဂုံး — T6.5 editor နဲ့ ချိန် | ⏳ | — |

အစဉ်: T1 → T2 → (T3 ∥ T4) → T5 → T6 → T6.5 → T7။ Library ဆုံးဖြတ်ချက် (2026-10-31): Yuka ✅ · CCDIKSolver ✅ · GSAP ✕ · Mixamo/VRoid/Cascadeur ✕ (chibi ပုံစံ ပျက်) · KayKit/Kenney/Quaternius CC0 pack = အဆောက်အအုံ/ကား/ပစ္စည်း အတွက်ပဲ (T2)၊ ဇာတ်ကောင် ✕။ Spec ကို အရှေ့ task ရဲ့ review ပြီးမှ ရေး (ရလဒ်ပေါ် မူတည်လို့)။

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

### ပြီးရင် (Fable review)
- ၄ ချက်လုံး ရှိ/မရှိ · ဖုန်း performance · SCENARIO v6 ၄-၄/၄-၅ (ဖလား ချောင်းထဲ၊ ၁၀ ယောက် ဆယ်) ဒီ engine နဲ့ ဆောက်လို့ ရမရ · ဂိမ်းအစစ်ကို ပြောင်းမယ့် အစီအစဉ် (T2) ရေး
