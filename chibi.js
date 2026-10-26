// chibi.js — cute 2.2-head character with a code-driven rig + procedural animation.
// Used by character-lab.html now, by the diorama later. No model files.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------- proportions (units ≈ 0.75 m) ----------
const UP = .2, LO = .19, ANKLE = .075;         // thigh, shin, ankle→sole (longer legs than v1)
export const HIP = UP + LO + ANKLE;            // hip height when standing
const ARM_UP = .155, ARM_LO = .135;
const HEAD_R = .3;
// ---------- hair: one smooth shell per style (no seams between pieces) ----------
// The shell is a displaced sphere: outside the skull where there is hair, tucked inside it elsewhere.
// line(az) = hairline height on the unit sphere by azimuth (0 = face, ±π = back); thick(v, az) = hair depth (× head radius).
const hairline = (F, S, K) => { const b = (F - K) / 2, ac = (F + K) / 2, a = (ac + S) / 2, c = (ac - S) / 2; return az => a + b * Math.cos(az) + c * Math.cos(2 * az); }; // front / side / back heights
const bump = (x, w) => Math.max(0, 1 - (x / w) ** 2) ** 2;
const tufts = (az, list) => list.reduce((d, [a, w, k]) => d + k * bump(az - a, w), 0);
const crownLift = v => .035 * Math.max(0, v.y) + .01 * Math.sin(Math.atan2(v.x, v.z) * 5 + v.y * 7); // a bit of volume on top + a soft wave so it isn't a helmet
const parting = (v, x0) => 1 - .45 * bump(v.x - x0, .07) * THREE.MathUtils.smoothstep(v.y, .3, .5) * THREE.MathUtils.smoothstep(v.z, -.1, .2); // shallow groove on the front-top
const SPIKES = [[0, 1, .2], [-.5, 1, .1], [.5, 1, .1], [-.3, 1, -.5], [.3, 1, -.5], [0, .9, -.8], [-.8, .8, -.2], [.8, .8, -.2]].map(d => [new THREE.Vector3(...d).normalize(), .5]);
const CREST = Array.from({ length: 10 }, (_, i) => { const b = .55 + i * .32; return [new THREE.Vector3(0, Math.sin(b), Math.cos(b)), .5 + .4 * Math.max(0, Math.sin(b))]; }); // mohawk fan: forehead → crown → nape
const spikes = (v, list, w) => list.reduce((t, [d, L]) => t + L * Math.max(0, 1 - Math.acos(Math.min(1, v.dot(d))) / w) ** 1.3, 0); // falloff by angle → a true point at each tip
const HAIR_STYLES = {
  short: { line: hairline(.5, .08, -.42), fringe: [[-.75, .22, .09], [-.3, .2, .1], [.12, .22, .08], [.55, .22, .09]], thick: v => .05 + crownLift(v) },
  buzz: { line: hairline(.6, .2, -.35), thick: () => .018 },
  spiky: { line: hairline(.52, .1, -.4), fringe: [[-.4, .2, .07], [.25, .2, .07]], thick: v => .045 + crownLift(v) + spikes(v, SPIKES, .26) },
  bob: { line: hairline(.42, -.38, -.38), blunt: true, thick: v => .05 + (.05 + .012 * Math.sin(Math.atan2(v.x, v.z) * 11)) * THREE.MathUtils.smoothstep(-v.y, -.3, .35) + crownLift(v) }, // fuller, softly wavy at the bottom
  bun: { line: hairline(.6, .05, -.5), thick: v => (.045 + crownLift(v)) * parting(v, 0) },
  pigtails: { line: hairline(.58, .0, -.5), thick: v => (.045 + crownLift(v)) * parting(v, 0) },
  mohawk: { cover: v => THREE.MathUtils.smoothstep(.22 - Math.abs(v.x), -.02, .04) * THREE.MathUtils.smoothstep(v.y - (v.z >= 0 ? .45 : -.4), -.02, .06), // shaved sides, a strip forehead → nape
    thick: v => .03 + spikes(v, CREST, .24) },
  long: { line: hairline(.6, -.35, -.55), blunt: true, thick: v => (.045 + .02 * THREE.MathUtils.smoothstep(-v.y, -.2, .4) + crownLift(v)) * parting(v, .12) },
};
const hairCache = {};
// ponytail / pigtail: a smooth teardrop hanging from the tie (y = 0) down to a soft point
const tailGeo = (r, len) => new THREE.LatheGeometry([[.02, 0], [r * .8, -len * .12], [r, -len * .36], [r * .82, -len * .66], [r * .45, -len * .88], [.004, -len]].map(([x, y]) => new THREE.Vector2(x, y)), 20);
function hairGeo(style, kid) {
  const key = style + kid; if (hairCache[key]) return hairCache[key];
  const st = HAIR_STYLES[style], g = st.cover || style === 'spiky' ? new THREE.SphereGeometry(HEAD_R, 120, 80) : new THREE.SphereGeometry(HEAD_R, 72, 48); // spikes need the finer mesh g.deleteAttribute('uv'); g.deleteAttribute('normal');
  const geo = mergeVertices(g), p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const az = Math.atan2(v.x, v.z), A = Math.abs(az);
    const line = st.cover ? 0 : st.line(az) - (st.fringe ? tufts(az, st.fringe) : 0) + (kid ? .06 * THREE.MathUtils.smoothstep(-A, -1.3, -.8) : 0); // kids: hairline a little higher (their brows sit higher)
    const h = v.y - line, cover = st.cover ? st.cover(v) : st.blunt ? THREE.MathUtils.smoothstep(h, -.015, .015) : THREE.MathUtils.smoothstep(h, -.02, .1);
    v.multiplyScalar(HEAD_R * (.97 + (.03 + st.thick(v, az)) * cover)); p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals(); return hairCache[key] = geo;
}

export const HEADS = { wide: [1.1, .96, .95], round: [1.02, 1, .98], tall: [.97, 1.07, .94], soft: [1.15, .92, 1.0] }; // skull squash per head shape

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
export const shade = (c, k) => '#' + new THREE.Color(c).lerp(new THREE.Color('#7a3b3b'), k).getHexString();
export const IRIS = ['#5a3a2a', '#2f2a3a', '#7a5230'];

