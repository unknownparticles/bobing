"""从现有骰碗图标生成网页兼容图标；不改动原始图标。

分享封面 `public/social/bobing-share.png` 为插画成品，不再由本脚本生成；
重新生成或调整见 `output/imagegen/2026-10-24-cover/README.md`。
"""

import argparse
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]


def build_icons(icon):
    """输出浏览器常用 PNG 和多尺寸 ICO，小尺寸从原图直接缩制。"""
    for size in (16, 32):
        icon.resize((size, size), Image.Resampling.LANCZOS).save(ROOT / f'public/icons/favicon-{size}.png')
    icon.save(ROOT / 'public/favicon.ico', sizes=[(size, size) for size in (16, 32, 48, 64)])


def main():
    """从现有 512px 骰碗图标生成 favicon 与小尺寸 PNG。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args()
    with Image.open(ROOT / 'public/icons/pwa-512.png') as source:
        icon = source.convert('RGBA')
    build_icons(icon)
    print('已生成 favicon.ico 与 16/32px PNG；分享封面为插画成品，不随本脚本重新生成。')


if __name__ == '__main__':
    main()
