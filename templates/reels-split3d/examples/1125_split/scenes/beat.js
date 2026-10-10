// Универсальная сцена: всё описывается в params (абсолютные секунды ролика).
import { init } from './_ui.js';
export default function setup(ctx) {
  const p = ctx.params, st = ctx.start;
  const S = init(ctx, p.key, p.prev, { noWipe: !!p.noWipe });
  const r = (a) => Math.max(0.05, a - st);
  if (p.icon) S.icon(p.icon.name, { at: r(p.icon.at), size: p.icon.size ?? 160, y: p.icon.y ?? 70, color: p.icon.color });
  for (const l of p.lines || []) {
    let L;
    if (l.typed) L = S.typed(l.y, '', l.t, { size: l.size, at: r(l.in), step: 0.12, plate: l.plate });
    else {
      L = S.line({ t: l.t, size: l.size, y: l.y, hl: l.hl, ac: l.ac, color: l.color, plate: l.plate, pc: l.pc, acColor: l.acColor });
      L.in(r(l.in), { pop: l.pop });
    }
    if (l.out) L.out(r(l.out));
  }
  return S.finish({ hold: !!p.hold });
}
