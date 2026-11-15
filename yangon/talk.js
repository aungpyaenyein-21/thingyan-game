// yangon/talk.js — the talk director (T10 · issue #35 · docs/plans/T10.md · CAMERA.md §၆-ခ): every line of a conversation gets
// its own shot (camera.js talkShot), the speaker talks (chibi.js anim.talking → the mouth flaps while the text types), turns to
// whoever they're talking to and now and then gestures (cast.js point / hips / scratch / nod); the others look at them and nod
// along (chibi.js's chat = 'listen' layer, the same one life.js's knots use). After the last line: everything back as it was.
//
// Fed by hud.onLine(name, text, opts) — story.js lines carry the cast id (opts.who) and { face, act, cue, voice, shot, react, to };
// a shop's talk() has no id: the speaker is W.talkWith unless the line's name is yours.
//   begin() / end()  a story scene (main.js wraps story.play); a talk outside the story begins and ends by itself
//   cue(k)           a story cue ran (main.js): one that moves people (MOVES) makes the next line a `wide` once
// Shots: `shot` if the line says, else: the line after a cue that moved people → wide (once) · a scene's first line with 3+ people → wide · else ots.
// Same speaker again (and the camera still ours) → hold. voice (off screen) → no cut. Listener: `to` · the last other speaker ·
// the nearest cast member. Your own lines frame you. The scene's side of the line of action is picked at its first shot and kept.
// A wide too spread out for wideMax is an ots instead (camera.js). The mouth flaps while the line types, and at least .6 s.
// zone.fast: cuts, no glide, no gestures, turns at once.
import { TALK } from '../camera.js?v=5';

const TURNS = ['idle', 'shoulder', 'handsback', 'munch']; // loops a body may turn in (not sitting, peeking, walking, on a bike)
const LISTEN = ['idle', 'sit']; // loops the chat 'listen' layer suits (it folds the arms of a standing one)
const MOVES = ['bike', 'maythu', 'peek', 'home', 'back', 'lift', 'polish']; // main.js cues that bring people on / move them / move the camera: the next line re-establishes
const FLAP = .6, LOG = 200, WIDE_CAP = 7, NEAR_M = 2.5, OTS_COV = .15; // a single speaker's wide never goes further than this (m) · nearer than this a thing is near-faded // the mouth flaps at least this long (s) · the shot log keeps the last LOG
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

