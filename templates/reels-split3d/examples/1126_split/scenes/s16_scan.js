import { gsap, scene, A, G, pill, ico, counter, seg, clamp, COL, TT } from './_ui.js';
export default function setup(ctx) {
  const S = scene(ctx, { ac: '39,211,255', tilt: [4, -7] });
  const m = S.mock, tl = S.tl, T = TT(ctx);
  const win = G(m, 60, 100, 960, 680, 'border-color:rgba(39,211,255,.45)');
  const hd = A(m, 'left:100px;top:132px;display:flex;align-items:center;gap:20px', `<div class="rd" style="width:64px;height:64px;border-radius:50%;border:3px solid ${COL.cyan};position:relative;overflow:hidden;box-shadow:0 0 30px rgba(39,211,255,.5)"><div class="sw" style="position:absolute;inset:0;background:conic-gradient(from 0deg,rgba(39,211,255,0) 0,rgba(39,211,255,.8) 60deg,rgba(39,211,255,0) 61deg)"></div></div><div style="font-size:42px;font-weight:900">Поиск копий</div>`);
  const sw = hd.querySelector('.sw');
  const st = pill(m, 860, 164, '<span class="s">Сканирование</span>', `padding:10px 28px;font-size:28px;background:rgba(39,211,255,.15);border:1.5px solid ${COL.cyan};color:${COL.cyan}`);
  const s = st.querySelector('.s');
  const prog = A(m, 'left:100px;top:228px;width:880px;height:18px;border-radius:9px;background:rgba(255,255,255,.1);overflow:hidden', `<div class="pb" style="height:100%;width:0%;border-radius:9px;background:linear-gradient(90deg,${COL.blue},${COL.cyan});box-shadow:0 0 20px ${COL.cyan}"></div>`);
  const pb = prog.querySelector('.pb');
  const box = (x, lab, col) => A(m, `left:${x}px;top:270px;width:430px;height:100px;border-radius:24px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)`, `<div class="rm-d" style="position:absolute;left:26px;top:10px;font-size:24px;font-weight:500">${lab}</div><div class="v" style="position:absolute;left:26px;top:36px;font-size:54px;font-weight:900;color:${col}">0</div>`);
  const b1 = box(100, 'Найдено копий', COL.red), b2 = box(550, 'Жалоб подано', COL.green);
  const names = ['ShenZhen Trade', 'Guangzhou Store', 'Yiwu Global', 'Hangzhou Mall', 'Ningbo Shop'], prs = ['1 890 ₽', '1 790 ₽', '1 690 ₽', '1 590 ₽', '1 490 ₽'];
  const rows = names.map((nm, i) => A(m, `left:100px;top:${394 + i * 70}px;width:880px;height:62px;border-radius:20px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;gap:18px;padding:0 24px`,
    `<div class="dot" style="width:14px;height:14px;border-radius:50%;background:${COL.red};box-shadow:0 0 12px ${COL.red}"></div><div style="font-size:28px;font-weight:800">${nm}</div><div class="rm-d" style="font-size:24px;font-weight:500">${prs[i]}</div>
     <div style="margin-left:auto;position:relative;width:290px;height:42px"><div class="a rm-p" style="left:0;top:0;width:290px;height:42px;font-size:23px;background:rgba(255,77,94,.18);border:1.5px solid ${COL.red};color:${COL.red}">Найдена</div>
     <div class="b rm-p" style="left:0;top:0;width:290px;height:42px;font-size:23px;background:rgba(43,227,139,.18);border:1.5px solid ${COL.green};color:${COL.green};opacity:0">${ico('check', 24, COL.green, 3)}Жалоба подана</div></div>`));
  const beam = A(m, `left:60px;top:394px;width:960px;height:3px;background:${COL.cyan};box-shadow:0 0 24px ${COL.cyan};opacity:0;z-index:5`);
  gsap.set([hd, st, prog, b1, b2], { opacity: 0 }); gsap.set(rows, { opacity: 0 });
  const tF = T(93.8), tC = T(95.7);
  tl.fromTo(win, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.05)
    .fromTo([hd, st, prog, b1, b2], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.06 }, T(91.0))
    .fromTo(rows, { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power3.out', stagger: 0.3 }, tF - 0.1);
  S.add((lt) => { sw.style.transform = `rotate(${lt * 260}deg)`; });
  S.add((lt) => {
    pb.style.width = (100 * seg(lt, T(91.2), tC - T(91.2), 'power1.inOut')) + '%';
    const done = lt > tC; s.textContent = done ? 'Подача жалоб' : 'Сканирование';
    st.style.color = done ? COL.green : COL.cyan; st.style.borderColor = done ? COL.green : COL.cyan; st.style.background = done ? 'rgba(43,227,139,.15)' : 'rgba(39,211,255,.15)';
    const bk = clamp((lt - (tF - 0.3)) / 1.6); beam.style.opacity = bk > 0 && bk < 1 ? 1 : 0; beam.style.transform = `translateY(${bk * 330}px)`;
  });
  S.add(counter(b1.querySelector('.v'), 0, 47, tF - 0.1, 1.6, { ease: 'power1.out' }));
  S.add(counter(b2.querySelector('.v'), 0, 47, tC, 1.2, { ease: 'power1.inOut' }));
  rows.forEach((r, i) => {
    const t0 = tC + 0.1 + i * 0.25, a = r.querySelector('.a'), b = r.querySelector('.b'), dot = r.querySelector('.dot');
    S.add((lt) => { const k = seg(lt, t0, 0.3, 'power2.out'); a.style.opacity = 1 - k; b.style.opacity = k; const c = k > 0.5 ? COL.green : COL.red; dot.style.background = c; dot.style.boxShadow = `0 0 12px ${c}`; r.style.borderColor = k > 0.5 && k < 1 ? COL.green : 'rgba(255,255,255,.1)'; });
  });
  return S.done();
}
