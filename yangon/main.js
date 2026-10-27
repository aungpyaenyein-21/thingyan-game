// yangon/main.js — story day 1, Yangon (STORY.md §၄). You come home for Thingyan; the kids want a mandat of their own.
// Walk the whole ward — home lane, main street, market, pagoda — and do nine favours for nine parts of a coconut-frond
// mandat. Build it with the kids, watch the sun go down over it, then catch the night bus to Mandalay.
import { createWorld, PAL, SKINS } from '../world.js?v=8';
import { CAT_COATS } from '../critters.js?v=5';
import { buildSet, BOUNDS, ground, AREAS, areaAt, shwedagon, frondGeo, MM } from './set.js?v=12';
import { createHud, play } from './hud.js?v=2';
import { openBarber, openClothes, makePlayer, redress } from './wardrobe.js?v=3';
import { buildRooms } from './rooms.js?v=4';
import { icon, TEA_MENU, teaColor } from './icons.js?v=1';
import { startLife } from './life.js?v=8';
import { createSound } from '../sound.js?v=3';
import { load as loadSave, save as store, wipe, finish, travel, party as partyOf, ERRANDS, ITEMS, WHERE, NEED } from './save.js?v=4';

const W = createWorld({ bounds: BOUNDS, ground, paintSky: shwedagon, camBounds: { x0: -3, x1: 27, z0: -4, z1: 30 }, view: 16 });
const { THREE, scene, M, mesh, box, cyl, textTex, stripeTex, bubbleTex, bean, rnd, pick } = W;
const L = buildSet(W);
const ROOMS = buildRooms(W); // the tea shop, the tailor's, the barber's — walk in from the street
const hud = createHud(W);
const sound = createSound(W); W.onFx = (n, p) => sound.fx(n, p); // ambience + effects, no music yet
const v = new THREE.Vector3();

// ---------- save (shared with downtown: save.js) ----------
const S = loadSave(); S.at = 'ward';
if (S.q.padauk === 'climb') S.q.padauk = 'school'; // older saves: the padauk errand now goes by the school
const save = () => store(S);

// ---------- the stage parts: one per favour; ghosts until found ----------
const GHOST = new THREE.MeshBasicMaterial({ color: '#fff6ea', transparent: true, opacity: .3, depthWrite: false });
const parts = {}, SX = L.STAGE.x, SZ = L.STAGE.z;
const P = (k, m) => { W.keep(m); m.userData.real = m.material; (parts[k] ??= []).push(m); return m; };
const FROND = frondGeo(THREE), frondM = M('#7fae5a', { side: THREE.DoubleSide });
let banner;
{
  // fronds part: bamboo platform, posts and beams, a gable of coconut fronds, a frond arch over the front
  P('fronds', box(3.2, .45, 2.0, PAL.bamboo, SX, .02, SZ));
  for (const [px, pz] of [[-1.5, -.9], [1.5, -.9], [-1.5, .9], [1.5, .9]]) P('fronds', cyl(.07, .07, 2.5, PAL.bamboo, SX + px, .47, SZ + pz, 6));
  for (const pz of [-.9, .9]) P('fronds', box(3.3, .08, .08, PAL.bamboo, SX, 2.9, SZ + pz));
  P('fronds', box(3.4, .08, .08, PAL.bamboo, SX, 3.45, SZ));
  for (let i = 0; i < 11; i++) for (const side of [-1, 1]) {
    const f = P('fronds', mesh(FROND, frondM, SX - 1.65 + i * .33, 3.45, SZ)); f.rotation.set(0, side > 0 ? -Math.PI / 2 : Math.PI / 2, -.42); f.scale.setScalar(1.75);
  }
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { // the arch: fronds fanning up from the front posts
    const f = P('fronds', mesh(FROND, frondM, SX + s * 1.5, 2.5, SZ + 1.0)); f.rotation.set(0, s > 0 ? Math.PI : 0, .5 + i * .28); f.scale.setScalar(1.2);
  }
  // cloth: a striped backdrop and the platform skirt
  P('cloth', mesh(new THREE.PlaneGeometry(3.0, 2.2), new THREE.MeshLambertMaterial({ map: stripeTex('#f48fb1', '#fff6ea', 6), side: THREE.DoubleSide }), SX, 1.6, SZ - .88, { cast: false }));
  P('cloth', mesh(new THREE.PlaneGeometry(3.2, .42), new THREE.MeshLambertMaterial({ map: stripeTex('#ffc83d', '#c8553d', 10) }), SX, .25, SZ + 1.01, { cast: false }));
  banner = P('sign', mesh(new THREE.PlaneGeometry(2.4, .5), new THREE.MeshLambertMaterial({ map: textTex(S.signName, PAL.red, '#ffe7a3', 512, 110, 64) }), SX, 2.55, SZ + .95, { cast: false }));
  for (let i = 0; i < 9; i++) P('padauk', mesh(new THREE.IcosahedronGeometry(.12, 0), PAL.padauk, SX - 1.45 + i * .36, 2.84 - Math.sin(i / 8 * Math.PI) * .14, SZ + .98));
  for (let i = 0; i <= 12; i++) P('lights', mesh(new THREE.SphereGeometry(.06, 8, 6), new THREE.MeshBasicMaterial({ color: i % 2 ? new THREE.Color(2.8, 2.3, 1.2) : new THREE.Color(2.8, 1.5, 1.4) }), SX - 1.6 + i * .27, 2.98, SZ + 1.0, { cast: false }));
  for (const px of [-1.25, 1.25]) P('cat', box(.36, .55, .32, '#26222b', SX + px, .47, SZ - .6));
  P('drum', cyl(.32, .32, .8, '#3f8fd0', SX + 2.1, .02, SZ - .6, 14)); P('drum', cyl(.33, .33, .05, '#2f73c4', SX + 2.1, .5, SZ - .6, 14));
  // nozzle (from the big downtown stage): a brass sprinkler up on the ridge
  P('nozzle', cyl(.05, .05, .5, '#c99a4a', SX, 3.45, SZ + .1, 8)); P('nozzle', mesh(new THREE.SphereGeometry(.12, 10, 8), new THREE.MeshStandardMaterial({ color: '#d9a84a', metalness: .9, roughness: .35 }), SX, 4.0, SZ + .1));
  P('tea', mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[SX + 2.1, .85, SZ - .6], [SX + 1.9, 1.0, SZ], [SX + 1.5, .6, SZ + .4], [SX + 1.2, .55, SZ + .95]].map(p => new THREE.Vector3(...p))), 16, .05, 6), '#4fb3d9'));
}
let stageSolid = false;
function showParts() {
  for (const k in parts) for (const m of parts[k]) { const have = S.parts.includes(k); m.material = have ? m.userData.real : GHOST; m.castShadow = have; }
  if (S.parts.includes('fronds') && !stageSolid) { stageSolid = true; W.solid(SX, SZ, 3.2, 2.0); }
}
const setBanner = name => { banner.userData.real = new THREE.MeshLambertMaterial({ map: textTex(name, PAL.red, '#ffe7a3', 512, 110, name.length > 12 ? 48 : 64) }); showParts(); };

// ---------- the rope bucket (ကြိုးဆွဲပုံး) from Auntie Sein's 3rd-floor balcony ----------
const AB = L.flatsA.bal(3, 2), BTOP = AB.at(.55, .2, .38), BBOT = BTOP.clone().setY(.06);
const bucket = W.keep(new THREE.Group()); scene.add(bucket);
cyl(.27, .2, .42, '#3f8fd0', 0, 0, 0, 12, { parent: bucket });
mesh(new THREE.TorusGeometry(.26, .02, 4, 16, Math.PI), '#2b2730', 0, .42, 0, { parent: bucket });
const load = {
  money: [box(.28, .04, .16, '#6fae7a', 0, .4, 0, { parent: bucket })],
  veg: [mesh(new THREE.IcosahedronGeometry(.15, 0), PAL.leaf, -.06, .46, 0, { parent: bucket }), mesh(new THREE.SphereGeometry(.08, 8, 6), PAL.red, .1, .46, .05, { parent: bucket }), mesh(new THREE.SphereGeometry(.08, 8, 6), PAL.red, .08, .47, -.08, { parent: bucket })],
  cloth: [mesh(new THREE.BoxGeometry(.38, .18, .28), new THREE.MeshLambertMaterial({ map: stripeTex('#f48fb1', '#fff6ea', 6) }), 0, .48, 0, { parent: bucket })],
};
const rope = W.keep(mesh(new THREE.CylinderGeometry(.02, .02, 1, 4), '#efe3c8', 0, 0, 0, { cast: false }));
const BK = { y: BTOP.y, to: BTOP.y, then: null };
const fill = what => { for (const k in load) load[k].forEach(m => m.visible = k === what); };
const sendBucket = (down, then) => { BK.to = down ? BBOT.y : BTOP.y; BK.then = then; };
const bucketBusy = () => Math.abs(BK.y - BK.to) > .01 || !!BK.then;
W.tick((dt, T) => {
  const d = BK.to - BK.y; BK.y += Math.sign(d) * Math.min(Math.abs(d), dt * 1.3);
  if (Math.abs(BK.y - BK.to) <= .01 && BK.then) { const f = BK.then; BK.then = null; f(); }
  const sw = Math.abs(BK.y - BK.to) > .01 ? Math.sin(T * 5) * .05 : Math.sin(T * 1.3) * .01;
  bucket.position.set(BTOP.x + sw, BK.y, BTOP.z); bucket.rotation.z = sw * .5;
  const len = BTOP.y + .5 - (BK.y + .42);
  rope.position.set(BTOP.x + sw * .5, BK.y + .42 + len / 2, BTOP.z); rope.scale.y = Math.max(.01, len); rope.rotation.z = -sw * .3 / Math.max(len, .5);
});
const BUCKET_SPOT = new THREE.Vector3(BTOP.x, 0, BTOP.z + .55);

const CLIP = W.renderer.clippingPlanes = [new THREE.Plane(new THREE.Vector3(-1, 0, 0), BOUNDS.x1 + .001), new THREE.Plane(new THREE.Vector3(1, 0, 0), -BOUNDS.x0 + .001)]; // bus slides in/out of the island sides

