import { gsap, scene, A, G, pill, ico, avatar, photo, chart, counter, seg, lerp, COL, TT, pulse } from './_ui.js';
export default function setup(ctx) {
  const S = scene(ctx, { ac: '61,139,255', tilt: [4, -7] });
  const m = S.mock, tl = S.tl, T = TT(ctx);
  // левая — продавец
  const L = G(m, 44, 110, 480, 620, 'border-color:rgba(255,77,94,.4)');
  const lh = A(m, 'left:80px;top:140px;display:flex;align-items:center;gap:18px', `${avatar(76, '#3D8BFF', '#27D3FF', '#06122E')}<div style="font-size:40px;font-weight:900">Продавец</div>`);
  const lc = chart(m, 76, 290, 416, 230, (u) => 0.88 - 0.7 * Math.pow(u, 1.6), COL.red);
  const lv = A(m, 'left:80px;top:546px;font-size:60px;font-weight:900;letter-spacing:-1px;white-space:nowrap', '184 000 ₽');
  const ll = A(m, 'left:80px;top:624px;font-size:26px;font-weight:500', 'заработок', 'rm-d');
  // правая — покупатель
  const R = G(m, 556, 110, 480, 620, 'border-color:rgba(61,139,255,.4)');
  const rh = A(m, 'left:592px;top:140px;display:flex;align-items:center;gap:18px', `${avatar(76, '#8D7CFF', '#26407C')}<div style="font-size:40px;font-weight:900">Покупатель</div>`);
  const ph = (x, lab, c) => A(m, `left:${x}px;top:290px;width:196px;height:200px;border-radius:22px;overflow:hidden;box-shadow:0 0 30px rgba(61,139,255,.25)`, `${photo(196, 200, c, '#DCE6FF', '#A9C2FF', 'q' + x)}<div class="rm-p" style="left:10px;top:10px;padding:5px 14px;font-size:19px;background:rgba(11,15,30,.8);border-radius:10px">${lab}</div>`);
  const p1 = ph(590, 'Оригинал', '#2E4A9E'), p2 = ph(824, 'Копия', '#2E4A9E');
  const eq = A(m, 'left:790px;top:362px;width:40px;text-align:center;font-size:52px;font-weight:900', '?');
  const q = pill(m, 796, 600, `${ico('question', 44, '#fff', 2.8)}<span>Обман</span>`, `padding:14px 34px;font-size:36px;background:${COL.blue};box-shadow:0 0 50px rgba(61,139,255,.6)`);
  const rl = A(m, 'left:596px;top:520px;width:400px;font-size:28px;font-weight:500;white-space:normal', 'какой товар придёт?', 'rm-d');
  gsap.set([L, lh, lc.el, lv, ll], { opacity: 0 }); gsap.set([R, rh, p1, p2, eq, rl], { opacity: 0 }); gsap.set(q, { scale: 0, opacity: 0 });
  const t1 = 0.12, t2 = T(12.8);
  tl.fromTo([L, lh, lc.el, lv, ll], { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out', stagger: 0.07 }, t1)
    .fromTo([R, rh, p1, p2, eq, rl], { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out', stagger: 0.07 }, t2)
    .to(q, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.6)' }, t2 + 0.7);
  S.add((lt) => {
    lc(seg(lt, t1 + 0.4, 3.4, 'power1.inOut'));
    const k = seg(lt, t1 + 0.4, 3.4, 'power2.inOut'); lv.textContent = Math.round(lerp(184, 61, k)) + ' 000 ₽'; lv.style.color = k > 0.5 ? COL.red : '#fff';
    eq.style.transform = `scale(${1 + 0.15 * pulse(lt, 7)})`;
  });
  return S.done();
}
