import { boot, C, ico } from './_ui.js';
export default function setup(ctx) {
  const A = boot(ctx, { n: '10', label: 'Возврат' });
  const { card, E, S } = A;
  const mk = (x, t, bg) => E(card, { left: x, top: 120, width: 260, height: 130, borderRadius: 999, background: bg, color: '#fff', fontSize: 58, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }, t);
  A.pop(mk(36, 'Китай', C.red), 0.3); A.pop(mk(656, 'Россия', C.blue), 0.45);
  const sv = S(card, 952, 160, `<path class="p" d="M300 70 Q 476 -50 652 70" stroke="${C.ink}" stroke-width="9" fill="none" stroke-linecap="round"/>`, { left: 0, top: 110 });
  A.draw(sv.querySelector('.p'), 1.0, 1.4);
  const back = S(card, 952, 160, `<path class="q" d="M652 70 Q 476 190 300 70" stroke="${C.red}" stroke-width="11" fill="none" stroke-linecap="round"/>`, { left: 0, top: 200 });
  A.draw(back.querySelector('.q'), 2.4, 0.8);
  const x = E(card, { left: 396, top: 340, width: 160, height: 160, borderRadius: 80, background: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(255,59,78,.4)' }, ico('x', 92, '#fff', 5.5));
  A.pop(x, 3.1, { from: 0.2 });
  E(card, { left: 0, top: 540, width: 952, textAlign: 'center', fontSize: 80, fontWeight: 900, color: C.red }, 'возврат');
  return A.done();
}
