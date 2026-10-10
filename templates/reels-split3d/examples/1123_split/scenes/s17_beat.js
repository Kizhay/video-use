import { boot, C } from './_ui.js';
import { svgI, UP } from './_h.js';
export default function setup(ctx) {
  const A = boot(ctx, { n: '17', label: 'Скорость удаления' });
  const { card, E, S } = A;
  const sv = S(card, 856, 420, `<path d="M0 410H856" stroke="${C.line}" stroke-width="5"/><path class="r" d="M10 370 C 200 330 400 260 846 210" fill="none" stroke="${C.red}" stroke-width="13" stroke-linecap="round"/><path class="g" d="M10 395 C 200 360 340 190 846 20" fill="none" stroke="${C.green}" stroke-width="16" stroke-linecap="round"/>`, { left: 48, top: 40 });
  A.draw(sv.querySelector('.r'), 0.5, 2.0); A.draw(sv.querySelector('.g'), 2.6, 2.4);
  A.in(E(card, { left: 48, top: 520, height: 110, padding: '0 32px', borderRadius: 999, background: '#FFECEE', color: C.red, fontSize: 50, fontWeight: 900, display: 'flex', alignItems: 'center' }, '<span class="nw">появление</span>'), 1.0);
  A.pop(E(card, { right: 48, top: 520, height: 110, padding: '0 32px', borderRadius: 999, background: '#E8F9F1', color: C.green, fontSize: 50, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 12 }, svgI(UP, 48, C.green, 5) + '<span class="nw">удаление</span>'), 3.4, { from: 0.5 });
  return A.done();
}
