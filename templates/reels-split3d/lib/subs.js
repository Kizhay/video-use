// Пословные субтитры в стиле «Хормози»: капс, толстая обводка, активное слово
// подсвечено и «подпрыгивает», ключевые слова держат свой цвет.
import { easeOutBack, easeOutCubic, clamp01 } from './kit.js';

const clean = (w) => w.replace(/[.,!:;…—–]+/g, '').replace(/^-/, '').trim();
const sentence = (w) => w.replace(/[.,!:;…—–]+$/g, '').replace(/^[—–-]\s*/, '').trim();

export function buildSubs(root, words, o = {}) {
  const cfg = {
    y: o.y ?? 960, size: o.size ?? 86, maxWords: o.maxWords ?? 3, maxChars: o.maxChars ?? 16,
    active: o.active ?? '#FFE14D', base: o.base ?? '#FFFFFF', stroke: o.stroke ?? 15,
    hideBefore: o.hideBefore ?? -1, hideAfter: o.hideAfter ?? 1e9, maxWidth: o.maxWidth ?? 960,
    lift: o.lift ?? true,
    style: o.style ?? 'hormozi',            // hormozi | pill | clean
    pill: o.pill ?? '#005BFF', pillText: o.pillText ?? '#FFFFFF',
    font: o.font ?? 'MB', weight: o.weight ?? 900, upper: o.upper ?? !['minimal', 'marker'].includes(o.style),
    dim: o.dim ?? 0.55, lineHeight: o.lineHeight ?? 1.08,
    box: o.box ?? null,
    hideRanges: o.hideRanges ?? [],            // [[a,b],...] — где субтитры не показываем (полноэкранные вставки)                        // подложка строки, напр. 'rgba(12,14,20,.55)'
  };
  const ws = words.map((x) => ({ ...x, d: cfg.upper ? clean(x.w).toUpperCase() : sentence(x.w) })).filter((x) => x.d.length);
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
    transform: 'translate(-50%,-50%)', textAlign: 'center', lineHeight: String(cfg.lineHeight), fontWeight: String(cfg.weight),
    fontSize: cfg.size + 'px', fontFamily: cfg.font, letterSpacing: cfg.style === 'minimal' ? '-0.5px' : '1px' });
  if (cfg.box) {
    // подложка по ширине текста: внутренний inline-блок
    const inner = document.createElement('div');
    Object.assign(inner.style, { display: 'inline-block', background: cfg.box, padding: '14px 30px 18px',
      borderRadius: '26px', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      boxShadow: '0 10px 40px rgba(0,0,0,.25)', maxWidth: cfg.maxWidth + 'px' });
    box.appendChild(inner); box._target = inner;
  }
  root.appendChild(box);
  return { cfg, groups, box, shown: -1, spans: [] };
}

export function drawSubs(st, t) {
  const { cfg, groups, box } = st;
  if (t < cfg.hideBefore || t > cfg.hideAfter || cfg.hideRanges.some(([a, b]) => t >= a && t < b)) { box.style.display = 'none'; return; }
  const gi = groups.findIndex((g) => t >= g.start && t < g.end);
  if (gi < 0) { box.style.display = 'none'; return; }
  box.style.display = 'block';
  const g = groups[gi];
  if (st.shown !== gi) {
    const tgt = box._target || box;
    tgt.innerHTML = '';
    st.spans = g.map((x) => {
      const sp = document.createElement('span');
      sp.textContent = x.d;
      Object.assign(sp.style, { display: 'inline-block', margin: '0 20px', WebkitTextStroke: `${cfg.stroke}px #000`,
        paintOrder: 'stroke fill', textShadow: '0 9px 0 rgba(0,0,0,.55), 0 0 28px rgba(0,0,0,.5)',
        transformOrigin: '50% 70%' });
      if (cfg.style === 'pill') Object.assign(sp.style, { WebkitTextStroke: `${Math.round(cfg.stroke * 0.6)}px #000`, margin: '4px 6px',
        padding: '2px 18px 8px', borderRadius: '20px', textShadow: '0 6px 0 rgba(0,0,0,.45)' });
      if (cfg.style === 'marker') Object.assign(sp.style, { WebkitTextStroke: '0', margin: '2px 4px', padding: '0 12px 5px',
        borderRadius: '10px', textShadow: '0 2px 14px rgba(0,0,0,.6), 0 1px 3px rgba(0,0,0,.55)' });
      if (cfg.style === 'minimal') Object.assign(sp.style, { WebkitTextStroke: '0', margin: '0 7px',
        textShadow: cfg.box ? 'none' : '0 2px 10px rgba(0,0,0,.55), 0 1px 2px rgba(0,0,0,.6)' });
      if (cfg.style === 'clean') Object.assign(sp.style, { WebkitTextStroke: '0', margin: '0 14px',
        textShadow: '0 4px 18px rgba(0,0,0,.75), 0 2px 4px rgba(0,0,0,.9)' });
      tgt.appendChild(sp); return sp;
    });
    st.shown = gi;
  }
  if (cfg.style === 'marker') {
    const k = easeOutCubic(clamp01((t - g.start) / 0.16));
    box.style.opacity = k; box.style.transform = `translate(-50%,-50%) translateY(${(1 - k) * 12}px)`;
    g.forEach((x, i) => {
      const sp = st.spans[i];
      const active = t >= x.s - 0.05 && (i === g.length - 1 ? t < x.e + 0.25 : t < g[i + 1].s - 0.05);
      const m = active ? easeOutCubic(clamp01((t - x.s + 0.05) / 0.14)) : 0;   // маркер проводится слева направо
      sp.style.background = m > 0 ? `linear-gradient(${cfg.pill},${cfg.pill}) 0 0 / ${m * 100}% 100% no-repeat` : 'none';
      const dark = m > 0.45;
      sp.style.color = dark ? '#111' : cfg.base;
      sp.style.textShadow = dark ? 'none' : '0 2px 14px rgba(0,0,0,.6), 0 1px 3px rgba(0,0,0,.55)';
      sp.style.transform = active ? `rotate(-2deg) scale(${1 + 0.04 * m})` : 'none';
      sp.style.opacity = 1;
    });
    return;
  }
  if (cfg.style === 'minimal') {
    const k = easeOutCubic(clamp01((t - g.start) / 0.18));
    box.style.opacity = k; box.style.transform = `translate(-50%,-50%) translateY(${(1 - k) * 10}px)`;
    g.forEach((x, i) => {
      const sp = st.spans[i], on = t >= x.s - 0.04;
      const kk = clamp01((t - x.s + 0.04) / 0.12);
      sp.style.color = x.c && on ? x.c : cfg.base;
      sp.style.opacity = on ? cfg.dim + (1 - cfg.dim) * kk : cfg.dim;
      sp.style.transform = 'none';
    });
    return;
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
    if (cfg.style === 'pill') {
      sp.style.background = isActive ? (x.c || cfg.pill) : 'transparent';
      sp.style.color = isActive ? cfg.pillText : (x.c && spoken ? x.c : cfg.base);
      sp.style.boxShadow = isActive ? '0 10px 30px rgba(0,0,0,.35)' : 'none';
      sp.style.WebkitTextStroke = isActive ? '0' : `${Math.round(cfg.stroke * 0.6)}px #000`;
    }
    sp.style.opacity = spoken ? 1 : 0.92;
    sp.style.transform = `scale(${sc}) translateY(${isActive && cfg.lift ? -4 : 0}px) rotate(${isActive ? (i % 2 ? 1.5 : -1.5) : 0}deg)`;
  });
}
