// Общие хелперы версии 3 «Тёмное стекло». Всё — чистые функции времени.
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin.js';
gsap.registerPlugin(DrawSVGPlugin);
export { gsap };

export const COL = { blue: '#3D8BFF', cyan: '#27D3FF', red: '#FF4D5E', green: '#2BE38B', dim: 'rgba(255,255,255,.6)', ink: '#0B0F1E' };
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ease = (n) => gsap.parseEase(n);
export const seg = (lt, a, d, e = 'power2.out') => ease(e)(clamp((lt - a) / d));
export const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
export const lerp = (a, b, k) => a + (b - a) * k;
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export const mixc = (a, b, k) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; };

const CSS = `
.rm-root{position:absolute;left:0;top:0;width:1080px;height:960px;font-family:'MB',sans-serif;color:#fff;overflow:visible}
.rm-persp{position:absolute;left:0;top:0;width:1080px;height:960px;perspective:1600px;perspective-origin:50% 42%}
.rm-mock{position:absolute;left:0;top:0;width:1080px;height:960px;transform-style:preserve-3d;transform-origin:540px 430px}
.rm-a{position:absolute;white-space:nowrap}
.rm-g{position:absolute;box-sizing:border-box;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);
 backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:32px;
 box-shadow:0 0 60px rgba(var(--ac),.25),0 30px 80px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.14)}
.rm-p{position:absolute;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:12px;white-space:nowrap;
 border-radius:999px;font-weight:800}
.rm-d{color:rgba(255,255,255,.6)}
`;

/** Каркас сцены: push-вход (0.45 с) и push-выход (0.3 с), 3D-параллакс мока. */
export function scene(ctx, o = {}) {
  const { ui, dur } = ctx;
  const st = document.createElement('style'); st.textContent = CSS; ui.appendChild(st);
  const root = document.createElement('div'); root.className = 'rm-root';
  root.style.setProperty('--ac', o.ac || '61,139,255');
  const persp = document.createElement('div'); persp.className = 'rm-persp';
  const mock = document.createElement('div'); mock.className = 'rm-mock';
  persp.appendChild(mock); root.appendChild(persp); ui.appendChild(root);
  const tl = gsap.timeline({ paused: true });
  tl.fromTo(root, { x: 900 }, { x: 0, duration: 0.45, ease: 'power3.out' }, 0);
  if (o.exit !== false) tl.fromTo(root, { x: 0 }, { x: -1080, duration: 0.3, ease: 'power2.in', immediateRender: false }, dur - 0.3);
  const U = [];
  const [rx, ry] = o.tilt || [5, -7];
  const sc = {
    root, mock, tl, ctx,
    add: (f) => { U.push(f); return f; },
    done() {
      return { tl, update(lt) {
        const lc = Math.min(lt, o.freezeAt ?? 1e9);
        mock.style.transform = `rotateX(${(rx + Math.cos(lc * 0.55) * 1.4).toFixed(3)}deg) rotateY(${(ry + Math.sin(lc * 0.5) * 2.2).toFixed(3)}deg) scale(${(1 + lc * 0.004).toFixed(4)})`;
        for (const f of U) f(lt);
      } };
    },
  };
  return sc;
}

