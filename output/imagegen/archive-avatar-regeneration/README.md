# 部门章与公司章同事桌边头像重新生成

为故事模式部门章与公司章的 15 位同事（含组内桌阿杰）补生成桌边头像。此前这些角色只有图鉴半身立绘，牌桌内头像回退到通用人形图标或"姓氏+职业图标"。

## 范围与规格

- 15 个角色：唐采购、陆会计/陆主管、乔经理、小许、叶设计、梁运营、费策划、周总、苏姐、顾工、许冠、严主管、安主管、沈主管、阿杰。乔经理与陆会计跨章复用同一张。
- 模型 `gpt-image-2`，`1024x1024`，`quality=high`，逐张单独生成；提示词人物描述取自 `output/imagegen/2026-10-24-archive-art/subjects.json`，风格规范与半身立绘同一套（暖色当代中式民俗插画、墨绿勾线、米白宣纸底、青绿朱砂配色）。
- 构图要求：仅头肩、胸部以下裁切、脸部完整居中、发型完整入画、方形构图、暖底加头后淡青圆、四边留小余量；不画网格、多人、边框与文字。
- 后处理居中裁方并缩放到 384×384 RGB WebP（`quality=88`）；`scripts/regenerate-archive-avatars.py` 为可复现入口，支持 `--reuse-raw` 免额度重导，旧图自动备份。

## 前端接入

- `src/archive-avatars.json`：15 条 id 到 384×384 头像的稳定映射，文件名与图鉴立绘一致，前端零数据重复。
- `src/Art.jsx`：新增 `getArchiveAvatar(id)` 与 `hasPortraitArt(id)`，按 `BASE_URL` 解析路径。
- `src/ui/PaperPrimitives.jsx`：`Avatar` 先查正式立绘，再查同事头像，最后才退回通用图标；使用同事头像时加 `has-generated-avatar` 类。
- `src/paper-theme.css`：在 `.paper-avatar img` 旁补 `.paper-avatar.has-generated-avatar img` 规则（静态铺满圆形、`object-fit: contain`）。原 `src/styles/player-art.css` 中的同名规则从未被任何组件导入，属死代码，未做清理。
- `src/ui/RivalDetails.jsx`：`RivalAvatar` 改用 `hasPortraitArt`，本人有形象就不再退回职业图标。
- `src/game/rivals.js` 与 `src/game/modes.js`：为阿杰及部门/公司同事补 `portrait` 指向，使桌边、入席阵容、目标选择、结算排名、特效端点与对手详情全部显示本人头像。

## 验收

- 逐张目检：脸居中完整、性别服装与半身立绘一致、无文字、无裁切；按 `.paper-avatar` 实际样式（54px 圆形、纸色底、3px 描边、contain）模拟渲染，15 张在小尺寸下均可辨识。
- 新增 `src/ui/Avatar.test.jsx` 四个用例覆盖立绘优先、头像回退、无形象占位与对手头像逻辑；`npm test` 123 个测试全部通过，`npm run build` 通过，`dist` 内 15 张头像齐全，PWA 预缓存 193→208 条。

## 文件

- `20261024-231518/`：小许试生成（`raw/`）。
- `20261024-231615/`：唐采购至周总 7 张（`raw/`；苏姐请求读超时中断，未产生 manifest）。
- `20261024-233004/`：苏姐至阿杰 7 张（`raw/`、`manifest.json`）。
- 最终资源：`public/art/archive/avatars/{15 个角色}.webp`。
