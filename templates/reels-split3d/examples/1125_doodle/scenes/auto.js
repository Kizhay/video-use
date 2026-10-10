import { board, BLUE, shapes } from './_ui.js';
export default function setup(ctx) {
  const b = board(ctx, { accent: BLUE, seed: 23 });
  b.text('авто', 540, 400, { size: 210, color: BLUE, at: 0.3, dur: 0.55 });
  const cx = [195, 425, 655, 885];
  cx.forEach((x, i) => {
    b.rect(x - 90, 560, 180, 250, { at: 0.9 + i * 0.2, dur: 0.18, r: 16 });
  });
  // лупа
  b.ellipse(300, 690, 88, 88, { at: 1.7, dur: 0.35, color: BLUE, w: 11 });
  b.line([[362, 752], [450, 850]], { at: 2.05, dur: 0.2, color: BLUE, w: 15 });
  // обводим копии
  b.ellipse(425, 685, 128, 160, { at: 2.4, dur: 0.3, color: BLUE, w: 11 });
  b.ellipse(885, 685, 128, 160, { at: 2.7, dur: 0.3, color: BLUE, w: 11 });
  // жалобы
  b.arrow(425, 880, 425, 1010, { at: 3.1, dur: 0.3, color: BLUE });
  b.arrow(885, 880, 885, 1010, { at: 3.56, dur: 0.3, color: BLUE });
  b.rect(325, 1050, 200, 260, { at: 4.0, dur: 0.3, r: 10 });
  b.rect(785, 1050, 200, 260, { at: 4.3, dur: 0.3, r: 10 });
  b.line(shapes.check(425, 1190, 100), { at: 4.65, dur: 0.22, sharp: true, color: BLUE, w: 13, amp: 0.8 });
  b.line(shapes.check(885, 1190, 100), { at: 4.95, dur: 0.22, sharp: true, color: BLUE, w: 13, amp: 0.8 });
  b.cross(425, 685, 62, { at: 5.35, dur: 0.2, w: 12 });
  b.cross(885, 685, 62, { at: 5.75, dur: 0.2, w: 12 });
  return b.finish();
}
