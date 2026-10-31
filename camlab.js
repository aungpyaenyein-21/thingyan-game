// camlab — Go-Go Town! ပုံစံ ကင်မရာ + Rapier + three-pathfinding + glTF စမ်းကွင်း (T1)
// ဂိမ်းအစစ် (world.js / yangon/*) ကို မထိ။ ဒီဖိုင် တစ်ခုတည်းမှာ အကုန်။
import * as THREE from 'three';
import { Pathfinding } from 'three-pathfinding';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { makeCast } from './cast.js?v=9';

const $ = id => document.getElementById(id);
const MM = n => String(n).replace(/\d/g, d => '၀၁၂၃၄၅၆၇၈၉'[d]); // Burmese digits for the UI
const status = (t) => { $('status').textContent = t; };
const T0 = performance.now(), timings = {};

// ---------------------------------------------------------------- the field (one source for meshes, colliders and the navmesh)
const HALF = 20;                        // ground is 40 × 40
const CREEK = 1.5, BED_Y = -.9, WATER_Y = -.4, FLOW = .7; // creek runs along x (west → east, +x), half-width 1.5
const BRIDGE = { hx: 1, hz: 2.4, rail: .95, railTop: .55 };
// bamboo poles across mid-creek (SCENARIO ၄-၅): gaps (.4 − 2r = .28) are narrower than the bowl (.3), so a bowl drifting down
// the middle catches; one near a bank slips past and keeps going
const POLE_X = 6, POLE_R = .06, POLES = [-.35, .05, .45, .85].map(z => ({ x: POLE_X + z * .15, z }));
const BLD = [ // x, z, w (x), d (z), h, colour
  [-8, -6, 4, 3, 3.2, '#f2b8a0'], [-2.5, -9.5, 3, 3, 4.6, '#bcd6c8'], [7, -6, 3.5, 3.5, 2.8, '#f6d98a'], [12.5, -12, 4, 4, 5.2, '#c9b8e0'],
  [-7, 6, 3.5, 3, 3, '#a8d0e6'], [9, 7.5, 4, 3, 3.8, '#f2c4d4'], [-13, 12, 4, 4, 4.2, '#d8c6a8'], [-1.5, 13, 3, 2.5, 2.6, '#cfe3a6'],
].map(([x, z, w, d, h, c]) => ({ x, z, w, d, h, c }));
const SHOP = { x: 4.5, z: 8.5, w: 3.2 + .7, d: 3 + 1.2, h: 3.4, rotY: Math.PI }; // the glTF shop (front faces the creek); w/d include eaves + awning

// ---------------------------------------------------------------- renderer, scene, sky
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
const HORIZON = new THREE.Color('#ffd9b0');
scene.fog = new THREE.Fog(HORIZON, 32, 75);
const cam = new THREE.PerspectiveCamera(40, 1, .1, 200);

// sun direction is fixed in the world: rotating the camera moves the sun across the screen with everything else.
// The disc sits lower than the light (same compass bearing) so it shows in close-up views without making the shadows endless.
const SUN = new THREE.Vector3(-.32, .1, -.95).normalize(), LIGHT = new THREE.Vector3(-.32, .62, -.95).normalize();
const sky = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { sun: { value: SUN }, top: { value: new THREE.Color('#7fa8dc') }, mid: { value: HORIZON }, low: { value: new THREE.Color('#f6b9a2') }, glow: { value: new THREE.Color('#ffe3a8') } },
  vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
  fragmentShader: `uniform vec3 sun, top, mid, low, glow; varying vec3 vDir;
    void main(){ float y = vDir.y; vec3 c = y > 0. ? mix(mid, top, pow(y, .55)) : mix(mid, low, min(1., -y * 4.));
      float s = max(dot(vDir, sun), 0.); c = mix(c, glow, pow(s, 6.) * .75); gl_FragColor = vec4(c, 1.); }`,
}));
sky.renderOrder = -1; scene.add(sky);
const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(3.2, 32), new THREE.MeshBasicMaterial({ color: '#fff4d6', fog: false, depthWrite: false }));
sunDisc.renderOrder = -1; scene.add(sunDisc);

scene.add(new THREE.HemisphereLight('#ffe9cf', '#a88fb8', 1.5));
const sun = new THREE.DirectionalLight('#ffc78a', 2.3); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 60 }); sun.shadow.bias = -.0008;
scene.add(sun, sun.target);

