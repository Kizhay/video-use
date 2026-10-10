import { boot, C } from './_ui.js';
import { svgI, DOWN } from './_h.js';
export default function setup(ctx) {
  const A = boot(ctx, { n: '12', label: 'Потеря 2: позиции' });
  const { card, E, S } = A;
  E(card, { left: 48, top: 36, fontSize: 52, fontWeight: 900 }, 'конверсия');
  const sv = S(card, 856, 280, `<path d="M0 270H856" stroke="${C.line}" stroke-width="5"/><path class="l" d="M10 40 C 160 40 230 60 330 110 S 560 170 700 210 S 800 235 846 242" fill="none" stroke="${C.red}" stroke-width="14" stroke-linecap="round"/>`, { left: 48, top: 100 });
  A.draw(sv.querySelector('.l'), 0.5, 2.6);
  const dn = E(card, { right: 48, top: 24, height: 90, padding: '0 28px', borderRadius: 999, background: '#FFECEE', color: C.red, display: 'flex', alignItems: 'center', gap: 12, fontSize: 48, fontWeight: 900 }, svgI(DOWN, 46, C.red, 5) + '<span class="nw">падает</span>');
  A.pop(dn, 1.6, { from: 0.5 });
  E(card, { left: 48, top: 405, fontSize: 52, fontWeight: 900 }, 'позиции');
  [['#3', C.green, 3.2], ['#27', C.red, 4.1]].forEach(([t, col, at], i) => {
    const b = E(card, { left: 48 + i * 460, top: 480, width: 396, height: 150, borderRadius: 28, background: i ? '#FFECEE' : '#E8F9F1', color: col, fontSize: 112, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }, t);
    A.pop(b, at, { from: 0.5 });
  });
  A.in(E(card, { left: 442, top: 525, width: 68, height: 68 }, svgI('<path d="M6 24h34M28 12l12 12-12 12"/>', 68, C.ink, 5)), 4.0);
  return A.done();
}
