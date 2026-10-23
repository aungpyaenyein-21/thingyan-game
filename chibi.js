// chibi.js — cute 2.2-head character with a code-driven rig + procedural animation.
// Used by character-lab.html now, by the diorama later. No model files.
import * as THREE from 'three';

// ---------- proportions (units ≈ 0.75 m) ----------
const UP = .2, LO = .19, ANKLE = .075;         // thigh, shin, ankle→sole (longer legs than v1)
export const HIP = UP + LO + ANKLE;            // hip height when standing
const ARM_UP = .155, ARM_LO = .135;
const HEAD_R = .3, HEAD_S = [1.1, .96, .95]; // wide, slightly flat-fronted head

// ---------- body builds: torso lathe (r, y), shoulder x, hip ball r, longyi / htamein lathes (last point sits on the hem) ----------
const SLIM_SKIRTS = { longyi: [[.14, .1], [.158, .04], [.168, -.06], [.165, -.22], [.16]], htamein: [[.135, .1], [.152, .03], [.158, -.1], [.15, -.26], [.148]] };
export const BUILDS = {
  round: { torso: [[.001, -.03], [.15, -.02], [.18, .04], [.18, .14], [.168, .21], [.13, .27], [.07, .3], [.001, .31]], sh: .165, hip: .16,
    longyi: [[.17, .1], [.19, .04], [.2, -.06], [.205, -.22], [.22]], htamein: [[.165, .1], [.182, .04], [.186, -.1], [.18, -.26], [.19]] },
  slim: { torso: [[.001, -.03], [.125, -.02], [.135, .04], [.128, .12], [.14, .19], [.135, .24], [.1, .285], [.05, .305], [.001, .31]], sh: .14, hip: .135, ...SLIM_SKIRTS },
  broad: { torso: [[.001, -.03], [.112, -.02], [.118, .04], [.122, .1], [.162, .18], [.18, .23], [.138, .285], [.06, .305], [.001, .31]], sh: .172, hip: .135, ...SLIM_SKIRTS },
};

// ---------- palette ----------
export const SKINS = ['#efc29c', '#d9a07a', '#b97d58'];
export const HAIR = '#2b1d1a';
const PADAUK = '#ffc83d';
export const HAIRS = ['#2b1d1a', '#4a2e22', '#7a4a2e', '#a8552f'];       // natural
export const HAIRS_DYED = ['#3b4a9a', '#2f8a6a', '#c9407a', '#d98a2b'];  // Thingyan dye jobs
export const HAIR_GREY = '#d9d3c7';
export const ACCENTS = ['#e0574f', '#ffc83d', '#4fb3d9', '#f06292', '#8bd17c', '#ff7f6b'];
export const TOPS = ['#fff6ea', '#ff7f6b', '#ffc83d', '#4fb3d9', '#8bd17c', '#f06292', '#7e57c2', '#2e3a59'];
const lighten = (c, k) => '#' + new THREE.Color(c).lerp(new THREE.Color('#fff8e8'), k).getHexString();
const shade = (c, k) => '#' + new THREE.Color(c).lerp(new THREE.Color('#7a3b3b'), k).getHexString();
export const IRIS = ['#5a3a2a', '#2f2a3a', '#7a5230'];

const mats = {};
const mat = c => mats[c] ??= new THREE.MeshLambertMaterial({ color: c });
const outline = new THREE.MeshBasicMaterial({ color: '#5b3a52', side: THREE.BackSide });
outline.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normalize(normal) * 0.02;'); };

function stripes(a, b, plaid, border) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  g.fillStyle = a; g.fillRect(0, 0, 64, 64); g.fillStyle = b;
  for (let i = 0; i < 64; i += 16) g.fillRect(i, 0, 8, 64);
  if (plaid) { g.globalAlpha = .45; for (let i = 0; i < 64; i += 16) g.fillRect(0, i, 64, 8); g.globalAlpha = 1; }
  if (border) { g.fillStyle = border; g.fillRect(0, 3, 64, 10); g.fillStyle = b; for (let i = 0; i < 64; i += 8) g.fillRect(i + 2, 6, 4, 4); } // canvas top = lathe v=1 = hem
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter; return t;
}

