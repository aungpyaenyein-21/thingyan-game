// yangon/main.js — the ward, and day 1 of the story (SCENARIO v6 §3, TASKS T5): wake at home, gather the gang, three
// missions for the kids' mandat on the lot (M1 the cloth, M2 the speaker, M3 the lights — water in every one), five o'clock
// at the mandat, the silver bowl that slips over ④'s fence, and the night question. day.js runs the daily rhythm (phase,
// Mum's range, goal line, cards), story.js holds the lines, mandat.js the mandat, carry.js the bowl and what you hold.
// The v4 "nine favours + Mandalay bus + Phoe Tha" flow is gone (git history / docs/archive); the shops, the tea shop's
// people and the street life stay — on day 1 they're out of Mum's range.
import { createWorld, PAL, SKINS } from '../world.js?v=15';
import { CAT_COATS } from '../critters.js?v=6';
import { buildSet, BOUNDS, ground, AREAS, areaAt, shwedagon } from './set.js?v=19';
import { createHud, play } from './hud.js?v=5';
import { openBarber, openClothes, redress } from './wardrobe.js?v=5';
import { buildRooms } from './rooms.js?v=11';
import { icon, TEA_MENU, teaColor } from './icons.js?v=1';
import { startLife } from './life.js?v=17';
import { bulbs } from './bulbs.js?v=1';
import { createSound } from '../sound.js?v=3';
import { makeCast, earBlush } from '../cast.js?v=11';
import { createCarry, ITEMS } from '../carry.js?v=1';
import { makeBike, seatOn } from '../bike.js?v=1';
import { load as loadSave, save as store, wipe } from './save.js?v=7';
import { createDay, debugStart, PHASE_OF } from './day.js?v=1';
import { createStory, GOALS, NIGHT, RED_EARS } from './story.js?v=1';
import { createMandat } from './mandat.js?v=1';

const W = createWorld({ bounds: BOUNDS, ground, paintSky: shwedagon, camBounds: { x0: -3, x1: 27, z0: -4, z1: 30 }, view: 16, camera: 'orbit', surround: { rects: [ // the main street and the market street carry on past the island
  { x0: -150, x1: -10, z0: 6.6, z1: 12.2, c: PAL.road }, { x0: 34, x1: 150, z0: 6.6, z1: 12.2, c: PAL.road },
  { x0: -150, x1: -10, z0: 5.8, z1: 6.6, c: PAL.walk }, { x0: 34, x1: 150, z0: 5.8, z1: 6.6, c: PAL.walk },
  { x0: -150, x1: -10, z0: 12.2, z1: 13, c: PAL.walk }, { x0: 34, x1: 150, z0: 12.2, z1: 13, c: PAL.walk },
  { x0: 11.8, x1: 14.2, z0: 37, z1: 150, c: PAL.road }] } });
const { THREE, scene, mesh, box, cyl, stripeTex, bubbleTex, bean, rnd, pick } = W;
const L = buildSet(W);
const ROOMS = buildRooms(W); // the tea shop, the tailor's, the barber's off the street; home on the lane
const hud = createHud(W);
const sound = createSound(W); W.onFx = (n, p) => sound.fx(n, p); // ambience + effects, no music yet
const V = (x, z, y = 0) => new THREE.Vector3(x, y, z), v = new THREE.Vector3(), $ = id => document.getElementById(id);
const DEBUG = new URLSearchParams(location.search).has('debug');

// ---------- save + the day ----------
const S = loadSave(); debugStart(S);
const save = () => store(S);
const day = createDay(W, hud, S, { out: () => story.play('out') });

// ---------- carry (T4): the bowl, what you hold; mandat (its seat is a carry target) ----------
const cw = createCarry(scene, { onThrow: (it, vel) => it.kind === 'bowl' && slip(it, vel), onMessage: t => { if (!story?.playing) hud.toast(t); } });
W.tick(dt => cw.update(dt));
const mandat = createMandat(W, { at: L.STAGE, carry: cw, onBreak: why => hud.toast(mandat.rules.text(why)) });

// ---------- people: the named cast (cast.js) joins the town through W.adopt; the rest are world.js beans ----------
const npc = (o, y) => { const c = bean({ prop: 'none', print: '', ...o }); if (y !== undefined) c.g.position.y = y; return c; };
const face = (c, t = W.player) => { const p = t.g ? t.g.position : t; c.g.rotation.y = Math.atan2(p.x - c.g.position.x, p.z - c.g.position.z); };
const put = (c, x, z, ry, y) => { c.g.position.set(x, y ?? (x > 100 ? .05 : ground(x, z)), z); if (ry !== undefined) c.g.rotation.y = ry; c.g.visible = true; }; // x > 100: inside a room
const hide = c => { c.g.visible = false; };
const balloons = [];
function person(id, x, z, ry = 0) {
  const p = makeCast(id, (t, o) => { if ((t === 'lob' || t === 'throw') && o) onThrowFx(c, t, o); });
  const c = W.adopt({ g: p.ch.root, ch: p.ch, anim: p.anim, act: p.act, def: p.def, id });
  put(c, x, z, ry); return c;
}
const hero = person('hero', 4.4, -3.3, Math.PI); hero.ch.blushEars = earBlush(hero.ch);
W.setPlayer(hero); const pc = cw.carrier(hero);
const mom = person('mom0', 6.9, -3.5, Math.PI);
const bwabwa = person('bwabwa', 0, 0); const bwc = cw.carrier(bwabwa, { npc: true });
const ngazwe = person('ngazwe', -3.3, -2.3, Math.PI / 2);
const maythu = person('maythu', -5.6, 1.6), phoekyaw = person('phoekyaw', -2.95, 5.2), chocho = person('chocho', -3.9, -3.1, Math.PI / 2);
const sayagyi = person('sayagyi', 7, 4);
const GANG = [ngazwe, maythu, phoekyaw, chocho];
const kozaw = npc({ age: 'adult', hair: 'spiky', topStyle: 'jacket', bottom: 'pants', hat: 'none', x: -.5, z: 3.4, ry: Math.PI }); // Ko Zaw brings his string of lights to the lot (M3)
const PEOPLE = { hero, mom, bwabwa, ngazwe, maythu, phoekyaw, chocho, sayagyi, kozaw };
const bowl = cw.item('bowl', 0, 0); // ငွေဖလား — Bwa Bwa's silver bowl

