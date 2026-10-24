# 浅色新国风界面验收

用户从三种方向稿选择 A，随后确认将期间新增的金币、商店、重掷券与完整轮次一起接入此风格。

## 参考

- [Knucklebones](https://github.com/osselets/knucklebones)：已查看 AI 对局，参考对手、分数和操作区域分工。
- [Dice Box](https://github.com/3d-dice/dice-box)：已核实 MIT 与在线演示，参考骰子质感，本次使用现有 CSS/SVG。
- [Weblatro](https://github.com/TyconXon/Weblatro)：已查看在线演示，仅参考计分区和玩法区分离，不复用素材。
- [无名杀](https://github.com/libnoname/noname)：已核实当前仓库与说明，参考中文角色桌游结构，未运行完整本地版本。

## 实际验收

- 首页、角色选择、两段剧情与对局连通。
- 玩家掷骰后，机器人轮转并进入小铺。
- 购买牵羊后金币 20 → 0、库存 0 → 1，下一轮可选目标；使用后转移真实奖项并消耗库存。
- 购买重掷券后，结果阶段显示确认与重掷；重掷后库存 1 → 0。
- 320×740、390×844、768×900、1024×768 检查无页面横向溢出；1280×720 操作区底边位于 702px，可完整显示。
- 768px 开启摇一摇后，提示独占一行，操作区 clientWidth 与 scrollWidth 均为 700px。
- 正式预览页面未捕获到 console error 或 warn。
- 使用 `/opt/homebrew/bin/node node_modules/vitest/vitest.mjs run`，90 项现有测试通过。默认 Node 20 与既有 jsdom/undici 组合存在启动问题，本次未修改依赖。

临时响应式验证页已删除。仓库没有 Git，本次未初始化或提交。
