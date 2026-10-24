## ADDED Requirements

### Requirement: 设计令牌集中定义
系统 SHALL 在 `src/styles/tokens.css` 中用 CSS 自定义属性定义全部颜色、字号、间距、圆角、阴影和动画时长。场景样式 MUST 通过 `var(--...)` 引用令牌,MUST NOT 在场景样式中直接写十六进制颜色。

#### Scenario: 场景样式不含硬编码颜色
- **WHEN** 检查 `src/scene/` 与 `src/styles/scene.css` 中的样式
- **THEN** 除 SVG 素材文件外,不出现 `#` 开头的颜色字面量

### Requirement: 夜色红金配色
令牌 SHALL 至少包含以下语义颜色:夜空背景(深紫黑)、桌布(深红)、朱砂红(强调与主按钮)、金色(高亮与数值)、米色(正文)、青花蓝(仅用于碗)。主按钮 MUST 使用朱砂红底加金色描边。

#### Scenario: 语义颜色齐全
- **WHEN** 读取 `tokens.css`
- **THEN** 能找到 `--color-night`、`--color-cloth`、`--color-vermilion`、`--color-gold`、`--color-cream`、`--color-porcelain`

### Requirement: 文字对比度
正文文字与其背景的对比度 MUST 不低于 4.5:1,大号文字(不小于 24px 或不小于 18.5px 加粗)不低于 3:1。令牌中声明的前景与背景配对 SHALL 由脚本计算校验。

#### Scenario: 配对通过校验
- **WHEN** 运行对比度校验脚本
- **THEN** 所有声明的前景与背景配对满足上述阈值,否则脚本以非零状态退出并列出不达标的配对

### Requirement: 最小字号与触控尺寸
舞台内可见文字的字号 MUST 不小于 12px。主操作按钮的字号 MUST 不小于 18px,所有可点击控件的触控区域 MUST 不小于 44×44 CSS 像素。

#### Scenario: 小屏仍满足最小字号
- **WHEN** 视口宽度为 360px
- **THEN** 舞台内任何文字的计算字号不小于 12px,主按钮高度不小于 48px

### Requirement: 减少动态效果
当用户系统设置为 `prefers-reduced-motion: reduce` 时,系统 MUST 禁用震屏、抛骰翻滚、烟花和碗的晃动,改为淡入淡出或直接显示最终状态,且 MUST 保留结果信息与音效开关。

#### Scenario: 减少动态效果下的掷骰
- **WHEN** 用户启用了减少动态效果并点击摇碗
- **THEN** 骰子不做翻滚动画,直接显示最终点数,结果印章以淡入出现,不触发震屏与烟花
