#!/usr/bin/env python3
"""Пакет для ручной доработки: всё, что нужно, чтобы открыть ролик в CapCut (или другом редакторе) и поправить самому.

  python3 capcut_pack.py --out PACK_DIR --name "Ролик" --final final.mp4 --source src.mp4 --edl edl.json --words words.json
        [--clean clean.mp4] [--zoom zoom.json] [--cube look.cube] [--look-params params.json]
        [--overlay-frames FRAMES_DIR] [--fps 30] [--size 1080x1920] [--zip PACK.zip]

В пакете:
  final.mp4            готовый ролик
  clean.mp4            без субтитров и анимации (после наездов и цветокора), если передан
  subtitles.srt        субтитры (CapCut: Текст → Субтитры → Импорт .srt)
  subtitles_words.json пословные тайминги
  cuts.csv             что вырезано из исходника: таймкоды резов (исходник → таймлайн)
  look.cube            цветокор-LUT (CapCut: Настройка → LUT → Импорт); look_params.json — те же ползунки числами
  overlay_alpha.mov    слой анимации с прозрачностью (ProRes 4444), кладётся поверх clean.mp4
  capcut_draft/        ЭКСПЕРИМЕНТАЛЬНЫЙ проект CapCut (pyCapCut): резы исходника, наезды ключевыми кадрами, субтитры
  README.txt           что куда класть и как открыть

Черновик CapCut строится сторонней библиотекой, формат проектов CapCut не документирован и меняется между версиями:
открывается не у всех (см. README.txt); остальное в пакете от версии CapCut не зависит.
"""
import argparse, csv, json, os, shutil, subprocess, sys, zipfile


def fmt_srt(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'


def groups_from_words(words, max_words=4, max_chars=26):
    gs, cur = [], []
    for w in words:
        txt = w['w'].strip()
        if not txt: continue
        prev = cur[-1] if cur else None
        chars = sum(len(x['w']) + 1 for x in cur) + len(txt)
        if cur and (len(cur) >= max_words or chars > max_chars or (prev and prev['w'].rstrip()[-1:] in '.!?…') or (w['s'] - prev['e'] > 0.45)):
            gs.append(cur); cur = []
        cur.append(w)
    if cur: gs.append(cur)
    out = []
    for i, g in enumerate(gs):
        end = g[-1]['e'] + 0.25
        if i + 1 < len(gs): end = min(end, gs[i + 1][0]['s'] - 0.02)
        out.append({'start': g[0]['s'], 'end': max(end, g[0]['s'] + 0.2), 'text': ' '.join(x['w'].strip() for x in g)})
    return out


def write_srt(groups, path):
    with open(path, 'w', encoding='utf-8') as f:
        for i, g in enumerate(groups, 1):
            f.write(f"{i}\n{fmt_srt(g['start'])} --> {fmt_srt(g['end'])}\n{g['text']}\n\n")


def write_cuts(edl, path):
    t = 0.0
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f); w.writerow(['№', 'исходник_с', 'исходник_по', 'таймлайн_с', 'таймлайн_по', 'длина', 'фраза'])
        for i, r in enumerate(edl['ranges'], 1):
            d = r['end'] - r['start']; w.writerow([i, f"{r['start']:.2f}", f"{r['end']:.2f}", f'{t:.2f}', f'{t + d:.2f}', f'{d:.2f}', r.get('quote', '')]); t += d


def make_overlay(frames, out, fps):
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-framerate', str(fps), '-i', os.path.join(frames, 'f_%05d.png'), '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', out], check=True)


def build_draft(root, name, source, edl, groups, zoom, w, h, fps):
    import pycapcut as cc
    from pycapcut import SEC
    os.makedirs(root, exist_ok=True)
    folder = cc.DraftFolder(root); script = folder.create_draft(name, w, h, fps=fps, allow_replace=True)
    script.add_track(cc.TrackType.video).add_track(cc.TrackType.text)
    segs = []; t = 0.0
    for r in edl['ranges']:
        d = r['end'] - r['start']
        vs = cc.VideoSegment(source, cc.Timerange(int(round(t * SEC)), int(round(d * SEC))), source_timerange=cc.Timerange(int(round(r['start'] * SEC)), int(round(d * SEC))))
        if zoom:
            def z_at(x):
                for b0, b1, z0, z1 in zoom:
                    if b0 <= x < b1: return z0 + (z1 - z0) * (x - b0) / max(1e-3, b1 - b0)
                return 1.0
            pts = {0.0, d - 0.001}
            for b0, b1, _, _ in zoom:
                for bt in (b0, b1):
                    if t < bt < t + d: pts.add(bt - t)
            for off in sorted(pts):
                vs.add_keyframe(cc.KeyframeProperty.uniform_scale, int(round(off * SEC)), z_at(t + off))
        script.add_segment(vs); segs.append(vs); t += d
    for g in groups:
        script.add_segment(cc.TextSegment(g['text'], cc.Timerange(int(round(g['start'] * SEC)), int(round((g['end'] - g['start']) * SEC))),
                                         style=cc.TextStyle(size=9.0, color=(1, 1, 1), bold=True), clip_settings=cc.ClipSettings(transform_y=-0.72)))
    script.save()
    return os.path.join(root, name)


