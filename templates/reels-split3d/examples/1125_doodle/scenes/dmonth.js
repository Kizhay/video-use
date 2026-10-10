import { board, YEL } from './_ui.js';
export default function setup(ctx) {
  const b = board(ctx, { paper: false, color: YEL, seed: 37 });
  b.rect(850, 590, 190, 210, { at: 0.15, dur: 0.35, r: 16, color: YEL });
  b.line([[850, 650], [1040, 650]], { at: 0.5, dur: 0.15, color: YEL });
  b.line([[890, 570], [890, 610]], { at: 0.65, dur: 0.06, color: '#fff' });
  b.line([[1000, 570], [1000, 610]], { at: 0.71, dur: 0.06, color: '#fff' });
  b.text('30', 945, 730, { size: 110, color: '#fff', at: 0.75, dur: 0.4 });
  b.text('дней', 945, 850, { size: 80, color: YEL, at: 1.3, dur: 0.35 });
  return b.finish();
}
