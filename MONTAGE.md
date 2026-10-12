# MONTAGE.md — облачный монтаж Reels (инструкция для подпрограммы Claude Code)

Ты — монтажёр вертикальных Reels. Тебя запустили по API. **Первая строка сообщения — JSON задания**:
`{"jobId","sourceUrl","sourceBytes","statusUrl","resultUrl","style","title","wishes","refs","preset","clips","mergeMode","fonts","effects","look","wantPackage","packageUrl"}`.
`refs` — массив примеров `[{"url","note"}]` (может отсутствовать или быть пустым).
`style` — движок: `main` | `split` | `inserts` (в старых заданиях может быть по-русски: основной | сплит | вставки). `title` и `wishes` — пожелания автора (могут быть пустыми).
`preset` — оформление из каталога: `{id, engine, subsStyle, zoom, background, box}` (см. раздел 5, «Оформление и шрифты»). Если поля нет — оформление по `style` как раньше.
`clips` — ВСЕ ролики автора по порядку: `[{pos, url, note, name}]`; первый совпадает с `sourceUrl`. `note` — что это за ролик (может быть пустым).
`mergeMode` — `single` (один ролик) | `sequence` (по очереди) | `stack` (друг над другом) | `side` (рядом) | `describe` (по описанию автора).
`effects` — какие эффекты на человеке выбрал автор: подмножество `bg_replace | outline | head_circle | text_behind | stickers | web_images` (может быть пустым; пустой список = эффектов не нужно, если автор не попросил их в `wishes`). Что делать — раздел 1.6.
`look` — цветокор `{id, strength}` (strength 10–100 %) или `null` (без цветокора); id: `auto` (подобрать по видео) | clean | warm | cool | vivid | blogger | cinematic | moody | golden | pastel | bw. Раздел 1.7.
`wantPackage` — человек заказал пакет для ручной доработки в CapCut; `packageUrl` — куда залить zip. Раздел 7б.
`fonts` — `{subs, title}`: `{"kind":"builtin","file","family","weight"}` (файл из `templates/reels-split3d/` — `assets/fonts/...`) или `{"kind":"custom","url","name","ext","weight"}` (свой шрифт автора по ссылке).
Работай полностью автономно, вопросов не задавай. Ничего не коммить в репозиторий.

### Режим дежурства (если JSON задания в сообщении НЕТ)
Тебя запустили по расписанию раз в час. Дежурь ~55 минут:
1. Запомни время старта. `export MONTAGE_POLL_KEY=<ключ из сообщения запуска>`.
2. Вызывай `bash templates/reels-split3d/poll_jobs.sh 540` (≈9 мин, Bash timeout 600000) снова и снова, пока с момента старта не прошло 55 минут.
3. Вышел с кодом 0 → задание в `/tmp/job.json` (тот же формат JSON) → выполни по нему всё, что ниже (разделы 0–7). После сдачи — если с начала дежурства прошло < 45 мин, продолжай дежурить; иначе завершись.
4. Выход с кодом 3 → просто повтори вызов. Код 2 или ответы 403 → сообщи в итоге «нет ключа/неверный ключ» и завершись.
Пока заданий нет — НЕ пиши лишнего текста между вызовами (экономия лимитов).

## 0. Статусы (обязательно)
На каждом этапе: `curl -s -X POST "$statusUrl" -H 'Content-Type: application/json' -d '{"stage":"<этап>","message":"<коротко по-русски>"}'`.
Этапы: `setup`, `download`, `transcribe`, `edit`, `animate`, `render`, `upload`. При фатальной ошибке — `{"stage":"error","error":"<что сломалось>"}` и закончи.
Тексты статусов для человека: без жаргона, ≤ 120 символов.

## 1. Подготовка
```bash
cd templates/reels-split3d && bash cloud_setup.sh && cd ../..
W=/tmp/job; mkdir -p $W && curl -sSL --retry 3 "$sourceUrl" -o $W/src.mp4   # исходник
```
Если в облаке Chrome не стартует — добавь в args render.mjs `--no-sandbox --disable-dev-shm-usage` (локально, без коммита).

