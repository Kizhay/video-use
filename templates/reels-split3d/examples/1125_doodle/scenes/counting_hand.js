// Рисованная кисть, вид СВЕРХУ/С ТЫЛЬНОЙ стороны (ногти и костяшки видны, ладони нет), скетч маркером; пальцы сгибаются по очереди.
// Координаты — как в сценах 1125_doodle: основание пальцев y≈654, ладонь x 366..690, низ y 892.
//
// makeCountingHand(parent, opts) → { el, outlineD(), setProgress(p, q), setFold(i, k) }
//   outlineD()  — контур кисти ОДНОЙ замкнутой линией (от низа ладони влево, вверх, вокруг пальцев, вниз и в замыкание)
//   setProgress(p, q) — p: 0..1 сколько контура прорисовано (до p=1 видна только чёрная линия);
//                       q: 0..1 проявление заливки/ногтей/линий ладони/складок (только после замыкания)
//   setFold(i, k) — палец i (0 указательный, 1 средний, 2 безымянный, 3 мизинец), k: 0 прямой .. 1 согнут
// Всё — чистая функция аргументов (кадры можно рисовать вразнобой).
const NS = 'http://www.w3.org/2000/svg';
let UID = 0;
const el = (n, a = {}, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
const f1 = (v) => (+v).toFixed(1);
const cl = (x) => Math.max(0, Math.min(1, x));
const mix = (a, b, t) => a + (b - a) * t;
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mixC = (a, b, t) => { const A = hex(a), B = hex(b); return 'rgb(' + A.map((v, i) => Math.round(mix(v, B[i], t))).join(',') + ')'; };

const BASE = 654;
const FX = [420, 494, 568, 642], LEN = [226, 273, 238, 173], WID = [66, 66, 64, 58];
const SPLAY = [-5, 0, 4, 9], SPLIT = [0.44, 0.31, 0.25], JOINT = [82, 108, 58];
const dirOf = (deg) => { const a = deg * Math.PI / 180; return [Math.sin(a), -Math.cos(a)]; };

/** центры сочленений пальца i при сгибе k (проекция на плоскость ладони) */
export function fingerJoints(i, k) {
  const d = dirOf(SPLAY[i]), segs = SPLIT.map((s) => (LEN[i] - WID[i] / 2) * s);
  let ph = 0, x = FX[i], y = BASE; const pts = [[x, y]];
  for (let j = 0; j < 3; j++) { ph += JOINT[j] * k * Math.PI / 180; const e = Math.cos(ph) * segs[j]; x += d[0] * e; y += d[1] * e; pts.push([x, y]); }
  return { pts, segs, d };
}

/** капсула с круглыми торцами (центры торцов a, b); flat — плоский торец у основания */
function cap2(a, b, w, flat = false) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
  let ux = 0, uy = -1; if (len > 0.01) { ux = dx / len; uy = dy / len; }
  const nx = -uy, ny = ux, h = w / 2, P = (x, y) => f1(x) + ' ' + f1(y);
  const A1 = [a[0] + nx * h, a[1] + ny * h], A2 = [a[0] - nx * h, a[1] - ny * h], B1 = [b[0] + nx * h, b[1] + ny * h], B2 = [b[0] - nx * h, b[1] - ny * h];
  return `M${P(...A1)}L${P(...B1)}A${f1(h)} ${f1(h)} 0 0 0 ${P(...B2)}L${P(...A2)}` + (flat ? 'Z' : `A${f1(h)} ${f1(h)} 0 0 0 ${P(...A1)}Z`);
}

