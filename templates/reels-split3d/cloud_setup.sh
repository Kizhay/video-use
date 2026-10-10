#!/usr/bin/env bash
# Установка зависимостей конвейера в облачной/серверной Linux-среде (без sudo, если его нет).
set -e
cd "$(dirname "$0")"
ROOT=$(cd ../.. && pwd)
log(){ echo "[setup $(date +%T)] $*"; }
if ! command -v ffmpeg >/dev/null; then
  if command -v apt-get >/dev/null && { [ "$(id -u)" = 0 ] || sudo -n true 2>/dev/null; }; then
    log "apt ffmpeg"; (sudo -n apt-get update -qq || apt-get update -qq) && (sudo -n apt-get install -y -qq ffmpeg fonts-dejavu || apt-get install -y -qq ffmpeg fonts-dejavu)
  else
    log "static ffmpeg"; mkdir -p ~/.local/bin && curl -sL https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz | tar xJ -C /tmp && cp /tmp/ffmpeg-*-static/ff* ~/.local/bin/ && export PATH=~/.local/bin:$PATH
  fi
fi
log "ffmpeg: $(ffmpeg -version | head -1)"
log "node: $(node -v 2>/dev/null || echo нет)"
npm i --silent 2>&1 | tail -2
npx --yes puppeteer browsers install chrome 2>&1 | tail -1 || true
# системные библиотеки для headless Chrome
if command -v apt-get >/dev/null && { [ "$(id -u)" = 0 ] || sudo -n true 2>/dev/null; }; then
  (sudo -n apt-get install -y -qq libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2t64 libpango-1.0-0 libcairo2 2>/dev/null || apt-get install -y -qq libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2 2>/dev/null) || true
fi
python3 -m pip install -q --user faster-whisper opencv-python-headless numpy pillow 2>&1 | tail -1 || pip install -q faster-whisper opencv-python-headless numpy pillow
log "готово"
