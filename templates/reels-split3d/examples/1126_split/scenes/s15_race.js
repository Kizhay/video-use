import { gsap, scene, A, G, pill, ico, chart, counter, seg, clamp, COL, TT, pulse } from './_ui.js';
export default function setup(ctx) {
  const S = scene(ctx, { ac: '255,77,94', tilt: [4, 7] });
  const m = S.mock, tl = S.tl, T = TT(ctx);
  const win = G(m, 50, 110, 980, 650);
  const lg = A(m, 'left:100px;top:150px;display:flex;gap:40px;font-size:28px;font-weight:800', `<div style="display:flex;align-items:center;gap:12px"><span style="width:18px;height:18px;border-radius:50%;background:${COL.red};box-shadow:0 0 14px ${COL.red}"></span>Новые копии</div><div style="display:flex;align-items:center;gap:12px"><span style="width:18px;height:18px;border-radius:50%;background:${COL.green};box-shadow:0 0 14px ${COL.green}"></span>Удалено</div>`);
  const c1 = chart(m, 96, 220, 888, 330, (u) => 0.06 + 0.9 * Math.pow(u, 1.7), COL.red);
  const c2 = chart(m, 96, 220, 888, 330, (u) => 0.05 + 0.1 * u, COL.green);
  const b1 = A(m, 'left:100px;top:590px;width:420px;height:130px;border-radius:24px;background:rgba(255,77,94,.1);border:1px solid rgba(255,77,94,.4)', `<div class="rm-d" style="position:absolute;left:24px;top:10px;font-size:24px;font-weight:500">появилось</div><div class="v" style="position:absolute;left:24px;top:40px;font-size:64px;font-weight:900;color:${COL.red}">0</div>`);
  const b2 = A(m, 'left:560px;top:590px;width:420px;height:130px;border-radius:24px;background:rgba(43,227,139,.1);border:1px solid rgba(43,227,139,.4)', `<div class="rm-d" style="position:absolute;left:24px;top:10px;font-size:24px;font-weight:500">удалено</div><div class="v" style="position:absolute;left:24px;top:40px;font-size:64px;font-weight:900;color:${COL.green}">0</div>`);
  gsap.set([win, lg, c1.el, c2.el, b1, b2], { opacity: 0 });
  tl.fromTo(win, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.05)
    .fromTo([lg, c1.el, c2.el, b1, b2], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.07 }, 0.25);
  const ta = T(84.6);
  S.add((lt) => { c1(seg(lt, ta, 4.4, 'power1.inOut')); c2(seg(lt, ta, 4.4, 'power1.inOut')); });
  S.add(counter(b1.querySelector('.v'), 0, 1480, ta, 4.4, { ease: 'power2.in' }));
  S.add(counter(b2.querySelector('.v'), 0, 37, ta, 4.4, { ease: 'power1.inOut' }));
  S.add((lt) => { b1.style.boxShadow = `0 0 ${20 + 20 * pulse(lt, 6) * clamp((lt - ta - 1.5) / 1)}px rgba(255,77,94,.5)`; });
  return S.done();
}
