// sky.js — ကောင်းကင် + မိုးကုပ်စက်ဝိုင်း (T2) · ကင်မရာ လှည့်လည်း မှန် (camlab T1 ပုံစံ)
// createSky:      sky dome shader (world.js ရဲ့ SKY / NIGHT stop ၄ ခု အတိုင်း) · ကမ္ဘာ ပုံသေ နေ (dusk အလိုက် နိမ့်/နီ) · ညမှာ ကြယ်
//                 · paintSky (zone ရဲ့ 2D skyline — ရွှေတိဂုံ) ကို panorama canvas ပေါ် ဆွဲပြီး horizon မှာ cylinder band
// createSurround: ကျွန်း အပြင် — မြေ (dust) · ဆက်သွားတဲ့ လမ်း · အဆောက်အအုံ အနိမ့် silhouette (InstancedMesh ၁ ခု) · fog နဲ့ ပျောက်
import * as THREE from 'three';
import { PAL } from './palette.js?v=1';

export const SKY = [['#ffd9a8', '#3d3470'], ['#f9b8a0', '#7a4f92'], ['#d9a3c0', '#d97a7a'], ['#b39bd1', '#f2a65a']]; // [afternoon, dusk] per stop, zenith → horizon
export const STOPS = [0, .45, .8, 1];
const NIGHT = PAL.night;
const C = c => new THREE.Color(c);
const mixC = (a, b, t) => C(a).lerp(C(b), t);

