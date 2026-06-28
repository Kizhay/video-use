"""Build a natural-case, sentence-chunked SRT from word-level transcripts + EDL.

Unlike render.py's built-in `--build-subtitles` (2-word UPPERCASE chunks, tuned
for vertical Reels), this produces readable horizontal-video captions:

  * chunks break on sentence punctuation, max chars, max duration, or a long gap
  * original case preserved (no shouting UPPERCASE)
  * optional corrections map fixes recognition errors / brand terms
  * output-timeline offsets computed across EDL ranges, so cut segments AND
    title-card ranges (which have no transcript) shift captions correctly

Output times are on the FINAL timeline, ready for the `subtitles` filter.

Usage:
    python helpers/build_subs.py --edl edit/edl.json -o edit/master.srt
    python helpers/build_subs.py --edl edit/edl.json --corrections edit/sub_fixes.json
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


def srt_timestamp(seconds: float) -> str:
    total_ms = int(round(seconds * 1000))
    h, rem = divmod(total_ms, 3600_000)
    m, rem = divmod(rem, 60_000)
    s, ms = divmod(rem, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def words_in_range(transcript: dict, t_start: float, t_end: float) -> list[dict]:
    out: list[dict] = []
    for w in transcript.get("words", []):
        if w.get("type") != "word":
            continue
        ws, we = w.get("start"), w.get("end")
        if ws is None or we is None:
            continue
        if we <= t_start or ws >= t_end:
            continue
        out.append(w)
    return out


SENT_END = set(".!?…")


def chunk_words(
    words: list[dict],
    max_chars: int,
    max_dur: float,
    max_gap: float,
) -> list[list[dict]]:
    chunks: list[list[dict]] = []
    cur: list[dict] = []

    def cur_len() -> int:
        return len(" ".join((w.get("text") or "").strip() for w in cur))

    for i, w in enumerate(words):
        text = (w.get("text") or "").strip()
        if not text:
            continue
        cur.append(w)
        ends_sentence = text[-1] in SENT_END
        too_long = cur_len() >= max_chars
        dur = (cur[-1].get("end", 0.0) - cur[0].get("start", 0.0))
        too_far = dur >= max_dur
        gap_next = False
        if i + 1 < len(words):
            nxt_start = words[i + 1].get("start")
            if nxt_start is not None and w.get("end") is not None:
                gap_next = (nxt_start - w["end"]) >= max_gap
        if ends_sentence or too_long or too_far or gap_next:
            chunks.append(cur)
            cur = []
    if cur:
        chunks.append(cur)
    return chunks


def apply_corrections(text: str, corrections: dict[str, str]) -> str:
    for wrong, right in corrections.items():
        # whole-word, case-insensitive; keep it simple and predictable
        text = re.sub(rf"(?<![\w]){re.escape(wrong)}(?![\w])", right, text, flags=re.IGNORECASE | re.UNICODE)
    return text


def build(
    edl: dict,
    edit_dir: Path,
    corrections: dict[str, str],
    max_chars: int,
    max_dur: float,
    max_gap: float,
) -> list[tuple[float, float, str]]:
    transcripts_dir = edit_dir / "transcripts"
    entries: list[tuple[float, float, str]] = []
    seg_offset = 0.0

    for r in edl["ranges"]:
        src_name = r["source"]
        seg_start = float(r["start"])
        seg_end = float(r["end"])
        seg_duration = seg_end - seg_start

        tr_path = transcripts_dir / f"{src_name}.json"
        if not tr_path.exists():
            # title cards etc. — no captions, just shift the timeline
            seg_offset += seg_duration
            continue

        transcript = json.loads(tr_path.read_text())
        seg_words = words_in_range(transcript, seg_start, seg_end)
        for chunk in chunk_words(seg_words, max_chars, max_dur, max_gap):
            local_start = max(seg_start, chunk[0].get("start", seg_start))
            local_end = min(seg_end, chunk[-1].get("end", seg_end))
            out_start = max(0.0, local_start - seg_start) + seg_offset
            out_end = max(0.0, local_end - seg_start) + seg_offset
            if out_end <= out_start:
                out_end = out_start + 0.5
            text = " ".join((w.get("text") or "").strip() for w in chunk)
            text = re.sub(r"\s+([,.!?;:])", r"\1", text)
            text = re.sub(r"\s+", " ", text).strip()
            if corrections:
                text = apply_corrections(text, corrections)
            entries.append((out_start, out_end, text))
        seg_offset += seg_duration

    entries.sort(key=lambda e: e[0])
    return entries


def write_srt(entries: list[tuple[float, float, str]], out_path: Path) -> None:
    lines: list[str] = []
    for i, (a, b, text) in enumerate(entries, 1):
        lines.append(str(i))
        lines.append(f"{srt_timestamp(a)} --> {srt_timestamp(b)}")
        lines.append(text)
        lines.append("")
    out_path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(description="Build natural-case SRT from transcripts + EDL")
    ap.add_argument("--edl", type=Path, required=True)
    ap.add_argument("-o", "--output", type=Path, default=None)
    ap.add_argument("--corrections", type=Path, default=None, help="JSON {wrong: right}")
    ap.add_argument("--max-chars", type=int, default=42)
    ap.add_argument("--max-dur", type=float, default=4.0)
    ap.add_argument("--max-gap", type=float, default=0.8)
    args = ap.parse_args()

    edl = json.loads(args.edl.resolve().read_text())
    edit_dir = args.edl.resolve().parent
    out_path = args.output or (edit_dir / "master.srt")
    corrections: dict[str, str] = {}
    if args.corrections and args.corrections.exists():
        corrections = json.loads(args.corrections.read_text())

    entries = build(edl, edit_dir, corrections, args.max_chars, args.max_dur, args.max_gap)
    write_srt(entries, out_path)
    print(f"subtitles → {out_path}  ({len(entries)} cues)")


if __name__ == "__main__":
    main()