/** абсолютный блок */
export function A(parent, css, html = '', cls = '') {
  const d = document.createElement('div'); d.className = 'rm-a ' + cls; d.style.cssText = css; d.innerHTML = html; parent.appendChild(d); return d;
}
/** блок, привязанный центром к (x,y) */
export function C(parent, x, y, css = '', html = '', cls = '') {
  const d = A(parent, `left:${x}px;top:${y}px;${css}`, html, cls); gsap.set(d, { xPercent: -50, yPercent: -50 }); return d;
}
/** стеклянная карточка */
export function G(parent, x, y, w, h, extra = '', html = '') {
  const d = document.createElement('div'); d.className = 'rm-g';
  d.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;${extra}`; d.innerHTML = html; parent.appendChild(d); return d;
}
/** плашка-пилюля, центр в (x,y) */
export function pill(parent, x, y, html, css = '') {
  const d = document.createElement('div'); d.className = 'rm-p'; d.style.cssText = `left:${x}px;top:${y}px;${css}`; d.innerHTML = html;
  parent.appendChild(d); gsap.set(d, { xPercent: -50, yPercent: -50 }); return d;
}

// ── иконки (линейные, round caps) ─────────────────────────────────
const P = {
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  slash: '<path class="sl" d="M4 20L20 4"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  cross: '<path d="M6 6l12 12M18 6L6 18"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  trash: '<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12l6-6"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5L16 9.5"/>',
  heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
  send: '<path d="M21 3L3 11l7 3 3 7z"/><path d="M10 14l11-11"/>',
  box: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  cart: '<path d="M3 4h3l2.5 11h10L21 7H7"/><circle cx="10" cy="19.5" r="1.5"/><circle cx="18" cy="19.5" r="1.5"/>',
  arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  flag: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.5 3 3.5 15 0 18M12 3c-3.5 3-3.5 15 0 18"/>',
  truck: '<path d="M2 6h11v10H2zM13 10h4l4 3v3h-8"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  down: '<path d="M3 7l6 6 4-4 8 8M15 17h6v-6"/>',
  up: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17v.5"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  wallet: '<path d="M3 7h16a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2z"/><path d="M3 7l12-3v3M16 14h2"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-4 3-6 7-6s7 2 7 6M17 5a3.5 3.5 0 0 1 0 6.5M18 14c2.5.6 4 2.5 4 6"/>',
  bell: '<path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4"/>',
  ret: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/>',
  warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  megaphone: '<path d="M4 10v4h4l8 4V6L8 10z"/><path d="M19 9a4 4 0 0 1 0 6"/>',
};
export function ico(name, size = 44, color = '#fff', sw = 2.6, extra = '') {
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" style="flex:none;overflow:visible;${extra}">${P[name] || ''}</svg>`;
}
export const star = (s = 22, c = '#FFB800') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="flex:none"><path fill="${c}" d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.5 6 20.9l1.3-6.7-5-4.7 6.8-.8z"/></svg>`;

/** аватар-кружок с силуэтом */
export function avatar(size = 80, c1 = '#5A6B9A', c2 = '#2B3558', stroke = '#fff') {
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;flex:none;background:linear-gradient(145deg,${c1},${c2});display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 2px rgba(255,255,255,.18)">${ico('user', size * 0.58, stroke, 2.2)}</div>`;
}

/** «фото» товара: градиент + силуэт куртки */
export function photo(w, h, jacket = '#2E4A9E', a = '#DCE6FF', b = '#A9C2FF', id = 'p') {
  return `<svg width="${w}" height="${h}" viewBox="0 0 512 450" preserveAspectRatio="xMidYMid slice" style="display:block">
  <defs><linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
  <linearGradient id="${id}j" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${jacket}"/><stop offset="1" stop-color="#14224F"/></linearGradient></defs>
  <rect width="512" height="450" fill="url(#${id}bg)"/>
  <ellipse cx="256" cy="418" rx="150" ry="16" fill="rgba(10,20,60,.22)"/>
  <path d="M186 120 L326 120 L400 175 L380 250 L350 235 L350 420 L162 420 L162 235 L132 250 L112 175 Z" fill="url(#${id}j)"/>
  <path d="M206 120 Q256 160 306 120 L296 108 Q256 92 216 108 Z" fill="rgba(255,255,255,.28)"/>
  <rect x="252" y="140" width="8" height="280" fill="rgba(255,255,255,.4)"/>
  <rect x="180" y="330" width="62" height="10" rx="5" fill="rgba(255,255,255,.22)"/><rect x="270" y="330" width="62" height="10" rx="5" fill="rgba(255,255,255,.22)"/>
  </svg>`;
}

