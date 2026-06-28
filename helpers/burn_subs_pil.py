"""Burn SRT subtitles onto a video using PIL-rendered overlays (no libass).

This ffmpeg build ships without libass/`subtitles` and without `drawtext`, so
captions are rendered as RGBA strip PNGs with PIL and composited with the
`overlay` filter, each gated to its cue window via enable='between(t,a,b)'.

Style: white Arial-Bold text on a semi-transparent rounded black box,
bottom-centered, auto-wrapped to a max width. Tuned for horizontal (16:9)
talking-head / screencast video.

Usage:
    python helpers/burn_subs_pil.py --video base.mp4 --srt master.srt -o final.mp4
    python helpers/burn_subs_pil.py --video base.mp4 --srt master.srt -o out.mp4 \
        --font-size 44 --margin-bottom 60
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

_FONTS = Path(__file__).resolve().parent.parent / "assets" / "fonts"
FONT_BOLD = str(_FONTS / "Montserrat-ExtraBold.ttf")  # cross-platform default

# Caption style presets. `box` is an RGBA fill or None; `stroke`/`shadow` add an
# outline / drop shadow (good for box-less styles over busy footage).
STYLES: dict[str, dict] = {
    "classic_box": {
        "font": FONT_BOLD, "color": (255, 255, 255, 255),
        "box": (0, 0, 0, 165), "radius": 16, "stroke": 0,
    },
    "clean_outline": {
        "font": str(_FONTS / "Montserrat-ExtraBold.ttf"), "color": (255, 255, 255, 255),
        "box": None, "stroke": 6, "stroke_color": (0, 0, 0, 255), "shadow": 3,
    },
    "bold_pop": {
        "font": str(_FONTS / "Montserrat-Black.ttf"), "color": (255, 255, 255, 255),
        "box": None, "stroke": 8, "stroke_color": (0, 0, 0, 255), "shadow": 4, "upper": True,
    },
    "yellow_accent": {
        "font": str(_FONTS / "Montserrat-ExtraBold.ttf"), "color": (255, 224, 0, 255),
        "box": None, "stroke": 7, "stroke_color": (0, 0, 0, 255), "shadow": 3, "upper": True,
    },
}


def probe_dims(video: Path) -> tuple[int, int]:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height", "-of", "csv=p=0:s=x", str(video)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    w, h = out.split("x")
    return int(w), int(h)


def probe_duration(video: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nk=1:nw=1", str(video)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return float(out)


def parse_srt(path: Path) -> list[tuple[float, float, str]]:
    def ts(s: str) -> float:
        s = s.strip().replace(",", ".")
        hh, mm, rest = s.split(":")
        return int(hh) * 3600 + int(mm) * 60 + float(rest)

    blocks = re.split(r"\n\s*\n", path.read_text(encoding="utf-8").strip())
    cues: list[tuple[float, float, str]] = []
    for b in blocks:
        lines = [ln for ln in b.splitlines() if ln.strip()]
        if len(lines) < 2:
            continue
        time_line = next((ln for ln in lines if "-->" in ln), None)
        if not time_line:
            continue
        idx = lines.index(time_line)
        a, bb = time_line.split("-->")
        text = " ".join(lines[idx + 1:]).strip()
        if text:
            cues.append((ts(a), ts(bb), text))
    return cues


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_w: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    cur = ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=font) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def render_caption(text: str, font: ImageFont.FreeTypeFont, video_w: int, style: dict) -> Image.Image:
    if style.get("upper"):
        text = text.upper()
    stroke = style.get("stroke", 0)
    stroke_color = style.get("stroke_color", (0, 0, 0, 255))
    shadow = style.get("shadow", 0)
    color = style.get("color", (255, 255, 255, 255))
    box = style.get("box")
    line_gap = 8

    max_text_w = int(video_w * 0.86)
    scratch = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    lines = wrap_text(scratch, text, font, max_text_w)
    asc, desc = font.getmetrics()
    line_h = asc + desc
    text_w = max(int(scratch.textlength(ln, font=font)) for ln in lines)
    text_h = line_h * len(lines) + line_gap * (len(lines) - 1)

    if box:
        pad_x, pad_y = 28, 16
        box_w, box_h = text_w + pad_x * 2, text_h + pad_y * 2
        img = Image.new("RGBA", (box_w, box_h), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        d.rounded_rectangle([0, 0, box_w, box_h], radius=style.get("radius", 16), fill=box)
        ox, oy = pad_x, pad_y
        canvas_w = box_w
    else:
        # box-less: pad enough that stroke + shadow are not clipped
        m = stroke + shadow + 6
        canvas_w = text_w + 2 * m
        img = Image.new("RGBA", (canvas_w, text_h + 2 * m), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        ox = oy = m

    y = oy
    for ln in lines:
        lw = int(d.textlength(ln, font=font))
        x = (canvas_w - lw) // 2
        if shadow:
            d.text((x + shadow, y + shadow), ln, font=font, fill=(0, 0, 0, 150),
                   stroke_width=stroke, stroke_fill=(0, 0, 0, 150))
        d.text((x, y), ln, font=font, fill=color,
               stroke_width=stroke, stroke_fill=stroke_color)
        y += line_h + line_gap
    return img


def main() -> None:
    ap = argparse.ArgumentParser(description="Burn SRT onto video via PIL overlays")
    ap.add_argument("--video", type=Path, required=True)
    ap.add_argument("--srt", type=Path, required=True)
    ap.add_argument("-o", "--output", type=Path, required=True)
    ap.add_argument("--style", type=str, default="classic_box", choices=list(STYLES),
                    help="caption style preset")
    ap.add_argument("--font-size", type=int, default=0, help="0 = auto (~4%% of height)")
    ap.add_argument("--margin-bottom", type=int, default=0, help="0 = auto (~5%% of height)")
    ap.add_argument("--crf", type=int, default=18)
    ap.add_argument("--preset", type=str, default="medium")
    args = ap.parse_args()

    style = STYLES[args.style]
    font_path = style["font"]
    if not Path(font_path).exists():
        sys.exit(f"font not found: {font_path}")

    w, h = probe_dims(args.video)
    duration = probe_duration(args.video)
    font_size = args.font_size or max(22, round(h * 0.040))
    margin_bottom = args.margin_bottom or round(h * 0.05)
    font = ImageFont.truetype(font_path, font_size)

    cues = parse_srt(args.srt)
    if not cues:
        sys.exit("no cues parsed from SRT")

    with tempfile.TemporaryDirectory() as tmp:
        tmpd = Path(tmp)
        inputs: list[str] = ["-i", str(args.video)]
        filt: list[str] = []
        cur = "[0:v]"
        for i, (a, b, text) in enumerate(cues):
            png = tmpd / f"cap_{i:03d}.png"
            render_caption(text, font, w, style).save(png)
            # Loop each still for the whole timeline so the frame is "present"
            # when its enable-window opens (a single-frame input only exists at
            # t=0, so late cues never appear).
            inputs += ["-loop", "1", "-t", f"{duration:.3f}", "-i", str(png)]
            y = f"H-h-{margin_bottom}"
            nxt = f"[v{i}]"
            filt.append(
                f"{cur}[{i+1}:v]overlay=x=(W-w)/2:y={y}:"
                f"enable='between(t,{a:.3f},{b:.3f})'{nxt}"
            )
            cur = nxt
        filter_complex = ";".join(filt)

        cmd = [
            "ffmpeg", "-y", *inputs,
            "-filter_complex", filter_complex,
            "-map", cur, "-map", "0:a?",
            "-c:v", "libx264", "-preset", args.preset, "-crf", str(args.crf),
            "-pix_fmt", "yuv420p",
            "-c:a", "copy", "-movflags", "+faststart",
            str(args.output),
        ]
        print(f"burning {len(cues)} captions onto {args.video.name} ({w}x{h}, font {font_size}) …")
        proc = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
        if proc.returncode != 0:
            sys.stderr.write(proc.stderr[-1500:])
            sys.exit(f"ffmpeg failed ({proc.returncode})")

    size_mb = args.output.stat().st_size / (1024 * 1024)
    print(f"done: {args.output} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
