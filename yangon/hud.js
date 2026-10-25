// yangon/hud.js — the DOM side of day 1: dialogue box, toasts, pick-one menus (bus, barber, clothes, sign name),
// the timing mini-game, fades, the area banner and the minimap. Everything that blocks walking goes through sync().
const $ = id => document.getElementById(id);

export function createHud(W) {
  let talking = null, menuOpen = null, mini = null, scene = false;
  const sync = () => { W.frozen = !!(talking || menuOpen || mini || scene); };

  // ---------- dialogue ----------
  function talk(lines, done) { talking = { lines, i: -1, done }; sync(); next(); }
  function next() {
    const t = talking; t.i++;
    if (t.i >= t.lines.length) { $('dlg').hidden = true; talking = null; sync(); t.done?.(); return; }
    const [who, text] = t.lines[t.i];
    $('dname').textContent = who || ''; $('dtext').textContent = text; $('dlg').classList.toggle('say', !who); $('dlg').hidden = false;
  }
  const say = lines => new Promise(r => talk(lines, r));
  $('dlg').addEventListener('pointerdown', e => { e.stopPropagation(); if (talking) next(); });

  // ---------- toast + area banner ----------
  let toastT = 0, areaT = 0;
  const toast = t => { $('toast').textContent = t; $('toast').hidden = false; toastT = 2.6; };
  const area = t => { $('area').textContent = t; $('area').classList.add('on'); areaT = 2.2; };

  // ---------- menus: one list of choices; an item's on() returning true keeps the menu open (live previews) ----------
  function menu({ title, items, close = 'ပိတ်မယ်', onClose, side = false }) { // side: dock to the right so you can see yourself (wardrobe)
    menuOpen = { onClose }; sync(); $('menu').classList.toggle('side', side);
    $('mtitle').textContent = title;
    const list = $('mlist'); list.innerHTML = '';
    for (const it of items) {
      if (it.head) { const h = document.createElement('div'); h.className = 'mhead'; h.textContent = it.head; list.appendChild(h); continue; }
      const b = document.createElement('button'); b.type = 'button'; b.disabled = !!it.disabled; if (it.cls) b.className = it.cls;
      if (it.swatch) { const s = document.createElement('i'); s.style.background = it.swatch; b.appendChild(s); }
      if (it.img) { const im = document.createElement('img'); im.src = it.img; im.alt = ''; b.appendChild(im); b.classList.add('pic'); }
      b.append(it.label); if (it.note) { const em = document.createElement('em'); em.textContent = it.note; b.appendChild(em); }
      b.addEventListener('click', e => { e.stopPropagation(); if (it.on?.(b)) { list.querySelectorAll('button.on').forEach(x => x.classList.remove('on')); b.classList.add('on'); } else closeMenu(); });
      list.appendChild(b);
    }
    $('mclose').textContent = close; $('menu').hidden = false;
    list.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
  }
  function closeMenu() { if (!menuOpen) return; const f = menuOpen.onClose; menuOpen = null; $('menu').hidden = true; sync(); f?.(); }
  $('mclose').addEventListener('click', e => { e.stopPropagation(); closeMenu(); });

  // ---------- timing mini-game: tap when the cursor is in the gold band; the band narrows each hit ----------
  function timing({ title, need = 3, band = .26, speed = 1.6, onHit, onMiss, onDone }) {
    mini = { need, hits: 0, band, speed, T: 0, onHit, onMiss, onDone }; sync();
    $('mtitle2').textContent = title; $('mini').hidden = false; drawMini();
  }
  function drawMini() { $('mcount').textContent = `${mm(mini.hits)}/${mm(mini.need)}`; $('mband').style.width = `${mini.band * 100}%`; $('mband').style.left = `${(1 - mini.band) / 2 * 100}%`; }
  function snap() {
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
    if (talking) { next(); return true; }
    if (mini) { snap(); return true; }
    if (menuOpen) return true; // menus take clicks / taps
    if (scene) return true;
    return false;
  }
  addEventListener('keydown', e => { if (e.code === 'Escape' && menuOpen) closeMenu(); });

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
    const [x, y] = pt(player.x, player.z); g.fillStyle = '#4fd1ff'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 4.5, 0, 7); g.fill(); g.stroke();
  }

  W.tick((dt, T) => {
    if (mini) { mini.T += dt; $('mcur').style.left = `${(Math.sin(mini.T * mini.speed) + 1) / 2 * 100}%`; }
    if (toastT > 0 && (toastT -= dt) <= 0) $('toast').hidden = true;
    if (areaT > 0 && (areaT -= dt) <= 0) $('area').classList.remove('on');
  });

  const tool = t => { $('tool').innerHTML = t === 'gun' ? '<b>ရေသေနတ်</b><small>R · ပြောင်း</small>' : '<b>ရေပုံး</b><small>R · ပြောင်း</small>'; $('tool').classList.toggle('gun', t === 'gun'); };
  tool(W.player?.ch.tool ?? 'bucket');
  return { talk, say, next, toast, area, menu, closeMenu, timing, fade, cinematic, action, initMap, tool,
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
    if (ui !== lastUI) { lastUI = ui; PROMPT.hidden = !label; if (label) PTEXT.textContent = label; SPLASH.classList.toggle('act', !!label || busy); SPLASH.textContent = label || busy ? 'လုပ်' : 'ရေပက်'; }
    const g = goals();
    markers.forEach((m, i) => { const p = g[i]; m.visible = !!p && !busy; if (p) { m.position.set(p.x, (p.y || 0) + 2.2 + Math.sin(T * 3 + i) * .12, p.z); m.rotation.y = T * 1.5; } });
    hud.map(mapAt?.() ?? W.player.g.position, g, T, dt);
    const a = areaAt(W.player.g.position.x, W.player.g.position.z);
    if (a && a.name !== lastArea) { if (lastArea) hud.area(a.name); lastArea = a.name; }
  });
  return { here: () => here?.label() };
}
export const mm = n => String(n).replace(/\d/g, d => '၀၁၂၃၄၅၆၇၈၉'[d]);