// ---------- the ward's grown-ups (beans) ----------
// Auntie Sein up on her 3rd-floor balcony with the rope bucket (M1); U Ba Tin by his door on the side lane (M2)
const AB = L.flatsA.bal(3, 2), BTOP = AB.at(.55, .2, .38), BBOT = BTOP.clone().setY(.06), STUCK = 1.95; // STUCK: where the empty bucket hangs, too light to come down
const auntie = npc({ hair: 'bun', flower: true, age: 'adult', skin: SKINS[1], shirt: '#e9a0b4', topStyle: 'yinphone', bottom: 'htamein', bottomColor: ['#7a4a9a', '#c79be0'], hat: 'none', build: 'round' });
auntie.g.position.copy(AB.at(-.3, .08, -.08)); auntie.dry = true;
const UNCLE = V(-5.15, -.7);
const uncle = npc({ age: 'elder', hair: 'short', topStyle: 'taikpon', shirt: '#f3ead8', bottom: 'longyi', hat: 'none', x: UNCLE.x, z: UNCLE.z, ry: Math.PI / 2 });
// ① vegetable seller with her cart at the corner, calling out
const vendor = npc({ hair: 'bun', age: 'adult', skin: SKINS[2], shirt: '#e9b44c', topStyle: 'yinphone', bottom: 'htamein', bottomColor: ['#6e4428', '#a8743a'], hat: 'bucket' });
const cart = W.keep(new THREE.Group()); scene.add(cart);
{
  const o = { parent: cart };
  box(1.1, .3, .7, '#a8744a', 0, .55, 0, o); for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(.26, .04, 6, 14), '#2b2730', 0, .3, s * .4, o);
  for (const s of [-1, 1]) box(.05, .05, .5, '#8a5a3a', -.75, .82, s * .25, o);
  for (let i = 0; i < 6; i++) mesh(new THREE.IcosahedronGeometry(.13, 0), pick([PAL.leaf, PAL.leafLight]), -.3 + (i % 3) * .3, .95, (i < 3 ? -.15 : .15), o);
  for (let i = 0; i < 4; i++) mesh(new THREE.SphereGeometry(.07, 8, 6), PAL.red, .35 + (i % 2) * .12, .92, -.2 + (i >> 1) * .14, o);
}
const call = W.speak(new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex('ဟင်းသီး~ ဟင်းရွက်~'), depthWrite: false }))); call.scale.set(2.8, .88, 1); call.position.y = 2.3; call.visible = false; vendor.g.add(call);
const VD = { callT: 2 }, CORNER = V(-2.0, -1.0); // ① where the side lane meets the back lane
vendor.g.position.set(CORNER.x, ground(CORNER.x, CORNER.z + .7), CORNER.z + .7); vendor.g.rotation.y = Math.PI;
cart.position.set(CORNER.x, .02, CORNER.z); W.solid(CORNER.x, CORNER.z, 1.3, .8);
cyl(.03, .03, 2.1, '#8f8794', CORNER.x + .55, .02, CORNER.z + .2, 5, { parent: cart.parent }); mesh(new THREE.CylinderGeometry(.02, 1.0, .32, 8, 1, true), new THREE.MeshLambertMaterial({ map: stripeTex('#4f8f5a', '#fff6ea', 8), side: THREE.DoubleSide }), CORNER.x + .55, 2.1, CORNER.z + .2);
// ③ the big tea shop by the market is packed inside; the barber and the tailor work in their shops on ②
const TR = ROOMS.tea, seat = (o, st) => { const c = npc({ ...o, x: st.x, z: st.z, ry: st.ry }, .05 + (st.lift || 0)); c.anim.setLoop('sit'); return c; };
const teaBoss = npc({ age: 'adult', hair: 'short', topStyle: 'tank', shirt: '#fff6ea', bottom: 'longyi', hat: 'none', x: TR.boss.x, z: TR.boss.z }, .05);
[0, 1, 3].forEach((t, i) => seat({ age: i === 1 ? 'elder' : 'adult' }, TR.tables[t].seats[i % 2]).anim.setLoop(i === 1 ? 'idle' : 'eat'));
seat({ age: 'adult', hair: 'spiky', hairColor: '#4a2e22', topStyle: 'jacket', shirt: '#2e3a59', bottom: 'pants', hat: 'none' }, TR.tables[2].seats[1]);
const oldMen = TR.tables[5].seats.map(st => seat({ age: 'elder', topStyle: 'taikpon', bottom: 'longyi' }, st)); // two old men at their usual table, putting the world to rights
seat({ age: 'adult' }, TR.tables[1].seats[0]).anim.setLoop('eat'); // palata and tea, alone with the TV
const MY_TABLE = TR.tables[4];
const betelMan = npc({ age: 'elder', hair: 'short', topStyle: 'shirt', shirt: '#dfe8f0', bottom: 'longyi', hat: 'none', x: 16.7, z: 4.55 }, .14);
const barber = npc({ age: 'adult', hair: 'spiky', hairColor: '#2b1d1a', topStyle: 'shirt', shirt: '#fff6ea', bottom: 'pants', hat: 'none', x: ROOMS.barber.boss.x, z: ROOMS.barber.boss.z }, .05);
const tailor = npc({ age: 'adult', hair: 'bun', topStyle: 'yinphone', shirt: '#7a4a9a', bottom: 'htamein', hat: 'none', x: ROOMS.clothes.boss.x, z: ROOMS.clothes.boss.z, ry: Math.PI }, .05);
const phoneGirl = npc({ age: 'adult', hair: 'long', topStyle: 'tee', shirt: '#f2c14e', bottom: 'skirt', hat: 'none', x: 26.1, z: 4.95 }, .14);
const frondMan = npc({ age: 'adult', hair: 'short', topStyle: 'tank', shirt: '#86b96d', bottom: 'longyi', hat: 'bucket', x: -6.9, z: 25.1 });
const mohingaLady = npc({ age: 'adult', hair: 'bun', topStyle: 'yinphone', shirt: '#e9a0b4', bottom: 'htamein', hat: 'none', x: 9.4, z: 15.0, ry: 0 });
// ④ pagoda + monastery: monks are never splashed (dry) and never joked about (docs/archive/VISION.md §၉)
const ROBE = { topStyle: 'long', shirt: '#9a3a2a', bottom: 'longyi', bottomColor: ['#8a3a2a', '#a8432f'], hair: 'buzz', hairColor: '#3a2a26', hat: 'none', thanaka: false, flower: false, garland: false };
const novices = [npc({ ...ROBE, age: 'kid', x: L.WELL.x, z: L.WELL.z + .2 }), npc({ ...ROBE, age: 'kid', x: L.POND.x - .4, z: L.POND.z + 1 })];
const abbot = npc({ ...ROBE, age: 'elder', x: L.MONASTERY.x, z: L.MONASTERY.z - .4, ry: 0 });
[...novices, abbot].forEach(m => { m.dry = true; });
W.idlers.push(auntie, uncle, betelMan, barber, tailor, phoneGirl, teaBoss);
// the ward's life (life.js) follows the day's phase
const life = startLife(W, { L, BOUNDS, ground, phase: () => ({ morning: 'morning', day: 'day', five: 'late', night: 'evening' }[day.at] ?? 'day') });
life.knot(oldMen, true);
const JOURNAL = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 84; const q = c.getContext('2d'); q.fillStyle = '#f6f1e6'; q.fillRect(0, 0, 64, 84);
  q.fillStyle = '#c8553d'; q.fillRect(4, 4, 56, 10); q.fillStyle = '#7a8fd0'; q.fillRect(6, 20, 26, 22); q.fillStyle = '#5a5560'; for (let y = 22; y < 80; y += 6) q.fillRect(y < 44 ? 36 : 6, y, y < 44 ? 22 : 52, 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide }); })();
const journal = (c, y = .56, z = .3) => { const g = new THREE.Group(); c.g.add(g); g.position.set(0, y, z); for (const s of [-1, 1]) mesh(new THREE.PlaneGeometry(.26, .34), JOURNAL, s * .12, 0, 0, { parent: g, cast: false }).rotation.y = -s * .4; return g; };
{ // the tea shop is full — pairs over their tea, talking; on their own, most have a journal open
  const look = () => ({ age: pick(['adult', 'adult', 'adult', 'elder']), hat: 'none' });
  for (const [t, both] of [[0, 0], [3, 0], [6, 1], [7, 0], [8, 1], [9, 1], [10, 1], [11, 0]]) {
    const tb = TR.tables[t], who = (both ? tb.seats : [tb.seats[t < 6 ? 1 : 0]]).map(st => seat(look(), st));
    if (who.length > 1) life.knot(who, true); else if (t % 2) journal(who[0]); else who[0].anim.setLoop('eat');
  }
}
journal(oldMen[0]);
const ROOM_FLOOR = () => .05, AI = TR.aisle;
const trayOf = c => { const g = new THREE.Group(); c.g.add(g); g.position.set(0, 1.08, .32); cyl(.2, .2, .03, '#9aa3ad', 0, 0, 0, 12, { parent: g }); for (const dx of [-.07, .08]) cyl(.05, .04, .1, '#c8945a', dx, .03, 0, 8, { parent: g }); return g; };
const BOY = { age: 'adult', hair: 'short', build: 'slim', topStyle: 'shirt', shirt: '#fff6ea', bottom: 'longyi', hat: 'none' };
npc({ age: 'adult', hair: 'short', topStyle: 'tank', shirt: '#fff6ea', bottom: 'longyi', hat: 'none', x: TR.boss.x - 1.6, z: TR.boss.z, ry: 0 }, .05); // the palata man at his griddle
box(.9, .08, .5, '#3b3040', TR.boss.x - 1.6, 1.05, TR.boss.z + .55); cyl(.22, .22, .02, '#e8b85a', TR.boss.x - 1.6, 1.13, TR.boss.z + .55, 12);
const DOOR_POST = V(TR.door.x + 1.4, TR.door.z - .9);
const doorBoy = npc({ ...BOY, x: DOOR_POST.x, z: DOOR_POST.z, ry: -Math.PI / 2 }, .05); doorBoy.floor = ROOM_FLOOR; doorBoy.tray = trayOf(doorBoy); doorBoy.tray.visible = false;
let rounds = 0; // bumped whenever he's called away, so the old round of tables just stops
async function waitTables(gen) {
  const live = () => gen === rounds && !doorBoy.asking;
  for (;;) {
    await life.wait(2 + rnd() * 3); if (!live()) return;
    const t = pick(TR.tables.filter(t => t !== MY_TABLE)), ax = AI.xs.reduce((a, x) => Math.abs(x - t.x) < Math.abs(a - t.x) ? x : a);
    doorBoy.tray.visible = true; await life.walk(doorBoy, [[ax, AI.zs[0]], [ax, t.z]], 'carry'); if (!live()) return;
    doorBoy.g.rotation.y = Math.sign(t.x - ax) * Math.PI / 2; doorBoy.tray.visible = false; doorBoy.anim.play('wave');
    await life.wait(1.4); if (!live()) return;
    await life.walk(doorBoy, [[ax, AI.zs[0]], [TR.counter.x, TR.counter.z]]); if (!live()) return;
    doorBoy.g.rotation.y = Math.PI; if (rnd() < .4) life.say(doorBoy, pick(['ပေါ့ဆိမ့် နှစ်ခွက်!', 'ပလာတာ တစ်ချပ်!', 'ကျဆိမ့် တစ်ခွက်!', 'ရေနွေးကြမ်း ထပ်!']), 1.6, 1.6);
  }
}
waitTables(rounds);
const paperMan = npc({ age: 'elder', hair: 'short', topStyle: 'shirt', shirt: '#dfe8f0', bottom: 'longyi', hat: 'bucket', x: AI.xs[2], z: AI.zs[2] }, .05); paperMan.floor = ROOM_FLOOR;
journal(paperMan, .95, .32);
(async () => { const P = [[AI.xs[2], AI.zs[2]], [AI.xs[0], AI.zs[2]], [AI.xs[0], AI.zs[1]], [AI.xs[2], AI.zs[1]]]; for (let k = 1; ; k++) { await life.walk(paperMan, [P[k % 4]], 'carry'); await life.wait(1 + rnd() * 2); } })();
async function greet() {
  const p = W.player.g.position;
  rounds++; doorBoy.asking = true; doorBoy.tray.visible = false; await life.walk(doorBoy, [[p.x + 1.0, p.z - .6]]); face(doorBoy);
  life.say(doorBoy, 'ထိုင်ပါ! ဘာသောက်မလဲ', 4, 1.6);
  await life.wait(9); if (doorBoy.asking) boyBack();
}
const boyBack = () => { doorBoy.asking = false; const gen = ++rounds; life.walk(doorBoy, [DOOR_POST]).then(() => { doorBoy.g.rotation.y = -Math.PI / 2; if (gen === rounds) waitTables(gen); }); };