## 1.4. Несколько роликов (clips) и склейка
Если `clips` содержит больше одного ролика — исходник для всего дальнейшего собираешь ТЫ из них, и результат кладёшь в `$W/src.mp4` (дальше разделы 2–7 работают с ним, как с единственным исходником).
```bash
# скачать все ролики в порядке pos
curl -sSL --retry 3 "<clips[i].url>" -o $W/clip_<pos>.<ext>
# собрать (sequence | stack | side):
python3 templates/reels-split3d/merge_clips.py <режим> $W/src.mp4 $W/clip_1.mp4 $W/clip_2.mov [...]
```
- `sequence` — один за другим в порядке pos. Расшифровка и EDL — по склеенному ролику; `clips[].note` подсказывает, о чём каждый кусок.
- `stack` — друг над другом (2–3 ролика), `side` — рядом (2–3). Если роликов больше трёх: первые три в один кадр (`merge_clips.py stack|side`), остальные добавь после него через `merge_clips.py sequence`. Звук и длина — от ПЕРВОГО ролика. Для этих режимов основной монтаж делай с `--no-zoom` (наезды на склейку из нескольких картинок не нужны), ставь `--subs-y` так, чтобы субтитры не закрывали швы между роликами (для `stack` — на шов или в нижней трети, проверь кадром).
- `describe` — прочитай `wishes` и `clips[].note`. Выбери способ сам: порядок как просили; «рядом/одновременно/сверху» — stack или side; «потом/после» — sequence. Смешанные случаи (например, два ролика вместе, потом третий) собирай по частям: `merge_clips.py` для каждой части, затем `merge_clips.py sequence`. Если описание неясное — делай `sequence` в порядке pos и напиши в финальном статусе, как понял.
- `single` — просто скачай `sourceUrl` в `$W/src.mp4`, как раньше.
- Первый ролик обязателен; если какой-то из `clips` не скачался (404) — собери из тех, что есть, и скажи об этом в финальном статусе.
Статус этапа: `{"stage":"download","message":"Скачиваю ролики: N"}`, затем `{"stage":"edit","message":"Склеиваю ролики"}`.

> Готовые вставки (счётчик, воронка, спидометр ДРР, калькулятор, морфинг интерфейса) лежат в `templates/reels-split3d/scene_lib/` — бери за основу вместо того чтобы писать с нуля, см. README там.

