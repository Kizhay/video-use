# video-use on the server (RocketMetrix video bot)

Customized fork of [browser-use/video-use](https://github.com/browser-use/video-use)
for conversation-driven video editing, adapted to run **headless on a Linux server**
and be driven by a Claude agent ("Джарвис"). The agent reads the user's natural-language
request and composes the helpers below.

## What's different from upstream
- **Local faster-whisper** transcription by default — no ElevenLabs key. Use `--language ru`.
- **PIL subtitle burner** (`helpers/burn_subs_pil.py`) with 4 styles + bundled Montserrat
  fonts (`assets/fonts/`). Works even without libass; on a libass-equipped ffmpeg you may
  also use the native `subtitles`/`ass` filter.
- **PIL title cards** (`helpers/title_card.py`) — no `drawtext` dependency.
- **`helpers/build_subs.py`** — natural-case, sentence-chunked SRT + corrections map;
  output-timeline offsets across EDL ranges (handles cuts + title cards).
- **`render.py --keep-resolution`** — HQ master: source resolution + fps preserved
  (4K→4K, CRF 16). Use this for "same quality in, same quality out".

## Setup (once)
```bash
git clone https://github.com/Kizhay/video-use.git
cd video-use
bash setup_server.sh      # pip install -e . + gdown ; verifies ffmpeg/libass
```
Requires `ffmpeg` (this server's build has libass + drawtext + zscale), `python3`, `pip`.
Whisper weights download on first run into `~/.cache/huggingface` (model `small` default;
`--whisper-model medium` for higher accuracy).

## Getting the user's video (Google Drive — lossless)
The user shares the file/folder "anyone with link" and sends the link. Download it
**losslessly** (Drive does not recompress):
```bash
gdown --fuzzy "<google-drive-share-link>" -O /root/inbox/videos/in.mp4
# or by file id:
gdown "https://drive.google.com/uc?id=FILE_ID" -O /root/inbox/videos/in.mp4
```

## Processing recipe (compose to match the request)
Pick an edit dir, e.g. `/root/inbox/edit`.
1. **Transcribe:** `python helpers/transcribe.py <video> --language ru --edit-dir <edit>`
2. **Read content:** `python helpers/pack_transcripts.py --edit-dir <edit>` → `takes_packed.md`
3. **Plan cuts → write `<edit>/edl.json`** (`sources`, `ranges`, optional `grade`,
   `subtitles`). EDL schema is in `SKILL.md`. `grade` ∈
   `warm_cinematic | neutral_punch | subtle | auto | "<raw ffmpeg>"` or omit (no grade —
   right for screencasts/UI).
4. **Subtitles SRT:** `python helpers/build_subs.py --edl <edit>/edl.json -o <edit>/subs.srt
   [--corrections fixes.json] [--max-chars 20] [--max-dur 2.0]`
5. **Render base (HQ, no subs):** `python helpers/render.py <edit>/edl.json -o <edit>/base.mp4
   --no-subtitles --keep-resolution`
6. **Burn subtitles:** `python helpers/burn_subs_pil.py --video <edit>/base.mp4
   --srt <edit>/subs.srt -o <edit>/final.mp4 --style yellow_accent --crf 16 --preset slow`
   - styles: `classic_box | clean_outline | bold_pop | yellow_accent`
7. **Title cards** (optional): `python helpers/title_card.py --out <edit>/intro.mp4
   --kicker ROCKETMETRIX --title "..."` → add as an EDL source + range.

## Speed change (e.g. 1.25×)
```bash
ffmpeg -i in.mp4 -filter_complex "[0:v]setpts=PTS/1.25[v];[0:a]atempo=1.25[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -crf 16 -preset slow -c:a aac out.mp4
```
Speed changes word timings — either transcribe **after** speeding up, or scale subtitle
times by 1/1.25 before burning.

## Subtitle style from a screenshot
If the user attaches a reference screenshot, look at it (you have vision) and map to:
font weight, text color, box on/off, outline, vertical position. Add/edit a preset in
`STYLES` in `helpers/burn_subs_pil.py` or pass `--font-size` / `--margin-bottom`.

## Return the result
Put output in `/root/inbox/output/`, then either upload to a Drive folder you control or
serve a temporary download link (a tiny `python -m http.server` on a free port). Quality is
preserved when step 5 used `--keep-resolution`.

## Planned (TODO)
- Word-by-word **karaoke** subtitles via ASS `\k` (this server has libass).
- Auto-derive a subtitle style from a reference screenshot.
- Telegram front-end (self-hosted Bot API, 2 GB, send as *document* to stay lossless).