// ---------------------------------------------------------------- meshes
const lam = c => new THREE.MeshLambertMaterial({ color: c });
const boxMesh = (w, h, d, c, x, y, z, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c === 'string' ? lam(c) : c); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
const slabD = HALF - CREEK;
const groundN = boxMesh(HALF * 2, 1, slabD, '#e6c9a8', 0, -.5, -(CREEK + slabD / 2));
const groundS = boxMesh(HALF * 2, 1, slabD, '#e6c9a8', 0, -.5, CREEK + slabD / 2);
boxMesh(HALF * 2, .3, CREEK * 2, '#8a6a4a', 0, BED_Y - .15, 0); // creek bed
for (const s of [-1, 1]) boxMesh(HALF * 2, .06, .25, '#c9a57e', 0, .03, s * (CREEK + .125)); // a kerb along each bank
// water: a scrolling stripe texture shows which way it flows
const wc = document.createElement('canvas'); wc.width = 128; wc.height = 32; { const g = wc.getContext('2d'); g.fillStyle = '#5aa6c8'; g.fillRect(0, 0, 128, 32); g.fillStyle = 'rgba(255,255,255,.28)'; for (let i = 0; i < 6; i++) g.fillRect(i * 22 + (i % 2) * 7, 6 + (i * 9) % 20, 12, 2); }
const waterTex = new THREE.CanvasTexture(wc); waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping; waterTex.repeat.set(12, 1); waterTex.colorSpace = THREE.SRGBColorSpace;
const water = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, CREEK * 2), new THREE.MeshLambertMaterial({ map: waterTex, transparent: true, opacity: .82, depthWrite: false }));
water.rotation.x = -Math.PI / 2; water.position.y = WATER_Y; water.receiveShadow = true; scene.add(water);
// bridge: deck flush with the ground, balusters + a flat hand rail (the bowl sits on it in ၄-၃)
const deck = boxMesh(BRIDGE.hx * 2, .12, BRIDGE.hz * 2, '#a8754a', 0, -.06, 0);
for (const s of [-1, 1]) {
  boxMesh(.16, .06, BRIDGE.hz * 2, '#c98b55', s * BRIDGE.rail, BRIDGE.railTop - .03, 0);
  for (let z = -BRIDGE.hz + .1; z <= BRIDGE.hz; z += .4) boxMesh(.07, BRIDGE.railTop - .06, .07, '#8a5a3a', s * BRIDGE.rail, (BRIDGE.railTop - .06) / 2, z);
}
for (const [i, q] of POLES.entries()) { const h = 1.4 + (i % 2) * .25, m = new THREE.Mesh(new THREE.CylinderGeometry(POLE_R, POLE_R, h, 10), lam('#9fae5a')); m.position.set(q.x, BED_Y + h / 2, q.z); m.rotation.z = (i - 1.5) * .04; m.castShadow = true; scene.add(m); }

// buildings: each one fades on its own when it hides the player
const fadeables = []; // { meshes, mats, fade, goal }
function addFadeable(obj) {
  const meshes = [], mats = [];
  obj.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); meshes.push(o); mats.push(o.material); o.castShadow = o.receiveShadow = true; } });
  const f = { obj, meshes, mats, fade: 1, goal: 1 }; fadeables.push(f); for (const m of meshes) m.userData.fadeable = f; return f;
}
for (const b of BLD) {
  const g = new THREE.Group(); g.position.set(b.x, 0, b.z);
  boxMesh(b.w, b.h, b.d, b.c, 0, b.h / 2, 0, g);
  boxMesh(b.w + .3, .18, b.d + .3, '#b8463a', 0, b.h + .09, 0, g); // flat roof lip
  for (let y = 1.1; y < b.h - .4; y += 1.3) boxMesh(b.w * .6, .55, .04, '#4a3428', 0, y, -b.d / 2 - .02, g), boxMesh(b.w * .6, .55, .04, '#4a3428', 0, y, b.d / 2 + .02, g); // windows
  scene.add(g); addFadeable(g);
}

// ---------------------------------------------------------------- characters
const noEmit = () => {};
const player = makeCast('hero', noEmit);
const npcs = [['ngazwe', '#2f8fd6'], ['chocho', '#f08a3c'], ['maythu', '#7e57c2']].map(([id, col], i) => ({ ...makeCast(id, noEmit), col, path: null, i }));
const people = [player, ...npcs];
for (const p of people) { p.ch.root.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(p.ch.root); }
player.ch.root.position.set(0, 0, 4.5); player.ch.root.rotation.y = Math.PI;
npcs.forEach((n, i) => { n.ch.root.position.set(-3.2 + i * 1.2, 0, 6.2 + (i % 2) * .5); n.ch.root.rotation.y = Math.PI; });

// ---------------------------------------------------------------- the silver bowl (mesh; the physics body comes later)
const bowlGeo = new THREE.LatheGeometry([[0, -.045], [.1, -.045], [.135, -.02], [.15, .04], [.155, .045], [.14, .045], [.125, -.005], [0, -.02]].map(([x, y]) => new THREE.Vector2(x, y)), 28);
const bowl = new THREE.Mesh(bowlGeo, new THREE.MeshPhongMaterial({ color: '#dfe5ea', specular: '#ffffff', shininess: 110, side: THREE.DoubleSide }));
bowl.castShadow = true;
const HOLD = new THREE.Vector3(0, .5, .26); // in the player's hands, chest-high (player local space, before chibi scale)
function holdBowl() { player.ch.root.add(bowl); bowl.position.copy(HOLD); bowl.quaternion.identity(); }
holdBowl();