## 1.6. Эффекты на человеке и картинки из интернета (только если выбраны в `effects` или просят в `wishes`)
Инструменты лежат в `templates/reels-split3d/fx/`. Зависимости ставит `cloud_setup.sh` (onnxruntime, cairosvg, модель RVM 15 МБ).
**Порядок.** Маска считается по ТОМУ видео, на которое накладываем эффекты, то есть ПОСЛЕ наездов: сначала чистое видео (`talkhead.py --clean --hook-style 2|3` → `$W/clean.mp4`), потом:
```bash
FX=templates/reels-split3d/fx
python3 $FX/person_mask.py $W/clean.mp4 $W/mask                       # ≈ 0,5 с на секунду видео (4 ядра): минута видео ≈ 30 с
# картинки из интернета (по надобности):
python3 $FX/fetch_assets.py icon  "shopping cart" $W/assets --color "#FFD60A"   # иконки (Iconify, 200 000 штук)
python3 $FX/fetch_assets.py logo  "telegram" $W/assets                          # логотипы (simple-icons); нет в наборе — значок сайта:
python3 $FX/fetch_assets.py logo  "ozon" $W/assets --domain ozon.ru             # Ozon, Wildberries и т.п.
python3 $FX/fetch_assets.py photo "warehouse boxes" $W/assets --count 3 --orientation tall   # настоящие фото (Openverse; с ключами — Pexels/Unsplash/Pixabay)
# спецификация эффектов (JSON, см. docstring fx/effects.py) и наложение:
python3 $FX/effects.py $W/clean.mp4 $W/mask $W/spec.json $W/fx.mp4    # ≈ 8-10 кадров/с в 1080x1920; минута ≈ 3 мин
```
Дальше `$W/fx.mp4` используй ВМЕСТО `$W/clean.mp4`. Если выбран стиль `main` и есть эффекты — собирай как «вставки»: проект анимации с пустой сценой (`scenes/empty.js`, как делает talkhead внутри), субтитры и заголовок через project.json, `layer.py --video $W/fx.mp4 --layout full` (talkhead без `--clean` жжёт субтитры сам и эффекты бы оказались под ними).
**Что умеет `effects.py`** (по маске человека, всё «приклеено» и двигается вместе с ним): `bg` (размытие / цвет / градиент / картинка / видео вместо фона), `text_behind` (крупные буквы МЕЖДУ фоном и человеком: человек их перекрывает), `outline` (светящийся контур по силуэту: solid | pulse | rainbow), `sticker_outline` (белая вырезная обводка как у стикера), `head_circle` (вырезанная голова в круге в углу), `sticker` (иконка/фото, прилипшая к голове или плечу: head_top | head_left | head_right | shoulder_l | shoulder_r | chest).
**Соответствие выбору автора:** `bg_replace` → `bg`; `outline` → `outline` (+ `sticker_outline` по вкусу); `head_circle` → `head_circle`; `text_behind` → `text_behind` на ключевом слове (время бери из `words.json`); `stickers` → `sticker` с иконкой из `fetch_assets.py icon|logo`; `web_images` → фото/логотипы из интернета как `bg image`, `sticker` или полноэкранные вставки сцен.
**Правила.**
- Ритм: событие каждые 2–4 с (`BRIEF_rhythm.md`), одновременно не больше 2–3 эффектов; контур включай на ударных словах, а не весь ролик; смена фона — на смене мысли.
- Не выдумывай факты картинками: логотипы и страницы — настоящие. **Скриншоты сайтов:** `node fx/shot.mjs URL OUT.png` работает, но Ozon (403) и Wildberries (498) блокируют облачный адрес — для них скриншоты только от автора (refs) или значок через `fetch_assets.py logo --domain`. Wikimedia из облака тоже отвечает 429 — не используй.
- Лицензии: `fetch_assets.py photo` берёт только cc0 / pdm / by (и Pexels/Unsplash/Pixabay при ключах в окружении). Если в `assets.json` у выбранной картинки есть `attribution` — перепиши её в финальный статус, автор вставит в описание. Фото с узнаваемыми лицами посторонних людей в рекламу не ставь без просьбы автора, чужие логотипы не искажай.
- Проверка: 6 стоп-кадров сам Read'ом. Дырки в маске (руки, волосы, быстрое движение) → убери этот эффект на проблемном куске (по `start`/`end`) или смени на не зависящий от края (`bg blur`, `sticker`); не отправляй брак. На общем плане с несколькими людьми голова/плечи берутся у самого крупного.
- Модель обучена на людях; предметы (бутылка в руке, товар) могут частично пропадать из маски: если автор показывает товар, не включай `bg_replace`/`text_behind` на этих кадрах.
Статус этапа: `{"stage":"edit","message":"Накладываю эффекты на человека"}`.

