#!/usr/bin/env python3
"""Картинки, иконки и логотипы из интернета для вставок в ролик. Только стандартная библиотека + (опционально) cairosvg.

  python3 fetch_assets.py icon  "shopping cart" OUT_DIR [--color "#FFFFFF"] [--size 512] [--count 3] [--set mdi]
  python3 fetch_assets.py logo  "ozon"          OUT_DIR [--size 512]           # логотипы: simple-icons / logos
  python3 fetch_assets.py photo "warehouse boxes" OUT_DIR [--count 3] [--orientation tall|wide|square]
  python3 fetch_assets.py url   https://site/p.jpg OUT_DIR                       # скачать одну картинку

Каждый вызов дописывает OUT_DIR/assets.json: [{file, kind, query, source, license, creator, url, attribution}].
photo: если заданы ключи в окружении — PEXELS_API_KEY / PIXABAY_API_KEY / UNSPLASH_ACCESS_KEY, ищем сначала там
(лицензии этих сервисов разрешают коммерческое использование без обязательной подписи); иначе Openverse
(без ключа), и берём ТОЛЬКО лицензии cc0 / pdm / by (свободное использование, у «by» нужна подпись автора —
она пишется в attribution и должна попасть в описание ролика). Фото с лицами людей и логотипами третьих
лиц в рекламу не берём без явной просьбы автора.
"""
import argparse, json, os, re, sys, urllib.parse, urllib.request

UA = 'Mozilla/5.0 (compatible; RocketMetrixMontage/1.0)'