// who(k) → person { g, ch, anim } · cast() → the people who may be in a scene (incl. you) · room() → null | { open, x0, z0 }
export function createDirector({ W, hud, who, cast, room = () => null, fast = () => false, playerName = () => '' }) {
  const { THREE } = W, orbit = W.orbit;
  let sc = null, open = false, closedAt = null, lineAt = 0;
  const turns = new Map(), log = [];
  const head = c => c.ch?.head ? c.ch.head.getWorldPosition(new THREE.Vector3()) : c.g.position.clone().setY(c.g.position.y + 1.2);
  const here = c => c && c.g.visible && c.g.parent;
  const dist = (a, b) => Math.hypot(a.g.position.x - b.g.position.x, a.g.position.z - b.g.position.z);
  const hero = () => W.player;
  const member = c => { if (c && !sc.members.has(c)) sc.members.set(c, { chat: c.anim.chat }); return c; };
  const nearest = (c, max = 9) => { let best = null, bd = max; for (const o of cast()) if (o !== c && here(o) && dist(o, c) < bd) { bd = dist(o, c); best = o; } return best; };
  const group = (S, L, r = 4.5) => { const g = [S]; if (L && L !== S) g.push(L); for (const o of cast()) if (here(o) && !g.includes(o) && dist(o, S) < r) g.push(o); return g; };
  const yawTo = (c, to) => Math.atan2(to.g.position.x - c.g.position.x, to.g.position.z - c.g.position.z);
  // T16: is the line of sight from a shot's camera to a head free? camCollide only knows walls; trees, awnings and stalls hang in the way too. A near-lens-faded thing
  // (< NEAR_M from the camera) is see-through and does not count; characters, the ground and transparent things are skipped.
  const rc = new THREE.Raycaster(), sph = new THREE.Sphere(), cp = new THREE.Vector3(), dir = new THREE.Vector3();
  // an ots shot's foreground: the listener's head box (≈ .5 × .5 × .5 m round the head) as the shot would frame it — share of the viewport, and whether it covers the speaker's
  const tc = new THREE.PerspectiveCamera(), bx = [-1, 1];
  function ots(r, hl, hs) {
    tc.fov = W.cam.fov; tc.aspect = W.cam.aspect; tc.near = .1; tc.far = 100; tc.updateProjectionMatrix();
    tc.position.copy(r.target).add(dir.set(Math.sin(r.az) * Math.cos(r.elev), Math.sin(r.elev), Math.cos(r.az) * Math.cos(r.elev)).multiplyScalar(effD(r))); tc.lookAt(r.target); tc.updateMatrixWorld(true);
    const rect = (h, k = 1) => { let x0 = 9, x1 = -9, y0 = 9, y1 = -9; for (const a of bx) for (const b of bx) for (const c of bx) { const v = cp.copy(h).add(dir.set(a * .26 * k, b * .24 * k, c * .26 * k)).project(tc); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); } return { x0, x1, y0, y1 }; };
    const L = rect(hl), S = rect(hs), L2 = rect(hl, 1.4), S2 = rect(hs, 1.4), cl = (a, b) => Math.max(0, Math.min(1, b) - Math.max(-1, a));
    return { cov: cl(L.x0, L.x1) * cl(L.y0, L.y1) / 4, ov: Math.max(0, Math.min(L2.x1, S2.x1) - Math.max(L2.x0, S2.x0)) * Math.max(0, Math.min(L2.y1, S2.y1) - Math.max(L2.y0, S2.y0)) }; /* (overlap with a margin: the real heads carry hair) */
  }
  const effD = r => r.pull > 0 ? Math.max(2.5, r.dist * (1 - r.pull)) : r.dist; // the camera is pulled in by a wall (camera.js place) — that is where it really is
  let by = null;
  function clear(r, to) {
    by = null;
    const e = r.elev, dd = effD(r); cp.copy(r.target).add(dir.set(Math.sin(r.az) * Math.cos(e), Math.sin(e), Math.cos(r.az) * Math.cos(e)).multiplyScalar(dd));
    const D = cp.distanceTo(to); rc.set(cp, dir.copy(to).sub(cp).normalize()); rc.far = D;
    for (const m of solidsList()) { const hit = rc.intersectObject(m, false)[0]; if (hit && hit.distance > NEAR_M && hit.distance < D - 1.6) { /* (something right beside the speaker — a bench, a low wall — does not hide them) */ by = { name: m.name || m.parent?.name || m.parent?.parent?.name || '', type: m.geometry.type, d: +hit.distance.toFixed(1), at: hit.point.toArray().map(v => +v.toFixed(1)), col: m.material?.color?.getHexString?.() }; return false; } }
    return true;
  }
  let solidsAt = -1, solidsCache = [];
  function solidsList() { // opaque meshes of the scene (not people, not the ground level), rebuilt at most once a frame-ish
    if (solidsAt === lineAt) return solidsCache; solidsAt = lineAt; solidsCache = [];
    const skip = new Set(W.chars.map(c => c.g)); const walk = o => {
      if (!o.visible || skip.has(o)) return;
      if (o.isMesh) { const mt = Array.isArray(o.material) ? o.material[0] : o.material; o.geometry.boundingSphere || o.geometry.computeBoundingSphere(); sph.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);
        if (mt && mt.depthWrite !== false && !(mt.transparent && mt.opacity < .9) && mt.side !== THREE.BackSide && sph.center.y + sph.radius > .4 && o.name !== 'ground' && o.name !== 'sky') solidsCache.push(o); }
      for (const c of o.children) walk(c);
    }; walk(W.scene); return solidsCache;
  }
  const gazes = new Map(); // T16: c → who the head looks at (chibi.js anim.gaze = the head's turn off the body, eased)
  const look = (c, t) => { if (c && t) gazes.set(c, t); };
  const unlook = c => { gazes.delete(c); if (c.anim) c.anim.gaze = 0; };
  const turn = (c, a) => { if (!c || a === null || !TURNS.includes(c.anim.loop)) return; if (fast()) c.g.rotation.y = a; else turns.set(c, a); };
  // the speaker faces the listener — "cheated" round towards the camera when it would see less than a three-quarter face (a two
  // or a wide side-on, a room's open side behind them), at most CHEAT off the listener
  const speakerYaw = (S, L, camAz) => { // TALK.cheat / TALK.face (?tune 「စကားပြော」)
    const a = L ? yawTo(S, L) : S.g.rotation.y; if (camAz === null) return a;
    const d = wrap(camAz - a); if (Math.abs(d) <= TALK.face) return a;
    return a + Math.sign(d) * Math.min(TALK.cheat, Math.abs(d) - TALK.face);
  };

  function begin(explicit = true) { end(); sc = { explicit, side: null, camAz: null, last: null, prev: null, n: 0, afterCue: false, members: new Map(), started: new Set(), speaker: null, gesture: null }; }
  function cue(k) { if (sc && MOVES.includes(k)) sc.afterCue = true; }
  function line(name, text, o = {}) {
    if (!sc) begin(false);
    open = true; closedAt = null; lineAt = W.time();
    for (const c of sc.members.keys()) c.anim.talking = false;
    if (sc.gesture && sc.gesture.c.anim.one === sc.gesture.name) sc.gesture.c.anim.skip(99); // a tap-through: the last line's gesture goes
    sc.gesture = null;
    const story = 'who' in o, me = hero();
    let S, L = null;
    if (story) { S = o.who ? who(o.who) : null; }
    else if (!name) S = null; // a narrator's line: nobody talks
    else { S = name === playerName() ? me : W.talkWith ?? me; L = S === me ? W.talkWith : me; }
    sc.speaker = S && here(S) ? member(S) : null;
    if (!S || o.voice || !here(S)) return; // off screen (or nobody): the camera stays where it is
    if (story) L = (o.to && who(o.to)) || (sc.last && sc.last !== S && here(sc.last) ? sc.last : null) || nearest(S);
    if (L === S) L = null; member(L);
    const addr = story && !!o.to && !!L && L === who(o.to); // T16: a line with `to` — the speaker faces the addressee (the camera moves, not them) and everyone present listens
    const g = group(S, L, addr ? 8 : 4.5); g.forEach(member);
    // the shot
    const same = S === sc.prev && !o.shot && !sc.afterCue && orbit?.talking;
    const kind = o.shot ?? (sc.afterCue ? 'wide' : sc.n === 0 && g.length >= 3 ? 'wide' : 'ots');
    sc.afterCue = false;
    if (orbit && !same) {
      const fy = addr ? yawTo(S, L) : S.g.rotation.y; // (the yaw they will have, not the one they have)
      const hs = head(S), hl = L ? head(L) : hs.clone().add(new THREE.Vector3(Math.sin(S.g.rotation.y) * 1.6, 0, Math.cos(S.g.rotation.y) * 1.6)); // talking to nobody near: as if to someone in front
      let kd = L ? kind : kind === 'ots' ? 'close' : kind, sd = sc.side, blocked0 = false, replaced = false;
      const base = { group: g.filter(c => c !== S && c !== L).map(head), room: room(), side: sd, face: fy,
        others: W.chars.filter(c => c !== S && c !== L && here(c) && dist(c, S) < 16).map(head), t: fast() ? 0 : TALK.glide };
      /* T16: the shot's candidates in order of preference (the kept side, the other side, a two, …); the first whose camera sees the speaker's face (addressed lines) and
         whose line of sight to the speaker's head is not blocked by a tree / awning / stall (clear()) wins; a wide must also stay within WIDE_CAP m. None clear: the least bad. */
      const seen = x => Math.abs(wrap(x.az - fy)), fg = r => { if (r.kind !== 'ots' || !L) return 0; const q = ots(r, hl, hs); return (q.cov > OTS_COV ? 3 : 0) + (q.ov > 0 ? 3 : 0); },
        ev = r => (clear(r, hs) ? 0 : 10) + (addr && seen(r) > TALK.face ? seen(r) : 0) + (r.kind === 'wide' && r.dist > WIDE_CAP ? 5 : 0) + fg(r);
      const first = orbit.talkShot(hs, hl, kd, { ...base, dry: true }), sA = first.side, nA = sA?.clone().negate();
      const tries = sA ? (kd === 'wide' ? [['wide', nA], ['ots', sA], ['ots', nA], ['two', sA], ['two', nA]] : [[kd, nA], ['two', sA], ['two', nA]]) : [];
      let best = { k: kd, s: sd, v: ev(first) }; const v0 = best.v;
      for (const [k, s2] of tries) { if (best.v === 0) break; const x = orbit.talkShot(hs, hl, k, { ...base, side: s2, dry: true }), v = ev(x); if (v < best.v) best = { k, s: s2, v }; }
      kd = best.k; sd = best.s; blocked0 = !clear(first, hs); replaced = kd !== (L ? kind : kind === 'ots' ? 'close' : kind) || (sd && sA && sd !== sA);
      const r = orbit.talkShot(hs, hl, kd, { ...base, side: sd });
      sc.side = r.side; sc.camAz = r.az; if (log.length >= LOG) log.shift(); log.push({ blocked0, blocked: !clear(r, hs), by, replaced, n: sc.n, who: o.who ?? name, to: L?.id ?? null, want: kind, kind: r.kind, pull0: +r.pull0.toFixed(2), pull: +r.pull.toFixed(2), why0: r.why0, fallback: r.fallback, dist: +r.dist.toFixed(2), elev: +r.elev.toFixed(2) });
    }
    // acting: the speaker faces the listener; the rest face the speaker and listen
    if (addr) { turn(S, yawTo(S, L)); look(S, L); } else { turn(S, speakerYaw(S, L, orbit?.talking ? sc.camAz : null)); unlook(S); }
    for (const c of g) if (c !== S) { turn(c, yawTo(c, S)); if (addr) look(c, S); else unlook(c); if (LISTEN.includes(c.anim.loop)) c.anim.chat = 'listen'; }
    S.anim.chat = null;
    if (o.act && !o.act.startsWith('loop:')) sc.started.add(S); // story.js plays it
    else if (!o.act && !fast() && sc.n % 3 === 2 && !S.anim.one) { // one gesture every third line, from a small pool by the line's mood
      const q = /[?？]|လား\s*$|လဲ\s*$/.test(text ?? ''), bang = /[!！]/.test(text ?? ''), sat = !TURNS.includes(S.anim.loop);
      const gn = sat ? 'nod' : q ? 'scratch' : bang ? 'point' : ['mad', 'pout'].includes(o.face) ? 'hips' : 'nod';
      S.anim.play(gn); sc.started.add(S); sc.gesture = { c: S, name: gn };
    }
    if (o.react) for (const c of g) if (c !== S) c.anim.emote(o.react, 1.6);
    sc.prev = S; sc.last = S; sc.n++;
  }
  function closed() { open = false; closedAt = W.time(); if (sc?.speaker) sc.speaker.anim.talking = false; }
  function end() { // skip-safe: whatever was cut short, everyone back to themselves and the camera back to you
    if (!sc) return;
    for (const [c, m] of sc.members) { c.anim.talking = false; c.anim.chat = m.chat; if (sc.started.has(c) && c.anim.one) c.anim.skip(99); }
    for (const c of [...gazes.keys()]) unlook(c); turns.clear(); sc = null; open = false; closedAt = null;
    orbit?.releaseTalk({ t: fast() ? 0 : .5 });
  }

  hud.onLine((name, text, o) => o?.closed ? closed() : line(name, text, o));
  W.tick(dt => {
    for (const [c, t] of gazes) { if (!here(c) || !here(t)) { unlook(c); continue; } const k = c.ch, own = k.hips.rotation.y + k.spine.rotation.y + k.head.rotation.y - (c.anim.gazeV || 0); /* what the body's own pose already turns the head by (a pose's headRy, spine / hips twist): the gaze makes up the rest */
      c.anim.gaze = Math.max(-1.1, Math.min(1.1, wrap(yawTo(c, t) - c.g.rotation.y - own))); }
    for (const [c, a] of turns) { const d = wrap(a - c.g.rotation.y); if (Math.abs(d) < .01 || !TURNS.includes(c.anim.loop)) { turns.delete(c); continue; } c.g.rotation.y += d * (1 - Math.exp(-dt * 12)); } // ≈ .25 s
    if (sc?.speaker) sc.speaker.anim.talking = open && (hud.typing() || W.time() - lineAt < FLAP);
    if (sc && !open && closedAt !== null && W.time() > closedAt) { // the box has stayed shut a frame: a cue is playing, or the talk is over
      closedAt = null;
      if (sc.explicit) { if (orbit?.talking) orbit.releaseTalk({ t: fast() ? 0 : .5 }); sc.prev = null; } else end();
    }
  });
  return { begin, end, cue, line, log, get scene() { return sc; }, get open() { return open; } };
}
