import { gsap, scene, A, G, pill, ico, avatar, win, chart, seg, clamp, lerp, ease, COL, TT, pulse } from './_ui.js';
export default function setup(ctx) {
  const S = scene(ctx, { ac: '255,77,94', tilt: [4, 6] });
  const m = S.mock, tl = S.tl, T = TT(ctx);
  // A: конверсия
  const Aa = A(m, 'left:0;top:0;width:1080px;height:960px');
  win(Aa, 60, 110, 960, 640, 'Карточка товара');
  A(Aa, 'left:104px;top:166px;font-size:36px;font-weight:900;display:flex;align-items:center;gap:14px', `${ico('down', 44, COL.red, 2.8)}Конверсия`);
  const v = A(Aa, 'left:104px;top:236px;font-size:110px;font-weight:900;letter-spacing:-3px;line-height:1', '8,4%');
  const set = chart(Aa, 104, 400, 872, 300, (u) => 0.9 - 0.75 * Math.pow(u, 1.4), COL.red);
  const leave = Array.from({ length: 6 }, (_, i) => A(Aa, `left:0;top:0;opacity:0;z-index:9`, avatar(46, ['#8D7CFF', '#47C2FF', '#5A6B9A'][i % 3], '#26407C')));
  // B: позиции
  const Bb = A(m, 'left:0;top:0;width:1080px;height:960px');
  win(Bb, 60, 110, 960, 650, 'Выдача OZON');
  const names = ['Ваша карточка', 'Mega_Shop', 'Top_Store', 'ShenZhen_Trade', 'Yiwu_Global', 'Fast_Mall'];
  const rows = names.map((nm, i) => A(Bb, `left:100px;top:0;width:560px;height:78px;box-sizing:border-box;border-radius:20px;display:flex;align-items:center;gap:16px;padding:0 20px;background:${i === 0 ? 'rgba(61,139,255,.2)' : 'rgba(255,255,255,.06)'};border:1.5px solid ${i === 0 ? COL.blue : 'rgba(255,255,255,.1)'}`, `${avatar(46, i === 0 ? '#3D8BFF' : '#5A6B9A', i === 0 ? '#27D3FF' : '#2B3558')}<div style="font-size:28px;font-weight:${i === 0 ? 900 : 700}">${nm}</div>`));
  const pos = A(Bb, 'left:700px;top:230px;width:290px;text-align:center', `<div class="rm-d" style="font-size:28px;font-weight:500">позиция</div><div class="pn" style="font-size:130px;font-weight:900;letter-spacing:-3px;line-height:1.1;color:#FF4D5E">3</div><div style="display:flex;justify-content:center">${ico('down', 70, COL.red, 2.8)}</div>`);
  const pn = pos.querySelector('.pn');
  gsap.set(Bb, { opacity: 0, x: 120 });
  const tB = T(77.1);
  tl.fromTo(Aa, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 0.25)
    .to(Aa, { opacity: 0, x: -120, duration: 0.3, ease: 'power2.in' }, tB - 0.35)
    .to(Bb, { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out' }, tB - 0.25);
  const e = ease('power2.inOut');
  S.add((lt) => {
    set(seg(lt, 0.6, 3.2, 'power1.inOut'));
    const k = seg(lt, 0.6, 3.2, 'power2.inOut'); v.textContent = lerp(8.4, 3.1, k).toFixed(1).replace('.', ',') + '%'; v.style.color = k > 0.4 ? COL.red : '#fff';
    leave.forEach((a, i) => { const t0 = T(74.4) + i * 0.17, u = (lt - t0) / 0.7; if (u <= 0 || u >= 1) { a.style.opacity = 0; return; } a.style.opacity = Math.min(1, u * 5, (1 - u) * 5); a.style.transform = `translate(${300 + i * 60}px,${180}px) translate(${u * 420}px,${-u * 60}px)`; });
    const p = 5 * e(clamp((lt - tB - 0.2) / 1.5));
    rows.forEach((r, i) => { const slot = i === 0 ? p : (i - 1) + clamp(i - p, 0, 1); r.style.transform = `translateY(${190 + slot * 92}px)`; });
    pn.textContent = Math.round(3 + 24 * e(clamp((lt - tB - 0.2) / 1.5)));
  });
  return S.done();
}