W.addPet('dog', 'house', 3.6, -3.75);     // home dog on the porch step
W.addPet('cat', 'house', -2.0, -4.6);     // cat at the stairwell
W.addPet('dog', 'walker', 0, -2.4);
W.addPet('dog', 'shop', 11.2, 30.0);      // waiting by the tea shop for scraps
W.addPet('dog', 'shop', 7.6, 25.6);       // and by the mohinga pot
W.addPet('dog', 'park', 21.0, 28.4);      // asleep in the shade at the trishaw stand
W.addPet('cat', 'house', 28.6, 5.0);      // pharmacy step

// ---------- talk outside the story (ambient lines, unchanged from the ward) ----------
const talk = (lines, done, who) => { if (who) { face(who); W.talkWith = who; } hud.talk(lines, () => { W.talkWith = null; done?.(); }); }; // T2: the camera frames you and whoever you're talking to

// ---------- the water: your splash / balloon, the gang's pumps and balloons ----------
const GRAV = -11;
// a jet of water from p to a point: ballistic, t s in the air (n drops, a little spread) — up into a bucket, onto a roof
function jet(from, to, { n = 22, t = .55, spread = .25, own = null } = {}) {
  const vx = (to.x - from.x) / t, vz = (to.z - from.z) / t, vy = (to.y - from.y) / t - .5 * GRAV * t;
  for (let i = 0; i < n; i++) W.spawn(from.clone().add(V((rnd() - .5) * .15, (rnd() - .5) * .15, rnd() * .1)), V(vx + (rnd() - .5) * spread * 3, vy + (rnd() - .5) * spread * 2, vz + (rnd() - .5) * spread * 3), { own, s: .8 + rnd() * .4 });
  W.onFx?.('splash', from);
}
// a pump stream from someone's nozzle (Nga Zwe's ပြွတ်): a thin line of drops over a moment
function stream(c, to, dur = .6) {
  let t = 0; const step = dt => { t += dt; if (t > dur) return true; const n = c.ch.pump ?? c.ch.arms[1].hand; const from = n.getWorldPosition(new THREE.Vector3()); jet(from, to.isVector3 ? to : to(), { n: 2, t: .45, spread: .08, own: c.g }); };
  streams.push(step); W.onFx?.('squirt', c.g.position);
}
const streams = []; W.tick(dt => { for (let i = streams.length - 1; i >= 0; i--) if (streams[i](dt)) streams.splice(i, 1); });
// balloons (ပူဖောင်း): an arc, and on landing a burst
const BALLOON = new THREE.SphereGeometry(.09, 10, 8), BMAT = new THREE.MeshLambertMaterial({ color: '#4fb3d9' });
function lobBalloon(c, from, far = 5) {
  const m = W.keep(new THREE.Mesh(BALLOON, BMAT)); m.position.copy(from); scene.add(m);
  const r = c.g.rotation.y; balloons.push({ m, vel: V(Math.sin(r) * far * .9, Math.cos(r) * far * .9, 4.2), own: c.g });
}
W.tick(dt => { for (let i = balloons.length - 1; i >= 0; i--) { const b = balloons[i]; b.vel.y += GRAV * dt; b.m.position.addScaledVector(b.vel, dt);
  if (b.m.position.y < .12) { const p = b.m.position.clone().setY(.15); W.splash(p, b.vel.clone().setY(0).normalize(), 30, b.own); W.onFx?.('splash', p); scene.remove(b.m); balloons.splice(i, 1); } } });
function onThrowFx(c, t, hand) { // a 'lob' (May Thu) or a 'throw' (you, with a balloon — not the bowl) left the hand
  if (c === hero && (pc.busy?.kind === 'throw' || pc.item)) return;
  lobBalloon(c, hand.getWorldPosition(new THREE.Vector3()));
}
// your E with nothing to do: the bucket heave (world.js) or, once May Thu gave you one, a balloon (R swaps)
S.tool ??= 'bucket';
const setTool = t => { S.tool = t; hud.tool(t === 'balloon' ? 'balloon' : 'bucket'); save(); };
const swapTool = () => { if (S.ball) setTool(S.tool === 'balloon' ? 'bucket' : 'balloon'); };
$('tool').addEventListener('pointerdown', e => { e.stopPropagation(); swapTool(); });
addEventListener('keydown', e => { if (e.code === 'KeyR' && !e.repeat) swapTool(); });
setTool(S.ball ? S.tool : 'bucket');

// ---------- the story runner + the day's beats ----------
const story = createStory({ W, hud, who: k => PEOPLE[k] ?? null, name: () => S.name, fast: () => !!window.zone?.fast, cue: (k, id) => CUES[k]?.(id) });
const wait = s => life.wait(window.zone?.fast ? Math.min(s, .2) : s);
const walk = (c, pts, loop = 'walk', max = 9) => { const gen = c.walkGen = (c.walkGen ?? 0) + 1; // a newer walk cancels this one's "arrive anyway"
  return Promise.race([life.walk(c, pts, loop), life.wait(max)]).then(() => { if (c.walkGen !== gen) return; const e = pts[pts.length - 1], [x, z] = e.isVector3 ? [e.x, e.z] : e; if (Math.hypot(c.g.position.x - x, c.g.position.z - z) > .3) put(c, x, z); }); }; // never stuck: arrive anyway
const advance = next => { S.step = next; save(); };

// fixed spots on the lot and round it
const HOME_OUT = V(4.4, -3.3), MUM_DAY = V(6.9, -3.5), GATHER = V(-3.3, -2.3);
const LOT = { ngazwe: [.4, .4], maythu: [1.4, -.3], phoekyaw: [4.8, -.3], chocho: [-.2, 1.2] };
const FRONT = { hero: [2.6, 4.5], ngazwe: [1.3, 4.0], maythu: [2.0, 4.3], phoekyaw: [3.3, 4.3], chocho: [4.0, 4.0] }; // five o'clock, facing the mandat
const BUCKET_SPOT = V(BTOP.x, BTOP.z + .55), AMP_SPOT = V(-4.25, -1.55), TABLE = V(-.5, 2.6), TABLE_SPOT = V(.25, 2.7), WATER = V(5.2, 1.0), THROW = V(6.0, .3), THROW_RY = 1.03;

// ---------- the rope bucket from Auntie Sein's balcony (M1) ----------
const bucket = W.keep(new THREE.Group()); scene.add(bucket);
cyl(.27, .2, .42, '#3f8fd0', 0, 0, 0, 12, { parent: bucket });
mesh(new THREE.TorusGeometry(.26, .02, 4, 16, Math.PI), '#2b2730', 0, .42, 0, { parent: bucket });
const bWater = mesh(new THREE.CircleGeometry(.24, 16), new THREE.MeshBasicMaterial({ color: '#3fd3e0' }), 0, .05, 0, { parent: bucket, cast: false }); bWater.rotation.x = -Math.PI / 2; bWater.visible = false;
const bCloth = mesh(new THREE.BoxGeometry(.38, .18, .28), new THREE.MeshLambertMaterial({ map: stripeTex('#f48fb1', '#fff6ea', 6) }), 0, .48, 0, { parent: bucket }); bCloth.visible = false;
const rope = W.keep(mesh(new THREE.CylinderGeometry(.02, .02, 1, 4), '#efe3c8', 0, 0, 0, { cast: false }));
const BK = { y: BTOP.y, to: BTOP.y, then: null, fill: 0 };
const sendBucket = (y, then) => { BK.to = y; BK.then = then; };
W.tick((dt, T) => {
  const d = BK.to - BK.y; BK.y += Math.sign(d) * Math.min(Math.abs(d), dt * (BK.fill >= 1 ? .9 : 1.3));
  if (Math.abs(BK.y - BK.to) <= .01 && BK.then) { const f = BK.then; BK.then = null; f(); }
  const stuck = S.step === '1-3' && BK.fill < 1, sw = Math.abs(BK.y - BK.to) > .01 ? Math.sin(T * 5) * .05 : Math.sin(T * (stuck ? 2.3 : 1.3)) * (stuck ? .12 : .01); // empty, it swings in the breeze
  bucket.position.set(BTOP.x + sw, BK.y, BTOP.z); bucket.rotation.z = sw * .5;
  const len = BTOP.y + .5 - (BK.y + .42);
  rope.position.set(BTOP.x + sw * .5, BK.y + .42 + len / 2, BTOP.z); rope.scale.y = Math.max(.01, len); rope.rotation.z = -sw * .3 / Math.max(len, .5);
  bWater.visible = BK.fill > 0; bWater.position.y = .06 + .3 * Math.min(1, BK.fill);
});

