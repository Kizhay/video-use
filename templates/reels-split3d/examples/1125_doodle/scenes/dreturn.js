import { board, YEL } from './_ui.js';
export default function setup(ctx) {
  const b = board(ctx, { paper: false, color: YEL, seed: 41 });
  b.ellipse(140, 690, 72, 72, { at: 0.15, dur: 0.5, turns: 0.78, a0: -0.4, color: YEL });
  b.line([[108, 604], [70, 626], [100, 662]], { at: 0.65, dur: 0.15, sharp: true, color: YEL });
  b.cross(140, 690, 44, { at: 0.9, dur: 0.2, color: '#fff', w: 12 });
  b.text('возврат', 140, 830, { size: 84, color: YEL, at: 1.3, dur: 0.5 });
  return b.finish();
}
