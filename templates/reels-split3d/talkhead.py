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
    pattern = [(1.00, 1.05), (1.16, 1.16), (1.10, 1.02), (1.00, 1.00), (1.20, 1.12), (1.04, 1.10), (1.14, 1.14), (1.08, 1.00)]
    return [(a, b, *pattern[i % len(pattern)]) for i, (a, b) in enumerate(merged)]


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
    a = ap.parse_args()
    E = json.load(open(a.edl)); words = json.load(open(a.transcript))['words']
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
        run(['ffmpeg', '-y', '-v', 'error', '-ss', f'{s:.3f}', '-i', a.video, '-t', f'{d:.3f}',
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
    open(os.path.join(sp, 'scenes', 'empty.js'), 'w').write('export default function setup(){return {update(){}}}\n')
    json.dump(words_out, open(os.path.join(sp, 'words.json'), 'w'), ensure_ascii=False)
    json.dump({'fps': FPS, 'duration': round(total, 3), 'background': 'none', 'progressBar': False, 'seam': False,
               'fonts': [{'family': a.family, 'file': 'font.ttf'}], 'words': 'words.json',
               'subs': {'style': 'minimal', 'font': a.family, 'weight': a.weight, 'size': a.size, 'y': a.subs_y,
                        'maxWords': 4, 'maxChars': 24, 'maxWidth': 900, 'dim': 0.5, 'lineHeight': 1.15, 'box': 'rgba(14,16,22,.58)'},
               'scenes': [{'file': 'scenes/empty.js', 'start': 0, 'end': round(total + 1, 3), 'transition': 'none'}]},
              open(os.path.join(sp, 'project.json'), 'w'), ensure_ascii=False)
    frames = os.path.join(sp, 'frames')
    if os.path.isdir(frames): shutil.rmtree(frames)
    run(['node', os.path.join(HERE, 'render.mjs'), '--project', sp, '--out', frames, '--workers', '4'])

    # 3. сборка: наезды + субтитры + громкость
    sched = zoom_schedule(cuts[:-1], total)
    json.dump(sched, open(os.path.join(work, 'zoom.json'), 'w'))
    fy = a.face_y
    flt = (f"[0:v]zoompan=z='{zoom_expr(sched)}':x='iw/2-iw/zoom/2':y='ih*{fy}-ih/zoom*{fy}':d=1:s=1080x1920:fps={FPS},"
           f"setsar=1[b];[1:v]format=rgba[o];[b][o]overlay=0:0:eof_action=pass,format=yuv420p[v];"
           f"[0:a]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]")
    run(['ffmpeg', '-y', '-v', 'error', '-i', base, '-framerate', str(FPS), '-i', os.path.join(frames, 'f_%05d.png'),
         '-filter_complex', flt, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
         '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '192k',
         '-t', f'{total:.3f}', a.out])
    print(f'готово: {a.out}  {total:.1f} с, кусков {len(parts)}, смен кадра {len(sched)}')


if __name__ == '__main__':
    main()