// ---------- people ----------
const near = (c, r = 1.8) => c.g.position.distanceTo(W.player.g.position) < r;
const face = (c, t = W.player) => { c.g.rotation.y = Math.atan2(t.g.position.x - c.g.position.x, t.g.position.z - c.g.position.z); };
const npc = (o, y) => { const c = bean({ prop: 'none', print: '', ...o }); if (y !== undefined) c.g.position.y = y; return c; };
// the player, dressed from the save (barber / clothes shop change S.look)
W.setPlayer(makePlayer(W, S, 4.6, 6.25, Math.PI)); hud.tool(W.player.ch.tool);
let seated = null; // { ry } while you sit on a stool / in the barber's chair; moving stands you up
const dress = () => { redress(W, S); if (seated) { W.player.anim.setLoop('sit'); W.player.g.rotation.y = seated.ry; } save(); };
const auntie = npc({ hair: 'bun', flower: true, age: 'adult', skin: SKINS[1], shirt: '#e9a0b4', topStyle: 'yinphone', bottom: 'htamein', bottomColor: ['#7a4a9a', '#c79be0'], hat: 'none', build: 'round' });
auntie.g.position.copy(AB.at(-.3, .08, -.08)); auntie.dry = true;
const grandma = npc({ age: 'elder', hair: 'bun', flower: true, shirt: '#fff6ea', topStyle: 'yinphone', bottom: 'htamein', bottomColor: ['#3f6fa8', '#8fb8e8'], hat: 'none', x: 6.7, z: -4.45 }, .32);
const UNCLE = new THREE.Vector3(-5.15, 0, -.7);
const uncle = npc({ age: 'elder', hair: 'short', topStyle: 'taikpon', shirt: '#f3ead8', bottom: 'longyi', hat: 'none', x: UNCLE.x, z: UNCLE.z, ry: Math.PI / 2 });
const kids = [
  bean({ age: 'kid', hair: 'pigtails', shirt: '#ff7f6b', bottom: 'skirt', prop: 'gun', hat: 'none', x: 3.4, z: 4.0, ry: -2.2 }),
  bean({ age: 'kid', hair: 'buzz', shirt: '#4fd1c5', bottom: 'shorts', tool: 'bucket', hat: 'band', x: 1.7, z: 3.5, ry: 2.2 }),
  bean({ age: 'kid', hair: 'bob', shirt: '#b388ff', bottom: 'overalls', prop: 'gun', hat: 'none', x: 4.9, z: 3.3, ry: -1.0 }),
];
const KIDS_AT = new THREE.Vector3(3.3, 0, 3.6), ON_STAGE = [[SX - .9, SZ + .35], [SX, SZ - .1], [SX + .9, SZ + .35]];
// ① vegetable seller pushing her cart up and down the back lane, calling out
const vendor = npc({ hair: 'bun', age: 'adult', skin: SKINS[2], shirt: '#e9b44c', topStyle: 'yinphone', bottom: 'htamein', bottomColor: ['#6e4428', '#a8743a'], hat: 'bucket', x: 6, z: -2.65 });
const cart = W.keep(new THREE.Group()); scene.add(cart);
{
  const o = { parent: cart };
  box(1.1, .3, .7, '#a8744a', 0, .55, 0, o); for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(.26, .04, 6, 14), '#2b2730', 0, .3, s * .4, o);
  for (const s of [-1, 1]) box(.05, .05, .5, '#8a5a3a', -.75, .82, s * .25, o);
  for (let i = 0; i < 6; i++) mesh(new THREE.IcosahedronGeometry(.13, 0), pick([PAL.leaf, PAL.leafLight]), -.3 + (i % 3) * .3, .95, (i < 3 ? -.15 : .15), o);
  for (let i = 0; i < 4; i++) mesh(new THREE.SphereGeometry(.07, 8, 6), PAL.red, .35 + (i % 2) * .12, .92, -.2 + (i >> 1) * .14, o);
}
const call = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex('ဟင်းသီး~ ဟင်းရွက်~'), depthWrite: false })); call.scale.set(2.8, .88, 1); call.position.y = 2.3; call.visible = false; vendor.g.add(call);
const VD = { callT: 2 }, CORNER = new THREE.Vector3(-2.0, 0, -1.0); // ① where the side lane meets the back lane
vendor.g.position.set(CORNER.x, ground(CORNER.x, CORNER.z + .7), CORNER.z + .7); vendor.g.rotation.y = Math.PI; // behind her cart, facing the lane
cart.position.set(CORNER.x, .02, CORNER.z); W.solid(CORNER.x, CORNER.z, 1.3, .8);
cyl(.03, .03, 2.1, '#8f8794', CORNER.x + .55, .02, CORNER.z + .2, 5, { parent: cart.parent }); mesh(new THREE.CylinderGeometry(.02, 1.0, .32, 8, 1, true), new THREE.MeshLambertMaterial({ map: stripeTex('#4f8f5a', '#fff6ea', 8), side: THREE.DoubleSide }), CORNER.x + .55, 2.1, CORNER.z + .2); // her sun umbrella
// ② main street
// ③ the big tea shop by the market is packed inside; the barber and the tailor work in their shops on ②
const TR = ROOMS.tea, seat = (o, st) => { const c = npc({ ...o, x: st.x, z: st.z, ry: st.ry }, .05 + (st.lift || 0)); c.anim.setLoop('sit'); return c; };
const teaBoss = npc({ age: 'adult', hair: 'short', topStyle: 'tank', shirt: '#fff6ea', bottom: 'longyi', hat: 'none', x: TR.boss.x, z: TR.boss.z }, .05);
const ORDERS = [['ပေါ့ဆိမ့်', 'pawsein'], ['ချိုဆိမ့်', 'chosein'], ['ကျဆိမ့်', 'kyasein']]; // tea-shop shorthand: light, sweet, strong
const SERVE = [0, 1, 3]; // which tables are waiting on the boy who went home
const customers = SERVE.map((t, i) => seat({ age: i === 1 ? 'elder' : 'adult' }, TR.tables[t].seats[i % 2]));
const friend = seat({ age: 'adult', hair: 'spiky', hairColor: '#4a2e22', topStyle: 'jacket', shirt: '#2e3a59', bottom: 'pants', hat: 'none', name: 'ဖိုးသာ' }, TR.tables[2].seats[1]);
const oldMen = TR.tables[5].seats.map(st => seat({ age: 'elder', topStyle: 'taikpon', bottom: 'longyi' }, st)); // two old men at their usual table, putting the world to rights
seat({ age: 'adult' }, TR.tables[1].seats[0]).anim.setLoop('eat'); // palata and tea, alone with the TV
const MY_TABLE = TR.tables[4];
const betelMan = npc({ age: 'elder', hair: 'short', topStyle: 'shirt', shirt: '#dfe8f0', bottom: 'longyi', hat: 'none', x: 16.7, z: 4.55 }, .14);
const barber = npc({ age: 'adult', hair: 'spiky', hairColor: '#2b1d1a', topStyle: 'shirt', shirt: '#fff6ea', bottom: 'pants', hat: 'none', x: ROOMS.barber.boss.x, z: ROOMS.barber.boss.z }, .05);
const tailor = npc({ age: 'adult', hair: 'bun', topStyle: 'yinphone', shirt: '#7a4a9a', bottom: 'htamein', hat: 'none', x: ROOMS.clothes.boss.x, z: ROOMS.clothes.boss.z, ry: Math.PI }, .05);
const phoneGirl = npc({ age: 'adult', hair: 'long', topStyle: 'tee', shirt: '#f2c14e', bottom: 'skirt', hat: 'none', x: 26.1, z: 4.95 }, .14);
// ③ market
const frondMan = npc({ age: 'adult', hair: 'short', topStyle: 'tank', shirt: '#86b96d', bottom: 'longyi', hat: 'bucket', x: -6.9, z: 25.1 });
const mohingaLady = npc({ age: 'adult', hair: 'bun', topStyle: 'yinphone', shirt: '#e9a0b4', bottom: 'htamein', hat: 'none', x: 9.4, z: 15.0, ry: 0 });
const lightsMan = npc({ age: 'adult', hair: 'spiky', topStyle: 'jacket', bottom: 'pants', hat: 'none', x: 3.0, z: 22.7, ry: 0 });
// (vendors, shoppers, the bus, traffic, chinlone, knots of people chatting … live in life.js)
// ④ pagoda + monastery: monks are never splashed (dry) and never joked about (VISION.md §၉)
const ROBE = { topStyle: 'long', shirt: '#9a3a2a', bottom: 'longyi', bottomColor: ['#8a3a2a', '#a8432f'], hair: 'buzz', hairColor: '#3a2a26', hat: 'none', thanaka: false, flower: false, garland: false };
const novices = [npc({ ...ROBE, age: 'kid', x: L.WELL.x, z: L.WELL.z + .2 }), npc({ ...ROBE, age: 'kid', x: L.POND.x - .4, z: L.POND.z + 1 })];
const abbot = npc({ ...ROBE, age: 'elder', x: L.MONASTERY.x, z: L.MONASTERY.z - .4, ry: 0 });
[...novices, abbot].forEach(m => { m.dry = true; });
W.idlers.push(grandma, auntie, uncle, betelMan, barber, tailor, phoneGirl, teaBoss);
// time of day follows the story: morning while you start out, the afternoon, the late afternoon once most parts are in, then evening
const PHASE = { morning: 'မနက်ခင်း', day: 'နေ့လယ်', late: 'ညနေစောင်း', evening: 'ည' };
const phase = () => S.step === 'arrive' || (S.step === 'quests' && S.parts.length < 3) ? 'morning' : ['evening', 'done'].includes(S.step) ? 'evening' : S.step === 'build' || S.parts.length >= 6 ? 'late' : 'day';
const life = startLife(W, { L, BOUNDS, ground, phase }); // the ward going about its day
life.knot(oldMen, true);
// a weekly journal held open (ဂျာနယ်): football, film stars — what everyone reads over their tea
const JOURNAL = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 84; const q = c.getContext('2d'); q.fillStyle = '#f6f1e6'; q.fillRect(0, 0, 64, 84);
  q.fillStyle = '#c8553d'; q.fillRect(4, 4, 56, 10); q.fillStyle = '#7a8fd0'; q.fillRect(6, 20, 26, 22); q.fillStyle = '#5a5560'; for (let y = 22; y < 80; y += 6) q.fillRect(y < 44 ? 36 : 6, y, y < 44 ? 22 : 52, 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide }); })();
const journal = (c, y = .56, z = .3) => { const g = new THREE.Group(); c.g.add(g); g.position.set(0, y, z); for (const s of [-1, 1]) mesh(new THREE.PlaneGeometry(.26, .34), JOURNAL, s * .12, 0, 0, { parent: g, cast: false }).rotation.y = -s * .4; return g; };
{ // and everyone else: the place is full — pairs over their tea, talking; on their own, most have a journal open
  const look = () => ({ age: pick(['adult', 'adult', 'adult', 'elder']), hat: 'none' });
  for (const [t, both] of [[0, 0], [3, 0], [6, 1], [7, 0], [8, 1], [9, 1], [10, 1], [11, 0]]) {
    const tb = TR.tables[t], who = (both ? tb.seats : [tb.seats[t < 6 ? 1 : 0]]).map(st => seat(look(), st));
    if (who.length > 1) life.knot(who, true); else if (t % 2) journal(who[0]); else who[0].anim.setLoop('eat');
  }
}
journal(oldMen[0]); // one reads the football out loud to the other
// the boys who wait tables (စားပွဲထိုးလေး): to a table and back with a tray, calling the orders to the counter; one minds the door
// and asks what you'll have; an old man goes round the tables selling the papers
const ROOM_FLOOR = () => .05, AI = TR.aisle;
const trayOf = c => { const g = new THREE.Group(); c.g.add(g); g.position.set(0, .82, .3); cyl(.2, .2, .03, '#9aa3ad', 0, 0, 0, 12, { parent: g }); for (const dx of [-.07, .08]) cyl(.05, .04, .1, '#c8945a', dx, .03, 0, 8, { parent: g }); return g; };
const BOY = { age: 'kid', hair: 'buzz', topStyle: 'shirt', shirt: '#fff6ea', bottom: 'longyi', hat: 'none' };
const boys = [0, 1].map(i => { const c = npc({ ...BOY, x: TR.counter.x + i * .8, z: TR.counter.z, ry: Math.PI }, .05); c.floor = ROOM_FLOOR; c.tray = trayOf(c); c.tray.visible = false; return c; });
async function waitTables(c, i) {
  for (;;) {
    await life.wait(1.5 + rnd() * 3);
    const t = pick(TR.tables.filter(t => t !== MY_TABLE)), ax = AI.xs.reduce((a, x) => Math.abs(x - t.x) < Math.abs(a - t.x) ? x : a);
    c.tray.visible = true; await life.walk(c, [[ax, AI.zs[0]], [ax, t.z]], 'carry');
    c.g.rotation.y = Math.sign(t.x - ax) * Math.PI / 2; c.tray.visible = false; c.anim.play('wave'); if (rnd() < .5) life.say(c, pick(['ရပါပြီ~', 'ပူပူလေး~', 'သုံးဆောင်ပါ~']), 1.6, 1.6);
    await life.wait(1.4);
    await life.walk(c, [[ax, AI.zs[0]], [TR.counter.x + i * .8, TR.counter.z]]);
    c.g.rotation.y = Math.PI; life.say(c, pick(['ပေါ့ဆိမ့် နှစ်ခွက်!', 'ပလာတာ တစ်ချပ်!', 'ကျဆိမ့် တစ်ခွက်!', 'ရေနွေးကြမ်း ထပ်!']), 1.6, 1.6); // calls the order to the counter
  }
}
boys.forEach((c, i) => setTimeout(() => waitTables(c, i), i * 1800));
const cook = npc({ age: 'adult', hair: 'short', topStyle: 'tank', shirt: '#fff6ea', bottom: 'longyi', hat: 'none', x: TR.boss.x - 1.6, z: TR.boss.z, ry: 0 }, .05); // the palata man at his griddle
box(.9, .08, .5, '#3b3040', TR.boss.x - 1.6, 1.05, TR.boss.z + .55); cyl(.22, .22, .02, '#e8b85a', TR.boss.x - 1.6, 1.13, TR.boss.z + .55, 12);
const DOOR_POST = new THREE.Vector3(TR.door.x + 1.4, 0, TR.door.z - .9);
const doorBoy = npc({ ...BOY, shirt: '#e9e1d2', x: DOOR_POST.x, z: DOOR_POST.z, ry: -Math.PI / 2 }, .05); doorBoy.floor = ROOM_FLOOR;
const paperMan = npc({ age: 'elder', hair: 'short', topStyle: 'shirt', shirt: '#dfe8f0', bottom: 'longyi', hat: 'bucket', x: AI.xs[2], z: AI.zs[2] }, .05); paperMan.floor = ROOM_FLOOR;
journal(paperMan, .95, .32); // he holds one open so you can see what's in it this week
(async () => {
  const P = [[AI.xs[2], AI.zs[2]], [AI.xs[0], AI.zs[2]], [AI.xs[0], AI.zs[1]], [AI.xs[2], AI.zs[1]]];
  for (let k = 1; ; k++) { await life.walk(paperMan, [P[k % 4]], 'carry'); if (rnd() < .7) life.say(paperMan, pick(['သတင်းစာ~ ဂျာနယ်~', 'ဘောလုံးဂျာနယ်~ ဒီနေ့ထွက်~', 'ရုပ်ရှင်ဂျာနယ်~ ယူမလား~']), 2, 1.9); await life.wait(1 + rnd() * 2); }
})();
// in at the door: the boy comes over and asks what you'll have (press E by him to order); he goes back to the door after a while
async function greet() {
  const p = W.player.g.position;
  await life.walk(doorBoy, [[p.x + 1.0, p.z - .6]]); face(doorBoy); doorBoy.asking = true;
  life.say(doorBoy, 'ကြွပါ ကြွပါ! ဘာသုံးဆောင်မလဲ ခင်ဗျာ', 4, 1.6);
  await life.wait(9); if (doorBoy.asking) boyBack();
}
const boyBack = () => { doorBoy.asking = false; life.walk(doorBoy, [DOOR_POST]).then(() => { doorBoy.g.rotation.y = -Math.PI / 2; }); };
function askBoy() {
  const B = 'စားပွဲထိုးလေး'; face(doorBoy);
  talk([[B, 'ကြွပါ ကြွပါ! ဘာသုံးဆောင်မလဲ ခင်ဗျာ။'], [B, 'လက်ဖက်ရည်၊ ကော်ဖီ၊ ပလာတာ၊ ပေါက်စီ… အကုန်ရတယ်။ ဟိုဘက်မှာ စားပွဲလွတ် ရှိတယ်နော်။']], () => {
    hud.menu({ title: '☕ ' + B, close: 'ခဏ ကြည့်ဦးမယ်', items: [{ label: 'ထိုင်ပြီး မှာမယ်', note: 'စားပွဲလွတ်မှာ', on: () => { order(MY_TABLE, MY_TABLE.seats[0]); return true; } }] });
    boyBack();
  }, doorBoy);
}
W.onTool = t => { S.tool = t; save(); hud.tool(t); };

