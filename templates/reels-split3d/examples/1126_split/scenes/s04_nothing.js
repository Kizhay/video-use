import { gsap, scene, A, G, pill, ico, seg, clamp, ease, COL, TT, pulse } from './_ui.js';
export default function setup(ctx) {
  const S = scene(ctx, { ac: '61,139,255', tilt: [4, -6] });
  const m = S.mock, tl = S.tl, T = TT(ctx);
  const CX = 540, CY = 400;
  const shield = A(m, `left:${CX - 160}px;top:${CY - 195}px;width:320px;height:390px;transform-origin:50% 50%`,
    `<svg width="320" height="390" viewBox="0 0 320 390" style="overflow:visible"><path class="sh" d="M160 10 L300 60 V190 C300 290 240 350 160 380 C80 350 20 290 20 190 V60 Z" fill="rgba(61,139,255,.16)" stroke="${COL.blue}" stroke-width="7" stroke-linejoin="round" style="filter:drop-shadow(0 0 28px rgba(61,139,255,.7))"/></svg>
     <div style="position:absolute;left:0;top:0;width:320px;height:360px;display:flex;align-items:center;justify-content:center">${ico('flag', 120, '#fff', 2.2)}</div>`);
  const sh = shield.querySelector('.sh');
  const hits = [1.5, 1.95, 2.35, 2.7, 3.0, 3.25, 3.45];
  const atk = hits.map((h, i) => ({ h, y: 250 + (i % 4) * 78 + (i > 3 ? 10 : 0), el: pill(m, 0, 0, `${ico('flag', 26, '#fff', 2.6)}<span>Жалоба</span>`, `padding:8px 20px;font-size:26px;background:rgba(255,255,255,.1);border:1.5px solid rgba(255,255,255,.35);backdrop-filter:blur(12px);opacity:0`) }));
  const cnt = pill(m, 200, 150, `<span style="color:rgba(255,255,255,.6);font-size:28px;font-weight:500">отклонено</span><span class="n" style="color:${COL.red}">0</span>`, 'padding:10px 30px;font-size:46px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.2);backdrop-filter:blur(24px)');
  const n = cnt.querySelector('.n');
  const tag = pill(m, 880, 640, `${ico('cross', 36, '#fff', 3.2)}<span>Без толку</span>`, `padding:12px 30px;font-size:38px;background:${COL.red};box-shadow:0 0 50px rgba(255,77,94,.6);rotate:-4deg`);
  gsap.set(tag, { scale: 0, opacity: 0 }); gsap.set([shield, cnt], { opacity: 0 });
  // тайна
  const box = G(m, CX - 150, CY - 150, 300, 300, 'border-radius:78px;border-color:rgba(39,211,255,.7);box-shadow:0 0 120px rgba(39,211,255,.55),inset 0 1px 0 rgba(255,255,255,.2)');
  const bi = A(m, `left:${CX - 150}px;top:${CY - 150}px;width:300px;height:300px;display:flex;align-items:center;justify-content:center`, ico('bolt', 150, COL.cyan, 2.2, `filter:drop-shadow(0 0 26px ${COL.cyan})`));
  const R = 196, Lr = 2 * Math.PI * R;
  const ring = A(m, `left:${CX - 210}px;top:${CY - 210}px;width:420px;height:420px`, `<svg width="420" height="420" viewBox="0 0 420 420"><circle cx="210" cy="210" r="${R}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="10"/><circle class="rg" cx="210" cy="210" r="${R}" fill="none" stroke="${COL.cyan}" stroke-width="10" stroke-linecap="round" transform="rotate(-90 210 210)" style="filter:drop-shadow(0 0 10px ${COL.cyan})"/></svg>`);
  const rg = ring.querySelector('.rg');
  const lab = pill(m, CX, 668, `${ico('code', 38, COL.cyan, 2.8)}<span>Наш софт</span>`, `padding:12px 32px;font-size:36px;background:rgba(39,211,255,.14);border:1.5px solid ${COL.cyan};color:${COL.cyan}`);
  gsap.set([box, bi, ring, lab], { opacity: 0 });
  const tShield = 0.4, tBreak = T(19.5);
  tl.fromTo(shield, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.4)' }, tShield)
    .fromTo(cnt, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 0.6)
    .to(tag, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.6)' }, T(17.7))
    .to([shield, cnt, tag], { opacity: 0, scale: 1.2, duration: 0.3, ease: 'power2.in' }, tBreak)
    .fromTo([box, bi, ring], { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(1.5)', stagger: 0.05 }, tBreak + 0.25)
    .fromTo(lab, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, tBreak + 0.7);
  S.add((lt) => {
    let cn = 0, flash = 0;
    atk.forEach((a, i) => {
      const k = (lt - (a.h - 0.45)) / 0.45, e = ease('power2.in');
      let x, y = a.y, r = 0, op = 0;
      if (k > 0 && k < 1) { x = 60 + e(k) * (CX - 175 - 60 - 110); op = Math.min(1, k * 6); }
      else if (k >= 1) { const u = clamp((k - 1) / 1.1); cn++; x = CX - 175 - 110 - 70 * u; y = a.y + 330 * u * u; r = -160 * u; op = 1 - u; if (u < 0.12) flash = 1 - u / 0.12; }
      a.el.style.opacity = op; if (x !== undefined) a.el.style.transform = `translate(${x}px,${y}px) rotate(${r}deg) translate(-50%,-50%)`; else a.el.style.opacity = 0;
    });
    n.textContent = cn;
    sh.setAttribute('stroke', flash > 0.1 ? COL.red : COL.blue);
    rg.setAttribute('stroke-dasharray', `${Lr * seg(lt, tBreak + 0.5, 1.5, 'power2.inOut')} ${Lr}`);
    box.style.filter = `brightness(${1 + 0.12 * pulse(lt, 6)})`;
  });
  return S.done();
}
