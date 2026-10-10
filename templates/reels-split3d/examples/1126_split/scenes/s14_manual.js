import { gsap, scene, A, G, pill, ico, win, cursor, typer, seg, clamp, COL, TT } from './_ui.js';
export default function setup(ctx) {
  const S = scene(ctx, { ac: '255,138,0', tilt: [4, -6] });
  const m = S.mock, tl = S.tl, T = TT(ctx);
  win(m, 110, 100, 860, 650, 'Пожаловаться на товар');
  A(m, 'left:156px;top:164px;display:flex;align-items:center;gap:14px;font-size:36px;font-weight:900', `${ico('flag', 42, COL.red)}Жалоба`);
  const field = (y, label, h) => { A(m, `left:156px;top:${y}px;font-size:24px;font-weight:500`, label, 'rm-d'); return A(m, `left:156px;top:${y + 34}px;width:768px;height:${h}px;box-sizing:border-box;border-radius:18px;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.16);padding:0 22px;font-size:30px;font-weight:800;display:flex;align-items:center;white-space:nowrap`); };
  const f1 = field(228, 'Артикул', 66), f2 = field(346, 'Причина', 66);
  const f1t = A(f1, 'position:relative', ''), f2t = A(f2, 'position:relative', '');
  const btn = pill(m, 540, 560, 'Подать жалобу', 'width:768px;height:68px;border-radius:20px;font-size:30px;font-weight:900;background:#005BFF;color:#fff');
  const cnt = A(m, 'left:156px;top:628px;width:768px;text-align:center;font-size:28px;font-weight:500', '', 'rm-d');
  const tag = pill(m, 840, 106, `${ico('clock', 34, '#241100', 2.8)}<span>Вручную</span>`, 'padding:10px 26px;font-size:32px;background:#FF8A00;color:#241100;box-shadow:0 0 50px rgba(255,138,0,.6);rotate:3deg;z-index:9');
  gsap.set(tag, { scale: 0, opacity: 0 });
  const C = [{ t0: 0.5, sku: '1284567890' }, { t0: 3.4, sku: '1377401126' }];
  tl.to(tag, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.7)' }, T(82.5));
  const ty = C.map((c) => typer(f1t, c.sku, c.t0 + 0.2, 0.7));
  S.add((lt) => {
    const first = lt < 3.25, c = first ? C[0] : C[1], t0 = c.t0;
    if (lt >= t0 + 0.1) ty[first ? 0 : 1](lt); else f1t.innerHTML = '';
    f1.style.borderColor = lt > t0 && lt < t0 + 1.0 ? COL.blue : 'rgba(255,255,255,.16)';
    f2t.innerHTML = lt > t0 + 1.25 ? 'Копия карточки' : '<span style="color:rgba(255,255,255,.4)">Выберите…</span>';
    f2.style.borderColor = lt > t0 + 1.0 && lt < t0 + 1.3 ? COL.blue : 'rgba(255,255,255,.16)';
    const sent = first && lt > 2.7;
    btn.innerHTML = sent ? `${ico('check', 34, '#fff', 3)}Подано` : 'Подать жалобу'; btn.style.background = sent ? '#1FAE6B' : '#005BFF';
    cnt.textContent = first ? 'артикул 1 из ?' : 'артикул 2 из ?';
  });
  S.add(cursor(m, [{ t: 0.3, x: 760, y: 190 }, { t: 0.5, x: 420, y: 296, c: true }, { t: 1.7, x: 420, y: 414, c: true }, { t: 2.7, x: 540, y: 566, c: true }, { t: 3.3, x: 420, y: 296, c: true }, { t: 4.4, x: 540, y: 566 }]));
  return S.done();
}