def get(url, headers=None, timeout=40):
    req = urllib.request.Request(url, headers={'User-Agent': UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def jget(url, headers=None):
    return json.loads(get(url, headers))


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')[:40] or 'x'


def log_asset(out_dir, rec):
    p = os.path.join(out_dir, 'assets.json')
    cur = json.load(open(p)) if os.path.exists(p) else []
    cur.append(rec); json.dump(cur, open(p, 'w'), ensure_ascii=False, indent=1)


def svg_to_png(svg_bytes, out, size):
    import cairosvg
    cairosvg.svg2png(bytestring=svg_bytes, write_to=out, output_width=size, output_height=size)


def cmd_icon(a, logo=False):
    sets = ['simple-icons', 'logos'] if logo else ([a.set] if a.set else [])
    q = urllib.parse.urlencode({'query': a.query, 'limit': 32, **({'prefixes': ','.join(sets)} if sets else {})})
    res = jget(f'https://api.iconify.design/search?{q}')
    icons = res.get('icons', [])[: a.count]
    saved = []
    for ic in icons:
        prefix, name = ic.split(':', 1)
        color = '' if (logo and prefix == 'logos') else f"&color={urllib.parse.quote(a.color)}"
        svg = get(f'https://api.iconify.design/{prefix}/{name}.svg?height={a.size}{color}')
        out = os.path.join(a.out_dir, f'{"logo" if logo else "icon"}_{slug(a.query)}_{prefix}_{slug(name)}.png')
        try:
            svg_to_png(svg, out, a.size)
        except Exception as e:
            print('svg->png не вышло:', e, file=sys.stderr); continue
        log_asset(a.out_dir, {'file': out, 'kind': 'logo' if logo else 'icon', 'query': a.query, 'source': 'iconify', 'license': 'см. набор ' + prefix, 'creator': prefix, 'url': f'https://icon-sets.iconify.design/{prefix}/{name}/', 'attribution': ''})
        saved.append(out)
    return saved


def photo_pexels(a, key):
    o = {'tall': 'portrait', 'wide': 'landscape', 'square': 'square'}.get(a.orientation, '')
    q = urllib.parse.urlencode({'query': a.query, 'per_page': a.count, **({'orientation': o} if o else {})})
    for p in jget(f'https://api.pexels.com/v1/search?{q}', {'Authorization': key}).get('photos', []):
        yield p['src'].get('large2x') or p['src']['large'], {'source': 'pexels', 'license': 'Pexels License', 'creator': p.get('photographer', ''), 'url': p['url'], 'attribution': ''}


def photo_pixabay(a, key):
    o = {'tall': 'vertical', 'wide': 'horizontal'}.get(a.orientation, 'all')
    q = urllib.parse.urlencode({'key': key, 'q': a.query, 'image_type': 'photo', 'per_page': max(3, a.count), 'orientation': o, 'safesearch': 'true'})
    for p in jget(f'https://pixabay.com/api/?{q}').get('hits', []):
        yield p.get('largeImageURL') or p['webformatURL'], {'source': 'pixabay', 'license': 'Pixabay License', 'creator': p.get('user', ''), 'url': p['pageURL'], 'attribution': ''}


def photo_unsplash(a, key):
    o = {'tall': 'portrait', 'wide': 'landscape', 'square': 'squarish'}.get(a.orientation, '')
    q = urllib.parse.urlencode({'query': a.query, 'per_page': a.count, **({'orientation': o} if o else {})})
    for p in jget(f'https://api.unsplash.com/search/photos?{q}', {'Authorization': 'Client-ID ' + key}).get('results', []):
        yield p['urls']['regular'], {'source': 'unsplash', 'license': 'Unsplash License', 'creator': p['user']['name'], 'url': p['links']['html'], 'attribution': ''}


def photo_openverse(a):
    q = urllib.parse.urlencode({'q': a.query, 'license': 'cc0,pdm,by', 'category': 'photograph', 'page_size': max(10, a.count * 3), 'mature': 'false', 'extension': 'jpg,png,jpeg'})
    n = 0
    for r in jget(f'https://api.openverse.org/v1/images/?{q}').get('results', []):
        w, h = r.get('width') or 0, r.get('height') or 0
        if min(w, h) and min(w, h) < 600: continue            # мелочь для 1080x1920 не годится
        if a.orientation == 'tall' and w and h and h < w: continue
        if a.orientation == 'wide' and w and h and w < h: continue
        lic = f"{r['license'].upper()} {r.get('license_version') or ''}".strip()
        att = '' if r['license'] in ('cc0', 'pdm') else f"Фото: {r.get('creator') or 'автор не указан'} ({lic}), {r.get('foreign_landing_url')}"
        yield r['url'], {'source': 'openverse/' + (r.get('source') or ''), 'license': lic, 'creator': r.get('creator') or '', 'url': r.get('foreign_landing_url') or r['url'], 'attribution': att}
        n += 1
        if n >= a.count * 2: break


def cmd_favicon(a):
    """Логотип бренда, которого нет в наборах иконок (Ozon, Wildberries…): значок сайта 256 px."""
    dom = a.domain or (a.query if '.' in a.query else a.query + '.ru')
    for url in (f'https://www.google.com/s2/favicons?domain={dom}&sz=256', f'https://icons.duckduckgo.com/ip3/{dom}.ico'):
        try:
            data = get(url)
        except Exception as e:
            print('значок не скачался:', url, e, file=sys.stderr); continue
        if len(data) < 500: continue
        out = os.path.join(a.out_dir, f'logo_{slug(dom)}.png')
        try:
            from PIL import Image; import io
            Image.open(io.BytesIO(data)).convert('RGBA').resize((a.size, a.size), Image.LANCZOS).save(out)
        except Exception:
            open(out, 'wb').write(data)
        log_asset(a.out_dir, {'file': out, 'kind': 'logo', 'query': a.query, 'source': 'favicon:' + dom, 'license': 'товарный знак владельца сайта', 'creator': dom, 'url': 'https://' + dom, 'attribution': ''})
        return [out]
    return []


def cmd_photo(a):
    cands = []
    if os.environ.get('PEXELS_API_KEY'): cands.append(photo_pexels(a, os.environ['PEXELS_API_KEY']))
    if os.environ.get('UNSPLASH_ACCESS_KEY'): cands.append(photo_unsplash(a, os.environ['UNSPLASH_ACCESS_KEY']))
    if os.environ.get('PIXABAY_API_KEY'): cands.append(photo_pixabay(a, os.environ['PIXABAY_API_KEY']))
    cands.append(photo_openverse(a))
    saved = []
    for gen in cands:
        try:
            for url, meta in gen:
                if len(saved) >= a.count: break
                try:
                    data = get(url, timeout=60)
                except Exception as e:
                    print('не скачалось:', url, e, file=sys.stderr); continue
                if len(data) < 20_000: continue
                ext = 'png' if data[:4] == b'\x89PNG' else 'jpg'
                out = os.path.join(a.out_dir, f'photo_{slug(a.query)}_{len(saved) + 1}.{ext}')
                open(out, 'wb').write(data)
                log_asset(a.out_dir, {'file': out, 'kind': 'photo', 'query': a.query, **meta}); saved.append(out)
        except Exception as e:
            print('источник не ответил:', e, file=sys.stderr)
        if len(saved) >= a.count: break
    return saved


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('kind', choices=['icon', 'logo', 'photo', 'url']); ap.add_argument('query'); ap.add_argument('out_dir')
    ap.add_argument('--color', default='#FFFFFF'); ap.add_argument('--size', type=int, default=512); ap.add_argument('--count', type=int, default=3)
    ap.add_argument('--set', default=''); ap.add_argument('--orientation', default=''); ap.add_argument('--domain', default='')
    a = ap.parse_args(); os.makedirs(a.out_dir, exist_ok=True)
    if a.kind == 'icon': saved = cmd_icon(a)
    elif a.kind == 'logo': saved = cmd_icon(a, logo=True) or cmd_favicon(a)
    elif a.kind == 'photo': saved = cmd_photo(a)
    else:
        data = get(a.query); out = os.path.join(a.out_dir, 'url_' + slug(os.path.basename(urllib.parse.urlparse(a.query).path)) + ('.png' if data[:4] == b'\x89PNG' else '.jpg'))
        open(out, 'wb').write(data); log_asset(a.out_dir, {'file': out, 'kind': 'url', 'query': a.query, 'source': 'url', 'license': 'неизвестна', 'creator': '', 'url': a.query, 'attribution': ''}); saved = [out]
    print(json.dumps(saved, ensure_ascii=False))


if __name__ == '__main__':
    main()
