import { describe, expect, it } from 'vitest';
import { AWARDS } from '../game/config.js';
import { atLeast, tierOf } from './tier.js';
import { EXPRESSIONS, LINES, expressionOf, pickLine } from './lines.js';

describe('tierOf', () => {
  it.each([
    [null, 'none'],
    ['yixiu', 'minor'],
    ['erju', 'minor'],
    ['sanhong', 'major'],
    ['sijin', 'major'],
    ['duitang', 'grand'],
    ['zhuangyuan', 'supreme'],
    ['unknown', 'none'],
  ])('%s -> %s', (awardId, tier) => {
    expect(tierOf(awardId)).toBe(tier);
  });

  it('奖项表里的每个奖项都有明确档位(不会落到 none)', () => {
    for (const a of AWARDS) expect(tierOf(a.id), a.id).not.toBe('none');
  });

  it('atLeast 按强度比较', () => {
    expect(atLeast('supreme', 'major')).toBe(true);
    expect(atLeast('minor', 'major')).toBe(false);
    expect(atLeast('major', 'major')).toBe(true);
  });
});

describe('对手表情与台词', () => {
  it.each([
    ['none', 'smug'],
    ['minor', 'smug'],
    ['major', 'neutral'],
    ['grand', 'upset'],
    ['supreme', 'upset'],
  ])('档位 %s 对应表情 %s', (tier, expr) => {
    expect(expressionOf(tier)).toBe(expr);
    expect(EXPRESSIONS).toContain(expr);
  });

  it('台词来自对应档位的文案池', () => {
    for (const tier of ['none', 'minor', 'major', 'grand', 'supreme']) {
      expect(LINES[tier]).toContain(pickLine(tier, () => 0));
      expect(LINES[tier]).toContain(pickLine(tier, () => 0.999999));
    }
  });

  it('固定 rng 得到固定台词', () => {
    expect(pickLine('none', () => 0.5)).toBe(pickLine('none', () => 0.5));
  });

  it('未知档位退回 idle 文案池', () => {
    expect(LINES.idle).toContain(pickLine('???', () => 0));
  });

  it('每个档位至少有一句台词', () => {
    for (const [tier, pool] of Object.entries(LINES)) {
      expect(pool.length, tier).toBeGreaterThan(0);
    }
  });
});