// ---------- face: painted on a canvas, mapped onto a patch of the head ----------
const FW = 384, FH = 256, faceCache = {};
function faceTex(iris, thanaka, eye, mouth) {
  const key = [iris, thanaka, eye, mouth].join('|'); if (faceCache[key]) return faceCache[key];
  const c = document.createElement('canvas'); c.width = FW; c.height = FH; const g = c.getContext('2d');
  const ink = '#3a2430';
  if (thanaka) { // ပါးပေါ်က သနပ်ခါး: round | leaf | square | dots (+ faint brush streaks)
    const T = thanaka === true ? 'round' : thanaka;
    for (const s of [-1, 1]) {
      const cx = 192 + s * 108, cy = 170; g.save(); g.translate(cx, cy); g.fillStyle = 'rgba(255,247,214,.96)';
      if (T === 'round') for (const [dx, dy, r] of [[0, 0, 30], [10 * s, -6, 22], [-8 * s, 10, 20]]) { g.beginPath(); g.arc(dx, dy, r, 0, 7); g.fill(); }
      if (T === 'leaf') { g.rotate(s * .5); g.beginPath(); g.ellipse(0, 0, 36, 20, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(214,190,130,.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-30, 0); g.lineTo(30, 0); g.stroke(); }
      if (T === 'square') { g.beginPath(); g.roundRect(-34, -24, 68, 48, 10); g.fill(); }
      if (T === 'dots') for (const [dx, dy] of [[-16, 6], [2, -10], [18, 8]]) { g.beginPath(); g.arc(dx, dy, 9, 0, 7); g.fill(); }
      if (T !== 'dots') { g.strokeStyle = 'rgba(255,255,240,.55)'; g.lineWidth = 3; for (const dy of [-10, 2, 12]) { g.beginPath(); g.moveTo(-22, dy); g.quadraticCurveTo(0, dy - 4, 22, dy); g.stroke(); } }
      g.restore();
    }
  }
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (const s of [-1, 1]) {
    const x = 192 + s * 62, y = 112;
    g.strokeStyle = ink; g.lineWidth = 6; g.beginPath(); g.arc(x - s * 2, y - 62, 18, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); // brow
    if (eye === 'normal') {
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y, 27, 34, 0, 0, 7); g.fill();
      g.fillStyle = iris; g.beginPath(); g.ellipse(x, y + 5, 21, 27, 0, 0, 7); g.fill();
      g.fillStyle = '#1e1418'; g.beginPath(); g.ellipse(x, y + 8, 11, 15, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 8, y - 6, 7, 0, 7); g.fill(); g.beginPath(); g.arc(x + 9, y + 15, 3.5, 0, 7); g.fill();
      g.strokeStyle = ink; g.lineWidth = 5; g.beginPath(); g.ellipse(x, y, 27, 34, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); // upper lid
      g.lineWidth = 2.5; g.beginPath(); g.ellipse(x, y, 27, 34, 0, 0, Math.PI); g.stroke();
    } else if (eye === 'blink') { g.strokeStyle = ink; g.lineWidth = 7; g.beginPath(); g.arc(x, y - 6, 24, Math.PI * .15, Math.PI * .85); g.stroke(); }
    else if (eye === 'happy') { g.strokeStyle = ink; g.lineWidth = 8; g.beginPath(); g.arc(x, y + 14, 24, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
    else { g.strokeStyle = ink; g.lineWidth = 7; g.beginPath(); g.moveTo(x - s * 20, y - 18); g.lineTo(x + s * 14, y); g.lineTo(x - s * 20, y + 18); g.stroke(); } // > <
  }
  g.fillStyle = '#7a2e3a';
  if (mouth === 'smile') { g.beginPath(); g.moveTo(162, 192); g.quadraticCurveTo(192, 196, 222, 192); g.quadraticCurveTo(218, 232, 192, 234); g.quadraticCurveTo(166, 232, 162, 192); g.fill(); }
  else { g.beginPath(); g.ellipse(192, 208, 17, 22, 0, 0, 7); g.fill(); }
  g.fillStyle = '#e8737f'; g.beginPath(); g.ellipse(192, mouth === 'smile' ? 224 : 220, 15, 8, 0, 0, 7); g.fill(); // tongue
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return faceCache[key] = t;
}

function printTex(color, ink, text) { // shirt print, front-centred (lathe seam sits at the back)
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = color; g.fillRect(0, 0, 512, 128);
  if (text) { g.fillStyle = ink; g.font = '32px "Myanmar Sangam MN","Noto Sans Myanmar",Padauk,sans-serif'; g.textAlign = 'center'; g.fillText(text, 256, 74); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// ---------- build ----------
// opts: skin, hair ('short'|'bun'|'long'|'bob'|'pigtails'|'buzz'|'spiky'), hairColor, iris,
//       top, topStyle ('tee'|'tank'|'long'), print (text|''), bottom ('longyi'|'htamein'|'pants'|'shorts'), bottomColor [a,b],
//       shoes ('sneaker'|'slipper'), shoeColor, hat ('none'|'band'|'goggles'|'bucket'), accent, garland, prop ('none'|'gun'),
//       flower, thanaka (false|'round'|'leaf'|'square'|'dots'), age ('adult'|'kid'|'elder'), build ('round'|'slim'|'broad'), outline
export function makeChibi(opts = {}) {
  const o = { skin: SKINS[0], hair: 'short', hairColor: HAIRS[0], iris: IRIS[0], top: '#fff6ea', topStyle: 'tee', print: 'သင်္ကြန်', bottom: 'longyi', bottomColor: ['#3f7a5a', '#72b08b'],
    shoes: 'sneaker', shoeColor: '#c8553d', hat: 'none', accent: '#e0574f', garland: false, prop: 'none', flower: false, thanaka: 'round', age: 'adult', build: 'round', outline: false, ...opts };
  const B = BUILDS[o.build];
  if (o.shoes[0] === '#') { o.shoeColor = o.shoes; o.shoes = 'sneaker'; } // old call sites passed a colour
  if (o.thanaka === true) o.thanaka = 'round';
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const smooth = c => mats['s' + c] ??= new THREE.MeshLambertMaterial({ color: c });
  const part = (geo, m, parent, x = 0, y = 0, z = 0, ol = o.outline) => {
    const mesh = new THREE.Mesh(geo, typeof m === 'string' ? smooth(m) : m); mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh);
    if (ol) mesh.add(new THREE.Mesh(geo, outline));
    return mesh;
  };
  const pivot = (parent, x, y, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const skirt = o.bottom === 'longyi' || o.bottom === 'htamein';
  const legTop = skirt ? o.skin : o.bottomColor[0], legLow = o.bottom === 'pants' ? o.bottomColor[0] : o.skin;
  const longSleeve = o.topStyle === 'long';

  const hips = pivot(body, 0, HIP);
  part(new THREE.SphereGeometry(B.hip, 16, 10), skirt ? o.skin : o.bottomColor[0], hips, 0, .03).scale.set(1.05, .75, .9);

  const legs = [1, -1].map(side => { // +x is the character's left (it faces +z)
    const hip = pivot(hips, side * .085, 0);
    part(new THREE.CapsuleGeometry(.066, UP - .06, 4, 12), legTop, hip, 0, -UP / 2);
    if (o.bottom === 'shorts') part(new THREE.CylinderGeometry(.078, .078, .05, 14), o.bottomColor[1], hip, 0, -UP + .03, 0);
    const knee = pivot(hip, 0, -UP);
    part(new THREE.CapsuleGeometry(.058, LO - .05, 4, 12), legLow, knee, 0, -LO / 2);
    const foot = pivot(knee, 0, -LO);
    if (o.shoes === 'slipper') { // ညှပ်ဖိနပ်: flat sole, bare foot, thong strap
      part(new THREE.SphereGeometry(.085, 16, 10), o.shoeColor, foot, 0, -.062, .035).scale.set(1, .22, 1.45);
      part(new THREE.SphereGeometry(.07, 14, 10), o.skin, foot, 0, -.035, .03).scale.set(1, .55, 1.35);
      part(new THREE.TorusGeometry(.05, .011, 6, 12, Math.PI), o.accent, foot, 0, -.045, .06);
    } else {
      part(new THREE.SphereGeometry(.085, 16, 10), o.shoeColor, foot, 0, -.03, .035).scale.set(1, .72, 1.45); // chunky sneaker
      part(new THREE.CylinderGeometry(.084, .084, .022, 18), '#fff6ea', foot, 0, -.064, .035).scale.set(1, 1, 1.5);
    }
    return { hip, knee, foot };
  });

  let skirtMesh = null, skirtBase = null;
  if (skirt) {
    const men = o.bottom === 'longyi', hem = -(HIP - .085);
    const prof = B[o.bottom].map(([r, y = hem]) => new THREE.Vector2(r, y));
    const geo = new THREE.LatheGeometry(prof, 28); geo.attributes.position.setUsage(THREE.DynamicDrawUsage);
    const tex = stripes(o.bottomColor[0], o.bottomColor[1], men, men ? null : '#f2c14e'); tex.repeat.set(5, 1);
    skirtMesh = part(geo, new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }), hips);
    skirtBase = Float32Array.from(geo.attributes.position.array);
    if (men) part(new THREE.SphereGeometry(.05, 12, 8), o.bottomColor[0], hips, 0, .06, B.longyi[1][0] - .005); // ပုဆိုးခါးပုံစ (front knot)
  }

  const spine = pivot(hips, 0, .06);
  const torsoProf = B.torso.map(([r, y]) => new THREE.Vector2(r, y));
  const torso = part(new THREE.LatheGeometry(torsoProf, 28), new THREE.MeshLambertMaterial({ map: printTex(o.top, '#5a3550', o.print) }), spine);
  torso.rotation.y = Math.PI; torso.scale.set(1, 1, .82);
  const arms = [1, -1].map(side => {
    const sh = pivot(spine, side * B.sh, .225);
    const tee = o.topStyle === 'tee'; // shoulder cap: only as wide as the sleeve/arm and sunk a little, so it rounds the joint instead of puffing out
    part(new THREE.SphereGeometry(tee ? .068 : .054, 16, 12), o.topStyle === 'tank' ? o.skin : o.top, sh, 0, -.025).scale.y = .85;
    if (tee) part(new THREE.CylinderGeometry(.066, .072, .085, 16), o.top, sh, 0, -.06); // short sleeve
    part(new THREE.CapsuleGeometry(.048, ARM_UP - .05, 4, 10), longSleeve ? o.top : o.skin, sh, 0, -ARM_UP / 2 - .01);
    const elbow = pivot(sh, 0, -ARM_UP);
    part(new THREE.CapsuleGeometry(.046, ARM_LO - .06, 4, 10), longSleeve ? o.top : o.skin, elbow, 0, -ARM_LO / 2 + .01);
    const hand = pivot(elbow, 0, -ARM_LO);
    part(new THREE.SphereGeometry(.07, 14, 10), o.skin, hand, 0, -.01); // round mitten fist
    return { sh, elbow, hand };
  });
  if (o.garland) { // ပန်းကုံး on the chest
    const gl = pivot(spine, 0, .27, .02); gl.rotation.x = .5; gl.scale.setScalar(B.sh / .165);
    part(new THREE.TorusGeometry(.19, .028, 8, 24), '#fff6ea', gl);
    for (let k = 0; k < 10; k++) part(new THREE.SphereGeometry(.03, 8, 6), k % 2 ? PADAUK : '#ff7f6b', gl, Math.cos(k * .628) * .19, Math.sin(k * .628) * .19, 0);
  }

  const neck = pivot(spine, 0, .3);
  const head = pivot(neck, 0, HEAD_R * HEAD_S[1] - .03);
  const skull = pivot(head, 0, 0); skull.scale.set(...HEAD_S); // everything on the skull shares its squash
  if (o.age === 'kid') skull.scale.multiplyScalar(1.1);
  part(new THREE.SphereGeometry(HEAD_R, 32, 20), o.skin, skull);
  // painted face patch (front ~110° x 72°)
  const ft = faceTex(o.iris, o.thanaka, 'normal', 'smile');
  const faceMat = new THREE.MeshLambertMaterial({ map: ft, emissive: '#ffffff', emissiveMap: ft, emissiveIntensity: .28, transparent: true, polygonOffset: true, polygonOffsetFactor: -2 }); // a little self-light keeps eye whites + thanaka bright
  const face = new THREE.Mesh(new THREE.SphereGeometry(HEAD_R * 1.004, 32, 16, Math.PI / 2 - .95, 1.9, Math.PI / 2 - .55, 1.25), faceMat); skull.add(face);
  const nose = part(new THREE.SphereGeometry(.026, 10, 8), shade(o.skin, .18), skull, 0, -.035, HEAD_R * .99, false); nose.scale.set(1.15, .85, .9);
  for (const s of [-1, 1]) part(new THREE.SphereGeometry(.05, 10, 8), o.skin, skull, s * HEAD_R * .98, -.02, 0).scale.set(.5, 1, .8); // ears

  // sculpted hair: cap + sheen + fringe clumps + style
  const hm = o.hairColor, onSkull = (dx, dy, dz, k = 1) => new THREE.Vector3(dx, dy, dz).normalize().multiplyScalar(HEAD_R * k);
  const buzz = o.hair === 'buzz', bucket = o.hat === 'bucket';
  const capH = part(new THREE.SphereGeometry(HEAD_R * (buzz ? 1.025 : 1.05), 32, 16, 0, Math.PI * 2, 0, Math.PI * .5), hm, skull); capH.rotation.x = -.5;
  part(new THREE.SphereGeometry(HEAD_R * 1.03, 24, 12, Math.PI + .3, Math.PI - .6, Math.PI * .3, Math.PI * .42), hm, skull); // back of the head (phi π..2π = -z side)
  if (!bucket) part(new THREE.SphereGeometry(HEAD_R * (buzz ? 1.035 : 1.062), 24, 8, Math.PI / 2 - 1.0, 2.0, .16, .28), lighten(hm, buzz ? .07 : .12), skull, 0, 0, 0, false).castShadow = false; // highlight on the crown (lower, it sat right behind the fringe and made it read as a rolled headband)
  if (!buzz) for (let i = -2; i <= 2; i++) { // fringe
    const p = onSkull(i * .42, .74, .64, 1.0), b = part(new THREE.SphereGeometry(.1, 16, 10), hm, skull, p.x, p.y - .02, p.z, false);
    b.scale.set(.95, 1.2, .45); b.lookAt(b.position.clone().multiplyScalar(2)); b.rotateZ(i * .22 + (i % 2 ? .12 : -.08)); // tall soft bangs, not a rolled band
  }
  let tail = null;
  if (!bucket) {
    if (o.hair === 'short') for (const [x, y, z, rz, rx] of [[-.15, .25, -.08, .9, -.5], [.15, .25, -.08, -.9, -.5], [0, .25, -.16, 0, -1.1], [-.26, .08, -.02, 1.45, -.2], [.26, .08, -.02, -1.45, -.2]]) {
      const sp = part(new THREE.ConeGeometry(.09, .15, 12), hm, skull, x, y, z); sp.rotation.set(rx, 0, rz); // soft swept clumps
    }
    if (o.hair === 'spiky') { const up = new THREE.Vector3(0, 1, 0);
      for (const [dx, dy, dz] of [[0, 1, .2], [-.5, 1, .1], [.5, 1, .1], [-.3, 1, -.5], [.3, 1, -.5], [0, .9, -.8], [-.8, .8, -.2], [.8, .8, -.2]]) {
        const d = new THREE.Vector3(dx, dy, dz).normalize(), p = d.clone().multiplyScalar(HEAD_R * 1.08);
        const sp = part(new THREE.ConeGeometry(.075, .22, 10), hm, skull, p.x, p.y, p.z); sp.quaternion.setFromUnitVectors(up, d); sp.rotateX(-.35);
      } }
    if (o.hair === 'bun') { part(new THREE.SphereGeometry(.13, 16, 12), hm, skull, 0, .3, -.12); part(new THREE.TorusGeometry(.1, .03, 8, 16), o.accent, skull, 0, .23, -.1).rotation.x = Math.PI / 2 - .3; }
    if (o.hair === 'bob') part(new THREE.SphereGeometry(HEAD_R * 1.045, 28, 14, Math.PI / 2 + .62, Math.PI * 2 - 1.24, .3, Math.PI * .56), hm, skull); // bowl hugging sides + back down to the jaw
    if (o.hair === 'pigtails') for (const s of [-1, 1]) {
      part(new THREE.SphereGeometry(.055, 10, 8), o.accent, skull, s * .3, .04, -.06);
      const t = part(new THREE.CapsuleGeometry(.07, .17, 6, 12), hm, skull, s * .36, -.12, -.08); t.rotation.z = s * .45;
      part(new THREE.SphereGeometry(.06, 10, 8), hm, skull, s * .43, -.26, -.09).scale.set(1, 1.2, .9);
    }
    if (o.hair === 'long') {
      tail = pivot(skull, 0, .14, -.27);
      part(new THREE.SphereGeometry(.05, 8, 6), o.accent, tail, 0, 0, -.02);
      const t1 = part(new THREE.CapsuleGeometry(.08, .2, 6, 12), hm, tail, 0, -.15, -.04); t1.scale.set(1, 1, .8);
      part(new THREE.SphereGeometry(.06, 10, 8), hm, tail, 0, -.3, -.02).scale.set(1, 1.2, .8);
      for (const s of [-1, 1]) part(new THREE.CapsuleGeometry(.06, .16, 4, 10), hm, skull, s * .25, -.12, .02).rotation.z = s * .12; // side locks
    }
  }
  if (o.flower) for (const [x, y, z] of [[.22, .22, -.12], [.29, .14, -.08], [.18, .16, -.18], [.27, .24, -.02]]) part(new THREE.IcosahedronGeometry(.05, 0), PADAUK, skull, x, y, z);

  // hats / headgear
  if (o.hat === 'band') { // ခေါင်းစည်း with tails at the back
    const hb = part(new THREE.TorusGeometry(HEAD_R * 1.04, .034, 8, 28), o.accent, skull, 0, .1, 0); hb.rotation.x = Math.PI / 2 + .12;
    for (const s of [-1, 1]) { const tl = part(new THREE.CapsuleGeometry(.025, .14, 4, 8), o.accent, skull, s * .06, -.02, -.31); tl.rotation.set(.5, 0, s * .5); }
  }
  if (o.hat === 'goggles') { // pushed up on the forehead
    part(new THREE.SphereGeometry(HEAD_R * 1.07, 28, 2, 0, Math.PI * 2, .84, .13), lighten(o.accent, .25), skull, 0, 0, 0, false);
    for (const s of [-1, 1]) {
      const g = pivot(skull, s * .1, .2, .24); g.rotation.x = -.5;
      part(new THREE.TorusGeometry(.056, .02, 8, 18), o.accent, g);
      part(new THREE.CircleGeometry(.05, 18), new THREE.MeshLambertMaterial({ color: '#9fe3ff', emissive: '#6fc8ff', emissiveIntensity: .6 }), g, 0, 0, .012);
    }
  }
  if (bucket) {
    const h = pivot(skull, 0, .2, 0); h.rotation.x = .1;
    part(new THREE.CylinderGeometry(.3, .335, .2, 26), o.accent, h, 0, .02);
    part(new THREE.CylinderGeometry(.46, .4, .035, 26), o.accent, h, 0, -.08);
    part(new THREE.TorusGeometry(.33, .015, 6, 26), lighten(o.accent, .4), h, 0, -.04).rotation.x = Math.PI / 2;
  }

  // water gun in the right hand (points along the forearm; hidden while the bucket is out)
  let gun = null;
  if (o.prop === 'gun') {
    gun = pivot(arms[1].hand, 0, -.02, .03); gun.rotation.x = -.15;
    part(new THREE.CylinderGeometry(.034, .03, .3, 12), '#ff7f3f', gun, 0, -.1, .04);
    part(new THREE.CylinderGeometry(.012, .018, .08, 8), '#ffd24d', gun, 0, -.29, .04);
    part(new THREE.SphereGeometry(.065, 12, 10), new THREE.MeshLambertMaterial({ color: '#7fd3ff', transparent: true, opacity: .85 }), gun, 0, -.08, .11).scale.set(1, 1.3, 1);
    part(new THREE.BoxGeometry(.03, .05, .09), '#ff7f3f', gun, 0, .03, .07);
  }

  // the bucket for the splash action (shown only while throwing)
  const bucketG = new THREE.Group(); bucketG.visible = false; root.add(bucketG);
  part(new THREE.CylinderGeometry(.13, .1, .18, 16), o.accent, bucketG);
  part(new THREE.CircleGeometry(.12, 16), '#8fd3f0', bucketG, 0, .085, 0).rotation.x = -Math.PI / 2;
  const blob = new THREE.Mesh(new THREE.CircleGeometry(.34, 20), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = .005; root.add(blob);

  // age: kids are small with a bigger head, elders a little shorter and hunched
  const scale = o.age === 'kid' ? .72 : o.age === 'elder' ? .9 : 1;
  root.scale.setScalar(scale);
  const hunch = o.age === 'elder' ? .22 : 0;

  return { root, body, hips, spine, neck, head, legs, arms, tail, skirtMesh, skirtBase, face, faceKey: '', bucket: bucketG, gun, blob, scale, hunch, opts: o };
}

let _blob;
function blobTex() {
  if (_blob) return _blob;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 4, 32, 32, 32); r.addColorStop(0, 'rgba(70,40,80,.45)'); r.addColorStop(1, 'rgba(70,40,80,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); return _blob = new THREE.CanvasTexture(c);
}

// ---------- animation ----------
const KEYS = ['x', 'y', 'sy', 'hipsRy', 'hipsRz', 'spineRx', 'spineRy', 'spineRz', 'headRx', 'headRy', 'headRz',
  'legLx', 'legRx', 'legLz', 'legRz', 'kneeL', 'kneeR', 'footL', 'footR',
  'armLx', 'armLz', 'armRx', 'armRz', 'elbowL', 'elbowR', 'handLz', 'handRz', 'hold'];
const base = () => Object.fromEntries(KEYS.map(k => [k, k === 'sy' ? 1 : 0]));
const ease = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
const clamp01 = t => Math.min(1, Math.max(0, t));

// loops: idle | walk | run | dance ; one-shots: jump | splash | shake | wave | kadaw
export const LOOPS = { idle: { f: 0, A: 0, speed: 0 }, walk: { f: 1.7, A: .45, speed: 0 }, run: { f: 2.35, A: .78, speed: 0 }, dance: { f: 0, A: 0, speed: 0 } };
const LEG = UP + LO;
for (const k of ['walk', 'run']) LOOPS[k].speed = LEG * LOOPS[k].A * LOOPS[k].f * Math.PI * 2 * .92; // ground speed that keeps the stance foot planted
export const ONESHOT = { jump: .98, splash: .95, shake: 1.0, wave: 1.5, kadaw: 2.6 };

export class ChibiAnimator {
  constructor(ch, emit = () => {}) {
    this.ch = ch; this.emit = emit;
    this.loop = 'idle'; this.one = null; this.oneT = 0; this.T = 0; this.phi = 0; this.freq = 0;
    this.from = base(); this.out = base(); this.blendT = 1;
    this.tailA = 0; this.tailV = 0; this.lastStance = 0;
  }
  setCharacter(ch) { this.ch = ch; }
  setLoop(name) { if (name === this.loop && !this.one) return; this.loop = name; this.one = null; this._xfade(); }
  play(name) { this.one = name; this.oneT = 0; this._xfade(); this.thrown = false; }
  get speed() { return ['kadaw', 'shake', 'splash', 'wave'].includes(this.one) ? 0 : LOOPS[this.loop].speed * (this.ch.scale || 1); } // ground speed (units/s)
  _xfade() { this.from = { ...this.out }; this.blendT = 0; }

  update(dt) {
    this.T += dt; this.blendT += dt;
    const L = LOOPS[this.loop];
    this.freq += ((L.f || 0) - this.freq) * clamp01(dt * 6);
    this.phi += this.freq * Math.PI * 2 * dt;
    let pose = this._loopPose(this.loop);
    if (this.one) {
      this.oneT += dt; const d = ONESHOT[this.one];
      if (this.oneT >= d) { this.one = null; this._xfade(); }
      else pose = this['_' + this.one](pose, this.oneT);
    }
    const w = ease(clamp01(this.blendT / .25));
    for (const k of KEYS) this.out[k] = this.from[k] + (pose[k] - this.from[k]) * w;
    this.out.expr = pose.expr; this.out.mouth = pose.mouth;
    this._apply(this.out, dt);
  }

  _loopPose(name) {
    const p = base(), T = this.T; p.expr = 'normal'; p.mouth = 'smile';
    if (name === 'idle') {
      const b = Math.sin(T * 2.2);
      p.sy = 1 + .012 * b; p.spineRx = .02 * b; p.armLz = .14 + .03 * b; p.armRz = -.14 - .03 * b; p.elbowL = p.elbowR = -.15; p.headRz = .05 * Math.sin(T * .9);
    } else if (name === 'walk' || name === 'run') {
      const run = name === 'run', A = LOOPS[name].A, f = this.phi, s = Math.sin(f), c = Math.cos(f);
      const thL = A * s, thR = -thL;
      p.legLx = -thL; p.legRx = -thR;
      const swL = Math.max(0, c), swR = Math.max(0, -c); // swing phase of each leg (leg moving forward)
      if (run) {
        // swing knee: heel kicks up right after toe-off, straightens before landing; stance knee absorbs at mid-stance
        const kL = Math.max(0, Math.cos(f + .45)), kR = Math.max(0, Math.cos(f + Math.PI + .45));
        p.kneeL = 1.75 * kL ** 1.4 + .6 * swR * swR; p.kneeR = 1.75 * kR ** 1.4 + .6 * swL * swL;
        // toes point during swing, foot flat on the ground through stance
        p.footL = -(p.legLx + p.kneeL) * (1 - swL * .55) - .45 * swL; p.footR = -(p.legRx + p.kneeR) * (1 - swR * .55) - .45 * swR;
        // flight: body highest at full split (both feet off the ground), lowest at mid-stance while the knee absorbs
        p.y = -.035 + .085 * s * s;
        p.sy = 1 - .045 * c * c + .025 * s * s; // squash on landing, stretch in the air
        p.hipsRy = .22 * s; p.spineRy = -p.hipsRy * .8; p.hipsRz = .04 * c;
        p.spineRx = .3 + .03 * Math.cos(2 * f); p.headRx = -.18 + .05 * Math.cos(2 * f); // lean in, eyes stay on the road
        // pump: elbows tight, hands swing chin-high in front and past the hip behind
        p.armLx = 1.05 * s - .35; p.armRx = -1.05 * s - .35; p.armLz = .2; p.armRz = -.2;
        p.elbowL = -1.5 - .3 * Math.max(0, -s); p.elbowR = -1.5 - .3 * Math.max(0, s);
        p.handLz = .3; p.handRz = -.3;
        if (this.ch.skirtMesh) { p.hold = 1; p.armRx = -.65 + .18 * s; p.armRz = .08; p.elbowR = -.75; } // one hand keeps the longyi hitched, still bobs
      } else {
        p.kneeL = .75 * swL ** 1.3; p.kneeR = .75 * swR ** 1.3;
        p.footL = -(p.legLx + p.kneeL) * (1 - swL * .6) - .25 * swL; p.footR = -(p.legRx + p.kneeR) * (1 - swR * .6) - .25 * swR;
        const legY = th => (UP * Math.cos(th) + LO * Math.cos(th)) - LEG; // stance leg straight-ish, body vaults over it
        p.y = Math.max(legY(thL), legY(thR)) + .012 * c * c; p.sy = 1;
        p.hipsRy = .14 * s; p.spineRy = -p.hipsRy * .85; p.hipsRz = .04 * c;
        p.spineRx = .06; p.headRx = -p.spineRx * .7 + .03 * Math.sin(2 * f);
        p.armLx = .55 * s; p.armRx = -.55 * s; p.armLz = .12; p.armRz = -.12;
        p.elbowL = -.25 - .2 * Math.max(0, -s); p.elbowR = -.25 - .2 * Math.max(0, s);
      }
      p.mouth = run ? 'open' : 'smile';
      const stance = c > 0 ? 1 : -1; // dust on each foot strike while running
      if (run && stance !== this.lastStance) this.emit('dust', this.ch.legs[stance > 0 ? 1 : 0].foot);
      this.lastStance = stance;
    } else if (name === 'dance') { // yein: hips sway, knee dips, raised arms with wrist flicks
      const b = T * Math.PI * 2 * 1.1, s = Math.sin(b), d = (1 + Math.sin(2 * b)) / 2;
      p.x = .05 * s; p.hipsRz = .08 * s; p.spineRz = -.1 * s; p.headRz = .14 * Math.sin(b + 1.2);
      p.kneeL = p.kneeR = .3 * d; p.legLx = p.legRx = -.15 * d; p.footL = p.footR = -.15 * d; p.y = -.03 * d;
      p.armLz = 1.15 + .15 * s; p.armRz = -1.15 + .15 * s; p.armLx = p.armRx = -.25; p.elbowL = p.elbowR = -1.25;
      p.handLz = .6 * Math.sin(2 * b); p.handRz = -.6 * Math.sin(2 * b + .5); p.expr = 'happy';
    }
    return p;
  }

  _jump(p, t) {
    const tA = .14, v = 4.0, g = 13, tAir = 2 * v / g, tC = ONESHOT.jump - tA - tAir;
    p = { ...p, expr: 'normal', mouth: 'open' };
    if (t < tA) { const e = ease(t / tA);
      Object.assign(p, { y: -.1 * e, sy: 1 - .12 * e, kneeL: 1.1 * e, kneeR: 1.1 * e, legLx: -.55 * e, legRx: -.55 * e, footL: -.55 * e, footR: -.55 * e,
        spineRx: .3 * e, armLx: .9 * e, armRx: .9 * e, elbowL: -.3, elbowR: -.3, mouth: 'smile' });
    } else if (t < tA + tAir) { const u = t - tA, k = u / tAir;
      const st = clamp01(1 - u / .14);
      Object.assign(p, { y: v * u - .5 * g * u * u, sy: 1 + .13 * st - .04 * (1 - st) * Math.sin(k * Math.PI),
        kneeL: .9 * Math.sin(k * Math.PI), kneeR: .7 * Math.sin(k * Math.PI), legLx: -.65 * Math.sin(k * Math.PI), legRx: -.3 * Math.sin(k * Math.PI),
        footL: .3, footR: .3, spineRx: -.05, armLx: -2.5, armRx: -2.5, armLz: .45, armRz: -.45, elbowL: -.2, elbowR: -.2, headRx: -.15, expr: 'happy' });
    } else { const u = (t - tA - tAir) / tC, b = Math.sin(u * Math.PI) * (1 - u * .5);
      Object.assign(p, { y: -.09 * b, sy: 1 - .16 * b, kneeL: .9 * b, kneeR: .9 * b, legLx: -.45 * b, legRx: -.45 * b, footL: -.45 * b, footR: -.45 * b,
        spineRx: .25 * b, armLz: .5 * b, armRz: -.5 * b, mouth: 'smile' });
    }
    return p;
  }
  _splash(p, t) { // grab → wind-up (twist back) → throw → settle
    p = { ...p, hold: 0 }; const B = this.ch.bucket; B.visible = t < .82;
    const k1 = clamp01(t / .32), k2 = clamp01((t - .32) / .14), k3 = clamp01((t - .46) / .4);
    const wind = ease(k1) * (1 - ease(k2)), thr = ease(k2) * (1 - ease(k3) * .7);
    Object.assign(p, {
      spineRy: .55 * wind - .35 * thr, spineRx: -.08 * wind + .3 * thr, hipsRy: .2 * wind - .15 * thr,
      armLx: .7 * wind - 1.9 * thr, armRx: .7 * wind - 1.9 * thr, armLz: -.25, armRz: .25, elbowL: -.9 + .7 * thr, elbowR: -.9 + .7 * thr,
      kneeL: .25 * wind, kneeR: .35 * wind, legLx: -.1 * wind - .3 * thr, footL: .1 * wind + .3 * thr, legRx: .1 * wind, footR: -.1 * wind,
      expr: thr > .5 ? 'happy' : 'normal', mouth: thr > .3 ? 'open' : 'smile' });
    if (!this.thrown && t > .44) { this.thrown = true; this.emit('splash', B); }
    return p;
  }
  _shake(p, t) { // wet-dog shake
    const d = 1 - t / ONESHOT.shake, w = Math.sin(t * 34) * d;
    Object.assign(p, { hold: 0, spineRy: .45 * w, headRy: -.55 * w, hipsRy: -.15 * w, armLz: .7 + .35 * Math.sin(t * 40), armRz: -.7 - .35 * Math.sin(t * 40 + 1), elbowL: -.4, elbowR: -.4,
      kneeL: .25, kneeR: .25, y: -.03, expr: 'squint', mouth: 'open' });
    if (t < .65 && Math.floor(t * 40) !== Math.floor((t - 1 / 60) * 40)) this.emit('drip', this.ch.head);
    return p;
  }
  _wave(p, t) {
    const up = ease(clamp01(t / .25)) * (1 - ease(clamp01((t - 1.2) / .3)));
    Object.assign(p, { armRz: -2.55 * up + p.armRz * (1 - up), armRx: -.2 * up, elbowR: -.35 * up + .45 * up * Math.sin(t * 13), handRz: .3 * up * Math.sin(t * 13),
      headRz: .12 * up, spineRz: .06 * up, hold: 0, expr: 'happy', mouth: 'open' });
    return p;
  }
  _kadaw(p, t) { // ကန်တော့: kneel, palms together, bow, hold, rise
    const dn = ease(clamp01(t / .6)), bow = ease(clamp01((t - .55) / .45)) * (1 - ease(clamp01((t - 1.75) / .4))), upk = 1 - ease(clamp01((t - 2.05) / .5));
    const k = dn * upk;
    Object.assign(p, { hold: 0, y: -.27 * k, legLx: -1.0 * k, legRx: -1.0 * k, kneeL: 2.15 * k, kneeR: 2.15 * k, footL: -1.1 * k, footR: -1.1 * k,
      spineRx: .15 * k + .75 * bow, headRx: .25 * bow,
      armLx: -1.25 * k + .35 * bow, armRx: -1.25 * k + .35 * bow, armLz: -.32 * k, armRz: .32 * k, elbowL: -1.05 * k, elbowR: -1.05 * k,
      expr: bow > .4 ? 'happy' : 'normal', mouth: 'smile' });
    return p;
  }

  _apply(p, dt) {
    const c = this.ch;
    c.body.position.set(p.x, p.y, 0); c.body.scale.set(1 / Math.sqrt(p.sy), p.sy, 1 / Math.sqrt(p.sy));
    c.hips.rotation.set(0, p.hipsRy, p.hipsRz); c.spine.rotation.set(p.spineRx + (c.hunch || 0), p.spineRy, p.spineRz);
    c.head.rotation.set(p.headRx - (c.hunch || 0) * .7, p.headRy, p.headRz);
    if (c.gun) c.gun.visible = !c.bucket.visible;
    const [lL, lR] = c.legs;
    lL.hip.rotation.set(p.legLx, 0, p.legLz); lR.hip.rotation.set(p.legRx, 0, p.legRz);
    lL.knee.rotation.x = p.kneeL; lR.knee.rotation.x = p.kneeR; lL.foot.rotation.x = p.footL; lR.foot.rotation.x = p.footR;
    const [aL, aR] = c.arms;
    aL.sh.rotation.set(p.armLx, 0, p.armLz); aR.sh.rotation.set(p.armRx, 0, p.armRz);
    aL.elbow.rotation.x = p.elbowL; aR.elbow.rotation.x = p.elbowR; aL.hand.rotation.z = p.handLz; aR.hand.rotation.z = p.handRz;
    // face
    const blink = (this.T % 3.7) < .12, eye = p.expr === 'normal' && blink ? 'blink' : p.expr;
    const key = eye + p.mouth; if (key !== c.faceKey) { c.faceKey = key; c.face.material.map = c.face.material.emissiveMap = faceTex(c.opts.iris, c.opts.thanaka, eye, p.mouth); }
    // bucket rides between the hands
    if (c.bucket.visible) {
      const a = c.arms[0].hand.getWorldPosition(new THREE.Vector3()), b = c.arms[1].hand.getWorldPosition(new THREE.Vector3());
      c.root.worldToLocal(a.add(b).multiplyScalar(.5)); c.bucket.position.copy(a).add(new THREE.Vector3(0, -.02, .06));
      c.bucket.rotation.x = p.armLx < -1 ? -1.1 : 0;
    }
    // ponytail spring (follows body bounce + speed)
    if (c.tail) {
      const target = .25 * (this.freq ? 1 : 0) + p.y * -2.5 + p.spineRx * -.8;
      this.tailV += ((target - this.tailA) * 90 - this.tailV * 9) * dt; this.tailA += this.tailV * dt;
      c.tail.rotation.x = -this.tailA * .6 - .15; c.tail.rotation.z = p.spineRy * -.6;
    }
    // blob shadow shrinks while airborne
    const air = Math.max(0, p.y); c.blob.scale.setScalar(1 - Math.min(.5, air * .8)); c.blob.material.opacity = 1 - Math.min(.6, air);
    // skirt: hem follows the legs, front lifts when hitched
    if (c.skirtMesh) {
      const pos = c.skirtMesh.geometry.attributes.position, B = c.skirtBase, top = .1, hem = -(HIP - .085);
      const fL = Math.sin(-p.legLx) * (UP + LO) * .9 + Math.sin(-(p.legLx + p.kneeL)) * .05;
      const fR = Math.sin(-p.legRx) * (UP + LO) * .9 + Math.sin(-(p.legRx + p.kneeR)) * .05;
      for (let i = 0; i < pos.count; i++) {
        const x = B[i * 3], y = B[i * 3 + 1], z = B[i * 3 + 2], h = clamp01((top - y) / (top - hem)) ** 1.6;
        const wl = clamp01(.5 + x * 4.5), dz = h * (wl * fL + (1 - wl) * fR) * .8;
        const front = clamp01(z * 5), lift = p.hold * h * front * .16 + h * Math.max(p.kneeL, p.kneeR) * .03;
        pos.setXYZ(i, x * (1 + h * .06 * (Math.abs(fL - fR))), y + lift, z + dz);
      }
      pos.needsUpdate = true; c.skirtMesh.geometry.computeVertexNormals();
    }
  }
}
