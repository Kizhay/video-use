#!/usr/bin/env bash
# Самотест конвейера: синтетическое видео 10 с -> рендер слоя -> наложение. Печатает время шагов.
set -e; cd "$(dirname "$0")/.."; export PATH=~/.local/bin:$PATH
t0=$(date +%s); ffmpeg -v error -y -f lavfi -i testsrc2=s=1080x1920:r=30:d=10 -f lavfi -i sine=d=10 -shortest -pix_fmt yuv420p -c:v libx264 -c:a aac /tmp/st_in.mp4
t1=$(date +%s); node render.mjs --project selftest --out /tmp/st_frames --workers ${WORKERS:-4} 2>&1 | grep -E "готово|rror" | tail -3
t2=$(date +%s); python3 layer.py --video /tmp/st_in.mp4 --frames /tmp/st_frames --out /tmp/st_out.mp4 --layout full
t3=$(date +%s); echo "САМОТЕСТ: видео ${t1-t0}… рендер $((t2-t1)) с (300 кадров), наложение $((t3-t2)) с, CPU $(nproc 2>/dev/null || sysctl -n hw.ncpu), RAM $(free -g 2>/dev/null | awk '/Mem/{print $2"G"}')"
ffprobe -v error -show_entries format=duration -of csv=p=0 /tmp/st_out.mp4
