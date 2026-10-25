import { useEffect, useState } from 'react';
import { changeFrames, rollFrames } from './dice-animation';

/** 只播放已经结算的点数；动画结束通知 SHOW_ROLL，卸载或切换效果时取消旧回调。 */
export function useDiceAnimation(game, dispatch) {
  const [display, setDisplay] = useState(null);
  const [reduced, setReduced] = useState(() => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return;
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const visual = game.visuals?.[0];
  const pendingChange = game.visuals?.find(event => event.diceChange)?.diceChange;
  const playingRoll = game.stage === 'rolling' && !visual;
  const key = `${game.id}:${game.throwCount}:${playingRoll ? 'roll' : visual?.id || game.stage}:${reduced}`;
  const frames = playingRoll ? rollFrames(game, reduced) : visual?.diceChange ? changeFrames(visual.diceChange.before, visual.diceChange.after, visual.title) : [];

  useEffect(() => {
    if (!frames.length) return;
    const timers = [];
    let interval;
    const show = frame => {
      window.clearInterval(interval);
      setDisplay({ key, frame });
      if (frame.phase !== 'rolling') return;
      interval = window.setInterval(() => {
        // 视觉跳点只改指定骰子，且不消耗规则使用的随机数序列。
        const dice = frame.dice.map((value, index) => frame.rollingIndices.includes(index) ? 1 + Math.floor(Math.random() * 6) : value);
        setDisplay({ key, frame: { ...frame, dice } });
      }, 80);
    };
    let elapsed = 0;
    frames.forEach((frame, index) => {
      if (index === 0) show(frame);
      else timers.push(window.setTimeout(() => show(frame), elapsed));
      elapsed += frame.duration;
    });
    if (playingRoll) timers.push(window.setTimeout(() => {
      window.clearInterval(interval);
      dispatch({ type: 'SHOW_ROLL' });
    }, elapsed));
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearInterval(interval);
    };
    // key 只在新投掷、队列切换或动态偏好改变时更新，存档同步不会重播同一段动画。
  }, [key, dispatch]);

  if (frames.length) return display?.key === key ? display.frame : frames[0];
  const trace = game.rollPresentation;
  const completed = trace && ['review', 'settled'].includes(game.stage);
  return {
    phase: completed ? 'complete' : 'idle', dice: pendingChange?.before || game.dice,
    ...(completed ? { ...trace, revealedCount: trace.candidates.length } : {}),
    rollingIndices: [],
  };
}
