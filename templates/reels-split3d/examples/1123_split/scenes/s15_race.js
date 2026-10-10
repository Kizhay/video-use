import { boot, C } from './_ui.js';
export default function setup(ctx) {
  const A = boot(ctx, { n: '15', label: 'Скорость' });
  const { card, E, tl } = A;
  [['копии', C.red, 1.0], ['ручной труд', C.gray, 0.16]].forEach(([name, col, k], i) => {
    const y = 50 + i * 220;
    E(card, { left: 48, top: y, fontSize: 56, fontWeight: 900, color: i ? C.gray : C.red }, name);
    const tr = E(card, { left: 48, top: y + 90, width: 856, height: 96, borderRadius: 48, background: C.soft });
    const b = E(tr, { left: 0, top: 0, width: 856, height: 96, borderRadius: 48, background: col, transformOrigin: '0 50%', transform: 'scaleX(0)' });
    tl.to(b, { scaleX: k, duration: i ? 1.8 : 1.2, ease: i ? 'power1.out' : 'power2.in' }, 0.5);
  });
  A.in(E(card, { left: 0, top: 510, width: 952, textAlign: 'center', fontSize: 76, fontWeight: 900, color: C.red }, 'копии быстрее'), 1.9);
  return A.done();
}