README = """Пакет для доработки в CapCut

1. final.mp4 — готовый ролик. Просто посмотреть или опубликовать.
2. Хотите править сами:
   • Новый проект CapCut → загрузите clean.mp4 (ролик без субтитров и анимации).
   • Субтитры: Текст → Субтитры → Импорт → subtitles.srt (потом оформление меняете как нравится).
   • Цвет: Настройка → LUT → Импорт → look.cube. Те же ползунки числами — в look_params.json
     (exposure, contrast, highlights … как в панели «Настройка»; наши формулы похожи на CapCut, но не побитово те же).
   • Анимация: overlay_alpha.mov положите на дорожку выше clean.mp4 (ProRes 4444 с прозрачностью; если CapCut
     не показывает прозрачность — используйте Final Cut / DaVinci Resolve / Premiere).
   • cuts.csv — таймкоды резов относительно исходника, если хотите пересобрать монтаж с нуля.
3. capcut_draft/ — ЭКСПЕРИМЕНТ: готовый проект CapCut (резы исходника, наезды, субтитры).
   Скопируйте папку внутрь папки проектов CapCut:
     Windows: C:/Users/<вы>/AppData/Local/CapCut/User Data/Projects/com.lveditor.draft
     macOS:   ~/Movies/CapCut/User Data/Projects/com.lveditor.draft
   Перезапустите CapCut. Если проект не появился или пишет «файл не найден» — исходный ролик (лежит в папке
   «исходник») придётся указать заново (Заменить медиа). Формат проектов CapCut не документирован и меняется между версиями, поэтому
   гарантии нет: остальные файлы пакета от версии не зависят.
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True); ap.add_argument('--name', default='Reels'); ap.add_argument('--final', required=True)
    ap.add_argument('--source'); ap.add_argument('--clean'); ap.add_argument('--edl'); ap.add_argument('--words'); ap.add_argument('--zoom')
    ap.add_argument('--cube'); ap.add_argument('--look-params'); ap.add_argument('--overlay-frames'); ap.add_argument('--fps', type=int, default=30)
    ap.add_argument('--size', default='1080x1920'); ap.add_argument('--zip')
    a = ap.parse_args(); os.makedirs(a.out, exist_ok=True); w, h = (int(x) for x in a.size.split('x'))
    done = {}
    shutil.copy(a.final, os.path.join(a.out, 'final.mp4')); done['final.mp4'] = 'ok'
    if a.clean: shutil.copy(a.clean, os.path.join(a.out, 'clean.mp4')); done['clean.mp4'] = 'ok'
    words = json.load(open(a.words)) if a.words else None; edl = json.load(open(a.edl)) if a.edl else None
    groups = groups_from_words(words) if words else []
    if groups:
        write_srt(groups, os.path.join(a.out, 'subtitles.srt')); json.dump(words, open(os.path.join(a.out, 'subtitles_words.json'), 'w'), ensure_ascii=False); done['subtitles.srt'] = f'{len(groups)} строк'
    if edl: write_cuts(edl, os.path.join(a.out, 'cuts.csv')); done['cuts.csv'] = f"{len(edl['ranges'])} резов"
    if a.cube and os.path.exists(a.cube): shutil.copy(a.cube, os.path.join(a.out, 'look.cube')); done['look.cube'] = 'ok'
    if a.look_params and os.path.exists(a.look_params): shutil.copy(a.look_params, os.path.join(a.out, 'look_params.json')); done['look_params.json'] = 'ok'
    if a.overlay_frames and os.path.isdir(a.overlay_frames):
        try: make_overlay(a.overlay_frames, os.path.join(a.out, 'overlay_alpha.mov'), a.fps); done['overlay_alpha.mov'] = 'ok'
        except Exception as e: done['overlay_alpha.mov'] = f'не вышло: {e}'
    if a.source and edl:
        try:
            zoom = json.load(open(a.zoom)) if a.zoom else None
            d = build_draft(os.path.join(a.out, 'capcut_draft'), a.name, os.path.abspath(a.source), edl, groups, zoom, w, h, a.fps); done['capcut_draft'] = d
        except Exception as e: done['capcut_draft'] = f'не вышло: {e}'
    if a.source and os.path.exists(a.source) and os.path.getsize(a.source) < 1_500_000_000:
        os.makedirs(os.path.join(a.out, 'исходник'), exist_ok=True); shutil.copy(a.source, os.path.join(a.out, 'исходник', 'source' + os.path.splitext(a.source)[1])); done['исходник'] = 'ok'
    open(os.path.join(a.out, 'README.txt'), 'w', encoding='utf-8').write(README)
    if a.zip:
        with zipfile.ZipFile(a.zip, 'w', zipfile.ZIP_STORED) as z:
            for root, _, files in os.walk(a.out):
                for f in files: p = os.path.join(root, f); z.write(p, os.path.relpath(p, a.out))
        done['zip'] = f'{os.path.getsize(a.zip) // 1024} КБ'
    print(json.dumps(done, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
