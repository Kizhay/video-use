import { board, BLUE, shapes } from './_ui.js';
import { fingerHand } from './_hand.js';
export default function setup(ctx) {
  const b = board(ctx, { accent: BLUE, seed: 13 });
  const h = fingerHand(b, ctx, { at: 0.35 });
  // пункт 1: трафик
  h.fold(0, 1.75);
  b.text('1', 170, 1010, { size: 170, color: BLUE, at: 1.75, dur: 0.2 });
  b.text('трафик', 290, 1010, { size: 150, anchor: 'l', at: 2.0, dur: 0.6 });
  b.ellipse(830, 1010, 62, 62, { at: 2.75, dur: 0.3, color: BLUE });
  b.text('₽', 830, 1012, { size: 100, color: BLUE, at: 3.05, dur: 0.2 });
  b.arrow(905, 985, 1020, 880, { at: 3.35, dur: 0.35, color: BLUE, bend: -0.25 });
  b.text('−₽', 560, 1150, { size: 120, color: BLUE, rot: -4, at: 5.0, dur: 0.4, anchor: 'c' });
  // пункт 2: конверсия
  h.fold(2, 6.05);  // безымянный: средний остаётся стоять (шутка)
  b.text('2', 170, 1330, { size: 170, color: BLUE, at: 6.05, dur: 0.2 });
  b.text('конверсия', 290, 1330, { size: 150, anchor: 'l', at: 6.3, dur: 0.75 });
  // тележка + стрелка вниз
  b.line([[790, 1250], [830, 1250], [860, 1360], [990, 1360], [1015, 1280], [845, 1280]], { at: 7.15, dur: 0.35, sharp: true, amp: 1.2, color: BLUE });
  b.ellipse(885, 1400, 14, 14, { at: 7.5, dur: 0.08, color: BLUE, w: 10 });
  b.ellipse(965, 1400, 14, 14, { at: 7.58, dur: 0.08, color: BLUE, w: 10 });
  return b.finish();
}
