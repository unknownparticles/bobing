# 商店插画与纸纹

当前活动插画已扩展到 `full/` 下的完整 56 张，统一为 512×288（16:9），由 `src/ui/shop-art-manifest.json` 索引。此前八张参考图切片保留为来源记录；当前页面使用完整坐像和独立场景，不再依赖旧切片裁切。整库源图、提示词、比例测量及修正记录见 `output/imagegen/2026-10-24-full-shop/`。

来源：用户提供的 API 服务生成、并确认采用的 `output/imagegen/2026-10-24-paper-ui/shop-concept-v1.png` 与 `game-concept-v1.png`。模型 `gpt-image-2`，通过 imagegen CLI 调用；提示词保留在同目录的 `prompts/` 中。

八张插画使用 Pillow 从参考图拆分并压缩为 WebP，页面按商品 ID 引用。图中卡名、价格和按钮未进入切片；厕所门牌的生成错字已在本地修正为“暂离”。其余商品沿用已有 SVG，不借用含义不同的插画。

| ID | 插画 |
| --- | --- |
| wealth | 财神进宝 |
| matchmaker | 月老牵线 |
| steal | 顺手牵羊 |
| toilet | 厕所卡 |
| miracle | 大力出奇迹 |
| seven_dice | 七星高照 |
| eight_dice | 八仙过海 |
| shuffle | 乾坤换席 |

`rice-paper.webp` 是从已确认对局图裁出的纸纹。`cloud-line.svg` 是可缩放的云纹装饰，由代码绘制。

所有密钥均从用户指定的本地文件在调用时读取，未保存到此目录或客户端。
