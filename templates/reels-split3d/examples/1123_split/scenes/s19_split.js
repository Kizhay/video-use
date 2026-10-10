import { boot, C } from './_ui.js';
export default function setup(ctx) {
  const A = boot(ctx, { n: '19', label: 'Ваша прибыль' });
  const { card, E, S, tl } = A;
  const R = 165, circ = 2 * Math.PI * R;
  const sv = S(card, 400, 400, `<circle cx="200" cy="200" r="${R}" fill="none" stroke="${C.blue}" stroke-width="64"/><circle class="a" cx="200" cy="200" r="${R}" fill="none" stroke="${C.red}" stroke-width="64" transform="rotate(-90 200 200)" stroke-dasharray="${circ}" stroke-dashoffset="${circ}"/>`, { left: 36, top: 130 });
  A.in(sv, 0.2, { y: 30 });
  tl.to(sv.querySelector('.a'), { strokeDashoffset: circ * 0.7, duration: 1.4, ease: 'power2.inOut' }, 0.8);
  E(card, { left: 36, top: 304, width: 400, textAlign: 'center', fontSize: 48, fontWeight: 900 }, 'прибыль');
  const t = E(card, { left: 480, top: 70, width: 440, height: 220, borderRadius: 28, background: '#FFECEE', color: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 54, fontWeight: 900, textAlign: 'center', lineHeight: 1.2 }, 'копии<br>забирают долю');
  A.pop(t, 1.0, { from: 0.6 });
  A.in(E(card, { left: 480, top: 330, width: 440, height: 220, borderRadius: 28, background: C.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 54, fontWeight: 900, textAlign: 'center', lineHeight: 1.2 }, 'псевдо-<br>конкуренты'), 1.6);
  return A.done();
}
