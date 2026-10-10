import { boot, C, ico, seg, fmt } from './_ui.js';
export default function setup(ctx) {
  const A = boot(ctx, { n: '13', label: 'Потеря 3: прибыль' });
  const { card, E, tl } = A;
  const big = E(card, { left: 0, top: 190, width: 952, textAlign: 'center', fontSize: 160, fontWeight: 900, color: C.red, lineHeight: 1, whiteSpace: 'nowrap' }, '−0 ₽');
  A.in(big, 0.9, { y: 30 });
  E(card, { left: 0, top: 390, width: 952, textAlign: 'center', fontSize: 60, fontWeight: 800, color: C.gray }, 'упущенная прибыль');
  const coin = E(card, { left: 70, top: 30, width: 130, height: 130 }, ico('coin', 130, C.blue, 3.2));
  tl.fromTo(coin, { opacity: 0 }, { opacity: 1, duration: .3 }, 0.3);
  tl.to(coin, { x: 690, y: 0, rotation: 360, opacity: 0, duration: 1.8, ease: 'power2.in' }, 1.4);
  const pk = E(card, { left: 48, top: 540, width: 856, height: 44, borderRadius: 22, background: C.soft });
  const bar = E(pk, { left: 0, top: 0, width: 856, height: 44, borderRadius: 22, background: C.blue, transformOrigin: '0 50%' });
  tl.to(bar, { scaleX: 0.15, duration: 2.6, ease: 'power2.inOut' }, 1.0);
  A.up((lt) => { big.textContent = '−' + fmt(184000 * seg(lt, 0.9, 3.2, (t) => t)) + ' ₽'; });
  return A.done();
}