W.addPet('dog', 'house', 3.6, -3.75);     // home dog on the porch step
W.addPet('cat', 'house', -2.0, -4.6);     // cat at the stairwell
W.addPet('dog', 'walker', 0, -2.4);
W.addPet('dog', 'shop', 11.2, 30.0);      // waiting by the tea shop for scraps
W.addPet('dog', 'shop', 7.6, 25.6);       // and by the mohinga pot
W.addPet('dog', 'park', 21.0, 28.4);      // asleep in the shade at the trishaw stand
W.addPet('cat', 'house', 28.6, 5.0);      // pharmacy step
// Shwe Wa (ရွှေဝါ), U Ba Tin's ginger cat: up on the old car's roof since the kids' water scared her this morning
const ROOF = new THREE.Vector3(L.CAR.x, 1.2, L.CAR.z - .2);
const shweWa = W.addPet('cat', 'house', L.CAR.x + 1.0, L.CAR.z, { coat: CAT_COATS[0], socks: true });
const meow = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex('ညောင်~'), depthWrite: false })); meow.scale.set(1.3, .42, 1); meow.position.y = .7; meow.visible = false; shweWa.g.add(meow);
const CAT = { meowT: 2, hop: null };
shweWa.hit = () => { shweWa.anim.soak(); shweWa.anim.emote('bang'); };
function catHome() { shweWa.held = false; shweWa.home.set(UNCLE.x + .6, 0, UNCLE.z + .6); shweWa.target = null; shweWa.anim.setLoop('sit'); if (!CAT.hop) shweWa.g.position.set(UNCLE.x + .6, ground(UNCLE.x + .6, UNCLE.z + .6), UNCLE.z + .6); }

// ---------- the story's street: the veg cart, the kids, Shwe Wa, the barber pole ----------
const party = () => partyOf(S);
let roofA = 1;
// after dark (the evening party): street lamps on, the market and the shops shut, their people gone home
const closed = () => party() && W.night() > .3;
const SHUT = 'ညဘက် ဆိုင်ပိတ်သွားပြီ 🌙';
let wasClosed = null, lampK = -1;
W.tick((dt, T) => {
  const player = W.player;
  // vendor: stands at her corner with the cart, calls out every few seconds, beckons when you're close
  VD.callT -= dt; if (VD.callT < 0 && vendor.g.visible) { call.visible = !call.visible; VD.callT = call.visible ? 2.6 : 5 + rnd() * 3; if (call.visible && !vendor.anim.one) vendor.anim.play('call'); }
  // kids: splash each other; once the mandat is up they dance on it and get you too
  for (const k of kids) {
    k.idleT -= dt;
    if (k.idleT < 0 && !k.anim.one && !W.frozen) {
      const you = party() && near(k, 4) && rnd() < .6, t = you ? player : pick(kids.filter(o => o !== k));
      face(k, t); k.anim.play(rnd() < .65 ? 'splash' : 'jump'); k.idleT = (party() ? 1.8 : 2.5) + rnd() * 3;
    }
  }
  const p = player.g.position;
  // Shwe Wa: on the roof (meowing) → hop down → trots after you → home by U Ba Tin
  const c = shweWa, cp = c.g.position, q = S.q.cat;
  if (CAT.hop) { const h = CAT.hop; h.t += dt / .7; const k = Math.min(1, h.t); cp.lerpVectors(h.from, h.to, k); cp.y += Math.sin(k * Math.PI) * .5; if (k >= 1) { CAT.hop = null; c.held = 'follow'; } }
  else if (c.held === 'roof') { cp.copy(ROOF); if (c.anim.loop !== 'sit') c.anim.setLoop('sit'); c.g.rotation.y = .6; }
  else if (c.held === 'follow') {
    const want = v.set(-Math.sin(player.g.rotation.y), 0, -Math.cos(player.g.rotation.y)).multiplyScalar(.8).add(p), d = Math.hypot(want.x - cp.x, want.z - cp.z);
    const loop = d > 2.2 ? 'run' : d > .35 ? 'walk' : 'sit'; if (c.anim.loop !== loop) c.anim.setLoop(loop);
    if (loop !== 'sit') { c.g.rotation.y = Math.atan2(want.x - cp.x, want.z - cp.z); const s = Math.min(d, c.anim.speed * dt); cp.x += (want.x - cp.x) / d * s; cp.z += (want.z - cp.z) / d * s; }
    if (d > 8) cp.set(want.x, 0, want.z); // never lost round a corner
    cp.y = ground(cp.x, cp.z);
  }
  meow.visible = c.held === 'roof' && ['search', 'fish', 'lure'].includes(q) && (CAT.meowT -= dt) < 1.6;
  if (CAT.meowT < 0) CAT.meowT = 4 + rnd() * 2;
  // in the market the roofs go see-through, so you can see the lanes and yourself under them
  const inMarket = !inside && p.x < 11.8 && p.z > 13.0; roofA += ((inMarket ? .15 : 1) - roofA) * Math.min(1, dt * 4);
  for (const m of L.roofFade) { m.opacity = roofA; m.depthWrite = roofA > .95; }
  const lit = THREE.MathUtils.clamp((W.dusk() - .7) / .3, 0, 1) * (.5 + .5 * W.night());
  if (Math.abs(lit - lampK) > .005) { lampK = lit; L.lamp.bulb.color.setRGB(.85 + 2.0 * lit, .82 + 1.5 * lit, .77 + .6 * lit); L.lamp.glow.opacity = .5 * lit; }
  const shut = closed(); if (shut !== wasClosed) { wasClosed = shut; for (const n of [vendor, frondMan, mohingaLady, lightsMan, betelMan, phoneGirl]) n.g.visible = !shut; call.visible = false; for (const sh of L.shutters) sh.visible = shut; }
  { // what you hear: the street, the market, people near you, water, the kyaung — or the inside of a shop
    let crowd = 0; for (const ch of W.chars) if (ch.on && ch !== player && ch.g.parent === scene && Math.abs(ch.g.position.x - p.x) + Math.abs(ch.g.position.z - p.z) < 7) crowd++;
    const mk = p.x < 11.8 && p.z > 13.0 ? 1 : THREE.MathUtils.clamp(1 - Math.max(p.x - 11.8, 13.0 - p.z) / 6, 0, 1);
    let engine = 0; for (const vp of life.vehicles()) engine = Math.max(engine, 1 - Math.hypot(vp.x - p.x, vp.z - p.z) / 9);
    sound.env({ phase: phase(), night: W.night(), inside, engine, market: closed() ? 0 : mk, crowd: Math.min(1, crowd / 10),
      water: THREE.MathUtils.clamp(1 - p.distanceTo(KIDS_AT) / 9, 0, 1) * (party() ? 1.5 : 1), kyaung: THREE.MathUtils.clamp(1 - p.distanceTo(L.MONASTERY) / 14, 0, 1) });
  }
  for (const s of L.spin) s.rotation.y += dt * 2;
  for (const f of TR.spin) f.rotation.y += dt * 9; // the tea shop's ceiling fans
});

// ---------- HUD: goals, bag ----------
const $ = id => document.getElementById(id);
const QGOALS = {
  cloth: { ask: 'အန်တီစိန်ကို မေး — ကြိုးဆွဲပုံး ဝရန်တာ', money: 'ပုံးထဲက ပိုက်ဆံ ယူ', buy: 'လမ်းကြားထဲက ဟင်းသီးဟင်းရွက်သည်ဆီက ဝယ်', return: 'ဟင်းသီးဟင်းရွက်ကို ပုံးထဲ ထည့်ပေး', lifting: 'အန်တီစိန် ပုံးဆွဲတင်နေတယ်…', cloth: 'ပုံးထဲက ပိတ်စ ယူ' },
  padauk: { ask: 'အဘွားကို ပိတောက်ပန်းအကြောင်း မေး', school: 'ဈေးနောက်က မူလတန်းကျောင်းထဲ ပိတောက်ပင်ဆီ သွား', dad: 'ထူးထူးနောက် လိုက် — သူ့အဖေဆီက လှေကား ငှား', carry: 'လှေကားနဲ့ ကျောင်းက ပိတောက်ပင် တက်ပြီး ခူး', shrine: 'ပထမခက်ကို ဘုရားကပ်ဖို့ အဘွားကို ပေး' },
  cat: { ask: 'ဘေးလမ်းက ဦးဘတင်ကို မေး', search: 'ညောင်သံ လိုက်ရှာ — ရွှေဝါ ဘယ်မှာလဲ', fish: 'ကြောင်ချော့ဖို့ ငါးခြောက် — ဟင်းသီးဟင်းရွက်သည်ဆီ', lure: 'ငါးခြောက်နဲ့ ရွှေဝါကို ချော့', follow: 'ရွှေဝါကို ဦးဘတင်ဆီ ပြန်ခေါ်' },
  tea: { ask: 'လက်ဖက်ရည်ဆိုင် ဆရာကို မေး', serve: 'စားပွဲ ၃ ဝိုင်းကို လက်ဖက်ရည် ချပေး', back: 'ဆရာဆီ ပြန်သွား' },
  sign: { ask: 'ကွမ်းယာဆိုင် အဘကို မေး' },
  fronds: { ask: 'ဈေးထဲက အုန်းလက်ဆိုင် ကိုအောင်ကို မေး', mohinga: 'မုန့်ဟင်းခါးဆိုင်မှာ တစ်ပွဲ ဝယ်', bring: 'မုန့်ဟင်းခါးကို ကိုအောင်ဆီ ပို့' },
  lights: { ask: 'ဈေးထဲက မီးကြိုးဆိုင် ကိုဇော်ကို မေး', cord: 'လမ်းမက ဖုန်းဆိုင်မှာ ကြိုးခွေ ယူ', bring: 'ကြိုးခွေကို ကိုဇော်ဆီ ပို့' },
  drum: { ask: 'ဘုန်းကြီးကျောင်းက ကိုရင်လေးတွေကို မေး', carry: 'ရေတွင်းကနေ ကန်ထဲ ရေ ၃ ပုံး သယ်', abbot: 'ဆရာတော်ဆီ သွား' },
  nozzle: { soak: '⑤ မြို့လယ် မဏ္ဍပ် ၃ ခုမှာ ရေပက်ခံ', back: '⑤ ရေပက်အဖွဲ့ ကိုကြီးဆီ ပြန်သွား' },
};
const GOALS = { arrive: 'ကွက်လပ်မှာ ဆော့နေတဲ့ ကလေးတွေဆီ သွားပါ (① အိမ်နဲ့ လမ်းကြား)', build: 'ပစ္စည်း ပြည့်ပြီ! ကွက်လပ်မှာ ကလေးတွေနဲ့ မဏ္ဍပ်လေး ဆောက်ပါ', evening: 'ညကား ထွက်ခါနီးပြီ — ဘတ်စ်ကားမှတ်တိုင်ကနေ မန္တလေး ထွက်ပါ', done: 'ရက် ၁ ပြီးပြီ။ ရပ်ကွက်ထဲ ဆက်လည်လို့ရတယ်' };
function hud2() {
  if (S.step === 'quests') {
    const todo = ERRANDS.filter(k => S.q[k] !== 'done');
    $('gtext').innerHTML = ERRANDS.map(k => S.q[k] === 'done' ? `<div class="ok">✓ ${ITEMS[k]}</div>`
      : `<div class="${S.q[k] === 'ask' ? 'todo' : 'now'}">· <b>${ITEMS[k]}</b> — ${S.q[k] === 'ask' ? WHERE[k] : QGOALS[k][S.q[k]]}</div>`).join('')
      + `<div class="more">ကျန် ${MM(todo.length)} ခု · တို့ပြီး စာရင်းအပြည့် ကြည့်</div>`;
  } else $('gtext').textContent = GOALS[S.step];
  $('stage').hidden = S.step === 'arrive';
  $('scount').textContent = `${MM(S.parts.length)}/${MM(NEED)}`;
  const bag = [];
  if (S.gifts) bag.push(`လက်ဆောင်ထုပ် ×${MM(S.gifts)}`);
  if (S.q.cloth === 'buy') bag.push('ပိုက်ဆံ ၁၀၀၀ ကျပ်');
  if (S.q.cloth === 'return') bag.push('ချဉ်ပေါင်ရွက်', 'ခရမ်းချဉ်သီး');
  if (S.q.padauk === 'carry') bag.push('ဝါးလှေကား'); if (S.q.padauk === 'shrine') bag.push('ပိတောက်ခက် ×၃');
  if (S.q.cat === 'lure') bag.push('ငါးခြောက်');
  if (S.q.tea === 'serve') bag.push(`လက်ဖက်ရည် ×${MM(3 - S.served.length)}`);
  if (S.q.fronds === 'bring') bag.push('မုန့်ဟင်းခါး တစ်ပွဲ');
  if (S.q.lights === 'bring') bag.push('ကြိုးခွေ');
  if (S.q.drum === 'carry' && S.carrying) bag.push('ရေပုံး');
  $('bag').innerHTML = bag.map(b => `<span>${b}</span>`).join('');
  if (!party()) W.setTime(phase() === 'late' ? .07 : 0);
  $('where').firstChild.nodeValue = `အကြိုနေ့ · ၁/၅ · ${PHASE[phase()]}\n  `;
  showParts(); save();
}
$('goal').addEventListener('click', () => $('goal').classList.toggle('open'));
function gotPart(q) {
  const all = finish(S, q); hud2(); hud.toast(`+ ${ITEMS[q]}  (${MM(S.parts.length)}/${MM(NEED)})`);
  kids.forEach(k => { k.anim.play('jump'); k.anim.emote('heart'); });
  if (all) setTimeout(() => after(() => hud.say([['', 'ပစ္စည်း ကိုးမျိုးလုံး စုံပြီ။ ကလေးတွေဆီ ပြန်သွားပြီး မဏ္ဍပ်လေး ဆောက်ကြစို့!']])), 1200);
}
if (S.step === 'build' && S.at === 'ward' && !S.toldBuild) { S.toldBuild = true; setTimeout(() => after(() => hud.say([['', 'ပစ္စည်း ကိုးမျိုးလုံး စုံပြီ။ ကလေးတွေဆီ ပြန်သွားပြီး မဏ္ဍပ်လေး ဆောက်ကြစို့!']])), 2500); } // came back from downtown with the last part
const after = f => hud.busy() ? setTimeout(() => after(f), 400) : f();
const ME = 'ကျွန်တော်';
const talk = (lines, done, who) => { if (who) face(who); hud.talk(lines, done); };

