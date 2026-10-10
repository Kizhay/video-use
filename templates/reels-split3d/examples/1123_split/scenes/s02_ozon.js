import { boot, C } from './_ui.js';
import { chip, T, svgI, WARN } from './_h.js';
export default function setup(ctx) {
  const A = boot(ctx, { n: '02', label: 'Площадка' });
  const { card, E, S, tl } = A;
  const logo = E(card, { left: 196, top: 56, width: 560, height: 200, borderRadius: 44, background: C.blue, color: '#fff', fontSize: 140, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: 3, boxShadow: '0 16px 34px rgba(0,91,255,.35)' }, 'OZON');
  A.pop(logo, 0.2, { from: 0.7 });
  const sv = S(card, 856, 50, `<path d="M10 25H846" stroke="${C.line}" stroke-width="12" stroke-linecap="round"/><path class="d" d="M10 25H846" stroke="${C.blue}" stroke-width="12" stroke-linecap="round"/>`, { left: 48, top: 330 });
  A.draw(sv.querySelector('.d'), 3.6, 1.8, 'none');
  for (let i = 0; i < 5; i++) { const x = 58 + i * 190, d = E(card, { left: x - 22, top: 336, width: 44, height: 44, borderRadius: 22, background: i === 4 ? C.red : C.blue, border: '7px solid #fff', boxShadow: '0 4px 10px rgba(20,30,70,.2)' }); A.pop(d, 3.6 + i * 0.4, { from: 0.2, d: 0.3 }); }
  T(A, { left: 0, top: 410, width: 952, textAlign: 'center', fontSize: 76, fontWeight: 900, color: C.gray }, 'годы', 3.9);
  chip(A, { x: 190, y: 520, h: 110, size: 64, text: '1 проблема', svg: svgI(WARN, 70, C.red), color: C.red, bg: '#FFECEE', at: 5.0 });
  return A.done();
}
