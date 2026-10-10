import { board, RED, shapes } from './_ui.js';
export default function setup(ctx) {
  const b = board(ctx, { accent: RED, seed: 3 });
  // магазин: корпус, вывеска, навес
  b.line([[290, 600], [290, 1010], [790, 1010], [790, 600]], { at: 0.4, dur: 0.45, sharp: true, amp: 2.4 });
  b.rect(230, 470, 620, 120, { at: 0.85, dur: 0.3, r: 14 });
  const wave = []; for (let i = 0; i <= 12; i++) wave.push([230 + (620 * i) / 12, 596 + (i % 2 ? 40 : 0)]);
  b.line(wave, { at: 1.15, dur: 0.3, amp: 1.5 });
  b.text('OZON', 540, 534, { size: 135, at: 1.45, dur: 0.5, weight: 700 });
  // «злое» лицо магазина
  b.ellipse(430, 790, 36, 46, { at: 2.0, dur: 0.14, turns: 1.05 });
  b.ellipse(650, 790, 36, 46, { at: 2.14, dur: 0.14, turns: 1.05 });
  b.ellipse(446, 804, 9, 11, { at: 2.28, dur: 0.06, turns: 1.1, w: 12 });
  b.ellipse(634, 804, 9, 11, { at: 2.34, dur: 0.06, turns: 1.1, w: 12 });
  b.line([[400, 890], [470, 962], [540, 985], [610, 962], [680, 890]], { at: 2.4, dur: 0.3 });
  b.line([[408, 893], [440, 942], [472, 910], [505, 952], [540, 915], [575, 952], [608, 910], [640, 942], [672, 893]], { at: 2.7, dur: 0.3, sharp: true, amp: 1, w: 7 });
  // обман
  b.text('Обман!', 540, 1250, { size: 260, color: RED, at: 3.05, dur: 0.55 });
  b.underline(280, 800, 1395, { color: RED, at: 3.65, dur: 0.3, w: 11 });
  return b.finish();
}
