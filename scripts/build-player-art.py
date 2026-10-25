"""将统一人物图集切分为3:4大图、响应式缩图和专用方形头像。"""

import hashlib
import json
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'output/imagegen/2026-10-24-player-art'
DESTINATION = ROOT / 'public/art/players'


def write_webp(image, name, quality=89):
    """文件名包含内容摘要，使浏览器不会把旧人物头像缓存到新图片上。"""
    buffer = BytesIO()
    image.save(buffer, format='WEBP', quality=quality, method=6)
    content = buffer.getvalue()
    filename = f'{name}-{hashlib.sha256(content).hexdigest()[:10]}.webp'
    (DESTINATION / filename).write_bytes(content)
    return f'/art/players/{filename}'


def build_player_art():
    """全部输入及头像裁切通过边界校验后才输出；角色和头像共用同一源图。"""
    config = json.loads((SOURCE / 'manifest.json').read_text())
    people = json.loads((SOURCE / 'subjects.json').read_text())
    portraits = {}
    for sheet in config['sheets']:
        with Image.open(SOURCE / sheet['sheet']) as image:
            if image.size != (1152, 1536):
                raise ValueError(f"{sheet['sheet']} 需要1152×1536，实际{image.size}")
            image = image.convert('RGB')
            for index, item_id in enumerate(sheet['ids']):
                x, y = index % 2 * 576, index // 2 * 768
                portraits[item_id] = image.crop((x, y, x + 576, y + 768))
    if set(portraits) != set(people):
        raise ValueError('人物清单与切片必须一一对应')
    crop_boxes = {}
    for item_id in portraits:
        box = config.get('avatarCrops', {}).get(item_id, config['avatarCrop'])
        x1, y1, x2, y2 = box
        if not (0 <= x1 < x2 <= 576 and 0 <= y1 < y2 <= 768 and x2 - x1 == y2 - y1):
            raise ValueError(f'{item_id}头像必须是原图范围内的正方形')
        crop_boxes[item_id] = tuple(box)

    DESTINATION.mkdir(parents=True, exist_ok=True)
    assets = {}
    contact = Image.new('RGB', (6 * 192, 4 * 310), '#f5edda')
    draw = ImageDraw.Draw(contact)
    avatar_contact = Image.new('RGB', (6 * 156, 4 * 182), '#f5edda')
    avatar_draw = ImageDraw.Draw(avatar_contact)
    for index, (item_id, image) in enumerate(portraits.items()):
        avatar = image.crop(crop_boxes[item_id]).resize((240, 240), Image.Resampling.LANCZOS)
        assets[item_id] = {
            'id': item_id, 'label': people[item_id]['name'], 'type': 'character', 'transparent': False,
            'width': 576, 'height': 768, 'src': write_webp(image, f'{item_id}-576'),
            'sources': [{'src': write_webp(image.resize((288, 384), Image.Resampling.LANCZOS), f'{item_id}-288', 85), 'width': 288}],
            'avatar': write_webp(avatar, f'{item_id}-avatar-240'),
            'avatarSmall': write_webp(avatar.resize((96, 96), Image.Resampling.LANCZOS), f'{item_id}-avatar-96', 86),
        }
        x, y = index % 6 * 192 + 8, index // 6 * 310 + 8
        contact.paste(image.resize((174, 232), Image.Resampling.LANCZOS), (x, y))
        draw.text((x, y + 240), item_id, fill='#294236')
        x, y = index % 6 * 156 + 8, index // 6 * 182 + 8
        avatar_contact.paste(avatar.resize((140, 140), Image.Resampling.LANCZOS), (x, y))
        avatar_draw.text((x, y + 146), item_id, fill='#294236')
    (ROOT / 'src/player-art-manifest.json').write_text(json.dumps(assets, ensure_ascii=False, indent=2) + '\n')
    contact.save(SOURCE / 'contact-portraits.jpg', quality=92)
    avatar_contact.save(SOURCE / 'contact-avatars.jpg', quality=92)
    print(json.dumps({'characters': len(assets), 'portraits': '576x768 / 288x384', 'avatars': '240x240 / 96x96', 'active_bytes': sum((ROOT / 'public' / asset[key].lstrip('/')).stat().st_size for asset in assets.values() for key in ['src', 'avatar', 'avatarSmall']) + sum((ROOT / 'public' / asset['sources'][0]['src'].lstrip('/')).stat().st_size for asset in assets.values())}))


if __name__ == '__main__':
    build_player_art()
