# 项目封面图与分享封面

用户要求为项目生成封面图，并确认用于 README 顶部横幅，同时替换原先由脚本合成的链接分享封面。

## 生成配置

- 调用方式：imagegen 技能的 CLI（`scripts/image_gen.py`）。
- Base URL：`https://api.openai-next.com/v1`。
- 模型：`gpt-image-2`；质量：`high`；格式：PNG。
- 横幅请求尺寸 `2048x832`；分享封面请求尺寸 `1216x640`，生成后用 Pillow 等比缩至 `1200x630`。
- 密钥仅在运行时从用户桌面指定文件读取，不保存到项目。

完整提示词：[横幅](prompts/cover.txt)、[分享封面](prompts/share.txt)。

## 成品

| 文件 | 尺寸 | 用途 |
| --- | --- | --- |
| `bobing-cover.png` | 2048×832 | README 横幅原图 |
| `bobing-cover-web.webp` | 1600×650 | 网页副本，README 实际引用 |
| `bobing-share-src.png` | 1216×640 | 分享封面原图 |
| `../../public/social/bobing-share.png` | 1200×630 | 线上分享封面，`index.html` 的 og:image 指向不变 |

## 设计意图

两张图共用同一场景：红釉描金大骰碗、六颗跃起的玉色骰子（含一颗一点红、一颗四点红），中秋夜宴桌面摆月饼、茶盏、红包与奖品锦盒，桌边有人手扶碗；背景暖色宫灯、满月与虚化人群剪斑。横幅右侧保留暗色负空间，便于后续叠加标题。全图不含任何文字、水印或 logo，文字继续由 README 与页面绘制。

## 落地调整

- `scripts/build-web-assets.py` 不再生成分享封面，只保留 `favicon.ico` 与 16/32px PNG；README 与 `public/icons/README.md` 已同步说明。
- 分享封面改为插画成品后，重新运行图标脚本不会覆盖它。
