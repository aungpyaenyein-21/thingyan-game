# သင်္ကြန်ပွဲ · ကင်မရာ ဒီဇိုင်း (v1 — 2026-10-31)

> `camera.js` (T2) ရဲ့ ဒီဇိုင်းစာ။ T1 camlab ရဲ့ ဂဏန်းတွေကို အခြေခံ။ **ပုံစံ: Go-Go Town!** — follow + ကိုယ်တိုင် zoom (အခြေအနေ အလိုက်) + ကစားသူ လှည့်။ ကွဲလွဲရင် ဒီစာကို ယူ၊ ဂဏန်းက lil-gui `?tune` နဲ့ ချိန်ပြီး ဒီစာ ပြန်ပြင်။

## ၀။ မူ ၅ ချက်

1. **ကစားသူ ဘယ်တော့မှ frame ထဲက မထွက်** — follow က lag ရှိပေမဲ့ ၁ s အတွင်း ပြန်မီ
2. **ကင်မရာ ကိုယ်တိုင် လှည့်တာ မရှိ** — လှည့်တာ ကစားသူ (snap) နဲ့ ဇာတ်လမ်း scene ပဲ။ ဖုန်းမှာ ခေါင်းမူးတာ၊ ရေပက်ချိန်ပစ်ရင်း ပစ်မှတ် ရွေ့တာ ရှောင်
3. **Zoom က အခြေအနေ** — ပြေး/စီး = ဝေး၊ အခန်း/စကားပြော = နီး။ ကစားသူက offset ပဲ ထိန်း
4. **ပြောင်းတိုင်း lerp** — ခုန် မရှိ (room ဝင်/ထွက် ချွင်းချက်: cut)
5. **Roll မရှိ၊ FOV ပုံသေ** (landscape 40° · portrait 52°)

## ၁။ အခြေခံ ဂျီဩမေတြီ (camlab ကနေ)

```
target  = ကစားသူ (+ look-ahead) ကို lag နဲ့ လိုက်       k = 1 − e^(−dt·3.2)
az      = ကစားသူ ရွေးတဲ့ ထောင့်  (၄၅° snap)             k = 1 − e^(−dt·9)   (drag ထဲ: finger အတိုင်း)
dist    = clamp( (base + Σctx) × userZoom , 5, 24 )     k = 1 − e^(−dt·2)  (ဝေးသွားရင်) · 1 − e^(−dt·4) (နီးလာရင်)
elev    = .22 + .63 · ((dist − 5)/19)^.8                 ← နီးရင် ကောင်းကင် မြင်ရ၊ ဝေးရင် အပေါ်က ကြည့်
cam.pos = target + (sin az·cos elev, sin elev, cos az·cos elev) · dist
cam.lookAt(target + (0, .55, 0))
```
- ဝေးသွားတာ မြန် (ပြေးစ ချက်ချင်း ရှေ့ မြင်ရ)၊ နီးလာတာ နှေး (အခန်းဝင်ရင် ကပ်လာသလို) — Go-Go Town! ခံစားမှု
- `camBounds` → **target ကိုပဲ clamp**၊ ကင်မရာ မ clamp (နယ်စပ်မှာ လှည့်ရင် မခုန်)

## ၂။ Zoom အခြေအနေ (context)

| context | Δdist | elev | target | ဦးစားပေး | ဝင်/ထွက် အချက် |
|---|---|---|---|---|---|
| `idle` / `walk` | 0 (base 11) | curve | ကစားသူ | — | ပုံသေ |
| `run` | +3 | curve | + look-ahead ၂ m | ၁ | `anim.loop === 'run'` ≥ .3 s / ရပ်ရင် ၁ s ကြာမှ ပြန် |
| `ride` (စက်ဘီး) | +5 | curve + .1 | + look-ahead ၂.၅ m | ၂ | T4 `ride.on` |
| `war` (ရေပက်စစ် zone) | +2 | curve | ကစားသူ | ၃ | rules.js zone ထဲ |
| `talk` (hud.say ဖွင့်) | −4 | min .3 | **ကစားသူ ↔ NPC အလယ်**၊ az ကို NPC ဘေးဘက် ±၂၀° ထိ ဆွဲ (မျက်နှာ ၂ ခု မြင်ရ) | ၄ | `hud.busy()` |
| `room` (ဆိုင်/အိမ်ထဲ) | −5 (→ 6) | .35 ပုံသေ | အခန်း အလယ် | ၅ | `setRoom(r)` — **cut** (lerp မလုပ်)၊ az = `r.az` lock၊ လှည့် ပိတ် |
| `scene` (ဇာတ်လမ်း) | script | script | script | ၆ (အမြင့်ဆုံး) | `focus()` / `lock()` ခေါ်ချိန် · ပြီးရင် ရှေ့ context ပြန် |

- **ဦးစားပေး**: ဂဏန်း မြင့်တာ နိုင်။ `run` + `war` တစ်ပြိုင်နက် ဆို **ပေါင်း** (+5) — ဒီ ၂ ခုပဲ ပေါင်းလို့ရ၊ ကျန်တာ exclusive
- **userZoom** = ×.6 … ×1.6 (wheel `exp(ΔY·.0012)`၊ pinch၊ HUD ±)၊ context ပြောင်းလည်း **မပျောက်**၊ localStorage သိမ်း (`thingyan.zoom`)
- `room`/`scene` မှာ userZoom **မသုံး** (ဒီဇိုင်း ထားတဲ့ ပုံ)

## ၃။ ကြိုကြည့် (look-ahead)

