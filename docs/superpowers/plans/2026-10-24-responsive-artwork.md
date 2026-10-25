# 响应式图片实施计划

**Goal:** 降低小图下载量，保留大图清晰度，统一图片路径和加载策略。

**Architecture:** 生成 WebP 与尺寸清单，Art.jsx 统一解析路径及渲染图片。PaperScreens 与 PaperPrimitives 只提供展示尺寸和加载优先级。

**Tech Stack:** React、Vite、原生响应式图片、Python/Pillow。

- [x] 为真实角色图片、头像、大立绘、旧素材及未知角色添加临时验证，确认现有实现缺少响应式支持。
- [x] 添加 scripts/generate-artwork.py，生成 public/art/responsive 下的 384/768 宽 WebP，以及 src/art-variants.json；文件名包含内容摘要，清单记录真实尺寸。
- [x] 在 src/Art.jsx 复用路径解析，新增共享 ArtworkImage，Portrait 和 ArtPicker 使用同一套图片属性。
- [x] 修改 src/ui/PaperPrimitives.jsx 的头像及 src/ui/PaperScreens.jsx 的角色选择、预览、剧情主图；sizes 计入裁切放大，主图 eager/high，选项 lazy。
- [x] 执行临时测试、npm test、npm run build；验证生产子路径资源可访问、桌面和手机实际选图及清晰度。
- [x] 删除本次临时测试，在 README.md 记录生成命令、依赖与资源缓存策略，更新验证记录。

只编辑本任务相关文件，保留工作区已有修改，不执行格式化或提交。
