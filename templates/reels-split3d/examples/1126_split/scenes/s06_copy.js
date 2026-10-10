import { gsap, scene, A, G, pill, ico, photo, productCard, counter, seg, clamp, ease, COL, TT, pulse } from './_ui.js';
export default function setup(ctx) {
  const S = scene(ctx, { ac: '39,211,255', tilt: [4, -6] });
  const m = S.mock, tl = S.tl, T = TT(ctx);
  const tB = T(30.4); // фаза «воровать»
  // фаза A: оригинал + веер клонов
  const orig = productCard(m, 60, 150, { title: 'Куртка демисезонная', price: '2 490 ₽', seller: 'Ваш магазин' });
  gsap.set(orig, { scale: 0.62, transformOrigin: '0 0' });
  const clones = [0, 1, 2, 3, 4].map((i) => { const c = productCard(m, 60, 150, { glow: '255,77,94', badge: 'Копия', price: (1990 - i * 100).toLocaleString('ru').replace(',', ' ') + ' ₽', seller: 'Продавец ' + (i + 1) }); gsap.set(c, { scale: 0.62, transformOrigin: '0 0', opacity: 0 }); return c; });
  const soft = pill(m, 540, 150, `${ico('code', 36, COL.cyan, 2.8)}<span>Софт</span>`, `padding:10px 26px;font-size:34px;background:rgba(39,211,255,.14);border:1.5px solid ${COL.cyan};color:${COL.cyan};z-index:12`);
  const cnt = pill(m, 880, 150, `<span style="color:rgba(255,255,255,.6);font-size:26px;font-weight:500">копий</span><span class="n" style="color:${COL.red}">0</span>`, 'padding:8px 26px;font-size:44px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.2);backdrop-filter:blur(24px)');
  const n = cnt.querySelector('.n');
  gsap.set([orig, soft, cnt], { opacity: 0 });
  tl.fromTo(orig, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 0.2)
    .fromTo([soft, cnt], { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.08 }, 0.5);
  clones.forEach((c, i) => tl.fromTo(c, { opacity: 0, x: 0 }, { opacity: 1, x: 150 + i * 150, y: (i % 2) * 18, duration: 0.5, ease: 'power3.out' }, T(28.9) + 0.0 + i * 0.12));
  tl.to(clones, { opacity: 0, scale: 0.5, duration: 0.3, ease: 'power2.in', stagger: 0.04 }, tB - 0.35)
    .to(soft, { opacity: 0, duration: 0.2 }, tB - 0.3);
  // фаза B: кража фото и текста
  const SC = 0.8, OX = 60, OY = 150, CXo = 560;
  const copy = productCard(m, CXo, OY, { glow: '255,77,94', badge: 'Копия', price: '1 790 ₽', seller: 'Чужой продавец' });
  gsap.set(copy, { scale: SC, transformOrigin: '0 0', opacity: 0 });
  const skP = A(copy, 'left:0;top:0;width:440px;height:330px;background:#E4E8F2;z-index:3'), skT = A(copy, 'left:0;top:395px;width:440px;height:150px;background:#fff;z-index:3', `<div style="position:absolute;left:26px;top:30px;width:300px;height:22px;border-radius:8px;background:#E4E8F2"></div><div style="position:absolute;left:26px;top:76px;width:220px;height:20px;border-radius:8px;background:#E4E8F2"></div>`);
  gsap.set(orig, { x: 0 });
  const hl1 = A(m, `left:${OX}px;top:${OY}px;width:${440 * SC}px;height:${330 * SC}px;border:3px solid ${COL.cyan};border-radius:6px;box-shadow:0 0 30px ${COL.cyan};opacity:0;z-index:20`);
  const hl2 = A(m, `left:${OX}px;top:${OY + 395 * SC}px;width:${440 * SC}px;height:${150 * SC}px;border:3px solid ${COL.cyan};border-radius:6px;box-shadow:0 0 30px ${COL.cyan};opacity:0;z-index:20`);
  const gp = A(m, `left:${OX}px;top:${OY}px;width:${440 * SC}px;height:${330 * SC}px;overflow:hidden;opacity:0;z-index:21;box-shadow:0 0 40px rgba(39,211,255,.6)`, photo(440 * SC, 330 * SC, '#2E4A9E', '#DCE6FF', '#A9C2FF', 'gp'));
  const gt = A(m, `left:${OX}px;top:${OY + 395 * SC}px;width:${440 * SC}px;height:${150 * SC}px;background:#fff;color:#0B0F1E;opacity:0;z-index:21;box-shadow:0 0 40px rgba(39,211,255,.6)`, `<div style="position:absolute;left:21px;top:2px;font-size:48px;font-weight:900;letter-spacing:-1px;white-space:nowrap">1 790 ₽</div><div style="position:absolute;left:21px;top:62px;font-size:20px;font-weight:500;color:#3C4358;white-space:nowrap">Куртка демисезонная</div>`);
  const t1 = pill(m, 340, 112, `${ico('copy', 30, '#fff', 2.8)}<span>Фото</span>`, `padding:8px 22px;font-size:30px;background:${COL.red};z-index:25`), t2 = pill(m, 340, 112, `${ico('copy', 30, '#fff', 2.8)}<span>Описание</span>`, `padding:8px 22px;font-size:30px;background:${COL.red};z-index:25`);
  gsap.set([t1, t2], { opacity: 0 });
  const tP = T(31.0), tD = T(32.3);
  tl.fromTo(copy, { opacity: 0, x: 80 }, { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out' }, tB)
    .to(orig, { x: 0, duration: 0.01 }, tB)
    .fromTo(hl1, { opacity: 0 }, { opacity: 1, duration: 0.2 }, tP - 0.2).to(hl1, { opacity: 0, duration: 0.2 }, tP + 0.6)
    .fromTo(t1, { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.3 }, tP - 0.2).to(t1, { opacity: 0, duration: 0.2 }, tP + 0.8)
    .set(gp, { opacity: 1 }, tP).to(gp, { x: CXo - OX, duration: 0.6, ease: 'power3.inOut' }, tP).to(gp, { opacity: 0, duration: 0.01 }, tP + 0.62)
    .to(skP, { opacity: 0, duration: 0.01 }, tP + 0.6)
    .fromTo(hl2, { opacity: 0 }, { opacity: 1, duration: 0.2 }, tD - 0.2).to(hl2, { opacity: 0, duration: 0.2 }, tD + 0.6)
    .fromTo(t2, { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.3 }, tD - 0.2).to(t2, { opacity: 0, duration: 0.2 }, tD + 0.8)
    .set(gt, { opacity: 1 }, tD).to(gt, { x: CXo - OX, duration: 0.6, ease: 'power3.inOut' }, tD).to(gt, { opacity: 0, duration: 0.01 }, tD + 0.62)
    .to(skT, { opacity: 0, duration: 0.01 }, tD + 0.6);
  tl.to(cnt, { opacity: 0, duration: 0.2 }, tB - 0.35).to(orig, { scale: SC, duration: 0.45, ease: 'power3.inOut' }, tB - 0.3);
  S.add((lt) => { n.textContent = Math.round(240 * seg(lt, T(28.9), 1.8, 'power2.out')); });
  return S.done();
}
