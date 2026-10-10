import { gsap, scene, A, G, pill, ico, avatar, cursor, typer, seg, clamp, COL, TT } from './_ui.js';
export default function setup(ctx) {
  const S = scene(ctx, { ac: '61,139,255', tilt: [3, -5], exit: false });
  const m = S.mock, tl = S.tl, T = TT(ctx);
  const PX = 340, PY = 70, SX = PX + 14, SY = PY + 14, SW = 372, SH = 692;
  const phone = G(m, PX, PY, 400, 720, 'border-radius:62px;background:rgba(10,14,30,.9);border:2px solid rgba(255,255,255,.28);box-shadow:0 0 90px rgba(61,139,255,.35),0 40px 90px rgba(0,0,0,.55)');
  const scr = A(m, `left:${SX}px;top:${SY}px;width:${SW}px;height:${SH}px;border-radius:48px;overflow:hidden;background:#0C1020`);
  const dim = 'color:rgba(255,255,255,.6)';
  const s1 = A(scr, `left:0;top:0;width:${SW}px;height:${SH}px`,
    `<div class="rm-a" style="left:24px;top:22px;font-size:26px;font-weight:800">rocketmetrix</div>
     <div class="rm-a" style="left:22px;top:74px;width:100px;height:100px;border-radius:50%;padding:4px;box-sizing:border-box;background:conic-gradient(#3D8BFF,#27D3FF,#7C5CFF,#3D8BFF)"><div style="width:100%;height:100%;border-radius:50%;background:#0C1020;padding:4px;box-sizing:border-box"><div style="width:100%;height:100%;border-radius:50%;background:linear-gradient(145deg,#3D8BFF,#27D3FF);display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:900;color:#06122E">RM</div></div></div>
     ${[['57', 'публ.'], ['12,4K', 'подписч.'], ['38', 'подписки']].map(([a, b], i) => `<div class="rm-a" style="left:${140 + i * 76}px;top:92px;text-align:center;width:76px"><div style="font-size:24px;font-weight:900">${a}</div><div style="font-size:14px;font-weight:500;${dim}">${b}</div></div>`).join('')}
     <div class="rm-a" style="left:24px;top:192px;font-size:22px;font-weight:800">RocketMetrix</div>
     <div class="rm-a" style="left:24px;top:222px;font-size:19px;font-weight:500;${dim}">Находим копии твоих карточек</div>
     <div class="rm-a" style="left:24px;top:248px;font-size:19px;font-weight:500;${dim}">и подаём жалобы на OZON</div>
     <div class="hl rm-a" style="left:12px;top:284px;width:348px;height:52px;border-radius:14px;background:rgba(61,139,255,.28);border:2px solid #3D8BFF;box-shadow:0 0 40px rgba(61,139,255,.8);opacity:0"></div>
     <div class="rm-a" style="left:24px;top:296px;display:flex;align-items:center;gap:10px;font-size:21px;font-weight:800;color:#7DB2FF">${ico('link', 26, '#7DB2FF', 2.6)}rocketmetrix.ru/copy</div>
     <div class="rm-a" style="left:22px;top:354px;width:210px;height:46px;border-radius:12px;background:#3D8BFF;font-size:20px;font-weight:800;display:flex;align-items:center;justify-content:center">Подписаться</div>
     <div class="rm-a" style="left:244px;top:354px;width:106px;height:46px;border-radius:12px;background:rgba(255,255,255,.12);font-size:20px;font-weight:800;display:flex;align-items:center;justify-content:center">Написать</div>
     ${[0, 1, 2, 3, 4, 5].map((i) => `<div class="rm-a" style="left:${i % 3 * 124 + 2}px;top:${430 + Math.floor(i / 3) * 124}px;width:122px;height:122px;background:linear-gradient(${135 + i * 25}deg,${['#1E3A8A', '#0E7490', '#5B3FA8'][i % 3]},#0C1020)"></div>`).join('')}`);
  const hl = s1.querySelector('.hl');
  const s2 = A(scr, `left:${SW}px;top:0;width:${SW}px;height:${SH}px`,
    `<div class="rm-a" style="left:0;top:22px;width:${SW}px;text-align:center;font-size:26px;font-weight:800">Комментарии</div>
     <div class="rm-a" style="left:20px;top:80px;display:flex;gap:14px;align-items:center">${avatar(54, '#3D8BFF', '#27D3FF', '#06122E')}<div style="font-size:19px;font-weight:500;${dim};line-height:1.3"><b style="color:#fff">rocketmetrix</b><br>Находим копии за вас</div></div>
     <div class="rm-a" style="left:0;top:150px;width:${SW}px;height:2px;background:rgba(255,255,255,.1)"></div>
     <div class="rm-a" style="left:20px;top:172px;display:flex;gap:14px;align-items:center">${avatar(48, '#8D7CFF', '#26407C')}<div style="font-size:19px;font-weight:500;line-height:1.3"><b>anna.shop</b><br><span style="${dim}">Давно ищу такое</span></div></div>
     <div class="rm-a" style="left:20px;top:248px;display:flex;gap:14px;align-items:center">${avatar(48, '#47C2FF', '#26407C')}<div style="font-size:19px;font-weight:500;line-height:1.3"><b>oleg_wb</b><br><span style="${dim}">Как подключить?</span></div></div>
     <div class="c1 rm-a" style="left:20px;top:324px;display:flex;gap:14px;align-items:center;opacity:0">${avatar(48, '#2BE38B', '#14604A')}<div style="font-size:19px;font-weight:500;line-height:1.3"><b>ты</b><br><span style="font-size:24px;font-weight:800;color:#fff">сервис</span></div></div>
     <div class="c2 rm-a" style="left:62px;top:402px;display:flex;gap:14px;align-items:center;opacity:0">${avatar(44, '#3D8BFF', '#27D3FF', '#06122E')}<div style="font-size:19px;font-weight:500;line-height:1.3"><b>rocketmetrix</b><br><span style="color:#7DB2FF">Отправил ссылку</span></div></div>
     <div class="rm-a" style="left:0;top:${SH - 98}px;width:${SW}px;height:98px;background:#0C1020;border-top:1px solid rgba(255,255,255,.12)"></div>
     <div class="rm-a" style="left:16px;top:${SH - 78}px;display:flex;align-items:center;gap:12px">${avatar(46, '#2BE38B', '#14604A')}<div class="inp" style="width:226px;height:50px;border-radius:25px;border:2px solid rgba(255,255,255,.22);display:flex;align-items:center;padding:0 18px;box-sizing:border-box;font-size:22px;font-weight:800"></div><div class="snd" style="display:flex">${ico('send', 36, '#3D8BFF', 2.6)}</div></div>`);
  const inp = s2.querySelector('.inp'), c1 = s2.querySelector('.c1'), c2 = s2.querySelector('.c2');
  inp.innerHTML = '<span style="color:rgba(255,255,255,.4);font-weight:500;font-size:19px">Комментарий…</span>';
  const typeEl = A(inp, 'position:relative');
  const chipL = pill(m, 178, 330, 'x', 'padding:16px 28px;font-size:28px;background:rgba(255,255,255,.08);border:1px solid rgba(61,139,255,.6);box-shadow:0 0 40px rgba(61,139,255,.4);backdrop-filter:blur(24px);z-index:6');
  const L1 = `${ico('link', 36, '#fff')}<span>Шапка профиля</span>`, L2 = `${ico('chat', 36, '#fff')}<span>Комментарий</span>`; let lastL = '';
  const free = pill(m, 830, 540, `${ico('check', 44, '#06301C', 3.2)}<span>Бесплатно</span>`, 'padding:14px 28px;font-size:42px;font-weight:900;background:#2BE38B;color:#06301C;box-shadow:0 0 80px rgba(43,227,139,.6);rotate:4deg;z-index:7');
  gsap.set(free, { scale: 0, opacity: 0 }); gsap.set(chipL, { opacity: 0, x: -50 }); gsap.set(phone, { opacity: 0 });
  const tH = T(110.0), tSw = T(111.5), tT = T(112.1), tR = T(113.2);
  tl.fromTo([phone, scr], { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0.1)
    .to(chipL, { opacity: 1, x: 0, duration: 0.4, ease: 'power3.out' }, tH - 0.3)
    .fromTo(hl, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power3.out' }, tH - 0.2)
    .to(hl, { opacity: 0, duration: 0.3 }, tSw - 0.2)
    .to(s1, { x: -SW, duration: 0.5, ease: 'power2.inOut' }, tSw)
    .to(s2, { x: -SW, duration: 0.5, ease: 'power2.inOut' }, tSw)
    .fromTo(c1, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, tT + 0.9)
    .fromTo(c2, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, tR)
    .to(free, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.6)' }, tR + 0.6);
  gsap.set([s2.querySelector('.snd')], { opacity: 0.5 });
  S.add((lt) => { const h = lt < tSw + 0.2 ? L1 : L2; if (h !== lastL) { chipL.innerHTML = h; lastL = h; } });
  const ty = typer(typeEl, 'сервис', tT, 0.5);
  S.add((lt) => { if (lt < tT - 0.2) { inp.firstElementChild.style.display = ''; typeEl.style.display = 'none'; } else { inp.firstElementChild.style.display = 'none'; typeEl.style.display = lt < tT + 0.9 ? '' : 'none'; if (lt >= tT + 0.9) inp.firstElementChild.style.display = ''; ty(lt); } });
  S.add((lt) => { s2.querySelector('.snd').style.opacity = lt > tT + 0.5 && lt < tT + 0.9 ? 1 : 0.5; hl.style.transform = `scale(${1 + 0.015 * Math.sin(lt * 8)})`; free.style.filter = `brightness(${1 + 0.08 * Math.sin(Math.max(0, lt - tR) * 6)})`; });
  S.add(cursor(m, [{ t: tH - 0.7, x: 660, y: 300 }, { t: tH + 0.6, x: 500, y: 402, c: true }, { t: tT - 0.2, x: 500, y: 722, c: true }, { t: tT + 0.7, x: 672, y: 722, c: true }], { until: tT + 1.2 }));
  return S.done();
}
