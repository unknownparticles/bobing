## Context

对局画面现在是一个大 `App` 组件加压缩成单行的 CSS。碗 310×145、骰子 36px,6 个座位和 6 格奖池抢走视觉焦点,颜色全部硬编码。判奖逻辑只数 4 的个数。本变更是一个"场景竖切片":先把画面、演出和反馈做对,再让肉鸽主线接入。

约束:
- 目录不是 git 仓库,没有测试框架,依赖全是 `latest`。
- 不新增运行时依赖。动画用 CSS 与 Canvas,音效用 WebAudio。不引入 Motion、Zustand、three.js。
- 我无法生成图片。陈主管的表情图由用户提供,缺图时必须有占位。
- 目标是手机竖屏优先,桌面居中适配。

## Goals / Non-Goals

**Goals:**
- 手机首屏内完整看到对手、碗、结果和主按钮,碗是最大元素。
- 掷骰有分段演出和逐颗落定,结果先定后演,可跳过,可清理。
- 奖项分档反馈,状元有明显的高潮。
- 设计令牌集中,对比度和最小字号可被脚本或测试校验。

**Non-Goals:**
- 不做肉鸽主线:遗物、特殊骰子、Boss 规则、难度阶梯、元进度。
- 不做变现、主角生成、联机、存档(静音状态除外)。
- 不做 6 人围桌的任何保留或兼容。

## Decisions

### 1. 目录结构

```
src/
  game/        config.js  rules.js          纯逻辑,无 React
  scene/       Stage.jsx Bowl.jsx Die3D.jsx Opponent.jsx
               ResultStamp.jsx Fireworks.jsx
               useRollSequence.js tier.js lines.js
  audio/       sfx.js
  styles/      tokens.css base.css scene.css
scripts/       check-contrast.mjs contrast-pairs.json
public/characters/   chen-neutral.png chen-smug.png chen-upset.png
```

`game/` 不依赖 React,`scene/` 里的 `tier.js`、`lines.js` 也是纯函数。这样判奖、分档、台词选择都能不渲染组件直接测。

### 2. 判奖复用,放在 `src/game/`

切片需要 `evaluateRoll`。它的规格在 `complete-bobing-rules-and-endgame` 的 `bobing-rules` 里,但还没实现。本变更按那份 spec 实现 `rules.js` 和 `config.js`(奖项表:数量、积分、优先级),并带完整测试。另一个变更后续把对应任务标为已完成即可,不重复实现。

练习桌的得分直接取 `config.js` 奖项表里的每份积分,不引入库存(库存属于被搁置的 `prize-pool`)。

### 3. 骰子:CSS 3D 立方体

每颗骰子是一个 `transform-style: preserve-3d` 的立方体,6 个面各放一张内联 SVG,用 `translateZ(边长/2)` 摆好。"朝上的面"通过给立方体设置固定的 `rotateX/rotateY` 映射表实现(点数 → 旋转角度)。

- 抛出阶段:在 CSS 动画里让立方体做多圈翻滚。
- 落定阶段:移除动画,过渡到目标点数对应的旋转角度。
- 减少动态效果:跳过翻滚,直接设置目标角度。

备选:每帧换一张 2D 图。不选,因为没有立体感,也和"骰子在碗里"的层次无关。备选:three.js。不选,理由是 6 颗立方体用 CSS 足够,不值得增加包体和低端机风险。

### 4. 碗分三层

DOM 顺序:碗后壁(`z-index: 1`)、骰子层(`2`)、碗前沿(`3`,`pointer-events: none`)。前沿用 SVG 或带 `clip-path` 的元素,只画下半圈,盖住骰子下缘。碗只用青花蓝与米色,通过 `--color-porcelain` 等令牌取色。碗的摇晃动画作用在整个碗容器上,三层一起动。

### 5. 掷骰时间线与"结果先定后演"

`useRollSequence({ rng })` 在 `roll()` 被调用时:
1. 用 `rng` 一次性生成 6 个点数。
2. 立刻调用 `evaluateRoll`,得到奖项与得分,写入"已提交结果"。
3. 启动时间线:摇碗约 500ms、抛出约 600ms、落定阶段按 60 到 120ms 的间隔逐颗停下。总时长上限 2200ms。
4. 时间线结束后进入"展示结果":触发反馈、分数滚动,然后才更新状态条上的剩余次数与累计分。

时间线由一个调度器统一管理,所有定时器 id 存在 ref 里。三种情况统一走同一个清理函数:组件卸载、新一桌开始、玩家点击跳过。跳过会直接跳到落定后的状态,并保证反馈只触发一次(用"已展示"标志位去重)。

状态条显示的是"已展示"的值,而不是"已提交"的值,所以动画期间不会提前泄露结果。

备选:用 `requestAnimationFrame` 自己写时间线。不选,CSS 动画加少量定时器足够,并且更容易在测试里用假定时器控制。

### 6. 奖项分档是纯函数

`tier.js` 导出 `tierOf(awardId)`,返回 `none | minor | major | grand | supreme`。反馈组件只读档位,不再关心具体奖项,新增奖项只需改映射表。

