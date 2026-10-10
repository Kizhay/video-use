import { boot, C, ico } from './_ui.js';
export default function setup(ctx) {
  const A = boot(ctx, { n: '07', label: 'Страдают двое' });
  const { card, E } = A;
  const n = E(card, { left: 0, top: 30, width: 952, textAlign: 'center', fontSize: 280, fontWeight: 900, color: C.red, lineHeight: 1.1 }, '2');
  A.pop(n, 0.5, { from: 0.3 });
  [['person', 252], ['coin', 500]].forEach(([ic, x], i) => {
    const d = E(card, { left: x, top: 400, width: 200, height: 200, borderRadius: 100, background: C.soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }, ico(ic, 116, C.blue, 3.4));
    A.pop(d, 1.0 + i * 0.25, { from: 0.4, d: 0.4 });
  });
  return A.done();
}