export function createSky(scene, { paintSky = null, sunBearing = new THREE.Vector3(-14, 0, 6), bandBearing = Math.PI / 2, R = 150 } = {}) {
  const g = new THREE.Group(); g.name = 'sky'; scene.add(g);
  const sunH = sunBearing.clone().setY(0).normalize(), sunDir = new THREE.Vector3();
  const uniforms = { c0: { value: C(SKY[0][0]) }, c1: { value: C(SKY[1][0]) }, c2: { value: C(SKY[2][0]) }, c3: { value: C(SKY[3][0]) },
    sun: { value: sunDir }, sunCol: { value: C('#fff5da') }, sunA: { value: 1 } };
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms,
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform vec3 c0, c1, c2, c3, sun, sunCol; uniform float sunA; varying vec3 vDir;
      void main(){
        float t = 1. - clamp(vDir.y / .55, 0., 1.);                 // 0 high up … 1 at the horizon (and below)
        vec3 c = t < .45 ? mix(c0, c1, t / .45) : t < .8 ? mix(c1, c2, (t - .45) / .35) : mix(c2, c3, (t - .8) / .2);
        float d = dot(vDir, sun);
        c = mix(c, sunCol, (smoothstep(.9975, .9985, d) * .95 + pow(max(d, 0.), 24.) * .45) * sunA); // the disc + a soft glow round it
        gl_FragColor = vec4(c, 1.);
        #include <colorspace_fragment>
      }`, // → sRGB when drawn straight to the screen (camlab); left linear into the game's composer (OutputPass converts)
  }));
  dome.renderOrder = -3; g.add(dome);

  // stars: a fixed scatter over the upper sky, fading in after dusk
  const N = 220, sp = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const a = Math.sin(i * 91.7) * 3.1416 + i, e = .08 + Math.abs(Math.sin(i * 47.3)) * 1.35; const r = R * .9; sp.set([Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r], i * 3); }
  const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(sp, 3)),
    new THREE.PointsMaterial({ color: '#fffaeb', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false }));
  stars.renderOrder = -2; g.add(stars);

  // the zone's own 2D sky art (skyline, the Shwedagon on its hill) on a band round the horizon, facing bandBearing
  let band = null, bandC = null, bandDusk = -1;
  if (paintSky) {
    bandC = document.createElement('canvas'); bandC.width = 2048; bandC.height = 512;
    const tex = new THREE.CanvasTexture(bandC); tex.colorSpace = THREE.SRGBColorSpace;
    // the canvas was a full-screen sky (512 tall): stretched over ~20° up from the horizon it reads as far off, about the old size
    const H = R * .42, L = (bandC.width / bandC.height) * H / (R * .97);
    band = new THREE.Mesh(new THREE.CylinderGeometry(R * .97, R * .97, H, 96, 1, true, bandBearing - L / 2, L), // centred on bandBearing
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.BackSide, depthWrite: false, fog: false }));
    tex.wrapS = THREE.RepeatWrapping; tex.repeat.x = -1; // seen from inside: un-mirror
    band.position.y = H * .4; band.renderOrder = -1; g.add(band); // paintSky's base line (90% down the canvas) sits on the horizon
  }
  function paintBand(dusk) {
    if (!band || Math.abs(dusk - bandDusk) < .04) return; bandDusk = dusk;
    const gc = bandC.getContext('2d'), W = bandC.width; gc.clearRect(0, 0, W, bandC.height);
    gc.save(); gc.translate(W / 2 - Math.max(W * .1, 70), 0); paintSky(gc, W, bandC.height, dusk); gc.restore(); // set.js draws its centrepiece at max(W·.1, 70): move it to the middle band.material.map.needsUpdate = true;
  }

  let horizon = C(SKY[3][0]);
  function setTime(dusk, night) {
    [uniforms.c0, uniforms.c1, uniforms.c2, uniforms.c3].forEach((u, i) => u.value.copy(mixC(SKY[i][0], SKY[i][1], dusk).lerp(C(NIGHT[i]), night)));
    horizon = uniforms.c3.value;
    const el = THREE.MathUtils.lerp(.32, .02, dusk) - night * .4; // the sun sinks with dusk and is gone at night
    sunDir.copy(sunH).multiplyScalar(Math.cos(el)).setY(Math.sin(el)).normalize();
    uniforms.sunCol.value.copy(mixC('#fff5da', '#ffb07a', dusk)); uniforms.sunA.value = (1 - dusk * .35) * (1 - night);
    stars.material.opacity = Math.max(0, night - .25) * 1.2;
    paintBand(dusk);
    if (band) band.material.opacity = 1 - night * .7;
  }
  setTime(0, 0);
  return { group: g, setTime, follow(p) { g.position.copy(p); }, get horizon() { return horizon; }, set visible(v) { g.visible = v; } };
}

// outside the island: so turning the camera never shows the edge of the world
// rects: [{ x0, x1, z0, z1, c }] ground strips that carry on outside (a street running off the map) · avoid: same, kept clear of buildings
export function createSurround(scene, bounds, { rects = [], seed = 7, reach = 34 } = {}) {
  const g = new THREE.Group(); g.name = 'surround'; scene.add(g);
  const lam = c => new THREE.MeshLambertMaterial({ color: c });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), lam(PAL.dust)); ground.rotation.x = -Math.PI / 2; ground.position.y = -.03; ground.receiveShadow = true; g.add(ground);
  for (const r of rects) { const m = new THREE.Mesh(new THREE.BoxGeometry(r.x1 - r.x0, .04, r.z1 - r.z0), lam(r.c)); m.position.set((r.x0 + r.x1) / 2, -.01, (r.z0 + r.z1) / 2); m.receiveShadow = true; g.add(m); }
  // low town all round: plain blocks in the five wall colours, taller the further out (so the near ring doesn't wall you in)
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const walls = [PAL.cream, PAL.mint, PAL.pink, PAL.ochre, PAL.teal], spots = [], pad = 2.5;
  const inRect = (x, z, r, m = 1.2) => x > r.x0 - m && x < r.x1 + m && z > r.z0 - m && z < r.z1 + m;
  for (let k = 0; k < 900 && spots.length < 190; k++) {
    const x = bounds.x0 - reach + rnd() * (bounds.x1 - bounds.x0 + reach * 2), z = bounds.z0 - reach + rnd() * (bounds.z1 - bounds.z0 + reach * 2);
    const out = Math.max(bounds.x0 - x, x - bounds.x1, bounds.z0 - z, z - bounds.z1); // how far outside the island
    if (out < pad || rects.some(r => inRect(x, z, r)) || spots.some(p => Math.abs(p.x - x) < 3.6 && Math.abs(p.z - z) < 3.6)) continue;
    spots.push({ x, z, w: 2.8 + rnd() * 2.6, d: 2.8 + rnd() * 2.6, h: 1.6 + rnd() * 2.5 + Math.min(out, 24) * .22 });
  }
  const town = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, .5, 0), new THREE.MeshLambertMaterial({ flatShading: true }), spots.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  spots.forEach((p, i) => { town.setMatrixAt(i, m4.compose(new THREE.Vector3(p.x, -.03, p.z), q, new THREE.Vector3(p.w, p.h, p.d))); town.setColorAt(i, C(walls[i % walls.length])); });
  town.castShadow = false; town.receiveShadow = true; g.add(town);
  return { group: g, count: spots.length };
}