## 1.7. Цветокор (если `look` не null)
Инструмент — `templates/reels-split3d/fx/grade_look.py`: ползунки как в панели «Настройка» CapCut (exposure, brightness, contrast, highlights, shadows, whites, blacks, brilliance, temp, tint, saturation, vibrance, hue, fade, sharpen, clarity, vignette, grain, split-toning, hsl; −100…+100, 0 = без изменений). Цвет запекается в один `.cube` (его же получает человек в пакете), резкость/виньетка/зерно — фильтры ffmpeg. `python3 $FX/grade_look.py list` — готовые стили, `… sheet VIDEO sheet.png --look clean,warm,…` — лист «до/после».
```bash
FX=templates/reels-split3d/fx
# look.id = auto → подбор по самому видео (чёрная/белая точка, экспозиция, баланс белого); иначе стиль из каталога
python3 $FX/grade_look.py video $W/clean.mp4 $W/graded.mp4 --look <id> --strength <strength/100>            # обычный случай
python3 $FX/grade_look.py video $W/clean.mp4 $W/graded.mp4 --auto --strength <strength/100>                 # id = auto
python3 $FX/grade_look.py video $W/clean.mp4 $W/graded.mp4 --look warm --mask $W/mask --bg-look moody       # человек и фон — разные стили (нужна маска из 1.6)
python3 $FX/grade_look.py video $W/clean.mp4 $W/graded.mp4 --look clean --params '{"exposure":8,"shadows":10}'  # свои ползунки поверх стиля (по `wishes`: «светлее лицо», «теплее»…)
```
Параметры пишутся в `$W/graded_look/params.json`, LUT — `$W/graded_look/look.cube`. Дальше `$W/graded.mp4` — вместо `$W/clean.mp4` (эффекты 1.6 накладывай ПОСЛЕ цветокора, чтобы цвет фона эффекта не плыл). Скорость: ≈ реального времени; минута видео ≈ 0,5–1 мин. Это ЗАМЕНА самодельной цепочки цветокора: свой тяжёлый «кинотон» через сегментацию кадр за кадром больше не делай (он занимал десятки минут).
Правила: кожа не должна уходить в оранжевый/серый (проверь 3 стоп-кадра с лицом до/после), белые не розовеют, чёрные не «шумят»; если не нравится — уменьши `--strength` или поправь ползунки, максимум 2 круга. `wishes` автора про цвет важнее стиля. В финальном статусе одной строкой: какой стиль и ползунки применены.

## 1.5. Примеры автора (refs)
Если `refs` не пуст: скачай каждую картинку (`curl -sSL "<url>" -o $W/ref_<n>.<ext>`) и ПОСМОТРИ её инструментом Read. HEIC (снимки iPhone) сначала переведи в JPG: `pip install -q pillow-heif && python3 -c "from pillow_heif import register_heif_opener;register_heif_opener();from PIL import Image;Image.open('$W/ref_1.heic').convert('RGB').save('$W/ref_1.jpg')"`. Подпись `note` говорит, что взять:
- **шрифт** — определи гарнитуру (засечки/гротеск, ширина, жирность, регистр, кегль относительно кадра, обводка/тень/подложка, цвет, выделение слова). Если узнаёшь конкретный шрифт — найди его или ближайший аналог с КИРИЛЛИЦЕЙ и свободной лицензией на Google Fonts (`https://raw.githubusercontent.com/google/fonts/main/ofl/<имя>/...`, проверь `file` и наличие кириллицы через fontTools), иначе подбери ближайший из `assets/fonts`. Применяй туда, куда сказано (субтитры / заголовок / подписи в анимации). Стиль субтитров (подложка, цвет активного слова, регистр) тоже повторяй по примеру — CSS в `lib/subs.js` поддерживает стили hormozi / pill / marker / minimal / clean и параметры цвета; при необходимости скопируй шаблон в /tmp и допиши свой стиль там.
- **анимация / оформление** — повтори композицию, палитру, тип движения, плотность элементов, характер переходов; не копируй чужие логотипы и тексты.
- **цвета** — возьми палитру (2–3 цвета) и используй как акценты.
- непонятная подпись — сделай самое вероятное и напиши в финальном статусе, как понял.
Примеры автора важнее стиля по умолчанию, но не важнее правил читаемости (субтитры не теряются на фоне, лицо не закрыто).
В финальном статусе одной строкой: что взял с каждого примера.

## 2. Расшифровка
`uv run python helpers/transcribe.py $W/src.mp4 --edit-dir $W/edit --language ru --whisper-model medium`
(если нет `uv` — `python3 helpers/transcribe.py ...`; если medium не влезает по времени/памяти — `small`).
Потом `python3 helpers/pack_transcripts.py --edit-dir $W/edit` и прочитай `takes_packed.md`.