const mats = {};
const mat = c => mats[c] ??= new THREE.MeshLambertMaterial({ color: c });
export const outline = new THREE.MeshBasicMaterial({ color: '#5b3a52', side: THREE.BackSide }); // shared inverted-hull outline (critters.js uses it too)
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
// o.eyes round|almond|bead|sleepy · o.brows arc|flat|thin|bold · o.lips smile|grin|small|cat · o.marks none|blush|freckles|mole
function faceTex(o, eye, mouth) {
  const k = o.age === 'kid' ? 1.22 : 1, { iris, thanaka } = o;
  const key = [iris, thanaka, o.eyes, o.brows, o.lips, o.marks, k, eye, mouth].join('|'); if (faceCache[key]) return faceCache[key];
  const c = document.createElement('canvas'); c.width = FW; c.height = FH; const g = c.getContext('2d');
  const ink = '#3a2430';
  if (o.marks === 'freckles') { g.fillStyle = 'rgba(120,70,50,.6)'; for (const s of [-1, 1]) for (const [dx, dy] of [[38, 150], [54, 161], [68, 147], [47, 172]]) { g.beginPath(); g.arc(192 + s * dx, dy, 4, 0, 7); g.fill(); } }
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
  if (o.marks === 'blush') for (const s of [-1, 1]) { g.fillStyle = 'rgba(240,110,120,.4)'; g.beginPath(); g.ellipse(192 + s * 74, 152, 24, 12, 0, 0, 7); g.fill(); } // over the thanaka, nearer the nose so it shows
  if (o.marks === 'mole') { g.fillStyle = '#4a2e2a'; g.beginPath(); g.arc(240, 194, 5, 0, 7); g.fill(); }
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (const s of [-1, 1]) {
    const x = 192 + s * 62, y = 112;
    g.save(); g.translate(x, y); g.scale(k, k); g.translate(-x, -y);
    g.strokeStyle = ink; g.lineWidth = { thin: 3.5, bold: 11 }[o.brows] || 6; g.beginPath(); // brow
    if (o.brows === 'flat') { g.moveTo(x - 17, y - 74); g.lineTo(x + 17, y - 74); } else g.arc(x - s * 2, y - 62, o.brows === 'bold' ? 16 : 18, Math.PI * 1.2, Math.PI * 1.8);
    g.stroke();
    if (eye === 'normal' && o.eyes === 'bead') { // small shiny bead eyes
      g.fillStyle = '#1e1418'; g.beginPath(); g.ellipse(x, y + 4, 13, 17, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 4, y - 3, 5, 0, 7); g.fill();
    } else if (eye === 'normal' && o.eyes === 'almond') { // narrower, outer corner lifted
      g.save(); g.translate(x, y); g.rotate(-s * .14); g.beginPath(); g.ellipse(0, 0, 30, 21, 0, 0, 7); g.fillStyle = '#fff'; g.fill(); g.save(); g.clip();
      g.fillStyle = iris; g.beginPath(); g.ellipse(0, 3, 17, 20, 0, 0, 7); g.fill();
      g.fillStyle = '#1e1418'; g.beginPath(); g.ellipse(0, 5, 9, 12, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(-6, -4, 5, 0, 7); g.fill(); g.restore();
      g.strokeStyle = ink; g.lineWidth = 5; g.beginPath(); g.ellipse(0, 0, 30, 21, 0, Math.PI * 1.02, Math.PI * 1.98); g.stroke(); g.restore();
    } else if (eye === 'normal') { // round (sleepy = the same eye, half-lidded)
      const sl = o.eyes === 'sleepy';
      g.save(); if (sl) { g.translate(0, y * .35 + 8); g.scale(1, .65); }
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y, 27, 34, 0, 0, 7); g.fill();
      g.fillStyle = iris; g.beginPath(); g.ellipse(x, y + 5, 21, 27, 0, 0, 7); g.fill();
      g.fillStyle = '#1e1418'; g.beginPath(); g.ellipse(x, y + 8, 11, 15, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 8, y - 6, 7, 0, 7); g.fill(); g.beginPath(); g.arc(x + 9, y + 15, 3.5, 0, 7); g.fill();
      g.strokeStyle = ink; g.lineWidth = sl ? 8 : 5; g.beginPath(); g.ellipse(x, y, 27, 34, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); // upper lid
      g.lineWidth = 2.5; g.beginPath(); g.ellipse(x, y, 27, 34, 0, 0, Math.PI); g.stroke(); g.restore();
    } else if (eye === 'blink') { g.strokeStyle = ink; g.lineWidth = 7; g.beginPath(); g.arc(x, y - 6, 24, Math.PI * .15, Math.PI * .85); g.stroke(); }
    else if (eye === 'happy') { g.strokeStyle = ink; g.lineWidth = 8; g.beginPath(); g.arc(x, y + 14, 24, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
    else { g.strokeStyle = ink; g.lineWidth = 7; g.beginPath(); g.moveTo(x - s * 20, y - 18); g.lineTo(x + s * 14, y); g.lineTo(x - s * 20, y + 18); g.stroke(); } // > <
    g.restore();
  }
  g.fillStyle = g.strokeStyle = '#7a2e3a'; g.lineWidth = 6;
  const lips = mouth === 'smile' ? o.lips : 'open';
  if (lips === 'smile') { g.beginPath(); g.moveTo(162, 192); g.quadraticCurveTo(192, 196, 222, 192); g.quadraticCurveTo(218, 232, 192, 234); g.quadraticCurveTo(166, 232, 162, 192); g.fill(); }
  if (lips === 'grin') { g.beginPath(); g.moveTo(148, 188); g.quadraticCurveTo(192, 196, 236, 188); g.quadraticCurveTo(230, 238, 192, 240); g.quadraticCurveTo(154, 238, 148, 188); g.fill(); }
  if (lips === 'small') { g.beginPath(); g.arc(192, 180, 22, Math.PI * .22, Math.PI * .78); g.stroke(); }
  if (lips === 'cat') { g.beginPath(); g.arc(178, 194, 14, 0, Math.PI); g.moveTo(220, 194); g.arc(206, 194, 14, 0, Math.PI); g.stroke(); } // ω
  if (lips === 'open') { g.beginPath(); g.ellipse(192, 208, 17, 22, 0, 0, 7); g.fill(); }
  if (lips === 'smile' || lips === 'grin' || lips === 'open') { g.fillStyle = '#e8737f'; g.beginPath(); g.ellipse(192, lips === 'open' ? 220 : lips === 'grin' ? 228 : 224, 15, 8, 0, 0, 7); g.fill(); } // tongue
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return faceCache[key] = t;
}

function printTex(color, ink, text, style, bib) { // shirt print, front-centred (lathe seam sits at the back); bib = overalls colour
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = color; g.fillRect(0, 0, 512, 128);
  const trim = lighten(color, .45), dark = shade(color, .22);
  if (style === 'stripe') { g.fillStyle = trim; for (let y = 18; y < 128; y += 22) g.fillRect(0, y, 512, 9); } // kids' striped tee
  if (style === 'shirt') { // button-up: collar points, placket, chest pocket
    g.fillStyle = trim; g.beginPath(); g.moveTo(226, 10); g.lineTo(254, 14); g.lineTo(240, 34); g.fill(); g.beginPath(); g.moveTo(286, 10); g.lineTo(258, 14); g.lineTo(272, 34); g.fill();
    g.strokeStyle = dark; g.lineWidth = 3; g.beginPath(); g.moveTo(256, 16); g.lineTo(256, 128); g.stroke();
    g.fillStyle = trim; for (const by of [44, 66, 88, 110]) { g.beginPath(); g.arc(262, by, 4, 0, 7); g.fill(); }
    g.strokeStyle = dark; g.lineWidth = 2.5; g.strokeRect(282, 46, 26, 24); return canvasTex(c);
  }
  if (style === 'hoodie') { // kangaroo pocket + drawstrings
    g.fillStyle = dark; g.beginPath(); g.roundRect(214, 84, 84, 36, 10); g.fill();
    g.strokeStyle = trim; g.lineWidth = 4; for (const x of [246, 266]) { g.beginPath(); g.moveTo(x, 8); g.lineTo(x + (x < 256 ? -3 : 3), 40); g.stroke(); }
    return canvasTex(c);
  }
  if (style === 'jacket') { // worn open: the tee underneath shows down the front, lapels either side
    g.fillStyle = '#fff6ea'; g.fillRect(232, 0, 48, 128);
    g.strokeStyle = dark; g.lineWidth = 5; for (const x of [230, 282]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke(); }
    g.fillStyle = dark; g.beginPath(); g.moveTo(232, 0); g.lineTo(214, 0); g.lineTo(232, 44); g.fill(); g.beginPath(); g.moveTo(280, 0); g.lineTo(298, 0); g.lineTo(280, 44); g.fill();
    return canvasTex(c);
  }
  if (bib) { // overalls: bib over the tummy, straps over the shoulders, two buttons
    g.fillStyle = bib; g.fillRect(212, 62, 88, 66); g.fillRect(214, 0, 14, 64); g.fillRect(284, 0, 14, 64);
    g.fillStyle = '#f2c14e'; for (const x of [221, 291]) { g.beginPath(); g.arc(x, 64, 6, 0, 7); g.fill(); }
    return canvasTex(c);
  }
  if (style === 'yinphone') { // ရင်ဖုံး: crossover flap from the collar to the side, little buttons, light hem band
    g.strokeStyle = trim; g.lineWidth = 6; g.beginPath(); g.moveTo(246, 16); g.quadraticCurveTo(262, 58, 326, 72); g.stroke();
    g.fillStyle = trim; for (const [bx, by] of [[262, 46], [286, 63], [310, 70]]) { g.beginPath(); g.arc(bx, by, 5, 0, 7); g.fill(); }
    g.fillRect(0, 100, 512, 10); return canvasTex(c);
  }
  if (style === 'taikpon') { // တိုက်ပုံ: white undershirt collar at the throat, front placket with knot buttons
    g.fillStyle = '#fff6ea'; g.beginPath(); g.moveTo(232, 8); g.lineTo(280, 8); g.lineTo(256, 44); g.fill();
    g.strokeStyle = trim; g.lineWidth = 3; g.beginPath(); g.moveTo(256, 44); g.lineTo(256, 128); g.stroke();
    g.fillStyle = trim; for (const by of [56, 76, 96]) { g.beginPath(); g.arc(256, by, 6, 0, 7); g.fill(); }
    return canvasTex(c);
  }
  if (text) { g.fillStyle = ink; g.font = '32px "Myanmar Sangam MN","Noto Sans Myanmar",Padauk,sans-serif'; g.textAlign = 'center'; g.fillText(text, 256, 74); }
  return canvasTex(c);
}
function canvasTex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

// ---------- build ----------
// opts: skin, hair ('short'|'bun'|'long'|'bob'|'pigtails'|'buzz'|'spiky'|'mohawk'), hairColor, iris,
//       top, topStyle ('tee'|'stripe'|'tank'|'long'|'shirt'|'hoodie'|'jacket'|'yinphone'|'taikpon'), print (text|''),
//       bottom ('longyi'|'htamein'|'pants'|'shorts'|'skirt'|'overalls'), bottomColor [a,b],
//       shoes ('sneaker'|'slipper'), shoeColor, hat ('none'|'band'|'goggles'|'bucket'), accent, garland, prop ('none'|'gun'),
//       flower, thanaka (false|'round'|'leaf'|'square'|'dots'), age ('adult'|'kid'|'elder'), build ('round'|'slim'|'broad'), outline,
//       face: eyes/brows/lips/marks (see faceTex), head ('wide'|'round'|'tall'|'soft'); topStyle also 'yinphone' (ရင်ဖုံး) | 'taikpon' (တိုက်ပုံ)
export function makeChibi(opts = {}) {
  const o = { skin: SKINS[0], hair: 'short', hairColor: HAIRS[0], iris: IRIS[0], top: '#fff6ea', topStyle: 'tee', print: 'သင်္ကြန်', bottom: 'longyi', bottomColor: ['#3f7a5a', '#72b08b'],
    shoes: 'sneaker', shoeColor: '#c8553d', hat: 'none', accent: '#e0574f', garland: false, prop: 'none', flower: false, thanaka: 'round', age: 'adult', build: 'round', outline: false,
    eyes: 'round', brows: 'arc', lips: 'smile', marks: 'none', head: 'wide', ...opts };
  const B = BUILDS[o.build];
  if (o.shoes[0] === '#') { o.shoeColor = o.shoes; o.shoes = 'sneaker'; } // old call sites passed a colour
  if (o.thanaka === true) o.thanaka = 'round';
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const smooth = c => mats['s' + c] ??= new THREE.MeshLambertMaterial({ color: c });
  // clothes + hair get their own materials (not the shared cache) so one soaked person doesn't darken everyone in that colour
  const wetMats = [], worn = {}, vol = [];
  const wear = (c, map) => { const m = new THREE.MeshPhongMaterial({ color: map ? '#fff' : c, map, specular: 0, shininess: 60 }); m.userData.base = m.color.clone(); wetMats.push(m); return m; };
  const cloth = c => worn[c] ??= wear(c);
  const part = (geo, m, parent, x = 0, y = 0, z = 0, ol = o.outline) => {
    const mesh = new THREE.Mesh(geo, typeof m === 'string' ? smooth(m) : m); mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh);
    if (ol) mesh.add(new THREE.Mesh(geo, outline));
    return mesh;
  };
  const pivot = (parent, x, y, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  // clothes hang off the body rather than being painted on it: tops drape straight from the chest to an untucked hem,
  // sleeves and trouser legs are open tubes wider than the limb inside, shorts/skirts flare
  const longSkirt = o.bottom === 'longyi' || o.bottom === 'htamein', skirt = longSkirt || o.bottom === 'skirt';
  const pants = o.bottom === 'pants', shortsLike = o.bottom === 'shorts' || o.bottom === 'overalls';
  const pantsMat = cloth(o.bottomColor[0]); pantsMat.side = THREE.DoubleSide; // open hems are seen from inside too
  const legTop = skirt || shortsLike ? o.skin : pantsMat, legLow = pants ? pantsMat : o.skin;
  const longSleeve = ['long', 'hoodie', 'jacket', 'yinphone', 'taikpon'].includes(o.topStyle), shortSleeve = ['tee', 'stripe', 'shirt'].includes(o.topStyle);
  const legK = o.age === 'kid' ? .8 : 1, up = UP * legK, lo = LO * legK, hipH = up + lo + ANKLE; // kids: shorter legs

  const hips = pivot(body, 0, hipH);
  part(new THREE.SphereGeometry(skirt ? B.hip : Math.max(B.hip, .16), 16, 10), skirt ? o.skin : pantsMat, hips, 0, .03).scale.set(1.05, .75, .9);

  const legs = [1, -1].map(side => { // +x is the character's left (it faces +z)
    const hip = pivot(hips, side * .085, 0);
    part(new THREE.CapsuleGeometry(pants ? .08 : .066, up - .06, 4, 12), legTop, hip, 0, -up / 2); // trousers: roomy legs
    if (shortsLike) part(new THREE.CylinderGeometry(.09, .1, up * .8, 16, 1, true), pantsMat, hip, 0, -up * .4 + .02); // wide shorts leg, down to just above the knee
    const knee = pivot(hip, 0, -up);
    part(new THREE.CapsuleGeometry(pants ? .07 : .058, lo - .05, 4, 12), legLow, knee, 0, -lo / 2);
    if (pants) part(new THREE.CylinderGeometry(.07, .08, .05, 14, 1, true), pantsMat, knee, 0, -lo + .035); // hem flares over the shoe
    const foot = pivot(knee, 0, -lo);
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
  const skirtHem = longSkirt ? -(hipH - .085) : -(up + .01); // ankle for longyi / htamein, knee for a skirt
  const skirtProf = longSkirt ? B[o.bottom] : (r => [[r, .1], [r + .012, .03], [r + .045, -.1], [r + .085]])(B.htamein[0][0]); // A-line
  if (skirt) {
    const men = o.bottom === 'longyi';
    const prof = skirtProf.map(([r, y = skirtHem]) => new THREE.Vector2(r, y));
    const geo = new THREE.LatheGeometry(prof, 28); geo.attributes.position.setUsage(THREE.DynamicDrawUsage);
    const tex = longSkirt ? stripes(o.bottomColor[0], o.bottomColor[1], men, men ? null : '#f2c14e') : stripes(o.bottomColor[0], o.bottomColor[0], false, lighten(o.bottomColor[0], .4)); tex.repeat.set(5, 1);
    const sm = wear(null, tex); sm.side = THREE.DoubleSide; skirtMesh = part(geo, sm, hips);
    skirtBase = Float32Array.from(geo.attributes.position.array);
    if (men) part(new THREE.SphereGeometry(.05, 12, 8), cloth(o.bottomColor[0]), hips, 0, .06, B.longyi[1][0] - .005); // ပုဆိုးခါးပုံစ (front knot)
  }

  const spine = pivot(hips, 0, .06);
  // top: straight drape from the chest (no painted-on waist) to a hem that hangs over whatever is underneath
  const rc = Math.max(...B.torso.filter(([, y]) => y > .08).map(([r]) => r));
  const under = skirt ? Math.max(skirtProf[1][0], skirtProf[2][0]) : shortsLike ? .185 : .17;
  const hemR = Math.max(rc + .015, under + .015);
  const torsoProf = [[.001, -.095], [hemR, -.095], [hemR - .006, -.06], [rc * .99, .06], [rc, .14], ...B.torso.filter(([, y]) => y >= .2)].map(([r, y]) => new THREE.Vector2(r, y));
  const tg = new THREE.LatheGeometry(torsoProf, 32), tp = tg.attributes.position, zTop = o.age === 'kid' ? .98 : .82; // kids: round tummy
  for (let i = 0; i < tp.count; i++) tp.setZ(i, tp.getZ(i) * THREE.MathUtils.lerp(zTop, 1, THREE.MathUtils.smoothstep(-tp.getY(i), -.06, .06))); // flattened chest, round hem
  tg.computeVertexNormals();
  const torso = part(tg, wear(null, printTex(o.top, '#5a3550', o.print, o.topStyle, o.bottom === 'overalls' && o.bottomColor[0])), spine);
  torso.rotation.y = Math.PI;
  if (o.topStyle === 'hoodie') { // hood folded down behind the neck
    part(new THREE.TorusGeometry(.1, .04, 10, 20), cloth(o.top), spine, 0, .285, -.02).rotation.x = Math.PI / 2 - .2;
    part(new THREE.SphereGeometry(.11, 16, 12), cloth(o.top), spine, 0, .25, -.13).scale.set(1.15, .8, .55);
  }
  const arms = [1, -1].map(side => {
    const sh = pivot(spine, side * B.sh, .225);
    const sleeve = cloth(o.top); sleeve.side = THREE.DoubleSide;
    // shoulder cap: only as wide as the sleeve/arm and sunk a little, so it rounds the joint instead of puffing out
    part(new THREE.SphereGeometry(shortSleeve ? .068 : longSleeve ? .064 : .054, 16, 12), o.topStyle === 'tank' ? o.skin : sleeve, sh, 0, -.025).scale.y = .85;
    if (shortSleeve) part(new THREE.CylinderGeometry(.066, .09, .11, 18, 1, true), sleeve, sh, 0, -.07); // short sleeve, wide open at the end
    if (longSleeve) part(new THREE.CylinderGeometry(.064, .066, ARM_UP + .01, 16, 1, true), sleeve, sh, 0, -ARM_UP / 2 - .005);
    part(new THREE.CapsuleGeometry(.048, ARM_UP - .05, 4, 10), longSleeve ? sleeve : o.skin, sh, 0, -ARM_UP / 2 - .01);
    const elbow = pivot(sh, 0, -ARM_UP);
    if (longSleeve) part(new THREE.CylinderGeometry(.06, .074, ARM_LO - .015, 16, 1, true), sleeve, elbow, 0, -ARM_LO / 2 + .005); // loose cuff at the wrist
    part(new THREE.CapsuleGeometry(.046, ARM_LO - .06, 4, 10), longSleeve ? sleeve : o.skin, elbow, 0, -ARM_LO / 2 + .01);
    if (o.topStyle === 'taikpon') part(new THREE.CylinderGeometry(.05, .05, .03, 12), '#fff6ea', elbow, 0, -ARM_LO + .035, 0, false); // white shirt cuff
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
  const HS = HEADS[o.head];
  const head = pivot(neck, 0, HEAD_R * HS[1] - .03);
  const skull = pivot(head, 0, 0); skull.scale.set(...HS); // everything on the skull shares its squash
  if (o.age === 'kid') skull.scale.multiplyScalar(1.1);
  part(new THREE.SphereGeometry(HEAD_R, 32, 20), o.skin, skull);
  // painted face patch (front ~110° x 72°)
  const ft = faceTex(o, 'normal', 'smile');
  const faceMat = new THREE.MeshLambertMaterial({ map: ft, emissive: '#ffffff', emissiveMap: ft, emissiveIntensity: .28, transparent: true, polygonOffset: true, polygonOffsetFactor: -2 }); // a little self-light keeps eye whites + thanaka bright
  const face = new THREE.Mesh(new THREE.SphereGeometry(HEAD_R * 1.004, 32, 16, Math.PI / 2 - .95, 1.9, Math.PI / 2 - .55, 1.25), faceMat); skull.add(face);
  const nose = part(new THREE.SphereGeometry(.026, 10, 8), shade(o.skin, .18), skull, 0, -.035, HEAD_R * .99, false); nose.scale.set(1.15, .85, .9);
  for (const s of [-1, 1]) part(new THREE.SphereGeometry(.05, 10, 8), o.skin, skull, s * HEAD_R * .98, -.02, 0).scale.set(.5, 1, .8); // ears

  if (o.age === 'elder') { // မျက်မှန်
    for (const s of [-1, 1]) part(new THREE.TorusGeometry(.058, .008, 6, 20), '#4a3428', skull, s * .092, .005, HEAD_R + .012, false).rotation.y = s * .32;
    part(new THREE.CylinderGeometry(.006, .006, .06, 6), '#4a3428', skull, 0, .02, HEAD_R + .02, false).rotation.z = Math.PI / 2;
  }

  // hair: one smooth shell (see HAIR_STYLES) + bun / ponytail / pigtails on top
  const hm = cloth(o.hairColor), bucket = o.hat === 'bucket';
  hm.userData.spec = .1; hm.specular.setScalar(.1); hm.shininess = 30; // a little sheen even when dry
  const shell = part(hairGeo(o.hair, o.age === 'kid'), hm, skull); shell.userData.flat = .04; vol.push(shell); // wet hair sits a touch flatter
  let tail = null;
  if (!bucket) {
    if (o.hair === 'bun') { part(new THREE.SphereGeometry(.13, 16, 12), hm, skull, 0, .3, -.12); part(new THREE.TorusGeometry(.1, .03, 8, 16), o.accent, skull, 0, .23, -.1).rotation.x = Math.PI / 2 - .3; }
    if (o.hair === 'pigtails') for (const s of [-1, 1]) {
      part(new THREE.SphereGeometry(.055, 10, 8), o.accent, skull, s * .3, .04, -.06);
      const pt = pivot(skull, s * .3, .04, -.06); pt.rotation.z = s * .45;
      part(tailGeo(.075, .32), hm, pt, 0, -.01, -.01);
    }
    if (o.hair === 'long') {
      tail = pivot(skull, 0, .14, -.27);
      part(new THREE.SphereGeometry(.05, 8, 6), o.accent, tail, 0, 0, -.02);
      part(tailGeo(.085, .38), hm, tail, 0, -.02, -.04).scale.z = .8;
    }
  }
  if (o.flower) { // ပိတောက်ပန်း: a sprig of florets tucked into the bun (or behind the ear) with a leaf
    const [fx, fy, fz] = o.hair === 'bun' ? [.12, .33, -.05] : [.25, .17, -.1];
    part(new THREE.SphereGeometry(.05, 8, 6), '#5d9a4a', skull, fx + .02, fy - .025, fz - .03, false).scale.set(1.4, .35, .8);
    for (let i = 0; i < 6; i++) part(new THREE.IcosahedronGeometry(.032, 0), PADAUK, skull, fx + Math.cos(i * 1.05) * .045, fy + .01 + Math.sin(i * 1.05) * .04, fz + Math.sin(i * 2.1) * .02, false);
  }

  // hats / headgear
  if (o.hat === 'band') { // ခေါင်းစည်း with tails at the back
    const hb = part(new THREE.TorusGeometry(HEAD_R * 1.04, .034, 8, 28), o.accent, skull, 0, .1, 0); hb.rotation.x = Math.PI / 2 + .12;
    for (const s of [-1, 1]) { const tl = part(new THREE.CapsuleGeometry(.025, .14, 4, 8), o.accent, skull, s * .06, -.02, -.31); tl.rotation.set(.5, 0, s * .5); }
  }
  if (o.hat === 'goggles') { // pushed up on the forehead
    part(new THREE.SphereGeometry(HEAD_R * 1.1, 28, 2, 0, Math.PI * 2, .84, .13), lighten(o.accent, .25), skull, 0, 0, 0, false);
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

  // water: o.tools = which to build ('gun' in the right hand, 'bucket' hanging from the left), o.tool = which one is out
  const tools = o.tools ?? [o.tool ?? (o.prop === 'gun' ? 'gun' : 'none')];
  let gun = null;
  if (tools.includes('gun')) {
    gun = pivot(arms[1].hand, 0, -.02, .03); gun.rotation.x = -.15;
    part(new THREE.CylinderGeometry(.034, .03, .3, 12), '#ff7f3f', gun, 0, -.1, .04);
    part(new THREE.CylinderGeometry(.012, .018, .08, 8), '#ffd24d', gun, 0, -.29, .04);
    part(new THREE.SphereGeometry(.065, 12, 10), new THREE.MeshLambertMaterial({ color: '#7fd3ff', transparent: true, opacity: .85 }), gun, 0, -.08, .11).scale.set(1, 1.3, 1);
    part(new THREE.BoxGeometry(.03, .05, .09), '#ff7f3f', gun, 0, .03, .07);
  }

  let cane = null;
  if (o.age === 'elder') { // တောင်ဝှေး, kept upright by the animator
    cane = pivot(arms[1].hand, 0, -.02, .02);
    part(new THREE.CylinderGeometry(.015, .015, .5, 8), '#7a4a2e', cane, 0, -.25, 0); part(new THREE.SphereGeometry(.03, 8, 6), '#7a4a2e', cane);
  }

  // the water bucket: origin at the top of its handle, so it hangs from the left hand; both hands swing it to throw
  const bucketG = new THREE.Group(); bucketG.visible = false; root.add(bucketG);
  part(new THREE.CylinderGeometry(.15, .11, .22, 16), o.accent, bucketG, 0, -.25);
  part(new THREE.CircleGeometry(.14, 16), '#8fd3f0', bucketG, 0, -.15, 0, false).rotation.x = -Math.PI / 2;
  part(new THREE.TorusGeometry(.145, .012, 4, 16, Math.PI), '#5a4a52', bucketG, 0, -.14, 0, false);
  const blob = new THREE.Mesh(new THREE.CircleGeometry(.34, 20), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = .005; root.add(blob);
  for (const m of vol) m.userData.sy = m.scale.y;
  const drips = Array.from({ length: 5 }, () => { const m = new THREE.Mesh(dripGeo, dripMat); m.visible = false; root.add(m); return { m, v: 0, life: 0 }; });

  // age: kids are small with a bigger head, elders a little shorter and hunched
  const scale = o.age === 'kid' ? .72 : o.age === 'elder' ? .9 : 1;
  root.scale.setScalar(scale);
  const hunch = o.age === 'elder' ? .3 : 0, gait = o.age === 'elder' ? .7 : o.age === 'kid' ? 1.15 : 1; // elders: bent + slow steps, kids: quick

  return { root, body, hips, spine, neck, head, legs, arms, tail, skirtMesh, skirtBase, face, faceKey: '', bucket: bucketG, gun, cane, tools, tool: o.tool ?? tools[0], hang: null, blob, scale, hunch, gait, legK, hipH, skirtHem, longSkirt, opts: o,
    wet: 0, wetShown: false, wetMats, hairVol: vol, drips, bubble: null };
}

const dripGeo = new THREE.SphereGeometry(.022, 6, 4), dripMat = new THREE.MeshBasicMaterial({ color: '#bfeaff' });

// emote bubbles above the head: drop (soaked) | note (dancing) | bang (surprised) | heart (loving it). Drawn, not emoji, so every device matches
const emoteCache = {};
export function emoteTex(kind) {
  if (emoteCache[kind]) return emoteCache[kind];
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#fffaf0'; g.strokeStyle = '#5b3a52'; g.lineWidth = 7;
  g.beginPath(); g.arc(64, 58, 46, 0, 7); g.moveTo(52, 100); g.lineTo(64, 122); g.lineTo(76, 100); g.fill(); g.stroke(); // bubble + tail
  g.fillStyle = '#fffaf0'; g.fillRect(50, 92, 28, 10); // hide the seam between bubble and tail
  if (kind === 'drop') { g.fillStyle = '#3fa7e0'; g.beginPath(); g.moveTo(64, 22); g.quadraticCurveTo(88, 52, 86, 66); g.arc(64, 66, 22, 0, Math.PI); g.quadraticCurveTo(40, 52, 64, 22); g.fill();
    g.fillStyle = '#d8f2ff'; g.beginPath(); g.ellipse(56, 64, 5, 9, -.3, 0, 7); g.fill(); }
  if (kind === 'note') { g.fillStyle = '#e0578a'; g.save(); g.translate(52, 80); g.rotate(-.4); g.beginPath(); g.ellipse(0, 0, 15, 11, 0, 0, 7); g.fill(); g.restore();
    g.fillRect(62, 28, 7, 52); g.beginPath(); g.moveTo(69, 28); g.quadraticCurveTo(92, 38, 86, 60); g.quadraticCurveTo(84, 44, 69, 44); g.fill(); }
  if (kind === 'bang') { g.fillStyle = '#e8862e'; g.beginPath(); g.roundRect(56, 20, 16, 50, 8); g.fill(); g.beginPath(); g.arc(64, 84, 9, 0, 7); g.fill(); }
  if (kind === 'dots') { g.fillStyle = '#5b3a52'; for (const x of [42, 64, 86]) { g.beginPath(); g.arc(x, 60, 8, 0, 7); g.fill(); } } // chatting
  if (kind === 'haha') { g.strokeStyle = '#e0578a'; g.lineWidth = 8; g.lineCap = 'round'; for (const [x, y] of [[48, 44], [80, 44]]) { g.beginPath(); g.arc(x, y + 12, 12, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
    g.fillStyle = '#e0578a'; g.beginPath(); g.arc(64, 70, 18, 0, Math.PI); g.fill(); } // laughing
  if (kind === 'heart') { g.fillStyle = '#e0574f'; g.beginPath(); g.moveTo(64, 88); g.bezierCurveTo(26, 64, 34, 26, 64, 44); g.bezierCurveTo(94, 26, 102, 64, 64, 88); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return emoteCache[kind] = t;
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

// loops: idle | walk | run | dance | sit | eat (seated, spoon to mouth) | vend (low stool, fanning) | squat | ready (chinlone stance)
//        | push (a cart) | carry (a tray at the chest) | cycle (pedalling; the zone moves the bike) | coast (on the saddle, feet still: stopped or parked)
// one-shots: jump | splash (bucket throw) | squirt (water gun) | shake | wave | kadaw | kick (chinlone) | laugh | call (vendor beckon)
//            | sitdown | standup
// anim.chat = 'speak' | 'listen' | null: an upper-body layer over idle / sit / eat / vend for people talking in a group
export const LOOPS = { idle: { f: 0, A: 0, speed: 0 }, walk: { f: 1.7, A: .45, speed: 0 }, run: { f: 2.35, A: .78, speed: 0 }, dance: { f: 0, A: 0, speed: 0 }, sit: { f: 0, A: 0, speed: 0 },
  eat: { f: 0, A: 0, speed: 0 }, vend: { f: 0, A: 0, speed: 0 }, squat: { f: 0, A: 0, speed: 0 }, ready: { f: 0, A: 0, speed: 0 },
  push: { f: 1.45, A: .36, speed: 0 }, carry: { f: 1.5, A: .38, speed: 0 }, cycle: { f: 1.1, A: 0, speed: 0 }, coast: { f: 0, A: 0, speed: 0 } };
const LEG = UP + LO;
for (const k of ['walk', 'run', 'push', 'carry']) LOOPS[k].speed = LEG * LOOPS[k].A * LOOPS[k].f * Math.PI * 2 * .92; // ground speed that keeps the stance foot planted
export const ONESHOT = { jump: .98, splash: .95, squirt: .85, shake: 1.0, wave: 1.5, kadaw: 2.6, kick: .55, laugh: 1.1, call: 1.2, sitdown: .5, standup: .6 };
const STILL = ['kadaw', 'shake', 'splash', 'squirt', 'wave', 'kick', 'laugh', 'call', 'sitdown', 'standup']; // one-shots you can't walk through
const SEATED = ['sit', 'eat', 'vend', 'squat', 'cycle', 'coast'];
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
function sitPose(p, T) {
  const b = Math.sin(T * 1.8);
  p.y = -.2; p.legLx = p.legRx = -1.45; p.kneeL = p.kneeR = 1.45; p.footL = p.footR = 0; p.legLz = .12; p.legRz = -.12;
  p.spineRx = .06 + .01 * b; p.armLx = p.armRx = -.55; p.armLz = .18; p.armRz = -.18; p.elbowL = p.elbowR = -.55; p.headRz = .04 * Math.sin(T * .7);
  return p;
}
const mix = (a, b, w) => { const o = { ...a }; for (const k of KEYS) o[k] = a[k] + (b[k] - a[k]) * w; return o; };

export class ChibiAnimator {
  constructor(ch, emit = () => {}) {
    this.ch = ch; this.emit = emit;
    this.loop = 'idle'; this.one = null; this.oneT = 0; this.T = 0; this.phi = 0; this.freq = 0;
    this.from = base(); this.out = base(); this.blendT = 1;
    this.tailA = 0; this.tailV = 0; this.lastStance = 0; this.seed = Math.random() * 10; this.chat = null;
  }
  _chat(p, sat) { // talking in a group: the speaker's hands go, the others nod along
    const T = this.T + this.seed;
    if (this.chat === 'speak') {
      p.armRx = (sat ? -.75 : -.45) - .35 * (.5 + .5 * Math.sin(T * 2.3)); p.elbowR = -1.0 - .4 * Math.sin(T * 4.1); p.armRz = -.28; p.handRz = .35 * Math.sin(T * 5.3);
      if (Math.sin(T * .9) > .2) { p.armLx = (sat ? -.75 : -.35) - .25 * (.5 + .5 * Math.sin(T * 1.7 + 1)); p.elbowL = -.75; p.armLz = .3; }
      p.headRy = .25 * Math.sin(T * .8); p.headRx = -.06 + .05 * Math.sin(T * 3); p.mouth = (T * 6.5) % 1 < .5 ? 'open' : 'smile';
    } else {
      p.headRx = .14 * Math.max(0, Math.sin(T * 2.6)) ** 2; p.headRz = .06 * Math.sin(T * .7);
      if (!sat) { p.armLx = p.armRx = -.5; p.armLz = -.3; p.armRz = .3; p.elbowL = p.elbowR = -1.45; } // arms folded
    }
  }
  setCharacter(ch) { this.ch = ch; }
  setLoop(name) { if (name === this.loop && !this.one) return; this.loop = name; this.one = null; this._xfade(); }
  play(name) {
    if (name === 'splash' && this.ch.tool === 'gun' && this.ch.gun) name = 'squirt'; // whatever's in your hands
    this.one = name; this.oneT = 0; this._xfade(); this.thrown = false; this.sq = 0;
  }
  setTool(t) { if (this.ch.tools.includes(t)) this.ch.tool = t; }
  skip(dt) { if (this.one && (this.oneT += dt) >= ONESHOT[this.one]) { this.one = null; this._xfade(); } } // off screen: no pose, but one-shots still end (scripts wait on them)
  soak(k = 1) { this.ch.wet = Math.min(1, this.ch.wet + k); this.hitT = .7; } // hit by water: >_< for a moment, then dries over ~10 s
  emote(kind, dur = 1.6) {
    const c = this.ch;
    if (!c.bubble) { c.bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: emoteTex(kind), depthWrite: false })); c.bubble.renderOrder = 10; c.root.add(c.bubble); }
    c.bubble.material.map = emoteTex(kind); c.bubble.visible = true; this.emT = 0; this.emDur = dur;
  }
  get speed() { return STILL.includes(this.one) ? 0 : LOOPS[this.loop].speed * this.ch.scale * this.ch.legK * this.ch.gait; } // ground speed (units/s)
  _xfade() { this.from = { ...this.out }; this.blendT = 0; }

  update(dt) {
    this.T += dt; this.blendT += dt;
    const L = LOOPS[this.loop];
    this.freq += ((L.f || 0) * this.ch.gait - this.freq) * clamp01(dt * 6);
    this.phi += this.freq * Math.PI * 2 * dt;
    let pose = this._loopPose(this.loop);
    const c = this.ch, sat = SEATED.includes(this.loop), walking = ['idle', 'walk', 'run'].includes(this.loop);
    if (c.cane && walking) { pose.armRx = pose.armRx * .3 - .3; pose.armRz = -.1; pose.elbowR = -.5; } // cane hand held forward
    if ((c.tool === 'bucket' || c.hang) && walking) { pose.armLx *= .3; pose.armLz = Math.max(pose.armLz, .3); pose.elbowL = -.06; } // a heavy bucket / basket: arm straight, out from the leg
    if (this.chat && !['walk', 'run', 'push', 'carry', 'cycle'].includes(this.loop)) this._chat(pose, sat);
    if (this.one) {
      this.oneT += dt; const d = ONESHOT[this.one];
      if (this.oneT >= d) { this.one = null; this._xfade(); }
      else pose = this['_' + this.one](pose, this.oneT);
    }
    const w = ease(clamp01(this.blendT / .25));
    for (const k of KEYS) this.out[k] = this.from[k] + (pose[k] - this.from[k]) * w;
    this.out.expr = pose.expr; this.out.mouth = pose.mouth;
    this.hitT = (this.hitT || 0) - dt;
    if (this.loop === 'dance' && !this.ch.bubble?.visible && Math.random() < dt * .2) this.emote('note', 1.4);
    this._apply(this.out, dt);
  }

  _loopPose(name) {
    const p = base(), T = this.T; p.expr = 'normal'; p.mouth = 'smile';
    if (name === 'idle') {
      const b = Math.sin(T * 2.2);
      p.sy = 1 + .012 * b; p.spineRx = .02 * b; p.armLz = .14 + .03 * b; p.armRz = -.14 - .03 * b; p.elbowL = p.elbowR = -.15; p.headRz = .05 * Math.sin(T * .9);
    } else if (name === 'walk' || name === 'run' || name === 'push' || name === 'carry') {
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
        if (this.ch.longSkirt) { p.hold = 1; p.armRx = -.65 + .18 * s; p.armRz = .08; p.elbowR = -.75; } // one hand keeps the longyi hitched, still bobs
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
      if (name === 'push') { p.armLx = p.armRx = -1.2; p.armLz = .14; p.armRz = -.14; p.elbowL = p.elbowR = -.4; p.spineRx = .28; p.headRx = -.12; } // both hands on the cart's handle
      if (name === 'carry') { p.armLx = p.armRx = -.85; p.armLz = -.1; p.armRz = .1; p.elbowL = p.elbowR = -1.15; p.spineRx = -.02; p.headRx = .05; } // a tray held out in front
      p.mouth = run ? 'open' : 'smile';
      const stance = c > 0 ? 1 : -1; // dust on each foot strike while running
      if (run && stance !== this.lastStance) this.emit('dust', this.ch.legs[stance > 0 ? 1 : 0].foot);
      this.lastStance = stance;
    } else if (name === 'sit' || name === 'eat') { // on a tea-shop stool: thighs forward, shins down, hands on the knees, a slow breath
      sitPose(p, T); p.expr = 'normal'; p.mouth = 'smile';
      if (name === 'eat') { // every few seconds: a bite (hand up to the mouth), then chewing
        const u = (T + this.seed) % 3.2, up = ease(clamp01(u / .45)) * (1 - ease(clamp01((u - 1.0) / .5)));
        p.armRx = -.55 - .75 * up; p.elbowR = -.55 - 1.55 * up; p.armRz = -.18 + .32 * up; p.headRx = .12 - .1 * up; p.spineRx = .14;
        p.armLx = -.85; p.elbowL = -.85; p.armLz = .05; // the other hand on the table
        p.mouth = up > .7 || (u > 1 && u < 2.4 && (T * 6) % 1 < .5) ? 'open' : 'smile';
      }
    } else if (name === 'vend') { // on a low market stool: knees up, leaning in, fanning herself, eyes on whoever goes by
      const fan = (T + this.seed) % 7 < 2.4;
      p.y = -.34; p.legLx = p.legRx = -1.25; p.kneeL = p.kneeR = 2.0; p.footL = p.footR = -.6; p.legLz = .2; p.legRz = -.2;
      p.spineRx = .22; p.armLx = p.armRx = -.75; p.armLz = .22; p.armRz = -.22; p.elbowL = p.elbowR = -.35; p.headRy = .45 * Math.sin(T * .35 + this.seed);
      if (fan) { p.armRx = -1.0; p.elbowR = -1.75; p.armRz = .1; p.handRz = .7 * Math.sin(T * 14); p.headRx = -.1; }
    } else if (name === 'squat') { // squatting down: looking over a vendor's tray, scooping water from a basin
      const b = Math.sin(T * 1.6);
      p.y = -.44; p.legLx = p.legRx = -1.55; p.kneeL = p.kneeR = 2.45; p.footL = p.footR = -.85; p.legLz = .28; p.legRz = -.28;
      p.spineRx = .5 + .02 * b; p.headRx = -.25; p.armLx = p.armRx = -.95; p.armLz = .15; p.armRz = -.15; p.elbowL = p.elbowR = -.5 - .15 * b;
    } else if (name === 'ready') { // chinlone: up on the toes, knees soft, arms loose and out, eyes on the ball
      const b = Math.sin(T * 6 + this.seed);
      p.y = -.04 + .02 * b; p.kneeL = p.kneeR = .35; p.legLx = p.legRx = -.18; p.footL = p.footR = -.17; p.legLz = .08; p.legRz = -.08;
      p.spineRx = .14; p.headRx = -.3; p.armLz = .5; p.armRz = -.5; p.armLx = p.armRx = -.2; p.elbowL = p.elbowR = -.35;
    } else if (name === 'cycle' || name === 'coast') { // pedalling: feet go round, hands on the bars, a lean over them (coast: the cranks wind down and stop)
      const f = this.phi, s = Math.sin(f), co = Math.cos(f);
      p.y = 0; p.legLx = -1.05 + .38 * s; p.kneeL = 1.25 - .45 * co; p.legRx = -1.05 - .38 * s; p.kneeR = 1.25 + .45 * co;
      p.footL = -(p.legLx + p.kneeL) * .7; p.footR = -(p.legRx + p.kneeR) * .7; p.legLz = .05; p.legRz = -.05; p.hipsRz = .04 * s;
      p.spineRx = .32; p.headRx = -.22; p.armLx = p.armRx = -1.15; p.armLz = .22; p.armRz = -.22; p.elbowL = p.elbowR = -.35;
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
  _splash(p, t) { // both hands on the bucket in front → swing it back to the side → heave it forward → settle
    const g = ease(clamp01(t / .16)), k1 = clamp01((t - .12) / .26), k2 = clamp01((t - .38) / .14), k3 = clamp01((t - .52) / .38);
    const wind = ease(k1) * (1 - ease(k2)), thr = ease(k2) * (1 - ease(k3) * .75), hold = g * (1 - wind) * (1 - thr);
    p = { ...p, hold: 0 };
    Object.assign(p, {
      spineRy: .55 * wind - .35 * thr, spineRx: .12 * hold - .05 * wind + .3 * thr, hipsRy: .2 * wind - .15 * thr,
      armLx: -.55 * hold + .5 * wind - 1.9 * thr, armRx: -.55 * hold + .5 * wind - 1.9 * thr, armLz: -.3 * g, armRz: .3 * g,
      elbowL: -.5 * hold - .7 * wind - .2 * thr, elbowR: -.5 * hold - .7 * wind - .2 * thr,
      kneeL: .15 * hold + .25 * wind, kneeR: .15 * hold + .35 * wind, legLx: -.1 * wind - .3 * thr, footL: .1 * wind + .3 * thr, legRx: .1 * wind, footR: -.1 * wind,
      expr: thr > .5 ? 'happy' : 'normal', mouth: thr > .3 ? 'open' : 'smile' });
    if (!this.thrown && t > .46) { this.thrown = true; this.emit('splash', this.ch.bucket); }
    return p;
  }
  _squirt(p, t) { // water gun: up to the shoulder, the other hand under it, a thin stream for half a second
    const up = ease(clamp01(t / .14)) * (1 - ease(clamp01((t - .72) / .13)));
    Object.assign(p, { hold: 0, armRx: -1.5 * up + p.armRx * (1 - up), armRz: -.05 * up + p.armRz * (1 - up), elbowR: -.08 * up + p.elbowR * (1 - up),
      armLx: -1.2 * up + p.armLx * (1 - up), armLz: -.45 * up + p.armLz * (1 - up), elbowL: -.65 * up + p.elbowL * (1 - up),
      spineRy: -.12 * up, headRy: -.08 * up, expr: 'happy', mouth: up > .5 ? 'open' : 'smile' });
    const n = Math.floor((Math.min(t, .7) - .14) * 45); if (this.sq === 0 && n > 0) this.emit('squirtStart', this.ch.gun);
    while (this.sq < n) { this.sq++; this.emit('squirt', this.ch.gun); }
    return p;
  }
  _kick(p, t) { // chinlone: inside-of-the-foot kick, the leg swings up and out, arms out for balance, a little hop
    const k = Math.sin(Math.PI * clamp01(t / ONESHOT.kick));
    Object.assign(p, { y: .05 * k, legRx: -.85 * k, legRz: -.7 * k, kneeR: .2 + 1.5 * k, footR: .35 * k, kneeL: .3 + .15 * k, legLx: -.15, footL: -.15,
      spineRz: .22 * k, spineRx: .1, armLz: .7 + .3 * k, armRz: -.7 - .2 * k, elbowL: -.3, elbowR: -.3, headRx: .2 * k, mouth: k > .6 ? 'open' : 'smile' });
    return p;
  }
  _laugh(p, t) { // lean back, shoulders shaking, a hand on the belly
    const e = ease(clamp01(t / .15)) * (1 - ease(clamp01((t - .85) / .25))), b = Math.abs(Math.sin(t * 26));
    Object.assign(p, { spineRx: p.spineRx - .22 * e, headRx: p.headRx - .28 * e, y: p.y + .018 * e * b, sy: p.sy + .02 * e * b,
      armLx: p.armLx + (-.6 - p.armLx) * e, elbowL: p.elbowL + (-1.35 - p.elbowL) * e, armLz: p.armLz + (.05 - p.armLz) * e, expr: 'happy', mouth: 'open' });
    return p;
  }
  _call(p, t) { // a vendor calling you over: arm out, palm-down beckon (the Myanmar way), mouth open
    const up = ease(clamp01(t / .2)) * (1 - ease(clamp01((t - 1.0) / .2)));
    Object.assign(p, { armRx: p.armRx + (-1.35 - p.armRx) * up, armRz: p.armRz + (-.1 - p.armRz) * up, elbowR: p.elbowR + (-.25 - .55 * (.5 + .5 * Math.sin(t * 15)) - p.elbowR) * up,
      handRz: 0, headRx: -.12 * up, expr: 'happy', mouth: 'open' });
    return p;
  }
  _sitdown(p, t) { // p is already the seated pose: come down into it from standing, leaning forward as you go
    const k = ease(clamp01(t / ONESHOT.sitdown)), o = mix(this._loopPose('idle'), p, k);
    o.spineRx += .45 * Math.sin(Math.PI * k); o.armLx += -.4 * Math.sin(Math.PI * k); o.armRx += -.4 * Math.sin(Math.PI * k); return o;
  }
  _standup(p, t) { // p is the standing pose: lean forward, push on the knees, rise
    const k = ease(clamp01(t / ONESHOT.standup)), o = mix(sitPose(base(), this.T), p, k), m = Math.sin(Math.PI * k);
    o.spineRx += .55 * m; o.armLx += -.5 * m; o.armRx += -.5 * m; o.elbowL -= .4 * m; o.elbowR -= .4 * m; return o;
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
    c.body.position.set(p.x, p.y * c.legK, 0); c.body.scale.set(1 / Math.sqrt(p.sy), p.sy, 1 / Math.sqrt(p.sy));
    c.hips.rotation.set(0, p.hipsRy, p.hipsRz); c.spine.rotation.set(p.spineRx + (c.hunch || 0), p.spineRy, p.spineRz);
    c.head.rotation.set(p.headRx - (c.hunch || 0) * .7, p.headRy, p.headRz);
    const throwing = this.one === 'splash';
    if (c.gun) c.gun.visible = c.tool === 'gun' && !throwing;
    if (c.cane) { c.cane.visible = !throwing; c.cane.rotation.x = -(p.armRx + p.elbowR + p.spineRx + c.hunch); }
    const [lL, lR] = c.legs;
    lL.hip.rotation.set(p.legLx, 0, p.legLz); lR.hip.rotation.set(p.legRx, 0, p.legRz);
    lL.knee.rotation.x = p.kneeL; lR.knee.rotation.x = p.kneeR; lL.foot.rotation.x = p.footL; lR.foot.rotation.x = p.footR;
    const [aL, aR] = c.arms;
    aL.sh.rotation.set(p.armLx, 0, p.armLz); aR.sh.rotation.set(p.armRx, 0, p.armRz);
    aL.elbow.rotation.x = p.elbowL; aR.elbow.rotation.x = p.elbowR; aL.hand.rotation.z = p.handLz; aR.hand.rotation.z = p.handRz;
    // face
    const blink = (this.T % 3.7) < .12, eye = this.hitT > 0 ? 'squint' : p.expr !== 'normal' ? p.expr : c.opts.age === 'elder' ? 'happy' : blink ? 'blink' : 'normal'; // elders smile with their eyes
    const key = eye + p.mouth; if (key !== c.faceKey) { c.faceKey = key; c.face.material.map = c.face.material.emissiveMap = faceTex(c.opts, eye, p.mouth); }
    // the bucket hangs from the left hand; while throwing it moves out in front between both hands (never through the body), then tips
    const B = c.bucket; B.visible = c.tool === 'bucket' || throwing;
    if (B.visible || c.hang) {
      const hL = c.root.worldToLocal(c.arms[0].hand.getWorldPosition(_a)).add(_c.set(0, -.02, 0));
      if (c.hang) { c.hang.visible = !throwing; c.hang.position.copy(hL); }
      if (B.visible) {
        let rx = 0;
        if (throwing) {
          const t = this.oneT, hR = c.root.worldToLocal(c.arms[1].hand.getWorldPosition(_b));
          const mid = hR.add(hL).multiplyScalar(.5), out = _c.set(mid.x, 0, mid.z), l = out.length();
          if (l < .05) out.set(0, 0, 1); else out.divideScalar(l);
          mid.addScaledVector(out, .14); hL.lerp(mid, ease(clamp01(t / .16)) * (1 - ease(clamp01((t - .8) / .15))));
          rx = 1.9 * ease(clamp01((t - .42) / .14)) * (1 - ease(clamp01((t - .66) / .25)));
        }
        B.position.copy(hL); B.rotation.set(rx, 0, Math.sin(this.phi) * .08);
      }
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
      const pos = c.skirtMesh.geometry.attributes.position, B = c.skirtBase, top = .1, hem = c.skirtHem, L = (UP + LO) * c.legK;
      const fL = Math.sin(-p.legLx) * L * .9 + Math.sin(-(p.legLx + p.kneeL)) * .05;
      const fR = Math.sin(-p.legRx) * L * .9 + Math.sin(-(p.legRx + p.kneeR)) * .05;
      for (let i = 0; i < pos.count; i++) {
        const x = B[i * 3], y = B[i * 3 + 1], z = B[i * 3 + 2], h = clamp01((top - y) / (top - hem)) ** 1.6;
        const wl = clamp01(.5 + x * 4.5), dz = h * (wl * fL + (1 - wl) * fR) * .8;
        const front = clamp01(z * 5), lift = p.hold * h * front * .16 + h * Math.max(p.kneeL, p.kneeR) * .03;
        pos.setXYZ(i, x * (1 + h * .06 * (Math.abs(fL - fR))), y + lift, z + dz);
      }
      pos.needsUpdate = true; c.skirtMesh.geometry.computeVertexNormals();
    }
    // wet: darker, glossy clothes + hair, flatter spikes/bangs, drips falling off; all back to dry as wet → 0
    if (c.wet > 0 || c.wetShown) {
      const w = c.wet = Math.max(0, c.wet - dt / 10);
      for (const m of c.wetMats) { m.color.copy(m.userData.base).multiplyScalar(1 - .32 * w); m.specular.setScalar((m.userData.spec || 0) + .35 * w); }
      for (const m of c.hairVol) m.scale.y = m.userData.sy * (1 - (m.userData.flat ?? .3) * w);
      for (const d of c.drips) {
        if (d.life <= 0) { if (Math.random() < w * dt * 4) { const a = Math.random() * 6.28; d.m.position.set(Math.cos(a) * .2, .35 + Math.random() * .65, Math.sin(a) * .2); d.v = 0; d.life = 1; d.m.visible = true; } continue; }
        d.v -= 9 * dt; d.m.position.y += d.v * dt; if (d.m.position.y < .02) { d.life = 0; d.m.visible = false; }
      }
      c.wetShown = w > 0 || c.drips.some(d => d.life > 0);
    }
    if (c.bubble?.visible) { // pop in, bob, shrink out
      const t = this.emT += dt, s = .55 * Math.min(1, t / .12) * clamp01((this.emDur - t) / .2) * (1 + .15 * Math.max(0, 1 - t / .25));
      c.bubble.scale.set(s, s, 1); c.bubble.position.y = 1.82 + Math.sin(t * 5) * .025; if (t > this.emDur) c.bubble.visible = false;
    }
  }
}