// ---------- Shwe Wa asleep on U Ba Tin's amplifier (M2), the zinc lean-to beside her ----------
const shweWa = W.addPet('cat', 'house', L.AMP.at.x, L.AMP.at.z, { coat: CAT_COATS[0], socks: true });
shweWa.held = 'scene'; shweWa.anim.setLoop('sleep');
const CAT = { at: 'amp', hop: null, back: 0, fish: null };
const catTo = (to, then = 'sit', dur = .55) => { CAT.hop = { from: shweWa.g.position.clone(), to: to.clone(), t: 0, dur, then }; shweWa.anim.play('hop'); shweWa.g.rotation.y = Math.atan2(to.x - shweWa.g.position.x, to.z - shweWa.g.position.z); };
shweWa.hit = () => { // splash the cat, not the roof: she bolts, U Ba Tin calls out — and she's back on the amplifier in a moment
  shweWa.anim.soak(); shweWa.anim.emote('bang'); if (CAT.at !== 'amp') return;
  life.say(uncle, 'ဟဲ့!', 1.6, 2.0); uncle.anim.play('call'); CAT.at = 'away'; CAT.back = 5; catTo(V(-4.1, 1.4), 'sit', .7);
};
let roofK = 0;
W.tick(dt => {
  const c = shweWa, p = c.g.position;
  if (CAT.hop) { const h = CAT.hop; h.t += dt / h.dur; const k = Math.min(1, h.t); p.lerpVectors(h.from, h.to, k); p.y += Math.sin(k * Math.PI) * .45; if (k >= 1) { CAT.hop = null; c.anim.setLoop(h.then); } }
  else if (CAT.at === 'amp') { p.set(L.AMP.g.position.x, L.AMP.top, L.AMP.g.position.z); if (c.anim.loop !== 'sleep') c.anim.setLoop('sleep'); }
  else if (CAT.at === 'away' && (CAT.back -= dt) < 0) { CAT.at = 'amp'; catTo(V(L.AMP.at.x, L.AMP.at.z, L.AMP.top), 'sleep', .6); }
  else if (CAT.at === 'fish') { const f = chocho.g.position, want = V(f.x - .45, f.z + .2); const d = Math.hypot(want.x - p.x, want.z - p.z); if (d > .15) { if (c.anim.loop !== 'walk') c.anim.setLoop('walk'); c.g.rotation.y = Math.atan2(want.x - p.x, want.z - p.z); const s = Math.min(d, c.anim.speed * dt); p.x += (want.x - p.x) / d * s; p.z += (want.z - p.z) / d * s; } else if (c.anim.loop !== 'sit') { c.anim.setLoop('sit'); c.anim.emote('heart', 2); } p.y = ground(p.x, p.z); }
  if (roofK > 0) { roofK = Math.max(0, roofK - dt * 1.6); L.ROOF.sheet.position.y = L.ROOF.y + Math.sin(W.time() * 60) * .03 * roofK; }
});
const fishM = mesh(new THREE.ConeGeometry(.05, .2, 6), '#c9a46b', 0, 0, 0, { cast: false }); fishM.rotation.z = Math.PI / 2; fishM.visible = false; chocho.ch.arms[1].hand.add(fishM); fishM.position.set(0, -.08, .05); // Cho Cho's dried fish

// ---------- Ko Zaw's table for the lights (M3), the string on it ----------
const table = W.keep(new THREE.Group()); table.position.copy(TABLE); scene.add(table);
box(.9, .5, .55, '#8a5a3a', 0, 0, 0, { parent: table }); for (let i = 0; i < 8; i++) mesh(new THREE.SphereGeometry(.05, 6, 5), i % 2 ? '#ffd23f' : '#ff8ad8', -.35 + i * .1, .54, Math.sin(i) * .1, { parent: table, cast: false });
const tableSolid = W.solids[W.solid(TABLE.x, TABLE.z, .9, .55) - 1];
let fixing = null, wetT = 0, shield = null, wetMsg = null;
const wetFlash = document.createElement('div'); wetFlash.style.cssText = 'position:fixed;z-index:8;left:50%;top:18%;transform:translateX(-50%);padding:6px 16px;border-radius:14px;background:#fff6ea;color:#5a3550;font:16px/1.5 "Noto Sans Myanmar",Padauk,sans-serif;box-shadow:0 3px 0 rgba(0,0,0,.3);display:none;pointer-events:none';
document.body.appendChild(wetFlash);
const flash = (t, s = 1.4) => { wetFlash.textContent = t; wetFlash.style.display = 'block'; clearTimeout(wetMsg); wetMsg = setTimeout(() => { wetFlash.style.display = 'none'; }, s * 1000); };

// Phoe Kyaw's bike and his two buckets (1-2 on, he leaves them at the lot)
const bike = makeBike({ color: '#6b7a3a' }); scene.add(W.keep(bike.g)); bike.g.visible = false;
const pails = W.keep(new THREE.Group()); scene.add(pails);
for (const dx of [-.22, .22]) { cyl(.16, .12, .26, '#c8553d', dx, 0, 0, 12, { parent: pails }); const w = mesh(new THREE.CircleGeometry(.14, 12), '#3fd3e0', dx, .25, 0, { parent: pails, cast: false }); w.rotation.x = -Math.PI / 2; }

// ---------- what you hold: carry.js items with their own look (the cloth, the string of lights, an empty bucket as a shield) ----------
function holdable(kind, name, build) {
  const it = cw.item(kind === 'shield' ? 'bucket' : 'basket', hero.g.position.x, hero.g.position.z);
  it.def = { ...ITEMS[kind === 'shield' ? 'bucket' : 'basket'], name, size: 'front', weight: .2, wet: false };
  if (build) { for (const m of it.body.children.filter(m => m.isMesh)) it.body.remove(m); build(it.body); }
  else it.body.traverse(m => { if (m.isMesh && m.geometry.type === 'CircleGeometry') m.visible = false; }); // the shield bucket is empty
  return it;
}
const clothLook = b => mesh(new THREE.BoxGeometry(.4, .16, .3), new THREE.MeshLambertMaterial({ map: stripeTex('#f48fb1', '#fff6ea', 6) }), 0, .08, 0, { parent: b });
const lightsLook = b => { for (let i = 0; i < 10; i++) mesh(new THREE.SphereGeometry(.045, 6, 5), i % 2 ? '#ffd23f' : '#ff8ad8', Math.cos(i * .63) * .16, .06 + (i % 3) * .02, Math.sin(i * .63) * .12, { parent: b, cast: false }); };
const takeNow = it => { pc.pick(it); }; // bend, both hands, up to the chest
const deliver = k => { const it = pc.item; if (it) cw.remove(it); hero.anim.play('pick'); mandat.drop(k); if (!S.got.includes(k)) S.got.push(k); GANG.forEach(g => g.g.visible && g.anim.emote('heart')); };

// ---------- the scenes ----------
const MISSION = { m1: 0, catDown: false, wet: 0, puzzle: 0, told: false };
let speaker = null, bwWalk = null; // the amplifier between you and Phoe Kyaw (M2) · Bwa Bwa on her way (1-6)
const CUES = {
  // 1-1: Bwa Bwa with the bowl in her lap, rubbing it bright
  polish: () => { bwabwa.anim.emote('heart', 2); },
  // 1-2
  bike: async () => {
    bike.g.visible = true; bike.g.position.set(-2.95, 0, 5.2); bike.g.rotation.y = Math.PI / 2; seatOn(bike, phoekyaw, 'saddle'); phoekyaw.g.visible = true;
    bike.g.add(pails); pails.visible = true; pails.rotation.set(0, Math.PI / 2, 0); pails.position.set(-.42, .68, 0); // his two buckets on the rack
    const from = bike.g.position.clone(), to = V(-2.95, -1.7), d = from.distanceTo(to); let t = 0;
    await new Promise(r => { const step = dt => { t += dt * 2.6 / d; const k = Math.min(1, t); bike.g.position.lerpVectors(from, to, k); bike.roll(dt * 2.6); if (k >= 1) { r(); return true; } }; streams.push(step); });
    phoekyaw.act('ring'); W.onFx?.('bike', bike.g.position);
    await wait(.9);
    scene.attach(phoekyaw.g); put(phoekyaw, -2.3, -2.2); phoekyaw.anim.setLoop('idle'); face(phoekyaw, ngazwe);
  },
  maythu: () => { put(maythu, -5.4, 1.6); return walk(maythu, [[-4.0, 1.4], [-3.6, -1.4], [-2.6, -3.0]]).then(() => face(maythu, hero)); },
  peek: () => { put(chocho, -3.95, -3.35, Math.PI / 2); chocho.act('loop:peek'); },
  goal: id => { day.goal(GOALS[id]); if (id === '1-2') chocho.act('loop:idle'); },
  weapons: async () => { // the three ways the gang throws water (T3 WEAPONS: ပြွတ် · ပူဖောင်း · ပုံး) — each shows theirs
    const at = V(-1.0, -2.4);
    face(ngazwe, at); hud.toast('ပြွတ် — ငဇွဲ'); stream(ngazwe, V(at.x, at.z, .1), .8); await wait(1.6);
    face(maythu, at); hud.toast('ပူဖောင်း — မေသူ'); maythu.act('lob'); await wait(1.8);
    face(phoekyaw, at); hud.toast('ပုံး — ဖိုးကျော်'); phoekyaw.anim.play('splash'); await wait(1.6);
  },
  ball: () => { S.ball = true; setTool('balloon'); hud.toast('+ ပူဖောင်း 🎈'); maythu.anim.play('wave'); },
  // 1-6
  lift: async () => {
    W.orbit?.focus(V(L.STAGE.x, L.STAGE.z, 1.2), { dist: 9, t: .8 });
    bwWalk = walk(bwabwa, [[5.4, -1.6], [5.3, 3.4], [3.6, 3.45]], 'walk', 14); // she's on her way with the bowl meanwhile
    for (const k of ['floor', ...S.got.filter(k => k !== 'floor')]) { await mandat.add(k); if (!S.parts.includes(k)) S.parts.push(k); GANG.forEach(g => g.anim.emote('heart', 1)); }
    S.got = []; save(); W.orbit?.release();
  },
  whistle: async () => { put(sayagyi, 5.2, 4.3); face(sayagyi, V(L.STAGE.x, L.STAGE.z)); sayagyi.act('whistle'); sound.fx('handbell', sayagyi.g.position); GANG.forEach(g => g.anim.emote('bang', 1.2)); await wait(1.5); },
  bowl: async () => {
    await (bwWalk ?? walk(bwabwa, [[3.6, 3.45]], 'walk', 8)); face(bwabwa, mandat.seatAt);
    bwc.place(mandat.seat); await wait(.9);
  },
  home: () => { walk(bwabwa, [[5.3, 3.4], [5.4, -1.6], [4.4, -3.6]], 'walk', 16).then(() => { if (S.step !== '1-6') toRoomChair(); }); walk(sayagyi, [[8.5, 4.6], [9.6, 5.2]], 'walk', 8).then(() => hide(sayagyi)); },
  // 1-7
  ding: async () => {
    await wait(1.2); // five kids, very still
    sound.fx('icebell', L.LAND4); dingBubble(); await wait(1.0);
  },
  pinky: () => { face(chocho, hero); face(hero, chocho); chocho.anim.play('wave'); hero.anim.play('wave'); chocho.anim.emote('heart', 2); },
  // 1-8
  choice: () => new Promise(r => hud.menu({ title: 'ဖလား မဏ္ဍပ်ပေါ် ရှိတယ်နော်', close: null, items: NIGHT.map(([k, label]) => ({ label, on: () => { S.night[S.day - 1] = k; save(); r(k); } })) })),
  ears: () => { const red = S.night[S.day - 1] === RED_EARS; hero.ch.blushEars(red); if (red) hero.anim.emote('dots', 2); },
  sleep: async () => {
    const m = ROOMS.home.mat; await new Promise(r => day.walkTo(V(m.x, m.z), r)); hero.g.rotation.y = 0; hero.anim.setLoop('sit');
    await hud.fade(true, 1200);
    advance('done'); hero.ch.blushEars(false); day.card('ရက် ၂ — မကြာခင်');
  },
};
const dingSprite = W.speak(new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex('ဒင်း'), depthWrite: false }))); dingSprite.scale.set(1.6, .6, 1); dingSprite.visible = false; scene.add(dingSprite);
function dingBubble() { dingSprite.position.copy(L.LAND4).setY(2.4); dingSprite.visible = true; setTimeout(() => { dingSprite.visible = false; }, 1600); }

