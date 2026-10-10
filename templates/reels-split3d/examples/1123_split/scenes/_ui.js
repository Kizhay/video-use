// Общие хелперы версии 2 «Светлая инфографика»
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin.js';

export const C = { blue: '#005BFF', ink: '#0B0F1E', gray: '#8A93A6', red: '#FF3B4E', green: '#19C27A', line: '#E6E9F2', soft: '#F3F5FA' };
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const eo3 = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const eio = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const ei2 = (t) => clamp(t) * clamp(t);
export const ei3 = (t) => Math.pow(clamp(t), 3);
/** прогресс 0..1 на отрезке [a, a+d] */
export const seg = (lt, a, d, f = eo3) => f(clamp((lt - a) / d));
export const lerp = (a, b, t) => a + (b - a) * t;
export const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const NUMERIC_PX = new Set(['left', 'top', 'right', 'bottom', 'width', 'height', 'fontSize', 'borderRadius', 'padding', 'gap', 'letterSpacing', 'lineHeight_px', 'borderWidth', 'minWidth']);
function applyStyle(d, st) {
  if (!st) return;
  for (const k in st) { const v = st[k]; d.style[k] = (typeof v === 'number' && NUMERIC_PX.has(k)) ? v + 'px' : v; }
}
/** div внутри parent: абсолютная позиция по умолчанию */
export function E(parent, style = {}, html = '', cls = '') {
  const d = document.createElement('div');
  d.style.position = 'absolute'; d.style.boxSizing = 'border-box';
  if (cls) d.className = cls;
  d.innerHTML = html; applyStyle(d, style); parent.appendChild(d); return d;
}
/** SVG-обёртка: viewBox w×h */
export function S(parent, w, h, inner, style = {}) {
  return E(parent, { width: w, height: h, ...style }, `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="overflow:visible;display:block">${inner}</svg>`);
}

const gearTeeth = Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `M${24 + 13 * Math.cos(a)},${24 + 13 * Math.sin(a)}L${24 + 19 * Math.cos(a)},${24 + 19 * Math.sin(a)}`; }).join('');
const ICONS = {
  coin: '<circle cx="24" cy="24" r="19"/><path d="M19 34V14h7.5a5.5 5.5 0 010 11H19M16 29h12"/>',
  gear: `<circle cx="24" cy="24" r="6"/><circle cx="24" cy="24" r="13"/><path d="${gearTeeth}"/>`,
  mega: '<path d="M7 20v8h7l15 8V12L14 20H7z"/><path d="M35 19a7 7 0 010 10M15 28l2.5 10h5L20 29"/>',
  check: '<path d="M9 25l10 10 20-22"/>',
  x: '<path d="M11 11l26 26M37 11L11 37"/>',
  eyeoff: '<path d="M3 24s8-12 21-12 21 12 21 12-8 12-21 12S3 24 3 24z"/><circle cx="24" cy="24" r="5"/><path d="M8 41L40 7"/>',
  person: '<circle cx="24" cy="15" r="7.5"/><path d="M9 41c0-9.5 6-15 15-15s15 5.5 15 15"/>',
  link: '<path d="M20 28l8-8M17 22l-4 4a6 6 0 008.5 8.5l4-4M31 26l4-4a6 6 0 00-8.5-8.5l-4 4"/>',
  box: '<path d="M7 15L24 7l17 8v19L24 42 7 34z"/><path d="M7 15l17 9 17-9M24 24v18"/>',
  target: '<circle cx="24" cy="24" r="18"/><circle cx="24" cy="24" r="9"/><circle cx="24" cy="24" r="1.5"/>',
  up: '<path d="M8 32l11-11 8 8 13-15M30 14h10v10"/>',
  send: '<path d="M6 24L42 8 30 40l-6-14z"/>',
  card: '<rect x="8" y="6" width="32" height="36" rx="5"/><path d="M8 28h32"/>',
  shield: '<path d="M24 5l15 6v11c0 10-6 17-15 21C15 39 9 32 9 22V11z"/><path d="M17 24l5 5 9-10"/>',
  scan: '<circle cx="22" cy="22" r="13"/><path d="M32 32l11 11"/>',
  clock: '<circle cx="24" cy="24" r="19"/><path d="M24 12v13l8 5"/>',
};
/** линейная иконка (stroke currentColor), цвет через color */
export function ico(name, size = 48, color = C.ink, sw = 3.4) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" style="color:${color};display:block;overflow:visible">${ICONS[name]}</svg>`;
}

