// yangon/boot.js — one page, two maps: the ward (①–④) or downtown (⑤), whichever the save says you're in.
import { load } from './save.js?v=7';

const S = load();
// T2: the sign boards are drawn onto canvases while the town is built, so let the self-hosted Myanmar font arrive first
// (at most 1.5 s — offline it comes from the PWA cache at once; if it never does, the system font is used as before)
await Promise.race([document.fonts?.load('700 40px "Noto Sans Myanmar"', 'က').catch(() => {}), new Promise(r => setTimeout(r, 1500))]);
import(S.at === 'downtown' ? './downtown.js?v=16' : './main.js?v=27');
