import { board, YEL } from './_ui.js';
export default function setup(ctx) {
  const b = board(ctx, { paper: false, color: YEL, seed: 43 });
  b.arrow(945, 660, 985, 230, { at: 0.45, dur: 0.6, color: YEL, bend: 0.2, w: 11 });
  b.text('ссылка', 915, 740, { size: 84, color: YEL, at: 1.15, dur: 0.5 });
  b.text('сервис', 140, 705, { size: 100, color: '#fff', at: 2.5, dur: 0.5 });
  b.ellipse(140, 710, 122, 66, { at: 3.05, dur: 0.4, color: YEL, w: 10 });
  return b.finish();
}
