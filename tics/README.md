# tics/ — JSON tics and how to make one

ဇာတ်ကောင်ရဲ့ လှုပ်ရှားမှု (tic) တစ်ခုကို code မရေးဘဲ editor နဲ့ လုပ်၊ JSON ထုတ်၊ ဂိမ်းက chibi.js နဲ့ ပြန်ဖွင့်။
Make a tic in the editor instead of in code, export JSON, and the game plays it through chibi.js.

## ၁။ Editor ဖွင့် · Open the editor
`cast.html?edit` (နာမည်တစ်ခုပဲ ဖွင့်ချင်ရင် `?edit&c=ngazwe&tic=bow`). ဘယ်ဘက် = ဇာတ်ကောင် + tic စာရင်း၊ ညာဘက် = slider၊ အောက် = timeline။
Left: characters + tic list · right: sliders, key, props, save · bottom: transport + timeline. The **Faces** tab (top) edits `faces.json`.

## ၂။ ရေးပုံ · Author
1. `+ new from current pose` — နာမည်ပေး၊ key ၃ ခု (အစ / အလယ် / အဆုံး) ပေါ်။ · name it; three keys appear (start / middle / end).
2. Timeline ကို double-click = key အသစ်။ Dot ကို ဆွဲ = အချိန်ရွှေ့။ Slider ရွှေ့ = ဒီ key မှာ အဲဒီ channel ကို သတ်မှတ်။ · double-click the track to add a key, drag a dot to move it, move a slider to set that channel on the selected key.
3. `mirror L→R` ဘယ်လက်ကို ညာလက်ဆီ ကူး။ `×` = အဲဒီ channel ကို base loop ကို ပြန်ပေး။ · mirror copies one side to the other; `×` hands a channel back to the base loop.
4. Key တစ်ခုမှာ `face` (FACE နာမည် သို့ custom parts)၊ `ease` (`in out inout linear`)၊ `hold` ထည့်လို့ရ။ · each key can carry a face, an ease and `hold`.
5. Props / emit / show = ညာဘက်က JSON box (သို့ `+ prop at playhead`)။ · props / emit / show live in the JSON box on the right.

### Rules of the format (see TASKS.md T6.5 §1)
- `pose` keys = chibi.js `KEYS` (`armLx … spineRz sy x y headRx/Ry/Rz hipsRy/Rz handLz/Rz kneeL/R footL/R legLx/Lz/Rx/Rz elbowL/R hold`). A channel that no key names is the **base loop's** value, so a tic layers on idle / walk.
- A channel is a track made of the keys that name it. `"pose": {}` = **base anchor** (every channel is the base loop's value there). `"pose": {}` with `"hold": true` = every channel stays as it was. A key with **no `pose` at all** only changes the face.
- Before a channel's first key and after its last, it is the base loop's value (a tic starts and ends on the base unless a key says otherwise). The migrated `bow / note / lob` name every channel at t = 0 so they match the code tics exactly.
- `ease` belongs to the segment that **ends** on the key. `hold: true` keeps the earlier value until that key's time.
- `face`: a FACE name (`ok joy shock worry lie mad pout sly wet cry`; eyes parts `wide side half glare`, `><` and the legacy `squint`) or `{ "eyes", "mouth", … }` parts. A named face blink-cuts in and out; parts behave like the loop's own expression.
- `props`: `{ id, at, to: handR|handL|chest|head|back|home, pos, rot }` · `show`: `{ id, at, visible }` · `emit`: `{ at, type, from }` (`anim.emit(type, pivot)`). When the tic ends or is cut short, every prop it moved and every visibility it changed goes back by itself.
- A scribble (`note`) is just many linear keys; 8 per period is enough.

## ၃။ သိမ်း · Save
`Copy JSON` သို့ `Download tics/<name>.json` — ဖိုင်ကို `tics/` ထဲ ထည့်၊ **`tics/index.json` ထဲ နာမည်ကို လက်နဲ့ ထည့်** (editor က ထည့်ရမယ့် လိုင်းကို ပြပေးတယ်)၊ ပြီးရင် commit။ Draft ကို browser (localStorage) မှာလည်း auto သိမ်း။
Copy or download, put the file in `tics/`, add its name to `tics/index.json` by hand (the editor shows the line), commit. Drafts also autosave in the browser.

## ၄။ ဂိမ်းထဲ · In the game
cast.js က start မှာ `faces.json` + `tics/index.json` ကို load။ Code tic နာမည်တူရင် **code က နိုင်** — `?jsontics` ထည့်မှ JSON က အစားထိုး (ဒါကြောင့် `bow note lob` ကို `cast.html?jsontics` နဲ့ပဲ JSON ဗားရှင်း မြင်ရ)။
cast.js loads `faces.json` + `tics/index.json` at start. If a code tic has the same name the **code tic wins**; add `?jsontics` to make JSON replace it (that is how the shipped `bow / note / lob` are compared with their code versions: `docs/carry/ticcmp.cjs`).
Face: `anim.face('shock', 1)` — ၁ စက္ကန့် ထပ်ထား၊ ပြီးရင် loop ရဲ့ မျက်နှာ ပြန်။ Unknown name → `false`.