// контур кисти одной линией; up[i] — палец стоит (иначе линия идёт поверх основания пальца)
function silhouetteD(up) {
  const pts = [], add = (x, y) => pts.push([x, y]);
  add(532, 892);
  const bez = (c1, c2, e, from) => { for (let s = 1; s <= 10; s++) { const t = s / 10, u = 1 - t; add(u * u * u * from[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * e[0], u * u * u * from[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * e[1]); } };
  bez([456, 892], [400, 874], [378, 826], [532, 892]);
  bez([362, 790], [366, 740], [392, 700], [378, 826]);
  for (let i = 0; i < 4; i++) {
    const d = dirOf(SPLAY[i]), n = [d[1], -d[0]], h = WID[i] / 2, B = [FX[i], BASE];
    add(B[0] + n[0] * h, B[1] + n[1] * h);
    if (up[i]) {
      const C = [B[0] + d[0] * (LEN[i] - h), B[1] + d[1] * (LEN[i] - h)];
      add(C[0] + n[0] * h, C[1] + n[1] * h);
      const a0 = Math.atan2(n[1], n[0]); let sgn = 1;
      if (Math.cos(a0 + Math.PI / 2) * d[0] + Math.sin(a0 + Math.PI / 2) * d[1] < 0) sgn = -1;
      for (let s = 1; s < 16; s++) { const t = a0 + sgn * (s / 16) * Math.PI; add(C[0] + Math.cos(t) * h, C[1] + Math.sin(t) * h); }
      add(C[0] - n[0] * h, C[1] - n[1] * h);
    }
    add(B[0] - n[0] * h, B[1] - n[1] * h);
  }
  add(676, 652);
  bez([690, 720], [692, 790], [664, 842], [676, 652]);
  bez([646, 874], [604, 892], [532, 892], [664, 842]);
  return 'M' + pts.map((p) => f1(p[0]) + ' ' + f1(p[1])).join('L') + 'Z';
}

function nailAt(parent, c, angDeg, sc) {
  const g = el('g', { transform: `translate(${f1(c[0])} ${f1(c[1])}) rotate(${f1(angDeg)}) scale(${f1(sc)} ${f1(sc)})` }, parent);
  el('path', { d: 'M-17 12 C-19 -6 -12 -17 0 -17 C12 -17 19 -6 17 12 C10 17 -10 17 -17 12Z', fill: '#FFF1E8', stroke: '#111', 'stroke-width': 4, 'stroke-opacity': 0.85, 'stroke-linejoin': 'round' }, g);
  el('path', { d: 'M-9 -8 Q-2 -13 6 -9', fill: 'none', stroke: '#fff', 'stroke-width': 3.2, 'stroke-linecap': 'round' }, g);
  return g;
}

export function makeCountingHand(parent, o = {}) {
  const id = 'ch' + (++UID);
  const ink = o.ink || '#111111', SW = o.width || 9;
  const skin = o.fill || '#F6D9C4', skinDark = '#EDC6AA', nailC = '#FFF1E8';
  const root = el('g', { class: 'counting-hand', filter: `url(#${id}w)` }, parent);
  const defs = el('defs', {}, root);
  const fl = el('filter', { id: id + 'w', x: '-5%', y: '-5%', width: '110%', height: '110%' }, defs);
  el('feTurbulence', { type: 'fractalNoise', baseFrequency: '.018', numOctaves: '2', seed: '5', result: 'n' }, fl);
  el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: '4.5', xChannelSelector: 'R', yChannelSelector: 'G' }, fl);
  const LN = { fill: 'none', stroke: ink, 'stroke-width': SW, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };

  // 1) контур-силуэт: до замыкания только линия, потом под ней проявляется заливка
  const allUp = [true, true, true, true], up = allUp.slice();
  const outlineD = silhouetteD(allUp);
  const sil = el('path', { d: outlineD, ...LN, fill: skin, 'fill-opacity': 0 }, root);
  let Lall = 3300; try { Lall = sil.getTotalLength(); } catch (e) { /* оценка */ }

  // 2) детали ладони (проявляются после замыкания)
  const det = el('g', { opacity: 0 }, root);
  const dl = (d, w, op) => el('path', { d, fill: 'none', stroke: ink, 'stroke-width': SW * w, 'stroke-linecap': 'round', 'stroke-opacity': op }, det);
  // тыльная сторона: сухожилия к запястью, костяшки основания пальцев
  dl('M430 700 C440 770 452 820 478 866', 0.42, 0.45);
  dl('M498 702 C500 770 506 820 520 872', 0.42, 0.45);
  dl('M566 702 C562 770 556 820 548 872', 0.42, 0.45);
  dl('M636 702 C622 770 600 820 572 866', 0.42, 0.45);
  FX.forEach((x) => { dl(`M${x - 22} 690 Q${x} 674 ${x + 22} 690`, 0.55, 0.8); });
  dl('M470 884 Q532 896 600 884', 0.4, 0.4);
  // большой палец прижат к боку кисти; ноготь виден сбоку
  const th = [[412, 842], [404, 782], [410, 728]];
  el('path', { d: cap2(th[0], th[1], 62), ...LN, fill: skin }, det);
  el('path', { d: cap2(th[1], th[2], 54), ...LN, fill: skin }, det);
  el('path', { d: 'M388 752 q22 -10 44 0', ...LN, 'stroke-width': SW * 0.5, 'stroke-opacity': 0.7 }, det);
  nailAt(det, [412, 712], 0, 0.78);
  // ногти и складки на суставах прямых пальцев (костяшки PIP/DIP)
  const creases = [0, 1, 2, 3].map((i) => {
    const g = el('g', {}, det); const { pts, d } = fingerJoints(i, 0), n = [-d[1], d[0]], w = WID[i];
    for (let c = 1; c <= 2; c++) for (let r = -1; r <= (c === 1 ? 1 : 0); r++) {
      const p = [pts[c][0] + d[0] * r * 8, pts[c][1] + d[1] * r * 8], half = w * (c === 1 ? 0.24 : 0.2);
      el('path', { d: `M${f1(p[0] - n[0] * half)} ${f1(p[1] - n[1] * half)}L${f1(p[0] + n[0] * half)} ${f1(p[1] + n[1] * half)}`, ...LN, 'stroke-width': SW * 0.42, 'stroke-opacity': 0.6 }, g);
    }
    nailAt(g, [pts[3][0] - d[0] * w * 0.17, pts[3][1] - d[1] * w * 0.17], Math.atan2(d[0], -d[1]) * 180 / Math.PI, w / 66);
    return g;
  });

  // 3) согнутые пальцы — поверх всего: три круглых фаланги слиты в одну подушечку, ноготь сверху
  const over = el('g', {}, root);
  const fing = [0, 1, 2, 3].map(() => {
    const g = el('g', { display: 'none' }, over);
    const sS = [0, 1, 2].map(() => el('path', { d: '', ...LN }, g));
    const sF = [0, 1, 2].map(() => el('path', { d: '', fill: skin, stroke: 'none' }, g));
    const sh = el('path', { d: '', ...LN, stroke: '#D9A07F', 'stroke-width': 9 }, g);
    const kn = el('path', { d: '', ...LN, 'stroke-width': SW * 0.55, 'stroke-opacity': 0.8 }, g);
    const nail = nailAt(g, [0, 0], 0, 1);
    return { g, sS, sF, kn, sh, nail, k: 0 };
  });

  function setFold(i, k) {
    k = cl(k); const F = fing[i]; if (F.k === k && F.done) return; F.k = k; F.done = true;
    const wasUp = up[i]; up[i] = k < 0.001;
    if (wasUp !== up[i]) sil.setAttribute('d', silhouetteD(up));
    creases[i].setAttribute('display', up[i] ? 'inline' : 'none');
    F.g.setAttribute('display', up[i] ? 'none' : 'inline');
    if (up[i]) return;
    // палец уходит от нас внутрь: сверху вниз укорачивается до выпуклой костяшки; ноготь пропадает первым
    const d = dirOf(SPLAY[i]), w = WID[i], h = w / 2, n = [-d[1], d[0]];
    const Lfull = LEN[i] - h, bump = 18, Lv = Lfull + (bump - Lfull) * k;
    const A = [FX[i], BASE], T = [A[0] + d[0] * Lv, A[1] + d[1] * Lv];
    const ww = w * (1 - 0.06 * k);
    const fill = mixC(skin, skinDark, cl(k * 1.2));
    F.sS[0].setAttribute('d', cap2(A, T, ww, true));
    F.sF[0].setAttribute('d', cap2(A, T, ww - SW, true)); F.sF[0].setAttribute('fill', fill);
    F.sS[1].setAttribute('d', ''); F.sF[1].setAttribute('d', ''); F.sS[2].setAttribute('d', ''); F.sF[2].setAttribute('d', '');
    // костяшка: складка-дуга у верха и мягкая тень там, где палец уходит за кисть
    const kc = [T[0] - d[0] * h * 0.1, T[1] - d[1] * h * 0.1], hf = ww * 0.3;
    F.kn.setAttribute('d', `M${f1(kc[0] - n[0] * hf)} ${f1(kc[1] - n[1] * hf)}Q${f1(kc[0] + d[0] * 8)} ${f1(kc[1] + d[1] * 8)} ${f1(kc[0] + n[0] * hf)} ${f1(kc[1] + n[1] * hf)}`);
    F.kn.setAttribute('opacity', String(cl((k - 0.2) * 2)));
    const r2 = h - SW * 0.9, a0 = Math.atan2(n[1], n[0]);
    const arc = []; for (let s2 = 0; s2 <= 14; s2++) { const t = a0 + Math.PI * (s2 / 14) * (n[0] * d[1] - n[1] * d[0] > 0 ? 1 : -1); arc.push([T[0] + Math.cos(t) * r2, T[1] + Math.sin(t) * r2]); }
    F.sh.setAttribute('d', 'M' + arc.map((p) => f1(p[0]) + ' ' + f1(p[1])).join('L'));
    F.sh.setAttribute('opacity', String(cl(k * 1.4) * 0.6));
    // ноготь сжимается к верхнему краю и скрывается к k≈0.4
    const sy = cl(1 - k / 0.4), sc = w / 66;
    F.nail.setAttribute('display', sy > 0.02 ? 'inline' : 'none');
    const ang = Math.atan2(d[1], d[0]) * 180 / Math.PI + 90;
    F.nail.setAttribute('transform', `translate(${f1(T[0] - d[0] * w * 0.17)} ${f1(T[1] - d[1] * w * 0.17)}) rotate(${f1(ang)}) scale(${f1(sc)} ${f1(sc * sy)})`);
  }
  for (let i = 0; i < 4; i++) setFold(i, 0);

  function setProgress(p, q) {
    p = cl(p); q = p >= 1 ? cl(q) : 0;
    if (p <= 0) sil.setAttribute('stroke-opacity', 0); else sil.removeAttribute('stroke-opacity');
    if (p < 1) { sil.setAttribute('stroke-dasharray', `${f1(Lall * p)} ${f1(Lall * 3)}`); }
    else sil.removeAttribute('stroke-dasharray');
    sil.setAttribute('fill-opacity', q); det.setAttribute('opacity', q);
    over.setAttribute('opacity', p >= 1 ? 1 : 0);
  }
  setProgress(1, 1);
  return { el: root, outlineD: () => outlineD, setProgress, setFold };
}