// ---------- the nine favours (the ninth is downtown: downtown.js) ----------
function talkKids() {
  kids.forEach(k => face(k));
  if (S.step === 'arrive') return talk([
    ['မေသူ', 'ဦးလေး! ဦးလေး ပြန်ရောက်ပြီ!'],
    ['ဖိုးကျော်', 'ဦးလေး… ဒီနှစ် ရပ်ကွက်မှာ မဏ္ဍပ် မဆောက်ကြဘူးတဲ့။ လမ်းမကြီးက မဏ္ဍပ်ကိုလည်း အမေက မသွားခိုင်းဘူး။'],
    ['ချိုချို', 'သမီးတို့ ရေကစားချင်တယ်…'],
    [ME, 'ရော့… ဦးလေး ဝယ်လာတဲ့ မုန့်လေးတွေ။ ပြီးတော့ — ဦးလေးတို့ ကိုယ်ပိုင် မဏ္ဍပ်လေး ဆောက်ကြမယ်! ဒီကွက်လပ်မှာ၊ အုန်းလက်မိုးနဲ့။'],
    ['မေသူ', 'ဟေး!! ဒါဆို အုန်းလက်၊ ဝါး၊ ပိတ်စ၊ ရေပိုက်၊ ရေစည်၊ ဆိုင်းဘုတ်၊ မီးကြိုး၊ အသံချဲ့စက် … အများကြီး လိုမယ်နော်။'],
    ['ဖိုးကျော်', 'ရပ်ကွက်တစ်ပတ် လှည့်ရှာရမှာ! အိမ်နားမှာ၊ လမ်းမမှာ၊ ဈေးထဲမှာ၊ ဘုန်းကြီးကျောင်းမှာ… မြို့လယ် မဏ္ဍပ်ကြီးမှာတောင်!'],
    ['ချိုချို', 'မသိရင် သမီးတို့ကို လာမေးနော်။ ဘယ်သူ့ဆီ သွားရမလဲ ပြောပြမယ်။'],
  ], () => { S.step = 'quests'; S.gifts--; hud2(); kids.forEach(k => k.anim.emote('heart')); hud.toast('ကလေးမဏ္ဍပ် — ပစ္စည်း ၉ မျိုး ရှာမယ်'); });
  if (party()) return talk([
    ['မေသူ', `ဦးလေး! ကျေးဇူးပဲ! ရပ်ကွက်မှာ အလှဆုံး မဏ္ဍပ်ပဲ — “${S.signName}”!`],
    ['ဖိုးကျော်', 'ဦးလေး ဒီည မန္တလေး သွားမှာလား… နောက်နှစ်လည်း ပြန်လာနော်။'],
    ['ချိုချို', 'မသွားခင် ဦးလေးကို ရေပက်ချင်တယ်!'],
  ], () => kids.forEach((k, i) => setTimeout(() => { face(k); k.anim.play('splash'); }, i * 250)));
  if (S.step === 'build') return talk([['မေသူ', 'ပစ္စည်း စုံပြီ! ဆောက်ကြစို့ ဦးလေး!']]);
  const LEAD = { cloth: 'အန်တီစိန်ဆီမှာ ပိတ်စ အဟောင်းတွေ ရှိတယ်။ ကြိုးဆွဲပုံး ဝရန်တာ!', padauk: 'ဘွားဘွားက ပိတောက်ပန်း ဘယ်မှာ ပွင့်လဲ သိတယ်! သွားမေးကြည့်။', cat: 'ဦးဘတင်ဆီမှာ အသံချဲ့စက် ရှိတယ်… ကြောင် ပျောက်နေလို့ စိတ်ညစ်နေတယ်။',
    tea: 'ဈေးနောက်က လက်ဖက်ရည်ဆိုင်ကြီးမှာ ရေပိုက်ခွေ အပို ရှိတယ်။ ဆရာ အလုပ်များနေတယ်။', sign: 'ကွမ်းယာဆိုင် အဘက စာလှလှ ရေးတတ်တယ်!', fronds: 'ဈေးထဲမှာ အုန်းလက်နဲ့ ဝါး ရောင်းတဲ့ ကိုအောင် ရှိတယ်။',
    lights: 'ဈေးထဲက ကိုဇော်ဆီမှာ မီးကြိုး ရှိတယ်။', drum: 'ဘုန်းကြီးကျောင်းမှာ ရေစည် အဟောင်းတွေ ရှိတယ်တဲ့။ ကိုရင်လေးတွေကို မေးကြည့်။',
    nozzle: 'ဆူးလေက မဏ္ဍပ်ကြီးမှာ ရေပန်းခေါင်း ရှိတယ်! သမီးတို့ မသွားရဘူး… ဦးလေး ဘတ်စ်ကားနဲ့ သွားယူပေး!' };
  const todo = ERRANDS.filter(k => S.q[k] !== 'done'), names = ['ဖိုးကျော်', 'ချိုချို', 'မေသူ'];
  talk([['မေသူ', `${MM(S.parts.length)} မျိုး ရပြီ! နောက်ထပ် ${MM(todo.length)} မျိုး ရှာရဦးမယ်။`], ...todo.slice(0, 3).map((k, i) => [names[i], LEAD[k]])]);
}
function useBucket() {
  const A = 'အန်တီစိန်', q = S.q.cloth;
  if (S.step !== 'quests' || q === 'done') return talk([[A, S.step === 'arrive' ? 'ဟဲ့ သားလေး ပြန်ရောက်ပြီလား! ကလေးတွေ ကွက်လပ်မှာ စောင့်နေကြတယ်။' : 'ကလေးတွေ ပျော်နေတာ မြင်ရတော့ အန်တီလည်း ပျော်တယ်။ ရေတော့ အပေါ်ထပ်ကို မပက်နဲ့နော်!']]);
  if (q === 'ask') return talk([
    [ME, 'အန်တီစိန်ရေ!'], [A, 'ဟဲ့… သားလေး မဟုတ်လား! ပြန်ရောက်ပြီကိုး။ ဝလာလိုက်တာ။'],
    [A, 'ပိတ်စလား… ရှိတယ် ရှိတယ်။ ဒါပေမဲ့ အန်တီ ဒူးနာနေလို့ အောက်မဆင်းနိုင်ဘူး။'],
    [A, 'ဟင်းသီးဟင်းရွက်သည် ဖြတ်သွားရင် ချဉ်ပေါင်ရွက် တစ်စည်းနဲ့ ခရမ်းချဉ်သီး ဝယ်ပေးပါလား။ ပိုက်ဆံ ပုံးထဲ ထည့်ချပေးမယ်။'],
  ], () => { fill('money'); sendBucket(true, () => { S.q.cloth = 'money'; hud2(); }); });
  if (q === 'money') { fill(null); S.q.cloth = 'buy'; hud2(); return hud.toast('+ ပိုက်ဆံ ၁၀၀၀ ကျပ်'); }
  if (q === 'return') {
    fill('veg'); S.q.cloth = 'lifting'; hud2();
    return sendBucket(false, () => talk([[A, 'ကျေးဇူးပဲ သားလေး။ ခရမ်းချဉ်သီးတွေ လတ်လိုက်တာ။'], [A, 'ရော့… အန်တီ့ ထဘီ ပိတ်စ အဟောင်းတွေ။ ကလေးတွေ မဏ္ဍပ်အတွက်ဆို အန်တီ ဝမ်းသာတယ်။']],
      () => { fill('cloth'); sendBucket(true, () => { S.q.cloth = 'cloth'; hud2(); }); }));
  }
  if (q === 'cloth') { fill(null); auntie.anim.play('wave'); sendBucket(false); return gotPart('cloth'); }
  talk([[A, 'ဟင်းသီးဟင်းရွက်သည်က လမ်းကြားထဲ လှည့်နေတယ်။ အော်သံ ကြားရမှာပါ။']]);
}
function talkVendor() {
  const V = 'ဟင်းသီးဟင်းရွက်သည်';
  if (S.q.cloth === 'buy') return talk([[V, 'ချဉ်ပေါင်ရွက်~ ပဲပင်ပေါက်~ ဘာယူမလဲ မောင်လေး။'], [ME, 'ချဉ်ပေါင်ရွက် တစ်စည်းနဲ့ ခရမ်းချဉ်သီး ပေးပါ။ အန်တီစိန် မှာလိုက်တာပါ။'], [V, 'အော် အန်တီစိန်အတွက်လား။ ခရမ်းချဉ်သီး တစ်လုံး ပိုထည့်ပေးမယ်။ သင်္ကြန်ပဲဟာ!']],
    () => { S.q.cloth = 'return'; hud2(); hud.toast('+ ချဉ်ပေါင်ရွက်၊ ခရမ်းချဉ်သီး'); }, vendor);
  if (S.q.cat === 'fish') return talk([[ME, 'အဒေါ် ငါးခြောက် ရှိလား… ကြောင်တစ်ကောင် ချော့ဖို့ပါ။'], [V, 'ဦးဘတင်ရဲ့ ရွှေဝါလား! မနက်ကတည်းက ကားခေါင်မိုးပေါ်က မဆင်းဘူး။ ရော့… ငါးခြောက်ခေါင်း၊ ပိုက်ဆံ မယူပါဘူး။']],
    () => { S.q.cat = 'lure'; hud2(); hud.toast('+ ငါးခြောက်'); }, vendor);
  talk([[V, 'ချဉ်ပေါင်ရွက်~ ပဲပင်ပေါက်~ ခရမ်းချဉ်သီး~ သင်္ကြန်ကျရင် ဈေးပိတ်မှာ၊ အခုပဲ ဝယ်ထားကြ!']], null, vendor);
}
function talkGrandma() {
  const G = 'အဘွား', q = S.q.padauk;
  if (party()) return talk([[G, 'မုန့်လုံးရေပေါ် ကျက်ပြီ… ငရုတ်သီးပါတဲ့လုံး ဘယ်သူ ကြုံမလဲ မသိဘူး။'], [G, 'ညကား မမီမှာ စိုးလို့ စောစောသွားနော် မြေးလေး။ ရောက်ရင် ဖုန်းဆက်။']], null, grandma);
  if (S.step === 'quests' && q === 'ask') return talk([
    [ME, 'ဘွားဘွား… ကလေးတွေ မဏ္ဍပ်အတွက် ပိတောက်ပန်း ဘယ်မှာ ရနိုင်မလဲ။ အိမ်ဘေးက အပင်က မပွင့်သေးဘူး။'],
    [G, 'ဒီနှစ် ပိတောက် နောက်ကျနေတယ် မြေးလေး။ ရပ်ကွက်ထဲမှာ မူလတန်းကျောင်းထဲက အပင်ကြီးတစ်ပင်ပဲ ပွင့်သေးတယ်။'],
    [G, 'ဈေးနောက်က ကျောင်းလေ။ ခူးရင် ဘွားဘွားကိုလည်း ပေးဦးနော်… ပထမဆုံးခက်ကို ဘုရားကပ်ချင်လို့။'],
  ], () => { S.q.padauk = 'school'; hud2(); }, grandma);
  if (['school', 'dad', 'carry'].includes(q)) return talk([[G, 'မူလတန်းကျောင်းထဲက ပိတောက်ပင်လေ မြေးလေး… ဈေးနောက်ဘက်မှာ။ အပင်က မြင့်တယ်၊ သတိထားနော်။']], null, grandma);
  if (q === 'shrine') return talk([[ME, 'ဘွားဘွား… ပထမဆုံးခက်ပါ။'], [G, 'သာဓု သာဓု။ မြေးလေး ကြီးလာလိုက်တာ… ကျန်တဲ့ခက်တွေ ကလေးတွေ မဏ္ဍပ်မှာ ချိတ်လိုက်။']],
    () => { grandma.anim.play('kadaw'); gotPart('padauk'); }, grandma);
  talk([[G, 'မြေးလေး ပြန်ရောက်ပြီပေါ့… ဘယ်လောက်တောင် ကြာသွားပြီလဲ။'], [G, 'ဒီနေ့ ညနေ ဘွားဘွား မုန့်လုံးရေပေါ် လုပ်မယ်။ ကလေးတွေကိုပါ ခေါ်ခဲ့။']], null, grandma);
}
// ---------- the padauk: only the big tree in the school yard is out in flower; Htoo Htoo's dad lends a bamboo ladder ----------
const TREE = L.SCHOOL_TREE, HTOO = 'ထူးထူး', DAD_N = 'ဦးမြင့် (ထူးထူးအဖေ)';
const ladderMesh = () => { const g = W.keep(new THREE.Group()); for (const s2 of [-.22, .22]) cyl(.035, .035, 2.4, PAL.bamboo, 0, 0, s2, 5, { parent: g }); for (let i = 1; i < 7; i++) box(.05, .04, .5, PAL.bamboo, 0, i * .33, 0, { parent: g }); return g; };
const carried = ladderMesh(); carried.position.set(0, .35, -.28); carried.rotation.set(.12, Math.PI / 2, -.35); carried.scale.setScalar(.8); // on your back
const atTree = ladderMesh(); atTree.position.set(TREE.x + .55, 0, TREE.z + .55); atTree.rotation.set(0, Math.PI / 4, -.3); scene.add(atTree); // left leaning on the tree
const htoo = npc({ age: 'kid', hair: 'buzz', topStyle: 'tee', shirt: '#4fb3d9', bottom: 'shorts', hat: 'none', name: HTOO, x: TREE.x - 1.2, z: TREE.z - 1.0, ry: 2.2 });
const dad = npc({ age: 'adult', hair: 'short', topStyle: 'shirt', shirt: '#dfe8f0', bottom: 'longyi', hat: 'none', x: L.DAD.x, z: L.DAD.z, ry: 0 });
const HOME_WAY = [[15.3, 34.6], [14.4, 34.6], [14.4, 29.4], [26.2, 29.4], [26.2, 34.9], [L.DAD.x + .8, L.DAD.z + .2]];
W.tick(() => {
  const q = S.q.padauk, carry = q === 'carry';
  if (carry && carried.parent !== W.player.g) W.player.g.add(carried); // (re-attach if the wardrobe rebuilt you)
  carried.visible = carry; L.LADDER_WALL.visible = !['carry', 'shrine', 'done'].includes(q); atTree.visible = ['shrine', 'done'].includes(q);
});
function askHtoo() {
  const q = S.q.padauk;
  if (q === 'school') return talk([
    [ME, 'ပိတောက်ပင်က မြင့်လိုက်တာ… အကိုင်းတွေ ဒီအတိုင်း လှမ်းလို့ မမီဘူး။'],
    [HTOO, 'ဦးလေး ပိတောက် ခူးမလို့လား? ကျွန်တော့်အဖေဆီမှာ ဝါးလှေကား ရှိတယ်!'],
    [HTOO, 'အိမ်က ကျောင်းနောက်မှာပဲ — လာ၊ လိုက်ခဲ့!'],
  ], () => { S.q.padauk = 'dad'; hud2(); life.walk(htoo, HOME_WAY, 'run').then(() => face(htoo, dad)); }, htoo);
  if (q === 'dad') return talk([[HTOO, 'အဖေ! အဖေ! ဦးလေးက လှေကား ငှားချင်လို့တဲ့!']], null, htoo);
  talk([[HTOO, pick(['ပိတောက်ပန်း မွှေးတယ်နော် ဦးလေး!', 'သင်္ကြန်ပြီးရင် ကျောင်းပြန်ဖွင့်မယ်… မဖွင့်စေချင်ဘူး!', 'ကျွန်တော် ဒန်းအမြင့်ဆုံး စီးနိုင်တယ်!'])]], null, htoo);
}
function talkDad() {
  if (S.q.padauk === 'dad') return talk([
    [DAD_N, 'ထူးထူး ပြောပြပြီ။ ကျောင်းက ပိတောက်ခူးမလို့ဆို — ရော့ ဝါးလှေကား။ ဟောင်းပေမယ့် ခိုင်တယ်။'],
    [DAD_N, 'အကိုင်းငယ်တွေ ကျိုးတတ်တယ်၊ သတိထားတက်။ ပြီးရင် အပင်မှာပဲ ထောင်ထားခဲ့၊ ညနေ ကျွန်တော် လာယူမယ်။'],
  ], () => { S.q.padauk = 'carry'; hud2(); hud.toast('+ ဝါးလှေကား'); life.walk(htoo, [...HOME_WAY].reverse().slice(1).concat([[TREE.x - 1.2, TREE.z - 1.0]]), 'run'); }, dad);
  talk([[DAD_N, pick(['သင်္ကြန်ကျရင် ကလေးတွေ ကျောင်းထဲ သွားဆော့နေကြတာပဲ။', 'ညနေ မဏ္ဍပ်ပွဲ ကျွန်တော်တို့လည်း လာမယ်။'])]], null, dad);
}
function climb() {
  W.player.g.position.set(TREE.x + .35, 0, TREE.z + .5); face(W.player, { g: { position: TREE } }); W.lift = .95; carried.visible = false; atTree.visible = true;
  hud.timing({ title: 'ပိတောက်ခက် ခူး', onHit: () => { W.player.anim.emote('heart'); for (let i = 0; i < 12; i++) W.spawn(v.set(TREE.x + (rnd() - .5), 1.9, TREE.z + (rnd() - .5)), new THREE.Vector3((rnd() - .5) * 1.5, rnd() * 1.5, (rnd() - .5) * 1.5)); },
    onMiss: () => { W.player.anim.play('shake'); hud.toast('လွဲသွားတယ်… ပွင့်တွေ ကြွေကုန်ပြီ'); },
    onDone: () => { W.lift = 0; W.player.g.position.set(TREE.x - .3, 0, TREE.z - 1.1); S.q.padauk = 'shrine'; hud2(); hud.toast('+ ပိတောက်ခက် ×၃'); } });
}
function talkUncle() {
  const U = 'ဦးဘတင်', q = S.q.cat;
  if (S.step === 'quests' && q === 'ask') return talk([
    [ME, 'ဦးဘတင်… ကလေးတွေ မဏ္ဍပ်အတွက် အသံချဲ့စက် ငှားလို့ရမလား။'],
    [U, 'ရတာပေါ့ ငါ့တူရယ်… ဒါပေမဲ့ ဦးလေး ရွှေဝါ ပျောက်နေတယ်။ မနက်က ကလေးတွေ ရေပက်တာ လန့်ပြီး ထွက်ပြေးသွားတာ။'],
    [U, 'ညောင်သံကတော့ ကြားနေရတယ်… ဝေးဝေး မရောက်ပါဘူး။ ရှာပေးပါလား။'],
  ], () => { S.q.cat = 'search'; hud2(); }, uncle);
  if (q === 'follow' && near(shweWa, 3)) return talk([[U, 'ရွှေဝါ!! ဘယ်တွေ သွားနေတာလဲ သမီးရယ်…'], [U, 'ကျေးဇူးပဲ ငါ့တူ။ ရော့ — ဘုရားပွဲသုံး အသံချဲ့စက်။ သင်္ကြန်သီချင်း ကက်ဆက်လည်း ပါတယ်။ အကျယ်ကြီး မဖွင့်နဲ့နော်… ဦးလေးအိပ်ချင်တယ်။']],
    () => { catHome(); shweWa.anim.emote('heart'); gotPart('cat'); }, uncle);
  if (['search', 'fish', 'lure'].includes(q)) return talk([[U, 'ညောင်သံ ကြားလား… ဘေးလမ်းဘက်ကပဲ ထင်တယ်။']], null, uncle);
  if (q === 'follow') return talk([[U, 'ရွှေဝါ ဘယ်မှာလဲ… နောက်က လိုက်လာနေတာလား။ အနားထိ ခေါ်လာခဲ့ပါ။']], null, uncle); // the cat fell behind
  talk([[U, S.step === 'arrive' ? 'ပြန်ရောက်လာတဲ့ ကောင်လေး မဟုတ်လား! ကြီးလာလိုက်တာ။' : 'ဒီရေဒီယိုလေး အနှစ်သုံးဆယ် ရှိပြီ… သင်္ကြန်သီချင်း ဖွင့်ရင် အသံ ကြည်တုန်းပဲ။']], null, uncle);
}
function callCat() {
  if (S.q.cat === 'lure') return talk([[ME, 'ရွှေဝါ… ငါးခြောက်လေး စားမလား…']], () => {
    shweWa.held = 'hop'; CAT.hop = { from: shweWa.g.position.clone(), to: new THREE.Vector3(L.CAR.x + .95, .05, L.CAR.z - .6), t: 0 };
    shweWa.anim.setLoop('idle'); shweWa.anim.emote('heart'); S.q.cat = 'follow'; hud2(); hud.toast('ရွှေဝါ လိုက်လာပြီ');
  });
  shweWa.anim.emote('bang'); shweWa.anim.play('hop');
  talk([[ME, 'ရွှေဝါ… ဆင်းလာလေ…'], ['', 'ရွှေဝါက ကားခေါင်မိုးပေါ်ကနေ စိုက်ကြည့်ပြီး မဆင်းဘူး။ ရေစိုမှာ ကြောက်နေပုံပဲ။'], [ME, 'ငါးခြောက်လေး ရှိရင် ဆင်းလာမလား မသိဘူး…']],
    () => { if (S.q.cat === 'search') { S.q.cat = 'fish'; hud2(); } });
}
// ② tea shop: the boy who waits tables went home for Thingyan; serve three tables in tea-shop shorthand
function talkTea() {
  const T = 'လက်ဖက်ရည်ဆိုင် ဆရာ', q = S.q.tea;
  if (S.step === 'quests' && q === 'ask') return talk([
    [ME, 'ဆရာ… ကလေးတွေ မဏ္ဍပ်အတွက် ရေပိုက် အပို ရှိလား။'],
    [T, 'ရှိတယ် ညီလေး၊ ဆိုင်ဆေးတဲ့ ရေပိုက်ခွေ အပိုတစ်ခွေ။ ဒါပေမဲ့ ခဏ ကူပါဦး — စားပွဲထိုး ကောင်လေး တစ်ယောက် သင်္ကြန် ရွာပြန်သွားလို့ ကျန်တဲ့ ကောင်လေးတွေ မနိုင်ဘူး။'],
    [T, `ဟိုစားပွဲ သုံးဝိုင်း မှာထားတာ — ${ORDERS.map(o => o[0]).join('၊ ')}။ ချပေးလိုက်ပါ။`],
  ], () => { S.q.tea = 'serve'; S.served = []; hud2(); hud.toast('လက်ဖက်ရည် ၃ ခွက် ချပေးမယ်'); }, teaBoss);
  if (q === 'back') return talk([[T, 'ကောင်းတယ် ကောင်းတယ်! စားပွဲထိုး လုပ်ဖူးသလိုပဲ။'], [T, 'ရော့ ရေပိုက်ခွေ။ ကလေးတွေကို ရေဝအောင် ပက်ခိုင်း!']], () => gotPart('tea'), teaBoss);
  if (q === 'serve') return talk([[T, `ကျန်တဲ့ စားပွဲတွေ ချပေးလိုက်ဦး — ${MM(3 - S.served.length)} ဝိုင်း။`]], null, teaBoss);
  talk([[T, 'ထိုင်ပါ ထိုင်ပါ… ပလာတာ ပူပူလေး ရမယ်။']], null, teaBoss);
}
function serve(i) {
  S.served.push(i); const c = customers[i]; c.anim.play('wave'); setTimeout(() => c.anim.setLoop('eat'), 1500); cup(TR.tables[SERVE[i]], teaColor(ORDERS[i][1]), i % 2 ? .2 : -.2);
  hud.toast(`${ORDERS[i][0]} ချပြီ  (${MM(S.served.length)}/၃)`);
  if (S.served.length >= 3) S.q.tea = 'back';
  hud2();
}
// ② betel stall: the old man remembers Thingyans past, then letters the mandat's sign — you choose its name
function talkBetel() {
  const B = 'ကွမ်းယာဆိုင် အဘ';
  if (S.step === 'quests' && S.q.sign === 'ask') return talk([
    [ME, 'အဘ… ကလေးတွေ မဏ္ဍပ်အတွက် ဆိုင်းဘုတ်လေး ရေးပေးလို့ရမလား။'],
    [B, 'ဟဲ ဟဲ… အဘ ငယ်ငယ်တုန်းကလည်း ဒီလမ်းမှာ အုန်းလက်မဏ္ဍပ် ဆောက်ခဲ့တာပဲ။ ဝါးကို ကြိုးနဲ့ချည်၊ အုန်းလက်ကို ယက်ပြီး မိုးတာ။'],
    [B, 'သင်္ကြန်ရောက်ရင် ရပ်ကွက်တစ်ခုလုံး တစ်အိမ်ထဲလို ဖြစ်သွားတာ… အခုလည်း မင်းတို့ ဆောက်မယ်ဆိုတော့ အဘ ဝမ်းသာတယ်။'],
    [B, 'ကဲ… ဆိုင်းဘုတ်မှာ ဘာနာမည် ရေးမလဲ။'],
  ], () => hud.menu({ title: 'မဏ္ဍပ်လေးရဲ့ နာမည်', close: 'နောက်မှ ရွေးမယ်', items: ['ကလေးမဏ္ဍပ်', 'ရွှေပိတောက် မဏ္ဍပ်', 'အုန်းလက် မဏ္ဍပ်', 'ရပ်ကွက် ပျော်ပွဲ'].map(n => ({ label: n, on: () => {
    S.signName = n; setBanner(n); talk([[B, `“${n}” … ကောင်းတယ်။ ရော့ — စာလုံး အနီ၊ နောက်ခံ ရွှေ။`]], () => gotPart('sign')); } })) }), betelMan);
  talk([[B, 'ကွမ်းယာ တစ်ယာ စားမလား… မစားနဲ့ မစားနဲ့၊ သွားနီကုန်မယ်။ ဟဲ ဟဲ။']], null, betelMan);
}
// ③ market: Ko Aung can't leave his frond yard and hasn't had breakfast
function talkFronds() {
  const A = 'အုန်းလက်ဆိုင် ကိုအောင်', q = S.q.fronds;
  if (S.step === 'quests' && q === 'ask') return talk([
    [ME, 'ကိုအောင်… ကလေးတွေ မဏ္ဍပ်အတွက် အုန်းလက်နဲ့ ဝါး လိုချင်လို့ပါ။'],
    [A, 'ပေးမယ် ပေးမယ်! သင်္ကြန်ရာသီ အုန်းလက်က ရောင်းအကောင်းဆုံးပဲ… ဒါပေမဲ့ ဆိုင်ကနေ ခွာလို့မရဘူး၊ မနက်စာလည်း မစားရသေးဘူး။'],
    [A, 'ဟိုဘက်က ဒေါ်မြရဲ့ မုန့်ဟင်းခါး တစ်ပွဲ ယူလာပေးပါလား။ ဘဲဥကြော် ထည့်ခိုင်းနော်။'],
  ], () => { S.q.fronds = 'mohinga'; hud2(); }, frondMan);
  if (q === 'bring') return talk([[A, 'ဟာ… ငါးဟင်းနံ့ မွှေးလိုက်တာ!'], [A, 'ရော့ — အုန်းလက် ဆယ်ခက်နဲ့ ဝါးတိုင် လေးချောင်း။ မိုးမယ်ဆို အုန်းလက်ကို ပြောင်းပြန် ထပ်၊ ရေမယိုဘူး။']], () => gotPart('fronds'), frondMan);
  talk([[A, q === 'mohinga' ? 'ဒေါ်မြဆိုင်က ဈေးရဲ့ ဟိုဘက်ထောင့်မှာ… အိုး ကြီးကြီး မြင်ရမှာ။' : 'အုန်းလက်~ ဝါး~ မဏ္ဍပ်ဆောက်မယ့်သူတွေ လာကြ!']], null, frondMan);
}
function talkMohinga() {
  const D = 'မုန့်ဟင်းခါးသည် ဒေါ်မြ';
  if (S.q.fronds === 'mohinga') return talk([[ME, 'ဒေါ်မြ… ကိုအောင်အတွက် မုန့်ဟင်းခါး တစ်ပွဲ၊ ဘဲဥကြော် ထည့်ပေးပါ။'], [D, 'အဲ့ကောင် မနက်စာ မစားရသေးဘူးလား! ရော့… ပဲကြော်ပါ အပို ထည့်ပေးလိုက်တယ်။']],
    () => { S.q.fronds = 'bring'; hud2(); hud.toast('+ မုန့်ဟင်းခါး တစ်ပွဲ'); }, mohingaLady);
  talk([[D, 'မုန့်ဟင်းခါး ပူပူလေး~ ငါးဖယ်ကြော်လည်း ရှိတယ်။']], null, mohingaLady);
}
// ③ lights: Ko Zaw has the bulbs but lent out his extension reel to the phone shop
function talkLights() {
  const Z = 'မီးကြိုးဆိုင် ကိုဇော်', q = S.q.lights;
  if (S.step === 'quests' && q === 'ask') return talk([
    [ME, 'ကိုဇော်… ကလေးမဏ္ဍပ်အတွက် မီးကြိုး တစ်ချောင်း ရမလား။'],
    [Z, 'ရတယ်! ဒါပေမဲ့ ချိတ်ဖို့ ကြိုးခွေက လမ်းမက ဖုန်းဆိုင် မမဆီ ငှားထားတယ်။ သွားယူပေးပါလား၊ ကျွန်တော် ဆိုင်စောင့်ရလို့။'],
  ], () => { S.q.lights = 'cord'; hud2(); }, lightsMan);
  if (q === 'bring') return talk([[Z, 'ရပြီ ရပြီ! ရော့ — မီးကြိုး၊ အရောင် သုံးမျိုး လင်းတယ်။'], [ME, 'ကျေးဇူး… ဒါလေး ယူထားပါ။ လက်ဆောင်ပါ။'], [Z, 'ဟာ… မလိုပါဘူးဗျာ… ဒါပေမဲ့ ကျေးဇူးပဲ!']],
    () => { if (S.gifts) S.gifts--; gotPart('lights'); }, lightsMan);
  talk([[Z, 'မီးကြိုး~ ဓာတ်မီး~ ဖုန်းအားသွင်းကြိုး~']], null, lightsMan);
}
function talkPhone() {
  const G = 'ဖုန်းဆိုင် မမ';
  if (S.q.lights === 'cord') return talk([[ME, 'မမ… ကိုဇော်ရဲ့ ကြိုးခွေ ယူခိုင်းလို့ပါ။'], [G, 'ဟုတ်သားပဲ! ရော့။ ပြီးတော့ — SIM ကတ်အသစ် ဝယ်ဦးမလား၊ အင်တာနက် မြန်တယ်နော်။ ဟိ။']],
    () => { S.q.lights = 'bring'; hud2(); hud.toast('+ ကြိုးခွေ'); }, phoneGirl);
  talk([[G, 'SIM ကတ်~ ဖုန်းဘေလ်~ သင်္ကြန် ဓာတ်ပုံရိုက်ဖို့ ဖုန်းအသစ် မလိုဘူးလား။']], null, phoneGirl);
}
// ④ monastery: the novices are refilling the fish pond for Thingyan; carry three buckets from the well
function talkNovice() {
  const K = 'ကိုရင်လေး', q = S.q.drum;
  if (S.step === 'quests' && q === 'ask') return talk([
    [ME, 'ကိုရင်… ကလေးတွေ မဏ္ဍပ်အတွက် ရေစည် အဟောင်း ရှိမလား။'],
    [K, 'ဆရာတော်ကို လျှောက်ရမယ်ဗျ… ဒါပေမဲ့ အရင် ကူပါဦး — သင်္ကြန်မတိုင်ခင် ငါးကန်ကို ရေပြည့်အောင် ဖြည့်ရမှာ။'],
    [K, 'ရေတွင်းကနေ ကန်ထဲ သုံးပုံး လောက်ပဲ လိုတော့တယ်။'],
  ], () => { S.q.drum = 'carry'; S.water = 0; S.carrying = false; hud2(); }, novices[0]);
  talk([[K, q === 'carry' ? `ကျန်သေးတယ် — ${MM(3 - S.water)} ပုံး။` : 'ငါးလေးတွေ ပျော်နေပြီ။ သာဓု။']], null, novices[0]);
}
function useWell() { S.carrying = true; W.player.anim.play('jump'); hud.toast('ရေတစ်ပုံး ခပ်ပြီ'); hud2(); }
function usePond() {
  S.carrying = false; S.water++; W.player.anim.play('splash'); hud.toast(`ကန်ထဲ လောင်းပြီ (${MM(S.water)}/၃)`);
  if (S.water >= 3) { S.q.drum = 'abbot'; novices.forEach(n => n.anim.play('wave')); }
  hud2();
}
function talkAbbot() {
  const A = 'ဆရာတော်';
  if (S.q.drum === 'abbot') return talk([
    [ME, 'တင်ပါ့ ဘုရား… ကလေးတွေ မဏ္ဍပ်အတွက် ရေစည် အဟောင်းလေး လျှောက်ချင်လို့ပါ ဘုရား။'],
    [A, 'ကိုရင်တွေကို ကူညီတာ ကြားပါတယ်ဒကာ။ ကျောင်းနောက်က ရေစည် အပြာလေး ယူသွားပါ။'],
    [A, 'ရေကစားတာ ပျော်ပါစေ၊ သူတပါးကို စိတ်မဆင်းရဲစေနဲ့။ နှစ်သစ်မှာ ကုသိုလ်တွေ တိုးပါစေ။'],
  ], () => { W.player.anim.play('kadaw'); gotPart('drum'); }, abbot);
  talk([[A, 'သင်္ကြန်ကာလ ကုသိုလ်ကောင်းမှု များများ ပြုပါဒကာ။']], null, abbot);
}

