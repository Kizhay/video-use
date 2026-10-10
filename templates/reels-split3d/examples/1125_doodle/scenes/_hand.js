// Кисть «вид сверху / с тыльной стороны» с загибающимися пальцами (список «загибайте пальцы»).
// Сама рука — counting_hand.js. Здесь расписание: маркер ведёт ОДНУ непрерывную линию контура,
// после замыкания (+0.2 с) проявляются заливка, ногти и складки, затем пальцы сгибаются по таймингам.
// Индексы пальцев: 0 указательный, 1 средний, 2 безымянный, 3 мизинец. Всё — чистая функция времени сцены.
import { makeCountingHand } from './counting_hand.js';

const cl = (x) => Math.max(0, Math.min(1, x));
const FOLD_DUR = 0.34, DRAW_DUR = 1.2, FILL_DUR = 0.2;

/** b — board; o.at — когда начать рисовать; o.instant — рука уже нарисована с первого кадра */
export function fingerHand(b, ctx, o = {}) {
  const { gsap } = ctx;
  const t0 = o.at ?? 0.4, instant = !!o.instant;
  const hand = makeCountingHand(b.svgS, { accent: b.accent });
  const easeFold = gsap.parseEase('power2.inOut');
  const folds = [];
  // невидимый штрих ведёт маркер по тому же контуру, что рисует рука
  if (!instant) b.stroke(hand.outlineD(), { at: t0, dur: DRAW_DUR, opacity: 0, ease: 'none' });
  const end = instant ? 0 : t0 + DRAW_DUR + FILL_DUR;

  /** загнуть палец i в момент at (в instant-сцене at<=0.01 — уже загнут с первого кадра) */
  function fold(i, at) { folds.push({ i, at }); }

  function update(lt) {
    if (instant) hand.setProgress(1, 1);
    else hand.setProgress((lt - t0) / DRAW_DUR, (lt - t0 - DRAW_DUR) / FILL_DUR);
    const k = [0, 0, 0, 0];
    for (const f of folds) k[f.i] = f.at <= 0.01 ? 1 : easeFold(cl((lt - f.at) / FOLD_DUR));
    for (let i = 0; i < 4; i++) hand.setFold(i, k[i]);
  }
  update(0);
  // подключаем update к finish() доски, не меняя сцены
  const finish = b.finish;
  b.finish = () => { const r = finish(); const u = r.update; return { ...r, update(lt, ...a) { u(lt, ...a); update(lt); } }; };
  return { fold, end, hand, update };
}
