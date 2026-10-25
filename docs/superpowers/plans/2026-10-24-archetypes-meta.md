# 四流派与跨局成长实施计划

**Goal:** 完整实现已批准的四流派构筑、公开投掷预告、吉位场地、图鉴、成就、称号与二周目。

**Architecture:** 规则仍由 reducer 校验，新增独立流派模块统一投掷、领奖、偷盗与换位钩子；规则事件保存结构化数据。长期档案模块仅消费事件与终局结果，按对局ID和事件序号防重，不将 localStorage 写入 reducer。

**Tech Stack:** React、Lucide、现有 CSS、Vitest、Playwright；不安装新依赖，不格式化无关代码，不创建提交。

- [x] 规则验证：临时测试先复现运气叠加、三投预告与单骰触发、吉位、连败清零、偷盗神明与防御链、重开资源重置。
- [x] 新增 `src/game/archetypes.js`（天赋与规则钩子）及 `src/game/progression-content.js`（成就/解锁资格）；在 `catalog.js` 增加已批准技能、神明、吉位并标记流派；在 `rolls.js` 集中实际投掷结算，`state.js`/`effects.js`/`economy.js` 派发真实事件。
- [x] 新增 `src/game/archive.js`，实现带版本号的长期档案、事件防重、图鉴发现/使用、八项成就、内容资格、称号选择与周目；临时测试覆盖损坏、新版和存储失败。
- [x] 接入 `stock.js`/`bots.js`：货架保障本流派构筑机会，所有来源统一解锁过滤，电脑天赋和实际使用行为遵守相同规则。
- [x] 接入 `main.jsx`/`Game.jsx`，新增流派选择、档案入口、二周目入口、存储失败反馈、章节间保留所选流派和周目；每桌重置局内资源。
- [x] 新增 `src/ui/ArchetypePicker.jsx`/`BuildStatus.jsx`/`ArchiveScreen.jsx`，更新 `Shop.jsx`/`CardInventory.jsx`/`PaperSummary.jsx`：流派标签、天赋分支、吉位选座、公开预告、连续失败进度、成就解锁与称号佩戴。
- [x] 临时测试与原有测试、构建、真实浏览器流程验证；覆盖三模式、二/六/八/十人、公开预告抢触发、流派构筑、终局重开、本地档案刷新和二周目。
- [x] 独立审查，修复有证据的缺陷；删除本次临时测试，保留验收记录和截图，更新 README 与 progress。

共享模块契约：游戏 `id` 为唯一对局标识，`events` 为按顺序追加的结构化事件，每条含 `seq/type/actorId`，可附带 `itemId/amount/singleDie`；事件类型包括 `discover/acquire/use/theft/wind/burst`。`players` 含 `archetype/branch` 与本桌统计。档案只消费本人事件并在真实 `finished` 状态结算战绩；故事第三章第一名才算完整通关。
