import { gsap, scene, A, G, pill, ico, photo, win, cursor, seg, clamp, COL, TT, pulse } from './_ui.js';
export default function setup(ctx) {
  const S = scene(ctx, { ac: '255,77,94', tilt: [4, -6] });
  const m = S.mock, tl = S.tl, T = TT(ctx);
  win(m, 60, 110, 960, 650, 'Мои возвраты');
  const item = A(m, 'left:100px;top:176px;width:880px;height:130px;display:flex;align-items:center;gap:24px', `<div style="width:130px;height:130px;border-radius:20px;overflow:hidden;flex:none">${photo(130, 130, '#6A7088', '#B9BCC6', '#8C8F9B', 'rt')}</div><div><div style="font-size:36px;font-weight:900">Куртка демисезонная</div><div class="rm-d" style="font-size:26px;font-weight:500;margin-top:8px">Получена · не подошла</div></div><div style="margin-left:auto;font-size:44px;font-weight:900">1 890 ₽</div>`);
  const btn = pill(m, 540, 380, `${ico('ret', 40, '#fff', 2.8)}<span class="bt">Оформить возврат</span>`, 'width:880px;height:84px;border-radius:24px;font-size:38px;background:#005BFF;color:#fff');
  const bt = btn.querySelector('.bt');
  const res = A(m, 'left:100px;top:450px;width:880px;height:110px;border-radius:24px;background:rgba(255,77,94,.14);border:2px solid rgba(255,77,94,.7);box-shadow:0 0 50px rgba(255,77,94,.3);display:flex;align-items:center;gap:20px;padding:0 28px;box-sizing:border-box', `${ico('cross', 54, COL.red, 3)}<div><div style="font-size:38px;font-weight:900">Возврат невозможен</div></div>`);
  const route = A(m, 'left:100px;top:590px;width:880px;height:110px;display:flex;align-items:center;justify-content:center;gap:26px', `<div class="rm-p" style="position:static;padding:12px 30px;font-size:36px;background:rgba(255,255,255,.1);border:1.5px solid rgba(255,255,255,.3)">${ico('globe', 40, '#fff')}Китай</div>${ico('arrow', 54, COL.red, 3)}<div class="rm-p" style="position:static;padding:12px 30px;font-size:36px;background:rgba(255,255,255,.1);border:1.5px solid rgba(255,255,255,.3)">${ico('box', 40, '#fff')}Россия</div>`);
  gsap.set([item, btn, res, route], { opacity: 0 });
  const tClick = T(56.4), tCountry = T(58.3);
  tl.fromTo([item, btn], { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.1 }, 0.3)
    .fromTo(res, { opacity: 0, scale: 0.9, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(1.4)' }, tClick + 0.9)
    .fromTo(route, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, tCountry);
  S.add(cursor(m, [{ t: 1.0, x: 700, y: 600 }, { t: tClick + 0.1, x: 540, y: 392, c: true }], { until: tClick + 0.9 }));
  S.add((lt) => { bt.textContent = lt > tClick + 0.1 ? (lt > tClick + 0.9 ? 'Оформить возврат' : 'Проверяем…') : 'Оформить возврат'; btn.style.background = lt > tClick + 0.9 ? 'rgba(255,255,255,.12)' : '#005BFF'; });
  return S.done();
}
