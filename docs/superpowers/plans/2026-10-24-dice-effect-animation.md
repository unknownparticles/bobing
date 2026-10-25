# 卡牌掷骰效果动画实施计划

**Goal:** 按真实规则逐次播放候选、局部重投和点数变化。

**Architecture:** 规则层保留 `rollPresentation`；独立动画模块生成展示步骤，hook 管理可清理定时器；桌面组件呈现进度和候选比较。

**Tech Stack:** React、CSS、Vitest、现有浏览器验证工具。

- [x] 临时测试：两组取差、运气多组取优、一次预告推进、指定骰子重投、改点前后数据与动画期间动作拦截。
- [x] 修改 `rolls.js`、`state.js`、`effects.js` 保留候选与变更记录；不改变随机生成和选组算法。
- [x] 新增 `dice-animation.js`、`useDiceAnimation.js`，集中顺序投掷、落定、比较和变更时序；替换 `useGame.js` 的单次整碗动画。
- [x] 修改 `PaperPrimitives.jsx`、`PaperGame.jsx`、`Game.jsx`，增加局部翻滚、候选比较、改点提示和操作锁定；新增局部样式文件。
- [x] 执行测试与生产构建；浏览器检查真实时序、手机布局、减少动态效果及错误日志。细节见 `docs/ui-preview/dice-effects-verification.md`。
- [x] 删除本次临时测试和临时预览入口，记录验证结果，保留已有修改且不自动提交。
