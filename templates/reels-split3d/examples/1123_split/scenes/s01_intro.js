import { boot, C, tile } from './_ui.js';
import { chip, svgI, WARN } from './_h.js';
export default function setup(ctx) {
  const A = boot(ctx, { n: '01', label: 'Тема ролика', h: 430, breath: false });
  const { card, E, tl } = A;
  const logo = E(card, { left: 40, top: 56, width: 440, height: 170, borderRadius: 38, background: C.blue, color: '#fff', fontSize: 112, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: 2, boxShadow: '0 16px 34px rgba(0,91,255,.35)' }, 'OZON');
  A.pop(logo, 0.35, { from: 0.7 });
  chip(A, { x: 40, y: 270, h: 100, size: 52, text: 'обман', svg: svgI(WARN, 64, C.red), color: C.red, bg: '#FFECEE', at: 1.5 });
  const t0 = tile(card, { x: 510, y: 56, w: 200, h: 290, mine: true }); A.pop(t0, 0.6, { from: 0.6 });
  const t1 = tile(card, { x: 730, y: 56, w: 190, h: 290, copy: true, price: '990 ₽' });
  tl.fromTo(t1, { opacity: 0, x: 60, scale: .6 }, { opacity: 1, x: 0, scale: 1, duration: .45, ease: 'back.out(1.4)' }, 1.9);
  return A.done();
}
