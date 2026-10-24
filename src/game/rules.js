/**
 * 博饼判奖。纯函数:无副作用、不读取随机数、与骰子顺序无关。
 */

const NO_AWARD = Object.freeze({ awardId: null, label: '没中' });

/** 校验输入:必须是 6 个 1 到 6 的整数,否则抛 RangeError。 */
function assertDice(dice) {
  if (!Array.isArray(dice) || dice.length !== 6) {
    throw new RangeError('dice 必须是长度为 6 的数组');
  }
  for (const d of dice) {
    if (!Number.isInteger(d) || d < 1 || d > 6) {
      throw new RangeError(`非法点数: ${String(d)}`);
    }
  }
}

/**
 * 判定一次掷骰的奖项。
 * @param {number[]} dice 6 个 1 到 6 的整数
 * @returns {{ awardId: string|null, label: string }}
 */
export function evaluateRoll(dice) {
  assertDice(dice);
  return evaluateDice(dice);
}

/** 扩展桌面用真实5～8颗骰子判奖；原六骰入口保留严格输入约定。 */
export function evaluateDice(dice) {
  if (!Array.isArray(dice) || dice.length < 5 || dice.length > 8 || dice.some(value => !Number.isInteger(value) || value < 1 || value > 6)) {
    throw new RangeError('骰子必须为5～8颗，点数为1～6整数');
  }

  // counts[v] = 点数 v 出现的次数,下标 0 不用
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const d of dice) counts[d] += 1;

  const reds = counts[4];
  const faces = [1, 2, 3, 4, 5, 6];
  const hasCount = (n, pred = () => true) => faces.some((v) => counts[v] >= n && pred(v));

  // 新的七/八同点优先于原状元等级，奖项积分仍统一为1000分。
  for (const count of [8, 7]) {
    const prefix = count === 8 ? '八' : '七';
    if (reds >= count) return { awardId: 'zhuangyuan', label: `${prefix}杯红` };
    if (counts[1] >= count) return { awardId: 'zhuangyuan', label: `${prefix}子锦` };
    if (hasCount(count)) return { awardId: 'zhuangyuan', label: `${prefix}杯黑` };
  }

  // 状元(按 spec 表的顺序,条件互斥)
  if (reds >= 6) return { awardId: 'zhuangyuan', label: '六杯红' };
  if (reds >= 5) return { awardId: 'zhuangyuan', label: '五红' };
  if (reds >= 4 && counts[1] >= 2) return { awardId: 'zhuangyuan', label: '状元插金花' };
  if (reds >= 4) return { awardId: 'zhuangyuan', label: '四点红' };
  if (counts[1] >= 6) return { awardId: 'zhuangyuan', label: '遍地锦' };
  if (hasCount(6, (v) => v !== 1 && v !== 4)) return { awardId: 'zhuangyuan', label: '六杯黑' };
  if (hasCount(5, (v) => v !== 4)) return { awardId: 'zhuangyuan', label: '五子登科' };

  // 对堂:1 到 6 各一个
  if (faces.every((v) => counts[v] >= 1)) return { awardId: 'duitang', label: '对堂' };

  if (reds === 3) return { awardId: 'sanhong', label: '三红' };
  if (hasCount(4, (v) => v !== 4)) return { awardId: 'sijin', label: '四进' };
  if (reds === 2) return { awardId: 'erju', label: '二举' };
  if (reds === 1) return { awardId: 'yixiu', label: '一秀' };

  return NO_AWARD;
}

const championRanks = ['五子登科', '六杯黑', '遍地锦', '四点红', '状元插金花', '五红', '六杯红', '七杯黑', '七子锦', '七杯红', '八杯黑', '八子锦', '八杯红'];

/** 数值只用于同分比较和选骰，不改变奖池或基础奖金。 */
export function rollRank(result) {
  if (result.awardId === 'zhuangyuan') return 100 + championRanks.indexOf(result.label);
  return { duitang: 60, sanhong: 50, sijin: 40, erju: 30, yixiu: 20 }[result.awardId] || 0;
}
