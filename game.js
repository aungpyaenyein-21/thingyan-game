// game.js — Thingyan Pwe, phase 1: map + walk + one stall dialog
const T = ART.T, MW = 60, MH = 40; // map in tiles
const $ = id => document.getElementById(id);

// ground map: 0 grass 1 road 2 dirt 3 water 4 grass+petals 5 sand
function buildGround() {
  const m = Array.from({ length: MH }, () => Array(MW).fill(0));
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (y >= 18 && y <= 21) m[y][x] = 1;                 // main street
    else if (x >= 28 && x <= 31) m[y][x] = 1;            // cross street
    else if (Math.random() < .08) m[y][x] = 4;
  }
  for (let y = 16; y <= 23; y++) for (let x = 0; x < MW; x++) if (m[y][x] === 0 || m[y][x] === 4) if (y === 16 || y === 17 || y === 22 || y === 23) m[y][x] = 2; // dirt shoulders
  for (let y = 29; y <= 37; y++) for (let x = 43; x <= 56; x++) { // pond
    const ex = (x - 49.5) / 7, ey = (y - 33) / 4.5, d = ex * ex + ey * ey;
    if (d < 1) m[y][x] = 3; else if (d < 1.45) m[y][x] = 5;
  }
  return m;
}

const DIALOGS = {
  stall: { name: 'ဒေါ်ခင်မေ · စတုဒိသာဆိုင်', lines: [
    'လာလာ သားလေး၊ မုန့်လုံးရေပေါ် ပူပူလေး စားသွားဦး။',
    'ငရုတ်သီးပါတဲ့လုံး ထိရင် မငိုနဲ့နော် — ဒါ သင်္ကြန်ကံပဲ။',
    '🍡 မုန့်လုံးရေပေါ် တစ်ပွဲ ရလိုက်ပြီ!'], give: { key: 'mlyb', name: 'မုန့်လုံးရေပေါ်', src: 'art/mont-lone-yay-baw.png' } },
  mandat: { name: 'သင်္ကြန်မဏ္ဍပ်', lines: [
    'ဒီနေ့က အကြိုနေ့ — မဏ္ဍပ်ကို ဆောက်နေတုန်းပဲ။',
    'မနက်ဖြန် အကျနေ့ကျရင် ရေပက်ပွဲ စမယ်။ ရေသေနတ် ပြင်ထား!'] },
  pot: { name: 'ရေအိုး', lines: ['အေးမြတဲ့ ရေအိုး။ ရေပက်ပွဲအတွက် ရေဖြည့်လို့ရမယ်။ (အဆင့် ၂)'] },
  tree: { name: 'ပိတောက်ပင်', lines: ['ပိတောက်ပွင့်တွေ ဝါဝင်းနေပြီ။ သင်္ကြန်ရောက်ပြီဆိုတဲ့ အမှတ်အသား။', '🌼 ပိတောက်ပွင့် တစ်ခိုင် ခူးလိုက်သည်။'] },
};

class Pwe extends Phaser.Scene {
  preload() {
    this.load.image('mlyb', DIALOGS.stall.give.src); // hand-drawn in Piskel
  }

  create() {
    ART.makeAll(this);
    const data = buildGround();
    const map = this.make.tilemap({ data, tileWidth: T, tileHeight: T });
    const layer = map.createLayer(0, map.addTilesetImage('tiles'), 0, 0);
    layer.setCollision([3]);
    this.physics.world.setBounds(0, 0, MW * T, MH * T);

    this.solids = this.physics.add.staticGroup();
    this.hot = []; // interactables
    const put = (key, x, y, bw, bh, hotKey) => {
      const s = this.solids.create(x, y, key).setOrigin(.5, 1).setDepth(y);
      s.body.setSize(bw, bh).setOffset((s.width - bw) / 2, s.height - bh);
      if (hotKey) this.hot.push({ x, y: y - bh / 2, r: bw / 2 + 22, key: hotKey });
      return s;
    };
    // houses along the street
    [[8, 'house0'], [18, 'house1'], [38, 'house2'], [48, 'house0']].forEach(([tx, k]) => put(k, tx * T + 32, 16 * T - 4, 60, 30));
    [[6, 'house2'], [16, 'house0'], [38, 'house1']].forEach(([tx, k]) => put(k, tx * T + 32, 30 * T, 60, 30));
    put('mandat', 29.5 * T, 15.5 * T, 108, 24, 'mandat');
    this.add.sprite(36 * T + 8, 25 * T - 6, 'npc3', 0).setOrigin(.5, 1).setDepth(25 * T - 20); // vendor behind the table
    put('stall', 36 * T, 25 * T, 52, 16, 'stall');
    this.add.image(36 * T + 11, 25 * T - 12, 'mlyb').setOrigin(.5, 1).setDepth(25 * T + 1); // on the table
    put('pot', 25 * T, 24 * T, 12, 8, 'pot');
    put('pot', 13 * T, 15 * T, 12, 8, 'pot');
    [[3, 10], [14, 6], [26, 8], [44, 6], [55, 12], [4, 34], [22, 36], [34, 33], [57, 26]].forEach(([tx, ty]) => put('tree', tx * T, ty * T, 10, 8, 'tree'));

    this.player = this.physics.add.sprite(30 * T, 23 * T, 'player', 0).setOrigin(.5, 1);
    this.player.body.setSize(10, 8).setOffset(3, 16).setCollideWorldBounds(true);
    this.physics.add.collider(this.player, layer);
    this.physics.add.collider(this.player, this.solids);

    this.npcs = this.physics.add.group();
    for (let i = 0; i < 6; i++) {
      const n = this.npcs.create(10 * T + i * 7 * T, 20 * T + (i % 2) * 2 * T, 'npc' + i, 0).setOrigin(.5, 1);
      n.body.setSize(10, 8).setOffset(3, 16).setCollideWorldBounds(true); n.key = 'npc' + i; n.t = 0;
    }
    this.physics.add.collider(this.npcs, layer); this.physics.add.collider(this.npcs, this.solids);
    this.physics.add.collider(this.npcs, this.npcs); this.physics.add.collider(this.player, this.npcs);

    this.cameras.main.setBounds(0, 0, MW * T, MH * T).startFollow(this.player, true, .12, .12).setZoom(2).setRoundPixels(true);
    this.keys = this.input.keyboard.addKeys('W,A,S,D,E,SHIFT,UP,DOWN,LEFT,RIGHT');
    this.dlg = null; this.facing = 'down'; this.bag = new Set();
    this.input.keyboard.on('keydown-E', () => this.interact());
  }