// ---------------------------------------------------------------- navmesh (three-pathfinding): a 0.5 grid, minus buildings and the creek, plus the bridge lane
const CELL = .5, MARGIN = .35;
const blocked = [...BLD.map(b => [b.x, b.z, b.w / 2 + MARGIN, b.d / 2 + MARGIN]), [SHOP.x, SHOP.z, SHOP.w / 2 + MARGIN, SHOP.d / 2 + MARGIN]];
function walkable(x, z) {
  if (Math.abs(x) > HALF - .4 || Math.abs(z) > HALF - .4) return false;
  if (Math.abs(z) < CREEK + .25 && !(Math.abs(x) < .7 && Math.abs(z) < BRIDGE.hz)) return false; // creek + bank kerb; the bridge lane keeps clear of the rails
  return !blocked.some(([bx, bz, hx, hz]) => Math.abs(x - bx) < hx && Math.abs(z - bz) < hz);
}
function buildNavGeometry() {
  const n = Math.round((HALF * 2 - 1) / CELL), x0 = -HALF + .5, pos = [], idx = [], vmap = new Map();
  const v = (i, j) => { const k = i * 1000 + j; if (!vmap.has(k)) { vmap.set(k, pos.length / 3); pos.push(x0 + i * CELL, 0, x0 + j * CELL); } return vmap.get(k); };
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (!walkable(x0 + (i + .5) * CELL, x0 + (j + .5) * CELL)) continue;
    const a = v(i, j), b = v(i + 1, j), c = v(i + 1, j + 1), d = v(i, j + 1);
    idx.push(a, d, c, a, c, b); // counter-clockwise seen from above (+y normal); the other winding breaks the funnel (zig-zag paths)
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); return geo;
}
let t = performance.now();
const navGeo = buildNavGeometry();
const pf = new Pathfinding(), ZONE = 'lab';
pf.setZoneData(ZONE, Pathfinding.createZone(navGeo, .02));
timings.navmesh = Math.round(performance.now() - t);
const navView = new THREE.Mesh(navGeo, new THREE.MeshBasicMaterial({ color: '#3aa36a', transparent: true, opacity: .28, depthWrite: false, wireframe: false }));
navView.position.y = .02; navView.visible = false; scene.add(navView);
const navWire = new THREE.LineSegments(new THREE.WireframeGeometry(navGeo), new THREE.LineBasicMaterial({ color: '#2a7a4a', transparent: true, opacity: .35 }));
navWire.position.y = .025; navWire.visible = false; scene.add(navWire);
const GROUP = pf.getGroup(ZONE, player.ch.root.position);
let playerNode = pf.getClosestNode(player.ch.root.position, ZONE, GROUP);

// ---------------------------------------------------------------- glTF shop (Blender → art/shop.glb)
const shopReady = new GLTFLoader().loadAsync('./art/shop.glb').then(gltf => {
  const s = gltf.scene; s.position.set(SHOP.x, 0, SHOP.z); s.rotation.y = SHOP.rotY;
  // Blender exports PBR (MeshStandardMaterial); with no environment map it renders darker than the Lambert world around it → swap
  s.traverse(o => { if (o.isMesh && o.material.isMeshStandardMaterial) { const m = o.material; o.material = new THREE.MeshLambertMaterial({ color: m.color, map: m.map, side: m.side }); m.dispose(); } });
  scene.add(s); addFadeable(s);
  timings.glb = Math.round(performance.now() - T0); return s;
}).catch(e => { status('shop.glb မဖွင့်နိုင် — ' + e.message); throw e; });

// ---------------------------------------------------------------- camera: follows with lag, 45° snaps, zoom, see-through buildings
const STEP = Math.PI / 4;
const elevAt = d => .22 + .63 * Math.pow(THREE.MathUtils.clamp((d - 5) / 19, 0, 1), .8); // close in = low and level (sky shows), far out = looking down
const camS = { az: 0, azGoal: 0, drag: 0, dist: 11, distGoal: 11, target: new THREE.Vector3().copy(player.ch.root.position) };
const _v = new THREE.Vector3(), _w = new THREE.Vector3();
function placeCamera(dt) {
  const k = 1 - Math.exp(-dt * 3.2); // follow lag
  _v.copy(player.ch.root.position); _v.y += .55 + Math.max(0, jump.y) * .5; camS.target.lerp(_v, k);
  camS.az += (camS.azGoal + camS.drag - camS.az) * (1 - Math.exp(-dt * 9)); // smooth tween to the snapped angle
  camS.dist += (camS.distGoal - camS.dist) * (1 - Math.exp(-dt * 8));
  const el = elevAt(camS.dist), c = Math.cos(el) * camS.dist;
  cam.position.set(camS.target.x + Math.sin(camS.az) * c, camS.target.y + Math.sin(el) * camS.dist, camS.target.z + Math.cos(camS.az) * c);
  cam.lookAt(camS.target);
  sky.position.copy(cam.position);
  sunDisc.position.copy(cam.position).addScaledVector(SUN, 80); sunDisc.lookAt(cam.position);
  sun.position.copy(camS.target).addScaledVector(LIGHT, 25); sun.target.position.copy(camS.target);
}
const rotate = dir => { camS.azGoal += dir * STEP; };
const zoomBy = f => { camS.distGoal = THREE.MathUtils.clamp(camS.distGoal * f, 5, 24); };