// ---------- shop interiors: walk in off the street (rooms.js) ----------
let inside = null, backTo = null;
const ROOM_NAME = { tea: 'ရွှေလမင်း လက်ဖက်ရည်ဆိုင်', clothes: 'ရွှေရည် အထည်ဆိုင်', barber: 'ဆံပင်ညှပ်ဆိုင်' };
async function enter(name) {
  const r = ROOMS[name]; hud.cinematic(true); await hud.fade(true, 350);
  backTo = W.player.g.position.clone(); inside = name; W.setRoom(r); W.renderer.clippingPlanes = []; // the island-edge clip would cut the room away
  W.player.g.position.set(r.spawn.x, .05, r.spawn.z); W.player.g.rotation.y = Math.PI; W.snapCam();
  await hud.fade(false, 350); hud.cinematic(false); hud.area(ROOM_NAME[name]);
  if (name === 'tea' && S.q.tea !== 'serve') greet();
}
async function goOut() {
  hud.cinematic(true); await hud.fade(true, 350); stand();
  W.setRoom(null); W.renderer.clippingPlanes = CLIP; W.player.g.position.copy(backTo); W.player.g.position.y = ground(backTo.x, backTo.z); W.player.g.rotation.y = 0; W.snapCam(); inside = null;
  await hud.fade(false, 350); hud.cinematic(false);
}
function sitAt(st, lift = st.lift || 0) { const p = W.player; p.g.position.set(st.x, .05, st.z); p.g.rotation.y = st.ry; p.anim.setLoop('sit'); W.lift = lift; seated = { ry: st.ry }; }
function stand() { if (!seated) return; seated = null; W.lift = 0; W.player.anim.setLoop('idle'); }
W.tick(() => { if (seated && W.player.anim.loop !== 'sit') { seated = null; W.lift = 0; } }); // walked off the stool
const cup = (t, color, dx = 0) => { const m = W.keep(mesh(new THREE.CylinderGeometry(.06, .05, .12, 8), color, t.x + dx, (t.top ?? .41) + .06, t.z + .05)); return m; };
const plate = (t, dx = 0) => { cyl(.14, .14, .02, '#fff6ea', t.x + dx, t.top ?? .47, t.z - .1, 12); return mesh(new THREE.SphereGeometry(.08, 8, 6), '#e8b85a', t.x + dx, (t.top ?? .47) + .05, t.z - .1); };
// order at a table: pick a drink and something to eat from the picture menu; the boss brings it over
function order(t, st, done) {
  sitAt(st);
  hud.menu({ title: '☕ ဘာသောက်မလဲ', close: 'မမှာတော့ဘူး', items: TEA_MENU.drinks.map(([k, n, d]) => ({ label: n, note: d, img: icon(k), on: () => {
    let picked = false;
    hud.menu({ title: '🍞 ဘာစားမလဲ', close: 'သောက်ရုံပဲ', items: TEA_MENU.snacks.map(([k2, n2, d2]) => ({ label: n2, note: d2, img: icon(k2), on: () => { picked = true; serveMe(k, n, k2, k2 === 'none' ? '' : n2); } })),
      onClose: () => { if (!picked) serveMe(k, n, 'none', ''); } });
    return true;
  } })) });
  function serveMe(k, n, k2, n2) {
    setTimeout(() => {
      if (k !== 'greentea') cup(t, teaColor(k), st.x < t.x ? -.2 : .2); if (k2 !== 'none') plate(t, st.x < t.x ? -.15 : .15);
      teaBoss.anim.play('wave');
      talk([['လက်ဖက်ရည်ဆိုင် ဆရာ', `${n}${n2 ? ' နဲ့ ' + n2 : ''} ရပါပြီ~ ရေနွေးကြမ်း လိုရင် အော်လိုက်နော်။`], [ME, k === 'greentea' ? 'ရေနွေးကြမ်း တစ်ခွက်… ဒီအရသာ လွမ်းလိုက်တာ။' : 'ဒီအရသာ… ငယ်ငယ်တုန်းက အတိုင်းပဲ။']], () => { S.ate = true; save(); done?.(); });
    }, 700);
  }
}
// the childhood friend, at the corner table as if he never left it
function talkFriend() {
  const F = 'ဖိုးသာ (ငယ်သူငယ်ချင်း)';
  const INVITE = [[F, 'ဒါနဲ့ ငါ မနက်ဖြန် မန္တလေး သွားမယ်ကွ။ ဒီည ညကားနဲ့ ထွက်မှာ။'], [F, 'ငါတို့ အတန်းဖော်တွေ မန္တလေးမှာ စောင့်နေကြတယ်။ မင်းလည်း လိုက်ခဲ့! မင်း ပြန်လာတယ်ဆိုရင် အကုန် ဝမ်းသာမှာ။'], [ME, 'ဟုတ်ပြီ! မဏ္ဍပ်လေး ပြီးရင် ညကားမှာ အတူတူ သွားမယ်။']];
  if (party() && W.night() > .5) return talk([[F, 'ညကား ထွက်တော့မယ်! လာ လာ… မန္တလေးမှာ ကောင်တွေ စောင့်နေပြီ။']], () => { S.metFriend = S.invited = true; save(); }, friend);
  if (party()) return talk([[F, 'ဒါ မင်းဆောက်တဲ့ မဏ္ဍပ်လား! ငါတို့ ငယ်ငယ်က ဆောက်ခဲ့တာထက် လှတယ်ကွာ။'], ...(S.invited ? [] : INVITE), [F, 'မှောင်ရင် ဘတ်စ်ကားမှတ်တိုင်မှာ စောင့်နေမယ်။ ညကား အတူတူ စီးမယ်နော်!']], () => { S.metFriend = S.invited = true; save(); }, friend);
  if (!S.metFriend) return talk([
    [F, 'ဟေ့… ဟေ့ကောင်! မင်းမဟုတ်လား! ပြန်လာပြီလား!'],
    [ME, 'ဖိုးသာ! မင်း ဒီဆိုင်မှာ ထိုင်တုန်းပဲလား!'],
    [F, 'ငါတို့ ကျောင်းပြေးပြီး ဒီဆိုင်မှာ ပလာတာ တစ်ချပ်ကို နှစ်ယောက် ခွဲစားခဲ့တာ မှတ်မိသေးလား။ ဆရာ့ အကြွေးစာအုပ်ထဲ ငါတို့နာမည် ရှိတုန်းပဲ။ ဟား ဟား'],
    [ME, 'ကလေးတွေအတွက် ကွက်လပ်မှာ မဏ္ဍပ်လေး ဆောက်နေတယ်ကွ။'],
    [F, 'ကောင်းတယ်! ညနေ ငါလည်း လာခဲ့မယ်။ ထိုင်ဦး — ဒီနေ့ ငါ ဒကာခံမယ်။ ဆရာ! ဒီကောင့်ကို မှာချင်တာ ပေးလိုက်!'],
  ], () => { S.metFriend = true; save(); order(TR.tables[2], TR.tables[2].seats[0], () => talk([...INVITE, [F, 'မြို့လယ်က ရေပက်အဖွဲ့မှာ ငါ့အစ်ကို ကိုကြီး ရှိတယ်။ သွားရင် ငါ့နာမည် ပြောလိုက်။']], () => { S.invited = true; save(); })); }, friend);
  if (!S.invited) return talk(INVITE, () => { S.invited = true; save(); }, friend);
  talk([[F, pick(['ဒီဆိုင် ပလာတာက ရန်ကုန်မှာ အကောင်းဆုံးပဲ။ ငါ အာမခံတယ်။', 'ညနေ မဏ္ဍပ်မှာ တွေ့မယ်ကွာ။', 'ဒီည ညကား မမေ့နဲ့နော်။ မန္တလေးမှာ ကောင်တွေ စောင့်နေတယ်။'])]], null, friend);
}
function sitBarber() {
  const ch = ROOMS.barber.chairs[0]; sitAt(ch, ch.lift);
  talk([['ဆံပင်ညှပ်ဆရာ', 'ထိုင် ထိုင်… သင်္ကြန်ပုံစံ ညှပ်မလား ညီလေး! ဆေးလည်း ဆိုးပေးတယ်။ ပုံတွေ ကြည့်ပြီး ရွေး။']], () => openBarber({ W, hud, S, dress, onClose: () => { stand(); barber.anim.play('wave'); hud.toast('ကြည့်ကောင်းသွားပြီ!'); } }), barber);
}
function tryOn() {
  const p = W.player, m = ROOMS.clothes.mirror; p.g.position.set(m.x, .05, m.z); p.g.rotation.y = -Math.PI / 2;
  talk([['အထည်ဆိုင် မမ', 'သင်္ကြန်ဝတ် အသစ်တွေ ရောက်ထားတယ်! မှန်ရှေ့မှာ ဝတ်ကြည့်။ မကြိုက်ရင် ပြန်လဲ။']], () => openClothes({ W, hud, S, dress, onClose: () => { tailor.anim.play('wave'); hud.toast('လိုက်တယ်!'); } }), tailor);
}

