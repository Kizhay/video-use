import { gsap, scene, A, G, pill, ico, avatar, coin, seg, clamp, lerp, ease, fmt, COL, TT, pulse } from './_ui.js';
export default function setup(ctx) {
  const S = scene(ctx, { ac: '255,77,94', tilt: [4, -6] });
  const m = S.mock, tl = S.tl, T = TT(ctx);
  const card = G(m, 50, 170, 440, 480);
  const wi = A(m, 'left:90px;top:206px;display:flex;align-items:center;gap:16px;font-size:36px;font-weight:900', `${ico('wallet', 56, COL.green, 2.6)}Ваш доход`);
  const amt = A(m, 'left:90px;top:330px;font-size:62px;font-weight:900;letter-spacing:-1px;white-space:nowrap', '124 500 ₽');
  const lb = A(m, 'left:90px;top:410px;font-size:26px;font-weight:500', 'за неделю', 'rm-d');
  const dn = A(m, 'left:90px;top:490px', ico('down', 90, COL.red, 2.6, `filter:drop-shadow(0 0 16px ${COL.red})`));
  const chips = ['Mega_Copy', 'Fast_Mall', 'Yiwu_Shop'].map((nm, i) => A(m, `left:660px;top:${220 + i * 150}px;width:370px;height:104px;border-radius:26px;background:rgba(255,77,94,.12);border:1.5px solid rgba(255,77,94,.6);box-shadow:0 0 36px rgba(255,77,94,.25);backdrop-filter:blur(20px);display:flex;align-items:center;gap:18px;padding:0 22px;box-sizing:border-box`, `${avatar(60, '#8A93B3', '#2B3558')}<div><div style="font-size:30px;font-weight:900">${nm}</div><div style="font-size:22px;font-weight:700;color:${COL.red}">Копия</div></div>`));
  gsap.set([card, wi, amt, lb, dn], { opacity: 0 }); gsap.set(chips, { opacity: 0 });
  const coins = Array.from({ length: 21 }, () => coin(m, 46));
  const tC = T(107.2);
  tl.fromTo([card, wi, amt, lb, dn], { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out', stagger: 0.06 }, 0.25)
    .fromTo(chips, { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out', stagger: 0.12 }, T(107.9));
  const e = ease('sine.inOut'), spawn = coins.map((c, i) => 0.9 + i * 0.15);
  S.add((lt) => {
    const k = seg(lt, 0.9, 3.0, 'power1.inOut'); amt.textContent = fmt(lerp(124500, 38200, k)) + ' ₽'; amt.style.color = k > 0.3 ? COL.red : '#fff';
    dn.style.transform = `translateY(${4 * pulse(lt, 8)}px)`;
    coins.forEach((c, i) => {
      const u0 = (lt - spawn[i]) / 0.8;
      if (u0 <= 0 || u0 >= 1) { c.style.opacity = 0; return; }
      const u = e(u0), x0 = 470, y0 = 400, tx = 660, ty = 272 + (i % 3) * 150, cx = 560, cy = 330 - (i % 3) * 40;
      const x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * tx, y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * ty;
      c.style.opacity = Math.min(1, u0 * 8, (1 - u0) * 8); c.style.transform = `translate(${x}px,${y}px) scale(${0.8 + 0.3 * Math.sin(u0 * 3.14)})`;
    });
  });
  return S.done();
}