// ---------- rooms: walk in off the street (shops) or the lane (home) ----------
let inside = null, backTo = null, seated = null;
const ROOM_NAME = { tea: 'ရွှေလမင်း လက်ဖက်ရည်ဆိုင်', clothes: 'ရွှေရည် အထည်ဆိုင်', barber: 'ဆံပင်ညှပ်ဆိုင်', home: '' };
function setInside(name, at) { const r = ROOMS[name]; inside = name; W.setRoom(r); hero.g.position.set(at?.x ?? r.spawn.x, .05, at?.z ?? r.spawn.z); hero.g.rotation.y = Math.PI; W.snapCam(); day.range.watch(false); }
function setOutside(at) { stand(); W.setRoom(null); inside = null; hero.g.position.set(at.x, ground(at.x, at.z), at.z); hero.g.rotation.y = 0; W.snapCam(); day.range.watch(true); }
async function enter(name) {
  hud.cinematic(true); await hud.fade(true, 350);
  backTo = name === 'home' ? HOME_OUT.clone() : W.player.g.position.clone(); setInside(name);
  await hud.fade(false, 350); hud.cinematic(false); if (ROOM_NAME[name]) hud.area(ROOM_NAME[name]);
  if (name === 'tea') greet();
}
async function goOut() {
  hud.cinematic(true); await hud.fade(true, 350);
  const was = inside; setOutside(backTo ?? HOME_OUT);
  await hud.fade(false, 350); hud.cinematic(false);
  if (was === 'home' && S.step === '1-1') { advance('1-2'); stage('1-2'); } // out into the lane: the day starts
}
function sitAt(st, lift = st.lift || 0) { const p = W.player; p.g.position.set(st.x, .05, st.z); p.g.rotation.y = st.ry; p.anim.setLoop('sit'); W.lift = lift; seated = { ry: st.ry }; }
function stand() { if (!seated) return; seated = null; W.lift = 0; W.player.anim.setLoop('idle'); }
W.tick(() => { if (seated && W.player.anim.loop !== 'sit') { seated = null; W.lift = 0; } });
const cup = (t, color, dx = 0) => W.keep(mesh(new THREE.CylinderGeometry(.06, .05, .12, 8), color, t.x + dx, (t.top ?? .41) + .06, t.z + .05));
const plate = (t, dx = 0) => { cyl(.14, .14, .02, '#fff6ea', t.x + dx, t.top ?? .47, t.z - .1, 12); return mesh(new THREE.SphereGeometry(.08, 8, 6), '#e8b85a', t.x + dx, (t.top ?? .47) + .05, t.z - .1); };
function order(t, st) { // pick a drink and something to eat from the picture menu; the boss brings it over
  sitAt(st);
  hud.menu({ title: '☕ ဘာသောက်မလဲ', close: 'မမှာတော့ဘူး', items: TEA_MENU.drinks.map(([k, n, d]) => ({ label: n, note: d, img: icon(k), on: () => {
    let picked = false;
    hud.menu({ title: '🍞 ဘာစားမလဲ', close: 'သောက်ရုံပဲ', items: TEA_MENU.snacks.map(([k2, n2, d2]) => ({ label: n2, note: d2, img: icon(k2), on: () => { picked = true; serve(k, n, k2, k2 === 'none' ? '' : n2); } })),
      onClose: () => { if (!picked) serve(k, n, 'none', ''); } });
    return true;
  } })) });
  function serve(k, n, k2, n2) { setTimeout(() => { if (k !== 'greentea') cup(t, teaColor(k), st.x < t.x ? -.2 : .2); if (k2 !== 'none') plate(t, st.x < t.x ? -.15 : .15); teaBoss.anim.play('wave');
    talk([['လက်ဖက်ရည်ဆိုင် ဆရာ', `${n}${n2 ? ' နဲ့ ' + n2 : ''} ရပါပြီ~`]]); }, 700); }
}
const dress = () => { redress(W, S); save(); };
function sitBarber() { const ch = ROOMS.barber.chairs[0]; sitAt(ch, ch.lift); talk([['ဆံပင်ညှပ်ဆရာ', 'ထိုင် ထိုင်… ပုံတွေ ကြည့်ပြီး ရွေး။']], () => openBarber({ W, hud, S, dress, onClose: () => { stand(); barber.anim.play('wave'); } }), barber); }
function tryOn() { const p = W.player, m = ROOMS.clothes.mirror; p.g.position.set(m.x, .05, m.z); p.g.rotation.y = -Math.PI / 2; talk([['အထည်ဆိုင် မမ', 'မှန်ရှေ့မှာ ဝတ်ကြည့်။']], () => openClothes({ W, hud, S, dress, onClose: () => tailor.anim.play('wave') }), tailor); }
function toRoomChair() { const c = ROOMS.home.chair; put(bwabwa, c.x, c.z, c.ry, .05 + c.lift); bwabwa.anim.setLoop('sit'); }

// ---------- stage(step): where everyone is when a scene starts (a new game, a reload, the next scene) ----------
function stage(step) {
  const H = ROOMS.home, out = !['1-1', '1-8', 'done'].includes(step);
  day.phase(PHASE_OF[step]); day.goal({ '1-1': '', '1-2': '', '1-8': GOALS['1-7'], done: GOALS['1-7'] }[step] ?? GOALS['1-2']); // the goal line appears in 1-2 (its cue) and changes in 1-7
  // family
  if (out) put(mom, MUM_DAY.x, MUM_DAY.z, Math.PI * .8); else put(mom, H.mom.x, H.mom.z, H.mom.ry, .05);
  if (step === '1-6') put(bwabwa, 4.6, -3.0, 0); else toRoomChair();
  // the bowl: in Bwa Bwa's lap → in her arms (1-6) → on its seat (1-7) → over the fence (after)
  if (bowl.by) { bowl.by.release(true); bowl.by = null; } if (bowl.at) { bowl.at.item = null; bowl.at = null; }
  if (['1-1', '1-2', '1-3', '1-4', '1-5', '1-6'].includes(step)) { bwc._load(bowl); bowl.g.visible = true; }
  else if (step === '1-7') { scene.attach(bowl.g); mandat.seat.socket.add(bowl.g); bowl.g.position.set(0, 0, 0); bowl.g.scale.setScalar(1); bowl.g.rotation.set(0, 0, 0); bowl.state = 'placed'; bowl.at = mandat.seat; mandat.seat.item = bowl; bowl.g.visible = true; }
  else { scene.attach(bowl.g); bowl.g.position.copy(L.LAND4); bowl.state = 'gone'; bowl.g.visible = false; } // in ④ now (T6)
  // the gang
  for (const k of GANG) { k.g.visible = false; k.anim.setLoop('idle'); }
  if (step === '1-2') { put(ngazwe, GATHER.x, GATHER.z, Math.PI / 2); ngazwe.act('loop:shoulder'); hide(maythu); hide(phoekyaw); hide(chocho); }
  if (['1-3', '1-4', '1-5'].includes(step)) for (const k of GANG) put(k, ...LOT[k.id], 0);
  if (step === '1-3') put(ngazwe, BUCKET_SPOT.x + .9, BUCKET_SPOT.z + .4, Math.PI);
  if (step === '1-4') { put(chocho, -3.3, .3, -Math.PI / 2); put(phoekyaw, -3.4, -.6, -Math.PI / 2); }
  if (['1-6', '1-7'].includes(step)) for (const k of GANG) put(k, ...FRONT[k.id], Math.PI);
  bike.g.visible = step !== '1-1' && step !== '1-2'; if (bike.g.visible) { bike.g.position.set(6.4, 0, -1.2); bike.g.rotation.y = 0; }
  pails.visible = out && step !== '1-2'; if (pails.visible) { scene.attach(pails); pails.position.set(WATER.x, .02, WATER.z); }
  // Saya Gyi at five o'clock only; Ko Zaw at his table for M3
  hide(sayagyi); if (step === '1-5') put(kozaw, TABLE.x, TABLE.z + .7, Math.PI); else hide(kozaw);
  table.visible = step === '1-5'; tableSolid.x0 = step === '1-5' ? TABLE.x - .45 : 1e9; tableSolid.x1 = step === '1-5' ? TABLE.x + .45 : 1e9;
  // the mandat as far as it has got; today's hauls by the lot
  for (const k of S.parts) mandat.add(k, { instant: true }); for (const k of ['cloth', 'speaker', 'lights']) mandat.drop(k, S.got.includes(k));
  // M1 / M2 / M3 props as the save left them
  BK.fill = 0; bCloth.visible = false; BK.y = BK.to = step === '1-3' ? STUCK : BTOP.y;
  const ampHere = !S.got.includes('speaker') && !S.parts.includes('speaker'); L.AMP.g.visible = ampHere; L.AMP.solid.x0 = ampHere ? L.AMP.at.x - .2 : 1e9; L.AMP.solid.x1 = ampHere ? L.AMP.at.x + .2 : 1e9;
  CAT.at = ampHere ? 'amp' : 'home'; CAT.hop = null; if (!ampHere) { shweWa.g.position.set(UNCLE.x + .6, ground(UNCLE.x + .6, UNCLE.z + .6), UNCLE.z + .6); shweWa.anim.setLoop('sit'); }
  fishM.visible = false; speaker = null; Object.assign(MISSION, { m1: 0, catDown: false, wet: 0, puzzle: 0, told: false });
  if (shield) { cw.remove(shield); shield = null; } if (pc.item) cw.remove(pc.item);
  if (step === '1-5') shield = holdable('shield', 'ပုံး'), shield.g.position.set(-1.3, 0, 3.7);
  // you
  if (step === '1-1') { setInside('home', V(H.mat.x + .5, H.mat.z + .4)); }
  else if (step === '1-8' || step === 'done') setInside('home', V(H.chair.x - .9, H.chair.z + .9));
  else if (inside) setOutside(HOME_OUT);
  else day.range.watch(true);
  hero.ch.blushEars(false); $('end').hidden = true;
  if (DEBUG) console.log('stage', step);
}

