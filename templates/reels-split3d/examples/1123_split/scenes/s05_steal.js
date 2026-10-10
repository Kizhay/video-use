import { boot, C } from './_ui.js';
import { svgI, DOC, IMG, CART } from './_h.js';
export default function setup(ctx) {
  const A = boot(ctx, { n: '05', label: 'Что копируют' });
  const { card, E } = A;
  [['Карточка', CART, 2.2], ['Фото', IMG, 4.4], ['Описание', DOC, 5.7]].forEach(([name, p, at], i) => {
    const r = E(card, { left: 48, top: 40 + i * 210, width: 856, height: 180, borderRadius: 28, background: C.soft });
    E(r, { left: 30, top: 30, width: 120, height: 120, borderRadius: 28, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }, svgI(p, 76, C.blue, 3.4));
    E(r, { left: 180, top: 48, fontSize: 58, fontWeight: 900 }, name);
    const tag = E(r, { right: 28, top: 38, height: 104, padding: '0 28px', borderRadius: 999, background: '#FFECEE', color: C.red, display: 'flex', alignItems: 'center', gap: 12, fontSize: 40, fontWeight: 900 }, `${svgI('<path d="M11 11l26 26M37 11L11 37"/>', 40, C.red, 5)}<span class="nw">украдено</span>`);
    A.in(r, at - 0.4, { y: 30 }); A.pop(tag, at + 0.2, { from: 0.5, d: 0.4 });
  });
  return A.done();
}
