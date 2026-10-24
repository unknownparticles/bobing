# 八张商店货架 Implementation Plan

> **For agentic workers:** 当前会话实施；完成后按 requesting-code-review 进行只读审查。

**Goal:** 2/3/3独立随机货架、递增付费刷新、随机夺奖和更丰富的卡牌商店视觉。

**Architecture:** stock.js管理抽样与刷新价格，state负责库存与原子扣款；Shop读取实际货架；独立ShopArtwork.svg组件丰富卡面。

**Tech Stack:** React、CSS、自定义SVG、现有Vitest，无新依赖。

- [x] 验证旧版未限制货架与牵羊固定最高奖的差异。
- [x] 实现stock、reducer与机器人货架采购，传递注入随机序列。
- [x] 实现三组同屏货架、刷新按钮与售罄状态，SVG插画及手机布局。
- [x] 交付完整单图UI生成提示词，明确2/3/3布局及所有交互信息。
- [x] 构建、规则测试、浏览器验收与截图；删除临时测试并记录结果。
