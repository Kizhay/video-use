import { gsap, scene, A, G, pill, ico, avatar, win, seg, clamp, ease, COL, TT, rngf } from './_ui.js';
export default function setup(ctx) {
  const S = scene(ctx, { ac: '255,77,94', tilt: [4, 6] });
  const m = S.mock, tl = S.tl, T = TT(ctx);
  win(m, 50, 100, 980, 650, 'Продавцы OZON');
  const names = ['Ivanov_Shop', 'ShenZhen_Trade', 'Guangzhou_Mall', 'Yiwu_Global', 'Moda_Dom', 'Hangzhou_Co', 'Ningbo_Shop', 'Dongguan_Lux', 'Shantou_Hub', 'Foshan_Max', 'Pro_Sport', 'Zhejiang_Go'];
  const cn = [1, 2, 3, 5, 6, 7, 8, 9, 11, 3, 5, 6].map(() => 0); [1, 2, 3, 5, 6, 7, 8, 9, 11].forEach((i) => (cn[i] = 1));
  const rows = names.map((nm, i) => {
    const col = i % 2, r = Math.floor(i / 2), isCn = cn[i];
    return { cn: isCn, el: A(m, `left:${86 + col * 470}px;top:${176 + r * 90}px;width:446px;height:76px;box-sizing:border-box;border-radius:20px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.1);display:flex;align-items:center;gap:16px;padding:0 20px`,
      `${avatar(46, isCn ? '#B06C6C' : '#5A6B9A', '#2B3558')}<div style="font-size:26px;font-weight:800">${nm}</div><div class="tg rm-p" style="position:static;margin-left:auto;padding:5px 16px;font-size:22px;background:rgba(255,255,255,.12)">RU</div>`) };
  });
  const cnt = pill(m, 800, 150, `<span style="color:rgba(255,255,255,.6);font-size:26px;font-weight:500">из Китая</span><span class="n" style="color:${COL.red}">0</span>`, 'padding:8px 26px;font-size:44px;background:rgba(255,77,94,.12);border:1.5px solid rgba(255,77,94,.5)');
  const n = cnt.querySelector('.n');
  gsap.set(rows.map((r) => r.el), { opacity: 0 }); gsap.set(cnt, { opacity: 0 });
  const e = ease('power2.out');
  rows.forEach((r, i) => tl.fromTo(r.el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }, 0.5 + i * 0.16 - i * i * 0.006));
  tl.fromTo(cnt, { opacity: 0 }, { opacity: 1, duration: 0.3 }, T(24.0));
  const flipT = T(24.4);
  const order = rows.map((r, i) => i).filter((i) => cn[i]);
  S.add((lt) => {
    let c = 0;
    rows.forEach((r, i) => {
      const idx = order.indexOf(i), t0 = flipT + (idx >= 0 ? idx * 0.14 : 0), k = idx >= 0 ? clamp((lt - t0) / 0.3) : 0, tg = r.el.querySelector('.tg');
      if (k > 0.5) { c++; tg.textContent = 'CN'; tg.style.background = COL.red; r.el.style.borderColor = 'rgba(255,77,94,.7)'; r.el.style.background = 'rgba(255,77,94,.12)'; r.el.style.boxShadow = '0 0 30px rgba(255,77,94,.3)'; tg.style.transform = `scale(${1 + 0.25 * Math.sin(k * 3.14)})`; }
    });
    n.textContent = c;
  });
  return S.done();
}