// ---------- the flow: what starts each scene ----------
async function scene11() {
  hud.cinematic(true); await day.title(1); hud.cinematic(false); await story.play('1-1'); tutorial(); // (no walking out before Mum has spoken)
}
let tut = null;
function tutorial() { // 1-1: walk, run, jump — one hint at a time, until you've done each once
  const P = matchMedia('(pointer:coarse)').matches;
  const steps = [['walk', P ? 'ဘယ်ဘက်ကို ဆွဲ — လမ်းလျှောက်' : 'WASD — လမ်းလျှောက်'], ['run', P ? 'ဝေးဝေး ဆွဲ — ပြေး' : 'Shift — ပြေး'], ['jump', P ? '⏫ — ခုန်' : 'Space — ခုန်'], ['door', 'တံခါးက အပြင် ထွက်']];
  tut = { i: 0, steps, t: 0 };
}
W.tick(dt => {
  if (!tut || hud.busy()) return;
  const a = hero.anim, [k, text] = tut.steps[tut.i] ?? [];
  if (!k) { tut = null; return; }
  if ((k === 'walk' && a.loop === 'walk') || (k === 'run' && a.loop === 'run') || (k === 'jump' && a.one === 'jump') || (k === 'door' && !inside)) { tut.i++; tut.t = 0; return; }
  if ((tut.t -= dt) <= 0) { tut.t = 3; hud.toast(text); }
});
async function scene12() {
  await story.play('1-2'); advance('1-3');
  ngazwe.act('loop:idle'); for (const k of GANG) walk(k, [LOT[k.id]], 'run'); walk(ngazwe, [[BUCKET_SPOT.x + .9, BUCKET_SPOT.z + .4]], 'run');
  bike.g.visible = true; pails.visible = true; scene.attach(pails); pails.position.set(WATER.x, .02, WATER.z); bike.g.position.set(6.4, 0, -1.2); bike.g.rotation.y = 0;
  BK.y = BK.to = BTOP.y; sendBucket(STUCK); auntie.anim.play('call');
}
async function scene14() { await story.play('1-4'); }
// five o'clock: everyone to the mandat
async function scene16() {
  hud.cinematic(true); await hud.fade(true, 700);
  advance('1-6'); stage('1-6'); put(hero, ...FRONT.hero, Math.PI); W.snapCam();
  await hud.fade(false, 700); hud.cinematic(false);
  await story.play('1-6'); advance('1-7'); save();
  await wait(1.0); await story.play('1-7');
}
// night: home, Bwa Bwa's question
async function scene18() {
  hud.cinematic(true); await hud.fade(true, 900);
  advance('1-8'); stage('1-8');
  await hud.fade(false, 900); hud.cinematic(false);
  await story.play('1-8');
}

// ---------- 1-7: the throw. The power bar only sets how high it goes: on the release the wet bowl slips every time ----------
let flight = null; const lastThrow = { p: null, land: null, clear: null };
async function throwBowl() {
  put(hero, THROW.x, THROW.z, THROW_RY); W.snapCam();
  hud.cinematic(true);
  const p = await hud.power({ title: 'ပစ်မယ် — အား' });
  lastThrow.p = p; flight = { p };
  pc.throw();
}
function slip(it, vel) { // carry.js calls this at the release: we fly it ourselves (true = external)
  const p = flight?.p ?? .5, from = it.g.position.clone();
  // the water goes where you aimed …
  const r = hero.g.rotation.y; for (let i = 0; i < 40; i++) W.spawn(from.clone(), V(Math.sin(r) * (3.5 + 3 * p) + (rnd() - .5), Math.cos(r) * (3.5 + 3 * p) + (rnd() - .5), 2.4 + 2 * p + rnd()), { own: hero.g, s: .9 });
  // … the bowl doesn't: it squirts out of the wet hands sideways, tumbling — 「ဟာ」
  life.say(hero, 'ဟာ', 1.8, 1.7); hero.anim.emote('bang', 2); it.water && (it.water.visible = false);
  const to = L.LAND4.clone().add(V(p * .8, (rnd() - .5) * .4)); // a bit further the harder you threw — always in ④'s yard
  flight = { it, p, t: 0, dur: 1.15 + .35 * p, from, to, h: 3.3 + 2.4 * p, crossed: false };
  for (const k of [hero, ...GANG]) k.anim.emote('bang', 2.6); // five kids: shock
  W.orbit?.focus(it.g, { dist: 7, t: .4 });
  return true;
}
W.tick(dt => {
  const f = flight; if (!f?.it) return;
  f.t += dt; const k = Math.min(1, f.t / f.dur), g = f.it.g, side = Math.min(1, k / .15);
  g.position.lerpVectors(f.from, f.to, k); g.position.y = f.from.y * (1 - k) + 4 * f.h * k * (1 - k);
  if (k < .15) g.position.addScaledVector(V(Math.cos(hero.g.rotation.y), -Math.sin(hero.g.rotation.y)), .3 * Math.sin(side * Math.PI)); // the fumble: out of the hands to the left first
  g.rotation.x += dt * 9; g.rotation.z += dt * 5;
  if (!f.crossed && g.position.x > L.FENCE4.x) { f.crossed = true; lastThrow.clear = +(g.position.y - L.FENCE4.y).toFixed(2); W.orbit?.focus(L.FENCE4, { dist: 10, t: .6 }); }
  if (k >= 1) { g.position.copy(f.to); g.rotation.set(0, g.rotation.y, 0); f.it.state = 'ground'; lastThrow.land = { x: +f.to.x.toFixed(2), z: +f.to.z.toFixed(2), side4: f.to.x > L.FENCE4.x }; flight = null; afterThrow(); }
});
async function afterThrow() {
  await wait(1.5); W.orbit?.release(); bowl.g.visible = false; // a ④ kid has it now
  hud.cinematic(false);
  await story.play('1-7', 'after');
  scene18();
}

