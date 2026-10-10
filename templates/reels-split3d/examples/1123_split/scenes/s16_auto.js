import { boot, C, ico } from './_ui.js';
import { svgI, FLAG } from './_h.js';
export default function setup(ctx) {
  const A = boot(ctx, { n: '16', label: 'Наш сервис' });
  const { card, E, S, tl } = A;
  const cw = 250, gap = 53;
  [['Поиск', 'scan', 3.2], ['Копии', 'box', 4.2], ['Жалобы', null, 5.4]].forEach(([t, ic, at], i) => {
    const x = 48 + i * (cw + gap);
    const c = E(card, { left: x, top: 50, width: cw, height: 380, borderRadius: 28, background: i === 2 ? '#EEF4FF' : C.soft, border: i === 2 ? `4px solid ${C.blue}` : '0' });
    E(c, { left: 50, top: 40, width: 150, height: 150, borderRadius: 75, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }, ic ? ico(ic, 94, C.blue, 3.4) : svgI(FLAG, 88, C.blue, 3.4));
    E(c, { left: 0, top: 245, width: cw, textAlign: 'center', fontSize: 46, fontWeight: 900 }, t);
    A.pop(c, at, { from: 0.6 });
    if (i < 2) { const ar = S(card, 50, 30, `<path class="a" d="M2 15H44M32 4l12 11-12 11" stroke="${C.blue}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`, { left: x + cw + 1, top: 225 }); A.draw(ar.querySelector('.a'), at + 0.45, 0.4); }
  });
  const auto = E(card, { left: 126, top: 500, width: 700, height: 130, borderRadius: 999, background: C.blue, color: '#fff', fontSize: 66, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 26px rgba(0,91,255,.35)' }, '<span class="nw">автоматически</span>');
  A.pop(auto, 0.6, { from: 0.6 });
  tl.fromTo(auto, { boxShadow: '0 12px 26px rgba(0,91,255,.35)' }, { boxShadow: '0 0 0 14px rgba(0,91,255,.18)', duration: 0.6, repeat: 5, yoyo: true, ease: 'sine.inOut' }, 1.5);
  return A.done();
}
