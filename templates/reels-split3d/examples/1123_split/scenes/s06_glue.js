import { boot, C, tile } from './_ui.js';
export default function setup(ctx) {
  const A = boot(ctx, { n: '06', label: 'Блок на карточке' });
  const { card, E, tl } = A;
  const t0 = tile(card, { x: 40, y: 40, w: 300, h: 380, mine: true, price: '2 490 ₽' }); A.pop(t0, 0.3, { from: 0.7 });
  const strip = E(card, { left: 368, top: 40, width: 544, height: 380, borderRadius: 28, background: C.soft });
  E(strip, { left: 28, top: 22, fontSize: 44, fontWeight: 900, color: C.gray, whiteSpace: 'nowrap' }, 'Есть подешевле');
  const t1 = tile(strip, { x: 24, y: 100, w: 232, h: 250, copy: true, price: '990 ₽' });
  const t2 = tile(strip, { x: 288, y: 100, w: 232, h: 250, copy: true, price: '1 190 ₽' });
  A.in(strip, 1.6, { y: 40 });
  tl.fromTo(t1, { x: 160, y: -120, opacity: 0, rotation: 12 }, { x: 0, y: 0, opacity: 1, rotation: 0, duration: .5, ease: 'back.out(1.2)' }, 2.0);
  tl.fromTo(t2, { opacity: 0, scale: .6 }, { opacity: 1, scale: 1, duration: .4, ease: 'back.out(1.4)' }, 2.5);
  const bar = E(card, { left: 40, top: 470, width: 872, height: 150, borderRadius: 28, background: '#EEF4FF', color: C.blue, fontSize: 56, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }, 'приклеились к карточке');
  A.in(bar, 0.9, { y: 24 });
  return A.done();
}
