#!/usr/bin/env python3
"""Склейка нескольких исходников в один ролик ДО основного монтажа.

  python3 merge_clips.py MODE OUT.mp4 CLIP1 CLIP2 [CLIP3 ...]

MODE:
  sequence  по очереди, встык, в порядке аргументов (размер кадра как у первого ролика)
  stack     в одном кадре 1080x1920 сверху вниз (2-3 ролика)
  side      в одном кадре 1080x1920 слева направо (2-3 ролика)

Звук: sequence — звук каждого ролика по очереди; stack/side — звук ПЕРВОГО ролика
(остальные немые). Длина stack/side — длина первого: остальные обрезаются или
удерживают последний кадр. Каждый ролик приводится к 30 к/с; повороты iPhone
(rotation в метаданных) учитываются. Нет звука у ролика — подставляется тишина.
"""
import json, subprocess, sys

FPS = 30


def probe(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path],
                         capture_output=True, text=True, check=True).stdout
    j = json.loads(out)
    v = next(s for s in j['streams'] if s['codec_type'] == 'video')
    w, h = int(v['width']), int(v['height'])
    rot = 0
    for sd in v.get('side_data_list', []) or []:
        rot = int(sd.get('rotation', 0) or 0)
    if abs(rot) % 180 == 90:
        w, h = h, w
    dur = float(j['format'].get('duration') or v.get('duration') or 0)
    return {'w': w, 'h': h, 'dur': dur, 'audio': any(s['codec_type'] == 'audio' for s in j['streams'])}


def cell(i, w, h, label):
    """Ролик i -> w x h, заполнение с обрезкой краёв, 30 к/с."""
    return (f"[{i}:v]fps={FPS},scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},"
            f"setsar=1,format=yuv420p,setpts=PTS-STARTPTS[{label}]")


def main():
    if len(sys.argv) < 5:
        sys.exit(__doc__)
    mode, out, clips = sys.argv[1], sys.argv[2], sys.argv[3:]
    if mode not in ('sequence', 'stack', 'side'):
        sys.exit('MODE: sequence | stack | side')
    if mode != 'sequence' and len(clips) > 3:
        sys.exit('stack/side: не больше 3 роликов')
    info = [probe(c) for c in clips]
    n = len(clips)
    inputs = []
    for c in clips:
        inputs += ['-i', c]
    fc = []

    if mode == 'sequence':
        W, H = info[0]['w'], info[0]['h']
        # чётные размеры для yuv420p
        W -= W % 2; H -= H % 2
        extra = n  # номер следующего входа для тишины
        for i, inf in enumerate(info):
            fc.append(cell(i, W, H, f'v{i}'))
            if inf['audio']:
                fc.append(f'[{i}:a]aresample=48000,aformat=channel_layouts=stereo,asetpts=PTS-STARTPTS[a{i}]')
            else:
                inputs += ['-f', 'lavfi', '-t', f"{inf['dur']:.3f}", '-i', 'anullsrc=r=48000:cl=stereo']
                fc.append(f'[{extra}:a]asetpts=PTS-STARTPTS[a{i}]'); extra += 1
        fc.append(''.join(f'[v{i}][a{i}]' for i in range(n)) + f'concat=n={n}:v=1:a=1[v][a]')
        total = sum(i['dur'] for i in info)
    else:
        total = info[0]['dur']
        if mode == 'stack':
            cw, ch = 1080, 1920 // n
            ch -= ch % 2
            stack = 'vstack'
        else:
            cw, ch = 1080 // n, 1920
            cw -= cw % 2
            stack = 'hstack'
        for i in range(n):
            fc.append(cell(i, cw, ch, f'c{i}'))
            # короткие ролики держат последний кадр, длинные обрезает -t
            fc[-1] = fc[-1].replace(f'[c{i}]', f',tpad=stop_mode=clone:stop_duration={total:.3f},trim=duration={total:.3f}[c{i}]')
        fc.append(''.join(f'[c{i}]' for i in range(n)) + f'{stack}=inputs={n}[st]')
        fc.append(f'[st]pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,format=yuv420p[v]')
        if info[0]['audio']:
            fc.append('[0:a]aresample=48000,aformat=channel_layouts=stereo[a]')
        else:
            inputs += ['-f', 'lavfi', '-t', f'{total:.3f}', '-i', 'anullsrc=r=48000:cl=stereo']
            fc.append(f'[{n}:a]asetpts=PTS-STARTPTS[a]')

    cmd = ['ffmpeg', '-y', '-v', 'error'] + inputs + ['-filter_complex', ';'.join(fc), '-map', '[v]', '-map', '[a]',
           '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', str(FPS),
           '-c:a', 'aac', '-b:a', '192k', '-t', f'{total:.3f}', '-movflags', '+faststart', out]
    subprocess.run(cmd, check=True)
    print(json.dumps({'out': out, 'mode': mode, 'clips': n, 'duration': round(total, 3)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
