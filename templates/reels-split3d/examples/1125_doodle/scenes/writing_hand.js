// Детальная векторная правая рука с маркером в позе письма.
// Поза как на референсе владельца: правая рука входит снизу, предплечье почти вертикально, кисть — мягкий кулак,
// большой палец прижимает маркер снизу, указательный (с ногтем) сверху, остальные поджаты.
// Локальные координаты: кончик маркера = (0,0), маркер идёт вдоль +x, кисть сверху (−y) и снизу (+y), предплечье уходит вправо-вниз (≈52° к маркеру). Поворот и положение задаёт setTip(x, y, angleDeg).
const NS = 'http://www.w3.org/2000/svg';
let UID = 0;

// ── геометрия ─────────────────────────────────────────────────────
function spline(pts, per = 14) {
  const out = [], n = pts.length;
  const P = (i) => pts[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < n - 1; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let s = 0; s < per; s++) {
      const t = s / per, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(pts[n - 1].slice());
  return out;
}
const f1 = (v) => v.toFixed(1);
const poly = (pts, close = true) => 'M' + pts.map((p) => f1(p[0]) + ' ' + f1(p[1])).join('L') + (close ? 'Z' : '');
const smoothClosed = (pts) => {
  const n = pts.length; let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d + 'Z';
};

/** Конечность по оси с переменной шириной: tip-cap круглый, у основания плоский. */
function limb(pts, widths) {
  const c = spline(pts, 18), N = c.length, per = (N - 1) / (pts.length - 1);
  const L = [], R = [], ctr = [];
  for (let i = 0; i < N; i++) {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(N - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
    const u = i / per, k = Math.min(widths.length - 2, Math.floor(u)), w = (widths[k] + (widths[k + 1] - widths[k]) * (u - k)) / 2;
    const nx = ty, ny = -tx;
    L.push([c[i][0] + nx * w, c[i][1] + ny * w]); R.push([c[i][0] - nx * w, c[i][1] - ny * w]); ctr.push(c[i]);
  }
  // круглый кончик: дуга от левой стороны к правой через вынос кончика
  const r = widths[0] / 2, a0 = c[0], a1 = c[Math.min(3, N - 1)];
  const ox = a0[0] - a1[0], oy = a0[1] - a1[1];
  const aL = Math.atan2(L[0][1] - a0[1], L[0][0] - a0[0]);
  let dir = 1;
  { const mx = Math.cos(aL + Math.PI / 2), my = Math.sin(aL + Math.PI / 2); if (mx * ox + my * oy < 0) dir = -1; }
  const capPts = [];
  for (let i = 0; i <= 12; i++) { const t = aL + dir * (i / 12) * Math.PI; capPts.push([a0[0] + Math.cos(t) * r, a0[1] + Math.sin(t) * r]); }
  return { d: poly(R.concat(L.slice().reverse()).concat(capPts)), edge: poly(L.slice().reverse().concat(capPts).concat(R), false), L, R, ctr, capPts, r };
}

// ── сборка разметки ───────────────────────────────────────────────
export function writingHandMarkup(opts = {}) {
  const id = 'wh' + (++UID);
  const accent = opts.accent || '#1D4ED8';
  const OUT = '#6A3E2C', OW = 2.2;
  const g = (s) => `url(#${id}${s})`;

  // предплечье: ось от запястья (415,115) под 52°
  const AX = Math.cos(52 * Math.PI / 180), AY = Math.sin(52 * Math.PI / 180), NXa = -AY, NYa = AX;
  const arm = (s0, s1) => { const L = [], R = []; for (let s = s0; s <= s1; s += 60) { const hw = 64 + Math.max(0, s) * 0.075 + (s < 120 ? 0 : 0); const cx = 415 + AX * s, cy = 115 + AY * s; L.push([cx + NXa * hw, cy + NYa * hw]); R.push([cx - NXa * hw, cy - NYa * hw]); } return poly(L.concat(R.reverse())); };
  const armD = arm(-10, 1700);

  // кисть-кулак (мягкий, без рукава)
  const mass = smoothClosed([[84, -34], [92, -104], [134, -150], [196, -164], [262, -156], [318, -138], [362, -98], [410, -34], [462, 36], [486, 84], [452, 148], [384, 176], [310, 176], [226, 130], [150, 70], [112, 14]]);

  const idx = limb([[300, -122], [230, -152], [162, -140], [120, -102], [106, -52]], [88, 82, 76, 70, 62]);
  const thb = limb([[66, 32], [136, 62], [212, 100], [296, 140], [372, 168]], [62, 68, 78, 92, 108]);

  const shade = (name, lb, sw = 20) => `<clipPath id="${id}c${name}"><path d="${lb.d}"/></clipPath>
    <g clip-path="url(#${id}c${name})">
      <path d="${poly(lb.R, false)}" fill="none" stroke="#A8664C" stroke-opacity=".55" stroke-width="${sw * 1.8}" filter="${g('b9')}"/>
      <path d="${poly(lb.ctr.map((p, i) => [(p[0] * 2 + lb.L[i][0]) / 3, (p[1] * 2 + lb.L[i][1]) / 3]), false)}" fill="none" stroke="#FFF1E2" stroke-opacity=".5" stroke-width="${sw * 0.8}" stroke-linecap="round" filter="${g('b6')}"/>
    </g>`;
  const limbSvg = (name, lb, extra = '', fadeFrom = null) => {
    let mask = '', open = '', close = '';
    if (fadeFrom) {
      const p0 = lb.ctr[0], pn = lb.ctr[lb.ctr.length - 1], at = (k) => [p0[0] + (pn[0] - p0[0]) * k, p0[1] + (pn[1] - p0[1]) * k], a = at(fadeFrom), z = at(0.99);
      mask = `<linearGradient id="${id}mg${name}" gradientUnits="userSpaceOnUse" x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(z[0])}" y2="${f1(z[1])}"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
      <mask id="${id}mk${name}" maskUnits="userSpaceOnUse" x="-300" y="-500" width="1400" height="1000"><rect x="-300" y="-500" width="1400" height="1000" fill="url(#${id}mg${name})"/></mask>`;
      open = `<g mask="url(#${id}mk${name})">`; close = '</g>';
    }
    return `${mask}${open}<path d="${lb.d}" transform="translate(5 8)" fill="#3a1d12" fill-opacity=".3" filter="${g('b6')}"/><path d="${lb.d}" fill="${g('skin')}"/>${shade(name, lb)}<path d="${lb.edge}" fill="none" stroke="${OUT}" stroke-width="${OW}" stroke-linejoin="round" stroke-linecap="round"/>${close}${extra}`;
  };
  const crease = (lb, u, len, bow) => {
    const i = Math.round(u * (lb.ctr.length - 1)), a = lb.L[i], b = lb.R[i], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy), ux = dx / m, uy = dy / m;
    return `<path d="M${f1(mx - ux * len / 2)} ${f1(my - uy * len / 2)}Q${f1(mx - uy * bow)} ${f1(my + ux * bow)} ${f1(mx + ux * len / 2)} ${f1(my + uy * len / 2)}" fill="none" stroke="${OUT}" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>`;
  };

  // ноготь указательного: на кончике, повёрнут по направлению пальца (палец идёт вниз к маркеру)
  const nail = `<g transform="translate(106 -76) rotate(-4)">
      <path d="M-22 -18 C-6 -26 14 -26 24 -16 C30 -6 28 12 22 24 C10 32 -10 32 -22 24 C-30 8 -30 -8 -22 -18Z" fill="#FBE3D6" stroke="${OUT}" stroke-opacity=".8" stroke-width="2"/>
      <path d="M-14 -12 C-4 -18 10 -18 16 -12" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M-18 14 C-8 22 8 22 18 14" fill="none" stroke="#D9A48C" stroke-opacity=".6" stroke-width="2.5" stroke-linecap="round"/></g>`;

  // маркер
  const pen = `<g>
      <path d="M2 -4 Q-2 0 2 4 L58 13 L58 -13Z" fill="#26262B" stroke="#0E0E10" stroke-width="2" stroke-linejoin="round"/>
      <path d="M56 -14 L128 -22 L128 22 L56 14Z" fill="${g('pen')}" stroke="#2A2A30" stroke-width="2.2" stroke-linejoin="round"/>
      <rect x="126" y="-23" width="340" height="46" rx="9" fill="${g('pen')}" stroke="#2A2A30" stroke-width="2.2"/>
      <rect x="226" y="-23" width="130" height="46" fill="${accent}" stroke="#2A2A30" stroke-width="2.2"/><rect x="226" y="-23" width="130" height="46" fill="${g('penband')}"/>
      <rect x="244" y="-8" width="72" height="4.5" rx="2" fill="#fff" fill-opacity=".85"/><rect x="244" y="2" width="48" height="3.5" rx="2" fill="#fff" fill-opacity=".6"/>
      <path d="M136 -17 L458 -17" stroke="#fff" stroke-opacity=".8" stroke-width="3" stroke-linecap="round"/>
      <rect x="462" y="-26" width="64" height="52" rx="11" fill="${accent}" stroke="#2A2A30" stroke-width="2.2"/><rect x="462" y="-26" width="64" height="52" rx="11" fill="${g('penband')}"/>
    </g>`;
  const penShadow = `<path d="M130 18 L500 30 L500 54 L130 40Z" fill="#6B3A2A" fill-opacity=".38" filter="${g('b6')}"/>`;

  return `<g class="whand" data-uid="${id}">
  <defs>
    <linearGradient id="${id}skin" gradientUnits="userSpaceOnUse" x1="60" y1="-190" x2="520" y2="260"><stop offset="0" stop-color="#F5D6BF"/><stop offset=".5" stop-color="#E8BC9F"/><stop offset="1" stop-color="#D49A7B"/></linearGradient>
    <linearGradient id="${id}armg" gradientUnits="userSpaceOnUse" x1="${f1(415 + NXa * 90)}" y1="${f1(115 + NYa * 90)}" x2="${f1(415 - NXa * 90)}" y2="${f1(115 - NYa * 90)}"><stop offset="0" stop-color="#F3D2BA"/><stop offset=".55" stop-color="#E5B497"/><stop offset="1" stop-color="#CC8F70"/></linearGradient>
    <linearGradient id="${id}pen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#EDEDEA"/><stop offset="1" stop-color="#B5B5B5"/></linearGradient>
    <linearGradient id="${id}penband" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>
    <filter id="${id}b1" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1"/></filter>
    <filter id="${id}b6" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="${id}b9" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>
    <clipPath id="${id}cm"><path d="${mass}"/></clipPath><clipPath id="${id}ca"><path d="${armD}"/></clipPath>
  </defs>
  <!-- предплечье -->
  <path d="${armD}" fill="${g('armg')}"/>
  <g clip-path="${g('ca')}"><path d="${arm(-10, 1700)}" fill="none"/>
    <path d="M${f1(415 - NXa * 40)} ${f1(115 - NYa * 40)} L${f1(415 - NXa * 40 + AX * 900)} ${f1(115 - NYa * 40 + AY * 900)}" stroke="#FFF1E2" stroke-opacity=".35" stroke-width="40" filter="${g('b9')}" fill="none"/>
    <path d="M${f1(415 + NXa * 70)} ${f1(115 + NYa * 70)} L${f1(415 + NXa * 70 + AX * 900)} ${f1(115 + NYa * 70 + AY * 900)}" stroke="#A8664C" stroke-opacity=".4" stroke-width="40" filter="${g('b9')}" fill="none"/></g>
  <path d="${armD}" fill="none" stroke="${OUT}" stroke-width="${OW}" stroke-linejoin="round" stroke-opacity=".8"/>
  <!-- кисть -->
  <path d="${mass}" fill="${g('skin')}"/>
  <g clip-path="${g('cm')}">
    <path d="M110 -18 C150 -66 230 -70 290 -50" fill="none" stroke="#7A3A2C" stroke-opacity=".6" stroke-width="40" stroke-linecap="round" filter="${g('b9')}"/>
    <path d="M440 60 C400 130 330 164 240 130" fill="none" stroke="#A8664C" stroke-opacity=".5" stroke-width="44" filter="${g('b9')}"/>
    <path d="M150 -150 C220 -176 300 -160 350 -112" fill="none" stroke="#FFF1E2" stroke-opacity=".5" stroke-width="34" filter="${g('b9')}"/>
    <g fill="#FFF1E2" fill-opacity=".5" filter="${g('b6')}"><ellipse cx="238" cy="-126" rx="26" ry="18"/><ellipse cx="296" cy="-112" rx="24" ry="17"/><ellipse cx="344" cy="-84" rx="20" ry="16"/></g>
    <g fill="none" stroke="#8C4F3A" stroke-opacity=".5" stroke-width="2.2" stroke-linecap="round"><path d="M226 -118 q14 -10 28 0"/><path d="M284 -104 q14 -10 26 0"/><path d="M334 -78 q12 -8 24 0"/><path d="M300 -40 C340 -20 380 10 420 40" stroke-opacity=".3"/><path d="M270 -30 C320 0 360 40 400 74" stroke-opacity=".25"/></g>
  </g>
  <path d="${mass}" fill="none" stroke="${OUT}" stroke-width="${OW}" stroke-linejoin="round" stroke-opacity=".85"/>
  ${penShadow}
  ${pen}
  <!-- большой палец снизу и указательный сверху зажимают маркер -->
  ${limbSvg('t', thb, crease(thb, 0.3, 66, 6) + crease(thb, 0.6, 80, 7), 0.86)}
  ${limbSvg('i', idx, crease(idx, 0.5, 70, 7) + nail, 0.8)}
</g>`;
}

export function makeWritingHand(parent, opts = {}) {
  const wrap = document.createElementNS(NS, 'g');
  wrap.innerHTML = writingHandMarkup(opts);
  parent.appendChild(wrap);
  const inner = wrap.firstElementChild;
  let ang = opts.angle ?? 52;
  const api = {
    el: wrap,
    setTip(x, y, angleDeg = ang) {
      ang = angleDeg;
      wrap.setAttribute('transform', `translate(${(+x).toFixed(1)} ${(+y).toFixed(1)}) rotate(${angleDeg}) scale(${opts.scale ?? 1})`);
    },
    setVisible(v) { wrap.style.visibility = v ? 'visible' : 'hidden'; },
  };
  return api;
}
