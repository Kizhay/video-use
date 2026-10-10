import { board, BLUE, shapes } from './_ui.js';
export default function setup(ctx) {
  const b = board(ctx, { accent: BLUE, seed: 29 });
  b.text('2 месяца', 540, 400, { size: 130, at: 0.2, dur: 0.5 });
  b.underline(330, 750, 470, { at: 0.75, dur: 0.25, color: BLUE });
  b.line([[540, 560], [690, 600], [695, 780], [540, 900], [385, 780], [390, 600], [540, 560], [560, 563]], { at: 1.1, dur: 0.6, color: BLUE, w: 11 });
  b.line(shapes.check(540, 735, 190), { at: 1.8, dur: 0.35, sharp: true, color: BLUE, w: 17, amp: 1 });
  b.text('1 000 000+', 540, 1140, { size: 215, color: BLUE, at: 2.6, dur: 0.95 });
  b.underline(180, 900, 1290, { at: 3.65, dur: 0.3, color: BLUE, w: 11 });
  b.underline(260, 820, 1340, { at: 3.95, dur: 0.25, color: BLUE, w: 11 });
  return b.finish();
}
