// T6.5 pose / tic editor + face editor — cast.html?edit[&c=<id>][&tic=<name>]. Laptop tool: it only exists when the page has ?edit, builds all its DOM here,
// and plays the draft through the very same JSON player the game uses (chibi.js registerTic), so what you scrub is what the game plays.
// Save = Copy JSON / Download (no server); the file is committed by hand next to tics/index.json. See tics/README.md.
import { POSE_KEYS, FACE, FACE_OV, FACE_PARTS, faceTex, faceParts, setFaces, registerTic, ONESHOT } from './chibi.js?v=36';

const GROUPS = [
  ['head', ['headRx', 'headRy', 'headRz']], ['spine', ['spineRx', 'spineRy', 'spineRz']], ['hips', ['hipsRy', 'hipsRz']],
  ['arm L', ['armLx', 'armLz', 'elbowL', 'handLz']], ['arm R', ['armRx', 'armRz', 'elbowR', 'handRz']],
  ['leg L', ['legLx', 'legLz', 'kneeL', 'footL']], ['leg R', ['legRx', 'legRz', 'kneeR', 'footR']], ['body', ['x', 'y', 'sy', 'hold']]];
const RANGE = { x: [-.5, .5], y: [-.5, .5], sy: [.6, 1.4], hold: [0, 1] };
const MIRROR = [['armLx', 'armRx', 1], ['armLz', 'armRz', -1], ['elbowL', 'elbowR', 1], ['handLz', 'handRz', -1], ['legLx', 'legRx', 1], ['legLz', 'legRz', -1], ['kneeL', 'kneeR', 1], ['footL', 'footR', 1]];
const PROP_IDS = ['book', 'pencil', 'whistle', 'towel', 'balloon', 'pump', 'bucket', 'gun', 'cane'], SOCKETS = ['handR', 'handL', 'chest', 'head', 'back', 'home'];
const PREVIEW = { oneshot: 'zz_draft_o', loop: 'zz_draft_l' };
const r4 = v => Math.round(v * 1e4) / 1e4;
const css = `#ui,#cast,.tag{display:none!important}
#ed{font:13px/1.35 "Noto Sans Myanmar",system-ui,sans-serif;color:#3a2430}
#ed .p{position:fixed;background:rgba(255,246,232,.94);z-index:5;box-sizing:border-box;padding:8px 10px;overflow:auto}
#ed #L{left:0;top:0;bottom:150px;width:250px}#ed #R{right:0;top:0;bottom:150px;width:340px}#ed #B{left:0;right:0;bottom:0;height:150px}
#ed h3{font-size:11px;margin:8px 0 3px;opacity:.7;font-weight:600;text-transform:uppercase}
#ed button,#ed select,#ed input,#ed textarea{font:inherit;font-size:12px;color:inherit}
#ed button{background:#fff;border:1.5px solid #e9c9a8;border-radius:8px;padding:2px 8px;cursor:pointer}#ed button.on{background:#f2a65a;border-color:#f2a65a;color:#fff}
#ed .row{display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin:2px 0}
#ed .sl{display:grid;grid-template-columns:54px 1fr 54px 18px;gap:4px;align-items:center;margin:1px 0}#ed .sl input[type=range]{width:100%;margin:0}#ed .sl input[type=number]{width:54px}
#ed .sl.dim{opacity:.55}#ed .li{padding:1px 6px;border-radius:6px;cursor:pointer}#ed .li:hover{background:#fff}#ed .li.on{background:#f2a65a;color:#fff}#ed .code{opacity:.65}
#ed #tl{position:relative;height:84px;margin:6px 8px 0;background:#fff;border-radius:8px;border:1.5px solid #e9c9a8}
#ed .dot{position:absolute;top:30px;width:14px;height:24px;margin-left:-7px;border-radius:6px;background:#8a7a6a;cursor:ew-resize;box-sizing:border-box;border:2px solid #fff}#ed .dot.sel{background:#e0574f}#ed .dot.f{background:#2f8fd6}
#ed #ph{position:absolute;top:0;bottom:0;width:2px;background:#e0574f;pointer-events:none}#ed .tk{position:absolute;top:2px;font-size:10px;opacity:.6;pointer-events:none}
#ed textarea{width:100%;box-sizing:border-box;height:70px;font-family:ui-monospace,monospace;font-size:11px}#ed .err{color:#c0392b;min-height:16px}
#ed #F{position:fixed;inset:0;z-index:9;background:#fbeedd;display:none;overflow:auto;padding:12px}#ed #F.on{display:block}
#ed .cell{display:inline-block;margin:3px;text-align:center;font-size:11px}#ed .cell canvas{position:static;inset:auto;display:block;border-radius:10px}
#ed #tabs{position:fixed;left:50%;top:6px;transform:translateX(-50%);z-index:10;display:flex;gap:4px}`;

