# 部门章与公司章角色立绘重新生成

按用户要求，补生成故事模式部门章（第二章）与公司章（第三章）的全部角色立绘；组内桌的阿杰是同桌第五名玩家，一并刷新以保持三章画风统一。调用方式与角色立绘重生成相同：`https://api.openai-next.com/v1`，`gpt-image-2`，密钥仅运行时从用户指定文件读取。

## 范围

| 章节 | 角色 |
| --- | --- |
| 部门桌（8人） | 唐采购、陆会计、乔经理、小许、叶设计、梁运营、费策划 |
| 公司桌（10人） | 周总、苏姐、顾工、陆主管、许冠、乔经理、严主管、安主管、沈主管 |

共 15 个文件：14 个部门/公司角色 + 组内桌阿杰。乔经理与陆会计/陆主管跨章复用同一张立绘，因此实际生成 15 张。文件名与 `src/ui/archive-art-manifest.json` 的映射不变，前端无需改动。

## 生成规格

- 提示词人物描述取自 `output/imagegen/2026-10-24-archive-art/subjects.json` 的 `characters` 段（与旧图集同一批设定）。
- 风格规范取自旧图集提示词 `prompts/characters-1.txt`：暖色当代中式民俗插画、墨绿勾线、水粉厚涂、米白宣纸底纹、青绿与朱砂配色、左上暖光；现代职场同事而非古装人物；半身至胯部、双手与道具完整入画；四边至少 10% 留白；无文字、无水印、无 Logo。
- 每张单独生成 `1024x1536`（不再使用 2×2 图集再切分），`quality=high`，`scripts/regenerate-archive-characters.py` 为可复现入口，支持 `--reuse-raw` 免额度重导。
- 后处理按 3:4 居中裁切并缩放到 576×768 RGB WebP（`quality=87`），与 `scripts/build-archive-art.py` 的既有输出规格一致；旧图自动备份到各运行目录的 `previous/`。

## 验收

- 逐张目检：性别、服装、手持道具均与 `subjects.json` 描述一致；无文字、无裁切、无多余人物；15 张画风与旧图鉴的暖底青绿圆形背景统一。
- 尺寸校验：15 张全部 576×768 RGB。
- `npm run build` 通过；`npm test` 100 个测试全部通过。

## 文件

- `20261024-225027/`：小许试生成运行目录（`raw/`、`previous/`）。
- `20261024-225138/`：其余 14 张正式运行目录（`raw/`、`previous/`、`manifest.json`）。
- 最终资源：`public/art/archive/characters/{tang,lu,qiao,xu,ye,liang,fei,zhou,su,gu,xuguan,yan,an,shen,jie}.webp`。
