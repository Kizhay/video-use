import { gsap, scene, A, G, pill, ico, avatar, win, seg, clamp, COL, rngf, TT } from './_ui.js';
export default function setup(ctx) {
  const S = scene(ctx, { ac: '39,211,255', tilt: [4, -6] });
  const m = S.mock, tl = S.tl, T = TT(ctx);
  const mono = "font-family:Menlo,'Courier New',monospace;";
  win(m, 50, 90, 610, 470, 'bash: support');
  const cmd = [[0.5, '$ ozon-support --scan', COL.cyan], [1.0, '> чат поддержки: найден', '#fff'], [1.5, '> очередь: обход', '#fff'], [2.0, '> токен: 9f3a·c71e·b208', '#7DB2FF'], [2.55, '> доступ: получен', COL.green]];
  const rows = cmd.map(([, , c], i) => A(m, `left:84px;top:${142 + i * 40}px;font-size:25px;font-weight:700;color:${c};${mono}`));
  const stream = Array.from({ length: 8 }, (_, i) => A(m, `left:84px;top:${356 + i * 24}px;font-size:18px;color:rgba(39,211,255,.55);${mono}`));
  const hexline = (seed) => { const r = rngf(seed * 7919 + 13); let s = ''; for (let i = 0; i < 6; i++) s += Math.floor(r() * 65535).toString(16).padStart(4, '0') + ' '; return s + (r() > 0.5 ? '▓▒░' : '░▒▓'); };
  const chat = G(m, 610, 180, 400, 380, 'border-color:rgba(39,211,255,.45)', '');
  const head = A(m, 'left:640px;top:208px;display:flex;align-items:center;gap:16px', `${avatar(64, '#3D8BFF', '#27D3FF', '#06122E')}<div><div style="font-size:28px;font-weight:900">Поддержка OZON</div><div style="font-size:20px;font-weight:500;color:${COL.green}">● в сети</div></div>`);
  const b1 = A(m, 'left:640px;top:310px;width:300px;padding:16px 22px;box-sizing:border-box;border-radius:22px 22px 22px 6px;background:rgba(255,255,255,.1);font-size:24px;font-weight:500;white-space:normal', 'Здравствуйте! Чем помочь?');
  const b2 = A(m, 'left:690px;top:408px;width:290px;padding:16px 22px;box-sizing:border-box;border-radius:22px 22px 6px 22px;background:#005BFF;font-size:24px;font-weight:700;white-space:normal', 'Есть вопрос по карточке');
  const ok = pill(m, 810, 150, `${ico('lock', 38, '#06301C', 3)}<span>Доступ открыт</span>`, 'padding:12px 28px;font-size:30px;background:#2BE38B;color:#06301C;box-shadow:0 0 60px rgba(43,227,139,.6);rotate:3deg;z-index:9');
  gsap.set(ok, { scale: 0, opacity: 0 }); gsap.set([chat, head, b1, b2], { opacity: 0 });
  const tc = T(2.8);
  tl.fromTo([chat, head], { opacity: 0, scale: 0.85, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.4)' }, tc)
    .fromTo(b1, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }, tc + 0.25)
    .fromTo(b2, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }, tc + 0.6)
    .to(ok, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.6)' }, 2.6);
  S.add((lt) => {
    rows.forEach((r, i) => { const [t0, txt] = cmd[i]; const n = Math.floor(clamp((lt - t0) / (txt.length * 0.022)) * txt.length); r.textContent = txt.slice(0, n) + (n < txt.length && n > 0 ? '▌' : ''); });
    const k = Math.floor(lt * 10), on = clamp((lt - 0.9) / 0.4);
    stream.forEach((s, i) => { s.textContent = hexline(k + i); s.style.opacity = on * (0.35 + 0.65 * (i / 7)); });
  });
  return S.done();
}
