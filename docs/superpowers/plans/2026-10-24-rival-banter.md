# 同桌角色文字气泡 Implementation Plan

**Goal:** 为现有多人桌面增加用户已确认的完整互动气泡。

**Architecture:** `banter.js` 维护台词与真实事件到发言的映射；`useBanter.js` 管理等待、显示期限和清理。`RivalSpeech.jsx` 定位气泡，`Game.jsx` 和 `PaperGame.jsx` 仅传递及显示。

**Tech Stack:** 现有 React、CSS、Vitest、Testing Library，不新增依赖。

- [x] 新增临时 hook 测试，使用 fake timers 与真实 reducer 验证等待 10 秒、显示 4 秒、每回合最多一次、中奖确认、攻击实际目标、无重复以及离桌清理。先运行确认缺少功能导致失败。
- [x] 创建 `src/game/banter.js` 与 `src/game/useBanter.js`，按已确认设计实现台词选择及计时。台词选择不消耗游戏规则的随机序列。
- [x] 新增 `src/ui/RivalSpeech.jsx` 和 `src/styles/rival-speech.css`；在对手栏下放置固定高度的气泡区域，测量头像位置并限制气泡在桌面内，离屏发言保留身份。
- [x] 将 hook 接入 `src/game/Game.jsx`，把 speech 传给 `src/ui/PaperGame.jsx`，只读验收快照包括当前气泡。
- [x] 运行临时测试、现有测试和生产构建；浏览器验证桌面、手机、经典十人桌的催促和实际回合互动。
- [x] 验证完成后删除本次临时测试，保存验收记录，检查本次 diff，不格式化已有代码。限定范围的独立代码复核未发现需修复问题。
