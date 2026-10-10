import { boot, C, ico } from './_ui.js';
export default function setup(ctx) {
  const A = boot(ctx, { n: '08', label: 'Покупатель' });
  const { card, E } = A;
  [['−300 ₽', 'экономия', 'coin', C.green, 0.9], ['30 дней', 'ожидание', 'clock', C.ink, 2.4], ['?', 'качество', 'box', C.red, 4.3]].forEach(([big, sub, ic, col, at], i) => {
    const c = E(card, { left: 34 + i * 302, top: 40, width: 280, height: 580, borderRadius: 28, background: C.soft });
    E(c, { left: 60, top: 36, width: 160, height: 160, borderRadius: 80, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }, ico(ic, 100, col, 3.4));
    E(c, { left: 0, top: i === 2 ? 215 : 255, width: 280, textAlign: 'center', fontSize: i === 2 ? 190 : 60, fontWeight: 900, color: col, lineHeight: 1.1, whiteSpace: 'nowrap' }, big);
    E(c, { left: 0, top: 470, width: 280, textAlign: 'center', fontSize: 46, fontWeight: 800, color: C.gray }, sub);
    A.pop(c, at, { from: 0.6 });
  });
  return A.done();
}
