# 网页品牌资源 Implementation Plan

**Goal:** 补齐已确认的兼容图标、分享封面和网页接入。

**Architecture:** `scripts/build-web-assets.py` 从现有 512px 图标生成小图标和分享封面；`index.html` 使用 BASE_URL 引用图标，分享元数据使用 README 已有的线上绝对地址。

**Tech Stack:** Python、Pillow、现有 Vite/PWA 构建。

- [x] 创建生成脚本，输出 `public/favicon.ico`、`public/icons/favicon-16.png`、`public/icons/favicon-32.png` 和 `public/social/bobing-share.png`。使用 LANCZOS 缩制图标，多帧 ICO 包含 16/32/48/64px。
- [x] 在 `index.html` 接入 ICO/PNG/SVG 回退、Open Graph、Twitter 和 canonical；保留现有 Apple/PWA 配置。
- [x] README 记录输出资源、重新生成命令和分享域名更新方式；在 `public/icons/README.md` 列出用途与尺寸。
- [x] 生成并目视检查分享封面和小尺寸图标，运行默认及 `/bobing/` 生产构建，检查每个 HTML 图标引用指向实际文件、分享图片地址与尺寸一致，以及 PWA 缓存包含新资源。
- [x] 保存验收记录，检查本次修改的 diff。
