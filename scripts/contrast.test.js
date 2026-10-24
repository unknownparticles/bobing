import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  checkPairs,
  contrastRatio,
  parseColorTokens,
  parseFontSizeTokens,
  parseHex,
} from './contrast-lib.mjs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const tokensCss = read('../src/styles/tokens.css');
const pairs = JSON.parse(read('./contrast-pairs.json'));

describe('对比度计算', () => {
  it('黑白对比度为 21', () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
  });

  it('相同颜色对比度为 1', () => {
    expect(contrastRatio([10, 20, 30], [10, 20, 30])).toBeCloseTo(1, 5);
  });

  it('parseHex 支持 3 位与 6 位,非法返回 null', () => {
    expect(parseHex('#fff')).toEqual([255, 255, 255]);
    expect(parseHex('#b3261e')).toEqual([179, 38, 30]);
    expect(parseHex('red')).toBeNull();
    expect(parseHex('#12')).toBeNull();
  });
});

describe('checkPairs', () => {
  it('不达标的配对被列入 failures', () => {
    const tokens = { a: '#777777', b: '#888888' };
    const { failures } = checkPairs([{ fg: 'a', bg: 'b', min: 4.5 }], tokens);
    expect(failures).toHaveLength(1);
  });

  it('令牌缺失算失败', () => {
    const { failures } = checkPairs([{ fg: 'nope', bg: 'b', min: 4.5 }], { b: '#000000' });
    expect(failures).toHaveLength(1);
    expect(failures[0].reason).toBeTruthy();
  });
});

describe('真实令牌', () => {
  it('contrast-pairs.json 里声明的配对全部达标', () => {
    const { failures } = checkPairs(pairs, parseColorTokens(tokensCss));
    expect(failures).toEqual([]);
  });

  it('spec 要求的语义颜色令牌齐全', () => {
    const tokens = parseColorTokens(tokensCss);
    for (const name of [
      'color-night',
      'color-cloth',
      'color-vermilion',
      'color-gold',
      'color-cream',
      'color-porcelain',
    ]) {
      expect(tokens[name], name).toBeTruthy();
    }
  });

  it('字号令牌最小为 12px,主按钮相关尺寸满足触控要求', () => {
    const sizes = Object.values(parseFontSizeTokens(tokensCss));
    expect(sizes.length).toBeGreaterThan(0);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(12);
    expect(tokensCss).toMatch(/--tap-min:\s*44px/);
    expect(tokensCss).toMatch(/--button-primary-height:\s*(\d+)px/);
    const h = Number(/--button-primary-height:\s*(\d+)px/.exec(tokensCss)[1]);
    expect(h).toBeGreaterThanOrEqual(48);
  });
});
