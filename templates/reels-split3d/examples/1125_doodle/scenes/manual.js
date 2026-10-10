import { board, RED, PAPER } from './_ui.js';
export default function setup(ctx) {
  const b = board(ctx, { accent: RED, seed: 19 });
  const sheet = (x, y) => `M${x} ${y}h560v800h-560z`;
  b.rect(318, 392, 560, 800, { at: 0.3, dur: 0.3, r: 8 });
  b.rect(284, 426, 560, 800, { at: 0.6, dur: 0.3, r: 8 });
  b.fill(sheet(250, 460), { color: PAPER, at: 0.9, dur: 0.05 });
  b.rect(250, 460, 560, 800, { at: 0.9, dur: 0.45, r: 8 });
  b.text('Жалоба', 530, 550, { size: 120, at: 1.4, dur: 0.5 });
  for (let i = 0; i < 5; i++) {
    const y = 700 + i * 105, t = 2.0 + i * 0.45;
    b.line([[300, y], [380, y - 8], [450, y + 4], [520, y - 6], [600, y]], { at: t, dur: 0.27, amp: 3 });
    b.line([[660, y - 4], [690, y + 24], [750, y - 34]], { at: t + 0.27, dur: 0.15, sharp: true, amp: 0.8 });
  }
  b.cross(530, 860, 250, { at: 4.4, dur: 0.3, color: RED, w: 16 });
  return b.finish();
}