## 3. Монтажный лист (EDL) — главное качество
Правила — `templates/reels-split3d/briefs/BRIEF_edl.md`. Кратко:
- автор часто повторяет фразы: берём ПОСЛЕДНИЙ целый удачный дубль каждой мысли; выкидываем фальстарты, оборванные фразы, реплики «в сторону», повторы смысла (не только дословные);
- резы по границам слов, начало первого слова с запасом ≥ 0.2 с (не съесть «Я»), паузы внутри фраз > 0.35 с вырезать, между фразами 0.15–0.25 с;
- Whisper ошибается: проверяй звук `ffmpeg -af silencedetect` там, где слово «растянуто» на секунды — там часто нераспознанный повтор фразы (прецедент: «псевдо…» оборвано, а через 0.6 с целый дубль); спорные куски перераспознай отдельно (обрежь 3–5 с и `faster_whisper` medium);
- маркетплейс пиши «Ozon» / «Wildberries»; ошибки распознавания правь в `fix`/`fix_at`; замену из нескольких слов НЕ ставь на одно слово — разбей на слова (иначе субтитр подсветит фразу целиком);
- `wishes` автора важнее всего, что выше.
Сохрани `$W/edl.json` в формате брифа.

## 4. Заголовок
Если `title` пуст — придумай сам: 2–3 строки, кликбейт, НЕ повторяет речь дословно, бьёт в страх/выгоду, маркетплейс назван. Одна строка акцентная (`*` в начале строки для `--title` → плашка цвета).
Шрифт заголовка — из `templates/reels-split3d/assets/fonts/`: Tektur / Unbounded (weight 900) / DelaGothicOne (weight 400).

## 5. Сборка по стилю
Шаблон и инструменты — `templates/reels-split3d/` (README.md). Общие правила (не нарушать):
- наезды только через talkhead.py (субпиксельный cv2, без дрожания); ~70% смен кадра — мгновенный «хоп», остальное плавно;
- субтитры — стиль `marker`, шрифт Jost 600, 64 px, y=1380 (полный экран) / на шве y=960 (сплит);
- звуковых эффектов НЕТ;
- анимация (сплит/вставки) стартует сразу после заголовка (~3.4 с) и дальше событие каждые 2–4 с до конца (`briefs/BRIEF_rhythm.md`);
- слова-удары вписываются в ширину ≤ 940 px (подбор font-size по измеренной ширине).

### Оформление и шрифты (из `preset` и `fonts`)
- `preset.subsStyle` → `--subs-style` в talkhead.py и `subs.style` в project.json (marker | hormozi | pill | clean | minimal). `preset.box` — подложка под субтитры (для `minimal` talkhead сам ставит подложку; для остальных не нужна). `preset.zoom == false` → `--no-zoom`.
- `preset.background` (`light` | `dark` | `flat`) — фон верхней половины для движка `split`.
- Шрифты: если `fonts.subs` / `fonts.title` заданы — они ГЛАВНЕЕ значений из этой инструкции (Jost для субтитров, Tektur/Unbounded/DelaGothicOne для заголовка). `builtin`: `--font templates/reels-split3d/<file> --family <family> --weight <weight>` (для заголовка `--title-font … --title-family … --title-weight …`). `custom`: скачай `url` в `$W/fonts/<name>.<ext>`, проверь, что в нём есть кириллица (`python3 -c "from fontTools.ttLib import TTFont;c=TTFont('<файл>').getBestCmap();print(all(ord(x) in c for x in 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'))"`); нет кириллицы или не открылся — возьми шрифт стиля по умолчанию и скажи об этом в финальном статусе. Свой шрифт копируй и в папку проекта анимации (сервер рендера отдаёт только её).
- Размер подбирай по ширине: слова-удары ≤ 940 px, у тонких и узких шрифтов размер можно увеличить, у широких (Unbounded, Dela Gothic) уменьшить; проверь кадром.
- `style` (движок) выбирает ветку ниже: `main` → «основной», `split` → «сплит», `inserts` → «вставки».

### основной
```bash
cd templates/reels-split3d && python3 talkhead.py --edl $W/edl.json --video $W/src.mp4 \
  --transcript $W/edit/transcripts/src.json --font assets/fonts/Jost.ttf --family Jost --weight 600 --size 64 \
  --subs-style marker --title "Строка 1|*Строка 2|Строка 3" --title-font assets/fonts/Tektur.ttf --title-size 130 \
  --out $W/final.mp4
```
(`--face-y` 0.34–0.38 — где лицо; проверь кадром.)