/** мини-карточка товара. mine — синяя, иначе серая. Возвращает div. */
export function tile(parent, { x, y, w = 190, h = 230, mine = false, copy = false, price = '2 490 ₽', tint }) {
  const col = tint || (mine ? C.blue : '#B4BBCB');
  const d = E(parent, { left: x, top: y, width: w, height: h, borderRadius: 22, background: '#fff', border: `${mine ? 4 : 2}px solid ${mine ? C.blue : C.line}`, boxShadow: mine ? '0 14px 30px rgba(0,91,255,.22)' : '0 8px 18px rgba(20,30,70,.08)' });
  E(d, { left: 10, top: 10, right: 10, height: price ? h * 0.58 : h - 20, borderRadius: 14, background: mine ? '#E4EDFF' : '#EDF0F6' },
    `<svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"><path d="M35 15l-22 12 8 16 10-5v42h38V38l10 5 8-16-22-12c-3 6-8 9-15 9s-12-3-15-9z" fill="${col}"/></svg>`);
  if (price) {
    E(d, { left: 14, bottom: 12, fontSize: 34, fontWeight: 900, color: mine ? C.ink : C.gray, lineHeight: 1, whiteSpace: 'nowrap' }, price);
    E(d, { left: 14, bottom: 60, width: w * 0.5, height: 8, borderRadius: 4, background: mine ? '#C9D8FF' : '#E1E5EE' });
  }
  if (copy) E(d, { right: -14, top: -18, padding: '6px 18px', borderRadius: 999, background: C.red, color: '#fff', fontSize: 34, fontWeight: 900, letterSpacing: 0.5, boxShadow: '0 6px 14px rgba(255,59,78,.35)' }, 'копия', 'badge');
  return d;
}

const CSS = `
.rm2 *{box-sizing:border-box}
.rm2{font-family:'MB',sans-serif;color:${C.ink}}
.rm2 .card{background:#fff;border-radius:28px;box-shadow:0 24px 60px rgba(20,30,70,.14),0 4px 12px rgba(20,30,70,.06)}
.rm2 .cap{font-size:38px;font-weight:800;letter-spacing:3px;color:${C.gray};text-transform:uppercase;white-space:nowrap}
.rm2 .badge{white-space:nowrap}
.rm2 .nw{white-space:nowrap}
`;

/**
 * Общий каркас сцены: фон-шапка (номер + капс-заголовок), белая карточка,
 * единый переход: въезд снизу 0.45 с power3.out, выезд вверх 0.3 с power2.in.
 */
export function boot(ctx, { n, label, h = 660, exit = true, breath = true }) {
  const { gsap, ui, dur } = ctx;
  gsap.registerPlugin(DrawSVGPlugin);
  const root = E(ui, { left: 0, top: 0, width: 1080, height: 960 }, '', 'rm2');
  const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
  const header = E(root, { left: 64, top: 26, height: 92, display: 'flex', alignItems: 'center', gap: 24 });
  header.style.position = 'absolute';
  const badge = E(header, { position: 'relative', minWidth: 124, height: 92, padding: '0 32px', borderRadius: 999, background: C.blue, color: '#fff', fontSize: 52, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(0,91,255,.35)' }, n);
  const lab = E(header, { position: 'relative' }, label, 'cap');
  const card = E(root, { left: 64, top: 140, width: 952, height: h }, '', 'card');

  const tl = gsap.timeline({ paused: true });
  tl.fromTo(card, { y: 150, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' }, 0);
  tl.fromTo(badge, { y: 40, opacity: 0, scale: 0.7 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.4)' }, 0.05);
  tl.fromTo(lab, { x: -24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: 'power3.out' }, 0.12);
  if (breath) tl.fromTo(card, { scale: 1 }, { scale: 1.012, duration: dur, ease: 'sine.inOut' }, 0);
  if (exit) {
    tl.to(card, { y: -110, opacity: 0, duration: 0.3, ease: 'power2.in' }, dur - 0.3);
    tl.to([badge, lab], { y: -50, opacity: 0, duration: 0.25, ease: 'power2.in' }, dur - 0.3);
  }
  const ups = [];
  const api = {
    gsap, tl, root, card, E, S, ico, tile, dur,
    up: (f) => ups.push(f),
    /** появление элемента: снизу + fade, 0.4 с */
    in: (t, at, o = {}) => tl.fromTo(t, { opacity: 0, y: o.y ?? 26, scale: o.s ?? 0.94 }, { opacity: 1, y: 0, scale: 1, duration: o.d ?? 0.4, ease: o.ease ?? 'power3.out', stagger: o.stagger ?? 0 }, at),
    /** акцентный поп с овершутом */
    pop: (t, at, o = {}) => tl.fromTo(t, { opacity: 0, scale: o.from ?? 0.4 }, { opacity: 1, scale: 1, duration: o.d ?? 0.45, ease: 'back.out(1.5)' }, at),
    /** рисование линии */
    draw: (t, at, d, ease = 'power1.inOut') => tl.fromTo(t, { drawSVG: '0%' }, { drawSVG: '100%', duration: d, ease }, at),
    done: () => ({ tl, update: (lt, p, t) => { for (const f of ups) f(lt, p, t); } }),
  };
  return api;
}
