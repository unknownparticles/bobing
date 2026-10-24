import { describe, expect, it } from 'vitest';
import { evaluateRoll } from './rules.js';
import { AWARDS, pointsOf } from './config.js';

const VALID_IDS = new Set([null, ...AWARDS.map((a) => a.id)]);

describe('evaluateRoll 分档(对应 bobing-rules spec 场景)', () => {
  const cases = [
    // 状元各档
    ['六杯红', [4, 4, 4, 4, 4, 4], 'zhuangyuan', '六杯红'],
    ['五红', [4, 4, 4, 4, 4, 2], 'zhuangyuan', '五红'],
    ['状元插金花', [4, 4, 4, 4, 1, 1], 'zhuangyuan', '状元插金花'],
    ['四点红', [4, 4, 4, 4, 2, 5], 'zhuangyuan', '四点红'],
    ['四点红(带一个 1)', [4, 4, 4, 4, 1, 2], 'zhuangyuan', '四点红'],
    ['遍地锦', [1, 1, 1, 1, 1, 1], 'zhuangyuan', '遍地锦'],
    ['六杯黑', [3, 3, 3, 3, 3, 3], 'zhuangyuan', '六杯黑'],
    ['五子登科', [2, 2, 2, 2, 2, 5], 'zhuangyuan', '五子登科'],
    ['五个 1 算五子登科', [1, 1, 1, 1, 1, 6], 'zhuangyuan', '五子登科'],
    // 其他档
    ['对堂', [6, 3, 1, 5, 4, 2], 'duitang', '对堂'],
    ['三红', [4, 4, 4, 1, 2, 6], 'sanhong', '三红'],
    ['四进', [2, 2, 2, 2, 3, 5], 'sijin', '四进'],
    ['四进压过二举', [2, 2, 2, 2, 4, 4], 'sijin', '四进'],
    ['四进压过一秀', [2, 2, 2, 2, 4, 3], 'sijin', '四进'],
    ['二举', [4, 4, 1, 2, 3, 3], 'erju', '二举'],
    ['一秀', [4, 1, 1, 2, 3, 3], 'yixiu', '一秀'],
    ['对堂压过一秀', [1, 2, 3, 4, 5, 6], 'duitang', '对堂'],
    ['三红压过四个以外的同点', [4, 4, 4, 2, 2, 2], 'sanhong', '三红'],
    ['无奖', [1, 2, 3, 3, 5, 6], null, '没中'],
    ['无奖(两对加两个单)', [1, 1, 2, 2, 3, 5], null, '没中'],
  ];

  it.each(cases)('%s', (_name, dice, awardId, label) => {
    expect(evaluateRoll(dice)).toEqual({ awardId, label });
  });

  it('结果与顺序无关', () => {
    expect(evaluateRoll([4, 1, 4, 2, 4, 3]).awardId).toBe('sanhong');
    expect(evaluateRoll([1, 2, 3, 4, 4, 4]).awardId).toBe('sanhong');
  });

  it('多骰型同时成立时取最高档', () => {
    expect(evaluateRoll([4, 4, 4, 4, 1, 1]).awardId).toBe('zhuangyuan');
  });
});

describe('evaluateRoll 非法输入', () => {
  const bad = [
    ['长度不足', [1, 2, 3, 4, 5]],
    ['长度过长', [1, 2, 3, 4, 5, 6, 1]],
    ['含 0', [0, 1, 2, 3, 4, 5]],
    ['含 7', [1, 2, 3, 4, 5, 7]],
    ['含小数', [1, 2, 3, 4, 5, 1.5]],
    ['含字符串', [1, 2, 3, 4, 5, '6']],
    ['含 NaN', [1, 2, 3, 4, 5, NaN]],
    ['不是数组', 'abcdef'],
    ['undefined', undefined],
  ];

  it.each(bad)('%s 抛 RangeError', (_name, input) => {
    expect(() => evaluateRoll(input)).toThrow(RangeError);
  });
});

describe('evaluateRoll 穷举 6^6', () => {
  it('所有有序结果都返回合法值,且与排序后的结果一致', () => {
    let total = 0;
    const seen = new Map();
    const dice = [1, 1, 1, 1, 1, 1];

    const walk = (i) => {
      if (i === 6) {
        total += 1;
        const result = evaluateRoll(dice);
        expect(VALID_IDS.has(result.awardId)).toBe(true);
        expect(typeof result.label).toBe('string');

        const sorted = [...dice].sort((a, b) => a - b);
        expect(evaluateRoll(sorted)).toEqual(result);

        seen.set(result.awardId, (seen.get(result.awardId) ?? 0) + 1);
        return;
      }
      for (let v = 1; v <= 6; v += 1) {
        dice[i] = v;
        walk(i + 1);
      }
    };
    walk(0);

    expect(total).toBe(46656);
    // 每一档在穷举中都至少出现一次,说明没有被前面的规则完全遮蔽
    for (const id of VALID_IDS) expect(seen.get(id) ?? 0).toBeGreaterThan(0);
  });
});

describe('config 奖项表', () => {
  it('pointsOf 对无奖与未知 id 返回 0', () => {
    expect(pointsOf(null)).toBe(0);
    expect(pointsOf('nope')).toBe(0);
  });

  it('积分与 prize-pool spec 一致', () => {
    expect(pointsOf('yixiu')).toBe(10);
    expect(pointsOf('erju')).toBe(20);
    expect(pointsOf('sijin')).toBe(80);
    expect(pointsOf('sanhong')).toBe(100);
    expect(pointsOf('duitang')).toBe(500);
    expect(pointsOf('zhuangyuan')).toBe(1000);
  });
});
