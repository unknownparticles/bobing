"""从正式角色原图生成响应式 WebP 和尺寸清单；需要 Python 3 与 Pillow。"""

import hashlib
import json
from io import BytesIO
from pathlib import Path

from PIL import Image


def main():
    """按清单生成 384/768 宽图片，保留比例、透明度及全部原图。"""
    root = Path(__file__).resolve().parent.parent
    public = root / 'public'
    output = public / 'art' / 'responsive'
    output.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((root / 'src' / 'official-art.json').read_text())
    artwork = {}

    for asset in manifest:
        if asset['type'] != 'character':
            continue
        with Image.open(public / asset['src'].lstrip('/')) as original:
            sources = []
            for width in (384, 768):
                if width >= original.width:
                    continue
                height = round(original.height * width / original.width)
                resized = original.resize((width, height), Image.Resampling.LANCZOS)
                buffer = BytesIO()
                resized.save(buffer, format='WEBP', quality=85, method=6)
                content = buffer.getvalue()
                # 内容改变时 URL 也改变，避免浏览器继续使用旧缩略图缓存。
                digest = hashlib.sha256(content).hexdigest()[:12]
                filename = f"{asset['id']}-{width}-{digest}.webp"
                (output / filename).write_bytes(content)
                sources.append({'src': f'/art/responsive/{filename}', 'width': width})
            artwork[asset['id']] = {
                'width': original.width,
                'height': original.height,
                'sources': sources,
            }

    target = root / 'src' / 'art-variants.json'
    target.write_text(json.dumps(artwork, ensure_ascii=False, indent=2) + '\n')
    print(f'Generated responsive artwork for {len(artwork)} characters: {target}')


if __name__ == '__main__':
    main()
