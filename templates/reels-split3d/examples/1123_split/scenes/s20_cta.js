import { boot, C, ico } from './_ui.js';
export default function setup(ctx) {
  const A = boot(ctx, { n: '20', label: 'Что делать', exit: false, breath: false });
  const { card, E } = A;
  const row = (top, ic, sub, txt, col, bg, at) => {
    const a = E(card, { left: 48, top, width: 856, height: 220, borderRadius: 28, background: bg });
    E(a, { left: 36, top: 45, width: 130, height: 130, borderRadius: 65, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }, ico(ic, 76, C.blue, 3.4));
    E(a, { left: 200, top: 30, fontSize: 42, fontWeight: 800, color: C.gray, whiteSpace: 'nowrap' }, sub);
    E(a, { left: 200, top: 90, fontSize: 66, fontWeight: 900, color: col, whiteSpace: 'nowrap' }, txt);
    A.in(a, at, { y: 40 });
  };
  row(30, 'link', 'вариант 1', 'ссылка в шапке', C.ink, '#EEF4FF', 0.9);
  row(270, 'send', 'вариант 2', '«сервис»', C.blue, C.soft, 3.1);
  const f = E(card, { left: 48, top: 520, width: 856, height: 120, borderRadius: 999, background: C.green, color: '#fff', fontSize: 62, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 26px rgba(25,194,122,.4)' }, '<span class="nw">тест бесплатно</span>');
  A.pop(f, 5.2, { from: 0.6 });
  return A.done();
}
