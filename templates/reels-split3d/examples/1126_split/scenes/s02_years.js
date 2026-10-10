import { gsap, scene, A, G, pill, ico, win, seg, chart, COL, TT } from './_ui.js';
export default function setup(ctx) {
  const S = scene(ctx, { ac: '255,77,94', tilt: [5, 6] });
  const m = S.mock, tl = S.tl, T = TT(ctx);
  const w = win(m, 70, 110, 940, 620, 'Копии на OZON');
  const ttl = A(m, 'left:112px;top:166px;display:flex;align-items:center;gap:16px;font-size:42px;font-weight:900', `<span class="ck">${ico('clock', 52, COL.red, 2.8)}</span>Копий всё больше`);
  const ck = ttl.querySelector('.ck');
  const set = chart(m, 112, 270, 856, 360, (u) => 0.06 + 0.9 * Math.pow(u, 2.3), COL.red);
  const l1 = A(m, 'left:124px;top:652px;font-size:26px;font-weight:500', 'раньше', 'rm-d'), l2 = A(m, 'left:880px;top:652px;font-size:26px;font-weight:500', 'сейчас', 'rm-d');
  const tag = pill(m, 800, 218, `${ico('warn', 36, '#fff', 2.8)}<span>Годами</span>`, `padding:12px 28px;font-size:34px;background:${COL.red};box-shadow:0 0 50px rgba(255,77,94,.65);rotate:-3deg`);
  gsap.set(tag, { scale: 0, opacity: 0 }); gsap.set([ttl, l1, l2, w], { opacity: 0 });
  tl.fromTo(w, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.05)
    .fromTo([ttl, l1, l2], { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.08 }, 0.25)
    .to(tag, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.6)' }, T(7.3));
  S.add((lt) => { set(seg(lt, 0.6, 3.3, 'power1.inOut')); ck.style.display = 'inline-flex'; ck.style.transform = `rotate(${lt * 90}deg)`; });
  return S.done();
}
