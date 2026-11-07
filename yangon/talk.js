// yangon/talk.js — the talk director (T10 · issue #35 · docs/plans/T10.md · CAMERA.md §၆-ခ): every line of a conversation gets
// its own shot (camera.js talkShot), the speaker talks (chibi.js anim.talking → the mouth flaps while the text types), turns to
// whoever they're talking to and now and then gestures (cast.js point / hips / scratch / nod); the others look at them and nod
// along (chibi.js's chat = 'listen' layer, the same one life.js's knots use). After the last line: everything back as it was.
//
// Fed by hud.onLine(name, text, opts) — story.js lines carry the cast id (opts.who) and { face, act, cue, voice, shot, react, to };
// a shop's talk() has no id: the speaker is W.talkWith unless the line's name is yours.
//   begin() / end()  a story scene (main.js wraps story.play); a talk outside the story begins and ends by itself
//   cue()            a story cue ran (main.js): the next line is a `wide` once
// Shots: `shot` if the line says, else: the line after a cue → wide (once) · a scene's first line with 3+ people → wide · else ots.
// Same speaker again (and the camera still ours) → hold. voice (off screen) → no cut. Listener: `to` · the last other speaker ·
// the nearest cast member. Your own lines frame you. The scene's side of the line of action is picked at its first shot and kept.
// zone.fast: cuts, no glide, no gestures, turns at once.
import { TALK } from '../camera.js?v=4';

const TURNS = ['idle', 'shoulder', 'handsback', 'munch']; // loops a body may turn in (not sitting, peeking, walking, on a bike)
const LISTEN = ['idle', 'sit']; // loops the chat 'listen' layer suits (it folds the arms of a standing one)
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

// who(k) → person { g, ch, anim } · cast() → the people who may be in a scene (incl. you) · room() → null | { open, x0, z0 }
export function createDirector({ W, hud, who, cast, room = () => null, fast = () => false, playerName = () => '' }) {
  const { THREE } = W, orbit = W.orbit;
  let sc = null, open = false, closedAt = null;
  const turns = new Map(), log = [];
  const head = c => c.ch?.head ? c.ch.head.getWorldPosition(new THREE.Vector3()) : c.g.position.clone().setY(c.g.position.y + 1.2);
  const here = c => c && c.g.visible && c.g.parent;
  const dist = (a, b) => Math.hypot(a.g.position.x - b.g.position.x, a.g.position.z - b.g.position.z);
  const hero = () => W.player;
  const member = c => { if (c && !sc.members.has(c)) sc.members.set(c, { chat: c.anim.chat }); return c; };
  const nearest = (c, max = 9) => { let best = null, bd = max; for (const o of cast()) if (o !== c && here(o) && dist(o, c) < bd) { bd = dist(o, c); best = o; } return best; };
  const group = (S, L) => { const g = [S]; if (L && L !== S) g.push(L); for (const o of cast()) if (here(o) && !g.includes(o) && dist(o, S) < 4.5) g.push(o); return g; };
  const yawTo = (c, to) => Math.atan2(to.g.position.x - c.g.position.x, to.g.position.z - c.g.position.z);
  const turn = (c, a) => { if (!c || a === null || !TURNS.includes(c.anim.loop)) return; if (fast()) c.g.rotation.y = a; else turns.set(c, a); };
  // the speaker faces the listener — "cheated" round towards the camera when it would see less than a three-quarter face (a two
  // or a wide side-on, a room's open side behind them), at most CHEAT off the listener
  const CHEAT = 1.3, FACE = .9;
  const speakerYaw = (S, L, camAz) => {
    const a = L ? yawTo(S, L) : S.g.rotation.y; if (camAz === null) return a;
    const d = wrap(camAz - a); if (Math.abs(d) <= FACE) return a;
    return a + Math.sign(d) * Math.min(CHEAT, Math.abs(d) - FACE);
  };

  function begin(explicit = true) { end(); sc = { explicit, side: null, camAz: null, last: null, prev: null, n: 0, afterCue: false, members: new Map(), started: new Set(), speaker: null, gesture: null }; }
  function cue() { if (sc) sc.afterCue = true; }
  function line(name, text, o = {}) {
    if (!sc) begin(false);
    open = true; closedAt = null;
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
    const g = group(S, L); g.forEach(member);
    // the shot
    const same = S === sc.prev && !o.shot && !sc.afterCue && orbit?.talking;
    const kind = o.shot ?? (sc.afterCue ? 'wide' : sc.n === 0 && g.length >= 3 ? 'wide' : 'ots');
    sc.afterCue = false;
    if (orbit && !same) {
      const hs = head(S), hl = L ? head(L) : hs.clone().add(new THREE.Vector3(Math.sin(S.g.rotation.y) * 1.6, 0, Math.cos(S.g.rotation.y) * 1.6)); // talking to nobody near: as if to someone in front
      const r = orbit.talkShot(hs, hl, L ? kind : kind === 'ots' ? 'close' : kind, { group: g.filter(c => c !== S && c !== L).map(head), room: room(), side: sc.side, face: S.g.rotation.y, t: fast() ? 0 : TALK.glide });
      sc.side = r.side; sc.camAz = r.az; log.push({ n: sc.n, who: o.who ?? name, to: L?.id ?? null, want: kind, kind: r.kind, pull0: +r.pull0.toFixed(2), pull: +r.pull.toFixed(2), fallback: r.fallback });
    }
    // acting: the speaker faces the listener; the rest face the speaker and listen
    turn(S, speakerYaw(S, L, orbit?.talking ? sc.camAz : null));
    for (const c of g) if (c !== S) { turn(c, yawTo(c, S)); if (LISTEN.includes(c.anim.loop)) c.anim.chat = 'listen'; }
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
    turns.clear(); sc = null; open = false; closedAt = null;
    orbit?.releaseTalk({ t: fast() ? 0 : .5 });
  }

  hud.onLine((name, text, o) => o?.closed ? closed() : line(name, text, o));
  W.tick(dt => {
    for (const [c, a] of turns) { const d = wrap(a - c.g.rotation.y); if (Math.abs(d) < .01 || !TURNS.includes(c.anim.loop)) { turns.delete(c); continue; } c.g.rotation.y += d * (1 - Math.exp(-dt * 12)); } // ≈ .25 s
    if (sc?.speaker) sc.speaker.anim.talking = open && hud.typing();
    if (sc && !open && closedAt !== null && W.time() > closedAt) { // the box has stayed shut a frame: a cue is playing, or the talk is over
      closedAt = null;
      if (sc.explicit) { if (orbit?.talking) orbit.releaseTalk({ t: fast() ? 0 : .5 }); sc.prev = null; } else end();
    }
  });
  return { begin, end, cue, line, log, get scene() { return sc; }, get open() { return open; } };
}
