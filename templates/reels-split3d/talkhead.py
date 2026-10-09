#!/usr/bin/env python3
"""Говорящая голова по EDL: вырезка удачных дублей → склейка → наезды/отъезды камеры
каждые 2–4 с → лаконичные субтитры (браузерный рендер PNG с альфой) → громкость −14 LUFS.

  uv run python talkhead.py --edl edl_X.json --video X.MOV --transcript transcripts/X.json \
      --font fonts/Onest.ttf --family Onest --out X_final.mp4 [--face-y 0.38] [--subs-y 1380]

EDL: {"ranges":[{"start","end"}], "fix":{слово:замена}, "fix_at":[{"t","w"}]}
"""
import argparse, json, os, re, shutil, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 30


def run(cmd):
    subprocess.run(cmd, check=True)


def probe_dims(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                          'stream=width,height:stream_side_data=rotation', '-of', 'json', path],
                         capture_output=True, text=True).stdout
    s = json.loads(out)['streams'][0]
    w, h = s['width'], s['height']
    rot = 0
    for sd in s.get('side_data_list', []) or []:
        rot = int(sd.get('rotation', 0) or 0)
    if abs(rot) % 180 == 90: w, h = h, w
    return w, h


def apply_fix(word, fix):
    m = re.match(r'^([«"(]*)(.*?)([.,!?:;…»")]*)$', word)
    pre, core, post = m.groups()
    if core in fix: core = fix[core]
    elif core.lower() in {k.lower() for k in fix}:
        core = next(v for k, v in fix.items() if k.lower() == core.lower())
    return (pre + core + post).strip() if core else ''


def zoom_schedule(cuts, total, rng_seed=5):
    """Блоки 2–4 с, границы — склейки + деление длинных кусков. Чередуем наезд/отъезд/«щелчок»."""
    bounds = sorted(set([0.0] + [c for c in cuts if 0 < c < total] + [total]))
    blocks = []
    for a, b in zip(bounds, bounds[1:]):
        n = max(1, round((b - a) / 3.0))
        step = (b - a) / n
        for i in range(n): blocks.append((a + i * step, a + (i + 1) * step))
    # слить совсем короткие (<1.2 с) с соседом
    merged = []
    for blk in blocks:
        if merged and blk[1] - blk[0] < 1.2: merged[-1] = (merged[-1][0], blk[1])
        else: merged.append(blk)
    # Большинство смен — мгновенный «хоп» (кадр стоит), меньшинство — плавный наезд/отъезд.
    pattern = [(1.00, 1.00), (1.18, 1.18), (1.00, 1.06), (1.12, 1.12), (1.24, 1.24), (1.00, 1.00),
               (1.16, 1.08), (1.10, 1.10), (1.22, 1.22), (1.04, 1.04)]
    return [(a, b, *pattern[i % len(pattern)]) for i, (a, b) in enumerate(merged)]


def hook_blocks(total, style=1):
    if style == 2:   # ступенчатые «хоп»: кадр прыгает крупнее три раза, потом отпускает
        return [b for b in [(0.0, 0.42, 1.0, 1.0), (0.42, 0.84, 1.14, 1.14), (0.84, 1.3, 1.3, 1.3), (1.3, 1.9, 1.1, 1.06)] if b[0] < total]
    if style == 3:   # плавный наезд, резкий щелчок отъезда и мягкий доезд
        out = [(0.0, 0.9, 1.0, 1.22), (0.9, 1.0, 1.0, 1.0)]
        for k in range(4):
            t0, t1 = 1.0 + 0.2 * k, 1.0 + 0.2 * (k + 1); f = lambda u: 1 - (1 - u) ** 3
            out.append((t0, t1, 1.0 + 0.12 * f(k / 4), 1.0 + 0.12 * f((k + 1) / 4)))
        return [b for b in out if b[0] < total]
    return hook_blocks_crash(total)


def hook_blocks_crash(total):
    """Краш-зум: резкий отъезд с 1.5 → 1.0 (ease-out), щелчок приближения, плавный отъезд."""
    out = []
    def ease(a, b, z0, z1, n=6):
        for k in range(n):
            t0, t1 = a + (b - a) * k / n, a + (b - a) * (k + 1) / n
            f = lambda u: 1 - (1 - u) ** 3
            out.append((t0, t1, z0 + (z1 - z0) * f(k / n), z0 + (z1 - z0) * f((k + 1) / n)))
    ease(0.0, 0.45, 1.5, 1.0)
    out.append((0.45, 0.95, 1.0, 1.02))
    ease(0.95, 1.12, 1.02, 1.28, 3)
    ease(1.12, 1.9, 1.28, 1.1, 4)
    return [b for b in out if b[0] < total]


