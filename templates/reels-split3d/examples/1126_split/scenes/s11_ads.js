import { gsap, scene, A, G, pill, ico, avatar, productCard, counter, seg, clamp, lerp, ease, fmt, COL, TT, pulse } from './_ui.js';
export default function setup(ctx) {
  const S = scene(ctx, { ac: '61,139,255', tilt: [4, -6] });
  const m = S.mock, tl = S.tl, T = TT(ctx);
  const panel = G(m, 40, 150, 360, 470);
  const pi = A(m, 'left:76px;top:184px;display:flex;align-items:center;gap:16px;font-size:36px;font-weight:900', `<div style="width:70px;height:70px;border-radius:22px;background:${COL.blue};display:flex;align-items:center;justify-content:center;box-shadow:0 0 40px rgba(61,139,255,.7)">${ico('megaphone', 42, '#fff', 2.6)}</div>Реклама`);
  const amt = A(m, 'left:76px;top:330px;font-size:60px;font-weight:900;letter-spacing:-1px;white-space:nowrap', '0 ₽');
  const al = A(m, 'left:76px;top:410px;font-size:26px;font-weight:500', 'потрачено', 'rm-d');
  const bar = A(m, 'left:76px;top:470px;width:288px;height:16px;border-radius:8px;background:rgba(255,255,255,.1);overflow:hidden', `<div class="pb" style="height:100%;width:0;border-radius:8px;background:linear-gradient(90deg,${COL.blue},${COL.cyan})"></div>`);
  const pb = bar.querySelector('.pb');
  const mine = productCard(m, 470, 180, { title: 'Куртка демисезонная', price: '2 490 ₽', badge: 'Ваша', badgeBg: COL.blue });
  const rival = productCard(m, 800, 180, { glow: '255,77,94', badge: 'Копия', price: '1 890 ₽', seller: 'Продавец: Китай' });
  gsap.set([mine, rival], { scale: 0.52, transformOrigin: '0 0', opacity: 0 });
  const c1 = pill(m, 585, 140, `${ico('users', 32, '#fff', 2.6)}<span class="n">0</span>`, `padding:8px 22px;font-size:34px;background:${COL.blue};box-shadow:0 0 30px rgba(61,139,255,.6)`);
  const c2 = pill(m, 915, 140, `${ico('users', 32, '#fff', 2.6)}<span class="n">0</span>`, `padding:8px 22px;font-size:34px;background:${COL.red};box-shadow:0 0 30px rgba(255,77,94,.6)`);
  const n1 = c1.querySelector('.n'), n2 = c2.querySelector('.n');
  gsap.set([panel, pi, amt, al, bar], { opacity: 0 }); gsap.set([c1, c2], { opacity: 0 });
  const NP = 24, NR = 12, LEG = 0.6, tSplit = T(63.3), t0 = 1.9;
  const dots = Array.from({ length: NP + NR }, () => A(m, 'left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;opacity:0;z-index:20'));
  const tt = (i) => (i < NP ? t0 + i * (tSplit - t0) / NP : tSplit + (i - NP) * 0.07);
  tl.fromTo([panel, pi, amt, al, bar], { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out', stagger: 0.06 }, 0.25)
    .fromTo([mine, rival], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', stagger: 0.1 }, 0.5)
    .fromTo([c1, c2], { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out', stagger: 0.1 }, 1.2);
  const e = ease('sine.inOut');
  S.add((lt) => {
    const k = seg(lt, T(61.7), 3.0, 'power1.inOut');
    amt.textContent = fmt(85400 * k) + ' ₽'; pb.style.width = (100 * k) + '%';
    let ca = 0, cb = 0;
    dots.forEach((d, i) => {
      const red = i >= NP, u = (lt - tt(i)) / LEG;
      if (u <= 0 || (!red && u >= 1) || (red && u >= 2)) { d.style.opacity = 0; if (u >= 1 && !red) ca++; if (u >= 2 && red) cb++; return; }
      let x, y, col = COL.cyan, op = 1;
      if (u < 1) { const w = e(u); x = lerp(300, 585, w); y = 380 - Math.sin(w * 3.14) * 50 + (i % 5) * 8 - 16; if (u > 0.85) op = 1 - (u - 0.85) / 0.15 * (red ? 0 : 1); if (u > 0.95 && !red) ca++; }
      else { const w = e(u - 1); x = lerp(585, 915, w); y = 380 - Math.sin(w * 3.14) * 130 + (i % 5) * 8; col = COL.red; if (w > 0.9) op = 1 - (w - 0.9) * 10; }
      d.style.opacity = op; d.style.background = col; d.style.boxShadow = `0 0 14px ${col}`; d.style.transform = `translate(${x}px,${y}px)`;
    });
    n1.textContent = ca * 12; n2.textContent = cb * 28;
  });
  return S.done();
}