// ---------- finale: build it, sunset, the kids' mandat in the evening, off to the night bus ----------
function partyPose() {
  kids.forEach((k, i) => { k.g.position.set(ON_STAGE[i][0], .47, ON_STAGE[i][1]); k.anim.setLoop('dance'); });
  friend.g.position.set(SX + 3.4, ground(SX + 3.4, SZ + 2.6), SZ + 2.6); friend.anim.setLoop('idle'); face(friend, { g: { position: L.STAGE } }); W.idlers.push(friend); // Phoe Tha came, as promised
}
W.tick(() => { // after dark Phoe Tha goes on to the bus stop to wait for the night bus with you (when you're not looking)
  if (!party() || friend.atStop || W.night() < .5 || inside) return;
  const p = W.player.g.position; if (p.distanceTo(friend.g.position) < 9 || p.distanceTo(L.STOP) < 6) return;
  friend.atStop = true; friend.g.position.set(L.STOP.x + 2.3, ground(L.STOP.x + 2.3, L.STOP.z + .3), L.STOP.z + .3); friend.g.rotation.y = 0;
});
async function build() {
  await hud.say([['', 'ကလေးတွေ၊ ရပ်ကွက်ထဲက လူကြီးတွေ — ဝါးချည်၊ အုန်းလက်မိုး၊ ပိတောက်ချိတ်… ဝိုင်းဆောက်ကြတယ်။']]);
  hud.cinematic(true); await hud.fade(true);
  S.step = 'evening'; hud2(); partyPose(); W.setTime(.15);
  W.player.g.position.set(SX + .4, 0, SZ + 2.4); face(W.player, { g: { position: L.STAGE } });
  await hud.fade(false);
  const t0 = W.time();
  await new Promise(r => { const k = () => { const t = Math.min(1.7, .15 + (W.time() - t0) / 4); W.setTime(t); t < 1.7 ? requestAnimationFrame(k) : r(); }; k(); }); // sunset, then night falls
  hud.cinematic(false);
  talk([['', 'ညနေစောင်း။ အုန်းလက်မဏ္ဍပ်လေးမှာ သင်္ကြန်သီချင်း ထွက်လာတယ်။'], ['မေသူ', 'ဦးလေး! လာ! ရေကစားမယ်!']]);
}
W.tick((dt, T) => { // the hose on the finished mandat sprays the lane in pulses; the downtown sprinkler fans out from the ridge
  if (!party()) return;
  if (S.parts.includes('tea') && Math.sin(T * 1.1) > -.2) for (let k = 0; k < 2; k++) W.spawn(v.set(SX + 1.2, .6, SZ + 1.0), new THREE.Vector3((rnd() - .5) * .8, 3.2 + rnd(), 4.5 + rnd()));
  if (S.parts.includes('nozzle')) { const a = T * 2.2 + rnd() * .4; W.spawn(v.set(SX, 4.05, SZ + .1), new THREE.Vector3(Math.sin(a) * 2.2, 2.4, Math.cos(a) * 2.2 + .6)); }
});
function openBus() {
  const night = party();
  hud.menu({ title: '🚌 ဘယ်ကို သွားမလဲ', close: 'မသွားသေးဘူး', items: [
    ...(night ? [{ label: '🌙 မန္တလေး · ညကားဂိတ်', note: 'ရက် ၂', cls: 'go', on: () => { leave(); } }] : []),
    { label: '⑤ မြို့လယ် · ဆူးလေ မဏ္ဍပ်တန်း', note: S.step === 'arrive' ? 'ကလေးတွေကို အရင် တွေ့' : 'ဘတ်စ်ကား ၃၆', cls: 'go', disabled: S.step === 'arrive', on: () => { ride(); } },
    { label: '①–④ ရပ်ကွက်ထဲ', note: 'လမ်းလျှောက်ပဲ သွားလို့ရတယ်', disabled: true },
  ] });
}
async function ride() { hud.cinematic(true); hud.area('🚌 ဆူးလေ~ ဆူးလေ~'); await hud.fade(true, 900); travel(S, 'downtown'); }
async function leave() {
  await hud.say([['ဖိုးသာ', 'သွားကြစို့ သူငယ်ချင်း! မနက်ဆို မန္တလေး ရောက်ပြီ။']]);
  hud.cinematic(true); await hud.fade(true, 1200);
  S.step = 'done'; hud2();
  $('epart').textContent = `${MM(S.parts.length)}/${MM(NEED)}`; $('ename').textContent = S.signName; $('end').hidden = false;
}
$('estay').addEventListener('click', async e => { e.stopPropagation(); $('end').hidden = true; await hud.fade(false); hud.cinematic(false); });
$('eagain').addEventListener('click', e => { e.stopPropagation(); wipe(); location.reload(); });

