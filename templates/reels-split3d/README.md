# reels-split3d — шаблон вертикального Reels «экран пополам»

Сверху — 3D-анимация (Three.js), снизу — говорящая голова, на шве — пословные
субтитры в стиле Хормози, первые секунды — кликбейт-заголовок по центру.
Слой анимации рендерится покадрово в PNG с прозрачным фоном через headless Chrome.

## Установка (один раз)
    cd templates/reels-split3d && npm i

## Проект
Папка проекта (вне репозитория, например `<видео>/edit/animations/split3d/`):

    project.json   — fps, duration, сцены, заголовок, субтитры, доп. звуки
    words.json     — [{ "w": "слово", "s": 1.20, "e": 1.55, "c": "#FF4D5E"?, "br": true? }]
    scenes/*.js    — сцены (см. BRIEF-образец ниже)

project.json:
```json
{ "fps": 30, "duration": 62.0, "words": "words.json",
  "subs": { "y": 960, "size": 84, "maxWords": 3, "maxChars": 17, "hideBefore": 3.2 },
  "headline": { "start": 0, "end": 3.2, "y": 960, "lines": [
      { "text": "Продаёшь на <span style='color:#3D8BFF'>OZON</span>?", "size": 92 },
      { "text": "Тебя грабят", "size": 124, "bg": "#FF2D46", "rot": -3, "at": 0.16 } ] },
  "scenes": [ { "file": "scenes/s01.js", "start": 0, "end": 5.5, "accent": "#FF3B4E" } ],
  "sfx": [ { "t": 49.35, "kind": "impact", "gain": 0.5 } ] }
```
`kind`: impact | pop | ding | whoosh. Свуши на сменах сцен и удар на заголовке ставятся сами.

## Сцена
```js
export default function setup({ THREE, kit, scene, camera, ui, start, words }) {
  kit.studioLights(scene);
  const card = kit.productCard({ price: '2 490 ₽' }); scene.add(card);
  const label = kit.tag(ui, 'Твоя карточка', { x: 540, y: 110, bg: kit.C.blue });
  return { update(lt) {                       // ЧИСТАЯ функция времени сцены
    card.rotation.y = Math.sin(lt) * 0.3;
    kit.show(label, kit.pop(lt, 0.4));
  } };
}
```
Правила: update не копит состояние (кадры рендерятся вразнобой в 4 потока),
случайность только `kit.rng(seed)`, важное не ниже y=820 (там субтитры).
Готовые примеры сцен — в проекте `~/Desktop/Видео-монтаж/avatar2/edit/animations/split3d/scenes/`.

## Рендер
    node render.mjs --project <dir> --out <dir>/frames --workers 4          # все кадры (~1 мин на 60 с)
    node render.mjs --project <dir> --out <dir>/stills --stills 1.5,10,20   # стоп-кадры для проверки
    uv run python compose.py --project <dir> --video src.mp4 --frames <dir>/frames --out final.mp4 \
        --end 62 --zoom "14:20.2:1.1,46:50.5:1.14"    # наезды камеры на аватар: старт:конец:зум
    # --crop w:h:x:y — кадрирование исходника под нижнюю половину, --face-y — где лицо (0..1)
