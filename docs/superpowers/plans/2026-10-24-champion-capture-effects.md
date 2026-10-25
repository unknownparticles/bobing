# 抢状元与互动动画 Implementation Plan

> 使用 subagent-driven-development：一个独立UI代理负责动画层，主代理负责规则与结构化事件，再进行只读审查。

**Goal:** 实现严格等级抢状元及可追踪的所有互动动画。

**Architecture:** champion.js选择并转移最低状元；visuals.js生成单调序号队列；state/effects/economy记录真实作用链；EffectLayer通过人物锚点播放，useGame完成后ACK再推进。

**Tech Stack:** 现有React、SVG、CSS原生动画、Lucide、Vitest，无新依赖。

- [x] 先验证抢状元、同档/自己/随机目标、防护绕过、姻缘与等级更新。
- [x] 实现抢夺规则及分账，不增加奖项或重复触发奖金。
- [x] 全部技能、防护转移、神明、姻缘与场地生成真实结构化事件。
- [x] 实现队列、ACK、动画时长和自动回合暂停；完成锚点与动画层集成。
- [x] 构建、测试、只读审查、实际浏览器动画验收；删除临时测试与演示页。
