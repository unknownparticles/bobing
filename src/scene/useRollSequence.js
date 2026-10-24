import { useCallback, useEffect, useRef, useState } from 'react';
import { pointsOf } from '../game/config.js';
import { evaluateRoll } from '../game/rules.js';
import { tierOf } from './tier.js';

/**
 * 掷骰时间线。
 * 点数在 roll() 被调用的瞬间一次性确定并判奖,动画只负责表现:
 *   0 ~ shakeMs            摇碗
 *   shakeMs ~ +tossMs      抛出(骰子翻滚)
 *   之后每隔 settleGapMs   依次落定一颗
 *   最后一颗落定 + resultDelayMs 后展示结果
 */
export const DICE_COUNT = 6;
export const TIMING = Object.freeze({
  shakeMs: 500,
  tossMs: 600,
  settleGapMs: 90,
  resultDelayMs: 120,
});

/** 第 i 颗骰子落定的时刻(自点击起,毫秒)。 */
export const dieSettleAt = (i) => TIMING.shakeMs + TIMING.tossMs + i * TIMING.settleGapMs;

/** 从点击到展示结果的总时长。 */
export const totalDurationMs = () => dieSettleAt(DICE_COUNT - 1) + TIMING.resultDelayMs;

/** 第 i 颗骰子的翻滚时长:略短于落定时刻,保证视觉先于状态结束。 */
export const tumbleMsOf = (i) => dieSettleAt(i) - TIMING.shakeMs - 20;

/** 用 rng(返回 [0,1))生成 6 个点数。 */
export function rollDice(rng = Math.random) {
  return Array.from({ length: DICE_COUNT }, () => Math.min(5, Math.floor(rng() * 6)) + 1);
}

let nextResultId = 0;

/** 根据点数构造一次完整结果(含判奖、积分、档位)。 */
export function buildResult(dice) {
  const { awardId, label } = evaluateRoll(dice);
  nextResultId += 1;
  return {
    id: nextResultId,
    dice,
    awardId,
    label,
    points: pointsOf(awardId),
    tier: tierOf(awardId),
  };
}

const INITIAL_DICE = Object.freeze([4, 2, 6, 1, 5, 3]);
const allSettled = (value) => Array.from({ length: DICE_COUNT }, () => value);
const initialState = () => ({
  phase: 'idle', // idle | shaking | tossing | shown
  dice: [...INITIAL_DICE],
  settled: allSettled(false),
  shown: null,
});

/**
 * @param {object} options
 * @param {() => number} [options.rng] 随机数来源,默认 Math.random
 * @param {boolean} [options.reducedMotion] 减少动态效果:跳过演出直接展示结果
 * @param {(result) => void} [options.onStart] 点数已确定、演出开始时调用
 * @param {(index:number, value:number) => void} [options.onDieSettle] 每颗骰子落定时调用
 * @param {(result) => void} [options.onShown] 结果展示时调用,每次摇碗恰好一次
 */
export function useRollSequence({
  rng = Math.random,
  reducedMotion = false,
  onStart,
  onDieSettle,
  onShown,
} = {}) {
  const [state, setState] = useState(initialState);
  const timers = useRef([]);
  const committed = useRef(null);
  const shownDone = useRef(true); // 没有进行中的演出时为 true
  const live = useRef({ rng, reducedMotion, onStart, onDieSettle, onShown });

  // 回调与配置总是取最新值,避免定时器里读到旧闭包
  useEffect(() => {
    live.current = { rng, reducedMotion, onStart, onDieSettle, onShown };
  });

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const later = useCallback((ms, fn) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  /** 展示结果。用 shownDone 去重,保证反馈只触发一次。 */
  const finish = useCallback(() => {
    if (shownDone.current) return;
    shownDone.current = true;
    clearTimers();
    const result = committed.current;
    setState({ phase: 'shown', dice: [...result.dice], settled: allSettled(true), shown: result });
    live.current.onShown?.(result);
  }, [clearTimers]);

  const roll = useCallback(() => {
    if (!shownDone.current) return; // 演出中不接受新的摇碗
    clearTimers();

    const result = buildResult(rollDice(live.current.rng));
    committed.current = result;
    shownDone.current = false;
    live.current.onStart?.(result);

    if (live.current.reducedMotion) {
      finish();
      return;
    }

    setState((s) => ({ ...s, phase: 'shaking', settled: allSettled(false), shown: null }));
    later(TIMING.shakeMs, () => {
      setState((s) => ({ ...s, phase: 'tossing', dice: [...result.dice] }));
    });
    result.dice.forEach((value, i) => {
      later(dieSettleAt(i), () => {
        setState((s) => {
          const settled = s.settled.slice();
          settled[i] = true;
          return { ...s, settled };
        });
        live.current.onDieSettle?.(i, value);
      });
    });
    later(totalDurationMs(), finish);
  }, [clearTimers, finish, later]);

  /** 跳过动画:直接到最终状态,不改变结果。 */
  const skip = useCallback(() => {
    finish();
  }, [finish]);

  /** 丢弃进行中的演出并回到初始状态(新一桌)。 */
  const reset = useCallback(() => {
    clearTimers();
    committed.current = null;
    shownDone.current = true;
    setState(initialState());
  }, [clearTimers]);

  // 卸载时清理所有定时器,旧演出不再修改状态
  useEffect(() => clearTimers, [clearTimers]);

  return {
    ...state,
    busy: state.phase === 'shaking' || state.phase === 'tossing',
    roll,
    skip,
    reset,
  };
}
