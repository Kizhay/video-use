import { boot, C, ico, seg, fmt } from './_ui.js';
export default function setup(ctx) {
  const A = boot(ctx, { n: '18', label: 'Результат' });
  const { card, E, tl } = A;
  A.in(E(card, { left: 48, top: 40, height: 96, padding: '0 36px', borderRadius: 999, background: '#EEF4FF', color: C.blue, display: 'flex', alignItems: 'center', fontSize: 52, fontWeight: 800 }, '<span class="nw">2 месяца</span>'), 0.4, { y: 14 });
  const big = E(card, { left: 0, top: 190, width: 952, textAlign: 'center', fontSize: 146, fontWeight: 900, color: C.blue, lineHeight: 1, letterSpacing: -2, whiteSpace: 'nowrap' }, '0'); A.in(big, 0.5, { y: 30 });
  E(card, { left: 0, top: 385, width: 952, textAlign: 'center', fontSize: 64, fontWeight: 800, color: C.gray }, 'копий заблокировано');
  const tr = E(card, { left: 64, top: 540, width: 640, height: 44, borderRadius: 22, background: C.soft });
  const bar = E(tr, { left: 0, top: 0, width: 640, height: 44, borderRadius: 22, background: C.blue, transformOrigin: '0 50%', transform: 'scaleX(0)' });
  const ok = E(card, { left: 770, top: 504, width: 116, height: 116, borderRadius: 58, background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 18px rgba(25,194,122,.35)' }, ico('check', 74, '#fff', 5));
  A.pop(ok, 5.3, { from: 0.2 });
  tl.fromTo(big, { scale: 1 }, { scale: 1.07, duration: .14, ease: 'power2.out' }, 5.3); tl.to(big, { scale: 1, duration: .35, ease: 'back.out(2.2)' }, 5.45);
  A.up((lt) => { const k = Math.pow(seg(lt, 2.4, 2.9, (t) => t), 3); big.textContent = fmt(1000000 * k) + (k >= 1 ? '+' : ''); bar.style.transform = `scaleX(${k})`; });
  return A.done();
}