// ---------- what you can do, where ----------
// goal: true when the current goal points here, so it beats a nearer bystander for the E prompt
const MY_SEAT = new THREE.Vector3(MY_TABLE.seats[0].x, 0, MY_TABLE.seats[0].z), CHAIR = new THREE.Vector3(ROOMS.barber.chairs[0].x, 0, ROOMS.barber.chairs[0].z);
const Q = () => S.step === 'quests', STAGE_FRONT = new THREE.Vector3(SX, 0, SZ + 1.7);
const SPOTS = [
  { at: () => KIDS_AT, r: 2.3, label: () => party() ? null : 'ကလေးတွေနဲ့ စကားပြော', goal: () => S.step === 'arrive', run: talkKids },
  { at: () => STAGE_FRONT, r: 2.0, label: () => S.step === 'build' ? 'မဏ္ဍပ်လေး ဆောက်' : party() ? 'ကလေးတွေနဲ့ စကားပြော' : null, goal: () => S.step === 'build', run: () => S.step === 'build' ? build() : talkKids() },
  { at: () => L.SIGN, r: 1.5, label: () => S.step === 'arrive' ? null : 'မဏ္ဍပ်လေး ပစ္စည်းစာရင်း', goal: () => false,
    run: () => talk([['', ERRANDS.map(k => (S.parts.includes(k) ? '✓ ' : '· ') + ITEMS[k]).join('   ')], ['', `${MM(NEED)} မျိုးလုံး စုံရင် ဆောက်လို့ရပြီ။`]]) },
  { at: () => BUCKET_SPOT, r: 1.5, label: () => bucketBusy() ? null : ({ ask: 'အန်တီစိန်ကို လှမ်းခေါ်', money: 'ပိုက်ဆံ ယူ', return: 'ဟင်းသီးဟင်းရွက် ပုံးထဲ ထည့်', cloth: 'ပိတ်စ ယူ' }[Q() && S.q.cloth] ?? 'အန်တီစိန်နဲ့ စကားပြော'), goal: () => Q() && ['ask', 'money', 'return', 'cloth'].includes(S.q.cloth), run: useBucket },
  { at: () => vendor.g.position, r: 1.6, label: () => closed() ? null : 'ဟင်းသီးဟင်းရွက်သည်နဲ့ စကားပြော', goal: () => S.q.cloth === 'buy' || S.q.cat === 'fish', run: talkVendor },
  { at: () => grandma.g.position, r: 1.7, label: () => S.q.padauk === 'shrine' ? 'ပိတောက်ခက် ပေး' : 'အဘွားနဲ့ စကားပြော', goal: () => Q() && ['ask', 'shrine'].includes(S.q.padauk), run: talkGrandma },
  { at: () => TREE, r: 1.9, label: () => ({ school: 'ပိတောက်ပင်ကို ကြည့်', carry: 'လှေကားထောင်ပြီး တက် 🪜' }[S.q.padauk] ?? null), goal: () => S.q.padauk === 'carry', run: () => S.q.padauk === 'carry' ? climb() : askHtoo() },
  { at: () => htoo.g.position, r: 1.6, label: () => 'ထူးထူးနဲ့ စကားပြော', goal: () => S.q.padauk === 'school', run: askHtoo },
  { at: () => dad.g.position, r: 1.7, label: () => 'ဦးမြင့်နဲ့ စကားပြော', goal: () => S.q.padauk === 'dad', run: talkDad },
  { at: () => UNCLE, r: 1.6, label: () => S.q.cat === 'follow' && near(shweWa, 3) ? 'ရွှေဝါကို ပြန်ပေး' : 'ဦးဘတင်နဲ့ စကားပြော', goal: () => Q() && ['ask', 'follow'].includes(S.q.cat), run: talkUncle },
  { at: () => L.CAR, r: 1.8, label: () => shweWa.held === 'roof' && ['search', 'fish', 'lure'].includes(S.q.cat) ? (S.q.cat === 'lure' ? 'ငါးခြောက်နဲ့ ချော့' : 'ရွှေဝါကို ခေါ်') : null, goal: () => true, run: callCat },
  { at: () => L.TEA, r: 1.4, label: () => closed() ? SHUT : 'လက်ဖက်ရည်ဆိုင်ထဲ ဝင်', goal: () => Q() && S.q.tea !== 'done', run: () => closed() ? hud.toast(SHUT) : enter('tea') },
  { at: () => L.BARBER, r: 1.3, label: () => closed() ? SHUT : 'ဆံပင်ညှပ်ဆိုင်ထဲ ဝင် ✂', goal: () => false, run: () => closed() ? hud.toast(SHUT) : enter('barber') },
  { at: () => L.CLOTHES, r: 1.3, label: () => closed() ? SHUT : 'အထည်ဆိုင်ထဲ ဝင် 👕', goal: () => false, run: () => closed() ? hud.toast(SHUT) : enter('clothes') },
  ...Object.values(ROOMS).map(r => ({ at: () => r.door, r: .9, label: () => 'အပြင် ထွက်', goal: () => false, run: goOut })),
  { at: () => TR.counter, r: 1.4, label: () => 'ဆရာနဲ့ စကားပြော', goal: () => Q() && ['ask', 'back'].includes(S.q.tea), run: talkTea },
  ...SERVE.map((t, i) => ({ at: () => customers[i].g.position, r: 1.1, label: () => S.q.tea === 'serve' && !S.served.includes(i) ? `${ORDERS[i][0]} ချပေး` : null, goal: () => true, run: () => serve(i) })),
  { at: () => friend.g.position, r: 1.6, label: () => 'ဖိုးသာနဲ့ စကားပြော', goal: () => !S.metFriend && !party(), run: talkFriend },
  { at: () => doorBoy.g.position, r: 1.4, label: () => inside === 'tea' && !seated ? 'စားပွဲထိုးလေးကို မှာမယ် ☕' : null, goal: () => false, run: askBoy },
  { at: () => MY_SEAT, r: 1.1, label: () => seated ? null : 'ထိုင်ပြီး မှာစား ☕', goal: () => false, run: () => order(MY_TABLE, MY_TABLE.seats[0]) },
  { at: () => CHAIR, r: 1.3, label: () => seated ? null : 'ခုံပေါ် ထိုင်ပြီး ညှပ် ✂', goal: () => false, run: sitBarber },
  { at: () => ROOMS.clothes.mirror, r: 1.4, label: () => 'မှန်ရှေ့မှာ ဝတ်ကြည့် 👕', goal: () => false, run: tryOn },
  { at: () => L.BETEL, r: 1.5, label: () => closed() ? null : 'ကွမ်းယာဆိုင် အဘနဲ့ စကားပြော', goal: () => Q() && S.q.sign === 'ask', run: talkBetel },
  { at: () => phoneGirl.g.position, r: 1.6, label: () => closed() ? null : 'ဖုန်းဆိုင် မမနဲ့ စကားပြော', goal: () => S.q.lights === 'cord', run: talkPhone },
  { at: () => L.FRONDS, r: 2.0, label: () => closed() ? null : 'အုန်းလက်ဆိုင် ကိုအောင်နဲ့ စကားပြော', goal: () => Q() && ['ask', 'bring'].includes(S.q.fronds), run: talkFronds },
  { at: () => L.MOHINGA, r: 1.8, label: () => closed() ? null : 'မုန့်ဟင်းခါးဆိုင်', goal: () => S.q.fronds === 'mohinga', run: talkMohinga },
  { at: () => L.LIGHTS, r: 1.8, label: () => closed() ? null : 'မီးကြိုးဆိုင် ကိုဇော်နဲ့ စကားပြော', goal: () => Q() && ['ask', 'bring'].includes(S.q.lights), run: talkLights },
  { at: () => novices[0].g.position, r: 1.6, label: () => 'ကိုရင်လေးနဲ့ စကားပြော', goal: () => Q() && S.q.drum === 'ask', run: talkNovice },
  { at: () => L.WELL, r: 1.4, label: () => S.q.drum === 'carry' && !S.carrying ? 'ရေတွင်းက ရေခပ်' : null, goal: () => true, run: useWell },
  { at: () => L.POND, r: 1.6, label: () => S.q.drum === 'carry' && S.carrying ? 'ကန်ထဲ ရေလောင်း' : null, goal: () => true, run: usePond },
  { at: () => L.MONASTERY, r: 1.8, label: () => 'ဆရာတော်ကို ဖူးမြော်', goal: () => S.q.drum === 'abbot', run: talkAbbot },
  { at: () => L.BELL, r: 1.4, label: () => 'ခေါင်းလောင်း ထိုး', goal: () => false, run: () => { W.player.anim.play('wave'); sound.fx('bell', L.BELL); hud.toast('ဒေါင်… ဒေါင်… ဒေါင်… သာဓု'); } },
  { at: () => L.STOP, r: 1.9, label: () => party() ? 'ညကား သွားစီး' : 'ဘတ်စ်ကား စီး', goal: () => S.step === 'evening', run: openBus },
];