const ray = new THREE.Raycaster(), fadeTargets = fadeables.flatMap(f => f.meshes);
function updateFades(dt) {
  for (const f of fadeables) f.goal = 1;
  const p = player.ch.root.position;
  for (const h of [.25, .75]) { // a ray to the feet and one to the head: if either is hidden, fade what's in the way
    _w.set(p.x, p.y + h, p.z); _v.subVectors(_w, cam.position); const d = _v.length();
    ray.set(cam.position, _v.normalize()); ray.far = d - .2;
    for (const hit of ray.intersectObjects(fadeTargets, false)) hit.object.userData.fadeable.goal = .25;
  }
  for (const f of fadeables) {
    const was = f.fade; f.fade += (f.goal - f.fade) * (1 - Math.exp(-dt * 10));
    if (Math.abs(was - f.fade) < 1e-4 && f.fade > .999) continue;
    const see = f.fade < .995;
    for (const m of f.mats) { if (m.transparent !== see) { m.transparent = see; m.depthWrite = !see; m.needsUpdate = true; } m.opacity = f.fade; }
  }
}
shopReady.then(() => { fadeTargets.length = 0; fadeTargets.push(...fadeables.flatMap(f => f.meshes)); });

// ---------------------------------------------------------------- input: keyboard, joystick, drag-to-rotate, pinch / wheel zoom, tap-to-send
const keys = new Set();
addEventListener('keydown', e => { keys.add(e.code); if (e.code === 'KeyQ') rotate(-1); if (e.code === 'KeyE') rotate(1); if (e.code === 'Space') doJump(); if (e.code === 'KeyF') throwBowl(); });
addEventListener('keyup', e => keys.delete(e.code));
const joy = { x: 0, y: 0, id: null };
{
  const base = $('joy'), knob = $('knob');
  const set = e => { const r = base.getBoundingClientRect(), R = r.width / 2; let dx = e.clientX - r.left - R, dy = e.clientY - r.top - R; const l = Math.hypot(dx, dy); if (l > R) { dx *= R / l; dy *= R / l; } joy.x = dx / R; joy.y = -dy / R; knob.style.transform = `translate(${dx}px,${dy}px)`; };
  base.addEventListener('pointerdown', e => { joy.id = e.pointerId; base.setPointerCapture(e.pointerId); set(e); });
  base.addEventListener('pointermove', e => { if (e.pointerId === joy.id) set(e); });
  const end = e => { if (e.pointerId !== joy.id) return; joy.id = null; joy.x = joy.y = 0; knob.style.transform = ''; };
  base.addEventListener('pointerup', end); base.addEventListener('pointercancel', end);
}
const ptrs = new Map(); let gesture = null;
const cv = renderer.domElement;
cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now() });
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; gesture = { pinch: true, span: Math.hypot(a.x - b.x, a.y - b.y), dist: camS.distGoal }; camS.drag = 0; }
  else gesture = { pinch: false, moved: false };
});
cv.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId); if (!p) return; p.x = e.clientX; p.y = e.clientY;
  if (!gesture) return;
  if (gesture.pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const s = Math.hypot(a.x - b.x, a.y - b.y); camS.distGoal = THREE.MathUtils.clamp(gesture.dist * gesture.span / Math.max(20, s), 5, 24); return; }
  const dx = p.x - p.x0; if (Math.abs(dx) > 8) gesture.moved = true;
  if (gesture.moved) camS.drag = -dx * .006; // the view follows the finger, then snaps on release
});
const endPtr = e => {
  const p = ptrs.get(e.pointerId); if (!p) return; ptrs.delete(e.pointerId);
  if (gesture && !gesture.pinch) {
    if (gesture.moved) { camS.azGoal = Math.round((camS.azGoal + camS.drag) / STEP) * STEP; camS.drag = 0; }
    else if (performance.now() - p.t < 400 && e.type === 'pointerup') tapAt(e.clientX, e.clientY);
  }
  if (ptrs.size === 0) gesture = null;
};
cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);
cv.addEventListener('wheel', e => { e.preventDefault(); zoomBy(Math.exp(e.deltaY * .0012)); }, { passive: false });

