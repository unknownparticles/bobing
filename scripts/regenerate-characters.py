#!/usr/bin/env python3
"""Regenerate the seven in-game character portraits through an OpenAI-compatible image API."""

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
PROMPTS_PATH = ROOT / "docs" / "art-generation-prompts.md"
OFFICIAL_DIR = ROOT / "public" / "art" / "official"
DEFAULT_OUTPUT = ROOT / "output" / "imagegen" / "character-regeneration"

CHARACTERS = {
    "hero-a": ("01", "hero_a_idle.png"),
    "hero-b": ("02", "hero_b_idle.png"),
    "hero-c": ("03", "hero_c_idle.png"),
    "chen": ("04", "chen_idle.png"),
    "mei": ("05", "mei_idle.png"),
    "wu": ("06", "wu_idle.png"),
    "lin": ("07", "lin_idle.png"),
}

STYLE_SUFFIX = """

保持整套角色统一：精致现代像素游戏立绘，清晰硬边像素块，统一左上暖光，统一3.5至4头身比例，统一线条粗细和暖米白、朱红、墨绿、木棕、少量金色的综合色盘。人物必须是从头到脚完整可见的单人站姿，居中，四周留足透明空间，缩小到手机头像仍能看清脸部和轮廓。画面中绝对不要出现文字、标志、水印、边框、场景、地面、桌椅、骰子或其他人物。输出透明背景 PNG；不要棋盘格，不要把纯色背景画进图片。
""".strip()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--key-file", type=Path)
    parser.add_argument("--base-url", default="https://api.openai-next.com/v1")
    parser.add_argument("--model", default="gpt-image-2")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--reuse-raw", type=Path, help="Reuse PNG files from this directory instead of calling the API")
    parser.add_argument("--ids", nargs="+", choices=CHARACTERS, default=list(CHARACTERS))
    parser.add_argument("--quality", default="high", choices=("low", "medium", "high", "auto"))
    return parser.parse_args()


def extract_prompt(markdown: str, section: str, filename: str) -> str:
    heading = f"## {section} · {filename}"
    start = markdown.find(heading)
    if start < 0:
        raise ValueError(f"Prompt heading not found: {heading}")
    fence_start = markdown.find("```text", start)
    fence_end = markdown.find("```", fence_start + len("```text"))
    if fence_start < 0 or fence_end < 0:
        raise ValueError(f"Prompt block is incomplete: {heading}")
    prompt = markdown[fence_start + len("```text"):fence_end].strip()
    return f"{prompt}\n\n{STYLE_SUFFIX}"


def request_image(base_url: str, api_key: str, model: str, quality: str, prompt: str) -> bytes:
    payload = json.dumps({
        "model": model,
        "prompt": prompt,
        "size": "1024x1536",
        "quality": quality,
        "background": "transparent",
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
    with Image.open(BytesIO(content)) as source:
        image = source.convert("RGBA")

    # The image endpoint can leave nearly invisible pixels across the transparent
    # canvas. Clear those pixels before measuring the actual character bounds.
    alpha = image.getchannel("A")
    clean_alpha = alpha.point(lambda value: 0 if value <= 8 else value)
    image.putalpha(clean_alpha)
    bounds = clean_alpha.getbbox()
    if not bounds:
        raise ValueError("Generated portrait contains no visible pixels")

    image = image.crop(bounds)
    image.thumbnail((1000, 1430), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (1152, 1536), (0, 0, 0, 0))
    canvas.alpha_composite(image, ((canvas.width - image.width) // 2, (canvas.height - image.height) // 2))
    return canvas


def main() -> int:
    args = parse_args()
    if args.reuse_raw:
        api_key = ""
    elif args.key_file:
        api_key = args.key_file.read_text().strip()
        if not api_key:
            raise ValueError(f"API key file is empty: {args.key_file}")
    else:
        raise ValueError("--key-file is required unless --reuse-raw is used")

    markdown = PROMPTS_PATH.read_text()
    run_dir = args.output_dir / datetime.now().strftime("%Y%m%d-%H%M%S")
    raw_dir = run_dir / "raw"
    backup_dir = run_dir / "previous"
    raw_dir.mkdir(parents=True, exist_ok=True)
    OFFICIAL_DIR.mkdir(parents=True, exist_ok=True)

    report = {"model": args.model, "size": "1024x1536", "quality": args.quality, "characters": []}
    for index, character_id in enumerate(args.ids, start=1):
        section, filename = CHARACTERS[character_id]
        prompt = extract_prompt(markdown, section, filename)
        print(f"[{index}/{len(args.ids)}] {'Reprocessing' if args.reuse_raw else 'Generating'} {character_id}...", flush=True)
        if args.reuse_raw:
            source_path = args.reuse_raw / f"{character_id}.png"
            content = source_path.read_bytes()
        else:
            content = request_image(args.base_url, api_key, args.model, args.quality, prompt)
        raw_path = raw_dir / f"{character_id}.png"
        raw_path.write_bytes(content)

        target = OFFICIAL_DIR / f"{character_id}.webp"
        if target.exists():
            backup_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy2(target, backup_dir / target.name)

        portrait = normalize_portrait(content)
        portrait.save(target, "WEBP", quality=90, method=6, lossless=False)
        report["characters"].append({
            "id": character_id,
            "prompt_file": str(PROMPTS_PATH.relative_to(ROOT)),
            "raw": str(raw_path.relative_to(ROOT)),
            "official": str(target.relative_to(ROOT)),
            "source_size": list(Image.open(BytesIO(content)).size),
            "source_has_alpha": "A" in Image.open(BytesIO(content)).getbands(),
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
