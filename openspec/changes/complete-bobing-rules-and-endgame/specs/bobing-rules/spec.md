## ADDED Requirements

### Requirement: 骰型判定函数
系统 SHALL 提供纯函数 `evaluateRoll(dice)`,输入为 6 个 1 到 6 的整数,返回 `{ awardId, label }`。`awardId` 取值为 `zhuangyuan`、`duitang`、`sanhong`、`sijin`、`erju`、`yixiu` 之一,无奖时为 `null`。`label` 为展示名称。该函数 MUST 与骰子顺序无关,且 MUST 无副作用、不读取随机数。

#### Scenario: 结果与顺序无关
- **WHEN** 分别传入 `[4,1,4,2,4,3]` 和 `[1,2,3,4,4,4]`
- **THEN** 两次都返回 `awardId` 为 `sanhong`

#### Scenario: 非法输入
- **WHEN** 传入长度不是 6 的数组,或包含 0、7、小数、非数字
- **THEN** 函数抛出 `RangeError`

### Requirement: 状元分档
状元 SHALL 包含下列骰型,`awardId` 均为 `zhuangyuan`,`label` 为对应名称:

| label | 条件 |
| --- | --- |
| 六杯红 | 六个 4 |
| 五红 | 恰好五个 4 |
| 状元插金花 | 四个 4 加两个 1 |
| 四点红 | 恰好四个 4,且另外两个不全是 1 |
| 遍地锦 | 六个 1 |
| 六杯黑 | 六个相同,且点数不是 1 也不是 4 |
| 五子登科 | 恰好五个相同,且点数不是 4 |

#### Scenario: 六杯红
- **WHEN** 掷出 `[4,4,4,4,4,4]`
- **THEN** 返回 `awardId` 为 `zhuangyuan`,`label` 为 `六杯红`

#### Scenario: 状元插金花
- **WHEN** 掷出 `[4,4,4,4,1,1]`
- **THEN** 返回 `label` 为 `状元插金花`,而不是 `四点红`

#### Scenario: 四点红
- **WHEN** 掷出 `[4,4,4,4,2,5]`
- **THEN** 返回 `label` 为 `四点红`

#### Scenario: 五子登科
- **WHEN** 掷出 `[2,2,2,2,2,5]`
- **THEN** 返回 `awardId` 为 `zhuangyuan`,`label` 为 `五子登科`

#### Scenario: 遍地锦与六杯黑
- **WHEN** 分别掷出 `[1,1,1,1,1,1]` 和 `[3,3,3,3,3,3]`
- **THEN** 前者 `label` 为 `遍地锦`,后者 `label` 为 `六杯黑`

### Requirement: 对堂
当六颗骰子恰好包含 1 到 6 各一个时,系统 MUST 判为 `duitang`,`label` 为 `对堂`。

#### Scenario: 顺序无关的对堂
- **WHEN** 掷出 `[6,3,1,5,4,2]`
- **THEN** 返回 `awardId` 为 `duitang`

### Requirement: 三红
当恰好有三个 4,且不满足状元或对堂时,系统 MUST 判为 `sanhong`,`label` 为 `三红`。

#### Scenario: 三红
- **WHEN** 掷出 `[4,4,4,1,2,6]`
- **THEN** 返回 `awardId` 为 `sanhong`

### Requirement: 四进
当恰好有四个相同且点数不是 4 的骰子,并且不满足状元时,系统 MUST 判为 `sijin`,`label` 为 `四进`。剩余两颗是否为 4 不影响判定。

#### Scenario: 四进
- **WHEN** 掷出 `[2,2,2,2,3,5]`
- **THEN** 返回 `awardId` 为 `sijin`

#### Scenario: 四进压过二举
- **WHEN** 掷出 `[2,2,2,2,4,4]`
- **THEN** 返回 `awardId` 为 `sijin`,而不是 `erju`

### Requirement: 二举与一秀
当恰好有两个 4,且不满足更高优先级骰型时,系统 MUST 判为 `erju`。当恰好有一个 4,且不满足更高优先级骰型时,系统 MUST 判为 `yixiu`。

#### Scenario: 二举
- **WHEN** 掷出 `[4,4,1,2,3,3]`
- **THEN** 返回 `awardId` 为 `erju`

#### Scenario: 一秀
- **WHEN** 掷出 `[4,1,1,2,3,3]`
- **THEN** 返回 `awardId` 为 `yixiu`

#### Scenario: 对堂压过一秀
- **WHEN** 掷出 `[1,2,3,4,5,6]`
- **THEN** 返回 `awardId` 为 `duitang`,而不是 `yixiu`

### Requirement: 奖项优先级
当一次掷骰同时满足多个骰型时,系统 MUST 按以下顺序取最高者:状元、对堂、三红、四进、二举、一秀。

#### Scenario: 多骰型同时成立
- **WHEN** 掷出 `[4,4,4,4,1,1]`
- **THEN** 返回状元档,不返回三红、二举或一秀

### Requirement: 无奖
当没有 4,并且不满足状元、对堂、四进时,系统 MUST 返回 `awardId` 为 `null`。

#### Scenario: 无奖
- **WHEN** 掷出 `[1,2,3,3,5,6]`
- **THEN** 返回 `awardId` 为 `null`

### Requirement: 玩家与机器人共用判奖
玩家和所有机器人的掷骰结果 MUST 都通过 `evaluateRoll` 判奖,系统 SHALL NOT 在其他位置重复实现判奖逻辑。

#### Scenario: 两个 4 的判定一致
- **WHEN** 玩家与机器人分别掷出恰好两个 4 且无更高骰型
- **THEN** 两者都获得 `erju`