// ---------------------------------------------------------------- moving the player (camera-relative, kept on the navmesh with clampStep)
const jump = { y: 0, vy: 0 };
function doJump() { if (jump.y > 0) return; jump.vy = 3.4; player.anim.play('jump'); }
const _dir = new THREE.Vector3(), _to = new THREE.Vector3(), _out = new THREE.Vector3();
function movePlayer(dt) {
  let ix = joy.x, iy = joy.y;
  if (keys.has('KeyW') || keys.has('ArrowUp')) iy += 1; if (keys.has('KeyS') || keys.has('ArrowDown')) iy -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1; if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
  const mag = Math.min(1, Math.hypot(ix, iy)), r = player.ch.root, a = player.anim;
  const az = camS.az; // forward = away from the camera, on the ground
  _dir.set(Math.cos(az) * ix - Math.sin(az) * iy, 0, -Math.sin(az) * ix - Math.cos(az) * iy);
  if (mag > .12) {
    const loop = mag > .65 || keys.has('ShiftLeft') ? 'run' : 'walk'; if (a.loop !== loop && !a.one) a.setLoop(loop);
    _dir.normalize(); turnToward(r, Math.atan2(_dir.x, _dir.z), dt);
    _to.copy(r.position).addScaledVector(_dir, a.speed * dt); _to.y = 0;
    const from = _out.copy(r.position); from.y = 0;
    playerNode = pf.clampStep(from, _to, playerNode, ZONE, GROUP, r.position) || playerNode;
  } else if (a.loop !== 'idle' && !a.one) a.setLoop('idle');
  // the hop
  if (jump.y > 0 || jump.vy > 0) { jump.vy -= 9.8 * dt; jump.y = Math.max(0, jump.y + jump.vy * dt); if (jump.y === 0) jump.vy = 0; }
  r.position.y = jump.y;
}
function turnToward(r, ang, dt) { let d = ang - r.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); r.rotation.y += d * (1 - Math.exp(-dt * 12)); }

// ---------------------------------------------------------------- NPCs: tap a spot, the three walk there around buildings and over the bridge
const groundHits = [groundN, groundS, deck];
const tapRing = new THREE.Mesh(new THREE.RingGeometry(.28, .4, 28), new THREE.MeshBasicMaterial({ color: '#fff6ea', transparent: true, depthWrite: false }));
tapRing.rotation.x = -Math.PI / 2; tapRing.visible = false; scene.add(tapRing);
let tapT = 0;
const _ndc = new THREE.Vector2();
function tapAt(cx, cy) {
  _ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(_ndc, cam); ray.far = 200;
  const hit = ray.intersectObjects(groundHits, false)[0]; if (!hit) return;
  sendNpcs(hit.point);
}
function sendNpcs(point) {
  const goal = point.clone(); goal.y = 0;
  if (!walkable(goal.x, goal.z)) { const n = pf.getClosestNode(goal, ZONE, GROUP); if (n) goal.copy(n.centroid); goal.y = 0; }
  tapRing.position.set(goal.x, .03, goal.z); tapRing.visible = true; tapT = 1.2;
  let longest = 0;
  for (const n of npcs) {
    const a = n.i * 2.1, t = goal.clone().add(new THREE.Vector3(Math.cos(a) * .55, 0, Math.sin(a) * .55)); // stand around the spot, not on top of each other
    if (!walkable(t.x, t.z)) t.copy(goal);
    const from = n.ch.root.position.clone(); from.y = 0;
    const path = smooth(from, pf.findPath(from, t, ZONE, GROUP));
    n.path = path && path.length ? path : null; n.run = from.distanceTo(t) > 7;
    drawPath(n, from); if (n.path) longest = Math.max(longest, n.path.length);
  }
  status(`ကလေး ၃ ယောက် လာနေ — လမ်းချိုး ${MM(longest)} ခု`);
}
// three-pathfinding's A* uses distance² as its heuristic (AStar.js), so it runs greedy: straight at the goal until the creek,
// then along the bank. Cut those corners afterwards: from each point jump to the farthest later point in plain sight.
const clear = (a, b) => { const d = Math.hypot(b.x - a.x, b.z - a.z), n = Math.ceil(d / .15); for (let k = 1; k < n; k++) { const t = k / n; if (!walkable(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false; } return true; };
function smooth(from, path) {
  if (!path || !path.length) return path;
  const pts = [from, ...path], out = []; let i = 0;
  while (i < pts.length - 1) { let j = pts.length - 1; while (j > i + 1 && !clear(pts[i], pts[j])) j--; out.push(pts[j]); i = j; }
  return out;
}
function drawPath(n, from) {
  if (n.line) { scene.remove(n.line); n.line.geometry.dispose(); n.line = null; }
  if (!n.path) return;
  const pts = [from, ...n.path].map(p => new THREE.Vector3(p.x, .06, p.z));
  n.line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: n.col, dashSize: .25, gapSize: .15 }));
  n.line.computeLineDistances(); scene.add(n.line);
}
function moveNpcs(dt) {
  for (const n of npcs) {
    const r = n.ch.root, a = n.anim;
    if (!n.path) { if (a.loop !== 'idle' && !a.one) a.setLoop('idle'); continue; }
    const loop = n.run ? 'run' : 'walk'; if (a.loop !== loop && !a.one) a.setLoop(loop);
    const goal = n.path[0]; _dir.set(goal.x - r.position.x, 0, goal.z - r.position.z); const d = _dir.length(), s = a.speed * dt;
    if (d > 1e-3) turnToward(r, Math.atan2(_dir.x, _dir.z), dt);
    if (d <= s) { r.position.x = goal.x; r.position.z = goal.z; n.path.shift(); if (!n.path.length) { n.path = null; if (n.line) n.line.visible = false; a.setLoop('idle'); } }
    else r.position.addScaledVector(_dir, s / d);
  }
}

