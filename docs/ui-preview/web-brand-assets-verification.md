# 网页图标与分享资源验收

日期：2026-10-24。用户确认沿用骰碗、补齐资源与接入。

- ICO 真实尺寸包括 16/32/48/64px；独立 PNG 为 16/32px，均可解码。
- 分享封面 1200×630，RGB PNG，84,719 字节。已目视检查中文显示、图标、标题与模式标签，小尺寸图标也已查看。
- `index.html` 的 SVG、PNG、ICO 和 Apple 图标均使用 `%BASE_URL%`；Open Graph、Twitter、canonical 使用 README 中现有的 GitHub Pages 地址。
- 已检查分享图片尺寸元数据与产物一致，Open Graph 与 Twitter 指向同一图片；元数据在静态 HTML 中，不依赖 JS 执行。
- 默认 Vite 生产构建成功，PWA 154 个预缓存条目。图标和清单在构建 HTML 中使用 `./`，每个引用都对应真实产物。
- 使用 `--base=/bobing/ --outDir=/private/tmp/bobing-web-assets-build --emptyOutDir` 的构建成功，所有图标和清单引用位于 `/bobing/`，每个引用都对应真实产物。
- 两种构建的 Service Worker 均预缓存 ICO、新增 PNG、SVG 和分享封面。
- 已提供 `scripts/build-web-assets.py`，并在 README 和图标资源目录记录重新生成方法。静态资源/元数据改动未新增测试文件。
- 本次未发布线上；线上分享抓取效果需在发布后由平台读取新元数据，现有平台缓存可能仍显示旧内容。

验证命令：

```sh
python3 scripts/build-web-assets.py
/opt/homebrew/opt/node@24/bin/node node_modules/vite/bin/vite.js build
/opt/homebrew/opt/node@24/bin/node node_modules/vite/bin/vite.js build --base=/bobing/ --outDir=/private/tmp/bobing-web-assets-build --emptyOutDir
```
