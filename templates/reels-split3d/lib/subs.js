// Пословные субтитры в стиле «Хормози»: капс, толстая обводка, активное слово
// подсвечено и «подпрыгивает», ключевые слова держат свой цвет.
import { easeOutBack, easeOutCubic, clamp01 } from './kit.js';

const clean = (w) => w.replace(/[.,!:;…—–]+/g, '').replace(/^-/, '').trim();

export function buildSubs(root, words, o = {}) {
  const cfg = {
    y: o.y ?? 960, size: o.size ?? 86, maxWords: o.maxWords ?? 3, maxChars: o.maxChars ?? 16,
    active: o.active ?? '#FFE14D', base: o.base ?? '#FFFFFF', stroke: o.stroke ?? 15,
    hideBefore: o.hideBefore ?? -1, hideAfter: o.hideAfter ?? 1e9, maxWidth: o.maxWidth ?? 960,
    lift: o.lift ?? true,
  };
  const ws = words.map((x) => ({ ...x, d: clean(x.w).toUpperCase() })).filter((x) => x.d.length);
  const groups = []; let cur = [];
  ws.forEach((x, i) => {
    const prev = cur[cur.length - 1];
    const chars = cur.reduce((a, y) => a + y.d.length + 1, 0) + x.d.length;
    const prevPunct = prev && /[.,!?…»]$/.test(prev.w);
    const gap = prev ? x.s - prev.e : 0;
    if (cur.length && (cur.length >= cfg.maxWords || chars > cfg.maxChars || prevPunct || gap > 0.35 || x.br)) {
      groups.push(cur); cur = [];
    }
    cur.push(x);
  });
  if (cur.length) groups.push(cur);
  groups.forEach((g, i) => {
    g.start = g[0].s - 0.04;
    const next = groups[i + 1];
    const tail = g[g.length - 1].e + 0.35;
    g.end = next ? Math.min(next[0].s - 0.04, Math.max(tail, g[g.length - 1].e + 0.05)) : tail;
    if (next && next[0].s - g[g.length - 1].e < 0.6) g.end = next[0].s - 0.04;
  });

  const box = document.createElement('div');
  Object.assign(box.style, { position: 'absolute', left: '50%', top: cfg.y + 'px', width: cfg.maxWidth + 'px',
    transform: 'translate(-50%,-50%)', textAlign: 'center', lineHeight: '1.08', fontWeight: '900',
    fontSize: cfg.size + 'px', fontFamily: 'MB', letterSpacing: '1px' });
  root.appendChild(box);
  return { cfg, groups, box, shown: -1, spans: [] };
}

export function drawSubs(st, t) {
  const { cfg, groups, box } = st;
  if (t < cfg.hideBefore || t > cfg.hideAfter) { box.style.display = 'none'; return; }
  const gi = groups.findIndex((g) => t >= g.start && t < g.end);
  if (gi < 0) { box.style.display = 'none'; return; }
  box.style.display = 'block';
  const g = groups[gi];
  if (st.shown !== gi) {
    box.innerHTML = '';
    st.spans = g.map((x) => {
      const sp = document.createElement('span');
      sp.textContent = x.d;
      Object.assign(sp.style, { display: 'inline-block', margin: '0 20px', WebkitTextStroke: `${cfg.stroke}px #000`,
        paintOrder: 'stroke fill', textShadow: '0 9px 0 rgba(0,0,0,.55), 0 0 28px rgba(0,0,0,.5)',
        transformOrigin: '50% 70%' });
      box.appendChild(sp); return sp;
    });
    st.shown = gi;
  }
  // вход всей группы
  const kin = easeOutBack(clamp01((t - g.start) / 0.16), 2.2);
  box.style.transform = `translate(-50%,-50%) translateY(${(1 - easeOutCubic((t - g.start) / 0.16)) * 26}px) scale(${0.82 + 0.18 * kin})`;
  box.style.opacity = clamp01((t - g.start) / 0.06);
  g.forEach((x, i) => {
    const sp = st.spans[i];
    const isActive = t >= x.s - 0.03 && (i === g.length - 1 ? true : t < g[i + 1].s - 0.03);
    const spoken = t >= x.s - 0.03;
    const k = clamp01((t - x.s + 0.03) / 0.14);
    const sc = isActive ? 1 + 0.12 * (1 - easeOutCubic(k)) + 0.03 : 1;
    let color = cfg.base;
    if (x.c && spoken) color = x.c; else if (isActive) color = cfg.active;
    sp.style.color = color;
    sp.style.opacity = spoken ? 1 : 0.92;
    sp.style.transform = `scale(${sc}) translateY(${isActive && cfg.lift ? -4 : 0}px) rotate(${isActive ? (i % 2 ? 1.5 : -1.5) : 0}deg)`;
  });
}