// ---------------------------------------------------------------- Rapier (loaded after the scene is up: it's the heavy one)
let R = null, world = null, events = null, bowlBody = null;
const balloons = new Map(); // collider handle → { body, mesh }
const splats = [];
let bowlState = { inWater: false, msg: '', stuckT: 0 };
const FIXED = 1 / 60; let acc = 0;
async function initPhysics() {
  status('Rapier ဖွင့်နေ…');
  const t0 = performance.now();
  R = (await import('@dimforge/rapier3d-compat')).default;
  await R.init();
  timings.rapier = Math.round(performance.now() - t0);
  world = new R.World({ x: 0, y: -9.81, z: 0 }); world.timestep = FIXED;
  events = new R.EventQueue(true);
  const fixed = (hx, hy, hz, x, y, z) => world.createCollider(R.ColliderDesc.cuboid(hx, hy, hz).setTranslation(x, y, z).setFriction(.8));
  fixed(HALF, .5, slabD / 2, 0, -.5, -(CREEK + slabD / 2)); fixed(HALF, .5, slabD / 2, 0, -.5, CREEK + slabD / 2); // ground
  fixed(HALF, .15, CREEK, 0, BED_Y - .15, 0);                                    // creek bed
  fixed(.1, .6, CREEK, HALF - .4, BED_Y + .6, 0);                                // grate at the creek's end
  fixed(BRIDGE.hx, .06, BRIDGE.hz, 0, -.06, 0);                                  // deck
  for (const s of [-1, 1]) { fixed(.08, .03, BRIDGE.hz, s * BRIDGE.rail, BRIDGE.railTop - .03, 0); fixed(.035, (BRIDGE.railTop - .06) / 2, BRIDGE.hz, s * BRIDGE.rail, (BRIDGE.railTop - .06) / 2, 0); } // hand rail + balusters
  for (const q of POLES) world.createCollider(R.ColliderDesc.cylinder(.75, POLE_R).setTranslation(q.x, BED_Y + .75, q.z));
  for (const b of BLD) fixed(b.w / 2, b.h / 2, b.d / 2, b.x, b.h / 2, b.z);
  fixed(3.2 / 2, SHOP.h / 2, 3 / 2, SHOP.x, SHOP.h / 2, SHOP.z);
  status('အဆင်သင့် — ဖလား ပစ် / ရေပူဖောင်း စမ်းပါ');
}
const physicsReady = initPhysics();

