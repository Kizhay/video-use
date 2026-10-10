import { board, YEL } from './_ui.js';
export default function setup(ctx) {
  const b = board(ctx, { paper: false, color: YEL, seed: 31 });
  b.text('годами', 925, 640, { size: 84, color: YEL, at: 0.15, dur: 0.55 });
  b.underline(830, 1020, 700, { at: 0.75, dur: 0.3, color: YEL });
  [0, 1, 2, 3].forEach((i) => b.line([[865 + i * 34, 770], [868 + i * 34, 860]], { at: 1.15 + i * 0.12, dur: 0.1, color: YEL, amp: 1.5 }));
  b.line([[848, 850], [1000, 780]], { at: 1.65, dur: 0.18, color: YEL, amp: 1.5 });
  return b.finish();
}
