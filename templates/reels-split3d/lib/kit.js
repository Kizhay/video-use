// Набор заготовок для сцен. Всё детерминировано: сцена — чистая функция времени.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const C = {
  bg: '#070B18', bg2: '#0E1630',
  blue: '#005BFF', blue2: '#3D8BFF', cyan: '#27D3FF',
  yellow: '#FFD60A', red: '#FF3B4E', green: '#19D27C',
  white: '#FFFFFF', gray: '#8B93A7', ink: '#0B0F1E',
};

// ── время и плавность ───────────────────────────────────────────────
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOutCubic = (t) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInCubic = (t) => Math.pow(clamp01(t), 3);
export const easeInOutCubic = (t) => { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOutBack = (t, s = 1.70158) => { t = clamp01(t); const c3 = s + 1; return 1 + c3 * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
export const easeOutElastic = (t) => { t = clamp01(t); if (t === 0 || t === 1) return t; return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1; };
/** прогресс 0..1 на отрезке [a, a+d] с плавностью fn */
export const seg = (lt, a, d, fn = easeOutCubic) => fn((lt - a) / d);
/** «включилось в момент a» — 0 до, 1 после, с поп-эффектом */
export const pop = (lt, a, d = 0.35) => easeOutBack((lt - a) / d);

export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
}

// ── 3D заготовки ────────────────────────────────────────────────────
export function mat(color, o = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: o.roughness ?? 0.35, metalness: o.metalness ?? 0.1,
    emissive: o.emissive ?? '#000000', emissiveIntensity: o.emissiveIntensity ?? 1, transparent: o.transparent ?? false,
    opacity: o.opacity ?? 1 });
}
export function roundedBox(w, h, d, r, material) {
  return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), material);
}

/** CanvasTexture из функции рисования (ctx, w, h) */
export function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'); draw(g, w, h);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}
export function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/** Плоскость с текстом (кириллица ок). Возвращает Mesh шириной worldW. */
export function textPlane(text, o = {}) {
  const size = o.size ?? 120, pad = o.pad ?? 30, font = `${o.weight ?? 900} ${size}px MB`;
  const meas = document.createElement('canvas').getContext('2d'); meas.font = font;
  const tw = Math.ceil(meas.measureText(text).width) + pad * 2, th = Math.ceil(size * 1.35) + pad;
  const tex = canvasTex(tw, th, (g) => {
    if (o.bg) { g.fillStyle = o.bg; roundRect(g, 0, 0, tw, th, o.radius ?? th / 4); g.fill(); }
    g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (o.stroke) { g.lineJoin = 'round'; g.lineWidth = o.strokeW ?? size * 0.16; g.strokeStyle = o.stroke; g.strokeText(text, tw / 2, th / 2 + size * 0.04); }
    g.fillStyle = o.color ?? '#fff'; g.fillText(text, tw / 2, th / 2 + size * 0.04);
  });
  const worldW = o.worldW ?? 3, worldH = worldW * th / tw;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(worldW, worldH),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  return m;
}

/** Карточка товара маркетплейса: белый скруглённый корпус + лицевая текстура. */
export function productCard(o = {}) {
  const w = o.w ?? 2, h = o.h ?? 2.8, d = o.d ?? 0.12;
  const grp = new THREE.Group();
  const body = roundedBox(w, h, d, 0.12, mat(o.body ?? '#ffffff', { roughness: 0.5 }));
  grp.add(body);
  const tex = canvasTex(512, 717, (g, W, H) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    // «фото» товара
    const grad = g.createLinearGradient(0, 0, W, 470);
    grad.addColorStop(0, o.photoA ?? '#DCE6FF'); grad.addColorStop(1, o.photoB ?? '#A9C2FF');
    g.fillStyle = grad; roundRect(g, 24, 24, W - 48, 450, 28); g.fill();
    if (o.drawPhoto) o.drawPhoto(g, 24, 24, W - 48, 450);
    else { // стилизованное изделие: куртка-силуэт
      g.fillStyle = o.itemColor ?? '#2E4A9E';
      g.beginPath(); g.moveTo(186, 120); g.lineTo(326, 120); g.lineTo(400, 175); g.lineTo(380, 250); g.lineTo(350, 235);
      g.lineTo(350, 420); g.lineTo(162, 420); g.lineTo(162, 235); g.lineTo(132, 250); g.lineTo(112, 175); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(252, 130, 8, 285);
    }
    if (o.badge) { g.fillStyle = o.badgeBg ?? C.red; roundRect(g, 40, 40, 190, 54, 14); g.fill();
      g.fillStyle = '#fff'; g.font = '800 30px MB'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.badge, 135, 69); }
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.fillStyle = o.priceColor ?? C.ink; g.font = '900 64px MB'; g.fillText(o.price ?? '2 490 ₽', 32, 560);
    g.fillStyle = '#5A6275'; g.font = '500 30px MB'; g.fillText(o.title ?? 'Куртка демисезонная', 32, 612);
    g.fillStyle = C.blue; roundRect(g, 32, 640, W - 64, 56, 16); g.fill();
    g.fillStyle = '#fff'; g.font = '800 28px MB'; g.textAlign = 'center'; g.fillText(o.cta ?? 'В корзину', W / 2, 678);
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.94, h * 0.94),
    new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true }));
  face.position.z = d / 2 + 0.003; grp.add(face);
  grp.userData = { body, face };
  return grp;
}

