// Рука с маркером — ФОТО (hands/stock2/hand_r2_long.png, Pixabay): кончик маркера привязан к точке (x, y).
// API как у makeWritingHand: makePhotoHand(parent, {scale}) -> { el, setTip(x, y, angleDeg = 0), setVisible(bool) }.
// parent — HTML-элемент (div). Поворот идёт вокруг кончика. Рукав продлён вдоль предплечья, срез уходит за кадр.
const SRC = '/project/scenes/hand_r2_long.png';
const SIZE = [1462, 2414];   // размер hand_r2_long.png
const TIP = [1, 116];        // кончик маркера в пикселях картинки

// предзагрузка: сцены импортируются до первого кадра, так что картинка уже декодирована
const pre = new Image(); pre.src = SRC;
try { await pre.decode(); } catch (e) { console.warn('[photo_hand] не загрузилась картинка', e); }

export function makePhotoHand(parent, { scale = 1.35, shadow = true } = {}) {
  const img = document.createElement('img');
  img.src = SRC; img.decoding = 'sync'; img.draggable = false;
  Object.assign(img.style, {
    position: 'absolute', left: '0px', top: '0px', width: SIZE[0] + 'px', height: SIZE[1] + 'px', maxWidth: 'none',
    transformOrigin: '0 0', pointerEvents: 'none', willChange: 'transform',
    filter: shadow ? 'drop-shadow(10px 16px 10px rgba(0,0,0,.30))' : 'none',
  });
  parent.appendChild(img);
  let ang = 0;
  const api = {
    el: img,
    setTip(x, y, angleDeg = ang) {
      ang = angleDeg;
      img.style.transform = `translate(${(+x).toFixed(1)}px,${(+y).toFixed(1)}px) rotate(${angleDeg}deg) scale(${scale}) translate(${-TIP[0]}px,${-TIP[1]}px)`;
    },
    setVisible(v) { img.style.visibility = v ? 'visible' : 'hidden'; },
  };
  api.setTip(-5000, -5000, 0);
  return api;
}
