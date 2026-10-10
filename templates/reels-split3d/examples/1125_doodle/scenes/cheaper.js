import { board, RED, PAPER } from './_ui.js';
export default function setup(ctx) {
  const b = board(ctx, { accent: RED, seed: 9 });
  b.rect(240, 380, 600, 760, { at: 0.3, dur: 0.5, r: 26 });
  b.rect(280, 420, 520, 360, { at: 0.8, dur: 0.35, r: 14 });
  b.ellipse(660, 520, 44, 44, { at: 1.15, dur: 0.18 });
  b.line([[300, 760], [430, 590], [520, 690], [610, 610], [780, 760]], { at: 1.33, dur: 0.3, sharp: true, amp: 1.4 });
  b.line([[290, 850], [780, 850]], { at: 1.7, dur: 0.18, amp: 3 });
  b.line([[290, 925], [780, 925]], { at: 1.9, dur: 0.18, amp: 3 });
  b.line([[290, 1000], [620, 1000]], { at: 2.1, dur: 0.15, amp: 3 });
  // приклейка: лента-скотч + плашка
  b.hatch(440, 1118, 200, 46, { gap: 22, at: 2.55, dur: 0.3, color: RED, opacity: 0.55 });
  b.rect(200, 1150, 680, 170, { at: 2.9, dur: 0.4, r: 36, color: RED, w: 11 });
  b.text('Есть подешевле', 540, 1240, { size: 98, color: RED, at: 3.4, dur: 0.8 });
  b.text('−200 ₽', 790, 1455, { size: 130, color: RED, rot: -7, at: 4.35, dur: 0.45 });
  return b.finish();
}