/** Монета с рублём */
export function coin(o = {}) {
  const r = o.r ?? 0.5, t = o.t ?? 0.12;
  const faceTex = canvasTex(256, 256, (g) => {
    const gr = g.createRadialGradient(128, 110, 20, 128, 128, 128);
    gr.addColorStop(0, '#FFF1A8'); gr.addColorStop(1, '#E9A900');
    g.fillStyle = gr; g.beginPath(); g.arc(128, 128, 128, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(150,90,0,.6)'; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 104, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#9A5B00'; g.font = '900 140px MB'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('₽', 128, 136);
  });
  const side = mat('#E2A400', { metalness: 0.8, roughness: 0.25 });
  const face = new THREE.MeshStandardMaterial({ map: faceTex, metalness: 0.6, roughness: 0.3 });
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, t, 48), [side, face, face]);
  m.rotation.x = Math.PI / 2;
  const g = new THREE.Group(); g.add(m); return g;
}

/** Стандартный свет: мягкий заполняющий + ключ + цветной контровой */
export function studioLights(scene, rim = C.blue2) {
  scene.add(new THREE.HemisphereLight('#ffffff', '#1a2244', 1.1));
  const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(4, 6, 8); scene.add(key);
  const rimL = new THREE.DirectionalLight(rim, 2.5); rimL.position.set(-6, 2, -4); scene.add(rimL);
  return { key, rimL };
}

// ── 2D-слой (HTML поверх 3D, координаты верхней половины 1080×960) ─────
export function el(parent, html, style = {}) {
  const d = document.createElement('div'); d.innerHTML = html;
  Object.assign(d.style, { position: 'absolute', whiteSpace: 'nowrap', willChange: 'transform' }, style);
  parent.appendChild(d); return d;
}
/** Плашка-тег: крупный капс с тенью. x,y — центр. */
export function tag(parent, text, o = {}) {
  const d = el(parent, text, {
    left: (o.x ?? 540) + 'px', top: (o.y ?? 120) + 'px', fontWeight: o.weight ?? 900, fontSize: (o.size ?? 56) + 'px',
    color: o.color ?? '#fff', background: o.bg ?? 'transparent', padding: o.bg ? (o.padding ?? '10px 26px') : '0',
    borderRadius: (o.radius ?? 18) + 'px', letterSpacing: (o.ls ?? 0) + 'px', textTransform: 'uppercase',
    textShadow: o.bg ? 'none' : '0 6px 0 rgba(0,0,0,.35), 0 0 30px rgba(0,0,0,.45)',
    boxShadow: o.bg ? '0 14px 40px rgba(0,0,0,.45)' : 'none', lineHeight: 1.05, textAlign: 'center',
    WebkitTextStroke: o.stroke ? `${o.stroke}px #000` : '0', paintOrder: 'stroke fill',
  });
  d.style.transformOrigin = '50% 50%';
  return d;
}
/** Применить к HTML-элементу появление: масштаб от центра + прозрачность. */
export function show(d, k, o = {}) {
  const s = (o.from ?? 0.4) + ((o.to ?? 1) - (o.from ?? 0.4)) * k;
  const rot = o.rot ?? 0, dx = o.dx ?? 0, dy = (o.dy ?? 0) * (1 - Math.min(1, k));
  d.style.opacity = Math.max(0, Math.min(1, k * (o.fade ?? 3)));
  d.style.transform = `translate(-50%,-50%) translate(${dx}px,${dy}px) scale(${Math.max(0, s)}) rotate(${rot}deg)`;
}
/** Позиция мирового объекта в пикселях верхней половины */
export function toScreen(obj, camera, W = 1080, H = 960) {
  const v = new THREE.Vector3(); obj.getWorldPosition(v); v.project(camera);
  return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H };
}
export { THREE };
