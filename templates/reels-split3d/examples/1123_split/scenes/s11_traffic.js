import { boot, C, seg } from './_ui.js';
import { svgI, DOWN } from './_h.js';
export default function setup(ctx) {
  const A = boot(ctx, { n: '11', label: 'Потеря 1: трафик' });
  const { card, E, S } = A;
  const R = 185, circ = 2 * Math.PI * R;
  const sv = S(card, 440, 440, `<circle cx="220" cy="220" r="${R}" fill="none" stroke="${C.soft}" stroke-width="50"/><circle class="a" cx="220" cy="220" r="${R}" fill="none" stroke="${C.blue}" stroke-width="50" stroke-linecap="round" transform="rotate(-90 220 220)" stroke-dasharray="${circ}" stroke-dashoffset="0"/>`, { left: 30, top: 60 });
  const arc = sv.querySelector('.a');
  A.in(sv, 0.4, { y: 30 });
  const pct = E(card, { left: 30, top: 232, width: 440, textAlign: 'center', fontSize: 112, fontWeight: 900, lineHeight: 1 }, '100%');
  E(card, { left: 30, top: 540, width: 440, textAlign: 'center', fontSize: 50, fontWeight: 800, color: C.gray }, 'ваш трафик');
  const lost = E(card, { left: 500, top: 60, width: 420, height: 220, borderRadius: 28, background: '#FFECEE', color: C.red, fontSize: 74, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }, `${svgI(DOWN, 76, C.red, 5)}<span class="nw">трафик</span>`);
  A.pop(lost, 3.4, { from: 0.5 });
  for (let i = 0; i < 3; i++) { const t = E(card, { left: 500 + i * 150, top: 330, width: 120, height: 170, borderRadius: 20, background: '#EDF0F6', border: `2px solid ${C.line}` }); A.pop(t, 4.6 + i * 0.35, { from: 0.4, d: 0.35 }); }
  E(card, { left: 500, top: 540, width: 420, fontSize: 46, fontWeight: 800, color: C.gray }, 'соседи');
  A.up((lt) => { const k = seg(lt, 3.6, 4.4, (t) => t); arc.setAttribute('stroke-dashoffset', circ * 0.55 * k); pct.textContent = Math.round(100 - 55 * k) + '%'; });
  return A.done();
}