let _pc = 0;
/** карточка товара маркетплейса 440×640, левый верх (x,y); масштаб — gsap */
export function productCard(parent, x, y, o = {}) {
  const id = 'pc' + (++_pc);
  const d = A(parent, `left:${x}px;top:${y}px;width:440px;height:640px;border-radius:30px;background:#fff;overflow:hidden;color:${COL.ink};
   box-shadow:0 0 0 1px rgba(255,255,255,.5),0 0 60px rgba(${o.glow || '61,139,255'},.35),0 30px 70px rgba(0,0,0,.5);transform-origin:50% 50%`,
   `<div style="position:absolute;left:0;top:0;width:440px;height:330px">${photo(440, 330, o.jacket, o.a, o.b, id)}</div>
    ${o.badge ? `<div class="rm-p" style="left:20px;top:20px;padding:8px 18px;font-size:22px;background:${o.badgeBg || COL.red};color:#fff;border-radius:12px">${o.badge}</div>` : ''}
    <div class="rm-a" style="left:26px;top:346px;font-size:54px;font-weight:900;letter-spacing:-1px">${o.price || '2 490 ₽'}${o.old ? `<span style="font-size:26px;font-weight:500;color:#8B93A7;text-decoration:line-through;margin-left:14px">${o.old}</span>` : ''}</div>
    <div class="rm-a" style="left:26px;top:420px;font-size:24px;font-weight:500;color:#3C4358">${o.title || 'Куртка демисезонная'}</div>
    <div class="rm-a" style="left:26px;top:462px;display:flex;align-items:center;gap:3px">${star(24).repeat(5)}<span style="font-size:22px;font-weight:800;margin-left:10px">${o.rate || '4,9'}</span><span style="font-size:22px;color:#8B93A7;font-weight:500;margin-left:8px">${o.reviews || '1 284 отзыва'}</span></div>
    <div class="rm-a" style="left:26px;top:508px;font-size:21px;color:#8B93A7;font-weight:500">${o.seller || 'Продавец: Ваш магазин'}</div>
    <div class="rm-p" style="left:24px;top:552px;width:392px;height:64px;border-radius:18px;background:#005BFF;color:#fff;font-size:27px">${ico('cart', 30, '#fff', 2.4)}${o.cta || 'В корзину'}</div>`);
  return d;
}

/** курсор мыши по точкам [{t,x,y,c}] (t — момент прибытия; c — клик). Возвращает f(lt). */
export function cursor(parent, pts, o = {}) {
  const col = o.color || '#fff';
  const el = A(parent, 'left:0;top:0;width:40px;height:40px;z-index:60;pointer-events:none;opacity:0;transform-origin:0 0',
    `<svg width="40" height="40" viewBox="0 0 28 28" style="overflow:visible;filter:drop-shadow(0 6px 10px rgba(0,0,0,.5))"><path d="M3 2L3 22 8.5 17 12 25 15.2 23.6 11.7 16 19 16Z" fill="${col}" stroke="#0B0F1E" stroke-width="1.6" stroke-linejoin="round"/></svg>`);
  const rip = pts.filter((p) => p.c).map((p) => ({ p, e: A(parent, `left:${p.x}px;top:${p.y}px;width:70px;height:70px;margin:-35px 0 0 -35px;border-radius:50%;border:5px solid ${o.ripple || '#fff'};opacity:0;z-index:55;pointer-events:none`) }));
  const em = ease('power2.inOut');
  return (lt) => {
    const p0 = pts[0];
    let x = p0.x, y = p0.y, op = clamp((lt - (p0.t - 0.25)) / 0.25), press = 1;
    if (lt >= p0.t) for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], s = a.t + (a.hold ?? 0.12);
      if (lt >= s && lt < b.t) { const k = em((lt - s) / (b.t - s)); x = lerp(a.x, b.x, k); y = lerp(a.y, b.y, k); break; }
      if (lt >= b.t) { x = b.x; y = b.y; }
    }
    for (const r of pts) if (r.c) { const dt = lt - r.t; if (dt > 0 && dt < 0.18) press = 0.86; }
    if (o.until && lt > o.until) op = Math.max(0, 1 - (lt - o.until) / 0.25);
    el.style.opacity = op;
    el.style.transform = `translate(${x}px,${y}px) scale(${press})`;
    for (const { p, e } of rip) {
      const k = clamp((lt - p.t) / 0.45);
      e.style.opacity = k > 0 && k < 1 ? 0.75 * (1 - k) : 0;
      e.style.transform = `scale(${0.3 + k * 1.3})`;
    }
  };
}

