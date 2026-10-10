import { gsap, scene, A, G, pill, ico, avatar, win, chart, seg, clamp, COL, TT, pulse } from './_ui.js';
export default function setup(ctx) {
  const S = scene(ctx, { ac: '43,227,139', tilt: [4, 6] });
  const m = S.mock, tl = S.tl, T = TT(ctx);
  win(m, 60, 110, 960, 600, 'Рост сервиса');
  const ttl = A(m, 'left:104px;top:166px;display:flex;align-items:center;gap:14px;font-size:38px;font-weight:900', `${ico('up', 46, COL.green, 2.8)}Пользователи`);
  const set = chart(m, 104, 250, 872, 330, (u) => 0.05 + 0.9 * Math.pow(u, 2.6), COL.green);
  const ax = A(m, 'left:104px;top:600px;width:872px;display:flex;justify-content:space-between;font-size:26px;font-weight:500', '<span>Месяц 1</span><span>Месяц 2</span>', 'rm-d');
  const mark = A(m, `left:${104 + 872 * 0.62}px;top:250px;width:3px;height:330px;background:repeating-linear-gradient(180deg,rgba(255,255,255,.5) 0 10px,transparent 10px 18px);opacity:0`);
  const tag = pill(m, 104 + 872 * 0.62, 226, `<span>Второй месяц</span>`, `padding:10px 26px;font-size:30px;background:${COL.green};color:#06301C;box-shadow:0 0 50px rgba(43,227,139,.6)`);
  const av = [0, 1, 2, 3, 4, 5, 6].map((i) => A(m, `left:${220 + i * 82}px;top:640px;z-index:5`, avatar(66, ['#3D8BFF', '#8D7CFF', '#47C2FF', '#2BE38B', '#FF8A00', '#5A6B9A', '#27D3FF'][i], '#26407C')));
  const plus = pill(m, 880, 673, '+', `width:66px;height:66px;border-radius:50%;font-size:40px;background:${COL.green};color:#06301C`);
  gsap.set([ttl, ax], { opacity: 0 }); gsap.set(av, { opacity: 0, scale: 0 }); gsap.set([plus, tag], { opacity: 0, scale: 0 });
  tl.fromTo([ttl, ax], { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.08 }, 0.25)
    .to(av, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.8)', stagger: 0.1 }, T(98.2))
    .to(plus, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.8)' }, T(98.2) + 0.8)
    .to(tag, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)' }, T(100.2))
    .to(mark, { opacity: 1, duration: 0.3 }, T(100.2));
  S.add((lt) => { set(seg(lt, 0.6, 3.4, 'power2.inOut')); });
  return S.done();
}