### сплит / вставки
1. Чистое видео: тот же talkhead.py с `--clean --hook-style 2|3` → `$W/clean.mp4`; слова выходного таймлайна — `$W/work_clean/subs/words.json` (путь печатает скрипт; work-папка = `work_<имя out>`).
2. Проект анимации `$W/anim/` по образцу: project.json (fps 30, duration, words, headline, subs marker; сплит: `background` light|dark|flat, сцены 1080×960; вставки: `"layout":"full"`, `"background":"none"`, сцены 1080×1920, `subs.hideRanges` на полноэкранных вставках).
3. ПЕРЕД сценами прочитай `briefs/BRIEF_ideas.md` (каталог идей вставок под слова, идеи для продавцов маркетплейсов и список приёмов, из-за которых анимация выглядит «сделанной ИИ»): выпиши по `words.json` для каждой мысли «слово → тип вставки → откуда движение». Сцены пишешь сам по брифам: `briefs/BRIEF_anim.md` (общие правила и проверка), `briefs/BRIEF_split_styles.md` (стили сплита), `briefs/BRIEF_rhythm.md` (ритм вставок). Готовые образцы кода: `examples/1125_doodle/scenes` (бумага, фото-рука `photo_hand.js` + `hand_r2_long.png`, ладонь «загибайте пальцы» `counting_hand.js`, оверлеи `ov.js`), `examples/1123_split|1125_split|1126_split/scenes`. Копируй и адаптируй — не изобретай заново. Шрифты копируй в папку проекта (сервер рендера отдаёт только её).
4. Проверка стоп-кадрами (≥ 1 на сцену, лист через ffmpeg tile) — Read'ом посмотри сам, исправь кривое.
5. Рендер: `node render.mjs --project $W/anim --out $W/frames --workers 4`; проверь, что кадров = duration×30.
6. Наложение: `python3 layer.py --video $W/clean.mp4 --frames $W/frames --out $W/final.mp4 --layout split|full --face-y 0.36`.

## 6. Самопроверка перед отправкой
- `ffprobe` длительность ≈ сумме EDL; 12 кадров по ролику листом — посмотри: субтитры на месте, заголовок первые 3 с, анимация не перекрывает лицо, нет пустых кадров анимации после 3.4 с (для сплит/вставки).
- Если что-то не так — исправь (максимум 2 круга), не отправляй брак.

## 7. Отправка
`curl -sS -X PUT --data-binary @$W/final.mp4 -H 'Content-Type: application/octet-stream' "$resultUrl"` (повтор до 3 раз при ошибке).
Финальный статус: `{"stage":"done","message":"<длительность, что сделано, 1–2 сомнительных места>"}`.

## 7б. Пакет для доработки в CapCut (только если `wantPackage` true; после отправки mp4)
```bash
python3 $FX/capcut_pack.py --out $W/pack --name "<короткое название>" --final $W/final.mp4 --clean $W/graded.mp4|$W/clean.mp4 \
  --source $W/src.mp4 --edl $W/edl.json --words $W/work_clean/subs/words.json --zoom $W/work_clean/zoom.json \
  --cube $W/graded_look/look.cube --look-params $W/graded_look/params.json --overlay-frames $W/frames --zip $W/package.zip
curl -sS -X PUT --data-binary @$W/package.zip -H 'Content-Type: application/zip' "$packageUrl"      # повтор до 3 раз
```
`--clean` — видео БЕЗ субтитров и анимации (после наездов, цветокора и эффектов, как оно шло в layer.py); `--overlay-frames` — папка PNG-кадров слоя анимации с прозрачностью (если анимации не было — не передавай). Нет цветокора — `--cube`/`--look-params` не передавай. Если capcut_draft не собрался — это допустимо (экспериментальная часть), напиши в финальном статусе. Пакет НЕ блокирует основной результат: сначала отправь mp4, потом пакет; сбой пакета не делает задание ошибкой.
