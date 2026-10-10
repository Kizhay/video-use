// Общие хелперы версии 4 «Кинетическая типографика + цветовые плашки».
// Сцена = чистая функция времени: всё наполняется в GSAP-таймлайн, счётчики — через S.onUpdate.
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin.js';

export const PAL = {
  blue: { bg: '#0047FF', fg: '#FFFFFF', ac: '#FFE14D', pt: '#0B0F1E' },
  dark: { bg: '#0B0F1E', fg: '#FFFFFF', ac: '#3D8BFF', pt: '#0B0F1E' },
  red:  { bg: '#FF2E43', fg: '#FFFFFF', ac: '#0B0F1E', pt: '#FFFFFF' },
  white:{ bg: '#F5F1E8', fg: '#0B0F1E', ac: '#0047FF', pt: '#FFFFFF', ac2: '#FF2E43' },
};
export const X0 = 88;          // единая левая линия сетки
export const MAXW = 904;       // 1080 − 2×88

const CSS = `
.rt{position:absolute;white-space:nowrap;font-family:MB,sans-serif;font-weight:900;letter-spacing:-2px;line-height:1;width:max-content}
.rt .m{display:inline-block;overflow:hidden;vertical-align:top;padding:.08em 0 .13em;margin:-.08em .22em -.13em 0}
.rt .m:last-child{margin-right:0}
.rt .w{display:inline-block;position:relative;isolation:isolate;will-change:transform}
.rt .w.pl{padding:0 .17em;border-radius:.14em}
.rt .w .pb{position:absolute;left:0;top:0;right:0;bottom:0;border-radius:.14em;z-index:-1;transform-origin:0 50%}
.sv{position:absolute;overflow:visible;opacity:0}
.sv *{fill:none;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
`;

// Линейные иконки 200×200, stroke 10 (рисуются DrawSVG)
export const ICONS = {
  chartDown: ['M30 28 V170 H176', 'M48 62 L88 104 L116 78 L160 134', 'M128 138 H162 V104'],
  moneyBag: ['M68 68 L54 36 Q100 52 146 36 L132 68', 'M68 68 C14 108 22 176 100 176 C178 176 186 108 132 68 Z', 'M84 150 V104 H106 C126 104 126 134 106 134 H74', 'M74 148 H112'],
  zero: ['M100 28 C140 28 156 60 156 100 C156 140 140 172 100 172 C60 172 44 140 44 100 C44 60 60 28 100 28 Z', 'M56 160 L144 40'],
  pie: ['M100 100 m-66 0 a66 66 0 1 0 132 0 a66 66 0 1 0 -132 0', 'M100 100 V34', 'M100 100 L157 133', 'M118 80 V16 A70 70 0 0 1 182 66 Z'],
  copy: ['M72 62 H168 V176 H72 Z', 'M56 144 H34 V32 H128 V50'],
  lens: ['M92 28 a64 64 0 1 0 0.01 0 Z', 'M138 138 L176 176'],
  magnet: ['M44 34 V104 A56 56 0 0 0 156 104 V34 H118 V104 A18 18 0 0 1 82 104 V34 Z', 'M44 66 H82', 'M118 66 H156'],
  hammer: ['M92 76 L136 32 L168 64 L124 108 Z', 'M108 92 L48 168'],
  shield: ['M100 24 L160 46 V100 C160 140 132 164 100 178 C68 164 40 140 40 100 V46 Z', 'M72 100 L94 122 L130 80'],
  check: ['M100 22 a78 78 0 1 0 0.01 0 Z', 'M58 104 L88 134 L144 70'],
  phone: ['M62 20 H138 a14 14 0 0 1 14 14 V166 a14 14 0 0 1 -14 14 H62 a14 14 0 0 1 -14 -14 V34 a14 14 0 0 1 14 -14 Z', 'M88 150 H112', 'M90 42 H110'],
  hourglass: ['M54 24 H146', 'M54 176 H146', 'M62 24 C62 84 100 92 100 100 C100 108 62 116 62 176', 'M138 24 C138 84 100 92 100 100 C100 108 138 116 138 176', 'M100 150 V176'],
  arrow: ['M30 100 H165', 'M120 55 L168 100 L120 145'],
  arrowDown: ['M100 24 V168', 'M56 124 L100 172 L144 124'],
};

const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };

export function init(ctx, key, prevKey, opt = {}) {
  const { gsap, ui, dur } = ctx;
  gsap.registerPlugin(DrawSVGPlugin);
  const P = PAL[key];
  const tl = gsap.timeline({ paused: true });
  const updaters = [];
  const mk = (parent, css, cls) => { const d = document.createElement('div'); if (cls) d.className = cls; Object.assign(d.style, css); parent.appendChild(d); return d; };

  const st = document.createElement('style'); st.textContent = CSS; ui.appendChild(st);
  const full = { position: 'absolute', left: '0px', top: '0px', width: '1080px', height: '960px' };
  mk(ui, { ...full, background: PAL[prevKey || key].bg, zIndex: 0 });                    // предыдущий цвет
  const bg = mk(ui, { ...full, background: P.bg, zIndex: 1 });                             // свой цвет — шторка
  if (opt.noWipe) bg.style.clipPath = 'none';
  else tl.fromTo(bg, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.35, ease: 'power3.inOut' }, 0);
  const root = mk(ui, { ...full, zIndex: 2 });

  const wordsHere = ctx.words.filter((w) => w.s >= ctx.start - 0.05 && w.s < ctx.start + dur);
  /** время (в секундах сцены) появления слова, найденного по regexp; off — упреждение */
  function t(re, off = -0.12, nth = 0, min = 0.2) {
    const r = typeof re === 'string' ? new RegExp(re, 'i') : re;
    const hits = wordsHere.filter((w) => r.test(w.w.replace(/[.,!?«»"]/g, '')));
    if (!hits[nth]) throw new Error('слово не найдено: ' + re);
    return Math.max(min, hits[nth].s - ctx.start + off);
  }

  const lines = [], icons = [];

  function line(o) {
    const el = mk(root, { left: (o.x ?? X0) + 'px', top: (o.y ?? 0) + 'px', fontSize: (o.size ?? 150) + 'px', color: o.color ?? P.fg }, 'rt');
    const toks = o.t.split(' ');
    const ws = [], ms = [], bgs = [];
    toks.forEach((tok, i) => {
      const m = document.createElement('span'); m.className = 'm';
      const w = document.createElement('span'); w.className = 'w'; w.textContent = tok.replace(/_/g, ' ');
      const hl = o.hl === 'all' || (o.hl || []).includes(i);
      if (hl) {
        const pc = o.plate ?? P.ac;
        w.classList.add('pl'); w.style.color = o.pc ?? (lum(pc) > 0.6 ? '#0B0F1E' : '#FFFFFF');
        const b = document.createElement('i'); b.className = 'pb'; b.style.background = pc; w.prepend(b); bgs.push(b);
        if (i === 0) m.style.marginLeft = '-.17em';
      } else if ((o.ac || []).includes(i)) w.style.color = o.acColor ?? P.ac;
      m.appendChild(w); el.appendChild(m); ws.push(w); ms.push(m);
    });
    for (let k = 0; k < 3; k++) { const wd = el.offsetWidth; if (wd > (o.maxW ?? MAXW)) el.style.fontSize = (parseFloat(el.style.fontSize) * (o.maxW ?? MAXW) / wd * 0.995) + 'px'; }
    const L = { el, ws, ms, bgs, h: el.offsetHeight, w: el.offsetWidth, outAt: null, strikeBar: null };
    L.in = (at, a = {}) => {
      tl.fromTo(ws, { yPercent: 118 }, { yPercent: 0, duration: a.dur ?? 0.45, ease: 'power3.out', stagger: a.stagger ?? 0.05 }, at);
      if (bgs.length) tl.fromTo(bgs, { scaleX: 0 }, { scaleX: 1, duration: 0.38, ease: a.pop ? 'back.out(1.4)' : 'power3.out', stagger: 0.05 }, at + 0.09);
      return L;
    };
    L.out = (at) => {
      L.outAt = at;
      tl.to(ws, { yPercent: -118, duration: 0.26, ease: 'power2.in', stagger: 0.03 }, at);
      if (L.strikeBar) tl.to(L.strikeBar, { opacity: 0, duration: 0.15 }, at);
      return L;
    };
    L.strike = (at, color) => {
      const bar = mk(el, { left: '-4px', top: '52%', width: 'calc(100% + 8px)', height: Math.max(6, parseFloat(el.style.fontSize) * 0.1) + 'px', background: color ?? P.ac2 ?? P.ac, transformOrigin: '0 50%', borderRadius: '4px' });
      L.strikeBar = bar;
      tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: 'power3.out' }, at);
      return L;
    };
    lines.push(L); return L;
  }
  /** стопка строк подряд от y0; возвращает массив */
  function stack(y0, specs, gap = 8) {
    let y = y0; return specs.map((s) => { const L = line({ ...s, y }); y += L.h + (s.gap ?? gap); return L; });
  }

  function icon(name, o = {}) {
    const size = o.size ?? 210, x = o.x ?? (1080 - X0 - size), y = o.y ?? 70, at = o.at ?? 0.35;
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 200 200'); svg.setAttribute('class', 'sv');
    Object.assign(svg.style, { left: x + 'px', top: y + 'px', width: size + 'px', height: size + 'px' });
    const paths = ICONS[name].map((d) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('stroke', o.color ?? P.ac); p.setAttribute('stroke-width', '10'); svg.appendChild(p); return p; });
    root.appendChild(svg);
    tl.set(svg, { opacity: 1 }, at);
    tl.fromTo(paths, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: o.dur ?? 0.6, ease: 'power2.inOut', stagger: 0.09 }, at);
    const I = { svg, paths, outAt: null, out(a) { I.outAt = a; tl.to(svg, { opacity: 0, scale: 0.8, duration: 0.25, ease: 'power2.in', transformOrigin: '50% 50%' }, a); return I; } };
    icons.push(I); return I;
  }

  /** строка «префикс + печатаемое слово на плашке» с кареткой */
  function typed(y, prefix, word, o = {}) {
    const size = o.size ?? 150, at = o.at ?? 0, step = o.step ?? 0.11;
    const pc = o.plate ?? P.ac, tc = o.pc ?? (lum(pc) > 0.6 ? '#0B0F1E' : '#FFFFFF');
    const el = mk(root, { left: X0 + 'px', top: y + 'px', fontSize: size + 'px', color: P.fg }, 'rt');
    const plate = document.createElement('span');
    Object.assign(plate.style, { display: 'inline-block', position: 'relative', padding: '0 .17em', marginLeft: '-.17em', color: tc, borderRadius: '.14em', isolation: 'isolate' });
    const pb = document.createElement('i'); pb.className = 'pb'; pb.style.background = pc; plate.appendChild(pb);
    const chars = [...word].map((c) => { const s = document.createElement('span'); s.textContent = c; s.style.opacity = 0; plate.appendChild(s); return s; });
    const caret = document.createElement('b');
    Object.assign(caret.style, { position: 'absolute', top: '12%', width: '.075em', height: '76%', background: tc, left: '0' });
    plate.appendChild(caret); el.appendChild(plate);
    if (el.offsetWidth > MAXW) el.style.fontSize = size * MAXW / el.offsetWidth * 0.99 + 'px';
    const lefts = chars.map((c) => c.offsetLeft), endX = chars[chars.length - 1].offsetLeft + chars[chars.length - 1].offsetWidth;
    tl.fromTo(pb, { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: 'power3.out' }, at);
    tl.set(caret, { x: lefts[0] }, 0);
    chars.forEach((c, i) => { tl.set(c, { opacity: 1 }, at + 0.3 + i * step); tl.set(caret, { x: i + 1 < chars.length ? lefts[i + 1] : endX + 2 }, at + 0.3 + i * step); });
    const endType = at + 0.3 + chars.length * step;
    updaters.push((lt) => { caret.style.opacity = lt < at + 0.2 ? 0 : (lt < endType + 0.1 ? 1 : (Math.floor((lt - endType) * 2.6) % 2 ? 0 : 1)); });
    const L = { el, chars, endType, h: el.offsetHeight, outAt: null, out(a) { L.outAt = a; tl.to([el], { opacity: 0, y: -30, duration: 0.25, ease: 'power2.in' }, a); return L; } };
    lines.push(L); return L;
  }

  function onUpdate(fn) { updaters.push(fn); }

  /** выходы в последние 0.3 с + дыхание кадра; hold=true — финал без выхода */
  function finish(o = {}) {
    const outT = dur - 0.32;
    if (!o.hold) {
      lines.forEach((L) => { if (L.outAt == null) L.out(outT); });
      icons.forEach((I) => { if (I.outAt == null) I.out(outT); });
    }
    tl.fromTo(root, { scale: 1 }, { scale: 1.025, duration: dur, ease: 'none', transformOrigin: '50% 45%' }, 0);
    return { tl, update(lt, p, tt) { updaters.forEach((f) => f(lt, p, tt)); } };
  }

  return { gsap, tl, P, root, mk, t, line, stack, icon, typed, onUpdate, finish, dur };
}