export function mountEditor(ctx) {
  const { all, scene, makeCast } = ctx, qs = new URLSearchParams(location.search);
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: css }));
  const root = Object.assign(document.createElement('div'), { id: 'ed' }); document.body.appendChild(root);
  const $ = (tag, props = {}, ...kids) => { const e = Object.assign(document.createElement(tag), props); for (const k of kids) e.append(k); return e; };
  const btn = (label, fn, title = '') => $('button', { textContent: label, onclick: fn, title });
  const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private window: no drafts */ } } };

  // ---------- state ----------
  const blank = () => ({ name: 'mytic', kind: 'oneshot', duration: 1.6, cycle: 1.6, still: true, keys: [{ t: 0, pose: {} }, { t: 1.6, pose: {} }], props: [], show: [], emit: [] });
  const S = { id: null, c: null, tic: blank(), key: null, t: 0, playing: false, speed: 1, loop: true, clip: null, code: null, err: '', ghost: null };
  const L = $('div', { id: 'L', className: 'p' }), R = $('div', { id: 'R', className: 'p' }), B = $('div', { id: 'B', className: 'p' });
  const F = $('div', { id: 'F' }), tabs = $('div', { id: 'tabs' });
  root.append(L, R, B, F, tabs);
  const tabPose = btn('Pose', () => showTab('pose')), tabFace = btn('Faces', () => showTab('face')); tabs.append(tabPose, tabFace);
  const showTab = t => { F.classList.toggle('on', t === 'face'); tabPose.classList.toggle('on', t === 'pose'); tabFace.classList.toggle('on', t === 'face'); if (t === 'face') drawFaces(); };

  // ---------- the rig being edited + its ghost (the previous key, faint) ----------
  function pick(id) {
    if (S.c) { const a = S.c.anim; delete a.update; a.emit = S.c.emit0; a.one = null; if (a.jt) a._jsonEnd(); }
    S.id = id; S.c = all.find(c => c.def.id === id); ctx.select(id);
    const a = S.c.anim, orig = a.constructor.prototype.update.bind(a); S.c.emit0 = a.emit;
    a.emit = (type, o) => { if (S.playing) S.c.emit0(type, o); }; // scrubbing must not throw balloons
    a.update = dt => drive(orig, dt);
    if (S.ghost) { scene.remove(S.ghost.ch.root); S.ghost = null; }
    const g = makeCast(id, () => {}); g.ch.root.position.copy(S.c.ch.root.position); g.ch.root.rotation.copy(S.c.ch.root.rotation); scene.add(g.ch.root);
    g.ch.root.traverse(o => { if (!o.isMesh) return; o.castShadow = false; if (o.material.isMeshBasicMaterial && o.material.side === 1) return; o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = .28; o.material.depthWrite = false; });
    g.ch.root.visible = false; S.ghost = g;
    for (const b of cbtns) b.classList.toggle('on', b.dataset.id === id);
    refresh();
  }

  // ---------- the tic: validation / preview registration / persistence ----------
  const dur = () => S.tic.kind === 'loop' ? S.tic.cycle : S.tic.duration;
  const clean = () => { const T = S.tic, o = { name: T.name, kind: T.kind }; if (T.kind === 'loop') o.cycle = T.cycle; else { o.duration = T.duration; o.still = T.still; }
    o.keys = T.keys.map(k => { const q = { t: k.t }; if (k.pose) q.pose = k.pose; if (k.face) q.face = k.face; if (k.ease) q.ease = k.ease; if (k.hold) q.hold = true; return q; });
    for (const x of ['props', 'show', 'emit']) if (T[x].length) o[x] = T[x]; return o; };
  const fmtTic = o => { const lines = [`{ "name": "${o.name}", "kind": "${o.kind}", ` + (o.kind === 'loop' ? `"cycle": ${o.cycle}` : `"duration": ${o.duration}, "still": ${!!o.still}`) + ',', '  "keys": ['];
    lines.push(o.keys.map(k => '    ' + JSON.stringify(k).replace(/,"/g, ', "').replace(/":/g, '": ')).join(',\n')); const ex = ['props', 'show', 'emit'].filter(x => o[x]);
    lines.push('  ]' + (ex.length ? ',' : '')); lines.push(ex.map(x => `  "${x}": [\n` + o[x].map(r => '    ' + JSON.stringify(r)).join(',\n') + '\n  ]').join(',\n')); lines.push('}');
    return lines.filter(s => s !== '').join('\n') + '\n'; };
  function commit(save = true) {
    S.tic.keys.sort((a, b) => a.t - b.t);
    try { registerTic({ ...clean(), name: PREVIEW[S.tic.kind] }, { force: true }); S.err = ''; } catch (e) { S.err = e.message; }
    if (save && !S.err) store.set('tic:' + S.tic.name, JSON.stringify(clean()));
    refresh();
  }

  // ---------- per-frame: put the rig at the playhead ----------
  function drive(orig, dt) {
    const a = S.c.anim, D = dur(), T = S.tic;
    if (S.code || S.err) { orig(dt); return; } // a code tic just plays; a draft with an error leaves the rig alone
    if (S.playing) { S.t += dt * S.speed; if (S.t >= D) { if (S.loop) S.t %= D; else { S.t = D - 1e-3; S.playing = false; playBtn.textContent = 'Play'; } } }
    S.t = Math.min(Math.max(S.t, 0), D - 1e-3);
    const step = S.playing ? dt * S.speed : 1e-4;
    if (T.kind === 'loop') { a.one = null; a.loop = PREVIEW.loop; a.T = S.t - a.seed - step; a.blendT = 1; orig(step); }
    else { a.loop = 'idle'; a.one = PREVIEW.oneshot; a.oneT = Math.max(S.t - step, 0); a.blendT = 1; orig(step); }
    const prev = [...T.keys].reverse().find(k => k.pose && k.t < S.t - 1e-3), g = S.ghost;
    if (prev && g) { g.ch.root.visible = true; g.ch.root.position.copy(S.c.ch.root.position); g.ch.root.rotation.copy(S.c.ch.root.rotation);
      if (T.kind === 'loop') { g.anim.one = null; g.anim.loop = PREVIEW.loop; g.anim.T = prev.t - g.anim.seed - 1e-4; } else { g.anim.loop = 'idle'; g.anim.one = PREVIEW.oneshot; g.anim.oneT = Math.max(prev.t - 1e-4, 0); }
      g.anim.blendT = 1; g.anim.update(1e-4); } else if (g) g.ch.root.visible = false;
    syncUI();
  }

  // ---------- left: characters, tics, meta ----------
  const cbtns = all.map(c => { const b = btn(c.def.name, () => pick(c.def.id)); b.dataset.id = c.def.id; return b; });
  const ticList = $('div'), meta = $('div'), newName = $('input', { value: 'mytic', size: 10 }), status = $('div', { className: 'err' });
  const jsonNames = () => { const s = new Set(JSON.parse(store.get('tics-index') || '["bow","note","lob"]')); try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith('tic:')) s.add(k.slice(4)); } } catch { /* no storage */ } return [...s]; };
  function renderList() {
    ticList.replaceChildren(); const js = jsonNames();
    ticList.append($('h3', { textContent: 'JSON tics (editable)' }));
    for (const n of js) ticList.append($('div', { className: 'li' + (S.tic.name === n && !S.code ? ' on' : ''), textContent: n, onclick: () => loadTic(n) }));
    ticList.append($('h3', { textContent: 'code tics (read-only, click = play)' }));
    for (const n of Object.keys(ONESHOT).filter(n => !js.includes(n) && !n.startsWith('zz_'))) ticList.append($('div', { className: 'li code' + (S.code === n ? ' on' : ''), textContent: n, onclick: () => { S.code = n; S.playing = false; S.c.anim.play(n); renderList(); } }));
  }
  async function loadTic(n, preferFile = false) {
    let j = null; const d = store.get('tic:' + n);
    if (d && !preferFile) { try { j = JSON.parse(d); } catch { /* bad draft */ } }
    if (!j) { try { const r = await fetch(new URL('tics/' + n + '.json', location.href), { cache: 'no-cache' }); if (!r.ok) throw new Error(n + ' ' + r.status); j = await r.json(); } catch (e) { S.err = e.message; return refresh(); } }
    adopt(j); status.textContent = d && !preferFile ? 'draft restored from this browser' : 'loaded tics/' + n + '.json';
  }
  function adopt(j) {
    S.code = null; S.c.anim.one = null; S.tic = { name: j.name, kind: j.kind, duration: j.duration ?? 1.6, cycle: j.cycle ?? 1.6, still: j.still !== false, keys: j.keys.map(k => ({ ...k, pose: k.pose && { ...k.pose } })), props: j.props || [], show: j.show || [], emit: j.emit || [] };
    S.key = null; S.t = 0; S.playing = false; commit(false);
  }
  L.append($('h3', { textContent: 'Character' }), $('div', { className: 'row' }, ...cbtns), ticList, $('h3', { textContent: 'New' }),
    $('div', { className: 'row' }, newName, btn('+ new from current pose', () => newTic())), meta, status);
  function newTic() {
    const n = newName.value.replace(/[^A-Za-z0-9_]/g, '') || 'mytic', o = S.c.anim.out, pose = {};
    for (const k of POSE_KEYS) if (k !== 'hold' && Math.abs(o[k] - (k === 'sy' ? 1 : 0)) > 1e-3) pose[k] = r4(o[k]);
    adopt({ name: n, kind: 'oneshot', duration: 1.6, still: true, keys: [{ t: 0, pose: {} }, { t: .8, pose }, { t: 1.6, pose: {} }] }); commit();
  }
  function renderMeta() {
    const T = S.tic, k = T.kind === 'loop' ? 'cycle' : 'duration';
    meta.replaceChildren($('h3', { textContent: 'Tic' }), $('div', { className: 'row' }, 'name', $('input', { value: T.name, size: 10, onchange: e => { T.name = e.target.value.replace(/[^A-Za-z0-9_]/g, '') || T.name; commit(); } }),
      $('select', { onchange: e => { T.kind = e.target.value; commit(); } }, ...['oneshot', 'loop'].map(v => $('option', { value: v, textContent: v, selected: T.kind === v })))),
      $('div', { className: 'row' }, k, $('input', { type: 'number', step: .05, value: T[k], style: 'width:64px', onchange: e => { T[k] = Math.max(.1, +e.target.value || 1); commit(); } }), 's',
        ...(T.kind === 'oneshot' ? [$('label', {}, $('input', { type: 'checkbox', checked: T.still, onchange: e => { T.still = e.target.checked; commit(); } }), ' still')] : [])));
  }

  // ---------- right: sliders, key panel, events, save ----------
  const rows = {}, sliders = $('div'), keyPanel = $('div'), evPanel = $('div'), savePanel = $('div');
  for (const [g, ks] of GROUPS) { sliders.append($('h3', { textContent: g })); for (const k of ks) {
    const [lo, hi] = RANGE[k] || [-3.3, 3.3], rg = $('input', { type: 'range', min: lo, max: hi, step: .01 }), nm = $('input', { type: 'number', step: .01 }), x = btn('×', () => unset(k), 'back to the base loop at this key');
    rg.oninput = () => setCh(k, +rg.value); nm.onchange = () => setCh(k, +nm.value);
    const row = $('div', { className: 'sl dim' }, $('span', { textContent: k }), rg, nm, x); rows[k] = { row, rg, nm }; sliders.append(row); } }
  const mir = from => { const k = S.key; if (!k) return; k.pose ??= {}; for (const [l, r, sg] of MIRROR) { const [a, b] = from === 'L' ? [l, r] : [r, l]; k.pose[b] = r4((k.pose[a] ?? S.c.anim.out[a]) * sg); } commit(); };
  const toolRow = $('div', { className: 'row' }, btn('mirror L→R', () => mir('L')), btn('mirror R→L', () => mir('R')), btn('reset key to base', () => { if (S.key) { S.key.pose = {}; commit(); } }, 'a key with no values = the base loop (idle / walk) at that moment'));
  function ensureKey() { // the selected key, or one at the playhead to put a slider's value on
    if (S.key) { S.t = S.key.t; return S.key; }
    let k = S.tic.keys.find(k => Math.abs(k.t - S.t) < 1e-3 && k.pose); if (!k) { k = { t: r4(S.t), pose: {} }; S.tic.keys.push(k); } S.key = k; return k;
  }
  function setCh(k, v) { const key = ensureKey(); key.pose ??= {}; key.pose[k] = r4(v); commit(); }
  function unset(k) { if (S.key?.pose) { delete S.key.pose[k]; commit(); } }
  function renderKey() {
    const k = S.key; keyPanel.replaceChildren($('h3', { textContent: k ? `Key at ${k.t}s` : 'Key (click a dot, or move a slider to add one at the playhead)' }));
    if (!k) return;
    const ease = $('select', { onchange: e => { k.ease = e.target.value || undefined; commit(); } }, ...['', 'in', 'out', 'inout', 'linear'].map(v => $('option', { value: v, textContent: v || 'ease: inout (default)', selected: (k.ease || '') === v })));
    const named = typeof k.face === 'string' ? k.face : k.face ? '__custom' : '';
    const face = $('select', { onchange: e => { const v = e.target.value; k.face = v === '' ? undefined : v === '__custom' ? { eyes: 'normal', mouth: 'smile' } : v; commit(); } }, $('option', { value: '', textContent: "face: (the loop's)" }), ...Object.keys(FACE).map(n => $('option', { value: n, textContent: n, selected: named === n })), $('option', { value: '__custom', textContent: 'custom parts…', selected: named === '__custom' }));
    keyPanel.append($('div', { className: 'row' }, 't', $('input', { type: 'number', step: .01, value: k.t, style: 'width:64px', onchange: e => { k.t = Math.min(Math.max(+e.target.value || 0, 0), dur()); S.t = k.t; commit(); } }), ease,
      $('label', {}, $('input', { type: 'checkbox', checked: !!k.hold, onchange: e => { k.hold = e.target.checked || undefined; commit(); } }), ' hold'),
      $('label', { title: 'no pose at all: only the face changes here' }, $('input', { type: 'checkbox', checked: !k.pose, onchange: e => { if (e.target.checked) delete k.pose; else k.pose = {}; commit(); } }), ' face only')), $('div', { className: 'row' }, face));
    if (named === '__custom') keyPanel.append($('div', { className: 'row' }, ...['eyes', 'brows', 'mouth', 'extra'].map(q => $('select', { onchange: e => { const v = e.target.value; k.face[q] = v === '' ? undefined : v === '0' ? 0 : v; commit(); } },
      ...['', ...FACE_PARTS[q].filter(v => v !== null)].map(v => $('option', { value: v, textContent: q + ': ' + (v === '' ? '–' : v), selected: String(k.face[q] ?? '') === String(v) }))))));
    keyPanel.append($('div', { className: 'row' }, btn('copy key', () => { S.clip = JSON.parse(JSON.stringify({ pose: k.pose, face: k.face, ease: k.ease, hold: k.hold })); }), btn('paste at playhead', () => paste()), btn('delete key', () => delKey())));
  }
  const paste = () => { if (!S.clip) return; const k = { t: r4(S.t), ...JSON.parse(JSON.stringify(S.clip)) }; S.tic.keys.push(k); S.key = k; commit(); };
  const delKey = () => { if (!S.key) return; S.tic.keys.splice(S.tic.keys.indexOf(S.key), 1); S.key = null; commit(); };
  const evText = $('textarea', { spellcheck: false }), evErr = $('div', { className: 'err' }), propId = $('select', {}, ...PROP_IDS.map(p => $('option', { value: p, textContent: p }))), propTo = $('select', {}, ...SOCKETS.map(p => $('option', { value: p, textContent: p })));
  const evJSON = () => JSON.stringify({ props: S.tic.props, show: S.tic.show, emit: S.tic.emit }, null, 1);
  evPanel.append($('h3', { textContent: 'Props / show / emit (JSON)' }), evText, evErr, $('div', { className: 'row' }, btn('apply', () => { try { const j = JSON.parse(evText.value); for (const x of ['props', 'show', 'emit']) S.tic[x] = j[x] || []; evErr.textContent = ''; commit(); } catch (e) { evErr.textContent = e.message; } }),
    propId, 'to', propTo, btn('+ prop at playhead', () => { S.tic.props.push({ id: propId.value, at: r4(S.t), to: propTo.value, ...(propTo.value === 'home' ? {} : { pos: [0, 0, 0], rot: [0, 0, 0] }) }); commit(); })));
  const saveText = $('textarea', { readOnly: true, style: 'height:90px' }), idxLine = $('div', { style: 'font:11px ui-monospace,monospace;word-break:break-all' });
  const copy = async txt => { try { await navigator.clipboard.writeText(txt); status.textContent = 'copied'; } catch { saveText.value = txt; saveText.select(); status.textContent = 'selected below — press Ctrl+C'; } };
  const download = (name, txt) => { const a = $('a', { href: URL.createObjectURL(new Blob([txt], { type: 'application/json' })), download: name }); document.body.append(a); a.click(); a.remove(); };
  savePanel.append($('h3', { textContent: 'Save' }), $('div', { className: 'row' }, btn('Copy JSON', () => copy(fmtTic(clean()))), btn('Download tics/<name>.json', () => download(S.tic.name + '.json', fmtTic(clean()))), btn('revert to file', () => loadTic(S.tic.name, true))),
    saveText, $('div', { textContent: 'then add the name to tics/index.json by hand:' }), idxLine, btn('copy index line', () => copy(idxLine.textContent)));
  const errBox = $('div', { className: 'err' });
  R.append(errBox, toolRow, sliders, keyPanel, evPanel, savePanel);

  // ---------- bottom: transport + timeline ----------
  const playBtn = btn('Play', () => { S.code = null; S.playing = !S.playing; if (S.playing && S.t >= dur() - .01) S.t = 0; playBtn.textContent = S.playing ? 'Pause' : 'Play'; });
  const speed = $('select', { onchange: e => S.speed = +e.target.value }, ...[1, .5, .25].map(v => $('option', { value: v, textContent: '×' + v })));
  const loopCb = $('input', { type: 'checkbox', checked: true, onchange: e => S.loop = e.target.checked }), time = $('span');
  const stop = () => { S.playing = false; playBtn.textContent = 'Play'; S.code = null; };
  const scrub = $('input', { type: 'range', min: 0, max: 1, step: .001, style: 'flex:1;min-width:200px', oninput: e => { stop(); S.t = +e.target.value * dur(); } });
  const tl = $('div', { id: 'tl' }), ph = $('div', { id: 'ph' });
  B.append($('div', { className: 'row' }, playBtn, speed, $('label', {}, loopCb, ' loop'), scrub, time, btn('+ key at playhead', () => addKeyAt(S.t)), btn('delete key', delKey), $('span', { textContent: 'double-click the track: add a key · drag a dot: move it · Space: play' })), tl);
  const PAD = 12, xOf = t => PAD + t / dur() * (tl.clientWidth - 2 * PAD), tOf = x => Math.round(Math.min(Math.max((x - PAD) / (tl.clientWidth - 2 * PAD), 0), 1) * dur() * 100) / 100;
  function addKeyAt(t) {
    const T = S.tic, used = [...new Set(T.keys.flatMap(k => Object.keys(k.pose || {})))]; stop(); S.t = Math.min(t, dur() - 1e-3);
    const there = T.keys.find(k => k.pose && Math.abs(k.t - S.t) < .005); if (there) { S.key = there; return refresh(); } // already a key here: select it
    S.c.anim.update(1e-4); const o = S.c.anim.out, pose = {}; for (const c of used) pose[c] = r4(o[c]); // the pose as it plays right now, so the new key changes nothing yet
    const k = { t: r4(S.t), pose }; T.keys.push(k); S.key = k; commit();
  }
  tl.ondblclick = e => { if (e.target === tl || e.target.className === 'tk') addKeyAt(tOf(e.clientX - tl.getBoundingClientRect().left)); };
  tl.onpointerdown = e => { if (e.target !== tl) return; stop(); S.t = tOf(e.clientX - tl.getBoundingClientRect().left); };
  function renderTL() {
    tl.replaceChildren(); const D = dur();
    for (let t = 0; t <= D + 1e-6; t += D > 4 ? 1 : .5) tl.append($('div', { className: 'tk', style: `left:${xOf(t)}px`, textContent: r4(t) }));
    for (const k of S.tic.keys) { const d = $('div', { className: 'dot' + (k === S.key ? ' sel' : '') + (k.face && !k.pose ? ' f' : ''), style: `left:${xOf(k.t)}px`, title: `t ${k.t}` + (k.face ? ' · face' : '') });
      d.onpointerdown = e => { e.stopPropagation(); stop(); S.key = k; S.t = k.t; d.setPointerCapture(e.pointerId); let moved = false;
        d.onpointermove = m => { moved = true; k.t = tOf(m.clientX - tl.getBoundingClientRect().left); S.t = k.t; d.style.left = xOf(k.t) + 'px'; };
        d.onpointerup = () => { d.onpointermove = d.onpointerup = null; if (moved) commit(); else refresh(); }; };
      tl.append(d); }
    tl.append(ph);
  }

  // ---------- UI refresh ----------
  function refresh() { renderMeta(); renderKey(); renderTL(); renderList(); evText.value = evJSON(); errBox.textContent = S.err; saveText.value = fmtTic(clean());
    idxLine.textContent = '{ "tics": [' + jsonNames().map(n => `"${n}"`).join(', ') + '] }'; }
  function syncUI() { // every frame: the playhead; the sliders show the key's value, or (dimmed) what the rig is doing now
    ph.style.left = xOf(S.t) + 'px'; time.textContent = S.t.toFixed(2) + ' / ' + dur() + ' s'; scrub.value = S.t / dur();
    const o = S.c.anim.out, k = S.key;
    for (const [n, { row, rg, nm }] of Object.entries(rows)) { const set = k?.pose && n in k.pose, v = set ? k.pose[n] : o[n]; row.classList.toggle('dim', !set); if (document.activeElement !== rg && document.activeElement !== nm) { rg.value = v; nm.value = r4(v); } }
  }
  addEventListener('keydown', e => { if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return; if (e.key === 'Delete' || e.key === 'Backspace') delKey(); if (e.key === ' ') { e.preventDefault(); playBtn.click(); } });

  // ---------- faces tab: one face on everyone (the §11 uniqueness check), the table, and the whole 10 × 13 sheet ----------
  const fState = { name: 'ok' };
  function drawFace(cv, ch, parts) { const g = cv.getContext('2d'), o = ch.opts; g.clearRect(0, 0, cv.width, cv.height);
    g.fillStyle = o.skin; g.beginPath(); g.roundRect(0, 0, cv.width, cv.height, cv.width / 6); g.fill();
    g.drawImage(faceTex(o, parts).image, 0, 0, cv.width, cv.height);
    if (parts.extra === 'redEar') { g.fillStyle = '#ff3a3a'; for (const x of [4, cv.width - 4]) { g.beginPath(); g.ellipse(x, cv.height * .45, cv.width * .035, cv.width * .06, 0, 0, 7); g.fill(); } } }
  const cellFor = (c, parts, w, label) => { const cv = $('canvas', { width: w, height: w * 2 / 3 }); drawFace(cv, c.ch, parts); return $('div', { className: 'cell' }, cv, label ? $('div', { textContent: label }) : ''); };
  const partsFor = (name, c) => { const r = faceParts(name, c.ch) || FACE.ok, o = c.ch.opts; return { ...r, eyes: r.eyes === 'normal' && (o.smileEyes ?? o.age === 'elder') ? 'happy' : r.eyes }; }; // elders smile with their eyes, as in the game
  function drawFaces() {
    F.replaceChildren(); const names = Object.keys(FACE), f = FACE[fState.name];
    const sel = q => $('select', { onchange: e => { const v = e.target.value; f[q] = v === '' ? null : v === '0' ? 0 : v; drawFaces(); } }, ...FACE_PARTS[q].map(v => $('option', { value: v ?? '', textContent: q + ': ' + (v ?? '–'), selected: String(f[q] ?? '') === String(v ?? '') })));
    const nn = $('input', { size: 8, placeholder: 'new face' });
    F.append($('div', { className: 'row', style: 'margin-top:28px' }, $('select', { onchange: e => { fState.name = e.target.value; drawFaces(); } }, ...names.map(n => $('option', { value: n, textContent: n, selected: n === fState.name }))), sel('eyes'), sel('brows'), sel('mouth'), sel('extra'),
      nn, btn('+ add', () => { const n = nn.value.replace(/\W/g, ''); if (n && !FACE[n]) { FACE[n] = { ...f }; fState.name = n; drawFaces(); } }),
      btn('Copy faces.json', () => copy(facesJSON())), btn('Download faces.json', () => download('faces.json', facesJSON())), btn('revert', async () => { setFaces(await (await fetch(new URL('faces.json', location.href), { cache: 'no-cache' })).json()); drawFaces(); })),
      $('div', { textContent: `Everyone wearing “${fState.name}” — each keeps their own eyes / brows / lips / marks (CHARACTERS §11). Saya Gyi: no happy eyes. Thura: goggles up here. U Tin Maung's idle face is joy.` }));
    const grid = $('div', { id: 'grid' }); for (const c of all) grid.append(cellFor(c, partsFor(fState.name, c), 190, c.def.name)); F.append(grid);
    F.append($('h3', { textContent: 'All faces × all characters' })); const sheet = $('div', { id: 'sheet' });
    for (const n of names) { sheet.append($('div', { textContent: n, style: 'font-weight:600;margin-top:6px' })); for (const c of all) sheet.append(cellFor(c, partsFor(n, c), 96)); }
    F.append(sheet);
  }
  const facesJSON = () => '{ "faces": {\n' + Object.entries(FACE).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n') + '\n },\n "overrides": {\n' + Object.entries(FACE_OV).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n') + '\n } }\n';

  // ---------- go ----------
  fetch(new URL('tics/index.json', location.href), { cache: 'no-cache' }).then(r => r.json()).then(j => { store.set('tics-index', JSON.stringify(j.tics)); renderList(); refresh(); }).catch(() => {});
  showTab('pose'); pick(qs.get('c') || 'ngazwe'); commit(false);
  if (qs.get('tic')) loadTic(qs.get('tic'), qs.has('file'));
  window.editor = { S, commit, adopt, pick, addKeyAt, setCh, fmtTic, clean, showTab, drawFaces, get json() { return fmtTic(clean()); } };
}
