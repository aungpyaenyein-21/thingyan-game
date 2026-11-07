// yangon/hud.js — the DOM side of the ward: dialogue box, toasts, pick-one menus (barber, clothes, the night choice),
// the timing mini-game, the power bar (1-7 throw), fades, the area banner and the minimap. Everything that blocks walking goes through sync().
const $ = id => document.getElementById(id);

export function createHud(W) {
  let talking = null, menuOpen = null, mini = null, scene = false;
  const sync = () => { W.frozen = !!(talking || menuOpen || mini || scene); document.body.classList.toggle('busy', W.frozen); }; // busy: phones tuck the HUD away

  // phones: tap the little map to open it big (with your bag); ⚙ holds sound / graphics / install / credits
  const stop = e => e.stopPropagation();
  $('where').addEventListener('pointerdown', e => { stop(e); $('where').classList.toggle('big'); });
  $('opt')?.addEventListener('pointerdown', e => { stop(e); document.body.classList.toggle('opts'); });
  $('opts')?.addEventListener('pointerdown', stop);
  addEventListener('pointerdown', () => { document.body.classList.remove('opts'); $('where').classList.remove('big'); }); // a tap anywhere else closes them
  if ($('jump')) $('jump').innerHTML = '<b>⏫</b>ခုန်';

  // ---------- dialogue ----------
  // lines: [who, text, opts?] — opts reach onLine() listeners (T10: the talk director; story.js passes { face, act, cue, voice, shot,
  // react, to, who: cast id }). The text types itself in (TYPE clusters/s — a stacked Burmese syllable is one); a tap first finishes
  // the line, the next tap moves on. Moving on never waits for the typing (story.js's hold() runs from when the line opens).
  const waiting = [], lineFns = []; // a conversation that starts while another is open waits its turn instead of cutting in
  let typing = null; const TYPE = 28;
  function talk(lines, done) { if (talking) { waiting.push([lines, done]); return; } talking = { lines, i: -1, done }; sync(); next(); }
  function next() {
    const t = talking; t.i++; typing = null;
    if (t.i >= t.lines.length) { $('dlg').hidden = true; talking = null; sync(); for (const f of lineFns) f(null); t.done?.(); if (!talking && waiting.length) talk(...waiting.shift()); return; }
    const [who, text, opts = {}] = t.lines[t.i];
    $('dname').textContent = who || ''; $('dlg').classList.toggle('say', !who); $('dlg').hidden = false;
    typeIn(text ?? '');
    for (const f of lineFns) f(who, text, opts);
  }
  // the box keeps the whole line's size from the start (the rest sits there invisible), so it never grows while it types
  const shown = document.createElement('span'), rest = document.createElement('span'); rest.style.opacity = '0';
  function typeIn(text) {
    const ends = clusters(text); $('dtext').replaceChildren(shown, rest);
    if (ends.length < 2) { shown.textContent = text; rest.textContent = ''; return; }
    typing = { text, ends, k: 0, acc: 0 }; shown.textContent = ''; rest.textContent = text;
  }
  function finish() { if (!typing) return false; shown.textContent = typing.text; rest.textContent = ''; typing = null; return true; } // a tap mid-line: the whole line at once
  W.tick(dt => {
    if (!typing) return;
    const ty = typing; ty.acc += dt * TYPE; const k = Math.min(ty.ends.length, Math.floor(ty.acc));
    if (k !== ty.k) { ty.k = k; const at = ty.ends[k - 1] ?? 0; shown.textContent = ty.text.slice(0, at); rest.textContent = ty.text.slice(at); }
    if (k >= ty.ends.length) typing = null;
  });
  const say = lines => new Promise(r => talk(lines, r));
  const tap = () => { if (talking && !finish()) next(); };
  $('dlg').addEventListener('pointerdown', e => { e.stopPropagation(); tap(); });

  // ---------- toast + area banner ----------
  let toastT = 0, areaT = 0;
  const toast = t => { $('toast').textContent = t; $('toast').hidden = false; toastT = 2.6; };
  const area = t => { $('area').textContent = t; $('area').classList.add('on'); areaT = 2.2; };

  // ---------- menus: one list of choices; an item's on() returning true keeps the menu open (live previews) ----------
  const later = []; // pictures still to draw, one per frame so nothing stalls
  W.tick(() => { const f = later.shift(); if (f) f(); });
  function menu({ title, items, close = 'ပိတ်မယ်', onClose, side = false }) {
    later.length = 0; // side: dock to the right so you can see yourself (wardrobe)
    menuOpen = { onClose, forced: close === null }; sync(); $('menu').classList.toggle('side', side);
    $('mtitle').textContent = title;
    const list = $('mlist'); list.innerHTML = '';
    for (const it of items) {
      if (it.head) { const h = document.createElement('div'); h.className = 'mhead'; h.textContent = it.head; list.appendChild(h); continue; }
      const b = document.createElement('button'); b.type = 'button'; b.disabled = !!it.disabled; if (it.cls) b.className = it.cls;
      if (it.swatch) { const s = document.createElement('i'); s.style.background = it.swatch; b.appendChild(s); }
      if (it.img) { // a picture; a function means "draw it when there's a moment" — the menu opens at once and fills in
        const im = document.createElement('img'); im.alt = ''; b.appendChild(im); b.classList.add('pic');
        if (typeof it.img === 'function') { im.classList.add('wait'); later.push(() => { if (im.isConnected) { im.src = it.img(); im.classList.remove('wait'); } }); } else im.src = it.img;
      }
      b.append(it.label); if (it.note) { const em = document.createElement('em'); em.textContent = it.note; b.appendChild(em); }
      b.addEventListener('click', e => { e.stopPropagation(); if (it.on?.(b)) { if (b.isConnected) { list.querySelectorAll('button.on').forEach(x => x.classList.remove('on')); b.classList.add('on'); } } else closeMenu(); }); // isConnected: a pick that re-opened the menu has marked its own choice
      list.appendChild(b);
    }
    $('mclose').textContent = close ?? ''; $('mclose').hidden = close === null; $('menu').hidden = false; // close: null = you have to pick one (the night question)
    (list.querySelector('button.on:not(:disabled)') ?? list.querySelector('button:not(:disabled)'))?.focus({ preventScroll: true }); // keyboard starts on your current choice
  }
  function closeMenu(byUser) { if (!menuOpen || byUser && menuOpen.forced) return; const f = menuOpen.onClose; menuOpen = null; $('menu').hidden = true; sync(); f?.(); }
  $('mclose').addEventListener('click', e => { e.stopPropagation(); closeMenu(true); });

  // ---------- timing mini-game: tap when the cursor is in the gold band; the band narrows each hit ----------
  function timing({ title, need = 3, band = .26, speed = 1.6, onHit, onMiss, onDone }) {
    mini = { need, hits: 0, band, speed, T: 0, onHit, onMiss, onDone }; sync();
    $('mtitle2').textContent = title; $('mini').hidden = false; drawMini();
  }
  function drawMini() { $('mcount').textContent = `${mm(mini.hits)}/${mm(mini.need)}`; $('mband').style.width = `${mini.band * 100}%`; $('mband').style.left = `${(1 - mini.band) / 2 * 100}%`; }
  // ---------- power bar (1-7): the marker runs along the bar and back; tap to let go — how far along is how hard ----------
  const MINI_SMALL = $('mini').querySelector('small')?.textContent;
  function power({ title, speed = .9 }) {
    return new Promise(r => {
      mini = { power: true, T: 0, speed, r }; sync();
      $('mtitle2').textContent = title; $('mcount').textContent = ''; const s = $('mini').querySelector('small'); if (s) s.textContent = 'E / တို့ — ပစ်';
      Object.assign($('mband').style, { left: '0%', width: '100%', background: 'linear-gradient(90deg,#fff6ea,#f2c14e,#c8553d)' }); $('mini').hidden = false;
    });
  }
  const powerAt = m => 1 - Math.abs((m.T * m.speed) % 2 - 1); // 0 → 1 → 0 …
  function snap(force) {
    if (mini.power) { const x = force ?? powerAt(mini), f = mini.r; mini = null; $('mini').hidden = true; $('mband').style.background = ''; const s = $('mini').querySelector('small'); if (s) s.textContent = MINI_SMALL; sync(); f(x); return; }
    const x = (Math.sin(mini.T * mini.speed) + 1) / 2;
    if (Math.abs(x - .5) < mini.band / 2) { mini.hits++; mini.band *= .75; mini.speed *= 1.25; mini.onHit?.(); } else mini.onMiss?.();
    drawMini();
    if (mini.hits >= mini.need) { const f = mini.onDone; mini = null; $('mini').hidden = true; sync(); f?.(); }
  }
  $('mini').addEventListener('pointerdown', e => { e.stopPropagation(); if (mini) snap(); });

  // ---------- fades + cutscenes ----------
  const fade = (on, ms = 800) => new Promise(r => { const f = $('fade'); f.style.transition = `opacity ${ms}ms`; f.style.opacity = on ? 1 : 0; setTimeout(r, ms); });
  const cinematic = on => { scene = on; sync(); };

  // E / the round button: whatever is open gets it first
  function action() {
    if (talking) { tap(); return true; }
    if (mini) { snap(); return true; }
    if (menuOpen) return true; // menus take clicks / taps
    if (scene) return true;
    return false;
  }
  addEventListener('keydown', e => { if (e.code === 'Escape' && menuOpen) closeMenu(true); });

  // ---------- minimap: areas + roads painted once, then you and the gold goal dots on top ----------
  let mapBase = null, mapK = 1, B = null;
  function initMap(areas, roads, bounds) {
    B = bounds; const c = $('map'), w = c.width, h = c.height; mapK = Math.min(w / (B.x1 - B.x0), h / (B.z1 - B.z0));
    mapBase = document.createElement('canvas'); mapBase.width = w; mapBase.height = h; const g = mapBase.getContext('2d');
    g.fillStyle = '#9cc58a'; g.fillRect(0, 0, w, h);
    for (const a of areas) { g.fillStyle = a.c; g.fillRect(...rect(a)); }
    g.fillStyle = '#7d7085'; for (const r of roads) g.fillRect(...rect(r));
    g.fillStyle = '#3d2a44'; g.font = `bold ${Math.round(11 * w / 180)}px "Noto Sans Myanmar",Padauk,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const a of areas) if (a.label) g.fillText(a.label, ...pt((a.x0 + a.x1) / 2, (a.z0 + a.z1) / 2));
  }
  const pt = (x, z) => [(x - B.x0) * mapK, (z - B.z0) * mapK];
  const rect = r => [(r.x0 - B.x0) * mapK, (r.z0 - B.z0) * mapK, (r.x1 - r.x0) * mapK, (r.z1 - r.z0) * mapK];
  let mapT = 0;
  function drawMap(player, goals, T) {
    const c = $('map'), g = c.getContext('2d'); g.drawImage(mapBase, 0, 0);
    for (const p of goals) { const [x, y] = pt(p.x, p.z); g.fillStyle = '#f2c14e'; g.strokeStyle = '#5a3550'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 4 + Math.sin(T * 4) * .8, 0, 7); g.fill(); g.stroke(); }
    const [x, y] = pt(player.x, player.z);
    if (W.orbit) { // north stays up; a soft wedge shows which way the camera looks (T2)
      const a = Math.atan2(-Math.cos(W.orbit.az), -Math.sin(W.orbit.az)), r = 26; g.fillStyle = 'rgba(255,246,232,.55)';
      g.beginPath(); g.moveTo(x, y); g.arc(x, y, r, a - .55, a + .55); g.closePath(); g.fill();
    }
    g.fillStyle = '#3fd3e0'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 4.5, 0, 7); g.fill(); g.stroke();
  }

  W.tick((dt, T) => {
    if (mini) { mini.T += dt; $('mcur').style.left = `${(mini.power ? powerAt(mini) : (Math.sin(mini.T * mini.speed) + 1) / 2) * 100}%`; }
    if (toastT > 0 && (toastT -= dt) <= 0) $('toast').hidden = true;
    if (areaT > 0 && (areaT -= dt) <= 0) $('area').classList.remove('on');
  });

  const tool = t => { $('tool').innerHTML = t === 'gun' ? '<i>🔫</i><b>ရေသေနတ်</b><small>R · ပြောင်း</small>' : t === 'balloon' ? '<i>🎈</i><b>ပူဖောင်း</b><small>R · ပြောင်း</small>' : '<i>🪣</i><b>ရေပုံး</b><small>R · ပြောင်း</small>'; $('tool').classList.toggle('gun', t === 'gun' || t === 'balloon'); };
  tool(W.player?.ch.tool ?? 'bucket');
  return { talk, say, next, finish, typing: () => !!typing, onLine: f => lineFns.push(f), toast, area, menu, closeMenu, timing, power, release: p => mini?.power && snap(p), fade, cinematic, action, initMap, tool,
    map: (p, goals, T, dt) => { if ((mapT -= dt) <= 0 && mapBase) { mapT = .1; drawMap(p, goals, T); } },
    talking: () => !!talking, menuOpen: () => !!menuOpen, mini: () => mini, busy: () => !!(talking || menuOpen || mini || scene) };
}
// play(): the "what can I do here" loop both maps share. spots: [{ at() → Vector3, r, label() → text | null, goal() → bool, run() }];
// a spot your goal points at beats a nearer bystander for the E prompt. goals() → positions for the gold arrows + minimap dots.
export function play(W, hud, { spots, goals, areaAt, mapAt }) { // mapAt: where to put your dot when you're in a room
  const { THREE } = W, PP = new THREE.Vector3();
  const markers = Array.from({ length: 12 }, () => { const m = W.keep(W.mesh(new THREE.ConeGeometry(.2, .42, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.0, .9) }), 0, 0, 0, { cast: false })); m.rotation.x = Math.PI; return m; });
  const PROMPT = $('prompt'), PTEXT = $('ptext'), SPLASH = $('splash');
  let here = null, lastUI = '', lastArea = null;
  W.onAction = () => { if (hud.action()) return true; if (here) { here.run(); return true; } return false; };
  W.tick((dt, T) => {
    here = null; let best = 1e9, label = null;
    if (!W.frozen) {
      const pp = PP.copy(W.player.g.position).setY(0);
      for (const s of spots) { const l = s.label(); if (!l) continue; const d = s.at().distanceTo(pp) - s.r; if (d >= 0) continue; const score = d - (s.goal() ? 10 : 0); if (score < best) { best = score; here = s; label = l; } }
    }
    const busy = hud.busy(), ui = `${label}|${busy}`;
    if (ui !== lastUI) { lastUI = ui; PROMPT.hidden = !label; if (label) PTEXT.textContent = label; SPLASH.classList.toggle('act', !!label || busy); SPLASH.innerHTML = label || busy ? '<b>👋</b>လုပ်' : '<b>💦</b>ရေပက်'; }
    const g = goals();
    markers.forEach((m, i) => { const p = g[i]; m.visible = !!p && !busy; if (p) { m.position.set(p.x, (p.y || 0) + 2.2 + Math.sin(T * 3 + i) * .12, p.z); m.rotation.y = T * 1.5; } });
    hud.map(mapAt?.() ?? W.player.g.position, g, T, dt);
    const a = areaAt(W.player.g.position.x, W.player.g.position.z);
    if (a && a.name !== lastArea) { if (lastArea) hud.area(a.name); lastArea = a.name; }
  });
  return { here: () => here?.label() };
}
// where a typewriter may stop: after each cluster — a base letter with its vowel signs, medials, asat and tone marks, and a
// consonant stacked under a virama (U+1039) or a kinzi riding on top. Not Unicode's grapheme rules, which split Burmese syllables
export function clusters(text) {
  const ends = [], mark = c => (c >= 0x102B && c <= 0x103E) || (c >= 0x1056 && c <= 0x1059) || (c >= 0x105E && c <= 0x1060) || (c >= 0x1062 && c <= 0x1064) || (c >= 0x1067 && c <= 0x106D) || (c >= 0x1071 && c <= 0x1074) || (c >= 0x1082 && c <= 0x108D) || c === 0x108F || (c >= 0x109A && c <= 0x109D) || c === 0x200C || c === 0x200D || (c >= 0xFE00 && c <= 0xFE0F);
  let prev = 0;
  for (let i = 0; i < text.length;) {
    const c = text.codePointAt(i), n = c > 0xFFFF ? 2 : 1;
    if (i > 0 && !mark(c) && prev !== 0x1039) ends.push(i); // (a kinzi — င ် ္ — joins the consonant after it through the ္)
    prev = c; i += n;
  }
  ends.push(text.length); return ends;
}
export const mm = n => String(n).replace(/\d/g, d => '၀၁၂၃၄၅၆၇၈၉'[d]);
