// yangon/boot.js — one page, two maps: the ward (①–④) or downtown (⑤), whichever the save says you're in.
import { load } from './save.js?v=3';

const S = load();
import(S.at === 'downtown' ? './downtown.js?v=8' : './main.js?v=10');
