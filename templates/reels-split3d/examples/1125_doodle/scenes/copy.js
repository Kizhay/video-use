import { board, BLUE, shapes } from './_ui.js';
export default function setup(ctx) {
  const b = board(ctx, { accent: BLUE, seed: 5 });
  // ноутбук
  b.rect(320, 330, 440, 290, { at: 0.4, dur: 0.4, r: 18 });
  b.line([[290, 625], [250, 678], [830, 678], [790, 625]], { at: 0.8, dur: 0.3, sharp: true });
  b.text('софт', 540, 470, { size: 130, color: BLUE, at: 1.1, dur: 0.45 });
  b.arrow(540, 720, 540, 855, { at: 1.65, dur: 0.35, color: BLUE });
  // оригинал
  b.rect(390, 890, 300, 380, { at: 2.15, dur: 0.4, r: 22 });
  b.line(shapes.tee(540, 1050, 190), { at: 2.55, dur: 0.5, sharp: true, amp: 1.6 });
  b.line([[430, 1210], [650, 1210]], { at: 3.05, dur: 0.12 });
  // копии (синие)
  b.rect(70, 960, 250, 320, { at: 3.1, dur: 0.3, r: 20, color: BLUE });
  b.line(shapes.tee(195, 1100, 150), { at: 3.4, dur: 0.3, sharp: true, amp: 1.4, color: BLUE });
  b.rect(760, 960, 250, 320, { at: 3.75, dur: 0.3, r: 20, color: BLUE });
  b.line(shapes.tee(885, 1100, 150), { at: 4.05, dur: 0.3, sharp: true, amp: 1.4, color: BLUE });
  b.text('×1000', 540, 1440, { size: 150, color: BLUE, at: 4.4, dur: 0.5 });
  return b.finish();
}
