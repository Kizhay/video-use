import { gsap, scene, A, G, pill, ico, productCard, cursor, seg, clamp, COL, TT, pulse } from './_ui.js';
export default function setup(ctx) {
  const S = scene(ctx, { ac: '61,139,255', tilt: [4, 6] });
  const m = S.mock, tl = S.tl, T = TT(ctx);
  const SC = 0.72, Y = 150;
  const a = productCard(m, 70, Y, { title: 'Куртка демисезонная', price: '2 490 ₽', badge: 'Ваш товар', badgeBg: COL.blue, seller: 'Продавец: Вы' });
  const b = productCard(m, 640, Y, { title: 'Куртка демисезонная', price: '1 890 ₽', old: '2 490 ₽', badge: 'Дешевле', badgeBg: COL.red, glow: '255,77,94', seller: 'Продавец: Китай' });
  gsap.set([a, b], { scale: SC, transformOrigin: '0 0', opacity: 0 });
  const save = pill(m, 540, 330, `<span>−600 ₽</span>`, `padding:14px 34px;font-size:52px;background:#2BE38B;color:#06301C;box-shadow:0 0 70px rgba(43,227,139,.6);rotate:-4deg;z-index:15`);
  const bub = pill(m, 790, 112, `${ico('question', 38, '#fff', 2.8)}<span>Тот же товар?</span>`, `padding:12px 28px;font-size:32px;background:rgba(255,255,255,.1);border:1.5px solid rgba(255,255,255,.4);backdrop-filter:blur(20px);z-index:15`);
  const added = pill(m, 798, 700, `${ico('check', 34, '#06301C', 3.2)}<span>В корзине</span>`, 'padding:10px 26px;font-size:30px;background:#2BE38B;color:#06301C;z-index:15');
  gsap.set([save, bub, added], { scale: 0, opacity: 0 });
  // фаза B: одинаковые
  const eq = pill(m, 540, 400, '=', `width:110px;height:110px;border-radius:50%;font-size:80px;background:${COL.blue};box-shadow:0 0 80px rgba(61,139,255,.8);z-index:15`);
  const okP = pill(m, 330, 690, `${ico('check', 32, '#06301C', 3.2)}<span>Фото</span>`, 'padding:10px 28px;font-size:32px;background:#2BE38B;color:#06301C');
  const okT = pill(m, 750, 690, `${ico('check', 32, '#06301C', 3.2)}<span>Описание</span>`, 'padding:10px 28px;font-size:32px;background:#2BE38B;color:#06301C');
  gsap.set([eq, okP, okT], { scale: 0, opacity: 0 });
  const tC = T(41.1), tQ = T(43.1), tB = T(44.9);
  tl.fromTo([a, b], { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', stagger: 0.12 }, 0.2)
    .to(save, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.7)' }, tC)
    .to(added, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }, tC + 0.9)
    .to(bub, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }, tQ)
    .to([save, bub, added], { scale: 0.6, opacity: 0, duration: 0.25, ease: 'power2.in' }, tB - 0.5)
    .to(a, { x: 60, duration: 0.5, ease: 'power3.inOut' }, tB - 0.35).to(b, { x: -60, duration: 0.5, ease: 'power3.inOut' }, tB - 0.35)
    .to(eq, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.8)' }, tB + 0.1)
    .to(okP, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }, tB + 0.35)
    .to(okT, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }, tB + 0.75);
  S.add(cursor(m, [{ t: tC - 0.6, x: 600, y: 760 }, { t: tC + 0.8, x: 796, y: 568, c: true }], { until: tB - 0.6 }));
  S.add((lt) => { bub.style.filter = `brightness(${1 + 0.15 * pulse(lt, 6)})`; });
  return S.done();
}
