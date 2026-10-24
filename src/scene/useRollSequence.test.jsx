// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TIMING,
  buildResult,
  dieSettleAt,
  rollDice,
  totalDurationMs,
  useRollSequence,
} from './useRollSequence.js';

/** 依次返回给定点数对应的 rng 值(点数 v 对应 (v-1)/6 + 一点余量)。 */
const rngFor = (dice) => {
  let i = 0;
  return () => (dice[i++ % dice.length] - 1) / 6 + 0.01;
};

beforeEach(() => {
  vi.useFakeTimers();
  // 让 React 的 act 环境生效
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('时间线常量', () => {
  it('总时长不超过 2200ms', () => {
    expect(totalDurationMs()).toBeLessThanOrEqual(2200);
  });

  it('相邻两颗骰子落定间隔在 60 到 120ms 之间', () => {
    for (let i = 1; i < 6; i += 1) {
      const gap = dieSettleAt(i) - dieSettleAt(i - 1);
      expect(gap).toBeGreaterThanOrEqual(60);
      expect(gap).toBeLessThanOrEqual(120);
    }
  });
});

describe('rollDice / buildResult', () => {
  it('固定 rng 可复现', () => {
    const a = rollDice(rngFor([4, 4, 1, 2, 3, 3]));
    const b = rollDice(rngFor([4, 4, 1, 2, 3, 3]));
    expect(a).toEqual([4, 4, 1, 2, 3, 3]);
    expect(b).toEqual(a);
  });

  it('rng 返回 0.999… 时点数不越界', () => {
    expect(rollDice(() => 0.9999999999)).toEqual([6, 6, 6, 6, 6, 6]);
    expect(rollDice(() => 0)).toEqual([1, 1, 1, 1, 1, 1]);
  });

  it('结果包含判奖、积分与档位', () => {
    const r = buildResult([4, 4, 4, 1, 2, 6]);
    expect(r).toMatchObject({ awardId: 'sanhong', label: '三红', points: 100, tier: 'major' });
  });
});

describe('useRollSequence', () => {
  it('点数在开始时就已确定,动画不改变结果,只展示一次', () => {
    const onStart = vi.fn();
    const onShown = vi.fn();
    const { result } = renderHook(() =>
      useRollSequence({ rng: rngFor([4, 4, 1, 2, 3, 3]), onStart, onShown }),
    );

    act(() => result.current.roll());
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart.mock.calls[0][0]).toMatchObject({ awardId: 'erju', points: 20 });
    expect(onShown).not.toHaveBeenCalled();
    expect(result.current.shown).toBeNull(); // 动画期间不泄露结果
    expect(result.current.busy).toBe(true);

    act(() => vi.advanceTimersByTime(totalDurationMs() + 50));
    expect(onShown).toHaveBeenCalledTimes(1);
    expect(onShown.mock.calls[0][0]).toMatchObject({ awardId: 'erju', points: 20 });
    expect(result.current.phase).toBe('shown');
    expect(result.current.dice).toEqual([4, 4, 1, 2, 3, 3]);
    expect(result.current.busy).toBe(false);
  });

  it('逐颗落定,每颗触发一次 onDieSettle', () => {
    const onDieSettle = vi.fn();
    const { result } = renderHook(() =>
      useRollSequence({ rng: rngFor([4, 2, 6, 1, 5, 3]), onDieSettle }),
    );
    act(() => result.current.roll());

    act(() => vi.advanceTimersByTime(dieSettleAt(0) + 1));
    expect(result.current.settled.filter(Boolean)).toHaveLength(1);
    expect(onDieSettle).toHaveBeenLastCalledWith(0, 4);

    act(() => vi.advanceTimersByTime(TIMING.settleGapMs * 2));
    expect(result.current.settled.filter(Boolean)).toHaveLength(3);

    act(() => vi.advanceTimersByTime(totalDurationMs()));
    expect(onDieSettle).toHaveBeenCalledTimes(6);
    expect(onDieSettle.mock.calls.map((c) => c[1])).toEqual([4, 2, 6, 1, 5, 3]);
  });

  it('演出中再次 roll 被忽略', () => {
    const onStart = vi.fn();
    const { result } = renderHook(() => useRollSequence({ rng: rngFor([4, 1, 2, 3, 5, 6]), onStart }));
    act(() => result.current.roll());
    act(() => result.current.roll());
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('跳过:立即到最终状态,反馈只触发一次', () => {
    const onShown = vi.fn();
    const { result } = renderHook(() =>
      useRollSequence({ rng: rngFor([4, 4, 4, 4, 1, 1]), onShown }),
    );
    act(() => result.current.roll());
    act(() => vi.advanceTimersByTime(700)); // 抛出阶段
    expect(result.current.phase).toBe('tossing');

    act(() => result.current.skip());
    expect(result.current.phase).toBe('shown');
    expect(result.current.settled.every(Boolean)).toBe(true);
    expect(result.current.dice).toEqual([4, 4, 4, 4, 1, 1]);
    expect(onShown).toHaveBeenCalledTimes(1);

    // 原定时器不会再触发第二次
    act(() => vi.advanceTimersByTime(5000));
    expect(onShown).toHaveBeenCalledTimes(1);
    // 多次跳过也不会重复
    act(() => result.current.skip());
    expect(onShown).toHaveBeenCalledTimes(1);
  });

  it('没有进行中的演出时 skip 无效', () => {
    const onShown = vi.fn();
    const { result } = renderHook(() => useRollSequence({ onShown }));
    act(() => result.current.skip());
    expect(onShown).not.toHaveBeenCalled();
    expect(result.current.phase).toBe('idle');
  });

  it('卸载后旧演出的定时器不再触发', () => {
    const onShown = vi.fn();
    const onDieSettle = vi.fn();
    const { result, unmount } = renderHook(() =>
      useRollSequence({ rng: rngFor([4, 1, 2, 3, 5, 6]), onShown, onDieSettle }),
    );
    act(() => result.current.roll());
    unmount();
    vi.advanceTimersByTime(5000);
    expect(onShown).not.toHaveBeenCalled();
    expect(onDieSettle).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reset 丢弃进行中的演出,旧演出不影响新状态', () => {
    const onShown = vi.fn();
    const { result } = renderHook(() =>
      useRollSequence({ rng: rngFor([4, 1, 2, 3, 5, 6]), onShown }),
    );
    act(() => result.current.roll());
    act(() => vi.advanceTimersByTime(300));
    act(() => result.current.reset());
    expect(result.current.phase).toBe('idle');
    expect(result.current.shown).toBeNull();

    act(() => vi.advanceTimersByTime(5000));
    expect(onShown).not.toHaveBeenCalled();
    expect(result.current.phase).toBe('idle');
  });

  it('reset 后可以再次摇碗', () => {
    const onShown = vi.fn();
    const { result } = renderHook(() =>
      useRollSequence({ rng: rngFor([4, 1, 2, 3, 5, 6]), onShown }),
    );
    act(() => result.current.roll());
    act(() => result.current.reset());
    act(() => result.current.roll());
    act(() => vi.advanceTimersByTime(totalDurationMs() + 50));
    expect(onShown).toHaveBeenCalledTimes(1);
  });

  it('减少动态效果:不经过动画,直接展示最终点数', () => {
    const onShown = vi.fn();
    const { result } = renderHook(() =>
      useRollSequence({ rng: rngFor([4, 4, 1, 2, 3, 3]), reducedMotion: true, onShown }),
    );
    act(() => result.current.roll());
    expect(result.current.phase).toBe('shown');
    expect(result.current.busy).toBe(false);
    expect(result.current.dice).toEqual([4, 4, 1, 2, 3, 3]);
    expect(onShown).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('同一次摇碗里使用 rng 的次数固定为 6,不会重抽', () => {
    const rng = vi.fn(rngFor([4, 4, 1, 2, 3, 3]));
    const { result } = renderHook(() => useRollSequence({ rng }));
    act(() => result.current.roll());
    act(() => vi.advanceTimersByTime(totalDurationMs() + 50));
    expect(rng).toHaveBeenCalledTimes(6);
  });
});
