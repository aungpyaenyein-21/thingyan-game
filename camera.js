// camera.js — Go-Go Town! ပုံစံ ကင်မရာ (T1 camlab မှာ စမ်းပြီး · T2 မှာ ဂိမ်းအစစ်နဲ့ ခွဲသုံး)
// perspective · target ကို lag နဲ့ လိုက် · ၄၅° snap လှည့် (smooth) · zoom 5–24 · နီးရင် နိမ့်ပြီး ကောင်းကင် မြင်၊ ဝေးရင် အပေါ်က
// ရွေ့တာကို `forward()` / `right()` နဲ့ — snap tween အတွင်း *ပြနေတဲ့* az ကို သုံးလို့ လှည့်နေတုန်း ကစားသူ ဘေးမလွဲ
import * as THREE from 'three';

const clamp = THREE.MathUtils.clamp;
export const STEP = Math.PI / 4;
export const elevDefault = d => .22 + .63 * Math.pow(clamp((d - 5) / 19, 0, 1), .8); // close in = low and level (sky shows), far out = looking down

export function createOrbit(cam, { dist = 11, min = 5, max = 24, lag = 3.2, az = 0, elevAt = elevDefault } = {}) {
  const s = { az, azGoal: az, drag: 0, dist, distGoal: dist, target: new THREE.Vector3(), locked: false, min, max };
  const place = () => {
    const el = elevAt(s.dist), c = Math.cos(el) * s.dist;
    cam.position.set(s.target.x + Math.sin(s.az) * c, s.target.y + Math.sin(el) * s.dist, s.target.z + Math.cos(s.az) * c);
    cam.lookAt(s.target);
  };
  return {
    state: s,
    get az() { return s.az; },
    rotate(dir) { if (!s.locked) s.azGoal += dir * STEP; },
    drag(px) { if (!s.locked) s.drag = -px * .006; },                         // the view follows the finger …
    release() { s.azGoal = Math.round((s.azGoal + s.drag) / STEP) * STEP; s.drag = 0; }, // … and snaps to the nearest 45° on release
    zoom(k) { s.distGoal = clamp(s.distGoal * k, s.min, s.max); },
    setDist(d) { s.distGoal = clamp(d, s.min, s.max); },
    lock(a = null) { s.locked = a !== null; if (s.locked) { s.az = s.azGoal = a; s.drag = 0; } }, // a room: fixed angle
    snap(focus) { if (focus) s.target.copy(focus); s.az = s.azGoal + s.drag; s.dist = s.distGoal; place(); },
    update(dt, focus) {
      s.target.lerp(focus, 1 - Math.exp(-dt * lag));
      s.az += (s.azGoal + s.drag - s.az) * (1 - Math.exp(-dt * 9));
      s.dist += (s.distGoal - s.dist) * (1 - Math.exp(-dt * 8));
      place();
    },
    // ground-plane directions from the angle on screen right now (input y = away from the camera)
    forward(v = new THREE.Vector3()) { return v.set(-Math.sin(s.az), 0, -Math.cos(s.az)); },
    right(v = new THREE.Vector3()) { return v.set(Math.cos(s.az), 0, -Math.sin(s.az)); },
  };
}
