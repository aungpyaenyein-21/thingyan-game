// sw.js — keeps the Yangon day on the phone so it opens without a connection. Everything the game loads is fetched once
// when this installs, then served from the cache. Bump VERSION with every push that changes a game file: the new
// worker downloads the new set, waits, and pwa.js offers a reload (never mid-play on its own).
const VERSION = 'y15';
const CACHE = 'thingyan-' + VERSION;
const THREE = 'https://cdn.jsdelivr.net/npm/three@0.170.0/';
const CORE = [
  'yangon.html', 'pwa.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon.svg',
  'world.js', 'chibi.js', 'critters.js', 'sound.js', 'palette.js', 'camera.js', 'sky.js', // T2: the orbit camera, the sky, the palette
  'cast.js', 'carry.js', 'bike.js', 'rules.js', // T5: the named cast, carrying (the bowl), Phoe Kyaw's bike, the water-fight rules
  'art/home.glb', 'art/teashop.glb', 'art/stalls.glb', // T2 hero buildings (the town shows code-built stand-ins until these load)
  'fonts/fonts.css', 'fonts/NotoSansMyanmar-myanmar.woff2', 'fonts/NotoSansMyanmar-latin.woff2', 'fonts/NotoSansMyanmar-latin-ext.woff2',
  ...['boot', 'main', 'downtown', 'hud', 'icons', 'life', 'rooms', 'save', 'set', 'wardrobe', 'brew', 'pulley', 'bulbs', 'day', 'story', 'mandat'].map(f => `yangon/${f}.js`),
  'audio/credits.json',
  ...['bell', 'bike', 'crow1', 'crow2', 'crow3', 'crow4', 'crowd', 'dog', 'gecko', 'handbell', 'hit', 'horn', 'night', 'pagoda',
    'sparrow1', 'sparrow2', 'sparrow3', 'sparrow4', 'splash', 'squirt', 'stadium', 'traffic'].map(f => `audio/${f}.mp3`),
  THREE + 'build/three.module.js',
  ...['environments/RoomEnvironment', 'geometries/RoundedBoxGeometry', 'postprocessing/EffectComposer', 'postprocessing/MaskPass',
    'postprocessing/OutputPass', 'postprocessing/Pass', 'postprocessing/RenderPass', 'postprocessing/ShaderPass',
    'postprocessing/UnrealBloomPass', 'shaders/CopyShader', 'shaders/LuminosityHighPassShader', 'shaders/OutputShader',
    'utils/BufferGeometryUtils', 'loaders/GLTFLoader'].map(f => `${THREE}examples/jsm/${f}.js`),
].map(p => new URL(p, self.registration.scope).href);
// same-origin files are known by path (the ?v= busters and ?new/&debug don't matter here), the CDN by full URL
const key = u => (u = new URL(u), u.origin === location.origin ? u.pathname : u.href);
const KEEP = new Set(CORE.map(key));

self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' }))))));

self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('thingyan-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())));

self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || !KEEP.has(key(r.url))) return; // the old Phaser pages, sound-test etc. go straight to the network
  e.respondWith(caches.open(CACHE).then(c => c.match(r, { ignoreSearch: true }).then(hit => hit || fetch(r).then(res => {
    if (res.ok) c.put(r, res.clone());
    return res;
  }))));
});
