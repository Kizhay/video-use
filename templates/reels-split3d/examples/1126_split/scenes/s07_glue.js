import { gsap, scene, A, G, pill, ico, avatar, productCard, seg, clamp, COL, TT, pulse } from './_ui.js';
export default function setup(ctx) {
  const S = scene(ctx, { ac: '61,139,255', tilt: [4, -6] });
  const m = S.mock, tl = S.tl, T = TT(ctx);
  const card = productCard(m, 50, 120, { title: 'Куртка демисезонная', price: '2 490 ₽' });
  gsap.set(card, { scale: 0.8, transformOrigin: '0 0', opacity: 0 });
  const orig = pill(m, 226, 100, `${ico('check', 28, '#06301C', 3.2)}<span>Оригинал</span>`, 'padding:7px 20px;font-size:26px;background:#2BE38B;color:#06301C');
  gsap.set(orig, { opacity: 0, scale: 0 });
  // блок «Есть подешевле»
  const BX = 470, BY = 150, BW = 570;
  const blk = A(m, `left:${BX}px;top:${BY}px;width:${BW}px;height:76px;border-radius:26px;background:rgba(61,139,255,.14);border:1px solid rgba(61,139,255,.55);overflow:hidden;box-shadow:0 0 50px rgba(61,139,255,.25);backdrop-filter:blur(20px)`);
  blk.innerHTML = `<div style="position:absolute;left:26px;top:0;height:76px;display:flex;align-items:center;gap:14px;font-size:34px;font-weight:900">${ico('arrow', 36, COL.blue, 2.8, 'transform:rotate(90deg)')}Есть подешевле</div>`;
  const data = [['ShenZhen Trade', '1 890 ₽', '#6C7BB0'], ['Guangzhou Store', '1 790 ₽', '#7E6CB0'], ['Yiwu Global', '1 690 ₽', '#6CA0B0']];
  const rows = data.map(([nm, pr, c], i) => { const r = A(blk, `left:16px;top:${90 + i * 108}px;width:${BW - 32}px;height:92px;border-radius:20px;background:rgba(255,255,255,.07);display:flex;align-items:center;padding:0 18px;gap:16px`,
    `${avatar(54, c, '#2B3558')}<div><div style="font-size:28px;font-weight:800">${nm}</div><div class="rm-d" style="font-size:20px;font-weight:500">Китай · 0 отзывов</div></div><div style="margin-left:auto;font-size:36px;font-weight:900">${pr}</div><div class="lk" style="display:flex;width:46px;height:46px;border-radius:50%;background:${COL.red};align-items:center;justify-content:center;box-shadow:0 0 20px ${COL.red}">${ico('link', 26, '#fff', 2.8)}</div>`); gsap.set(r, { opacity: 0 }); return r; });
  // нити
  const wires = A(m, 'left:0;top:0;width:1080px;height:960px;pointer-events:none', `<svg width="1080" height="960" style="overflow:visible">${[0, 1, 2].map((i) => `<path class="w${i}" d="M${BX + 12} ${BY + 136 + i * 108} C ${BX - 40} ${BY + 136 + i * 108} ${BX - 20} 560 410 ${540 + i * 22}" fill="none" stroke="${COL.red}" stroke-width="5" stroke-dasharray="2 12" stroke-linecap="round" style="filter:drop-shadow(0 0 8px ${COL.red})"/>`).join('')}</svg>`);
  const tag = pill(m, 800, 710, `${ico('link', 36, '#fff', 2.8)}<span>Копии рядом</span>`, `padding:12px 30px;font-size:36px;background:${COL.red};box-shadow:0 0 50px rgba(255,77,94,.6);rotate:-3deg`);
  gsap.set(tag, { scale: 0, opacity: 0 }); gsap.set(wires.querySelectorAll('path'), { opacity: 0 });
  const tB = T(35.3);
  tl.fromTo(card, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 0.2)
    .to(orig, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.5)' }, 0.55)
    .to(blk, { height: 428, duration: 0.55, ease: 'power3.out' }, tB)
    .fromTo(rows, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power3.out', stagger: 0.14 }, tB + 0.25)
    .to(wires.querySelectorAll('path'), { opacity: 1, duration: 0.2, stagger: 0.14 }, tB + 0.9)
    .to(tag, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.6)' }, tB + 1.4);
  S.add((lt) => { wires.querySelectorAll('path').forEach((p, i) => { p.setAttribute('stroke-dashoffset', -lt * 30); }); rows.forEach((r, i) => { r.querySelector('.lk').style.transform = `scale(${1 + 0.12 * pulse(lt + i, 6)})`; }); });
  return S.done();
}