// ---------- what you can do, where (E prompts; goal() = the goal marker points here) ----------
const on = st => () => S.step === st && !story.playing && !flight;
const SPOTS = [
  // home
  { at: () => HOME_OUT, r: 1.1, label: () => inside || !['1-2', '1-3', '1-4', '1-5'].includes(S.step) ? null : 'အိမ်ထဲ ဝင်', goal: () => false, run: () => enter('home') },
  { at: () => ROOMS.home.door, r: .9, label: () => inside === 'home' && ['1-1', '1-2', '1-3', '1-4', '1-5'].includes(S.step) && !story.playing ? 'အပြင် ထွက်' : null, goal: () => S.step === '1-1' && !story.playing, run: goOut },
  { at: () => bwabwa.g.position, r: 1.3, label: () => inside === 'home' && S.step !== '1-8' && !story.playing ? 'ဘွားဘွား' : null, goal: () => false, run: () => { bwabwa.anim.emote('heart'); face(bwabwa); } },
  // 1-2: Nga Zwe waiting at the lane head (walk up to him)
  { auto: true, at: () => ngazwe.g.position, r: 2.2, label: () => on('1-2')() && !inside ? 'ငဇွဲ' : null, goal: on('1-2'), run: () => scene12() },
  // 1-3 M1: the empty bucket hangs; splash water up into it until it's heavy enough to come down with the cloth
  { at: () => BUCKET_SPOT, r: 1.5, label: () => !on('1-3')() ? null : BK.fill < 1 ? 'ပုံးထဲ ရေပက်ထည့် 💦' : BK.y < .2 && !pc.item && bCloth.visible ? 'ပိတ်စ ယူ' : null, goal: () => on('1-3')() && !pc.item, run: m1 },
  { at: () => mandat.pileAt, r: 1.6, label: () => S.step === '1-3' && pc.item?.def.name === 'ပိတ်စ' ? 'ပိတ်စ ချ' : S.step === '1-4' && speaker ? 'အသံချဲ့စက် ချ' : S.step === '1-5' && pc.item?.def.name === 'မီးကြိုး' ? 'မီးကြိုး ချ' : null,
    goal: () => (S.step === '1-3' && pc.item?.def.name === 'ပိတ်စ') || (S.step === '1-4' && !!speaker) || (S.step === '1-5' && pc.item?.def.name === 'မီးကြိုး'), run: putDown },
  // 1-4 M2: Cho Cho's line when you get there; the roof, not the cat; then the two of you carry it
  { auto: true, at: () => L.AMP.at, r: 3.6, label: () => on('1-4')() && !MISSION.told ? 'ရွှေဝါ' : null, goal: () => on('1-4')() && !MISSION.told, run: () => { MISSION.told = true; scene14(); } },
  { at: () => AMP_SPOT, r: 1.3, label: () => !on('1-4')() ? null : !MISSION.catDown ? 'သွပ်မိုးကို ရေပက် 💦' : !speaker ? 'အသံချဲ့စက် မ (ဖိုးကျော်နဲ့)' : null, goal: () => on('1-4')() && !speaker, run: m2 },
  // 1-5 M3: Ko Zaw's string; water on it starts it over — shield it with the bucket
  { at: () => TABLE_SPOT, r: 1.2, label: () => on('1-5')() && !fixing && pc.item?.def.name !== 'မီးကြိုး' ? 'မီးကြိုး ပြင် 💡' : null, goal: () => on('1-5')() && (MISSION.wet === 0 || pc.item === shield), run: m3 },
  { at: () => shield?.g.position ?? V(0, -99, -99), r: 1.0, label: () => on('1-5')() && shield?.state === 'ground' && !pc.item ? 'ပုံး ကောက် 🪣' : null, goal: () => on('1-5')() && MISSION.wet > 0 && shield?.state === 'ground', run: () => takeNow(shield) },
  // 1-7: take the bowl, fill it, throw
  { at: () => mandat.seatAt, stand: () => V(mandat.seatAt.x, 3.35), r: 1.6, label: () => on('1-7')() && bowl.state === 'placed' ? 'ဖလား ကောက်' : null, goal: () => on('1-7')() && bowl.state === 'placed', run: () => takeNow(bowl) },
  { at: () => WATER, r: 1.3, label: () => on('1-7')() && pc.item === bowl && !bowl.water?.visible ? 'ဖလားနဲ့ ရေခပ်' : null, goal: () => on('1-7')() && pc.item === bowl && !bowl.water?.visible, run: scoop },
  { at: () => THROW, r: 1.4, label: () => on('1-7')() && pc.item === bowl && bowl.water?.visible && !pc.busy ? 'ပစ်' : null, goal: () => on('1-7')() && pc.item === bowl && !!bowl.water?.visible, run: throwBowl },
  // the shops (off the main street — out of Mum's range on day 1)
  { at: () => L.BARBER, r: 1.3, label: () => null /* v6: the hero is a cast.js kid; the wardrobe still dresses the v4 adult (T6 decides) */, goal: () => false, run: () => enter('barber') },
  { at: () => L.CLOTHES, r: 1.3, label: () => null, goal: () => false, run: () => enter('clothes') },
  { at: () => L.TEA, r: 1.4, label: () => W.night() > .3 ? null : 'လက်ဖက်ရည်ဆိုင်ထဲ ဝင်', goal: () => false, run: () => enter('tea') },
  ...['tea', 'clothes', 'barber'].map(n => ({ at: () => ROOMS[n].door, r: .9, label: () => inside === n ? 'အပြင် ထွက်' : null, goal: () => false, run: goOut })),
  { at: () => V(MY_TABLE.seats[0].x, MY_TABLE.seats[0].z), r: 1.1, label: () => inside === 'tea' && !seated ? 'ထိုင်ပြီး မှာစား ☕' : null, goal: () => false, run: () => order(MY_TABLE, MY_TABLE.seats[0]) },
  { at: () => V(ROOMS.barber.chairs[0].x, ROOMS.barber.chairs[0].z), r: 1.3, label: () => inside === 'barber' && !seated ? 'ခုံပေါ် ထိုင်ပြီး ညှပ် ✂' : null, goal: () => false, run: sitBarber },
  { at: () => ROOMS.clothes.mirror, r: 1.4, label: () => inside === 'clothes' ? 'မှန်ရှေ့မှာ ဝတ်ကြည့် 👕' : null, goal: () => false, run: tryOn },
  // ambient
  { at: () => vendor.g.position, r: 1.6, label: () => W.night() > .3 || story.playing ? null : 'ဟင်းသီးဟင်းရွက်သည်', goal: () => false, run: () => talk([['ဟင်းသီးဟင်းရွက်သည်', 'ချဉ်ပေါင်ရွက်~ ပဲပင်ပေါက်~ ခရမ်းချဉ်သီး~']], null, vendor) },
  { at: () => L.BELL, r: 1.4, label: () => 'ခေါင်းလောင်း ထိုး', goal: () => false, run: () => { W.player.anim.play('wave'); sound.fx('bell', L.BELL); hud.toast('ဒေါင်… ဒေါင်… ဒေါင်… သာဓု'); } },
];
W.tick(() => { // walk-up triggers: an auto spot runs by itself once you're in its circle
  if (W.frozen || hud.busy() || story.playing) return;
  const p = hero.g.position;
  for (const s of SPOTS) if (s.auto && s.label() && s.at().distanceTo(v.copy(p).setY(s.at().y)) < s.r) { s.run(); break; }
});

// ---------- the missions ----------
async function m1() { // M1 the cloth
  if (BK.fill >= 1) { if (bCloth.visible && BK.y < .2) { bCloth.visible = false; takeNow(holdable('cloth', 'ပိတ်စ', clothLook)); auntie.anim.play('wave'); } return; }
  face(hero, v.set(BTOP.x, 0, BTOP.z)); hero.anim.play('splash'); await wait(.4);
  jet(hero.ch.sockets.chest.getWorldPosition(new THREE.Vector3()), V(BTOP.x, BTOP.z, BK.y + .3), { own: hero.g });
  await wait(.55); addWater(.34);
}
function addWater(k) {
  if (BK.fill >= 1 || S.step !== '1-3') return;
  BK.fill = Math.min(1, BK.fill + k); bucket.rotation.x = .1;
  if (BK.fill >= 1) { bCloth.visible = true; auntie.anim.play('call'); sendBucket(BBOT.y, () => { ngazwe.anim.emote('heart'); }); } // heavy now: down it comes, the cloth on top
}
W.tick(dt => { // Nga Zwe squirts up into it too, while you're there
  if (S.step !== '1-3' || BK.fill >= 1 || story.playing || !ngazwe.g.visible) return;
  if (hero.g.position.distanceTo(V(BUCKET_SPOT.x, BUCKET_SPOT.z)) > 4) return;
  if ((MISSION.m1 -= dt) > 0) return; MISSION.m1 = 2.4;
  face(ngazwe, v.set(BTOP.x, 0, BTOP.z)); stream(ngazwe, V(BTOP.x, BTOP.z, BK.y + .3), .5); setTimeout(() => addWater(.12), 600);
});
function putDown() {
  if (S.step === '1-3') { deliver('cloth'); advance('1-4'); for (const k of [chocho, phoekyaw]) walk(k, [[-3.3, k === chocho ? .3 : -.6]], 'run'); return; }
  if (S.step === '1-4') {
    speaker = null; L.AMP.g.visible = false; deliver('speaker'); fishM.visible = false;
    const was = [chocho, phoekyaw].map(k => k.g.position.clone()); advance('1-5'); stage('1-5');
    [chocho, phoekyaw].forEach((k, i) => { put(k, was[i].x, was[i].z); walk(k, [LOT[k.id]], 'run'); }); // Cho Cho comes back from the side lane; Phoe Kyaw puts the speaker down here
    return;
  }
  if (S.step === '1-5') { deliver('lights'); kozaw.anim.play('wave'); scene16(); }
}
async function m2() { // M2 the speaker
  if (!MISSION.catDown) { // the zinc roof beside her, never her
    hud.cinematic(true); face(hero, L.ROOF.at); shweWa.dry = true; hero.anim.play('splash'); await wait(.4); // (this splash is for the roof: the drops coming off it don't count against you)
    jet(hero.ch.sockets.chest.getWorldPosition(new THREE.Vector3()), L.ROOF.at, { t: .5, own: hero.g });
    await wait(.5); roofK = 1; for (let i = 0; i < 3; i++) setTimeout(() => sound.fx('hit', L.ROOF.at), i * 140);
    if (CAT.at === 'amp') { shweWa.anim.emote('bang', 1.5); await wait(.6); CAT.at = 'down'; catTo(V(-4.6, -.9)); await wait(.8); }
    // Cho Cho holds out the dried fish; Shwe Wa trots over to her
    fishM.visible = true; face(chocho, shweWa); chocho.anim.play('wave'); CAT.at = 'fish'; MISSION.catDown = true; setTimeout(() => { shweWa.dry = false; }, 2500);
    hud.cinematic(false); return;
  }
  if (!speaker) { // Phoe Kyaw takes the other side
    speaker = { k: 0 }; L.AMP.solid.x0 = L.AMP.solid.x1 = 1e9; put(phoekyaw, AMP_SPOT.x + .2, AMP_SPOT.z - .7); hero.anim.play('pick'); phoekyaw.anim.play('pick');
  }
}
W.tick(dt => { // the amplifier rides between the two of you; he walks at your side
  if (!speaker) return;
  const p = hero.g.position, r = hero.g.rotation.y, sx = Math.cos(r), sz = -Math.sin(r); // your right-hand side, as seen from behind
  const want = V(p.x + sx * .9, p.z + sz * .9), d = phoekyaw.g.position.distanceTo(want);
  phoekyaw.g.position.lerp(want, Math.min(1, dt * 6)); phoekyaw.g.position.y = ground(phoekyaw.g.position.x, phoekyaw.g.position.z); phoekyaw.g.rotation.y = r;
  const L2 = hero.anim.loop; if (phoekyaw.anim.loop !== (d > .05 && L2 !== 'idle' ? L2 : 'idle')) phoekyaw.anim.setLoop(d > .05 && L2 !== 'idle' ? L2 : 'idle');
  L.AMP.g.position.set((p.x + phoekyaw.g.position.x) / 2, .3, (p.z + phoekyaw.g.position.z) / 2); L.AMP.g.rotation.y = r;
  hero.anim.reach.R = { target: L.AMP.g.position.clone().add(V(-sx * .2, -sz * .2, .3)), w: 1 }; phoekyaw.anim.reach.L = { target: L.AMP.g.position.clone().add(V(sx * .2, sz * .2, .3)), w: 1 };
});
W.tick(() => { if (!speaker && hero.anim.reach.R && !pc.item && !pc.busy) hero.anim.reach.R = null; if (!speaker && phoekyaw.anim.reach.L) phoekyaw.anim.reach.L = null; });
async function m3() { // M3 the lights
  face(hero, TABLE); hud.cinematic(true); MISSION.puzzle++;
  wetT = window.zone?.fast ? 1.2 : MISSION.wet ? 6 : 3.5; // the first splash comes quickly, so you learn why
  fixing = bulbs({ sound, onWin: () => { fixing = null; hud.cinematic(false); lightsDone(); }, onQuit: () => { fixing = null; hud.cinematic(false); } });
}
W.tick(dt => { // the kids splashing nearby: now and then a splash comes over the table
  if (!fixing || (wetT -= dt) > 0) return;
  wetT = 6;
  const from = V(-2.0, 1.4, .8); jet(from, V(TABLE.x, TABLE.z, .6), { n: 16, t: .5 }); maythu.anim.play('splash');
  if (pc.item === shield) { flash('💦 → 🪣 ✓'); shield.wob = 1; return; }
  flash('💦'); const f = fixing; fixing = null; f.close(); MISSION.wet++;
  story.play('1-5', 'wet').then(() => { hud.cinematic(false); hud.toast('ပုံး ကိုင်ပြီး ကာ 🪣'); });
});
function lightsDone() {
  if (shield) { cw.remove(shield); shield = null; }
  kozaw.anim.play('wave'); setTimeout(() => takeNow(holdable('lights', 'မီးကြိုး', lightsLook)), 300);
}
function scoop() { // fill the bowl from Phoe Kyaw's bucket
  hero.anim.play('pick');
  if (!bowl.water) { bowl.water = mesh(new THREE.CircleGeometry(.13, 16), new THREE.MeshBasicMaterial({ color: '#3fd3e0' }), 0, .06, 0, { parent: bowl.body, cast: false }); bowl.water.rotation.x = -Math.PI / 2; }
  bowl.water.visible = true; bowl.wetK = 1;
}