- ရွေ့တဲ့ ဦးတည်ချက် × `L` (walk 1.2 m · run 2 m · ride 2.5 m) ကို target ပေါ် ပေါင်း၊ lerp `1 − e^(−dt·.5)` (၂ s လောက်)
- ရပ်ရင် ၀ ဆီ ပြန် (တူညီတဲ့ နှေးနှုန်း) — ကစားသူ screen အလယ် **အောက် ၄၀%** လောက် (ရှေ့ ပိုမြင်)
- ဘေးတိုက် ပြေးလှည့်ရင် look-ahead ကြောင့် ကင်မရာ ယိမ်းတာ ကြီးလွန်းရင် `L` ×.5 (`?tune`)

## ၄။ လှည့် (rotate)

- ၄၅° snap · ထောင့် ၈ ခု · ကစားသူ: HUD ◀ ▶ · keyboard Z / C · mouse ညာ-drag · ဖုန်း **ညာဘက် ခြမ်း** လက် ၁ ချောင်း ဘေးတိုက် drag (ဘယ်ခြမ်း = joystick)
- drag ထဲ: `az = azGoal − dx·.006` (finger အတိုင်း)၊ လွှတ်ရင် အနီးဆုံး snap
- **ရွေ့တာ = ပြနေတဲ့ az** (smoothed) ကို သုံး — snap tween အတွင်း joystick ဘက် မလွဲ
- ဆိုင်ထဲ/scene: ပိတ်
- auto-rotate **မရှိ** (`?tune` option ပဲ၊ ပုံသေ ပိတ်)

## ၅။ ပိတ်နေတဲ့ အဆောက်အအုံ (occlusion)

- ray ၂ ကြောင်း: cam → ကစားသူ ခြေ (.25) / ခေါင်း (.75) · ထိတဲ့ building → opacity .25 · lerp `1 − e^(−dt·10)`
- world.js `occluder()` ရဲ့ **ကြို clone ထားတဲ့ transparent material** သုံး — `needsUpdate` မသုံး (T1 review #1)
- `talk` ထဲမှာ NPC ဆီလည်း ray ၁ ကြောင်း (NPC မမြင်ရရင် ဖျော့)
- ကင်မရာက နံရံ **အတွင်း** ဝင်သွားရင် (dist ကြီး + building နီး) → dist ကို ထိတဲ့ အကွာ −.3 ထိ ချ (sphere-cast ရိုးရိုး) — ဒါ ၆ ထောင့် screenshot မှာ စစ်

## ၆။ ဇာတ်လမ်း scene API (`camera.js`)

```js
cam.focus(obj | Vector3, { dist, az, elev, t })  // target → obj၊ t s အတွင်း lerp · az/elev ပေးရင် lock
cam.lock(az)                                     // လှည့် ပိတ် + az ထား
cam.shake(amp, sec)                              // ထိတဲ့ခဏ (T3) — target offset noise၊ roll မပါ
cam.release()                                    // ကစားသူ ထိန်းချုပ်မှု ပြန်၊ ရှေ့ context + userZoom ပြန်
cam.context(name, on)                            // run/ride/war/talk — day.js, war.js, hud.js က ခေါ်
```
- ၁-၇ ဖလား လွင့်: `focus(bowl, {dist 7, t .4})` → ခြံစည်းရိုး ကျော်ရင် `focus(fence, {dist 10})` → ၁.၅ s → `release()`
- ၄-၄ ချောင်းထဲ ကျ: `focus(bowl, {dist 6, elev .25})` ချောင်း အထိ လိုက် → `release()`
- scene တိုင်း **၆ s ထက် မပို** ကင်မရာ ယူထားတာ (ကစားသူ ထိန်းချုပ်မှု ဆုံးရှုံးချိန် တို)

## ၇။ ဖုန်း

- portrait FOV 52° · dist base 11 → **12** (မြင်ကွင်း ကျဉ်းလို့)
- pixel ratio ≤ 1.5 · elevation curve တူ
- joystick ဘယ် / rotate drag ညာ / pinch ၂ ချောင်း — ဘယ်ခြမ်း drag ကို rotate အဖြစ် **မယူ**
- ဖုန်း testing: iPhone Safari (ဖန်တီးသူ) — ၆၀ fps မဟုတ်လည်း ကင်မရာ lerp dt-based မို့ ပုံ တူ

## ၈။ `?tune` (lil-gui) ဂဏန်း

`followK 3.2` · `azK 9` · `distOutK 2` · `distInK 4` · `base 11` · `run +3` · `ride +5` · `war +2` · `talk −4` · `room 6` · `lookWalk 1.2` · `lookRun 2` · `lookK .5` · `elevMin .22` · `elevMax .85` · `fade .25` · `autoRotate off` — JSON copy → ဒီစာ §၁–၃ ပြန်ပြင်

## ၉။ ✅ စမ်းသပ်ချက် (T2 review)

1. ရပ်ကွက် ၄ ထောင့် × dist 6/11/18 screenshot — ကစားသူ အမြဲ မြင်ရ၊ နံရံ မဖောက်
2. ပြေး → ၁ s အတွင်း ဝေးသွား၊ ရပ် → ၂ s အတွင်း ပြန်နီး — video/screenshot ၂ ပုံ
3. ဆိုင် ဝင်/ထွက် cut — ထွက်လာရင် userZoom ပြန်ရ
4. NPC နဲ့ စကားပြော — မျက်နှာ ၂ ခု frame ထဲ
5. စက်ဘီး စီး — ရှေ့ ၅ m မြင်ရ
6. snap tween အတွင်း joystick ရှေ့ ဖိထား — ကစားသူ ဖြောင့် ပြေး (ဘေး မလွဲ)
7. ဖုန်း 375: ဘယ် joystick + ညာ drag တစ်ပြိုင်နက် — ၂ ခုလုံး အလုပ်လုပ်
8. ၂ မိနစ် ကစားပြီး ခေါင်းမူးလား — ဖန်တီးသူ
