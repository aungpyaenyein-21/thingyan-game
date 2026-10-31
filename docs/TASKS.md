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
| T4 | ကောက်-သယ်-ချ system (ခေါင်းပေါ်/လက်ထဲ/စက်ဘီးနောက်၊ ရေခဲ timer) · **`CCDIKSolver`** (three addons — လက်ကို ပစ္စည်းဆီ IK၊ ဖလား ကမ်း၊ `pour`) — T3 နဲ့ ပြိုင်လုပ်လို့ရ | ⏳ | — |
| T5 | ရက် ၁ — ရက်စဉ် စည်းချက်၊ M1–M3၊ ၁-၇ ဖလား ပစ်လွတ်၊ မဏ္ဍပ် ကြီးလာ | ⏳ | — |
| T6 | ရက် ၂ + ၃ — M4–M7၊ ဖိုးဝ၊ ဖလားဦးထုပ်၊ ရေဒီယို | ⏳ | — |
| T6.5 | **Pose/tic editor** — `cast.html` ပေါ် ထပ်ဆောက်: pivot ထောင့် slider၊ keyframe → JSON၊ chibi.js က JSON tic ဖတ်။ Blender/Mixamo မသုံး (ကိုယ်ပိုင် rig၊ browser ထဲ ချိန်) | ⏳ | — |
| T7 | ဇာတ်ကောင် အကျင့် ဂိမ်းထဲ (CHARACTERS §၁၃) + Prologue/နိဂုံး — T6.5 editor နဲ့ ချိန် | ⏳ | — |

အစဉ်: T1 → T2 → (T3 ∥ T4) → T5 → T6 → T6.5 → T7။ Library ဆုံးဖြတ်ချက် (2026-10-31): Yuka ✅ · CCDIKSolver ✅ · GSAP ✕ · Mixamo/VRoid/Cascadeur ✕ (chibi ပုံစံ ပျက်) · KayKit/Kenney/Quaternius CC0 pack = အဆောက်အအုံ/ကား/ပစ္စည်း အတွက်ပဲ (T2)၊ ဇာတ်ကောင် ✕။ Spec ကို အရှေ့ task ရဲ့ review ပြီးမှ ရေး (ရလဒ်ပေါ် မူတည်လို့)။

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
