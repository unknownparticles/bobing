# 请神符、送神符验收

2026-10-24。用户确认的40金币请神符、10金币送神符均已加入牌库、随机商店、手牌选神、机器人及图鉴。

## 已通过

- 25项临时规则测试：实际购买和扣款，立即转移选中神明且保留原期限，原对象失去该神明，满位及同名限制，月老、诅咒、过期和未生效神明排除；关帝、反弹、替身链以及替身没有同名神明时不转移。
- 规则测试同时验证：送神只解除手选神明诅咒，其他负面状态保留，施咒者供奉保留且下一轮可再次发动；错误时机、封印、空库存、非法神明不扣牌；机器人可正确出两张牌。
- 3项临时组件测试：请神先选对手再选神明并真实结算，送神无需选人且只展示自身神明诅咒，切换对手清空旧神明选择。
- 本次28项加现有82项回归测试，共6个文件110项通过。临时测试已按用户要求删除。
- 生产构建通过，PWA生成通过，`git diff --check`通过。未执行代码格式化。

验证命令使用本机 `/opt/homebrew/bin/node`（24.2.0）：

```sh
/opt/homebrew/bin/node node_modules/vitest/vitest.mjs run src/game/rules.test.js src/scene/tier.test.js src/scene/useRollSequence.test.jsx src/scene/TableScene.test.jsx src/game/god-talismans.temp.test.js src/ui/god-talismans.temp.test.jsx --testTimeout=30000 --maxWorkers=2
/opt/homebrew/bin/node node_modules/vite/bin/vite.js build
```

## 全量验证边界

默认Node20无法启动jsdom；提权复跑仍失败，改用现有Node24后本次组件测试通过。项目README推荐24.15以上，另已找到本机缓存的24.22.1。

运行全量测试时，其他正在修改的功能存在缺失样式导入，骰子动画临时测试发生堆内存溢出。按用户要求提权复跑全量测试（限制并发并遇错停止），当时新出现的`emergent-builds.temp.test.js`也因旧流派未清空而失败。因此没有声称全库测试通过。随后缺失样式文件已补齐，生产构建通过。

手牌交互已通过jsdom验证；未进行本次浏览器截图验收。
