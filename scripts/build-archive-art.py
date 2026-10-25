"""切分图鉴和成就图集，生成网页素材及独立映射；不会修改成就或发现记录。"""

import json
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'output/imagegen/2026-10-24-archive-art'
DESTINATION = ROOT / 'public/art/archive'


def build_archive_art():
    """先核对全部图集，再按固定坐标完整切片，避免失败时只更新半批图片。"""
    config = json.loads((SOURCE / 'manifest.json').read_text())
    sheets = config['sheets']
    images = {}
    for sheet in sheets:
        with Image.open(SOURCE / sheet['sheet']) as image:
            expected = (sheet['tile_width'] * 2, sheet['tile_height'] * 2)
            if image.size != expected:
                raise ValueError(f"{sheet['sheet']} 尺寸 {image.size}，需要 {expected}")
            images[sheet['sheet']] = image.convert('RGB')

    character_ids = {item_id for sheet in sheets if sheet['group'] == 'characters' for item_id in sheet['ids']}
    if not set(config['characterAliases'].values()).issubset(character_ids):
        raise ValueError('角色别名必须对应已生成的人物')
    corrections = {}
    for item_id, filename in config.get('corrections', {}).items():
        with Image.open(SOURCE / filename) as image:
            if image.width * 9 != image.height * 16:
                raise ValueError(f'{filename} 需要保持16:9')
            corrections[item_id] = image.convert('RGB').resize((768, 432), Image.Resampling.LANCZOS)

    assets = {'cards': {}, 'achievements': {}, 'characters': {}}
    contacts = {}
    for sheet in sheets:
        group = sheet['group']
        folder = DESTINATION / group
        folder.mkdir(parents=True, exist_ok=True)
        for index, item_id in enumerate(sheet['ids']):
            x = index % 2 * sheet['tile_width']
            y = index // 2 * sheet['tile_height']
            tile = images[sheet['sheet']].crop((x, y, x + sheet['tile_width'], y + sheet['tile_height']))
            if group == 'cards' and item_id in corrections:
                tile = corrections[item_id]
            tile.save(folder / f'{item_id}.webp', quality=87, method=6)
            assets[group][item_id] = f'art/archive/{group}/{item_id}.webp'
            contacts.setdefault(group, []).append((item_id, tile))

    # 同一位同事在不同章节的称呼可以变化，但沿用同一张人物立绘。
    characters = assets['characters']
    assets['characters'] = {alias: characters[person] for alias, person in config['characterAliases'].items()}
    (ROOT / 'src/ui/archive-art-manifest.json').write_text(json.dumps(assets, ensure_ascii=False, indent=2) + '\n')

    for group, entries in contacts.items():
        portrait = group == 'characters'
        thumb_size = (168, 224) if portrait else (288, 162)
        cell_width, cell_height = thumb_size[0] + 16, thumb_size[1] + 34
        columns = 5 if portrait else 4
        contact = Image.new('RGB', (columns * cell_width, ((len(entries) + columns - 1) // columns) * cell_height), '#f5ecd9')
        draw = ImageDraw.Draw(contact)
        for index, (item_id, tile) in enumerate(entries):
            preview = tile.resize(thumb_size, Image.Resampling.LANCZOS)
            x, y = index % columns * cell_width + 8, index // columns * cell_height + 8
            contact.paste(preview, (x, y))
            draw.text((x, y + thumb_size[1] + 7), item_id, fill='#294236')
        contact.save(SOURCE / f'contact-{group}.jpg', quality=91)
    print(json.dumps({'cards': len(assets['cards']), 'achievements': len(assets['achievements']), 'character_aliases': len(assets['characters']), 'bytes': sum(path.stat().st_size for path in DESTINATION.rglob('*.webp'))}))


if __name__ == '__main__':
    build_archive_art()