/** печать текста в элемент */
export function typer(el, str, a, d, caretColor = '#fff') {
  return (lt) => {
    const k = clamp((lt - a) / d); const n = Math.floor(k * str.length + 1e-6);
    const on = lt >= a - 0.2 && lt < a + d + 0.9 && Math.floor(lt * 2.6) % 2 === 0;
    el.innerHTML = `${str.slice(0, n)}<span style="display:inline-block;width:3px;height:1em;margin-left:2px;vertical-align:-0.12em;background:${on ? caretColor : 'transparent'}"></span>`;
  };
}
/** счётчик */
export function counter(el, from, to, a, d, o = {}) {
  const e = ease(o.ease || 'power2.out');
  return (lt) => {
    const k = e(clamp((lt - a) / d)); const v = lerp(from, to, k);
    el.textContent = (o.pre || '') + fmt(v) + (o.suf || '');
    if (o.c1) el.style.color = mixc(o.c1, o.c2, k);
  };
}

let _ch = 0;
/** линейный график: f(u)→0..1 (высота). Возвращает set(k): раскрытие слева направо + точка на конце. */
export function chart(parent, x, y, w, h, f, color, o = {}) {
  const id = 'ch' + (++_ch), N = 90, pad = 12;
  const pts = []; for (let i = 0; i <= N; i++) { const u = i / N; pts.push([pad + u * (w - pad * 2), pad + (1 - f(u)) * (h - pad * 2)]); }
  const d = 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
  const grid = [0.25, 0.5, 0.75].map((g) => `<line x1="0" x2="${w}" y1="${(h * g).toFixed(1)}" y2="${(h * g).toFixed(1)}" stroke="rgba(255,255,255,.08)" stroke-width="2" stroke-dasharray="6 10"/>`).join('');
  const box = A(parent, `left:${x}px;top:${y}px;width:${w}px;height:${h}px`,
    `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="overflow:visible"><defs>
    <linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".4"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient>
    <clipPath id="${id}c"><rect id="${id}r" x="0" y="-20" width="0" height="${h + 40}"/></clipPath></defs>${grid}
    <g clip-path="url(#${id}c)"><path d="${d} L${w - pad} ${h} L${pad} ${h} Z" fill="url(#${id}f)"/>
    <path d="${d}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 10px ${color})"/></g>
    <circle id="${id}t" r="11" fill="#fff" stroke="${color}" stroke-width="6"/></svg>`);
  const rect = box.querySelector('#' + id + 'r'), tip = box.querySelector('#' + id + 't');
  const set = (k) => {
    k = clamp(k); rect.setAttribute('width', (pad + k * (w - pad * 2) + 2).toFixed(1));
    const i = Math.min(N, Math.round(k * N)); tip.setAttribute('cx', pts[i][0].toFixed(1)); tip.setAttribute('cy', pts[i][1].toFixed(1));
    tip.style.opacity = k > 0 ? 1 : 0;
  };
  set(0); set.el = box; set.tip = tip; return set;
}

/** мини-монета ₽ */
export function coin(parent, size = 46, c = COL.green) {
  return A(parent, `left:0;top:0;width:${size}px;height:${size}px;margin:${-size / 2}px 0 0 ${-size / 2}px;border-radius:50%;opacity:0;background:radial-gradient(circle at 35% 30%,#fff 0,${c} 55%);box-shadow:0 0 22px ${c};display:flex;align-items:center;justify-content:center;color:#05301C;font-weight:900;font-size:${size * 0.6}px`, '₽');
}
/** детерминированный rng */
export function rngf(seed = 1) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }

/** абсолютное время слова -> локальное время сцены, с опережением 0.12 с */
export const TT = (ctx) => (a) => Math.max(0.05, a - ctx.start - 0.12);
/** окно-хром: стеклянная карточка с шапкой (три точки + заголовок) */
export function win(parent, x, y, w, h, title = '', extra = '') {
  const g = G(parent, x, y, w, h, extra);
  A(parent, `left:${x + 26}px;top:${y + 20}px;display:flex;gap:9px`, [COL.red, '#FFC247', COL.green].map((c) => `<div style="width:14px;height:14px;border-radius:50%;background:${c};opacity:.85"></div>`).join(''));
  if (title) A(parent, `left:${x}px;top:${y + 14}px;width:${w}px;text-align:center;font-size:22px;font-weight:500;color:rgba(255,255,255,.6)`, title);
  return g;
}
/** подсветка пульса */
export const pulse = (lt, f = 6) => 0.5 + 0.5 * Math.sin(lt * f);
