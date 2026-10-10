import { boot, C, ico } from './_ui.js';
import { svgI, DOWN, WARN } from './_h.js';
export default function setup(ctx) {
  const A = boot(ctx, { n: '03', label: 'Кто страдает' });
  const { card, E } = A;
  const col = (x, title, icn, tag, tsvg) => {
    const c = E(card, { left: x, top: 50, width: 400, height: 560, borderRadius: 28, background: C.soft });
    E(c, { left: 110, top: 44, width: 180, height: 180, borderRadius: 90, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 18px rgba(20,30,70,.1)' }, ico(icn, 110, C.blue, 3.4));
    E(c, { left: 0, top: 260, width: 400, textAlign: 'center', fontSize: 52, fontWeight: 900 }, title);
    A.in(c, 0.9, { y: 40 });
    return E(c, { left: 20, top: 390, width: 360, height: 130, borderRadius: 999, background: '#FFECEE', color: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, fontSize: 48, fontWeight: 900 }, `${tsvg}<span class="nw">${tag}</span>`);
  };
  const g1 = col(48, 'Селлер', 'coin', 'заработок', svgI(DOWN, 56, C.red, 5));
  const g2 = col(504, 'Покупатель', 'person', 'обман', svgI(WARN, 56, C.red, 4));
  A.pop(g1, 2.4, { from: 0.5 }); A.pop(g2, 5.3, { from: 0.5 });
  const vs = E(card, { left: 436, top: 120, width: 80, height: 80, borderRadius: 40, background: C.ink, color: '#fff', fontSize: 36, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }, 'VS');
  A.pop(vs, 1.2, { from: 0.3 });
  return A.done();
}
