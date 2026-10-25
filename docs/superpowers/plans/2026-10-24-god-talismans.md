# 神符实现计划

**Goal:** 完成用户已批准的请神符与送神符规则及实际出牌交互。

**Architecture:** 神符模块统一神明筛选和事务；现有 effects 保留库存、时机及防御链入口。手牌和机器人复用相同筛选，避免界面允许选择规则拒绝的目标。

**Tech Stack:** React、现有 reducer、Lucide、Vitest、Vite。

- [x] 添加临时规则与手牌测试，运行并确认新牌尚未实现时失败。
- [x] 在 catalog 中添加 summon_god（请神符40金币，god目标）和 dismiss_god（送神符10金币，selfGod目标），均为 before 技能。
- [x] 创建 src/game/god-talismans.js，提供合法神明筛选、原期限转移、单项神明净化；接入 effects 的可用性、目标验证和防御链。
- [x] CardInventory 增加自己神明选择并复用筛选，bots 使用相同 buffId，CardIcon 增加独立图标；真实结算事件显示神明名称。
- [x] 运行临时测试、现有测试和生产构建，核对 diff，删除本次临时测试并记录结果；全量测试其他失败见验收记录。
