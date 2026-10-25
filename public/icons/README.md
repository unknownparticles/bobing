# 网页图标资源

所有图标沿用同一骰碗形象。

| 文件 | 尺寸 | 用途 |
| --- | --- | --- |
| `bobing-mark.svg` | 矢量 | 现代浏览器标签图标 |
| `favicon-16.png` | 16×16 | 小标签兼容图标 |
| `favicon-32.png` | 32×32 | 浏览器 PNG 图标 |
| `../favicon.ico` | 16/32/48/64 | 传统浏览器、收藏夹兼容 |
| `apple-touch-icon.png` | 180×180 | Apple 主屏幕图标 |
| `pwa-192.png` | 192×192 | PWA 安装图标 |
| `pwa-512.png` | 512×512 | PWA 安装图标、小图标与分享封面的源图 |
| `pwa-maskable-512.png` | 512×512 | Android 自适应图标，包含安全留白 |
| `../social/bobing-share.png` | 1200×630 | 链接分享封面（imagegen 插画，提示词见 `output/imagegen/2026-10-24-cover/`） |

在项目根目录运行 `python3 scripts/build-web-assets.py` 重新生成 ICO 与 16/32px PNG。需要 Pillow。分享封面为插画成品，不随该脚本重新生成。

网页图标使用 Vite BASE_URL，兼容根目录及 `/bobing/`。`index.html` 的 canonical、Open Graph 和 Twitter 图片使用 README 记录的 GitHub Pages 绝对地址；更换站点域名或部署目录时需要同步更新。
