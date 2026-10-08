// Движок кадров: RM.setup() → RM.frame(t). Каждый кадр — чистая функция времени,
// поэтому кадры можно рендерить в любом порядке и в несколько потоков.
import * as THREE from 'three';
import { gsap } from 'gsap';
import * as kit from './kit.js';
import { buildSubs, drawSubs } from './subs.js';
import { buildHeadline, drawHeadline } from './headline.js';

const TOP_W = 1080, TOP_H = 960;
const $ = (id) => document.getElementById(id);

let P = null;            // project.json
let modules = [];        // загруженные модули сцен
let renderer, bgCanvas, bgCtx;
let active = { idx: -1, inst: null, scene: null, camera: null };
let subsState, headState, chrome = {};

function hexToRgb(h) { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

function drawBackground(t, accent) {
  const g = bgCtx, W = TOP_W, H = TOP_H;
  g.clearRect(0, 0, W, H);
  if (P.background === 'none') return;
  if (P.background === 'light') { drawLight(g, W, H, t, accent); return; }
  if (P.background === 'flat') { g.fillStyle = active.bgColor || P.bgColor || '#0B1020'; g.fillRect(0, 0, W, H); return; }
  const base = g.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, '#050816'); base.addColorStop(1, '#0B1330');
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  // медленно плавающие световые пятна в цвете сцены
  const [r, gg, b] = hexToRgb(accent);
  const blobs = [[0.25, 0.3, 520, 0.55], [0.8, 0.65, 600, 0.4], [0.5, 1.05, 700, 0.35]];
  blobs.forEach(([x, y, rad, a], i) => {
    const cx = W * x + Math.sin(t * 0.35 + i * 2) * 60, cy = H * y + Math.cos(t * 0.27 + i) * 40;
    const rg = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
    rg.addColorStop(0, `rgba(${r},${gg},${b},${a * 0.55})`); rg.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
  });
  // перспективная сетка-пол
  g.save(); g.strokeStyle = 'rgba(120,160,255,0.10)'; g.lineWidth = 2;
  const horizon = H * 0.52, vx = W / 2;
  for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(vx + i * 30, horizon); g.lineTo(vx + i * 260, H + 40); g.stroke(); }
  const off = (t * 0.6) % 1;
  for (let k = 0; k < 14; k++) {
    const z = (k + off) / 14, y = horizon + Math.pow(z, 2.2) * (H - horizon + 40);
    g.globalAlpha = Math.min(1, z * 2); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
  }
  g.restore();
  // точечная сетка в верхней части
  g.fillStyle = 'rgba(255,255,255,0.06)';
  for (let y = 30; y < horizon - 20; y += 44) for (let x = 22; x < W; x += 44) g.fillRect(x, y, 3, 3);
  // виньетка
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
}

function drawLight(g, W, H, t, accent) {
  g.fillStyle = '#F3F5FA'; g.fillRect(0, 0, W, H);
  const [r, gg, b] = hexToRgb(accent);
  [[0.15, 0.2, 520, 0.16], [0.9, 0.75, 560, 0.12]].forEach(([x, y, rad, a], i) => {
    const cx = W * x + Math.sin(t * 0.3 + i * 2) * 50, cy = H * y + Math.cos(t * 0.25 + i) * 40;
    const rg = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
    rg.addColorStop(0, `rgba(${r},${gg},${b},${a})`); rg.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
  });
  g.fillStyle = 'rgba(20,30,60,0.10)';
  for (let y = 24; y < H; y += 40) for (let x = 20; x < W; x += 40) { g.beginPath(); g.arc(x, y, 2.2, 0, 6.283); g.fill(); }
}

function newScene() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, TOP_W / TOP_H, 0.1, 200);
  camera.position.set(0, 0, 12);
  return { scene, camera };
}

function disposeScene(s) {
  if (!s) return;
  s.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    ms.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
  });
}