反馈按档位叠加:`minor` 淡入、`major` 加印章砸下与震屏一次与金光、`grand` 放大并延长金光、`supreme` 再加烟花和"状元"大印章。

### 7. 烟花用 Canvas 粒子

`Fireworks.jsx` 在全屏 `canvas` 上用 `requestAnimationFrame` 画粒子,粒子数量上限 150,生命周期约 1.6 秒后自动停止并卸载 canvas。减少动态效果下不挂载。组件卸载时取消动画帧。

### 8. 音效用 WebAudio 合成

`sfx.js` 用振荡器和噪声缓冲合成四类音效:摇碗(带通噪声)、落定(短促敲击)、中奖(上行音阶)、状元(更长的和弦加噪声爆裂)。`AudioContext` 在第一次用户点击时创建,之前不创建。静音状态存在 `localStorage` 的 `bobing.muted`,读取失败时按未静音处理,不抛错。

备选:使用音频文件。不选,理由是授权要逐个核对,并增加包体;合成足够做出基础反馈,后续想升级再替换。

### 9. 对手图片与占位

`Opponent.jsx` 用 `<img>` 加载 `public/characters/chen-<expr>.png`。`onError` 时切换到内置 SVG 占位头像(圆形底加表情线条),确保没有破图图标。素材规格:512×512 透明底 PNG,三个文件名固定,人物居中,脚本不对图片内容做任何校验。

### 10. 减少动态效果:CSS 与 JS 双重处理

CSS 里用 `@media (prefers-reduced-motion: reduce)` 关闭晃动、翻滚、震屏和过渡。时间线在 JS 里用 `matchMedia` 判断:减少动态时,没有翻滚和逐颗落定的延迟,直接进入展示结果,结果印章仅淡入。烟花不挂载。结果信息与静音开关保持不变。

### 11. 对比度和最小字号可校验

`scripts/contrast-pairs.json` 列出声明的前景与背景令牌配对,`check-contrast.mjs` 解析 `tokens.css` 的颜色,按 WCAG 公式计算对比度,不达标则以非零状态退出并列出配对。注册为 `npm run check:contrast`。最小字号靠令牌约束:字号令牌的最小值为 12px,并在测试里检查 `tokens.css` 中没有小于 12px 的字号令牌。

### 12. 测试策略

- 纯逻辑(`rules.js`、`tier.js`、`lines.js`、对比度脚本):vitest。`evaluateRoll` 用表驱动加 6^6 穷举。
- 时间线(`useRollSequence`):vitest 加假定时器,验证总时长、落定间隔、跳过、清理。
- 组件行为(主按钮禁用、静音、aria-live):`@testing-library/react` 加 `jsdom`。
- 视觉(布局、遮挡、动画观感):单元测试无法覆盖,需要在浏览器里按 375×667 和 1440×900 预览,必要时截图。能否自动化取决于本机是否有无头浏览器,没有则明确标注为未验证。

## Risks / Trade-offs

- [低端手机上 6 个 CSS 3D 立方体加阴影与滤镜可能掉帧] → 限制阴影与滤镜层数,动画只用 `transform` 与 `opacity`,必要时对低性能设备降级为减少动态模式。
- [iOS Safari 对 `AudioContext` 要求用户手势] → 只在第一次点击后创建并 `resume`,首次点击前不发声。
- [微信内置浏览器对 `devicemotion` 与音频策略不同] → 摇一摇不在本切片内;音频失败时静默,不影响主流程。
- [陈主管图片风格与 SVG/CSS 美术可能不协调] → 图片用透明底,舞台背景和令牌保持克制;拿到真实图片后再微调色板。
- [切片的练习桌不是最终玩法,可能被误当成最终体验] → 在 proposal 中已标明是临时循环,后续肉鸽主线替换。
- [删除注册页和剧情页会丢掉现有的昵称与头像功能] → 属于有意取舍;昵称和主角将在肉鸽主线里以"主角卡"重新设计。
- [`complete-bobing-rules-and-endgame` 里的 4 份 spec 与本变更冲突] → 不删除,保持原样,待肉鸽主线变更时统一重做。

## Migration Plan

1. 先 `git init` 并提交现状作为基线(提交需用户确认)。
2. 新建 `src/game`、`src/styles`、`src/scene`、`src/audio`,先写纯逻辑和令牌,UI 暂不变。
3. 完成场景组件后,把 `main.jsx` 的对局视图替换为新的 `Stage`,首页直达舞台。
4. 确认新舞台可用后,删除 `ProfileSetup`、`StoryIntro`、`Seat`、`Pool`、`SkillOverlay` 及 `onboarding.css`。
5. 每一步完成后运行 `npm run build` 与测试。回滚方式:回到基线提交。

## Open Questions

1. 陈主管三张表情图什么时候提供?在此之前使用 SVG 占位,不阻塞实现。
2. 开场是否需要一句操作提示(例如首次进入时在碗上方显示"点击摇碗")?默认首次进入显示一次,摇过一次后不再显示。
3. 练习桌的"每桌 3 次"是否合适?它只是为了让切片有一个起止,实现后可以调整。
