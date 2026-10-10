import { gsap, scene, A, G, pill, ico, fmt, seg, clamp, ease, COL, TT, pulse } from './_ui.js';
export default function setup(ctx) {
  const S = scene(ctx, { ac: '43,227,139', tilt: [3, -4] });
  const m = S.mock, tl = S.tl, T = TT(ctx);
  const card = G(m, 90, 190, 900, 440, 'border-color:rgba(43,227,139,.5);box-shadow:0 0 120px rgba(43,227,139,.3),0 30px 80px rgba(0,0,0,.45)');
  const sh = A(m, 'left:490px;top:120px;width:100px;height:110px;z-index:6', `<div style="width:100px;height:100px;border-radius:50%;background:${COL.green};display:flex;align-items:center;justify-content:center;box-shadow:0 0 60px rgba(43,227,139,.8)">${ico('shield', 62, '#06301C', 2.6)}</div>`);
  const num = A(m, 'left:90px;top:290px;width:900px;text-align:center;font-size:140px;font-weight:900;letter-spacing:-4px;line-height:1;color:#fff;white-space:nowrap', '0');
  const lab = pill(m, 540, 540, 'копий заблокировано', `padding:12px 34px;font-size:40px;background:rgba(43,227,139,.16);border:1.5px solid ${COL.green};color:${COL.green}`);
  const ring = A(m, 'left:390px;top:80px;width:300px;height:300px;border-radius:50%;border:6px solid #2BE38B;opacity:0');
  gsap.set([card, sh, num, lab], { opacity: 0 });
  tl.fromTo(card, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.1)
    .fromTo(sh, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' }, 0.2)
    .fromTo([num, lab], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.08 }, 0.3);
  const tEnd = T(103.6) + 0.45;
  S.add((lt) => {
    const k = seg(lt, 0.4, tEnd - 0.4, 'power2.in'); const v = 1000000 * k;
    num.textContent = (k >= 1 ? '1 000 000+' : fmt(v));
    num.style.color = k >= 1 ? COL.green : '#fff';
    const b = clamp((lt - tEnd) / 0.5); num.style.transform = `scale(${1 + 0.1 * Math.sin(b * 3.14)})`;
    ring.style.opacity = b > 0 && b < 1 ? 0.8 * (1 - b) : 0; ring.style.transform = `scale(${0.5 + b * 2})`;
  });
  return S.done();
}