function makeBowlBody(pos, vel, spin) {
  if (bowlBody) world.removeRigidBody(bowlBody);
  bowlBody = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(pos.x, pos.y, pos.z).setLinvel(vel.x, vel.y, vel.z).setAngvel(spin).setCcdEnabled(true).setAngularDamping(.4));
  world.createCollider(R.ColliderDesc.cylinder(.045, .15).setDensity(1).setRestitution(.4).setFriction(.6), bowlBody);
  scene.attach(bowl); bowlState = { inWater: false, msg: '', stuckT: 0, t: 0 };
}
let throwT = -1;
function throwBowl() {
  if (!world || bowl.parent !== player.ch.root || throwT >= 0) return;
  player.anim.play('splash'); throwT = 0; // the release happens partway through the swing (see tick)
}
function releaseBowl() {
  const r = player.ch.root, f = new THREE.Vector3(Math.sin(r.rotation.y), 0, Math.cos(r.rotation.y));
  const p = bowl.getWorldPosition(new THREE.Vector3()); p.y = Math.max(p.y, .5);
  makeBowlBody(p, f.multiplyScalar(3.4).add(new THREE.Vector3(0, 3.2, 0)), { x: 2 * Math.random() - 1, y: 6, z: 2 * Math.random() - 1 });
  status('ဖလား လွင့်…');
}
function bowlOnRail() { // SCENARIO ၄-၃: ဦးတင်မောင် puts the bowl on the hand rail
  if (!world) return;
  makeBowlBody({ x: BRIDGE.rail, y: BRIDGE.railTop + .05, z: .3 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
  status('ဖလား လက်ရန်းပေါ် — ရေပူဖောင်း ချကြည့်');
}
function bowlBack() { if (bowlBody) { world.removeRigidBody(bowlBody); bowlBody = null; } holdBowl(); status('ဖလား လက်ထဲ ပြန်ရ'); }

const balloonGeo = new THREE.SphereGeometry(.09, 14, 10), BCOL = ['#4fb3d9', '#f06292', '#ffc83d', '#8bd17c', '#ff7f6b'];
function dropBalloons(n = 10) {
  if (!world) return;
  const bp = bowlBody?.translation(), onRail = bp && Math.abs(Math.abs(bp.x) - BRIDGE.rail) < .3 && bp.y > .4;
  const c = onRail ? new THREE.Vector3(bp.x, 0, bp.z) : player.ch.root.position.clone();
  for (let i = 0; i < n; i++) {
    let p, v;
    if (onRail) { // ၄-၄: thrown from either bank ("nobody knows whose") at the rail, a bit off target
      const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 2, T = .55 + Math.random() * .25, aim = { x: bp.x + (Math.random() - .5) * .7, y: bp.y + Math.random() * .25, z: bp.z + (Math.random() - .5) * .7 };
      p = { x: aim.x + Math.cos(a) * r, y: 1.1, z: aim.z + Math.sin(a) * r };
      v = { x: (aim.x - p.x) / T, y: (aim.y - p.y) / T + 4.9 * T, z: (aim.z - p.z) / T };
    } else { // a rain of balloons around the player
      p = { x: c.x + (Math.random() - .5) * 1.6, y: 2.6 + Math.random() * 1.6, z: c.z + (Math.random() - .5) * 1.6 };
      v = { x: (Math.random() - .5) * 3, y: -1, z: (Math.random() - .5) * 3 };
    }
    const body = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(p.x, p.y, p.z).setLinvel(v.x, v.y, v.z).setCcdEnabled(true));
    const col = world.createCollider(R.ColliderDesc.ball(.09).setDensity(1).setActiveEvents(R.ActiveEvents.COLLISION_EVENTS), body);
    const mesh = new THREE.Mesh(balloonGeo, new THREE.MeshLambertMaterial({ color: BCOL[i % BCOL.length] })); mesh.castShadow = true; scene.add(mesh);
    balloons.set(col.handle, { body, mesh, age: 0 });
  }
  STATS.balloons += n;
}
function burst(b, handle) {
  const p = b.body.translation(), wet = p.y < WATER_Y + .1 && Math.abs(p.z) < CREEK;
  const y = wet ? WATER_Y + .01 : Math.max(.012, p.y - .07);
  const d = new THREE.Mesh(wet ? new THREE.RingGeometry(.12, .2, 20) : new THREE.CircleGeometry(.2, 20), new THREE.MeshBasicMaterial({ color: '#8fd3ee', transparent: true, opacity: .75, depthWrite: false }));
  d.rotation.x = -Math.PI / 2; d.position.set(p.x, y, p.z); scene.add(d); splats.push({ m: d, life: 2, ring: wet });
  for (const c of people) if (c.ch.root.position.distanceTo(new THREE.Vector3(p.x, 0, p.z)) < .8) { c.anim.soak(.5); c.anim.emote('drop', 1); }
  scene.remove(b.mesh); world.removeRigidBody(b.body); balloons.delete(handle);
}

// the creek pushes: buoyancy + drag + a current toward +x; where it lands is what SCENARIO ၄-၄/၄-၅ needs
function waterForces() {
  if (!bowlBody) return;
  bowlBody.resetForces(true);
  const p = bowlBody.translation(), v = bowlBody.linvel(), m = bowlBody.mass();
  if (Math.abs(p.z) > CREEK || p.y > WATER_Y + .05) { bowlBody.setLinearDamping(0); return; }
  const sub = THREE.MathUtils.clamp((WATER_Y + .05 - p.y) / .12, 0, 1);
  bowlBody.addForce({ x: m * (FLOW - v.x) * 2.2 * sub, y: m * 9.81 * 1.35 * sub - m * v.y * 3 * sub, z: m * (-v.z) * 1.5 * sub }, true);
  bowlBody.setAngularDamping(3);
}
function zoneName(p) {
  const across = Math.abs(p.z) > .9 ? (p.z < 0 ? 'မြောက်ကမ်းနား' : 'တောင်ကမ်းနား') : 'ချောင်းလယ်';
  const along = p.x < -BRIDGE.hx ? 'တံတား အထက်ဘက်' : p.x > BRIDGE.hx ? 'တံတား အောက်ဘက်' : 'တံတားအောက်';
  return `${across} · ${along}`;
}
function watchBowl(dt) {
  if (!bowlBody) return;
  const p = bowlBody.translation(), v = bowlBody.linvel(), sp = Math.hypot(v.x, v.y, v.z);
  bowlState.t += dt;
  const inCreek = Math.abs(p.z) < CREEK && p.y < WATER_Y + .05;
  if (inCreek && !bowlState.inWater) { bowlState.inWater = true; bowlState.first = zoneName(p); STATS.inCreek++; }
  let msg;
  if (bowlState.inWater) {
    const nearPole = POLES.some(q => Math.hypot(p.x - q.x, p.z - q.z) < .3);
    bowlState.stuckT = nearPole && Math.abs(v.x) < .12 ? bowlState.stuckT + dt : 0;
    if (p.x > HALF - 1.2) msg = `ဖလား ရေစီးနဲ့ ပါသွား — ချောင်းအဆုံး (${bowlState.first} က ကျ)`;
    else if (bowlState.stuckT > .8) msg = `ဖလား ဝါးတိုင်မှာ ငြိနေ! (${bowlState.first} က ကျ)`;
    else { const now = zoneName(p); msg = `ဖလား ချောင်းထဲ ကျ — ${bowlState.first}` + (now !== bowlState.first ? ` · အခု ${now}` : ''); }
  } else if (sp < .05 && bowlState.t > .5) {
    msg = Math.abs(p.x - BRIDGE.rail) < .2 || Math.abs(p.x + BRIDGE.rail) < .2 ? (p.y > .4 ? 'ဖလား လက်ရန်းပေါ်' : 'ဖလား တံတားပေါ် ကျ') : Math.abs(p.x) < BRIDGE.hx && Math.abs(p.z) < BRIDGE.hz ? 'ဖလား တံတားပေါ် ကျ' : 'ဖလား မြေပေါ် ကျ — ချောင်းထဲ မရောက်';
  }
  if (msg && msg !== bowlState.shown) { bowlState.shown = msg; bowlState.msg = msg; status(msg); }
  // mirror the body onto the mesh
  const q = bowlBody.rotation(); bowl.position.set(p.x, p.y, p.z); bowl.quaternion.set(q.x, q.y, q.z, q.w);
}

function stepPhysics(dt) {
  if (!world) return;
  acc = Math.min(acc + dt, FIXED * 4);
  while (acc >= FIXED) {
    waterForces(); world.step(events); acc -= FIXED;
    events.drainCollisionEvents((h1, h2, started) => { if (!started) return; for (const h of [h1, h2]) { const b = balloons.get(h); if (b) burst(b, h); } });
    for (const [h, b] of balloons) if (b.body.translation().y < WATER_Y || (b.age += FIXED) > 6) burst(b, h);
  }
  for (const b of balloons.values()) { const p = b.body.translation(); b.mesh.position.set(p.x, p.y, p.z); }
}

// ---------------------------------------------------------------- UI
const STATS = { balloons: 0, inCreek: 0 };
const btn = (id, fn) => $(id).addEventListener('click', fn);
btn('rotL', () => rotate(-1)); btn('rotR', () => rotate(1));
btn('throw', throwBowl); btn('hop', doJump); btn('rail', bowlOnRail); btn('back', bowlBack); btn('drop', () => dropBalloons(10));
btn('nav', function () { navView.visible = navWire.visible = !navView.visible; this.classList.toggle('on', navView.visible); });
btn('zin', () => zoomBy(.8)); btn('zout', () => zoomBy(1.25));
if (matchMedia('(pointer: coarse)').matches) $('joy').hidden = false;
$('joy').hidden = $('joy').hidden && !new URLSearchParams(location.search).has('joy');

function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h); cam.aspect = w / h; cam.fov = w < 600 ? 52 : 40; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

