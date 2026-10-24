## ADDED Requirements

### Requirement: 奖项分档
系统 SHALL 把判奖结果映射为反馈档位:`none`(无奖)、`minor`(一秀、二举)、`major`(三红、四进)、`grand`(对堂)、`supreme`(状元各档)。映射 MUST 是纯函数,放在 `src/scene/tier.js`,输入为 `evaluateRoll` 返回的 `awardId`。

#### Scenario: 映射表
- **WHEN** 分别输入 `null`、`yixiu`、`sanhong`、`duitang`、`zhuangyuan`
- **THEN** 依次返回 `none`、`minor`、`major`、`grand`、`supreme`

### Requirement: 分档视觉反馈
落定结束后,系统 MUST 按档位给出递增的反馈:
- `none`:结果区显示"没中",对手显示得意表情。
- `minor`:牌型名淡入,分数滚动,无震屏。
- `major`:牌型名以印章样式砸下,舞台震屏一次,碗区出现金光。
- `grand`:在 `major` 基础上印章放大,金光持续约 1 秒。
- `supreme`:在 `grand` 基础上触发全屏烟花和"状元"大印章。

#### Scenario: 小奖无震屏
- **WHEN** 结果为一秀
- **THEN** 舞台不触发震屏,不触发烟花

#### Scenario: 状元全屏反馈
- **WHEN** 结果为状元插金花
- **THEN** 出现全屏烟花与"状元"大印章,舞台震屏一次,对手显示懊恼表情

### Requirement: 印章与分数滚动
结果区 SHALL 显示牌型名称和本次得分。得分 MUST 从 0 滚动到目标值,滚动时长不超过 800ms;状态条的累计分在滚动结束后同步更新。显示的牌型名和得分 MUST 与判奖结果一致。

#### Scenario: 得分与奖项一致
- **WHEN** 结果为三红
- **THEN** 结果区显示"三红",得分滚动到 100,累计分增加 100

### Requirement: 对手反应与台词
每次结果展示时,对手 SHALL 按档位切换表情并显示一句台词。`none` 与 `minor` 用得意,`major` 用平常,`grand` 与 `supreme` 用懊恼。台词从按档位分组的文案池中选取,选取使用可注入的随机数来源。

#### Scenario: 档位决定表情
- **WHEN** 结果为四进(`major`)
- **THEN** 对手显示平常表情

#### Scenario: 台词来自对应档位
- **WHEN** 结果为无奖
- **THEN** 台词气泡文案属于 `none` 档位的文案池

### Requirement: 音效与静音
系统 SHALL 用 WebAudio 合成以下音效:摇碗、骰子落定、中奖、状元。音频上下文 MUST 在用户第一次点击后才创建或恢复。静音按钮 MUST 使所有音效不再播放,并且静音状态 SHALL 持久化到 `localStorage`。

#### Scenario: 静音生效
- **WHEN** 玩家开启静音后摇碗
- **THEN** 不发出任何音效

#### Scenario: 静音状态保留
- **WHEN** 玩家静音后刷新页面
- **THEN** 静音按钮保持静音状态

#### Scenario: 首次点击前不发声
- **WHEN** 页面刚加载,玩家尚未进行任何点击
- **THEN** 不创建音频上下文,不播放任何声音

### Requirement: 结果可被读屏获取
结果区 MUST 使用 `aria-live="polite"` 区域,在落定后播报牌型名称和得分。视觉特效 MUST NOT 是传达结果的唯一方式。

#### Scenario: 读屏播报
- **WHEN** 结果为二举,得分 20
- **THEN** live 区域文本包含"二举"和"20"