function activate(idx) {
  if (active.inst?.dispose) active.inst.dispose();
  disposeScene(active.scene);
  $('ui').innerHTML = ''; $('fx').innerHTML = '';
  const def = P.scenes[idx];
  const { scene, camera } = newScene();
  const ctx = { THREE, gsap, kit, scene, camera, renderer, ui: $('ui'), fx: $('fx'), W: TOP_W, H: TOP_H,
    dur: def.end - def.start, start: def.start, words: P._words, params: def.params || {} };
  const inst = modules[idx].default(ctx) || {};
  active = { idx, inst, scene, camera, accent: inst.accent || def.accent || P.accent || '#005BFF', bgColor: def.bgColor };
}

async function setup() {
  P = await (await fetch('/project/project.json')).json();
  P._words = P.words ? await (await fetch('/project/' + P.words)).json() : [];
  modules = await Promise.all(P.scenes.map((s) => import('/project/' + s.file)));
  await document.fonts.load('900 80px MB'); await document.fonts.load('800 80px MB'); await document.fonts.load('500 40px MB');
  await document.fonts.ready;

  renderer = new THREE.WebGLRenderer({ canvas: $('gl'), alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(TOP_W, TOP_H, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  bgCanvas = document.createElement('canvas'); bgCanvas.width = TOP_W; bgCanvas.height = TOP_H;
  $('bg').appendChild(bgCanvas); bgCtx = bgCanvas.getContext('2d');

  // хром: полоса прогресса сверху + шов между половинами
  chrome.bar = kit.el($('chrome'), '', { left: '0', top: '0', height: '10px', width: '0px',
    background: 'linear-gradient(90deg,#005BFF,#27D3FF)', boxShadow: '0 0 18px rgba(39,211,255,.8)' });
  chrome.seam = kit.el($('chrome'), '', { left: '0', top: (TOP_H - 4) + 'px', height: '8px', width: '1080px',
    background: 'linear-gradient(90deg,rgba(0,91,255,0),#005BFF 25%,#27D3FF 50%,#005BFF 75%,rgba(0,91,255,0))',
    boxShadow: '0 0 26px rgba(0,120,255,.9)' });
  chrome.flash = kit.el($('chrome'), '', { left: '0', top: '0', width: '1080px', height: TOP_H + 'px', background: '#fff', opacity: '0' });
  if (P.progressBar === false) chrome.bar.style.display = 'none';
  if (P.seam === false) chrome.seam.style.display = 'none';
  if (P.seamColor) chrome.seam.style.background = P.seamColor;
  if (P.barColor) chrome.bar.style.background = P.barColor;
  gsap.ticker.lagSmoothing(0); gsap.ticker.sleep();   // время задаём сами, покадрово

  subsState = buildSubs($('subs'), P._words, P.subs || {});
  headState = buildHeadline($('headline'), P.headline);
  return { duration: P.duration, fps: P.fps || 30 };
}

async function frame(t) {
  let idx = P.scenes.findIndex((s) => t >= s.start && t < s.end);
  if (idx < 0) idx = t >= P.scenes[P.scenes.length - 1].end ? P.scenes.length - 1 : 0;
  if (idx !== active.idx) activate(idx);
  const def = P.scenes[idx], lt = t - def.start, p = lt / (def.end - def.start);

  drawBackground(t, active.accent);
  if (active.inst.tl) active.inst.tl.seek(Math.max(0, lt), false);   // GSAP-таймлайн сцены (paused)
  active.inst.update?.(lt, p, t);

  // вход сцены: короткий наезд + вспышка (отключается transition:'none')
  const tr = def.transition ?? (idx === 0 ? 'none' : (P.transition ?? 'punch'));
  let s = 1, flash = 0;
  if (tr === 'punch' && lt < 0.3) { const k = kit.easeOutCubic(lt / 0.3); s = 1.14 - 0.14 * k; flash = 0.35 * (1 - k); }
  const tf = `scale(${s})`;
  $('gl').style.transform = tf; $('ui').style.transform = tf; $('gl').style.transformOrigin = $('ui').style.transformOrigin = '50% 50%';
  chrome.flash.style.opacity = flash;

  renderer.render(active.scene, active.camera);

  chrome.bar.style.width = (1080 * Math.min(1, t / P.duration)) + 'px';
  drawSubs(subsState, t);
  drawHeadline(headState, t);
  return true;
}

window.RM = { setup, frame };
window.gsap = gsap;
window.RM_READY = true;
