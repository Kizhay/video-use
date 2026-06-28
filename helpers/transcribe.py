"""Transcribe a video, word-level, into Scribe-compatible JSON.

Two engines, same output shape (so the rest of the pipeline — pack_transcripts,
render's SRT builder — does not care which one ran):

  * "whisper" (DEFAULT) — local faster-whisper. Free, offline, no API key.
    Model weights download once on first run, then cached under ~/.cache.
  * "scribe" — hosted ElevenLabs Scribe. Needs ELEVENLABS_API_KEY. Better
    filler/diarization handling; use it if you have a key.

Engine resolution order: --engine flag > VIDEO_USE_ENGINE env > "whisper".

Extracts mono 16kHz audio via ffmpeg, transcribes with word-level timestamps,
writes the full response to <edit_dir>/transcripts/<video_stem>.json.

Cached: if the output file already exists, transcription is skipped.

Usage:
    python helpers/transcribe.py <video_path>
    python helpers/transcribe.py <video_path> --edit-dir /custom/edit
    python helpers/transcribe.py <video_path> --language ru
    python helpers/transcribe.py <video_path> --engine scribe --num-speakers 2
    python helpers/transcribe.py <video_path> --whisper-model medium
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path


SCRIBE_URL = "https://api.elevenlabs.io/v1/speech-to-text"

# Default local model. "small" is a good balance for talking-head clips incl.
# Russian. Bump to "medium" (slower, more accurate) via --whisper-model or the
# VIDEO_USE_WHISPER_MODEL env var if you want crisper text.
DEFAULT_WHISPER_MODEL = os.environ.get("VIDEO_USE_WHISPER_MODEL", "small")


def resolve_engine(explicit: str | None) -> str:
    """Pick transcription engine. flag > env > 'whisper'."""
    engine = (explicit or os.environ.get("VIDEO_USE_ENGINE") or "whisper").lower()
    if engine not in ("whisper", "scribe"):
        sys.exit(f"unknown engine '{engine}' (expected 'whisper' or 'scribe')")
    return engine


def load_api_key() -> str:
    for candidate in [Path(__file__).resolve().parent.parent / ".env", Path(".env")]:
        if candidate.exists():
            for line in candidate.read_text().splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                if k.strip() == "ELEVENLABS_API_KEY":
                    return v.strip().strip('"').strip("'")
    v = os.environ.get("ELEVENLABS_API_KEY", "")
    if not v:
        sys.exit("ELEVENLABS_API_KEY not found in .env or environment")
    return v


def extract_audio(video_path: Path, dest: Path) -> None:
    cmd = [
        "ffmpeg", "-y", "-i", str(video_path),
        "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le",
        str(dest),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


# -------- Engine: hosted ElevenLabs Scribe -----------------------------------


def call_scribe(
    audio_path: Path,
    api_key: str,
    language: str | None = None,
    num_speakers: int | None = None,
) -> dict:
    import requests

    data: dict[str, str] = {
        "model_id": "scribe_v1",
        "diarize": "true",
        "tag_audio_events": "true",
        "timestamps_granularity": "word",
    }
    if language:
        data["language_code"] = language
    if num_speakers:
        data["num_speakers"] = str(num_speakers)

    with open(audio_path, "rb") as f:
        resp = requests.post(
            SCRIBE_URL,
            headers={"xi-api-key": api_key},
            files={"file": (audio_path.name, f, "audio/wav")},
            data=data,
            timeout=1800,
        )

    if resp.status_code != 200:
        raise RuntimeError(f"Scribe returned {resp.status_code}: {resp.text[:500]}")

    return resp.json()


# -------- Engine: local faster-whisper ---------------------------------------


def call_whisper(
    audio_path: Path,
    language: str | None = None,
    model_size: str = DEFAULT_WHISPER_MODEL,
) -> dict:
    """Transcribe locally and emit a Scribe-shaped dict.

    Output dict mirrors the fields the downstream readers actually use:
      - top-level "language_code"
      - "words": list of {type, text, start, end, [speaker_id]}
        * type "word"  — a spoken token (text, start, end, speaker_id)
        * type "spacing" — the silent gap before the next word (carries the
          start/end the phrase-grouper uses to break lines)

    Whisper has no diarization, so every word is "speaker_0" (correct for a
    single talking head; multi-speaker clips just won't be split by speaker).
    """
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit(
            "faster-whisper is not installed. Run `uv sync` (or "
            "`pip install faster-whisper`) in the video-use repo, then retry."
        )

    # ctranslate2 has no Apple-GPU backend; CPU + int8 is the fast, reliable path.
    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    segments, info = model.transcribe(
        str(audio_path),
        language=language,
        word_timestamps=True,
        vad_filter=True,
    )

    words: list[dict] = []
    prev_end: float | None = None
    for seg in segments:
        for w in (seg.words or []):
            text = (w.word or "").strip()
            if not text:
                continue
            start = float(w.start)
            end = float(w.end)
            # Emit the silent gap before this word as a "spacing" token so the
            # phrase-grouper can break on it, exactly like Scribe does.
            if prev_end is not None and start > prev_end:
                words.append({
                    "text": " ",
                    "start": prev_end,
                    "end": start,
                    "type": "spacing",
                })
            words.append({
                "text": text,
                "start": start,
                "end": end,
                "type": "word",
                "speaker_id": "speaker_0",
                "logprob": float(getattr(w, "probability", 0.0) or 0.0),
            })
            prev_end = end

    full_text = "".join(
        (" " + w["text"]) if w["type"] == "word" else "" for w in words
    ).strip()

    return {
        "language_code": getattr(info, "language", None) or language,
        "language_probability": float(getattr(info, "language_probability", 0.0) or 0.0),
        "text": full_text,
        "words": words,
        "engine": "whisper",
        "model": model_size,
    }


# -------- Orchestration ------------------------------------------------------


def transcribe_one(
    video: Path,
    edit_dir: Path,
    api_key: str | None = None,
    language: str | None = None,
    num_speakers: int | None = None,
    engine: str = "whisper",
    whisper_model: str = DEFAULT_WHISPER_MODEL,
    verbose: bool = True,
) -> Path:
    """Transcribe a single video. Returns path to transcript JSON.

    Cached: returns existing path immediately if the transcript already exists.
    """
    transcripts_dir = edit_dir / "transcripts"
    transcripts_dir.mkdir(parents=True, exist_ok=True)
    out_path = transcripts_dir / f"{video.stem}.json"

    if out_path.exists():
        if verbose:
            print(f"cached: {out_path.name}")
        return out_path

    if verbose:
        print(f"  extracting audio from {video.name}", flush=True)

    t0 = time.time()
    with tempfile.TemporaryDirectory() as tmp:
        audio = Path(tmp) / f"{video.stem}.wav"
        extract_audio(video, audio)
        size_mb = audio.stat().st_size / (1024 * 1024)
        if engine == "scribe":
            if not api_key:
                api_key = load_api_key()
            if verbose:
                print(f"  uploading {video.stem}.wav ({size_mb:.1f} MB) → Scribe", flush=True)
            payload = call_scribe(audio, api_key, language, num_speakers)
        else:
            if verbose:
                print(
                    f"  transcribing {video.stem}.wav ({size_mb:.1f} MB) locally "
                    f"with whisper:{whisper_model}", flush=True
                )
            payload = call_whisper(audio, language, whisper_model)

    out_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
    dt = time.time() - t0

    if verbose:
        kb = out_path.stat().st_size / 1024
        print(f"  saved: {out_path.name} ({kb:.1f} KB) in {dt:.1f}s")
        if isinstance(payload, dict) and "words" in payload:
            print(f"    words: {len(payload['words'])}")

    return out_path


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Transcribe a video (local Whisper by default, Scribe optional)"
    )
    ap.add_argument("video", type=Path, help="Path to video file")
    ap.add_argument(
        "--edit-dir",
        type=Path,
        default=None,
        help="Edit output directory (default: <video_parent>/edit)",
    )
    ap.add_argument(
        "--engine",
        type=str,
        default=None,
        choices=["whisper", "scribe"],
        help="Transcription engine. Default: whisper (local, free). "
             "Override globally with VIDEO_USE_ENGINE.",
    )
    ap.add_argument(
        "--whisper-model",
        type=str,
        default=DEFAULT_WHISPER_MODEL,
        help="faster-whisper model size (tiny/base/small/medium/large-v3). "
             f"Default: {DEFAULT_WHISPER_MODEL}.",
    )
    ap.add_argument(
        "--language",
        type=str,
        default=None,
        help="Optional ISO language code (e.g., 'ru', 'en'). Omit to auto-detect.",
    )
    ap.add_argument(
        "--num-speakers",
        type=int,
        default=None,
        help="(Scribe only) number of speakers when known. Improves diarization.",
    )
    args = ap.parse_args()

    video = args.video.resolve()
    if not video.exists():
        sys.exit(f"video not found: {video}")

    edit_dir = (args.edit_dir or (video.parent / "edit")).resolve()
    engine = resolve_engine(args.engine)
    api_key = load_api_key() if engine == "scribe" else None

    transcribe_one(
        video=video,
        edit_dir=edit_dir,
        api_key=api_key,
        language=args.language,
        num_speakers=args.num_speakers,
        engine=engine,
        whisper_model=args.whisper_model,
    )


if __name__ == "__main__":
    main()
