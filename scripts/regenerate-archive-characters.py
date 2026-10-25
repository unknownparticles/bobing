#!/usr/bin/env python3
"""Regenerate the archive character portraits for the department and company story chapters."""

from __future__ import annotations

import argparse
import base64
import json
import shutil
import sys
import urllib.error
import urllib.request
from datetime import datetime
from io import BytesIO
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SUBJECTS_PATH = ROOT / "output" / "imagegen" / "2026-10-24-archive-art" / "subjects.json"
ATLAS_PROMPT_PATH = ROOT / "output" / "imagegen" / "2026-10-24-archive-art" / "prompts" / "characters-1.txt"
DESTINATION = ROOT / "public" / "art" / "archive" / "characters"
DEFAULT_OUTPUT = ROOT / "output" / "imagegen" / "archive-character-regeneration"

# 部门章与公司章出场的全部人物；乔经理与陆会计跨章复用同一张立绘。
DEPARTMENT_AND_COMPANY = [
    "tang", "lu", "qiao", "xu", "ye", "liang", "fei",
    "zhou", "su", "gu", "xuguan", "yan", "an", "shen",
]
GROUP_TABLE = ["jie"]

STYLE_PREFIX = """Style: refined warm contemporary Chinese folk game illustration, clear ink-green outlines, hand-painted gouache shading, subtle ivory rice-paper texture, celadon green, cinnabar red and restrained antique gold. Warm top-left light, elegant coherent shapes and readable silhouettes at small size. Original art, no copied logos. No text, no letters, no Chinese characters, no numerals, no pseudo-writing, no UI, no prices, no watermark. Paperwork, flags and plaques completely blank. Dice pips allowed.

CHARACTERS ARE MODERN OFFICE COWORKERS, contemporary clothing, not deities or historical costumes. Each portrait shows the complete hairstyle and entire upper body down to hips, both hands and personal props fully inside the frame. Friendly original faces, consistent adult proportions, relaxed front/three-quarter pose. Plain softly illuminated ivory background with faint celadon circle and subtle cloud texture. Do not add names or badges with text. Follow the specified gender; do not invent extra people."""

COMPOSITION_SUFFIX = """Draw exactly one single-person portrait of the character described above, centered, entire upper body down to the hips, both hands and any held prop fully visible, with at least 10% empty margin on all four sides. Nothing cropped: no cut heads, hair, hands or props. Background stays the plain softly illuminated ivory paper with the faint celadon circle and subtle cloud texture. Do not draw a grid, multiple people, frames, labels or borders."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--key-file", type=Path)
    parser.add_argument("--base-url", default="https://api.openai-next.com/v1")
    parser.add_argument("--model", default="gpt-image-2")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--reuse-raw", type=Path, help="Reuse PNG files from this directory instead of calling the API")
    parser.add_argument("--ids", nargs="*", default=DEPARTMENT_AND_COMPANY + GROUP_TABLE)
    parser.add_argument("--quality", default="high", choices=("low", "medium", "high", "auto"))
    return parser.parse_args()


def request_image(base_url: str, api_key: str, model: str, quality: str, prompt: str) -> bytes:
    payload = json.dumps({
        "model": model,
        "prompt": prompt,
        "size": "1024x1536",
        "quality": quality,
        "output_format": "png",
    }, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        f"{base_url.rstrip('/')}/images/generations",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "curl/8.7.1",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=600) as response:
            result = json.load(response)
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Image API returned HTTP {error.code}: {detail}") from error

    image = result.get("data", [{}])[0]
    if image.get("b64_json"):
        return base64.b64decode(image["b64_json"])
    if image.get("url"):
        with urllib.request.urlopen(image["url"], timeout=180) as response:
            return response.read()
    raise RuntimeError(f"Image API returned no image payload: {json.dumps(result, ensure_ascii=False)[:1000]}")


def normalize_portrait(content: bytes) -> Image.Image:
    """按 3:4 居中裁切并缩放到图鉴立绘尺寸，保留原暖底色调。"""
    with Image.open(BytesIO(content)) as source:
        image = source.convert("RGB")
    target_ratio = 3 / 4
    if image.width / image.height > target_ratio:
        crop_width = round(image.height * target_ratio)
        offset = (image.width - crop_width) // 2
        image = image.crop((offset, 0, offset + crop_width, image.height))
    else:
        crop_height = round(image.width / target_ratio)
        offset = (image.height - crop_height) // 2
        image = image.crop((0, offset, image.width, offset + crop_height))
    return image.resize((576, 768), Image.Resampling.LANCZOS)


def build_prompt(subject: str) -> str:
    return f"{STYLE_PREFIX}\n\nSUBJECT: {subject}\n\n{COMPOSITION_SUFFIX}"


def main() -> int:
    args = parse_args()
    args.output_dir = args.output_dir.resolve()
    if args.reuse_raw:
        args.reuse_raw = args.reuse_raw.resolve()
        api_key = ""
    elif args.key_file:
        api_key = args.key_file.read_text().strip()
        if not api_key:
            raise ValueError(f"API key file is empty: {args.key_file}")
    else:
        raise ValueError("--key-file is required unless --reuse-raw is used")

    subjects = json.loads(SUBJECTS_PATH.read_text())["characters"]
    missing = [character_id for character_id in args.ids if character_id not in subjects]
    if missing:
        raise ValueError(f"subjects.json 缺少人物描述: {', '.join(missing)}")

    run_dir = args.output_dir / datetime.now().strftime("%Y%m%d-%H%M%S")
    raw_dir = run_dir / "raw"
    backup_dir = run_dir / "previous"
    raw_dir.mkdir(parents=True, exist_ok=True)
    DESTINATION.mkdir(parents=True, exist_ok=True)

    report = {"model": args.model, "size": "1024x1536", "quality": args.quality, "characters": []}
    for index, character_id in enumerate(args.ids, start=1):
        print(f"[{index}/{len(args.ids)}] {'Reprocessing' if args.reuse_raw else 'Generating'} {character_id}...", flush=True)
        if args.reuse_raw:
            content = (args.reuse_raw / f"{character_id}.png").read_bytes()
        else:
            content = request_image(args.base_url, api_key, args.model, args.quality, build_prompt(subjects[character_id]))
        raw_path = raw_dir / f"{character_id}.png"
        raw_path.write_bytes(content)

        target = DESTINATION / f"{character_id}.webp"
        if target.exists():
            backup_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy2(target, backup_dir / target.name)

        normalize_portrait(content).save(target, "WEBP", quality=87, method=6)
        report["characters"].append({
            "id": character_id,
            "subject": subjects[character_id],
            "raw": str(raw_path.relative_to(ROOT)),
            "archive": str(target.relative_to(ROOT)),
        })
        print(f"    Saved {target.relative_to(ROOT)}", flush=True)

    (run_dir / "manifest.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(f"Generation report: {run_dir.relative_to(ROOT) / 'manifest.json'}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, RuntimeError) as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1)
