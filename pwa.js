// pwa.js — the app side of yangon.html: registers sw.js (offline), offers "add to phone", and when a new version has
// downloaded, offers a reload instead of swapping files under a running game. Off on localhost (tests) unless ?sw.
const $ = id => document.getElementById(id);
const P = new URLSearchParams(location.search);
const local = /^(localhost|127\.)/.test(location.hostname);
const app = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone;
const stop = e => e.stopPropagation(); // the canvas behind treats any press as a walk

if ('serviceWorker' in navigator && (!local || P.has('sw'))) {
  let asked = false;
  const offer = w => {
    const b = $('upd'); b.hidden = false;
    b.onpointerdown = stop;
    b.onclick = e => { stop(e); asked = true; b.textContent = '⏳ …'; w.postMessage('skip'); };
  };
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (asked) location.reload(); });
  navigator.serviceWorker.register('./sw.js').then(reg => {
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w); });
    });
  }).catch(() => {});
  navigator.storage?.persist?.().catch(() => {}); // ask the browser not to clear the save and the cache when space runs low
}

// Android / desktop Chrome hand us the install prompt; iPhone has none, so the button there explains Share → Add to Home Screen
const inst = $('inst');
inst.onpointerdown = stop;
let ask = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); ask = e; if (!app) inst.hidden = false; });
addEventListener('appinstalled', () => { inst.hidden = true; ask = null; });
const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) && !app;
if (ios) inst.hidden = false;
inst.onclick = e => {
  stop(e);
  if (ask) { ask.prompt(); ask.userChoice.finally(() => { ask = null; inst.hidden = true; }); }
  else if (ios && inst.dataset.tip) inst.hidden = true; // second tap: got it
  else if (ios) { inst.dataset.tip = 1; inst.textContent = 'Safari ⬆ မျှဝေ → “Add to Home Screen”'; }
};
