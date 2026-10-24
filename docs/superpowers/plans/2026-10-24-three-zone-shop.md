# 三分区商店 Implementation Plan

> **For agentic workers:** 使用 subagent-driven-development，界面资源交由单个实施代理，主代理实现规则并做集成；随后执行规格与代码审查。

**Goal:** 真正实现12神明、32技能、12场地，允许库存内连续出牌，商店采用小丑牌式卡牌布局及SVG资源。

**Architecture:** catalog.js 提供56商品与元数据；state.js 负责阶段和结算；effects.js 负责技能与祝福；rolls.js 负责多骰随机生成；economy.js 负责姻缘积分；Shop 与 CardInventory 分别购买和使用。沿用8轮结束、重开、真实奖池。

**Tech Stack:** React、现有 Lucide SVG、自定义 SVG、Vite、现有 Vitest，无新依赖。

## 模块接口

商品导出 `GODS, SKILLS, FIELDS, CATALOG, getItem(id)`，对象字段 `id,name,price,description,category,timing,target`。category=god/skill/field；timing=before/after/shop；target=none/player/die/twoDice/award/god/card/twoPlayers/sourceDice。

统一动作：`BUY {userId,item,targetId?,replaceId?}`，`USE_ITEM {item,targetId?,targetIds?,diceIndices?,awardIndex?,buffId?,cardId?}`，`SUBMIT_FIELD {userId,item}`。所有随机动作由 `resolveAction(state,action,rng)` 包装，将具体随机输入传给 reducer。

玩家保留 `awards:string[]` 兼容旧UI，增加并行 `awardRanks:number[]`、`scoreAdjustment:number`（以分为单位且只用0.25精度）、`buffs:[]`、`gender`、`partnerId`。`items` 是全部技能和场地的库存映射。game 增加 `field`, `fieldSubmissions`, `priority`, `diceCount`。`scoreOf` 和 `rankOf` 为最终排名来源。

界面规则选择接口：`getUseOptions(game,itemId)` 返回 `{available,reason,targets?,diceCount?,...}`；简化集成额外提供 `canUseItem(game,itemId)` 和 `legalTargets(game,itemId)`。使用时由规则层严格校验所有输入。UI可显示不存在于当前阶段的商品但必须给原因。

- [x] 先验证旧版单次技能限制，然后实现多次使用与多骰判奖，保留六骰旧接口返回结构。
- [x] 实现经济账本、姻缘、祝福到期和防护链，读取注入随机源。
- [x] 实现32技能和12场地，验证每个ID独立效果、合法性和真实资源变化。
- [x] 完成catalog、SVG和商店/手牌选择界面；角色登记性别；对局显示神明/场地/姻缘/骰数。
- [x] 机器人使用相同动作，连续出牌耗尽可用资源后进入掷骰，避免无效动作循环。
- [x] 验证构建、现有与临时测试、实际浏览器完整购买使用流程和手机布局；删除本次新增临时测试。

测试命令使用 `/opt/homebrew/bin/node node_modules/vitest/vitest.mjs run --testTimeout=30000`；预期所有已有测试通过。没有Git仓库，不初始化、不提交、不格式化无关代码。
