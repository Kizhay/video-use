// Оверлеи поверх человека (BRIEF4): card / slam / sticker / shot / half. Вид задаётся ctx.params.kind.
// Всё детерминировано: состояние — чистая функция времени сцены (tl.seek + update(lt)); случайного нет.
import { board, RED, BLUE, shapes } from './_ui.js';

const YEL = '#FFD60A', INK = '#111111';
const cl = (x) => Math.max(0, Math.min(1, x));
const eOut = (t) => 1 - Math.pow(1 - cl(t), 3);
const SH = '0 3px 8px rgba(0,0,0,.6)';
const MBF = "MB, 'Montserrat', sans-serif";

function mk(parent, style = {}, html = '', tag = 'div') {
  const d = document.createElement(tag);
  Object.assign(d.style, { position: 'absolute', boxSizing: 'border-box' }, style);
  if (html) d.innerHTML = html;
  parent.appendChild(d);
  return d;
}
const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// ── 2) карточка-плашка сверху (y 130..390) ───────────────────────────
function card(ctx, p) {
  const { gsap, ui, dur } = ctx;
  const tl = gsap.timeline({ paused: true });
  const w = p.w || 800;
  const el = mk(ui, { left: (540 - w / 2) + 'px', top: '140px', width: w + 'px', padding: '26px 34px', borderRadius: '28px',
    background: 'rgba(255,255,255,.96)', boxShadow: '0 18px 44px rgba(0,0,0,.38), 0 3px 8px rgba(0,0,0,.25)', fontFamily: MBF,
    display: 'flex', alignItems: 'center', gap: '26px' });
  el.style.position = 'absolute';
  const icon = mk(el, { position: 'relative', width: '112px', height: '112px', borderRadius: '56px', background: p.color || RED, flex: '0 0 112px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '70px' }, p.icon || '!');
  const body = mk(el, { position: 'relative', flex: '1 1 auto' });
  let cnt = null;
  if (p.label) mk(body, { position: 'relative', fontWeight: 700, fontSize: '36px', color: '#6B7280', lineHeight: '1.1' }, p.label);
  if (p.count) cnt = mk(body, { position: 'relative', fontWeight: 900, fontSize: '112px', color: p.color || RED, lineHeight: '1.05', whiteSpace: 'nowrap' }, '');
  else mk(body, { position: 'relative', fontWeight: 900, fontSize: (p.size || 62) + 'px', color: INK, lineHeight: '1.08' }, p.title);
  if (p.sub) mk(body, { position: 'relative', fontWeight: 600, fontSize: '34px', color: '#374151', lineHeight: '1.2', marginTop: '6px' }, p.sub);
  tl.fromTo(el, { y: -110, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.42, ease: 'back.out(1.5)' }, 0);
  tl.fromTo(icon, { scale: 0.4, rotation: -25 }, { scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(2.4)' }, 0.12);
  tl.to(el, { y: -90, opacity: 0, duration: 0.26, ease: 'power2.in' }, dur - 0.28);
  return { tl, update(lt) {
    if (cnt) { const c = p.count, v = c.from + (c.to - c.from) * eOut((lt - 0.3) / 1.0); cnt.textContent = (c.pre || '') + fmt(v) + (c.suf || ''); }
  } };
}

// ── 6) слово-удар ────────────────────────────────────────────────────
function slam(ctx, p) {
  const { gsap, ui, dur } = ctx;
  const tl = gsap.timeline({ paused: true });
  const size = p.size || 140;
  const el = mk(ui, { left: '0px', top: '165px', width: '1080px', display: 'flex', justifyContent: 'center' });
  const pl = mk(el, { position: 'relative', background: p.bg || RED, color: p.fg || '#fff', fontFamily: MBF, fontWeight: 900, fontSize: size + 'px',
    lineHeight: '1.1', padding: '12px 44px 16px', borderRadius: '26px', whiteSpace: 'nowrap', boxShadow: '0 16px 40px rgba(0,0,0,.42), 0 3px 8px rgba(0,0,0,.3)',
    textShadow: p.fg === INK ? 'none' : '0 3px 0 rgba(0,0,0,.18)' }, p.word);
  const rot = p.rot ?? -3;
  // вписываем по ИЗМЕРЕННОЙ ширине плашки (DOM), с запасом на поворот и overshoot back.out (~1.1)
  const budget = 940 / 1.1 * Math.cos(Math.abs(rot) * Math.PI / 180) - 8;
  let wpl = pl.offsetWidth;
  if (wpl > budget) { pl.style.fontSize = (size * budget / wpl).toFixed(1) + 'px'; pl.style.padding = '12px ' + (44 * budget / wpl).toFixed(1) + 'px 16px'; wpl = pl.offsetWidth; }
  const s0 = Math.min(2.6, 1000 / wpl);
  tl.fromTo(pl, { scale: s0, opacity: 0, rotation: rot - 9 }, { scale: 1, opacity: 1, rotation: rot, duration: 0.28, ease: 'back.out(1.8)', transformOrigin: '50% 50%' }, 0);
  tl.to(pl, { x: 7, duration: 0.04, yoyo: true, repeat: 3, ease: 'none' }, 0.28);
  if (!p.noExit) tl.to(pl, { scale: 0.6, opacity: 0, duration: 0.2, ease: 'power2.in' }, dur - 0.22);
  return { tl };
}

// ── 1) стикер-иконка с подписью сбоку от лица ────────────────────────
const ICONS = {
  copies: `<svg width="120" height="120" viewBox="0 0 120 120"><g fill="none" stroke="#111" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="14" y="26" width="52" height="68" rx="9"/><rect x="48" y="18" width="52" height="68" rx="9" fill="#fff"/><path d="M60 46h28M60 60h20"/></g>
    <path d="M30 96 L96 30 M96 96 L30 30" stroke="${RED}" stroke-width="11" stroke-linecap="round"/></svg>`,
};
function sticker(ctx, p) {
  const { gsap, ui, dur } = ctx;
  const tl = gsap.timeline({ paused: true });
  const left = p.side === 'left';
  const el = mk(ui, { left: (left ? 40 : 840) + 'px', top: (p.y || 620) + 'px', width: '200px', textAlign: 'center' });
  const badge = mk(el, { position: 'relative', margin: '0 auto', width: '170px', height: '170px', borderRadius: '85px', background: '#fff',
    boxShadow: '0 14px 30px rgba(0,0,0,.4), 0 0 0 7px ' + (p.ring || YEL), display: 'flex', alignItems: 'center', justifyContent: 'center' }, ICONS[p.icon]);
  const cap = mk(el, { position: 'relative', marginTop: '16px', fontFamily: 'Caveat, cursive', fontWeight: 700, fontSize: '88px', lineHeight: '0.95',
    color: YEL, textShadow: SH, transform: 'rotate(-4deg)' }, p.caption);
  tl.fromTo(el, { scale: 0, rotation: left ? -18 : 18, opacity: 0 }, { scale: 1, rotation: left ? -4 : 4, opacity: 1, duration: 0.5, ease: 'back.out(2.4)', transformOrigin: '50% 40%' }, 0);
  tl.to(el, { y: -8, duration: 0.9, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0.5);
  tl.to(el, { scale: 0, opacity: 0, duration: 0.25, ease: 'back.in(2)' }, dur - 0.27);
  return { tl };
}

// ── 5) мини-«скриншот» интерфейса сбоку ──────────────────────────────
function shot(ctx, p) {
  const { gsap, ui, dur } = ctx;
  const tl = gsap.timeline({ paused: true });
  const left = p.side === 'left', X = left ? 26 : 804, Y = 540, Wd = 250;
  const el = mk(ui, { left: X + 'px', top: Y + 'px', width: Wd + 'px' });
  const win = mk(el, { position: 'relative', width: Wd + 'px', height: '300px', borderRadius: '22px', background: '#fff', overflow: 'hidden',
    boxShadow: '0 18px 40px rgba(0,0,0,.42), 0 3px 8px rgba(0,0,0,.3)', fontFamily: MBF });
  mk(win, { left: '0', top: '0', width: '100%', height: '44px', background: '#EEF1F6' },
    `<div style="position:absolute;left:14px;top:16px;width:12px;height:12px;border-radius:6px;background:#F26A5B"></div>
     <div style="position:absolute;left:34px;top:16px;width:12px;height:12px;border-radius:6px;background:#F5C04A"></div>
     <div style="position:absolute;left:54px;top:16px;width:12px;height:12px;border-radius:6px;background:#5BC57A"></div>
     <div style="position:absolute;left:84px;top:10px;font-weight:800;font-size:21px;color:#4B5563">${p.title}</div>`);
  const body = mk(win, { left: '0', top: '44px', width: '100%', height: '256px' });
  const items = [];
  if (p.variant === 'photo') {
    mk(body, { left: '16px', top: '14px', width: '218px', height: '150px', borderRadius: '14px', background: 'linear-gradient(135deg,#CBD9F2,#9FB6E3)' },
      `<svg width="218" height="150" viewBox="0 0 218 150"><circle cx="160" cy="44" r="18" fill="#FFF3B0"/><path d="M10 138 L78 62 L118 106 L146 78 L208 138Z" fill="#fff" opacity=".85"/></svg>`);
    const l1 = mk(body, { left: '16px', top: '180px', width: '150px', height: '14px', borderRadius: '7px', background: '#D5DAE3', transformOrigin: '0 50%' });
    const l2 = mk(body, { left: '16px', top: '204px', width: '100px', height: '14px', borderRadius: '7px', background: '#E3E7EE', transformOrigin: '0 50%' });
    const chip = mk(body, { left: '130px', top: '212px', padding: '4px 12px', borderRadius: '14px', background: RED, color: '#fff', fontWeight: 800, fontSize: '22px' }, 'только фото');
    tl.fromTo([l1, l2], { scaleX: 0 }, { scaleX: 1, duration: 0.3, stagger: 0.12, ease: 'power2.out' }, 0.55);
    tl.fromTo(chip, { scale: 0, rotation: -12 }, { scale: 1, rotation: -4, duration: 0.35, ease: 'back.out(2.6)' }, 1.0);
  } else if (p.variant === 'conv') {
    mk(body, { left: '16px', top: '8px', fontWeight: 800, fontSize: '24px', color: '#6B7280' }, 'конверсия в корзину');
    const svg = mk(body, { left: '10px', top: '44px' },
      `<svg width="230" height="170" viewBox="0 0 230 170"><path d="M10 12 V158 H222" fill="none" stroke="#C5CBD6" stroke-width="4" stroke-linecap="round"/>
       <path id="cv" d="M16 30 L56 44 L92 38 L128 84 L166 98 L214 148" fill="none" stroke="${RED}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
       <circle id="cd" cx="214" cy="148" r="11" fill="${RED}"/></svg>`);
    const path = svg.querySelector('#cv'), dot = svg.querySelector('#cd'), L = path.getTotalLength();
    path.style.strokeDasharray = L; dot.style.transformOrigin = '214px 148px';
    tl.fromTo(path, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: 0.9, ease: 'power1.inOut' }, 0.45);
    tl.fromTo(dot, { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, 1.3);
  } else if (p.variant === 'bars') {
    mk(body, { left: '16px', top: '8px', fontWeight: 800, fontSize: '24px', color: '#6B7280' }, 'копии за день');
    const b1 = mk(body, { left: '40px', top: '48px', width: '70px', height: '150px', borderRadius: '10px 10px 0 0', background: RED, transformOrigin: '50% 100%' });
    const b2 = mk(body, { left: '140px', top: '148px', width: '70px', height: '50px', borderRadius: '10px 10px 0 0', background: BLUE, transformOrigin: '50% 100%' });
    mk(body, { left: '16px', top: '202px', width: '218px', height: '4px', background: '#C5CBD6' });
    mk(body, { left: '22px', top: '212px', fontWeight: 800, fontSize: '21px', color: RED }, 'новые');
    mk(body, { left: '134px', top: '212px', fontWeight: 800, fontSize: '21px', color: BLUE }, 'удалено');
    tl.fromTo(b1, { scaleY: 0 }, { scaleY: 1, duration: 0.55, ease: 'back.out(1.4)' }, 0.5);
    tl.fromTo(b2, { scaleY: 0 }, { scaleY: 1, duration: 0.4, ease: 'power2.out' }, 0.95);
  }
  const cap = mk(el, { top: '314px', left: '0', width: Wd + 'px', textAlign: 'center', fontFamily: 'Caveat, cursive', fontWeight: 700, fontSize: '74px',
    lineHeight: '0.95', color: YEL, textShadow: SH, transform: 'rotate(' + (left ? -4 : 4) + 'deg)' }, p.caption);
  const sd = left ? -380 : 380;
  tl.fromTo(el, { x: sd, rotation: left ? -14 : 14, opacity: 0 }, { x: 0, rotation: left ? -3 : 3, opacity: 1, duration: 0.5, ease: 'back.out(1.6)' }, 0);
  tl.fromTo(cap, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2.4)' }, 0.8);
  tl.to(el, { x: sd, opacity: 0, duration: 0.3, ease: 'power2.in' }, dur - 0.32);
  return { tl };
}

// ── 4) «полэкрана»: лист на верхней части кадра, рука рисует скетч ───
function half(ctx, p) {
  const { ui } = ctx, HT = p.h || 480;
  const wrap = mk(ui, { left: '0px', top: '0px', width: '1080px', height: HT + 'px', overflow: 'hidden', borderRadius: '0 0 40px 40px',
    filter: 'drop-shadow(0 14px 16px rgba(0,0,0,.42))' });
  const b = board({ ...ctx, ui: wrap }, { accent: RED, seed: p.seed || 61 });
  p.draw(b);
  return b.finish();
}
const SKETCH = {
  // «потерял намного больше»: монета уходит к копии
  lost(b) {
    b.ellipse(190, 250, 92, 92, { at: 0.5, dur: 0.4, turns: 1.05, w: 10 });
    b.text('₽', 190, 262, { size: 120, at: 0.9, dur: 0.18 });
    b.arrow(320, 215, 560, 215, { at: 1.1, dur: 0.35, bend: 0.25, color: RED, w: 10 });
    b.rect(640, 100, 250, 290, { at: 1.5, dur: 0.35, r: 20, color: BLUE });
    b.line(shapes.tee(765, 255, 150), { at: 1.85, dur: 0.3, sharp: true, amp: 1.2, color: BLUE });
    b.text('−₽', 960, 200, { size: 130, color: RED, rot: -6, at: 2.1, dur: 0.3 });
  },
};

export default function setup(ctx) {
  const p = ctx.params || {};
  switch (p.kind) {
    case 'card': return card(ctx, p);
    case 'slam': return slam(ctx, p);
    case 'sticker': return sticker(ctx, p);
    case 'shot': return shot(ctx, p);
    case 'half': return half(ctx, { ...p, draw: SKETCH[p.sketch] });
    default: throw new Error('ov: неизвестный kind ' + p.kind);
  }
}
