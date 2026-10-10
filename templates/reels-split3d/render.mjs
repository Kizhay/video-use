#!/usr/bin/env node
// Покадровый рендер слоя-оверлея в PNG с прозрачным фоном через headless Chrome.
//
//   node render.mjs --project <dir> --out <dir/frames> [--workers 4] [--fps 30]
//                   [--from 0] [--to <сек>] [--stills 1.5,10,20]  (стоп-кадры для проверки)
//
// <dir>/project.json описывает сцены, субтитры и заголовок (см. README.md).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => {
  if (x.startsWith('--')) a.push([x.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]); return a;
}, []));
const PROJECT = path.resolve(args.project || '.');
const OUT = path.resolve(args.out || path.join(PROJECT, 'frames'));
const WORKERS = +(args.workers || 4);
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const file = u.startsWith('/project/') ? path.join(PROJECT, u.slice(9)) : path.join(ROOT, u === '/' ? 'index.html' : u);
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); res.end('nf ' + u); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL_ = `http://127.0.0.1:${server.address().port}/`;

// Отдельный браузер на каждый поток: вкладки одного браузера в фоне не рисуют кадры.
const browsers = [];
async function openPage() {
  const browser = await puppeteer.launch({
    headless: true, protocolTimeout: 600000,
    args: [...(process.platform === 'darwin'
             ? ['--use-angle=metal']
             : ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',   // облако/Linux: root, без GPU
                '--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader']),
           '--ignore-gpu-blocklist', '--enable-webgl', '--enable-gpu-rasterization',
           '--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none',
           '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
           '--disable-backgrounding-occluded-windows'],
  });
  browsers.push(browser);
  const page = await browser.newPage();
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console.log('[page]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  await page.goto(URL_, { waitUntil: 'load' });
  await page.waitForFunction('window.RM_READY === true');
  const info = await page.evaluate(() => window.RM.setup());
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  return { page, cdp, info };
}

async function shoot(w, t, file) {
  await w.page.evaluate((tt) => window.RM.frame(tt), t);
  const { data } = await w.cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
}

const first = await openPage();
const fps = +(args.fps || first.info.fps || 30);
const duration = +(args.to || first.info.duration);
const from = +(args.from || 0);

if (args.stills) {
  for (const s of String(args.stills).split(',')) await shoot(first, +s, path.join(OUT, `still_${(+s).toFixed(2)}.png`));
  console.log('stills ->', OUT);
} else {
  const f0 = Math.round(from * fps), f1 = Math.round(duration * fps);
  const total = f1 - f0, per = Math.ceil(total / WORKERS);
  const workers = [first];
  for (let i = 1; i < WORKERS; i++) workers.push(await openPage());
  const t0 = Date.now(); let done = 0;
  await Promise.all(workers.map(async (w, wi) => {
    for (let f = f0 + wi * per; f < Math.min(f1, f0 + (wi + 1) * per); f++) {
      await shoot(w, f / fps, path.join(OUT, `f_${String(f).padStart(5, '0')}.png`));
      if (++done % 60 === 0) console.log(`${done}/${total} кадров, ${((Date.now() - t0) / done).toFixed(0)} мс/кадр`);
    }
  }));
  console.log(`готово: ${total} кадров за ${((Date.now() - t0) / 1000).toFixed(1)} с -> ${OUT}`);
}
await Promise.all(browsers.map((b) => b.close())); server.close();
