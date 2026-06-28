#!/usr/bin/env bash
# One-time setup for running video-use headless on the server.
set -euo pipefail
cd "$(dirname "$0")"

echo "[video-use] installing python deps (editable + gdown)…"
pip install -e . >/dev/null
pip install gdown >/dev/null

echo "[video-use] ffmpeg:"
if command -v ffmpeg >/dev/null; then
  ffmpeg -hide_banner -version | head -1
  if ffmpeg -hide_banner -filters 2>/dev/null | grep -qE '^ .. subtitles '; then
    echo "  libass 'subtitles' filter: present (native burn available)"
  else
    echo "  libass absent → PIL subtitle burner (helpers/burn_subs_pil.py) will be used"
  fi
else
  echo "  WARNING: ffmpeg not found — install it (apt-get install -y ffmpeg)"
fi

echo "[video-use] fonts:"
ls assets/fonts/*.ttf 2>/dev/null || echo "  WARNING: fonts missing"

mkdir -p inbox/videos inbox/edit inbox/output
echo "[video-use] inbox/ ready (videos/ edit/ output/)."
echo "[video-use] setup done. See SERVER.md for the processing recipe."
