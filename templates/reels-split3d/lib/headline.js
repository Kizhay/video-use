// Кликбейт-заголовок первых секунд: строки «влетают» по очереди с ударом,
// лёгкая тряска, в конце сжимаются и исчезают.
import { easeOutBack, easeOutCubic, easeInCubic, clamp01 } from './kit.js';

export function buildHeadline(root, h) {
  if (!h) return null;
  const wrap = document.createElement('div');
  Object.assign(wrap.style, { position: 'absolute', left: '50%', top: (h.y ?? 960) + 'px', width: '1000px',
    transform: 'translate(-50%,-50%)', textAlign: 'center', fontFamily: 'MB', fontWeight: '900' });
  root.appendChild(wrap);
  const scrim = document.createElement('div');
  Object.assign(scrim.style, { position: 'absolute', left: '0', top: '0', width: '1080px', height: '1920px',
    background: 'radial-gradient(ellipse at 50% ' + (h.y ?? 960) + 'px, rgba(0,0,0,.72) 0%, rgba(0,0,0,.45) 45%, rgba(0,0,0,0) 75%)' });
  root.insertBefore(scrim, wrap);
  const lines = h.lines.map((L) => {
    const d = document.createElement('div');
    d.innerHTML = L.text;
    Object.assign(d.style, { display: 'inline-block', fontSize: (L.size ?? 104) + 'px', lineHeight: '1.02',
      color: L.color ?? '#fff', background: L.bg ?? 'transparent', padding: L.bg ? '8px 30px 14px' : '0',
      borderRadius: '22px', margin: '10px 0', textTransform: 'uppercase', letterSpacing: '1px',
      WebkitTextStroke: L.bg ? '0' : '14px #000', paintOrder: 'stroke fill',
      textShadow: L.bg ? 'none' : '0 10px 0 rgba(0,0,0,.6)',
      boxShadow: L.bg ? '0 18px 50px rgba(0,0,0,.55)' : 'none', transformOrigin: '50% 50%' });
    const row = document.createElement('div'); row.appendChild(d); wrap.appendChild(row);
    return { d, L };
  });
  return { h, wrap, scrim, lines };
}

export function drawHeadline(st, t) {
  if (!st) return;
  const { h, wrap, scrim, lines } = st;
  const a = h.start ?? 0, b = h.end ?? 3;
  if (t < a || t > b) { wrap.style.display = scrim.style.display = 'none'; return; }
  wrap.style.display = scrim.style.display = 'block';
  const lt = t - a, out = clamp01((t - (b - 0.22)) / 0.22);
  scrim.style.opacity = clamp01(lt / 0.15) * (1 - out);
  const shake = lt < 0.9 ? Math.sin(lt * 70) * 6 * (1 - lt / 0.9) : 0;
  wrap.style.transform = `translate(-50%,-50%) translate(${shake}px,${-shake * 0.5}px) scale(${1 - 0.25 * easeInCubic(out)})`;
  wrap.style.opacity = 1 - out;
  lines.forEach(({ d, L }, i) => {
    const t0 = L.at ?? i * 0.14;
    const k = clamp01((lt - t0) / 0.28);
    const s = 1.9 - 0.9 * easeOutBack(k, 1.4);
    d.style.opacity = clamp01(k * 4);
    const breathe = 1 + 0.02 * Math.sin(lt * 5 + i);
    d.style.transform = `scale(${(k <= 0 ? 0 : s) * breathe}) rotate(${(L.rot ?? 0)}deg)`;
  });
}
