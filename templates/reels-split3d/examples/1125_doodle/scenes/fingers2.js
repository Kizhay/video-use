import { board, BLUE, shapes } from './_ui.js';
import { fingerHand } from './_hand.js';
export default function setup(ctx) {
  const b = board(ctx, { accent: BLUE, seed: 17 });
  const h = fingerHand(b, ctx, { instant: true });
  h.fold(0, 0); h.fold(2, 0);   // указательный и безымянный уже загнуты
  // позиции в выдаче: график вниз
  b.text('позиции', 290, 1010, { size: 150, anchor: 'l', at: 0.45, dur: 0.7 });
  b.line([[790, 900], [790, 1090], [1010, 1090]], { at: 1.3, dur: 0.3, sharp: true, amp: 1.2 });
  b.arrow(805, 925, 1000, 1070, { at: 1.65, dur: 0.5, color: BLUE, bend: 0.22, w: 11 });
  // пункт 3: прибыль
  h.fold(3, 3.0);   // мизинец; средний остаётся стоять
  b.text('3', 170, 1330, { size: 170, color: BLUE, at: 3.0, dur: 0.2 });
  b.text('прибыль', 290, 1330, { size: 150, anchor: 'l', at: 3.3, dur: 0.75 });
  b.ellipse(840, 1330, 62, 62, { at: 4.4, dur: 0.3, color: BLUE });
  b.text('₽', 840, 1332, { size: 100, color: BLUE, at: 4.7, dur: 0.2 });
  b.arrow(915, 1330, 1030, 1330, { at: 5.0, dur: 0.3, color: BLUE });
  // человечек уходит
  b.ellipse(990, 1500, 20, 20, { at: 5.7, dur: 0.15 });
  b.line([[990, 1522], [990, 1610]], { at: 5.85, dur: 0.12 });
  b.line([[950, 1552], [990, 1565], [1030, 1545]], { at: 5.95, dur: 0.15, sharp: true });
  b.line([[960, 1690], [990, 1610], [1025, 1685]], { at: 6.1, dur: 0.2, sharp: true });
  return b.finish();
}
