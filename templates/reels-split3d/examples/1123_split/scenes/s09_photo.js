import { boot, C, tile, ico } from './_ui.js';
export default function setup(ctx) {
  const A = boot(ctx, { n: '09', label: 'Откуда фото' });
  const { card, E, tl } = A;
  const l = tile(card, { x: 60, y: 40, w: 340, h: 400, mine: true, price: null }); A.pop(l, 0.4, { from: 0.7 });
  const r = tile(card, { x: 552, y: 40, w: 340, h: 400, copy: true, price: null });
  tl.fromTo(r, { opacity: 0, x: -250 }, { opacity: 1, x: 0, duration: .6, ease: 'power3.inOut' }, 1.7);
  A.in(E(card, { left: 60, top: 470, width: 340, textAlign: 'center', fontSize: 52, fontWeight: 900, color: C.blue }, 'оригинал'), 0.8);
  A.in(E(card, { left: 552, top: 470, width: 340, textAlign: 'center', fontSize: 52, fontWeight: 900, color: C.red }, 'копия'), 2.2);
  const eq = E(card, { left: 426, top: 190, width: 100, height: 100, borderRadius: 50, background: C.ink, color: '#fff', fontSize: 64, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }, '='); A.pop(eq, 2.3, { from: 0.3 });
  const eye = E(card, { left: 186, top: 545, width: 580, height: 100, borderRadius: 999, background: '#FFECEE', color: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, fontSize: 48, fontWeight: 900 }, `${ico('eyeoff', 64, C.red, 4)}<span class="nw">товар не видел</span>`);
  A.in(eye, 3.4, { y: 18 });
  return A.done();
}
