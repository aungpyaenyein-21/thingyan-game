// art.js — all pixel art drawn in code (ponytail: no asset files, redraw here if style changes)
const ART = (() => {
  const T = 16; // tile size
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  function canvasFor(scene, key, w, h) {
    const c = scene.textures.createCanvas(key, w, h);
    const g = c.getContext();
    g.imageSmoothingEnabled = false;
    return [c, g];
  }
  const px = (g, x, y, col, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };

  // draw a string pixel-map at (ox,oy) with a palette {char: color}
  function blit(g, map, pal, ox, oy, flip = false) {
    const w = map[0].length;
    map.forEach((row, y) => [...row].forEach((ch, x) => {
      const col = pal[ch]; if (!col) return;
      px(g, ox + (flip ? w - 1 - x : x), oy + y, col);
    }));
  }

  // ---------- ground tiles ----------
  function tiles(scene) {
    const n = 6, [c, g] = canvasFor(scene, 'tiles', T * n, T);
    const speck = (i, base, dots, k) => { px(g, i * T, 0, base, T, T); for (let j = 0; j < k; j++) px(g, i * T + (rnd() * T) | 0, (rnd() * T) | 0, dots); };
    speck(0, '#5c8f3c', '#4f7d33', 14);               // grass
    speck(1, '#4a4650', '#56525c', 10);               // road
    speck(2, '#b8925a', '#a8824c', 10);               // dirt
    speck(3, '#3a7fb0', '#5aa0cc', 6);                // water
    speck(4, '#5c8f3c', '#4f7d33', 10); for (let j = 0; j < 4; j++) px(g, 4 * T + 2 + ((rnd() * 12) | 0), 2 + ((rnd() * 12) | 0), '#f2c94c'); // grass + padauk petals
    speck(5, '#d9c48a', '#c9b47a', 8);                // sand / pond bank
    c.refresh();
    for (let i = 0; i < n; i++) scene.textures.get('tiles').add(i, 0, i * T, 0, T, T);
  }

  // ---------- characters ----------
  const DOWN = [
    '....hhhhhhhh....', '...hhhhhhhhhh...', '...hhhhhhhhhh...', '...hhssssssshh..',
    '...hsessssesh...', '...hsssssssssh..', '....ssssssss....', '.....ssssss.....',
    '....tttttttt....', '...tttttttttt...', '..sttttttttts...', '..sttttttttts...',
    '..s.tttttttt.s..', '....tttttttt....', '....llllllll....', '....llllllll....',
    '....lLllllLl....', '....llllllll....', '....llllllll....', '....lLllllLl....',
    '....llllllll....', '....llllllll....'];
  const UP = DOWN.map((r, y) => y < 8 ? r.replace(/[se]/g, 'h') : r);
  const SIDE = [
    '.....hhhhhh.....', '....hhhhhhhh....', '....hhhhhhhh....', '....hhhhssss....',
    '....hhhhsess....', '....hhhhssss....', '.....ssssss.....', '......ssss......',
    '.....tttttt.....', '....tttttttt....', '....tttttttt....', '....tttsttt.....',
    '....tttsttt.....', '.....tttttt.....', '.....llllll.....', '.....llllll.....',
    '.....lLllLl.....', '.....llllll.....', '.....llllll.....', '.....lLllLl.....',
    '.....llllll.....', '.....llllll.....'];
  const FEET = { 0: ['....ff....ff....', '....ff....ff....'], 1: ['....ff..........', '....ff....ff....'], 2: ['..........ff....', '....ff....ff....'] };
  const SFEET = { 0: ['.....ff.ff......', '.....ff.ff......'], 1: ['.....ff.........', '.....ff.ff......'], 2: ['........ff......', '.....ff.ff......'] };

  // frames: 0-2 down, 3-5 left, 6-8 right, 9-11 up
  function character(scene, key, pal) {
    const [c, g] = canvasFor(scene, key, 16 * 12, 24);
    const dirs = [[DOWN, FEET, false], [SIDE, SFEET, true], [SIDE, SFEET, false], [UP, FEET, false]];
    dirs.forEach(([body, feet, flip], d) => {
      for (let f = 0; f < 3; f++) {
        const i = d * 3 + f, bob = f === 0 ? 0 : -1;
        blit(g, body, pal, i * 16, bob, flip);
        blit(g, feet[f], pal, i * 16, 22, flip);
      }
    });
    c.refresh();
    const tex = scene.textures.get(key);
    for (let i = 0; i < 12; i++) tex.add(i, 0, i * 16, 0, 16, 24);
    scene.anims.create({ key: key + '-down', frames: scene.anims.generateFrameNumbers(key, { frames: [1, 0, 2, 0] }), frameRate: 8, repeat: -1 });
    scene.anims.create({ key: key + '-left', frames: scene.anims.generateFrameNumbers(key, { frames: [4, 3, 5, 3] }), frameRate: 8, repeat: -1 });
    scene.anims.create({ key: key + '-right', frames: scene.anims.generateFrameNumbers(key, { frames: [7, 6, 8, 6] }), frameRate: 8, repeat: -1 });
    scene.anims.create({ key: key + '-up', frames: scene.anims.generateFrameNumbers(key, { frames: [10, 9, 11, 9] }), frameRate: 8, repeat: -1 });
  }
  const SKIN = ['#e6b48a', '#c98d5e', '#a86a3e'];
  const TOPS = ['#f2f2f2', '#e85c4a', '#4a8fe8', '#f2c94c', '#8fd16e', '#d98ac9'];
  const LONGYI = [['#2b3a7a', '#5a6ab8'], ['#7a2b2b', '#b85a5a'], ['#2b6a3a', '#5ab86a'], ['#5a2b7a', '#9a5ab8'], ['#7a5a2b', '#b89a5a']];
  function palette(i) {
    const l = LONGYI[i % LONGYI.length];
    return { h: '#1a1012', s: SKIN[i % 3], e: '#1a1012', t: TOPS[i % TOPS.length], l: l[0], L: l[1], f: '#3a2a1a' };
  }

  // ---------- objects ----------
  function house(scene, key, wall, roof) {
    const [c, g] = canvasFor(scene, key, 64, 56);
    px(g, 4, 20, wall, 56, 34);                 // wall
    for (let y = 22; y < 54; y += 4) px(g, 4, y, shade(wall), 56, 1); // planks
    px(g, 0, 8, roof, 64, 14);                  // roof
    for (let x = 0; x < 64; x += 4) px(g, x, 8, shade(roof), 1, 14);
    px(g, 2, 4, roof, 60, 4); px(g, 6, 0, roof, 52, 4);
    px(g, 10, 28, '#2a1f14', 10, 10); px(g, 11, 29, '#8fd1ff', 8, 8); // window
    px(g, 44, 28, '#2a1f14', 10, 10); px(g, 45, 29, '#8fd1ff', 8, 8);
    px(g, 26, 34, '#2a1f14', 12, 20); px(g, 28, 36, '#5a3a22', 8, 18);  // door
    px(g, 0, 54, '#3a2a1a', 64, 2);             // stilts base
    c.refresh();
  }
  const shade = col => { const n = parseInt(col.slice(1), 16); const f = v => Math.max(0, v - 24); return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join(''); };

  function padauk(scene) {
    const [c, g] = canvasFor(scene, 'tree', 40, 52);
    px(g, 17, 30, '#5a3a22', 6, 22); px(g, 15, 44, '#4a2a14', 10, 6);
    const blob = (x, y, r, col) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) px(g, x + dx, y + dy, col); };
    blob(20, 18, 14, '#4f7d33'); blob(12, 22, 9, '#5c8f3c'); blob(29, 22, 9, '#5c8f3c'); blob(20, 10, 9, '#6aa347');
    for (let i = 0; i < 70; i++) { const a = rnd() * 6.28, r = rnd() * 13; px(g, 20 + Math.cos(a) * r | 0, 18 + Math.sin(a) * r * .9 | 0, rnd() < .5 ? '#f2c94c' : '#ffe08a'); }
    c.refresh();
  }
  function stall(scene) {
    const [c, g] = canvasFor(scene, 'stall', 56, 44);
    px(g, 2, 14, '#c9a85a', 3, 30); px(g, 51, 14, '#c9a85a', 3, 30);           // bamboo poles
    for (let x = 0; x < 56; x += 8) px(g, x, 0, x % 16 ? '#e85c4a' : '#f6e8c8', 8, 10); // striped awning
    for (let x = 0; x < 56; x += 8) px(g, x + 2, 10, x % 16 ? '#e85c4a' : '#f6e8c8', 4, 3);
    px(g, 6, 28, '#8a5a32', 44, 14); px(g, 6, 26, '#a87242', 44, 3);             // table
    px(g, 14, 16, '#2a2a2a', 14, 10); px(g, 16, 15, '#3a3a3a', 10, 2);           // wok
    px(g, 16, 18, '#f6e8c8', 10, 3); for (let i = 0; i < 5; i++) px(g, 16 + i * 2, 17, '#fff8e8', 1, 1); // rice balls
    c.refresh();
  }
  function mandat(scene) {
    const [c, g] = canvasFor(scene, 'mandat', 112, 64);
    px(g, 0, 40, '#c9a85a', 112, 24); for (let x = 0; x < 112; x += 6) px(g, x, 40, '#b8925a', 1, 24); // bamboo stage
    for (const x of [2, 54, 106]) px(g, x, 4, '#c9a85a', 4, 40);                                    // poles
    px(g, 0, 0, '#e85c4a', 112, 6); px(g, 0, 6, '#f2c94c', 112, 2);                                 // top banner
    px(g, 8, 10, '#2b3a7a', 96, 26);                                                                // sign board
    g.fillStyle = '#f2c94c'; g.font = 'bold 16px Padauk,"Myanmar Sangam MN",sans-serif'; g.textAlign = 'center';
    g.fillText('သင်္ကြန်မဏ္ဍပ်', 56, 30);
    for (let x = 4; x < 112; x += 12) { px(g, x, 36, '#3a7fb0', 8, 3); }                         // water pipes
    c.refresh();
  }
  function pot(scene) {
    const [c, g] = canvasFor(scene, 'pot', 14, 16);
    px(g, 2, 4, '#b8925a', 10, 11); px(g, 1, 7, '#b8925a', 12, 5); px(g, 3, 2, '#a8824c', 8, 3);
    px(g, 4, 3, '#5aa0cc', 6, 2); px(g, 4, 14, '#8a6a3a', 6, 2);
    c.refresh();
  }
  function bucket(scene) {
    const [c, g] = canvasFor(scene, 'bucket', 12, 12);
    px(g, 1, 3, '#e85c4a', 10, 9); px(g, 2, 2, '#f08a7a', 8, 2); px(g, 3, 4, '#5aa0cc', 6, 2);
    px(g, 0, 0, '#888', 12, 2);
    c.refresh();
  }

  function makeAll(scene) {
    tiles(scene);
    character(scene, 'player', { h: '#1a1012', s: '#e6b48a', e: '#1a1012', t: '#f6e8c8', l: '#2b6a3a', L: '#5ab86a', f: '#3a2a1a' });
    for (let i = 0; i < 6; i++) character(scene, 'npc' + i, palette(i + 1));
    house(scene, 'house0', '#8a5a32', '#8a2a2a'); house(scene, 'house1', '#a87242', '#2b5a7a'); house(scene, 'house2', '#6a4a2a', '#3a6a3a');
    padauk(scene); stall(scene); mandat(scene); pot(scene); bucket(scene);
  }
  return { T, makeAll };
})();