// ---------- your E: talk / spots first (hud.play), then the rules, then water ----------
const here = play(W, hud, { spots: SPOTS, goals: goalsAt, areaAt, mapAt: () => inside && (backTo ?? HOME_OUT) }).here;
const onSpot = W.onAction;
W.onAction = () => {
  if (onSpot()) return true;
  if (W.frozen || inside) return !!inside; // no water indoors
  if (pc.item || speaker) return true; // hands full
  if (!mandat.canFire(hero.g.position)) { hud.toast(mandat.rules.text('mandat')); return true; } // rule 4: not in the mandat
  if (S.ball && S.tool === 'balloon') { if (!hero.anim.one) hero.anim.play('bigthrow'); return true; }
  return false; // the bucket heave (world.js)
};
function goalsAt() {
  if (story.playing || flight) return [];
  return SPOTS.filter(s => s.goal() && (s.label() || s.auto)).map(s => s.at());
}
hud.initMap(AREAS.map(a => ({ ...a, label: a.short })), [{ x0: BOUNDS.x0, x1: BOUNDS.x1, z0: 6.6, z1: 12.2 }, { x0: 11.8, x1: 14.2, z0: 13.0, z1: BOUNDS.z1 }], BOUNDS);

// ---------- the ward's own ticks: the vendor's call, the gang at play, lamps, shutters, the market roofs, the sound ----------
let roofA = 1, wasClosed = null, lampK = -1;
const KIDS_AT = V(2.6, 1.9);
W.tick((dt, T) => {
  const p = hero.g.position;
  VD.callT -= dt; if (VD.callT < 0 && vendor.g.visible) { call.visible = !call.visible; VD.callT = call.visible ? 2.6 : 5 + rnd() * 3; if (call.visible && !vendor.anim.one) vendor.anim.play('call'); }
  if (['1-3', '1-5'].includes(S.step) && !story.playing) for (const k of [maythu, phoekyaw, chocho]) { // the gang splash each other while they wait
    if (!k.g.visible || speaker) continue; k.idleT -= dt;
    if (k.idleT < 0 && !k.anim.one && !W.frozen) { const t = pick(GANG.filter(o => o !== k && o.g.visible)); if (t) face(k, t); k.anim.play(rnd() < .7 ? 'splash' : 'jump'); k.idleT = 2.5 + rnd() * 3; }
  }
  const inMarket = !inside && p.x < 11.8 && p.z > 13.0; roofA += ((inMarket ? .15 : 1) - roofA) * Math.min(1, dt * 4);
  for (const m of L.roofFade) { m.opacity = roofA; m.depthWrite = roofA > .95; }
  const lit = THREE.MathUtils.clamp((W.dusk() - .7) / .3, 0, 1) * (.5 + .5 * W.night());
  if (Math.abs(lit - lampK) > .005) { lampK = lit; const bk = W.orbit ? .55 : 1; L.lamp.bulb.color.setRGB(.85 + 2.0 * lit * bk, .82 + 1.5 * lit * bk, .77 + .6 * lit * bk); L.lamp.glow.opacity = .5 * lit; }
  const shut = W.night() > .3; if (shut !== wasClosed) { wasClosed = shut; for (const n of [vendor, frondMan, mohingaLady, betelMan, phoneGirl]) n.g.visible = !shut; call.visible = false; for (const sh of L.shutters) sh.visible = shut; }
  { let crowd = 0; for (const ch of W.chars) if (ch.on && ch !== hero && ch.g.parent === scene && Math.abs(ch.g.position.x - p.x) + Math.abs(ch.g.position.z - p.z) < 7) crowd++;
    const mk = p.x < 11.8 && p.z > 13.0 ? 1 : THREE.MathUtils.clamp(1 - Math.max(p.x - 11.8, 13.0 - p.z) / 6, 0, 1);
    let engine = 0; for (const vp of life.vehicles()) engine = Math.max(engine, 1 - Math.hypot(vp.x - p.x, vp.z - p.z) / 9);
    sound.env({ phase: { morning: 'morning', day: 'day', five: 'late', night: 'evening' }[day.at] ?? 'day', night: W.night(), inside, engine, market: shut ? 0 : mk, crowd: Math.min(1, crowd / 10),
      water: THREE.MathUtils.clamp(1 - p.distanceTo(KIDS_AT) / 9, 0, 1), kyaung: THREE.MathUtils.clamp(1 - p.distanceTo(L.MONASTERY) / 14, 0, 1) }); }
  for (const s of L.spin) s.rotation.y += dt * 2;
  for (const f of TR.spin) f.rotation.y += dt * 9;
});
$('goal').addEventListener('click', () => $('goal').classList.toggle('open'));
$('eagain').addEventListener('click', e => { e.stopPropagation(); wipe(); location.search = '?new'; });

// ---------- go ----------
stage(S.step); save();
W.start();
if (DEBUG) window.zone = { W, S: () => S, day, story, mandat, cw, pc, hero, people: PEOPLE, SPOTS, hud, here, sound, L, life, bowl, bucket: () => ({ ...BK }), lastThrow, mission: MISSION,
  bulbs: () => fixing, talking: () => hud.talking(), mini: () => hud.mini(), stage, fast: false,
  // tests: do what the goal points at — go there and press E (an auto spot just needs you there)
  next() {
    if (hud.busy() || story.playing || flight || fixing) return 'busy';
    const s = SPOTS.find(s => s.goal() && (s.label() || s.auto)); if (!s) return null;
    const at = s.stand?.() ?? s.at().clone().add(V(s.auto ? .4 : .25, s.auto ? .4 : .25)), lab = s.label(); hero.g.position.set(at.x, W.ground(at.x, at.z), at.z); W.snapCam();
    if (!s.auto) s.run(); return lab;
  } };
if (S.step === '1-1') $('title').classList.add('gone'); else day.title(S.day, 1800); // scene11 shows the day's title itself
({ '1-1': scene11, '1-6': scene16, '1-7': () => story.play('1-7'), '1-8': () => story.play('1-8'), done: () => day.card('ရက် ၂ — မကြာခင်') })[S.step]?.();
