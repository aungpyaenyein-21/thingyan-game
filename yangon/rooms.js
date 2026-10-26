// yangon/rooms.js — the shop interiors you can walk into from the main street: tea shop, clothes shop (a tailor's),
// barber. Each is a cut-away room built far off the island (only two walls, so the camera sees in), switched in with
// world.setRoom(). People and what you do inside live in main.js; this is the set and where things are.
import { PAL } from '../world.js?v=5';
import { icon, TEA_MENU } from './icons.js?v=1';

export function buildRooms(W) {
  const { THREE, scene, M, mesh, box, cyl, textTex, stripeTex, solid, rnd, pick } = W;
  const floorTex = (a, b, n = 8) => { const t = stripeTex(a, b, 2, true); t.repeat.set(n, n * .75); return new THREE.MeshLambertMaterial({ map: t }); };
  // a room: floor, a back wall (−z) and a left wall (−x), skirting; walls cast no shadow so the sun doesn't black out the floor
  function room(cx, cz, w, d, wall, wallLow, floorM, opts = {}) {
    const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2, H = 3;
    box(w + .4, .5, d + .4, '#3b3040', cx, -.48, cz, { cast: false });
    mesh(new THREE.BoxGeometry(w, .06, d), floorM, cx, .02, cz, { cast: false });
    box(w, H, .2, wall, cx, .02, z0 - .1, { cast: false }); box(.2, H, d, wall, x0 - .1, .02, cz, { cast: false });
    box(w, 1.0, .22, wallLow, cx, .02, z0 - .09, { cast: false }); box(.22, 1.0, d, wallLow, x0 - .09, .02, cz, { cast: false }); // the lower half painted darker, like every tea shop
    box(.6, .04, .4, '#c8553d', cx, .05, z1 - .3, { cast: false }); // doormat = the way out
    const r = { bounds: { x0, x1, z0, z1 }, ground: () => .05, camBounds: { x0: cx - .5, x1: cx - .5, z0: cz - .7, z1: cz - .7 } /* aim a little up the walls */, view: opts.view ?? 9, background: opts.bg ?? '#2e2236',
      door: new THREE.Vector3(cx, 0, z1 - .3), spawn: new THREE.Vector3(cx, 0, z1 - .9) };
    return r;
  }
  const poster = (x, y, z, w, h, tex, ry = 0) => { const m = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tex }), x, y, z, { cast: false }); m.rotation.y = ry; return m; };
  const R = {};

  // ---------- the big tea shop (လက်ဖက်ရည်ဆိုင်ကြီး): rows of wooden tables and chairs, ceiling fans, a thermos of green tea and a red
  // tissue box on every table, a little bin by the legs, the long counter with the kettle and the snack case, the name banner
  // across the back wall, the picture menu, the TV with football on. Who sits where, and the boys waiting tables, are main.js's.
  {
    const cx = 130, cz = 0, W2 = 14, D2 = 10, r = R.tea = room(cx, cz, W2, D2, '#f6efe0', '#7fae9a', floorTex('#b9b2a8', '#aaa298', 12), { view: 14.5 });
    const z0 = cz - D2 / 2, x0 = cx - W2 / 2;
    box(5.0, 1.0, .7, '#8a5a3a', cx - 3.6, .05, z0 + .75); box(5.1, .06, .8, '#d9cdb8', cx - 3.6, 1.05, z0 + .75);           // counter
    box(1.6, .5, .5, '#cfe6f2', cx - 5.2, 1.1, z0 + .75); for (let i = 0; i < 6; i++) mesh(new THREE.SphereGeometry(.09, 8, 6), pick(['#e8b85a', '#fbf4e6', '#d99a4a']), cx - 5.8 + (i % 3) * .4, 1.25 + (i >> 1 & 1) * .14, z0 + .7); // glass case of snacks
    cyl(.3, .26, .7, '#c9a24a', cx - 2.0, 1.08, z0 + .7, 14); cyl(.12, .3, .3, '#c9a24a', cx - 2.0, 1.78, z0 + .7, 14); cyl(.04, .04, .3, '#5a4a52', cx - 1.65, 1.3, z0 + .7, 6).rotation.z = 1.2; // the big brass kettle
    for (let i = 0; i < 6; i++) cyl(.06, .05, .1, '#fff6ea', cx - 4.3 + i * .3, 1.08, z0 + .95, 8);                          // cups lined up for the pour
    for (let i = 0; i < 4; i++) { cyl(.07, .07, .26, i % 2 ? '#d9dde3' : '#fbf4e6', cx - 2.9 + i * .2, 1.1, z0 + .5, 8); cyl(.05, .05, .05, '#e0302f', cx - 2.9 + i * .2, 1.36, z0 + .5, 8); } // thermoses waiting to go out
    solid(cx - 3.6, z0 + .75, 5.1, .8);
    poster(cx + 2.6, 2.45, z0 + .02, 6.6, .62, textTex('ရွှေလမင်း လက်ဖက်ရည်ဆိုင် · ကြိုဆိုပါ၏', '#fbf4e6', '#5a3a8a', 1024, 96, 56)); // the name banner
    box(6.8, .08, .1, '#c8a070', cx + 2.6, 2.1, z0 + .05);
    poster(cx + 5.6, 1.4, z0 + .02, .7, .9, textTex('၂၀၁၈', '#fff6ea', '#c8553d', 128, 160, 44));
    // the picture menu on the side wall, "FOOD" across its top like the real ones
    const board = document.createElement('canvas'); board.width = 512; board.height = 256; const g = board.getContext('2d');
    g.fillStyle = '#fbf4e6'; g.fillRect(0, 0, 512, 256); g.fillStyle = '#f2c14e'; g.fillRect(0, 0, 512, 44); g.fillStyle = '#c8553d'; g.font = 'bold 32px sans-serif'; g.textAlign = 'center'; g.fillText('FOOD', 256, 34);
    const imgs = [...TEA_MENU.drinks.slice(0, 4), ...TEA_MENU.snacks.slice(0, 4)];
    const tex = new THREE.CanvasTexture(board); tex.colorSpace = THREE.SRGBColorSpace;
    imgs.forEach(([k, n], i) => { const im = new Image(); im.onload = () => { g.drawImage(im, 20 + (i % 4) * 124, 54 + (i >> 2) * 100, 64, 64); g.font = '18px "Noto Sans Myanmar",Padauk,sans-serif'; g.fillStyle = '#5a3550'; g.fillText(n, 52 + (i % 4) * 124 + 40, 136 + (i >> 2) * 100); tex.needsUpdate = true; }; im.src = icon(k); });
    poster(x0 + .03, 1.95, cz - 2.2, 2.8, 1.4, tex, Math.PI / 2);
    box(.06, .9, 1.5, '#26222b', x0 + .03, 1.7, cz + 1.6, { cast: false }); poster(x0 + .07, 2.15, cz + 1.6, 1.3, .75, (() => { // the TV: a match is on
      const c = document.createElement('canvas'); c.width = 160; c.height = 90; const q = c.getContext('2d'); q.fillStyle = '#3f8f4a'; q.fillRect(0, 0, 160, 90); q.strokeStyle = '#fff'; q.lineWidth = 2; q.strokeRect(8, 8, 144, 74); q.beginPath(); q.moveTo(80, 8); q.lineTo(80, 82); q.stroke(); q.beginPath(); q.arc(80, 45, 12, 0, 7); q.stroke();
      for (let i = 0; i < 10; i++) { q.fillStyle = i % 2 ? '#e0574f' : '#4fb3d9'; q.fillRect(20 + (i * 37) % 120, 20 + (i * 23) % 50, 3, 5); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })(), Math.PI / 2);
    // ceiling fans
    r.spin = [];
    for (const [fx, fz] of [[cx - 2.3, cz - 1.6], [cx + 2.9, cz - 1.6], [cx + .3, cz + 1.8]]) {
      cyl(.02, .02, .35, '#8f8794', fx, 2.75, fz, 4);
      const fan = W.keep(new THREE.Group()); fan.position.set(fx, 2.72, fz); scene.add(fan); cyl(.1, .1, .1, '#e9e1d2', 0, -.05, 0, 10, { parent: fan });
      for (let i = 0; i < 3; i++) { const bg = new THREE.BoxGeometry(.6, .02, .12); bg.translate(.38, 0, 0); mesh(bg, '#e9e1d2', 0, -.02, 0, { parent: fan }).rotation.y = i * 2.09; }
      r.spin.push(fan);
    }
    // wooden tables in rows, a chair either side; main.js seats people on them (seat.lift raises a sitter to chair height)
    r.tables = [];
    for (const tz of [cz - 2.0, cz + .4, cz + 2.8]) for (const tx of [cx - 3.6, cx - 1.0, cx + 1.6, cx + 4.2]) {
      box(.9, .05, .65, '#c89a6a', tx, .62, tz); box(.82, .1, .57, '#a8744a', tx, .53, tz); for (const lx of [-.38, .38]) for (const lz of [-.26, .26]) box(.05, .5, .05, '#6b4a32', tx + lx, .05, tz + lz);
      const seats = [-1, 1].map(s => { const x = tx + s * .62;
        box(.36, .05, .36, '#8a5a3a', x, .42, tz); box(.05, .5, .36, '#8a5a3a', x + s * .17, .45, tz); for (const lx of [-.14, .14]) for (const lz of [-.14, .14]) box(.04, .37, .04, '#6b4a32', x + lx, .05, tz + lz);
        return { x, z: tz, ry: s < 0 ? Math.PI / 2 : -Math.PI / 2, lift: .18 }; });
      cyl(.07, .07, .26, pick(['#d9dde3', '#fbf4e6']), tx + .25, .67, tz - .18, 8); cyl(.05, .05, .05, '#e0302f', tx + .25, .93, tz - .18, 8); // green tea thermos
      box(.16, .09, .11, '#e0302f', tx - .22, .67, tz - .2);                                                                          // red tissue box
      if (rnd() < .6) cyl(.12, .1, .2, pick(['#f48fb1', '#4fb3d9', '#e0574f']), tx + .3, .05, tz + .48, 8);                             // the little bin
      solid(tx, tz, .9, .65); r.tables.push({ x: tx, z: tz, top: .67, seats });
    }
    r.counter = new THREE.Vector3(cx - 3.6, 0, z0 + 1.6); r.boss = { x: cx - 3.6, z: z0 + .2 };
    r.aisle = { xs: [cx - 2.3, cx + .3, cx + 2.9], zs: [z0 + 1.8, cz - .8, cz + 1.6] }; // walkways between the tables, for the boys and the paper seller
  }

  // ---------- clothes shop / tailor (အထည်ဆိုင်): longyi bolts stacked on the shelves, shirts on rails, a sewing machine, a tall mirror ----------
  {
    const cx = 152, cz = 0, r = R.clothes = room(cx, cz, 7, 6, '#fbf0dc', '#e0a84f', floorTex('#e6d6c0', '#d6c2a8', 8), { view: 8.6 });
    const z0 = cz - 3, x0 = cx - 3.5;
    for (let row = 0; row < 3; row++) { box(4.4, .06, .5, '#8a5a3a', cx + .8, .7 + row * .7, z0 + .3); for (let i = 0; i < 9; i++) box(.4, .32, .42, pick(['#a8434a', '#4a5aa8', '#3f7a5a', '#7a4a9a', '#e0a84f', '#e9a0b4', '#2e3a59', '#c8553d']), cx - 1.2 + i * .47, .77 + row * .7, z0 + .3); } // longyi + htamein bolts
    solid(cx + .8, z0 + .3, 4.4, .5);
    for (const rz of [cz - .8, cz + .8]) { box(.04, .04, 1.6, '#8f8794', x0 + .5, 1.6, rz); for (let i = 0; i < 6; i++) { box(.06, .7, .42, pick(['#ff7f6b', '#4fb3d9', '#8bd17c', '#fff6ea', '#2e3a59', '#f2c14e', '#7e57c2']), x0 + .5, .88, rz - .65 + i * .26); } } // shirts on rails along the left wall
    box(1.5, .9, .7, '#8a5a3a', cx + 2.2, .05, cz + 1.4); box(.5, .3, .3, '#26222b', cx + 2.0, .95, cz + 1.4); cyl(.04, .04, .2, '#c9a24a', cx + 2.25, 1.0, cz + 1.4, 6); solid(cx + 2.2, cz + 1.4, 1.5, .7); // counter + sewing machine
    for (const mx of [cx - .6, cx + .6]) { cyl(.04, .04, 1, '#8f8794', mx, .05, cz, 6); cyl(.22, .28, .7, pick(['#e0574f', '#4fb3d9', '#f2c14e']), mx, 1.0, cz, 10); mesh(new THREE.SphereGeometry(.16, 10, 8), '#e9e1d2', mx, 1.85, cz); solid(mx, cz, .5, .5); } // two dress forms
    box(.06, 2.2, 1.1, '#d9b06a', x0 + .03, .05, cz + 2.0, { cast: false }); poster(x0 + .08, 1.15, cz + 2.0, .95, 2.0, (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 128; const q = c.getContext('2d'); const gr = q.createLinearGradient(0, 0, 64, 128); gr.addColorStop(0, '#dff0f8'); gr.addColorStop(1, '#a9c8d8'); q.fillStyle = gr; q.fillRect(0, 0, 64, 128); q.fillStyle = 'rgba(255,255,255,.6)'; q.fillRect(10, 8, 6, 110); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })(), Math.PI / 2);
    r.mirror = new THREE.Vector3(x0 + .9, 0, cz + 2.0); r.boss = { x: cx + 2.2, z: cz + .8 };
  }

  // ---------- barber (ဆံပင်ညှပ်ဆိုင်): two red chairs facing the long mirror, a wall of hairstyle posters, the waiting bench ----------
  {
    const cx = 172, cz = 0, r = R.barber = room(cx, cz, 6, 5.4, '#e6f2ee', '#3f6fa8', floorTex('#fff6ea', '#2e2e38', 12), { view: 8 });
    const z0 = cz - 2.7, x0 = cx - 3;
    poster(x0 + .06, 1.55, cz - .4, 3.2, 1.2, (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 96; const q = c.getContext('2d'); const gr = q.createLinearGradient(0, 0, 256, 96); gr.addColorStop(0, '#e6f6fb'); gr.addColorStop(1, '#a9d0e0'); q.fillStyle = gr; q.fillRect(0, 0, 256, 96); q.fillStyle = 'rgba(255,255,255,.55)'; for (const x of [30, 140]) q.fillRect(x, 6, 10, 84); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })(), Math.PI / 2);
    box(.3, .06, 3.2, '#fff6ea', x0 + .15, .95, cz - .4); for (let i = 0; i < 6; i++) cyl(.05, .05, .2, pick(['#e0574f', '#4fb3d9', '#8bd17c', '#f2c14e']), x0 + .15, 1.0, cz - 1.8 + i * .5, 8); // shelf of tonics
    r.chairs = [];
    for (const chz of [cz - 1.2, cz + .6]) {
      const X = x0 + 1.3; cyl(.16, .2, .3, '#9aa3ad', X, .05, chz, 10); box(.6, .14, .6, '#c8553d', X, .35, chz); box(.14, .7, .6, '#c8553d', X + .3, .45, chz); box(.5, .08, .1, '#c8553d', X, .62, chz - .3); box(.5, .08, .1, '#c8553d', X, .62, chz + .3);
      solid(X, chz, .7, .7); r.chairs.push({ x: X - .05, z: chz, ry: -Math.PI / 2, lift: .22 });
    }
    // posters of the styles you can ask for, drawn the way barbershop posters are: a row of heads
    poster(cx + .2, 1.9, z0 + .02, 3.6, 1.1, (() => { const c = document.createElement('canvas'); c.width = 360; c.height = 110; const q = c.getContext('2d'); q.fillStyle = '#fff6ea'; q.fillRect(0, 0, 360, 110);
      const hair = ['#2b1d1a', '#c9407a', '#3b4a9a', '#d98a2b', '#2f8a6a']; for (let i = 0; i < 5; i++) { const x = 36 + i * 72; q.fillStyle = '#efc29c'; q.beginPath(); q.arc(x, 62, 24, 0, 7); q.fill(); q.fillStyle = hair[i];
        if (i === 1) { q.fillRect(x - 5, 18, 10, 30); } else if (i === 2) { for (let k = -2; k <= 2; k++) { q.beginPath(); q.moveTo(x + k * 9 - 6, 48); q.lineTo(x + k * 9, 22); q.lineTo(x + k * 9 + 6, 48); q.fill(); } } else { q.beginPath(); q.arc(x, 56, 26, Math.PI, 0); q.fill(); if (i === 3) q.fillRect(x - 26, 56, 10, 30); } }
      q.fillStyle = '#5a3550'; q.font = '16px "Noto Sans Myanmar",Padauk,sans-serif'; q.textAlign = 'center'; q.fillText('သင်္ကြန် ဆံပင်ပုံစံ', 180, 104); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })());
    box(1.6, .3, .45, '#8a5a3a', cx + 1.6, .25, z0 + .5); box(1.6, .06, .5, '#a8744a', cx + 1.6, .55, z0 + .5); solid(cx + 1.6, z0 + .5, 1.6, .45); // waiting bench
    r.boss = { x: x0 + 2.0, z: cz - .3 };
  }
  return R;
}
