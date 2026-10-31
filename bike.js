// bike.js — ဖိုးကျော့် စက်ဘီး (T4): yangon/life.js ရဲ့ bikeFrame ပုံစံ + နောက် rack (item ၁ ခု ဒါမှမဟုတ် ကလေး ၁ ယောက်)
// plain THREE — W helper မလို (life.js က ဒီဖိုင်ကို ပြောင်းသုံးတာ T2/T3)။ Bike faces +x locally, like life.js.
import * as THREE from 'three';

const MATS = {};
const mat = c => MATS[c] ??= new THREE.MeshLambertMaterial({ color: c });

export function makeBike({ color = '#6b7a3a', rack = true } = {}) {
  const g = new THREE.Group();
  const add = (geo, c, x, y, z) => { const m = new THREE.Mesh(geo, mat(c)); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  const wheels = [-.45, .45].map(x => add(new THREE.TorusGeometry(.28, .025, 6, 16), '#2b2730', x, .3, 0));
  const bar = (a, b, c = color, r = .022) => { const m = add(new THREE.CylinderGeometry(r, r, a.distanceTo(b), 5), c, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); return m; };
  const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  const H = V(.35, .78), S = V(-.12, .72), B = V(0, .32), RW = V(-.45, .3), FW = V(.45, .3);
  bar(RW, S); bar(S, H); bar(B, S); bar(B, H); bar(H, FW); bar(RW, B);
  add(new THREE.BoxGeometry(.05, .05, .5), '#2b2730', .38, .9, 0);   // handlebar
  add(new THREE.BoxGeometry(.22, .05, .12), '#3b3040', -.14, .74, 0); // saddle
  add(new THREE.CylinderGeometry(.03, .03, .03, 10), '#cfd5dc', .38, .94, .17); // the bell (ဖိုးကျော့် ဘဲလ်)
  let socket = null;
  if (rack) { // a flat steel carrier over the back wheel, two struts down to the axle
    add(new THREE.BoxGeometry(.44, .03, .24), '#5a5560', -.42, .66, 0);
    for (const z of [-.1, .1]) { bar(V(-.45, .3, z), V(-.6, .65, z), '#5a5560', .012); bar(V(-.45, .3, z), V(-.26, .65, z), '#5a5560', .012); }
    socket = new THREE.Object3D(); socket.position.set(-.42, .68, 0); g.add(socket);
  }
  return {
    g, wheels, rack: socket, seat: V(-.12, .76),
    roll(s) { for (const w of wheels) w.rotation.z -= s / .28; },
  };
}

// a rider on the saddle (pedalling) or a passenger on the rack (feet still), facing the bike's +x — life.js rideOn()
export function seatOn(bike, person, where = 'saddle') {
  const { ch, anim } = person, x = where === 'saddle' ? -.17 : -.42, seatY = where === 'saddle' ? .76 : .7;
  bike.g.add(ch.root); ch.root.position.set(x, seatY - (ch.hipH + .02) * ch.scale, 0); ch.root.rotation.set(0, Math.PI / 2, 0);
  anim.setLoop(where === 'saddle' ? 'cycle' : 'coast');
}
