// Общий код whiteboard-вставок: бумага, маркер-рука, рисование линий (DrawSVG) и «написание» текста.
// Всё детерминировано: состояние только от времени сцены (lt).
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin.js';
import { makePhotoHand } from './photo_hand.js';  // было: makeWritingHand из writing_hand.js (.old не нужен — файл остался)

export const INK = '#111111', RED = '#E63946', BLUE = '#1D4ED8', PAPER = '#FAFAF7', YEL = '#FFE14D', SKIN = '#F6C9A4';
const NS = 'http://www.w3.org/2000/svg';
const svgEl = (name, attrs = {}, parent) => {
  const e = document.createElementNS(NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
};
const box = (parent, style = {}) => {
  const d = document.createElement('div');
  Object.assign(d.style, { position: 'absolute', left: '0px', top: '0px' }, style);
  parent.appendChild(d); return d;
};
const lerp = (a, b, t) => a + (b - a) * t;
const lerpP = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
const cl = (x) => Math.max(0, Math.min(1, x));
const eIn = (t) => { t = cl(t); return t * t * t; };
const eOut = (t) => { t = cl(t); return 1 - Math.pow(1 - t, 3); };
const eIO = (t) => { t = cl(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

const NOISE = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='360' height='360'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .35  0 0 0 0 .32  0 0 0 0 .27  0 0 0 .11 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";

// ── геометрия «от руки» ─────────────────────────────────────────────
function catmull(pts, closed = false) {
  const n = pts.length;
  const P = (i) => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/** ломаная → неровные точки (поперечный дрожь) */
function wobble(pts, rnd, step = 70, amp = 2.6) {
  const out = [[pts[0][0], pts[0][1]]];
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const len = Math.hypot(bx - ax, by - ay) || 1, n = Math.max(1, Math.round(len / step));
    const nx = -(by - ay) / len, ny = (bx - ax) / len;
    for (let k = 1; k <= n; k++) {
      const t = k / n, j = k < n ? (rnd() - 0.5) * 2 * amp : (rnd() - 0.5) * amp * 0.6;
      out.push([ax + (bx - ax) * t + nx * j, ay + (by - ay) * t + ny * j]);
    }
  }
  return out;
}
function polyD(pts, sharp) {
  return 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L');
}

/** точки фигур (для board.line) */
export const shapes = {
  tee(cx, cy, s) {
    const q = [[-0.22, -0.5], [-0.5, -0.3], [-0.64, 0.0], [-0.42, 0.1], [-0.35, -0.06], [-0.35, 0.5], [0.35, 0.5], [0.35, -0.06], [0.42, 0.1],
      [0.64, 0.0], [0.5, -0.3], [0.22, -0.5], [0.1, -0.4], [-0.1, -0.4], [-0.22, -0.5]];
    return q.map(([x, y]) => [cx + x * s, cy + y * s]);
  },
  capsule(cx, cy, w, h, ang = 0) {
    const r = w / 2, a = ang * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), L = Math.max(0, h / 2 - r), pts = [];
    for (let i = 0; i <= 6; i++) { const t = Math.PI + (i / 6) * Math.PI; pts.push([Math.cos(t) * r, -L + Math.sin(t) * r]); }
    for (let i = 0; i <= 6; i++) { const t = (i / 6) * Math.PI; pts.push([Math.cos(t) * r, L + Math.sin(t) * r]); }
    pts.push(pts[0].slice());
    return pts.map(([x, y]) => [cx + x * ca - y * sa, cy + x * sa + y * ca]);
  },
  check(cx, cy, s) { return [[cx - 0.5 * s, cy], [cx - 0.15 * s, cy + 0.4 * s], [cx + 0.55 * s, cy - 0.5 * s]]; },
  star(cx, cy, r, n = 5) {
    const o = []; for (let i = 0; i <= n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r * 0.45 : r; o.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    return o;
  },
};

// ── рука с маркером: векторная рука из writing_hand.js (кончик маркера = точка привязки) ──

/**
 * Доска. o: { accent, seed, paper:true|false, color (цвет штриха), width, hand:true|false }
 * Возвращает объект с методами рисования и результатом finish() => { tl, update }.
 */
export function board(ctx, o = {}) {
  const { gsap, kit, ui, W, H, dur } = ctx;
  gsap.registerPlugin(DrawSVGPlugin);
  const rnd = kit.rng(o.seed || 7);
  const paperMode = o.paper !== false;
  const accent = o.accent || RED;
  const ink = o.color || (paperMode ? INK : '#FFFFFF');
  const sw = o.width || (paperMode ? 9 : 9);
  const tl = gsap.timeline({ paused: true });

  const root = box(ui, { width: W + 'px', height: H + 'px' });
  if (paperMode) {
    Object.assign(root.style, { background: `radial-gradient(ellipse at 50% 45%, #FFFFFC 0%, ${PAPER} 55%, #F1EFE6 100%)`,
      boxShadow: '-26px 0 50px rgba(0,0,0,.35), inset 0 0 150px rgba(70,55,25,.16), inset 0 0 8px rgba(0,0,0,.25)' });
    box(root, { width: W + 'px', height: H + 'px', backgroundImage: NOISE, backgroundSize: '360px 360px', pointerEvents: 'none' });
  }
  const shadow = paperMode ? '' : 'drop-shadow(0 3px 5px rgba(0,0,0,.65))';
  const mkSvg = () => {
    const s = svgEl('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` });
    Object.assign(s.style, { position: 'absolute', left: '0px', top: '0px', overflow: 'visible', filter: shadow });
    root.appendChild(s); return s;
  };
  const svgF = mkSvg(), svgS = mkSvg();
  const textLayer = box(root, { width: W + 'px', height: H + 'px', filter: shadow });
  const mc = document.createElement('canvas').getContext('2d');

  const strokes = [], events = [];

  /** один непрерывный штрих по d */
  function stroke(d, s = {}) {
    const path = svgEl('path', { d, fill: 'none', stroke: s.color || ink, 'stroke-width': s.w || sw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svgS);
    if (s.opacity != null) path.setAttribute('stroke-opacity', s.opacity);
    if (s.instant) { path.style.visibility = 'visible'; return path; }
    path.style.visibility = 'hidden';
    const len = path.getTotalLength();
    const at = s.at ?? 0, dd = s.dur ?? 0.5, en = s.ease || 'power1.inOut';
    strokes.push({ path, at });
    tl.fromTo(path, { drawSVG: '0%' }, { drawSVG: '100%', duration: dd, ease: en }, at);
    if (s.hand !== false && paperMode && o.hand !== false) {
      const ez = gsap.parseEase(en);
      events.push({ at, dur: dd, ease: ez, fn: (p) => { const q = path.getPointAtLength(len * p); return { x: q.x, y: q.y }; } });
    }
    return path;
  }
  /** ломаная/гладкая линия по точкам */
  function line(pts, s = {}) {
    const w = wobble(pts, rnd, s.step || 70, s.amp ?? 2.6);
    return stroke(s.sharp ? polyD(w) : catmull(w, false), s);
  }
  function ellipse(cx, cy, rx, ry, s = {}) {
    const turns = s.turns || 1.08, a0 = (s.a0 ?? -2.2), n = Math.max(14, Math.round(18 * turns + rx / 14));
    const ph = rnd() * 6.28, pts = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + (i / n) * Math.PI * 2 * turns, k = 1 + 0.035 * Math.sin(a * 2 + ph) + (i / n) * 0.045;
      pts.push([cx + Math.cos(a) * rx * k + (rnd() - 0.5) * 2, cy + Math.sin(a) * ry * k + (rnd() - 0.5) * 2]);
    }
    return stroke(catmull(pts, false), s);
  }
  function rect(x, y, w, h, s = {}) {
    const r = Math.min(s.r ?? 0, w / 2, h / 2);
    let pts;
    if (r > 0) {
      const c = (cx, cy, a) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r], P = Math.PI;
      pts = [[x + r, y], [x + w - r, y], c(x + w - r, y + r, -P / 4), [x + w, y + r], [x + w, y + h - r], c(x + w - r, y + h - r, P / 4),
        [x + w - r, y + h], [x + r, y + h], c(x + r, y + h - r, 3 * P / 4), [x, y + h - r], [x, y + r], c(x + r, y + r, 5 * P / 4), [x + r, y], [x + r + 22, y]];
    } else pts = [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y], [x + 24, y + 1]];
    const wob = wobble(pts, rnd, s.step || 80, s.amp ?? 2.4);
    return stroke(r > 0 ? catmull(wob, false) : polyD(wob), s);
  }
  /** стрелка: возвращает [тело, голова] */
  function arrow(x1, y1, x2, y2, s = {}) {
    const dd = s.dur || 0.5, hd = 0.16;
    const mx = (x1 + x2) / 2 + (s.bend || 0) * (y2 - y1) / 2, my = (y1 + y2) / 2 - (s.bend || 0) * (x2 - x1) / 2;
    const body = line(s.bend ? [[x1, y1], [mx, my], [x2, y2]] : [[x1, y1], [x2, y2]], { ...s, dur: dd });
    // направление в конце
    const ex = s.bend ? x2 - mx : x2 - x1, ey = s.bend ? y2 - my : y2 - y1, L = Math.hypot(ex, ey) || 1, ux = ex / L, uy = ey / L, hl = s.head || 34;
    const head = line([[x2 - ux * hl - uy * hl * 0.62, y2 - uy * hl + ux * hl * 0.62], [x2, y2], [x2 - ux * hl + uy * hl * 0.62, y2 - uy * hl - ux * hl * 0.62]],
      { ...s, at: (s.at || 0) + dd, dur: hd, sharp: true, amp: 0.8, ease: 'power1.out' });
    return [body, head];
  }
  function cross(cx, cy, r, s = {}) {
    const dd = s.dur || 0.22;
    line([[cx - r, cy - r], [cx + r, cy + r]], { ...s, dur: dd, sharp: true, amp: 1.5 });
    line([[cx + r, cy - r], [cx - r, cy + r]], { ...s, at: (s.at || 0) + dd, dur: dd, sharp: true, amp: 1.5 });
  }
  /** зигзаг-заливка маркером (хайлайтер) */
  function hatch(x, y, w, h, s = {}) {
    const gap = s.gap || 26, pts = [];
    const rows = Math.max(2, Math.round(h / gap));
    for (let i = 0; i <= rows; i++) pts.push([i % 2 ? x : x + w, y + (h * i) / rows]);
    return line(pts, { amp: 3, ...s, w: s.w || gap + 6, sharp: true, step: 120 });
  }
  /** волнистое подчёркивание */
  function underline(x1, x2, y, s = {}) {
    const n = Math.max(3, Math.round((x2 - x1) / 60)), pts = [];
    for (let i = 0; i <= n; i++) pts.push([x1 + ((x2 - x1) * i) / n, y + (i % 2 ? -(s.wave ?? 7) : (s.wave ?? 7)) + (rnd() - 0.5) * 4]);
    return line(pts, { ...s, amp: 1.5 });
  }
  /** заливка цветом (появляется) */
  function fill(d, s = {}) {
    const p = svgEl('path', { d, fill: s.color || accent, stroke: 'none', opacity: 0 }, svgF);
    tl.fromTo(p, { opacity: 0 }, { opacity: s.opacity ?? 1, duration: s.dur ?? 0.3, ease: 'power2.out' }, s.at ?? 0);
    return p;
  }
  /** текст «пишется» слева направо */
  function text(str, x, y, s = {}) {
    const size = s.size || 100, wt = s.weight || 700, rot = s.rot || 0, at = s.at ?? 0;
    mc.font = `${wt} ${size}px Caveat`;
    const w = Math.ceil(mc.measureText(str).width) + 10;
    const cx = s.anchor === 'l' ? x + w / 2 : s.anchor === 'r' ? x - w / 2 : x;
    const d = box(textLayer, { left: (cx - w / 2) + 'px', top: (y - size * 0.62) + 'px', width: w + 'px', height: (size * 1.25) + 'px',
      font: `${wt} ${size}px/${size * 1.25}px Caveat`, color: s.color || ink, whiteSpace: 'nowrap', textAlign: 'center',
      transform: `rotate(${rot}deg)`, transformOrigin: '50% 50%', textShadow: s.shadow || 'none' });
    d.textContent = str;
    if (!s.instant) {
      const dd = s.dur ?? Math.max(0.35, str.length * 0.075);
      tl.fromTo(d, { clipPath: 'inset(-12% 100% -12% 0%)' }, { clipPath: 'inset(-12% -4% -12% 0%)', duration: dd, ease: 'none' }, at);
      if (paperMode && o.hand !== false && s.hand !== false) {
        const cr = Math.cos(rot * Math.PI / 180), sr = Math.sin(rot * Math.PI / 180), nw = Math.max(2, str.length);
        events.push({ at, dur: dd, ease: (p) => p, fn: (p) => {
          const u = -w / 2 + 6 + (w - 12) * p, v = size * (0.2 + 0.15 * Math.sin(p * nw * 2.4));
          return { x: cx + u * cr - v * sr, y: y + u * sr + v * cr };
        } });
      }
    }
    return { w, h: size * 1.25, cx, el: d };
  }
  /** всплытие произвольного элемента (svg-группа/html) */
  function pop(el, at, s = {}) {
    tl.fromTo(el, { scale: s.from ?? 0.5, opacity: 0, transformOrigin: '50% 50%', svgOrigin: s.origin }, { scale: 1, opacity: 1, duration: s.dur ?? 0.35, ease: s.ease || 'back.out(2)' }, at);
  }

  // ── вход / выход бумаги ───────────────────────────────────────────
  if (paperMode) {
    tl.fromTo(root, { x: W }, { x: 0, duration: 0.35, ease: 'power3.out' }, 0);
    tl.to(root, { x: -W - 60, duration: 0.3, ease: 'power2.in' }, dur - 0.3);
  } else {
    tl.to(root, { opacity: 0, duration: 0.25, ease: 'power2.in' }, dur - 0.28);
  }

  // ── рука ───────────────────────────────────────────────────────────
  let handG = null;
  const OFF = { x: W + 360, y: H + 280 };
  function finish() {
    events.sort((a, b) => a.at - b.at);
    events.forEach((e) => { e.p0 = e.fn(0); e.p1 = e.fn(1); });
    let lastEnd = 0; events.forEach((e) => { lastEnd = Math.max(lastEnd, e.at + e.dur); });
    const exitAt = lastEnd + 0.12;
    if (paperMode && o.hand !== false) {
      const hs = document.createElement('div');
      Object.assign(hs.style, { position: 'absolute', left: '0px', top: '0px', width: W + 'px', height: H + 'px', pointerEvents: 'none' });
      root.appendChild(hs); handG = makePhotoHand(hs, { scale: 1.35 });
      handG.setTip(OFF.x, OFF.y, 0);
    }
    const bob = (p, lt) => ({ x: p.x + Math.sin(lt * 5.1) * 2.2, y: p.y + Math.cos(lt * 4.3) * 2.2 });
    function tip(lt) {
      if (!events.length) return OFF;
      const first = events[0], last = events[events.length - 1];
      if (lt >= exitAt) return lerpP(last.p1, OFF, eIn((lt - exitAt) / 0.5));
      let k = -1; for (let i = 0; i < events.length; i++) if (events[i].at <= lt) k = i;
      if (k < 0) { const t0 = first.at - 0.5; return lt <= t0 ? OFF : lerpP(OFF, first.p0, eOut((lt - t0) / 0.5)); }
      const e = events[k];
      if (lt < e.at + e.dur) return e.fn(e.ease(cl((lt - e.at) / e.dur)));
      const n = events[k + 1];
      if (!n) return bob(e.p1, lt);
      const tr = Math.min(0.42, n.at - (e.at + e.dur)), t0 = n.at - tr;
      if (tr <= 0.001 || lt < t0) return bob(e.p1, lt);
      return lerpP(e.p1, n.p0, eIO((lt - t0) / tr));
    }
    function update(lt) {
      for (const s of strokes) s.path.style.visibility = lt > s.at + 0.0004 ? 'visible' : 'hidden';
      if (handG) { const p = tip(lt); handG.setTip(p.x, p.y, 0); }
    }
    return { tl, update };
  }

  return { tl, root, stroke, line, ellipse, rect, arrow, cross, hatch, underline, fill, text, pop, finish, rnd, accent, ink, svgS, svgF, W, H, dur };
}
