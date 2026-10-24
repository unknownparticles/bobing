# Round Shop Implementation Plan

**Goal:** 实现用户确认的每轮商店、消耗道具与逆时针行动。

**Architecture:** config 统一数值，state 以纯 reducer 原子处理规则，bots 负责自动决策。React effect 负责动画和推进，进入商店后没有对局定时器。

**Tech Stack:** 现有 React、Lucide、CSS、Vitest；保持现有依赖。

## 顺序执行

- [x] 编写临时 `src/game/round-shop.test.js`，运行 `npm test -- src/game/round-shop.test.js --testTimeout=30000`，先确认缺少游戏状态接口。
- [x] 扩充 `src/game/config.js` 商品、库存和座位配置；新增 `src/game/state.js` 与 `src/game/bots.js`。测试覆盖六人完整行动、结算只发生一次、购买预算和限购、积分守恒、重掷确认、保护有效期、机器人公平规则。
- [x] 新增 `src/game/useGame.js` 管理可清理的动画和动作计时器；更新 `src/main.jsx` 使用统一状态，保持注册、剧情、立绘和现有样式。
- [x] 新增 `src/game/Shop.jsx` 与 `src/shop.css`，显示轮次奖励、余额、价格、背包和限购原因；为目标选择、重掷确认、保护状态补充界面。
- [x] 运行完整 Vitest 与 Vite build。浏览器走完整两轮、购买、跳过、道具使用、手机事件、桌面和窄屏；检查截图和控制台。
- [x] 根据用户要求删除新增测试，记录验证结果，交付功能与已验证范围。
