"""Render a title / outro card as a short MP4 clip (PIL → ffmpeg).

This ffmpeg build has no `drawtext` (compiled without libfreetype), so text
is drawn with PIL instead — which also gives full layout control. Output is a
1920×1080 H.264 clip with a silent stereo audio track, so it slots straight
into an EDL as a normal source/range and concatenates cleanly with graded
segments.

Layout (all parts optional, vertically centered as a block):
    [kicker]      small, accent-coloured, letter-spaced
    TITLE         large, bold, white
    [subtitle]    medium, light grey
    [footer]      medium, drawn inside an accent "pill" (good for a URL/CTA)

Usage:
    python helpers/title_card.py --out intro.mp4 \
        --kicker "ROCKETMETRIX" --title "Обзор нового дашборда" --duration 2.5
    python helpers/title_card.py --out outro.mp4 \
        --title "Спасибо за просмотр!" \
        --subtitle "Зарегистрируйтесь и получите 7 дней бесплатно" \
        --footer "app.rocketmetrix.ru" --duration 3.5
"""

from __future__ import annotations

import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


# Bundled Montserrat (full Cyrillic), cross-platform (Mac + Linux server).
_FONTS = Path(__file__).resolve().parent.parent / "assets" / "fonts"
FONT_BOLD = str(_FONTS / "Montserrat-ExtraBold.ttf")
FONT_REG = str(_FONTS / "Montserrat-Medium.ttf")


def _hex(c: str) -> tuple[int, int, int]:
    c = c.lstrip("#")
    return tuple(int(c[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore


def _vertical_gradient(w: int, h: int, top: tuple, bottom: tuple) -> Image.Image:
    base = Image.new("RGB", (w, h), top)
    draw = ImageDraw.Draw(base)
    for y in range(h):
        t = y / max(1, h - 1)
        col = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        draw.line([(0, y), (w, y)], fill=col)
    return base


def _font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def _text_w(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, tracking: int = 0) -> int:
    if tracking == 0:
        return int(draw.textlength(text, font=font))
    return int(sum(draw.textlength(ch, font=font) for ch in text) + tracking * max(0, len(text) - 1))


def _draw_centered(
    draw: ImageDraw.ImageDraw, cx: int, y: int, text: str,
    font: ImageFont.FreeTypeFont, fill: tuple, tracking: int = 0,
) -> int:
    """Draw horizontally-centered text at top-y. Returns the line height used."""
    asc, desc = font.getmetrics()
    line_h = asc + desc
    if tracking == 0:
        w = int(draw.textlength(text, font=font))
        draw.text((cx - w / 2, y), text, font=font, fill=fill)
    else:
        w = _text_w(draw, text, font, tracking)
        x = cx - w / 2
        for ch in text:
            draw.text((x, y), ch, font=font, fill=fill)
            x += draw.textlength(ch, font=font) + tracking
    return line_h


def render_png(
    out_png: Path,
    title: str,
    kicker: str = "",
    subtitle: str = "",
    footer: str = "",
    accent: str = "#0066ff",
    width: int = 1920,
    height: int = 1080,
) -> None:
    accent_rgb = _hex(accent)
    img = _vertical_gradient(width, height, _hex("#0b1020"), _hex("#161f38"))
    draw = ImageDraw.Draw(img)
    cx = width // 2

    f_kicker = _font(FONT_BOLD, 34)
    f_title = _font(FONT_BOLD, 104)
    f_sub = _font(FONT_REG, 46)
    f_foot = _font(FONT_BOLD, 40)

    # Measure the stacked block to vertically center it.
    gap = 28
    blocks: list[tuple[str, ImageFont.FreeTypeFont, tuple, int, int]] = []
    if kicker:
        blocks.append((kicker.upper(), f_kicker, accent_rgb, 8, 18))
    blocks.append((title, f_title, _hex("#ffffff"), 0, 22))
    if subtitle:
        blocks.append((subtitle, f_sub, _hex("#aab4cc"), 0, 16))

    def line_h(font: ImageFont.FreeTypeFont) -> int:
        a, d = font.getmetrics()
        return a + d

    foot_h = (line_h(f_foot) + 36) if footer else 0
    total_h = sum(line_h(b[1]) + b[4] for b in blocks) - (blocks[-1][4] if blocks else 0)
    total_h += (foot_h + 40) if footer else 0

    y = (height - total_h) // 2
    for i, (text, font, fill, tracking, after) in enumerate(blocks):
        h = _draw_centered(draw, cx, y, text, font, fill, tracking)
        y += h + after
        # Accent underline spanning the kicker width, set clearly below it.
        if i == 0 and kicker:
            uw = _text_w(draw, text, font, tracking)
            uy = y - after + 8
            draw.rectangle([cx - uw // 2, uy, cx + uw // 2, uy + 4], fill=accent_rgb)

    # Footer pill (e.g. a URL / CTA).
    if footer:
        y += 24
        pad_x, pad_y = 40, 20
        tw = int(draw.textlength(footer, font=f_foot))
        a, d = f_foot.getmetrics()
        th = a + d
        pill_w = tw + pad_x * 2
        pill_h = th + pad_y * 2
        x0 = cx - pill_w // 2
        radius = pill_h // 2
        draw.rounded_rectangle([x0, y, x0 + pill_w, y + pill_h], radius=radius, fill=accent_rgb)
        draw.text((cx - tw / 2, y + pad_y), footer, font=f_foot, fill=_hex("#ffffff"))

    img.save(out_png)


def png_to_clip(png: Path, out_mp4: Path, duration: float, fps: int = 24) -> None:
    """Loop a still PNG into an H.264 clip with a silent stereo track."""
    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-framerate", str(fps), "-t", f"{duration:.3f}", "-i", str(png),
        "-f", "lavfi", "-t", f"{duration:.3f}", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p", "-r", str(fps),
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        "-shortest", "-movflags", "+faststart",
        str(out_mp4),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def main() -> None:
    ap = argparse.ArgumentParser(description="Render a title/outro card as an MP4 clip")
    ap.add_argument("--out", type=Path, required=True, help="Output .mp4 path")
    ap.add_argument("--title", type=str, required=True)
    ap.add_argument("--kicker", type=str, default="")
    ap.add_argument("--subtitle", type=str, default="")
    ap.add_argument("--footer", type=str, default="")
    ap.add_argument("--accent", type=str, default="#0066ff")
    ap.add_argument("--duration", type=float, default=2.5)
    ap.add_argument("--width", type=int, default=1920)
    ap.add_argument("--height", type=int, default=1080)
    args = ap.parse_args()

    if not Path(FONT_BOLD).exists():
        sys.exit(f"font not found: {FONT_BOLD}")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        png = Path(tmp) / "card.png"
        render_png(
            png, title=args.title, kicker=args.kicker, subtitle=args.subtitle,
            footer=args.footer, accent=args.accent, width=args.width, height=args.height,
        )
        png_to_clip(png, args.out, args.duration)
    size_kb = args.out.stat().st_size / 1024
    print(f"title card → {args.out} ({size_kb:.1f} KB, {args.duration:.1f}s)")


if __name__ == "__main__":
    main()