  interact() {
    if (this.dlg) { // advance
      if (++this.dlg.i >= this.dlg.lines.length) { this.giveItem(this.dlg.give); this.dlg = null; $('dlg').style.display = 'none'; $('help').style.display = ''; }
      else $('dtext').textContent = this.dlg.lines[this.dlg.i];
      return;
    }
    const h = this.nearest(); if (!h) return;
    const d = DIALOGS[h.key]; this.dlg = { lines: d.lines, i: 0, give: d.give };
    $('dname').textContent = d.name; $('dtext').textContent = d.lines[0];
    $('dlg').style.display = 'block'; $('prompt').style.display = 'none'; $('help').style.display = 'none';
  }
  giveItem(it) {
    if (!it || this.bag.has(it.key)) return; // ponytail: one of each, counts when items stack
    this.bag.add(it.key);
    const img = document.createElement('img');
    img.src = it.src; img.title = it.name; img.alt = it.name; // Phaser revokes its blob URLs, so use the file path
    $('inv').appendChild(img);
  }
  nearest() {
    const p = this.player; let best = null, bd = 1e9;
    for (const h of this.hot) { const d = Phaser.Math.Distance.Between(p.x, p.y - 8, h.x, h.y); if (d < h.r && d < bd) { bd = d; best = h; } }
    return best;
  }

  update(time, dt) {
    const k = this.keys, p = this.player;
    let vx = 0, vy = 0;
    if (!this.dlg) {
      if (k.A.isDown || k.LEFT.isDown) vx = -1; else if (k.D.isDown || k.RIGHT.isDown) vx = 1;
      if (k.W.isDown || k.UP.isDown) vy = -1; else if (k.S.isDown || k.DOWN.isDown) vy = 1;
    }
    const sp = k.SHIFT.isDown ? 130 : 75;
    p.setVelocity(vx * sp, vy * sp); if (vx && vy) p.body.velocity.scale(.707);
    if (vx || vy) {
      this.facing = vx < 0 ? 'left' : vx > 0 ? 'right' : vy < 0 ? 'up' : 'down';
      p.anims.play('player-' + this.facing, true);
    } else { p.anims.stop(); p.setFrame({ down: 0, left: 3, right: 6, up: 9 }[this.facing]); }
    p.setDepth(p.y);

    // npcs wander
    this.npcs.children.iterate(n => {
      n.t -= dt;
      if (n.t <= 0) { n.t = 800 + Math.random() * 1800; const a = Math.random() * 6.28, mv = Math.random() < .6; n.setVelocity(mv ? Math.cos(a) * 40 : 0, mv ? Math.sin(a) * 40 : 0); }
      const v = n.body.velocity;
      if (Math.abs(v.x) + Math.abs(v.y) > 1) n.anims.play(n.key + '-' + (Math.abs(v.x) > Math.abs(v.y) ? (v.x < 0 ? 'left' : 'right') : (v.y < 0 ? 'up' : 'down')), true);
      else { n.anims.stop(); n.setFrame(0); }
      n.setDepth(n.y);
    });

    // prompt
    const h = this.dlg ? null : this.nearest();
    $('prompt').style.display = h ? 'block' : 'none';
    if (h) $('ptext').textContent = DIALOGS[h.key].name;
  }
}

new Phaser.Game({
  type: Phaser.AUTO, parent: 'wrap', width: 800, height: 600, pixelArt: true, backgroundColor: '#120c1c',
  physics: { default: 'arcade', arcade: { debug: false } }, scene: Pwe,
});