// ---------------------------------------------------------------- loop
const clock = new THREE.Clock(); let fpsN = 0, fpsT0 = performance.now(), fps = 0;
let tickMs = 0;
function simulate(dt) {
  movePlayer(dt); moveNpcs(dt);
  if (throwT >= 0 && (throwT += dt) > .42) { throwT = -1; releaseBowl(); }
  stepPhysics(dt); watchBowl(dt);
  for (const p of people) p.anim.update(dt);
  waterTex.offset.x -= FLOW * dt / (HALF * 2) * 12;
  for (let i = splats.length - 1; i >= 0; i--) { const s = splats[i]; s.life -= dt; s.m.material.opacity = .75 * Math.min(1, s.life); s.m.scale.setScalar(1 + (2 - s.life) * (s.ring ? 1.6 : .25)); if (s.life <= 0) { scene.remove(s.m); splats.splice(i, 1); } }
  if (tapT > 0) { tapT -= dt; tapRing.material.opacity = Math.min(1, tapT); tapRing.visible = tapT > 0; }
  placeCamera(dt);
}
function tick() {
  const t0 = performance.now(), dt = Math.min(clock.getDelta(), 1 / 20);
  simulate(dt); updateFades(dt);
  renderer.render(scene, cam);
  tickMs += (performance.now() - t0 - tickMs) * .05; // CPU time per frame (JS + draw submission), smoothed
  fpsN++; const now = performance.now(); if (now - fpsT0 >= 500) { fps = Math.round(fpsN * 1000 / (now - fpsT0)); fpsN = 0; fpsT0 = now; $('fps').textContent = `${fps} fps · ${renderer.info.render.calls} draw · ${(renderer.info.render.triangles / 1000).toFixed(0)}k △`; } // wall-clock, not the capped dt
}
renderer.setAnimationLoop(tick);

// handle for automated checks (screenshots) and the console
window.lab = {
  camS, player, npcs, timings, STATS, get fps() { return fps; }, get tickMs() { return tickMs; }, get info() { return { calls: renderer.info.render.calls, tris: renderer.info.render.triangles }; }, get bowlMsg() { return bowlState.msg; }, physicsReady, shopReady,
  fades: () => fadeables.map(f => +f.fade.toFixed(2)),
  advance: (sec, step = 1 / 30) => { for (let t = 0; t < sec; t += step) simulate(step); }, // run the world without drawing (headless checks)
  rotate, zoomBy, throwBowl, bowlOnRail, bowlBack, dropBalloons, sendNpcs: (x, z) => sendNpcs(new THREE.Vector3(x, 0, z)),
  place: (x, z, ry) => { const r = player.ch.root; r.position.set(x, 0, z); r.rotation.y = ry; playerNode = pf.getClosestNode(r.position, ZONE, GROUP); camS.target.set(x, .55, z); },
  snap: () => { camS.az = camS.azGoal; camS.dist = camS.distGoal; camS.target.copy(player.ch.root.position).setY(.55); },
  showNav: on => { navView.visible = navWire.visible = on; },
  get bowlPos() { return bowlBody ? bowlBody.translation() : null; },
};
