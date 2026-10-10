import { C } from './_ui.js';
export const svgI = (p, size = 48, color = C.ink, sw = 4) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" style="color:${color};display:block;overflow:visible">${p}</svg>`;
export const DOWN = '<path d="M24 8v30M10 26l14 14 14-14"/>';
export const UP = '<path d="M24 40V10M10 22L24 8l14 14"/>';
export const WARN = '<path d="M24 6L44 41H4z"/><path d="M24 19v11M24 35v1"/>';
export const CART = '<path d="M5 8h6l5 22h20l4-16H13"/><circle cx="19" cy="38" r="3"/><circle cx="33" cy="38" r="3"/>';
export const DOC = '<path d="M12 5h18l8 8v30H12z"/><path d="M30 5v8h8M18 24h14M18 32h14"/>';
export const IMG = '<rect x="6" y="9" width="36" height="30" rx="4"/><circle cx="17" cy="20" r="3.5"/><path d="M8 36l11-10 8 7 6-5 9 8"/>';
export const FLAG = '<path d="M12 42V6M12 8h26l-6 9 6 9H12"/>';
/** плашка-чип: иконка + текст */
export function chip(A, { x, y, text, svg, color = C.ink, bg = C.soft, h = 76, size = 38, at = 0, right }) {
  const st = { top: y, height: h, padding: '0 30px 0 22px', borderRadius: 999, background: bg, display: 'flex', alignItems: 'center', gap: 16, fontSize: size, fontWeight: 800, color, whiteSpace: 'nowrap' };
  if (right !== undefined) st.right = right; else st.left = x;
  const d = A.E(A.card, st, `${svg || ''}<span class="nw">${text}</span>`);
  A.in(d, at, { y: 18 });
  return d;
}
export const T = (A, style, html, at, o) => { const d = A.E(A.card, style, html); A.in(d, at, o); return d; };
