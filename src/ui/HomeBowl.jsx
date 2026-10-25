import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DiceBowl } from './PaperPrimitives';
import { rollDice, useRollSequence } from '../scene/useRollSequence.js';
import { audioController } from '../audio';

/** 首页骰碗：点击碗身或摇一摇手机都触发一次完整博饼，判奖与对局同一套规则。 */
export default function HomeBowl() {
  const [reducedMotion, setReducedMotion] = useState(() => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return;
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const { dice, settled, shown, busy, roll } = useRollSequence({
    reducedMotion,
    onStart: () => audioController.play('sfx.dice.roll'),
    onShown: result => audioController.play(result.awardId === 'zhuangyuan' ? 'sfx.reward.champion' : result.awardId ? 'sfx.reward.win' : 'sfx.dice.settle'),
  });

  // 摇碗途中每 90ms 换一次随机点数；已落定的骰子停在自己的真实点数上。
  const [tumble, setTumble] = useState(null);
  useEffect(() => {
    if (!busy) { setTumble(null); return; }
    const timer = window.setInterval(() => setTumble(rollDice()), 90);
    return () => window.clearInterval(timer);
  }, [busy]);

  const displayDice = useMemo(() => (busy ? dice.map((value, index) => (settled[index] ? value : tumble?.[index] ?? value)) : dice), [busy, dice, settled, tumble]);
  const rollingIndices = busy ? displayDice.map((_, index) => index).filter(index => !settled[index]) : [];

  const motionRef = useRef({ x: 0, y: 0, z: 0, lastShake: 0 });
  const [motionReady, setMotionReady] = useState(false);
  /** iOS 只能在用户手势里申请动作权限；其他平台直接监听传感器即可。 */
  const requestMotion = useCallback(async () => {
    const MotionEvent = window.DeviceMotionEvent;
    if (typeof MotionEvent?.requestPermission !== 'function') { setMotionReady(true); return; }
    try {
      if (await MotionEvent.requestPermission() === 'granted') setMotionReady(true);
    } catch {
      // 拒绝或不可用时保留点击博饼，不阻断首页其他操作。
    }
  }, []);

  useEffect(() => {
    if (typeof window.DeviceMotionEvent?.requestPermission === 'function') return;
    setMotionReady(true);
  }, []);

  useEffect(() => {
    if (!motionReady) return;
    const onMotion = event => {
      const acceleration = event.accelerationIncludingGravity || event.acceleration;
      if (!acceleration) return;
      const previous = motionRef.current;
      const current = { x: acceleration.x || 0, y: acceleration.y || 0, z: acceleration.z || 0 };
      const delta = Math.abs(current.x - previous.x) + Math.abs(current.y - previous.y) + Math.abs(current.z - previous.z);
      const now = Date.now();
      const triggered = delta > 22 && now - previous.lastShake > 900;
      motionRef.current = { ...current, lastShake: triggered ? now : previous.lastShake };
      if (triggered) roll();
    };
    window.addEventListener('devicemotion', onMotion);
    return () => window.removeEventListener('devicemotion', onMotion);
  }, [motionReady, roll]);

  /** 点击与摇一摇共用同一次演出；iOS 首次点击时顺带申请传感器权限。 */
  const shakeBowl = () => {
    roll();
    navigator.vibrate?.([25, 30, 25]);
    if (!motionReady) requestMotion();
  };

  const caption = busy ? '骰子落金盘 · 好运将至'
    : shown ? `${shown.label}${shown.points ? ` · ${shown.points} 分` : ''}`
      : motionReady ? '点击骰碗或摇一摇，都能博一饼' : '点击骰碗，博一饼好彩头';

  return <div className="paper-home-bowl">
    <button type="button" className="paper-home-bowl-trigger" onClick={shakeBowl} aria-label="摇一碗好彩头：点击或摇动手机都可以博一次饼">
      <DiceBowl dice={displayDice} rolling={busy} rollingIndices={rollingIndices} />
    </button>
    <p className={`paper-home-bowl-caption tier-${shown?.tier || 'none'} ${busy ? 'is-rolling' : ''}`} role="status" aria-live="polite">{caption}</p>
  </div>;
}
