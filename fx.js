// fx.js — the water you can see (T3 · TASKS.md T3 §D). Shared: war.js now, the ward (T5/T6) later.
//   particles (three.quarks 0.16): stream (a pump stroke) · burst (a hit / a balloon popping) · sheet (a bucket) · drip (a can running dry)
//     built in code here; fx/<name>.json (made by fx/make.html, tunable in the quarks editor — fx/README.md) replaces them when present
//   decals: wet patches on walls and drums (DecalGeometry, a pool of ≤ 60, dry in 6 s)
//   wet-map: fx.wet(groundMesh) — a canvas the size of the ground; splashes paint it dark, it dries in 20 s
// Budget (Fable, plan review): stream 400 · burst 30/hit · sheet 120 · drip 20 · 2,000 in all; low quality halves them.
import * as THREE from 'three';
import { BatchedRenderer, ParticleSystem, RenderMode, QuarksLoader, QuarksUtil } from 'three.quarks';
import { ConstantValue, IntervalValue, ConstantColor, Vector4, SphereEmitter, ConeEmitter, ApplyForce, SizeOverLife, ColorOverLife, Gradient, PiecewiseBezier, Bezier, Vector3 as QV3 } from 'quarks.core';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';
const PAL = { water: '#3fd3e0', wet: '#2aa7b8', splash: '#cff6fa' }; // docs/PALETTE.md — import from palette.js once T2 (#30) is on main

export const BUDGET = { stream: 400, burst: 30, sheet: 120, drip: 20, total: 2000 };
const POOL = { stream: 6, burst: 10, sheet: 3, drip: 4 }; // instances per effect (several can play at once in different places)
const C = new THREE.Color(PAL.water), S = new THREE.Color(PAL.splash);
let dot = null;
function dotTex() { // a soft round drop
  if (dot) return dot;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.55, 'rgba(255,255,255,.85)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return dot = new THREE.CanvasTexture(c);
}
const v4 = (c, a = 1) => new Vector4(c.r, c.g, c.b, a);
// the four effects, as code (fx/make.html serialises these to fx/*.json)
export function build(name, max) {
  const material = new THREE.MeshBasicMaterial({ map: dotTex(), transparent: true, depthWrite: false, color: 0xffffff });
  const base = { looping: false, worldSpace: true, material, renderMode: RenderMode.BillBoard, renderOrder: 2, maxParticle: max, startColor: new ConstantColor(v4(C)), emissionOverTime: new ConstantValue(0) };
  const burst = n => [{ time: 0, count: new ConstantValue(n), cycle: 1, interval: .01, probability: 1 }];
  let ps;
  if (name === 'stream') ps = new ParticleSystem({ ...base, duration: .3, startLife: new IntervalValue(.45, .7), startSpeed: new IntervalValue(6.5, 8.5), startSize: new IntervalValue(.07, .12),
    shape: new ConeEmitter({ radius: .03, angle: .07, thickness: 1 }), emissionOverTime: new ConstantValue(Math.min(max, 120) / .25) }); // a jet for a quarter second
  else if (name === 'burst') ps = new ParticleSystem({ ...base, duration: .1, startLife: new IntervalValue(.35, .7), startSpeed: new IntervalValue(1.5, 3.6), startSize: new IntervalValue(.05, .11),
    shape: new SphereEmitter({ radius: .12, thickness: 1, arc: Math.PI * 2 }), emissionBursts: burst(Math.min(max, BUDGET.burst)), startColor: new ConstantColor(v4(S)) });
  else if (name === 'sheet') ps = new ParticleSystem({ ...base, duration: .2, startLife: new IntervalValue(.5, .85), startSpeed: new IntervalValue(3, 5.2), startSize: new IntervalValue(.08, .16),
    shape: new ConeEmitter({ radius: .25, angle: .75, thickness: 1 }), emissionBursts: burst(max) });
  else ps = new ParticleSystem({ ...base, duration: .1, startLife: new IntervalValue(.4, .6), startSpeed: new IntervalValue(.1, .5), startSize: new IntervalValue(.04, .07),
    shape: new SphereEmitter({ radius: .03, thickness: 1, arc: Math.PI * 2 }), emissionBursts: burst(Math.min(max, 4)) });
  ps.addBehavior(new ApplyForce(new QV3(0, -1, 0), new ConstantValue(name === 'drip' ? 9.8 : 11)));
  ps.addBehavior(new SizeOverLife(new PiecewiseBezier([[new Bezier(1, .95, .7, .2), 0]])));
  ps.addBehavior(new ColorOverLife(new Gradient([[new THREE.Vector3(1, 1, 1), 0], [new THREE.Vector3(1, 1, 1), 1]], [[1, 0], [.9, .6], [0, 1]])));
  ps.emitter.name = 'fx-' + name;
  return ps;
}