// bucket + cat + mandat as the save left them
const atBottom = { money: 'money', buy: null, return: null, cloth: 'cloth' };
if (S.q.cloth === 'lifting') S.q.cloth = 'return';
fill(atBottom[S.q.cloth] ?? null); BK.y = BK.to = S.q.cloth in atBottom ? BBOT.y : BTOP.y;
if (S.q.cat === 'done') catHome(); else if (S.q.cat === 'follow') { shweWa.held = 'follow'; shweWa.g.position.copy(W.player.g.position); } else shweWa.held = 'roof';
if (S.q.drum === 'carry') S.carrying = false;
setBanner(S.signName);
for (const i of S.served) { cup(TR.tables[SERVE[i]], teaColor(ORDERS[i][1]), i % 2 ? .2 : -.2); customers[i].anim.setLoop('eat'); }
if (party()) { partyPose(); W.setTime(1.7); }

// ---------- goal markers (in the world and on the minimap) ----------
function goalsAt() {
  if (inside) return inside === 'tea' && Q() && S.q.tea !== 'done' ? (S.q.tea === 'serve' ? SERVE.map((t, i) => !S.served.includes(i) && customers[i].g.position).filter(Boolean) : [TR.counter]) : !S.metFriend && inside === 'tea' ? [friend.g.position] : [];
  if (S.step === 'arrive') return [KIDS_AT];
  if (S.step === 'build') return [L.STAGE];
  if (S.step === 'evening') return [L.STOP];
  if (S.step !== 'quests') return [];
  const q = S.q, out = [];
  const add = p => p && out.push(p);
  add({ ask: BUCKET_SPOT, money: bucket.position, buy: vendor.g.position, return: BUCKET_SPOT, cloth: bucket.position }[q.cloth]);
  add({ ask: grandma.g.position, school: htoo.g.position, dad: dad.g.position, carry: TREE, shrine: grandma.g.position }[q.padauk]);
  add({ ask: UNCLE, search: ROOF, fish: vendor.g.position, lure: ROOF, follow: UNCLE }[q.cat]);
  if (q.tea !== 'done') add(L.TEA); // the tea shop's door
  add({ ask: L.BETEL }[q.sign]);
  add({ ask: L.FRONDS, mohinga: L.MOHINGA, bring: L.FRONDS }[q.fronds]);
  add({ ask: L.LIGHTS, cord: phoneGirl.g.position, bring: L.LIGHTS }[q.lights]);
  add({ ask: novices[0].g.position, carry: S.carrying ? L.POND : L.WELL, abbot: L.MONASTERY }[q.drum]);
  if (q.nozzle !== 'done') add(L.STOP); // ⑤ is a bus ride away
  return out;
}
hud.initMap(AREAS.map(a => ({ ...a, label: a.short })), [{ x0: BOUNDS.x0, x1: BOUNDS.x1, z0: 6.6, z1: 12.2 }, { x0: 11.8, x1: 14.2, z0: 13.0, z1: BOUNDS.z1 }], BOUNDS);
const here = play(W, hud, { spots: SPOTS, goals: goalsAt, areaAt, mapAt: () => inside && backTo }).here;

hud2(); W.start();
if (new URLSearchParams(location.search).has('debug')) window.zone = { W, life, sound, got: q => gotPart(q), S: () => S, SPOTS, vendor, shweWa, L, hud, here, talking: () => hud.talking(), mini: () => hud.mini() };
if (!S.intro) {
  const intro = () => hud.busy() ? setTimeout(intro, 500) : talk([
    ['', 'ကြာကြာ ခွဲနေခဲ့ပြီးမှ ပြန်ရောက်တဲ့ ရပ်ကွက်။ ဓာတ်ကြိုးတွေ ရှုပ်နေတုန်း၊ ပိတောက်နံ့ ရနေတုန်း…'],
    ['', 'အိမ်ဘက်က ကလေးတွေ ရေပက်သံ ကြားနေရတယ်။'],
  ], () => { S.intro = true; save(); });
  setTimeout(intro, 1600);
}
setTimeout(() => $('title').classList.add('gone'), 1400);
