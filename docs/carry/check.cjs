const { chromium } = require('playwright');
// carry-lab.html ကို headless Chromium (Playwright) နဲ့ စစ်ပြီး docs/carry/*.jpg ထုတ်
// run: python3 -m http.server 8790 (repo root) → node docs/carry/check.cjs · lab.advance() = render မလုပ်ဘဲ ကမ္ဘာ ရှေ့တိုး (GPU မရှိရင် frame နှေးလို့)
const path = require('path'), S = path.join(__dirname, '/');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1000, height: 700 } });
  const logs = []; p.on('console', m => { if (m.type() !== 'log') logs.push(`[${m.type()}] ${m.text()}`); }); p.on('pageerror', e => logs.push('[pageerror] ' + e.message));
  await p.goto('http://localhost:8790/carry-lab.html'); await p.waitForFunction(() => window.carry, null, { timeout: 60000 });
  const ev = (f, a) => p.evaluate(f, a), shot = async n => { await ev(() => carry.pause(true)); await p.waitForTimeout(400); await p.screenshot({ path: S + n + '.jpg', type: 'jpeg', quality: 75 }); await ev(() => carry.pause(false)); }; // paused: the frame shows the state the script set up
  const st = () => ev(() => ({ held: carry.player.item?.kind ?? null, items: carry.items.map(i => i.kind + ':' + i.state).join(' '), msg: document.getElementById('msg').textContent, acts: carry.actions().join() }));
  const view = (az, el, d) => ev(([az, el, d]) => { Object.assign(carry.CAM, { az, el, dist: d }); carry.CAM.target.copy(carry.hero.ch.root.getWorldPosition(carry.CAM.target)).setY(.5); }, [az, el, d]);
  // 0. the three carry poses (hand / front / head)
  for (const k of ['purse', 'bowl', 'bucket']) {
    await ev(k => { carry.pick(k); carry.advance(1); }, k); await view(Math.PI - .7, .32, 3.2); await shot('pose-' + k);
    await ev(() => { carry.drop(); carry.advance(1); });
  }
  // 1. place on the shelf
  await ev(() => { carry.pick('basket'); carry.advance(1); carry.goTo(-4, -2.55, Math.PI); });
  console.log('at shelf', await st());
  await ev(() => { carry.place(); carry.advance(1); }); console.log('placed', await st());
  await view(Math.PI * .15, .45, 5); await shot('place-shelf');
  // 2. give to Maythu, then ask back
  await ev(() => { carry.pick('bowl'); carry.advance(1); carry.goTo(-1.6, -3.7, Math.PI); });
  console.log('near maythu', await st());
  await ev(() => { carry.give(); carry.advance(.35); }); await view(-1.2, .35, 3.4); await shot('give');
  await ev(() => carry.advance(1)); console.log('given', await st(), await ev(() => carry.maythu.item?.kind));
  await ev(() => { carry.maythu.give(carry.player); carry.advance(1); }); console.log('asked back', await st());
  await ev(() => { carry.drop(); carry.advance(1); });
  // 3. throw the balloon (bigthrow)
  await ev(() => { carry.pick('balloon'); carry.advance(1); carry.throw(); carry.advance(.3); }); await view(2.1, .3, 3.4); await shot('throw');
  await ev(() => carry.advance(1.5)); console.log('thrown', await st());
  // 4. hit: bucket on the head, 3 hits
  await ev(() => { carry.pick('bucket'); carry.advance(1); });
  for (let i = 1; i <= 3; i++) { await ev(() => { carry.hit(); carry.advance(.15); }); if (i === 2) { await view(Math.PI - .7, .32, 3.4); await shot('hit-wobble'); } console.log('hit', i, await st()); }
  await ev(() => carry.advance(.25)); await shot('hit-fall');
  await ev(() => carry.advance(1)); console.log('after fall', await st());
  // front: 5 hits
  await ev(() => { carry.pick('bowl'); carry.advance(1); }); for (let i = 1; i <= 5; i++) await ev(() => { carry.hit(); carry.advance(.1); }); await ev(() => carry.advance(1)); console.log('bowl after 5', await st());
  // hand: never
  await ev(() => { carry.pick('purse'); carry.advance(1); }); for (let i = 1; i <= 6; i++) await ev(() => { carry.hit(); carry.advance(.1); }); console.log('purse after 6', await st());
  await ev(() => { carry.drop(); carry.advance(1); });
  // 5. ice
  await ev(() => { carry.pick('ice'); carry.advance(1); carry.goTo(carry.hero.ch.root.position.x, carry.hero.ch.root.position.z, Math.PI); });
  await ev(() => carry.advance(30)); await view(Math.PI - .7, .32, 3.4); await shot('ice-melt');
  console.log('ice', await ev(() => [carry.items.find(i => i.kind === 'ice')?.life?.toFixed(1), carry.player.item?.kind, carry.hero.ch.gait.toFixed(3), carry.player.canJump]));
  await ev(() => carry.advance(61)); console.log('ice gone', await st());
  // 6. bike: bowl on the rack, ride; then Phoe Kyaw on the rack
  await ev(() => { carry.pick('bowl'); carry.advance(1); const b = carry.bike.g.position; carry.goTo(b.x - .4, b.z + .7, Math.PI); });
  console.log('near bike', await st());
  await ev(() => { carry.place(); carry.advance(1); }); console.log('rack', await ev(() => carry.rack.item?.kind));
  await ev(() => { carry.ride(); }); console.log('riding acts', await ev(() => carry.actions().join()));
  await p.keyboard.down('KeyD'); await ev(() => carry.advance(1.5)); await p.keyboard.up('KeyD');
  await view(-.5, .4, 5); await shot('bike-rack-item');
  await ev(() => { carry.rackHit(); carry.rackHit(); carry.advance(.1); }); console.log('rack 2 hits', await ev(() => [carry.rack.item?.kind, carry.rack.item?.hits]));
  await ev(() => { carry.rackHit(); carry.advance(1); }); console.log('rack 3 hits', await ev(() => [carry.rack.item?.kind ?? null]), (await st()).msg);
  await ev(() => { const b = carry.bike.g.position; carry.pk.person.ch.root.position.set(b.x + .5, 0, b.z + 1); carry.pkOn(); });
  await p.keyboard.down('KeyW'); await ev(() => carry.advance(1.2)); await p.keyboard.up('KeyW');
  await view(-.9, .38, 5); await shot('bike-rack-kid');
  console.log('kid on rack', await ev(() => [!!carry.rack.rider, carry.rideState.speed.toFixed(2), carry.hero.anim.loop, carry.pk.person.anim.loop]));
  // 7. ④ kids throwing at the player (live, a few seconds)
  await ev(() => { carry.pkOff(); carry.off(); carry.goTo(3, 3, -Math.PI / 2); carry.pick('bucket'); carry.advance(1); carry.throwers(true); });
  await ev(() => carry.advance(12)); console.log('under fire', await st());
  await p.setViewportSize({ width: 375, height: 740 }); await ev(() => { carry.throwers(false); carry.CAM.dist = 6; carry.CAM.el = .55; carry.CAM.az = 0; carry.goTo(-1, 1.5, Math.PI); carry.advance(.2); }); await shot('phone-375');
  console.log('fps', await ev(() => document.getElementById('fps').textContent));
  console.log([...new Set(logs)].join('\n'));
  await b.close();
})();
