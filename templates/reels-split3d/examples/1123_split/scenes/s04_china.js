import { boot, C, tile, fmt, seg } from './_ui.js';
import { chip } from './_h.js';
export default function setup(ctx) {
  const A = boot(ctx, { n: '04', label: 'Китайские копии' });
  const { card, E, ico, tl } = A;
  const c = chip(A, { x: 34, y: 26, h: 96, size: 48, text: 'китайский софт', svg: ico('gear', 64, C.blue, 4), at: 0.9 });
  tl.to(c.querySelector('svg'), { rotation: 360, duration: 6, ease: 'none', transformOrigin: '50% 50%' }, 1);
  const cnt = E(card, { right: 34, top: 8, fontSize: 120, fontWeight: 900, color: C.red, lineHeight: 1.2 }, '+0');
  A.in(cnt, 3.0, { y: 14 });
  const w = 200, h = 255, gx = 28;
  const times = [0.3, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0, 4.4];
  for (let i = 0; i < 8; i++) {
    const cI = i % 4, r = (i / 4) | 0, mine = i === 0;
    const t = tile(card, { x: 34 + cI * (w + gx), y: 150 + r * 270, w, h, mine, copy: !mine, price: mine ? '2 490 ₽' : ['1 190 ₽', '1 290 ₽', '990 ₽', '1 340 ₽'][i % 4] });
    if (mine) A.pop(t, times[i], { from: 0.6 });
    else tl.fromTo(t, { opacity: 0, scale: .4, y: -30 }, { opacity: 1, scale: 1, y: 0, duration: .4, ease: 'back.out(1.3)' }, times[i]);
  }
  A.up((lt) => { cnt.textContent = '+' + fmt(1200 * seg(lt, 3.0, 4.5, (t) => t * t)); });
  return A.done();
}
