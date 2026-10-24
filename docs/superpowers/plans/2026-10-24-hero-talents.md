# 三主角基础技能 Implementation Plan

> 当前会话直接执行，requesting-code-review 完成独立只读审查。

**Goal:** A改骰、B护奖、C免费首刷，与形象和固定性别绑定。

**Architecture:** heroes.js为身份/技能唯一配置；state的HERO_REROLL处理A，effects防御链处理B，stock价格处理C。HeroSkill负责对局入口，PaperScreens与Shop展示一致说明和状态。

**Tech Stack:** React、原生dialog、SVG/Lucide、现有Vitest，无新依赖。

- [x] 用12项临时规则检查复现未实现的技能。
- [x] 实现免费单骰、每轮护奖、免费首刷与重开清零。
- [x] 完成角色选择说明、底部技能入口、选骰对话框与商店价格提示。
- [x] 独立只读审查通过；构建与102项集成检查通过。
- [x] 浏览器检查A只改一颗、保留手牌和本轮次数；390手机无溢出，1280×720操作栏下边702px。
- [x] 完成C商店实际刷新核验并删除临时测试、尺寸页。
