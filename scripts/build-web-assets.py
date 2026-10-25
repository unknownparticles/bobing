"""从现有骰碗图标生成网页兼容图标与分享封面；不改动原始图标。"""

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PAPER = '#f3eddb'
INK = '#293c32'
RED = '#ad432f'
JADE = '#3e634b'
MUTED = '#776e59'


def load_font(explicit_path, candidates, size):
    """加载支持中文的字体；缺失时给出修复方式，避免生成方框字。"""
    paths = [Path(explicit_path)] if explicit_path else [Path(path) for path in candidates]
    for path in paths:
        if path.is_file():
            return ImageFont.truetype(str(path), size)
    raise FileNotFoundError('找不到中文字体，请用 --title-font 和 --body-font 指定本机字体文件。')


def draw_text(draw, position, text, font, fill):
    """以实际字形顶部定位，避免不同字体的上方留白改变排版。"""
    left, top, _, _ = draw.textbbox((0, 0), text, font=font)
    draw.text((position[0] - left, position[1] - top), text, font=font, fill=fill)


def build_icons(icon):
    """输出浏览器常用 PNG 和多尺寸 ICO，小尺寸从原图直接缩制。"""
    for size in (16, 32):
        icon.resize((size, size), Image.Resampling.LANCZOS).save(ROOT / f'public/icons/favicon-{size}.png')
    icon.save(ROOT / 'public/favicon.ico', sizes=[(size, size) for size in (16, 32, 48, 64)])


def build_share_cover(icon, title_font, body_font):
    """输出不依赖浏览器或远程服务的 1200×630 分享封面。"""
    title = load_font(title_font, [
        '/System/Library/Fonts/Supplemental/Songti.ttc',
        '/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc',
    ], 78)
    body_paths = [
        '/System/Library/Fonts/Hiragino Sans GB.ttc',
        '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
    ]
    body = load_font(body_font, body_paths, 26)
    small = load_font(body_font, body_paths, 21)
    seal = load_font(title_font, [
        '/System/Library/Fonts/Supplemental/Songti.ttc',
        '/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc',
    ], 35)

    cover = Image.new('RGBA', (1200, 630), PAPER)
    draw = ImageDraw.Draw(cover)
    draw.rounded_rectangle((24, 24, 1175, 605), radius=22, outline='#c9b995', width=2)
    draw.rounded_rectangle((33, 33, 1166, 596), radius=17, outline='#ded2b9', width=1)
    # 淡月环衬托现有图标，让封面在列表缩略图中仍有清楚的主体。
    draw.ellipse((754, 102, 1144, 492), fill='#e9e5ce', outline='#d5c9a7', width=2)
    draw.arc((738, 86, 1160, 508), 205, 335, fill='#d5c9a7', width=2)
    draw.rounded_rectangle((80, 76, 132, 128), radius=5, fill=RED)
    draw_text(draw, (88, 85), '博', seal, '#fff9e9')
    draw_text(draw, (148, 94), '闽南 · 中秋 · 好彩头', small, MUTED)
    draw_text(draw, (80, 190), '今晚谁是状元', title, RED)
    draw_text(draw, (84, 304), '六颗骰子，围坐一桌争状元。', body, INK)
    draw_text(draw, (84, 352), '接住好运，也接住同桌的妙招。', small, MUTED)
    cover.alpha_composite(icon.resize((310, 310), Image.Resampling.LANCZOS), (794, 142))

    for x, label in [(84, '故事晋级'), (260, '双人快局'), (436, '经典博饼')]:
        draw.rounded_rectangle((x, 441, x + 152, 492), radius=7, fill='#fff9e9', outline='#c9b995', width=1)
        draw_text(draw, (x + 33, 456), label, small, JADE)
    draw.line((84, 536, 1114, 536), fill='#d5c9a7', width=1)
    draw_text(draw, (84, 556), '月圆人齐，随时开一桌。', small, MUTED)
    draw_text(draw, (883, 556), '今晚，轮到你了。', small, JADE)
    output = ROOT / 'public/social/bobing-share.png'
    output.parent.mkdir(parents=True, exist_ok=True)
    cover.convert('RGB').save(output, optimize=True)


def main():
    """允许替换中文字体；字体与源图准备好后再写入全部派生资源。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--title-font', help='标题中文字体文件路径')
    parser.add_argument('--body-font', help='正文中文字体文件路径')
    args = parser.parse_args()
    with Image.open(ROOT / 'public/icons/pwa-512.png') as source:
        icon = source.convert('RGBA')
    build_share_cover(icon, args.title_font, args.body_font)
    build_icons(icon)
    print('已生成 favicon.ico、16/32px PNG 和 1200×630 分享封面。')


if __name__ == '__main__':
    main()
