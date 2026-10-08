#!/usr/bin/env python3
"""Сборка Reels «сплит-скрин»: снизу аватар (кадрирование + наезды камеры),
сверху/поверх — PNG-кадры из render.mjs, звук = голос + синтезированные SFX.

  uv run python compose.py --project <dir> --video <src.mp4> --frames <dir> --out final.mp4 \
      [--start 0 --end 62] [--crop 1118:994:401:60] [--face-y 0.36] [--zoom "0:5.5:1.06,14:20.2:1.08"] \
      [--sfx 1] [--preview]

project.json даёт длительность, fps и начала сцен (на них ставятся «свуши»).
Доп. удары: в project.json "sfx": [{"t": 49.4, "kind": "impact"}, {"t": 57.2, "kind": "pop"}].
"""
import argparse, json, os, subprocess, wave
import numpy as np

SR = 48000


def env(n, a=0.005, r=0.2):
    e = np.ones(n); ai = int(a * SR); ri = min(n, int(r * SR))
    if ai: e[:ai] = np.linspace(0, 1, ai)
    e[-ri:] *= np.linspace(1, 0, ri) ** 2
    return e


def whoosh(rng, dur=0.42):
    n = int(dur * SR); x = rng.standard_normal(n)
    # полосовой «вжух»: сглаживание с меняющимся окном
    out = np.zeros(n); acc = 0.0
    for i in range(n):
        k = 0.02 + 0.5 * (i / n) ** 1.5
        acc += k * (x[i] - acc); out[i] = acc
    out -= np.convolve(out, np.ones(40) / 40, 'same')
    shape = np.sin(np.linspace(0, np.pi, n)) ** 2
    return out * shape / (np.abs(out).max() + 1e-9) * 0.5


def impact(dur=0.9):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 55 + 90 * np.exp(-t * 18)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.5)
    click = np.random.default_rng(3).standard_normal(n) * np.exp(-t * 60) * 0.4
    return (sub + click) * 0.9


def pop(dur=0.18):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 900 - 500 * t / dur
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28) * 0.6


def ding(dur=1.2):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * t) * a for f, a in [(1318, 1), (1976, .5), (2637, .25)])
    return s * np.exp(-t * 3.5) * 0.25


def build_sfx(P, start, end, path):
    rng = np.random.default_rng(11)
    total = int((end - start) * SR) + SR
    bus = np.zeros(total)

    def place(sig, t, gain):
        i = int((t - start) * SR)
        if i < 0 or i >= total: return
        j = min(total, i + len(sig)); bus[i:j] += sig[: j - i] * gain

    for k, s in enumerate(P['scenes']):
        if k == 0: continue
        place(whoosh(rng), s['start'] - 0.2, 0.22)
    place(impact(), 0.0, 0.55)
    for e in P.get('sfx', []):
        sig = {'impact': impact, 'pop': pop, 'ding': ding, 'whoosh': lambda: whoosh(rng)}[e['kind']]()
        place(sig, e['t'], e.get('gain', 0.4))
    bus = np.clip(bus, -1, 1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((bus * 32767).astype('<i2').tobytes())


def zoom_expr(spec):
    # "a:b:z,..." -> выражение zoompan от времени входа 'it'
    expr = '1'
    for part in reversed([p for p in spec.split(',') if p]):
        a, b, z = part.split(':')
        expr = f"if(between(it\\,{a}\\,{b})\\,{z}\\,{expr})"
    return expr


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--project', required=True); ap.add_argument('--video', required=True)
    ap.add_argument('--frames', required=True); ap.add_argument('--out', required=True)
    ap.add_argument('--start', type=float, default=0); ap.add_argument('--end', type=float)
    ap.add_argument('--crop', default='1118:994:401:60')
    ap.add_argument('--face-y', type=float, default=0.36)
    ap.add_argument('--zoom', default='')
    ap.add_argument('--sfx', type=int, default=1)
    ap.add_argument('--preview', action='store_true')
    a = ap.parse_args()
    P = json.load(open(os.path.join(a.project, 'project.json')))
    fps = P.get('fps', 30); end = a.end or P['duration']; dur = end - a.start
    sfx_path = os.path.join(a.project, 'sfx.wav')
    if a.sfx: build_sfx(P, a.start, end, sfx_path)

    zx = zoom_expr(a.zoom) if a.zoom else '1'
    fy = a.face_y
    v = (f"[0:v]trim={a.start}:{end},setpts=PTS-STARTPTS,fps={fps},crop={a.crop},"
         f"zoompan=z='{zx}':x='iw/2-iw/zoom/2':y='ih*{fy}-ih/zoom*{fy}':d=1:s=1080x960:fps={fps},"
         f"setsar=1,pad=1080:1920:0:960:color=black[base];"
         f"[1:v]format=rgba[ov];[base][ov]overlay=0:0:eof_action=pass:format=auto,format=yuv420p[v]")
    au = (f"[0:a]atrim={a.start}:{end},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.03,"
          f"afade=t=out:st={dur - 0.05:.3f}:d=0.05[voice]")
    if a.sfx:
        au += ";[2:a]aresample=48000,atrim=0:" + f"{dur}" + "[fx];[voice]aresample=48000[vo];[vo][fx]amix=inputs=2:normalize=0[mix];[mix]loudnorm=I=-14:TP=-1.5:LRA=11[a]"
    else:
        au += ";[voice]loudnorm=I=-14:TP=-1.5:LRA=11[a]"
    cmd = ['ffmpeg', '-y', '-v', 'error', '-i', a.video,
           '-framerate', str(fps), '-i', os.path.join(a.frames, 'f_%05d.png')]
    if a.sfx: cmd += ['-i', sfx_path]
    cmd += ['-filter_complex', v + ';' + au, '-map', '[v]', '-map', '[a]',
            '-c:v', 'libx264', '-preset', 'veryfast' if a.preview else 'slow', '-crf', '28' if a.preview else '17',
            '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
            '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', f'{dur:.3f}', a.out]
    print(' '.join(cmd[:6]), '…')
    subprocess.run(cmd, check=True)


if __name__ == '__main__':
    main()
