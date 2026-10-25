"""将已核对的 16:9 图集按清单切成卡牌 WebP，并生成前端素材索引。"""

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'output/imagegen/2026-10-24-full-shop'
DESTINATION = ROOT / 'public/art/shop/full'


def build_artwork():
    """要求所有图集尺寸正确后才写入；每张图保留完整单元格，不二次裁切主体。"""
    sheets = json.loads((SOURCE / 'manifest.json').read_text())
    # 先验证整批，避免图集缺失或尺寸错误时只更新半套素材。
    for sheet in sheets:
        expected = (sheet['columns'] * sheet['tile_width'], sheet['rows'] * sheet['tile_height'])
        with Image.open(SOURCE / sheet['sheet']) as image:
            if image.size != expected:
                raise ValueError(f"{sheet['sheet']} 尺寸 {image.size}，需要 {expected}")

    # 纠正图也必须在写入前校验，避免失败时将已修正素材覆盖回旧候选图。
    overrides = json.loads((SOURCE / 'overrides.json').read_text())
    corrections = {}
    for item_id, filename in overrides.items():
        with Image.open(SOURCE / filename) as image:
            if image.width * 9 != image.height * 16:
                raise ValueError(f'{filename} 需要保持 16:9')
            corrections[item_id] = image.convert('RGB').resize((512, 288), Image.Resampling.LANCZOS)

    DESTINATION.mkdir(parents=True, exist_ok=True)
    assets = {}
    contacts = []
    for sheet in sheets:
        image = Image.open(SOURCE / sheet['sheet']).convert('RGB')
        for index, item_id in enumerate(sheet['ids']):
            left = index % sheet['columns'] * sheet['tile_width']
            top = index // sheet['columns'] * sheet['tile_height']
            tile = image.crop((left, top, left + sheet['tile_width'], top + sheet['tile_height']))
            tile.save(DESTINATION / f'{item_id}.webp', quality=88, method=6)
            assets[item_id] = f'art/shop/full/{item_id}.webp'
            contacts.append((item_id, tile))

    # 数量要求明确的场地牌单独生成并核对，替换图集中误画数量的候选图。
    for item_id, tile in corrections.items():
        tile.save(DESTINATION / f'{item_id}.webp', quality=88, method=6)
        contacts = [(name, tile if name == item_id else art) for name, art in contacts]

    (ROOT / 'src/ui/shop-art-manifest.json').write_text(json.dumps(assets, indent=2) + '\n')
    # 联系表按最终切片显示，方便检查图与 ID 对应以及神明头饰、手部是否完整。
    for offset in range(0, len(contacts), 16):
        batch = contacts[offset:offset + 16]
        contact = Image.new('RGB', (1152, ((len(batch) + 3) // 4) * 188), '#f6eddb')
        draw = ImageDraw.Draw(contact)
        font = ImageFont.load_default()
        for index, (item_id, tile) in enumerate(batch):
            preview = tile.resize((272, 153), Image.Resampling.LANCZOS)
            x, y = index % 4 * 288 + 8, index // 4 * 188 + 8
            contact.paste(preview, (x, y))
            draw.text((x, y + 158), item_id, font=font, fill='#294236')
        contact.save(SOURCE / f'contact-{offset // 16 + 1}.jpg', quality=90)

    print(json.dumps({'assets': len(assets), 'dimensions': [512, 288], 'bytes': sum(path.stat().st_size for path in DESTINATION.glob('*.webp'))}))


if __name__ == '__main__':
    build_artwork()
