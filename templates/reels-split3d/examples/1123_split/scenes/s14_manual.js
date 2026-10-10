import { boot, C, tile } from './_ui.js';
export default function setup(ctx) {
  const A = boot(ctx, { n: '14', label: 'Жалобы вручную' });
  const { card, E, tl } = A;
  A.in(E(card, { left: 0, top: 30, width: 952, textAlign: 'center', fontSize: 84, fontWeight: 900 }, 'жаловаться?'), 0.4);
  const no = E(card, { left: 0, top: 140, width: 952, textAlign: 'center', fontSize: 100, fontWeight: 900, color: C.red, lineHeight: 1, whiteSpace: 'nowrap' }, 'бессмысленно');
  A.pop(no, 4.0, { from: 0.8 });
  for (let i = 0; i < 5; i++) {
    const x = 48 + i * 176, y = 320;
    const t = tile(card, { x, y, w: 160, h: 220, copy: true, price: null }); const b = t.querySelector('.badge'); b.style.fontSize = '28px'; b.style.padding = '2px 12px';
    A.in(t, 1.0 + i * 0.12, { y: 20 });
    const btn = E(card, { left: x, top: 560, width: 160, height: 70, borderRadius: 16, background: C.soft, color: C.ink, fontSize: 36, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }, '<span class="nw">жалоба</span>');
    A.in(btn, 1.4 + i * 0.1, { y: 14 });
    if (i < 2) tl.to(btn, { background: C.green, color: '#fff', duration: 0.25 }, 5.2 + i * 0.9);
  }
  return A.done();
}