def zoom_expr(sched):
    expr = '1'
    for a, b, z0, z1 in reversed(sched):
        lin = f"{z0}+({z1 - z0:.4f})*(it-{a:.3f})/{max(0.001, b - a):.3f}"
        expr = f"if(between(it\\,{a:.3f}\\,{b:.3f})\\,{lin}\\,{expr})"
    return expr


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--edl', required=True); ap.add_argument('--video', required=True)
    ap.add_argument('--transcript', required=True); ap.add_argument('--out', required=True)
    ap.add_argument('--font', required=True); ap.add_argument('--family', required=True)
    ap.add_argument('--weight', type=int, default=600); ap.add_argument('--size', type=int, default=62)
    ap.add_argument('--face-y', type=float, default=0.38); ap.add_argument('--subs-y', type=int, default=1380)
    ap.add_argument('--work', default=None)
    ap.add_argument('--title', default='', help='строки заголовка через |, акцентная строка с префиксом *')
    ap.add_argument('--title-font', default=None); ap.add_argument('--title-family', default='Title')
    ap.add_argument('--title-y', type=int, default=430); ap.add_argument('--title-end', type=float, default=3.4)
    ap.add_argument('--title-size', type=int, default=150); ap.add_argument('--title-weight', type=int, default=900); ap.add_argument('--title-accent', default='#FF2D46')
    ap.add_argument('--subs-style', default='marker'); ap.add_argument('--marker', default='#FFD60A')
    ap.add_argument('--start-tweak', default='0,0,0', help='a,b,c: сдвиг начала 1-го куска, конца 1-го, начала 2-го (с) — другой монтаж первых секунд')
    ap.add_argument('--hook-style', type=int, default=1, help='1 краш-отъезд, 2 ступенчатые «хоп», 3 наезд и щелчок')
    ap.add_argument('--clean', action='store_true', help='только наезды, без субтитров и заголовка (слой для анимаций)')
    ap.add_argument('--reuse', action='store_true', help='не пересчитывать готовые куски и кадры субтитров')
    ap.add_argument('--hook', type=int, default=1, help='краш-зум в первые ~1.8 с')
    a = ap.parse_args()
    E = json.load(open(a.edl))
    ta, tb, tc = (float(x) for x in a.start_tweak.split(','))
    if E['ranges']:
        E['ranges'][0]['start'] += ta; E['ranges'][0]['end'] += tb
        if len(E['ranges']) > 1: E['ranges'][1]['start'] += tc
    words = json.load(open(a.transcript))['words']
    name = os.path.splitext(os.path.basename(a.out))[0]
    work = a.work or os.path.join(os.path.dirname(os.path.abspath(a.out)), 'work_' + name)
    os.makedirs(work, exist_ok=True)
    W, H = probe_dims(a.video)
    W, H = (2160, 3840) if W >= 2000 else (1080, 1920)

    # 1. вырезка кусков (звук с микро-фейдами 30 мс)
    parts, cuts, words_out, off = [], [], [], 0.0
    fix = E.get('fix', {}); fix_at = {round(x['t'], 2): x['w'] for x in E.get('fix_at', [])}
    for i, r in enumerate(E['ranges']):
        s, e = r['start'], r['end']; d = e - s
        p = os.path.join(work, f'seg_{i:03d}.mov')
        if not (a.reuse and os.path.exists(p)): run(['ffmpeg', '-y', '-v', 'error', '-ss', f'{s:.3f}', '-i', a.video, '-t', f'{d:.3f}',
             '-vf', f'fps={FPS},scale={W}:{H}:flags=lanczos,setsar=1',
             '-af', f'afade=t=in:st=0:d=0.03,afade=t=out:st={max(0, d - 0.03):.3f}:d=0.03',
             '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '12', '-pix_fmt', 'yuv420p',
             '-c:a', 'pcm_s16le', '-ar', '48000', '-ac', '1', p])
        parts.append(p)
        for w in words:
            txt = (w.get('text') or '').strip()
            if not txt or w['start'] < s - 0.02 or w['start'] >= e: continue
            key = min(fix_at, key=lambda k: abs(k - w['start'])) if fix_at else None
            if key is not None and abs(key - w['start']) < 0.06: txt = fix_at[key]
            else: txt = apply_fix(txt, fix)
            if not txt: continue
            words_out.append({'w': txt, 's': round(w['start'] - s + off, 3), 'e': round(min(w['end'], e) - s + off, 3)})
        off += d; cuts.append(off)
    total = off
    lst = os.path.join(work, 'list.txt')
    open(lst, 'w').write(''.join(f"file '{p}'\n" for p in parts))
    base = os.path.join(work, 'base.mov')
    run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', base])

    # 2. субтитры: проект для render.mjs
    sp = os.path.join(work, 'subs'); os.makedirs(os.path.join(sp, 'scenes'), exist_ok=True)
    shutil.copy(a.font, os.path.join(sp, 'font.ttf'))
    fonts = [{'family': a.family, 'file': 'font.ttf'}]
    headline = None
    if a.title:
        if a.title_font:
            shutil.copy(a.title_font, os.path.join(sp, 'title.ttf')); fonts.append({'family': a.title_family, 'file': 'title.ttf'})
        lines = []
        for i, L in enumerate(a.title.split('|')):
            acc = L.startswith('*'); L = L.lstrip('*')
            d = {'text': L, 'size': a.title_size, 'at': i * 0.12}
            if acc: d.update(bg=a.title_accent, color='#fff', rot=-2)
            lines.append(d)
        headline = {'start': 0, 'end': a.title_end, 'y': a.title_y, 'lines': lines, 'font': a.title_family if a.title_font else 'MB',
                    'weight': a.title_weight, 'stroke': 0, 'gap': 4, 'ls': 0,
                    'shadow': '0 6px 24px rgba(0,0,0,.55), 0 2px 4px rgba(0,0,0,.5)'}
    open(os.path.join(sp, 'scenes', 'empty.js'), 'w').write('export default function setup(){return {update(){}}}\n')
    json.dump(words_out, open(os.path.join(sp, 'words.json'), 'w'), ensure_ascii=False)
    json.dump({'fps': FPS, 'duration': round(total, 3), 'background': 'none', 'progressBar': False, 'seam': False,
               'fonts': fonts, 'words': 'words.json', 'headline': headline,
               'subs': {'style': a.subs_style, 'pill': a.marker, 'font': a.family, 'weight': a.weight, 'size': a.size, 'y': a.subs_y,
                        'hideBefore': (a.title_end - 0.1) if a.title else -1, 'maxWords': 4, 'maxChars': 24, 'maxWidth': 900, 'dim': 0.5, 'lineHeight': 1.3, 'box': None if a.subs_style == 'marker' else 'rgba(14,16,22,.58)'},
               'scenes': [{'file': 'scenes/empty.js', 'start': 0, 'end': round(total + 1, 3), 'transition': 'none'}]},
              open(os.path.join(sp, 'project.json'), 'w'), ensure_ascii=False)
    frames = os.path.join(sp, 'frames')
    if a.clean or (a.reuse and os.path.isdir(frames) and os.listdir(frames)): pass
    else:
      if os.path.isdir(frames): shutil.rmtree(frames)
      run(['node', os.path.join(HERE, 'render.mjs'), '--project', sp, '--out', frames, '--workers', '4'])

    # 3. сборка: наезды + субтитры + громкость
    sched = zoom_schedule(cuts[:-1], total)
    if a.hook:
        hb = hook_blocks(total, a.hook_style); hend = hb[-1][1]
        sched = hb + [(max(x[0], hend), x[1], x[2], x[3]) for x in sched if x[1] > hend]
    json.dump(sched, open(os.path.join(work, 'zoom.json'), 'w'))
    # Наезды считаем сами с субпиксельной точностью (cv2.warpAffine). zoompan в ffmpeg
    # округляет окно кадра до целых пикселей — на плавном наезде картинка «дребезжит».
    import numpy as np, cv2
    fy = a.face_y; OW, OH = 1080, 1920

    def z_at(t):
        for b0, b1, z0, z1 in sched:
            if b0 <= t < b1: return z0 + (z1 - z0) * (t - b0) / max(1e-3, b1 - b0)
        return sched[-1][3] if sched else 1.0

    dec = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', base, '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'],
                           stdout=subprocess.PIPE, bufsize=10 ** 8)
    ins = ['-i', '-'] + ([] if a.clean else ['-framerate', str(FPS), '-i', os.path.join(frames, 'f_%05d.png')]) + ['-i', base]
    fc = ('[0:v]format=yuv420p[v];[1:a]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]' if a.clean else
          '[1:v]format=rgba[o];[0:v][o]overlay=0:0:eof_action=pass,format=yuv420p[v];'
          '[2:a]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]')
    enc = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{OW}x{OH}',
                            '-r', str(FPS)] + ins + ['-filter_complex', fc,
                            '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
                            '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
                            '-c:a', 'aac', '-b:a', '192k', '-t', f'{total:.3f}', a.out], stdin=subprocess.PIPE)
    fsz = W * H * 3; n = 0
    while True:
        buf = dec.stdout.read(fsz)
        if len(buf) < fsz: break
        img = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
        if W != OW: img = cv2.resize(img, (OW, OH), interpolation=cv2.INTER_AREA)
        t = n / FPS; z = z_at(t)
        dx = dy = 0.0
        if a.hook and a.hook_style != 2 and t < 0.5:                      # тряска удара в первые полсекунды
            k = (0.5 - t) * 2; dx = 14 * np.sin(t * 70) * k; dy = 10 * np.cos(t * 63) * k
        cx, cy = OW / 2 + dx, OH * fy + dy          # точка, которая остаётся на месте
        M = np.float32([[z, 0, OW / 2 - z * cx], [0, z, OH * fy - z * cy]])
        out = cv2.warpAffine(img, M, (OW, OH), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
        try: enc.stdin.write(out.tobytes())
        except BrokenPipeError: break          # кодировщик уже набрал нужную длину (-t)
        n += 1
    try: enc.stdin.close()
    except BrokenPipeError: pass
    enc.wait(); dec.kill(); dec.wait()
    if enc.returncode: raise SystemExit('ошибка кодирования')
    print(f'готово: {a.out}  {total:.1f} с, кусков {len(parts)}, смен кадра {len(sched)}')


if __name__ == '__main__':
    main()
