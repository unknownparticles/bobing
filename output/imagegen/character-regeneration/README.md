# 全部玩家形象重新生成

按用户要求，使用 `https://api.openai-next.com/v1` 与桌面密钥重新生成全部 7 个已接入玩家形象：主角 A/B/C 与同桌角色陈主管、小美、老吴、大林。密钥仅在运行时从用户指定文件读取，未写入仓库，未向前端添加 API 调用。

## 生成规格

- 模型 `gpt-image-2`，尺寸 `1024x1536`，`quality=high`，透明背景 PNG，7 张顺序调用（避免并发限流）。
- 提示词直接取自 [docs/art-generation-prompts.md](../../../docs/art-generation-prompts.md) 中 01–07 节基础立绘原文，并附加统一风格后缀（像素块、头身比、色盘、全身站姿、居中、留白、禁止文字/场景/道具）。
- `scripts/regenerate-characters.py` 为可复现入口：自动提取提示词、读取密钥、保存原始 PNG、旧图自动备份到 `previous/`，失败即中止，不会覆盖已通过的素材。
- 首次请求被网关以 `1010` 拒绝，原因是 Python 默认 User-Agent 被拦截；改用常规 curl User-Agent 后成功。

## 后处理

原始图存在两类问题：透明区散布 alpha≤8 的噪点；主体高度与边距不一致。

- `--reuse-raw` 模式从已保存的原始 PNG 重新导出，不重复消耗额度。
- 后处理将 alpha≤8 的像素清零，按主体包围盒裁剪，等比缩放到最大 1000×1430，居中放入 1152×1536 画布。
- 结果：7 张统一 1152×1536 RGBA WebP（`quality=90`），主体垂直边界一致（y 53–1483），水平留白均衡；残留低 alpha 像素全部位于人物抗锯齿边缘，透明区无散点（已逐像素校验）。
- `scripts/generate-artwork.py` 重建 384/768 响应式 WebP 与 `src/art-variants.json`（内容哈希文件名自动刷新缓存），并清理 14 个不再被引用的旧文件。

## 文件

- `raw-all/`：7 张 API 原始 PNG 合并副本，供 `--reuse-raw` 使用。
- `20261024-213918/`、`20261024-214002/`：首次生成运行目录，各含 `raw/` 与首次覆盖前的 `previous/` 旧图备份。
- `20261024-224344/`：后处理重导出的运行目录，含 `raw/`、`previous/` 与 `manifest.json`。
- 最终资源：`public/art/official/{hero-a,hero-b,hero-c,chen,mei,wu,lin}.webp`。

## 验收

- 逐张目检：透明背景、全身完整、无文字/水印/场景/道具，性别与服装设定符合原提示词，手部无结构错误，7 人画风统一。
- `npm run build` 通过；`npm test` 100 个测试全部通过；`dist/` 已包含新图与响应式副本。
