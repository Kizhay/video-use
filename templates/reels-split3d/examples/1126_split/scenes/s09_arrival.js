import { gsap, scene, A, G, pill, ico, avatar, photo, win, seg, clamp, lerp, COL, TT, pulse } from './_ui.js';
export default function setup(ctx) {
  const S = scene(ctx, { ac: '255,138,0', tilt: [4, -6] });
  const m = S.mock, tl = S.tl, T = TT(ctx);
  // фаза A: доставка
  const A1 = A(m, 'left:0;top:0;width:1080px;height:960px');
  win(A1, 60, 130, 960, 540, 'Отслеживание');
  const n1 = A(A1, 'left:130px;top:250px;display:flex;flex-direction:column;align-items:center;gap:8px;width:150px', `<div style="width:84px;height:84px;border-radius:50%;background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center">${ico('globe', 46, '#fff')}</div><div style="font-size:26px;font-weight:800">Китай</div>`);
  const n2 = A(A1, 'left:800px;top:250px;display:flex;flex-direction:column;align-items:center;gap:8px;width:150px', `<div style="width:84px;height:84px;border-radius:50%;background:rgba(61,139,255,.2);border:2px solid ${COL.blue};display:flex;align-items:center;justify-content:center">${ico('user', 46, '#fff')}</div><div style="font-size:26px;font-weight:800">Вы</div>`);
  const road = A(A1, 'left:210px;top:292px;width:600px;height:6px;border-radius:3px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.3) 0 18px,transparent 18px 34px)');
  const trace = A(A1, `left:210px;top:290px;width:0px;height:10px;border-radius:5px;background:linear-gradient(90deg,${COL.blue},#FF8A00);box-shadow:0 0 18px #FF8A00`);
  const truck = A(A1, 'left:0;top:244px;z-index:5', `<div style="width:80px;height:80px;border-radius:24px;background:#FF8A00;display:flex;align-items:center;justify-content:center;box-shadow:0 0 40px rgba(255,138,0,.7)">${ico('truck', 50, '#241100', 2.6)}</div>`);
  const day = A(A1, 'left:60px;top:430px;width:960px;text-align:center;font-size:150px;font-weight:900;letter-spacing:-4px;line-height:1', '1');
  const dl = A(A1, 'left:60px;top:590px;width:960px;text-align:center;font-size:34px;font-weight:500', 'день в пути', 'rm-d');
  // фаза B: качество
  const B1 = A(m, 'left:0;top:0;width:1080px;height:960px');
  const mk = (x, lab, bad) => { const el = A(B1, `left:${x}px;top:170px;width:430px;height:430px;border-radius:30px;overflow:hidden;background:#fff;box-shadow:0 0 60px rgba(${bad ? '255,77,94' : '61,139,255'},.4),0 30px 70px rgba(0,0,0,.5);transform-origin:50% 50%;${bad ? 'transform:rotate(3deg)' : ''}`,
    `<div style="${bad ? 'filter:grayscale(.8) contrast(.8) brightness(.9) blur(1.2px)' : ''}">${photo(430, 430, bad ? '#8A8FA6' : '#2E4A9E', bad ? '#B9BCC6' : '#DCE6FF', bad ? '#8C8F9B' : '#A9C2FF', 'ar' + x)}</div>
     <div class="rm-p" style="left:16px;top:16px;padding:7px 20px;font-size:26px;background:${bad ? COL.red : COL.blue}">${lab}</div>`); return el; };
  const pf = mk(70, 'На фото', false), pr = mk(580, 'Пришло', true);
  const arrow = A(B1, 'left:512px;top:350px;width:56px;text-align:center', ico('arrow', 56, '#fff', 3));
  const q = pill(B1, 800, 640, `${ico('question', 42, '#fff', 2.8)}<span>Качество?</span>`, `padding:12px 32px;font-size:38px;background:${COL.red};box-shadow:0 0 50px rgba(255,77,94,.6);rotate:3deg`);
  const no = pill(B1, 285, 640, `${ico('check', 40, '#06301C', 3.2)}<span>Красиво</span>`, 'padding:12px 32px;font-size:38px;background:#2BE38B;color:#06301C');
  gsap.set(B1, { opacity: 0 }); gsap.set([q, no], { scale: 0, opacity: 0 });
  gsap.set(A1, { opacity: 0 });
  const tB = T(50.1);
  tl.fromTo(A1, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 0.2)
    .to(A1, { opacity: 0, x: -120, duration: 0.3, ease: 'power2.in' }, tB - 0.2)
    .set(B1, { opacity: 1 }, tB + 0.1)
    .fromTo([pf, pr], { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', stagger: 0.12 }, tB + 0.1)
    .to(no, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }, tB + 0.8)
    .to(q, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.6)' }, tB + 1.3);
  S.add((lt) => {
    const k = seg(lt, 0.5, 2.5, 'power1.inOut'), x = lerp(250, 730, k);
    truck.style.transform = `translate(${x}px,0)`; trace.style.width = (x - 210 + 30) + 'px';
    day.textContent = Math.max(1, Math.round(1 + 29 * seg(lt, T(48.6), 1.3, 'power2.inOut')));
    day.style.color = lt > T(48.6) + 1.0 ? '#FF8A00' : '#fff'; dl.textContent = lt > T(48.6) + 1.0 ? 'дней в пути' : 'день в пути';
    q.style.filter = `brightness(${1 + 0.15 * pulse(lt, 7)})`;
  });
  return S.done();
}
