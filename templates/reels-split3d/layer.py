#!/usr/bin/env python3
"""Наложить слой анимации (PNG-кадры из render.mjs) на «чистое» видео говорящей головы
(talkhead.py --clean: наезды есть, субтитров нет).

  python layer.py --video clean.mp4 --frames <dir> --out final.mp4 --layout split|full [--face-y 0.36]

split: человек в нижней половине (кадрируем 1080×960 вокруг лица), сверху анимация.
full:  человек во весь кадр, анимация поверх (прозрачная, кроме вставок).
"""
import argparse, subprocess

ap = argparse.ArgumentParser()
ap.add_argument('--video', required=True); ap.add_argument('--frames', required=True)
ap.add_argument('--out', required=True); ap.add_argument('--layout', default='split')
ap.add_argument('--face-y', type=float, default=0.36); ap.add_argument('--fps', type=int, default=30)
ap.add_argument('--offset', type=float, default=0.0, help='сдвиг монтажа (с): >0 — речь стала позже, слой задерживаем; <0 — слой подрезаем')
a = ap.parse_args()

if a.layout == 'split':
    y = int(max(0, min(1920 - 960, 1920 * a.face_y - 400)))   # лицо в верхней трети нижней половины
    base = f"[0:v]crop=1080:960:0:{y},pad=1080:1920:0:960:color=black[b]"
else:
    base = "[0:v]null[b]"
shift = (f"tpad=start_duration={a.offset:.3f}:color=black@0.0," if a.offset > 0 else "")
fc = base + f";[1:v]format=rgba,{shift}null[o];[b][o]overlay=0:0:eof_action=pass,format=yuv420p[v]"
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', a.video, '-framerate', str(a.fps), '-start_number', str(max(0, round(-a.offset * a.fps))), '-i', f'{a.frames}/f_%05d.png',
                '-filter_complex', fc, '-map', '[v]', '-map', '0:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
                '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'copy', '-shortest', a.out],
               check=True)
print('готово:', a.out)