export function createFx(W, { low = false, json = true } = {}) {
  const { scene } = W, batch = new BatchedRenderer(); scene.add(W.keep ? W.keep(batch) : batch);
  const pools = {}, next = {}, source = {}, k = () => (low ? .5 : 1);
  const tmpQ = new THREE.Quaternion(), Z = new THREE.Vector3(0, 0, 1);
  function fill(name, make) {
    for (const ps of pools[name] ?? []) { batch.deleteSystem(ps); ps.emitter.removeFromParent(); }
    pools[name] = []; next[name] = 0;
    for (let i = 0; i < POOL[name]; i++) { const ps = make(i); batch.addSystem(ps); scene.add(ps.emitter); pools[name].push(ps); }
  }
  for (const n of Object.keys(POOL)) fill(n, () => build(n, Math.floor(BUDGET[n] * k() / (n === 'burst' ? 1 : POOL[n] / 2))));
  // the creator's tuned versions, if fx/*.json exist (same names); quarks' own loader
  if (json) for (const n of Object.keys(POOL)) fetch(new URL(`./fx/${n}.json`, import.meta.url)).then(r => r.ok ? r.json() : null).then(j => {
    if (!j) return; const loader = new QuarksLoader();
    fill(n, () => { const o = loader.parse(j); let ps = null; o.traverse(c => { if (c.system) ps = c.system; }); return ps ?? build(n, BUDGET[n]); }); source[n] = 'json';
  }).catch(() => {});

  // ---------- particles ----------
  function play(name, p, dir = null) {
    const list = pools[name]; if (!list?.length || count() > BUDGET.total * k()) return; // the global cap
    const ps = list[next[name]++ % list.length], e = ps.emitter;
    e.position.copy(p); if (dir) e.quaternion.copy(tmpQ.setFromUnitVectors(Z, dir.clone().normalize())); e.updateMatrixWorld(true);
    ps.restart(); ps.play();
  }
  const count = () => { let n = 0; for (const l of Object.values(pools)) for (const ps of l) n += ps.particleNum ?? 0; return n; };

  // ---------- decals: wet patches on walls and drums ----------
  const decalMat = new THREE.MeshLambertMaterial({ color: PAL.wet, transparent: true, opacity: .55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
  const decals = [], DMAX = 60, eul = new THREE.Euler(), size = new THREE.Vector3();
  function decal(mesh, p, n, r = .35) {
    if (low || !mesh) return;
    const look = new THREE.Object3D(); look.position.copy(p); look.lookAt(p.clone().add(n)); eul.copy(look.rotation); eul.z = Math.random() * 6.28;
    let m;
    try { m = new THREE.Mesh(new DecalGeometry(mesh, p, eul, size.set(r * 2, r * 2, r * 2)), decalMat.clone()); } catch { return; }
    scene.add(m); decals.push({ m, t: 6 });
    while (decals.length > DMAX) { const d = decals.shift(); d.m.geometry.dispose(); d.m.removeFromParent(); }
  }

  // ---------- wet-map: the ground darkens where water lands, dries in 20 s ----------
  const grounds = [];
  function wet(ground, { size: S2 = 512 } = {}) { // attach to a ground mesh (its own material: kept out of world.js bake)
    if (low) return null;
    ground.geometry.computeBoundingBox(); const bb = ground.geometry.boundingBox.clone().applyMatrix4(ground.matrixWorld);
    const c = document.createElement('canvas'); c.width = c.height = S2; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, S2, S2);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.NoColorSpace;
    const rect = new THREE.Vector4(bb.min.x, bb.min.z, bb.max.x - bb.min.x, bb.max.z - bb.min.z), tint = new THREE.Color(PAL.wet);
    const mat = ground.material; mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, { wetMap: { value: tex }, wetRect: { value: rect }, wetTint: { value: tint } });
      sh.vertexShader = 'varying vec2 vWetXZ;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vWetXZ = (modelMatrix * vec4(transformed, 1.)).xz;');
      sh.fragmentShader = 'uniform sampler2D wetMap; uniform vec4 wetRect; uniform vec3 wetTint; varying vec2 vWetXZ;\n' + sh.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\n float wetK = texture2D(wetMap, (vWetXZ - wetRect.xy) / wetRect.zw).r; diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * .55 + wetTint * .18, wetK * .85);');
    };
    mat.needsUpdate = true;
    const gr = { g, tex, rect, S: S2, dry: 0 }; grounds.push(gr); return gr;
  }
  function splat(x, z, r = .6) { // paint water on every wet-mapped ground under this spot
    for (const gr of grounds) {
      const u = (x - gr.rect.x) / gr.rect.z * gr.S, v = (z - gr.rect.y) / gr.rect.w * gr.S, rr = r / gr.rect.z * gr.S; if (u < -rr || v < -rr || u > gr.S + rr || v > gr.S + rr) continue;
      const rg = gr.g.createRadialGradient(u, v, rr * .2, u, v, rr); rg.addColorStop(0, 'rgba(255,255,255,.9)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); gr.g.fillStyle = rg; gr.g.fillRect(u - rr, v - rr, rr * 2, rr * 2);
      gr.tex.needsUpdate = true;
    }
  }

  function update(dt) {
    batch.update(dt);
    for (let i = decals.length - 1; i >= 0; i--) { const d = decals[i]; d.t -= dt; d.m.material.opacity = .55 * Math.min(1, d.t / 2); if (d.t <= 0) { d.m.geometry.dispose(); d.m.removeFromParent(); decals.splice(i, 1); } }
    for (const gr of grounds) { gr.dry += dt; if (gr.dry > .5) { gr.g.fillStyle = `rgba(0,0,0,${(gr.dry / 20).toFixed(3)})`; gr.g.fillRect(0, 0, gr.S, gr.S); gr.dry = 0; gr.tex.needsUpdate = true; } } // dries out over ~20 s
  }
  return {
    play, decal, wet, splat, update, count, budget: BUDGET, source,
    stream: (p, dir) => play('stream', p, dir), burst: p => play('burst', p), sheet: (p, dir) => play('sheet', p, dir), drip: p => play('drip', p),
    set low(v) { low = v; }, get low() { return low; },
  };
}
