// Скриншот настоящей страницы сайта для вставки в ролик (не нарисованный «похожий» интерфейс).
//   node fx/shot.mjs URL OUT.png [--width 1080] [--height 1920] [--full] [--selector "css"] [--wait 2500] [--scale 2]
// --selector — снять только этот элемент (карточка товара, блок цен); --full — вся страница целиком.
// Баннеры cookie и всплывающие окна по возможности прячутся. Если сайт не открылся — код выхода 2.
import puppeteer from 'puppeteer';

const args = process.argv.slice(2);
const [url, out] = args;
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; };
if (!url || !out) { console.error('нужны URL и OUT.png'); process.exit(1); }
const width = Number(opt('width', 1080)), height = Number(opt('height', 1920)), wait = Number(opt('wait', 2500)), scale = Number(opt('scale', 2));
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: scale, isMobile: width < 700 });
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36');
  const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  if (resp && resp.status() >= 400) { console.error('HTTP ' + resp.status()); process.exit(2); }
  await new Promise((r) => setTimeout(r, wait));
  await page.evaluate(() => {
    const kill = /cookie|consent|gdpr|popup|modal|banner|subscribe/i;
    document.querySelectorAll('div,section,aside').forEach((el) => {
      const st = getComputedStyle(el);
      if ((st.position === 'fixed' || st.position === 'sticky') && kill.test((el.id || '') + ' ' + (el.className || ''))) el.style.display = 'none';
    });
  });
  const sel = opt('selector', '');
  if (sel) { const el = await page.$(sel); if (!el) { console.error('нет элемента ' + sel); process.exit(2); } await el.screenshot({ path: out }); }
  else await page.screenshot({ path: out, fullPage: args.includes('--full') });
  console.log(JSON.stringify({ out, url, title: await page.title() }));
} finally { await browser.close(); }
