# 遇见图鉴与玩家详情实施计划

**Goal:** 让玩家能随时查询遇见内容和各人的实际奖项，同时隐藏对手未使用的牌。

**Architecture:** 用游戏事件同步卡牌发现，用稳定身份和实际职业同步角色及公开技能。展示层共用档案组件，玩家详情始终按 ID 读取最新 game。

**Tech Stack:** React、现有 Lucide 图标、原生 dialog、Vitest、现有纸面 CSS。

- [x] 新建临时需求测试，覆盖对手 use 被收录、对手 acquire/discover 被排除、旧档案兼容、角色技能图鉴和玩家奖项弹窗。
- [x] 导出 modes.js 中已有同事身份，在 encounter.js 汇总角色与公开技能，并为 archive.js 补充兼容收集字段。
- [x] ArchiveScreen.jsx 增加技能与角色分类和遇见筛选；保持原卡牌筛选、成就及称号接口。
- [x] 新建 PlayerDetails.jsx 与 GuideDialog.jsx，在 PaperGame.jsx 接入玩家点击和对局图鉴入口；弹窗读取公开使用事件，奖项读取实时 awards。
- [x] 运行 `npm test -- --testTimeout=30000` 与 `npm run build`；通过后删除本次临时测试。
- [x] 启动本地预览，浏览器验证首页/对局图鉴、玩家详情、关闭回桌、390px/1280px 布局、控制台错误，并更新 README 和 progress.md。
