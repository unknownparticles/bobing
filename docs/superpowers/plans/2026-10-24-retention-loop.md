# 短局与复玩体验 Implementation Plan

> 按用户已批准方案在当前会话执行；无 Git 元数据，使用临时文件快照检查差异。

**Goal:** 让八轮争冠形成可结束、可重开的短局，尽早体验道具并减少旁观等待。

**Architecture:** reducer 统一管理终局与重置；useGame 管理可清理的阶段计时器；新增独立 PaperSummary 展示派生排名，沿用现有主题与组件。

**Tech Stack:** React、Vite、Vitest、Playwright、Lucide、CSS。

- [x] 规则：先添加临时终局测试，覆盖开局赠券、八轮公平行动、最终发奖、终局禁用、重开与并列排名。用 Node 24 运行并确认失败，再在 config.js/state.js 增加 MAX_ROUNDS、排名派生与 finished/RESTART。
- [x] 节奏：先用虚拟计时器验证普通机器人缩短、抢夺与大奖留时、商店及终局静止、卸载清理；再修改 useGame.js，保留玩家动画和人工重掷决定。
- [x] 界面：在 PaperGame 显示八轮进度与目标，新增 PaperSummary.jsx，接入 Game/main 的重开和返回首页；PaperScreens 增加跳过剧情和玩法说明。新增 CSS 仅限本次组件，复用主题变量。临时组件测试覆盖并列、重开按钮、跳过两幕剧情与进度。
- [x] 验证：使用 Node 24 运行完整 Vitest 与 Vite build；Playwright 执行八轮、商店暂停、首轮重掷、终局静止、重开、返回首页，检查 1280px、390px、320px 的截图与溢出。独立代码审查后修复问题，删除本次临时测试并更新 progress.md。

运行命令：`/opt/homebrew/opt/node@24/bin/node node_modules/vitest/vitest.mjs run --testTimeout=30000`；构建命令：`/opt/homebrew/opt/node@24/bin/node node_modules/vite/bin/vite.js build`。预期全部测试通过，构建退出码为 0。浏览器验收产物放在 `/tmp/bobing-retention-ui/`。
