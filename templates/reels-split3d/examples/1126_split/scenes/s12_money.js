import { gsap, scene, A, G, pill, ico, avatar, coin, win, seg, clamp, lerp, ease, fmt, COL, TT, pulse } from './_ui.js';
export default function setup(ctx) {
  const S = scene(ctx, { ac: '255,77,94', tilt: [4, -7] });
  const m = S.mock, tl = S.tl, T = TT(ctx);
  win(m, 40, 110, 640, 640, 'Выручка');
  const bars = [0.5, 0.62, 0.55, 0.78, 0.7, 0.9].map((h, i) => { const H = 360 * h, x = 90 + i * 98; const el = A(m, `left:${x}px;top:${600 - H}px;width:70px;height:${H}px;transform-origin:50% 100%`, `<div class="lost" style="position:absolute;left:0;top:0;width:70px;height:${H * 0.38}px;border-radius:12px 12px 0 0;background:linear-gradient(180deg,${COL.red},rgba(255,77,94,.55));box-shadow:0 0 22px rgba(255,77,94,.6)"></div><div style="position:absolute;left:0;top:${H * 0.38}px;width:70px;height:${H * 0.62}px;border-radius:0 0 8px 8px;background:linear-gradient(180deg,${COL.blue},rgba(61,139,255,.45))"></div>`); gsap.set(el, { scaleY: 0, opacity: 0 }); return { el, x, H }; });
  const base = A(m, 'left:76px;top:602px;width:590px;height:3px;background:rgba(255,255,255,.25)');
  const ttl = A(m, 'left:84px;top:164px;font-size:34px;font-weight:900', 'Упущено');
  const lost = A(m, 'left:84px;top:216px;font-size:62px;font-weight:900;letter-spacing:-1px;color:#FF4D5E;white-space:nowrap', '−0 ₽');
  // конкурент
  const AX = 880, AY = 420;
  const glow = A(m, `left:${AX - 130}px;top:${AY - 130}px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(255,77,94,.5),rgba(255,77,94,0) 70%);opacity:.3`);
  const av = A(m, `left:${AX - 80}px;top:${AY - 80}px;width:160px;height:160px;border-radius:50%;box-shadow:0 0 0 6px rgba(255,77,94,.6),0 0 50px rgba(255,77,94,.5)`, avatar(160, '#8A93B3', '#2B3558'));
  const lab = A(m, `left:${AX - 130}px;top:${AY - 150}px;width:260px;text-align:center;font-size:30px;font-weight:800`, 'Конкурент');
  const got = A(m, `left:${AX - 160}px;top:${AY + 100}px;width:320px;text-align:center;font-size:46px;font-weight:900;color:#FF4D5E;letter-spacing:-1px`, '+0 ₽');
  gsap.set([ttl, lost, base, av, lab, got], { opacity: 0 });
  const coins = Array.from({ length: 24 }, () => coin(m, 44));
  tl.fromTo([ttl, base], { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 0.3)
    .to(bars.map((b) => b.el), { scaleY: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.2)', stagger: 0.09 }, 0.55)
    .fromTo([av, lab, got], { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out', stagger: 0.06 }, T(66.8))
    .fromTo(lost, { opacity: 0 }, { opacity: 1, duration: 0.3 }, T(66.8));
  const tS = T(67.4), spawn = Array.from({ length: 24 }, (_, i) => tS + i * 0.2);
  const e = ease('sine.inOut');
  S.add((lt) => {
    const tot = 340000 * seg(lt, tS, 4.8, 'power1.inOut');
    lost.textContent = '−' + fmt(tot) + ' ₽'; got.textContent = '+' + fmt(tot) + ' ₽';
    glow.style.opacity = 0.3 + 0.35 * pulse(lt, 5) * clamp((lt - tS) / 0.5);
    bars.forEach((b, i) => { const l = b.el.querySelector('.lost'); l.style.opacity = 1 - 0.55 * seg(lt, tS + i * 0.5, 1.2); });
    coins.forEach((c, i) => {
      const k = (lt - spawn[i]) / 0.9;
      if (k <= 0 || k >= 1) { c.style.opacity = 0; return; }
      const b = bars[i % 6], u = e(k), x0 = b.x + 35, y0 = 600 - b.H, x1 = AX - 70, y1 = AY, cx = (x0 + x1) / 2, cy = 200 - (i % 3) * 30;
      const x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1, y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1;
      c.style.opacity = Math.min(1, k * 8, (1 - k) * 8); c.style.transform = `translate(${x}px,${y}px) scale(${0.8 + 0.3 * Math.sin(k * 3.14)})`;
    });
  });
  return S.done();
}
