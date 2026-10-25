import { useEffect, useRef, useState } from 'react';
import { scoreOf } from './state.js';
import { useGame } from './useGame.js';
import { useBanter } from './useBanter.js';
import PaperGame from '../ui/PaperGame.jsx';
import { useGameAudio } from './useGameAudio.js';

/** 单局桌面与轮间商店；模式配置决定人数和终局，晋级由 App 重新开局。 */
export default function Game({ players: initialPlayers, match, profile, archive, rewards, storageError, onProgress, muted, setMuted, audio, onHome, onContinue }) {
  const { game, dispatch, dice, presentation } = useGame(initialPlayers, match);
  useGameAudio(game, presentation, audio);
  const speech = useBanter(game);
  const [targetOpen, setTargetOpen] = useState(false);
  const [shakeReady, setShakeReady] = useState(false);
  const [motionMessage, setMotionMessage] = useState('');
  const motionRef = useRef({ x: 0, y: 0, z: 0, lastShake: 0 });
  const rollButton = useRef(null);
  const active = game.players[game.turnIndex];
  const you = game.players.find(player => player.id === 'you');
  const yourTurn = active.id === you.id;
  const ready = yourTurn && game.stage === 'ready';
  const rolling = game.stage === 'rolling';
  useEffect(() => { onProgress?.(game); }, [game.id, game.events.length, game.stage, onProgress]);
  const unlockedKey = archive?.unlockedContent.join(',') || '';
  useEffect(() => {
    if (archive) dispatch({ type: 'SYNC_UNLOCKS', unlockedContent: archive.unlockedContent });
  }, [unlockedKey]);

  useEffect(() => {
    if (ready) rollButton.current?.focus({ preventScroll: true });
  }, [ready]);

  useEffect(() => {
    // 离店、结算与重开都从顶部开始，避免继承长页面的滚动位置。
    window.scrollTo({ top: 0 });
  }, [game.round, game.stage === 'finished']);

  useEffect(() => {
    if (!shakeReady || !ready) return;
    const onMotion = event => {
      // 原生模态层只隔离点击和键盘；查图鉴或奖项时也要拦住传感器掷骰。
      if (document.querySelector('.guide-dialog[open]')) return;
      const acceleration = event.accelerationIncludingGravity || event.acceleration;
      if (!acceleration) return;
      const previous = motionRef.current;
      const current = { x: acceleration.x || 0, y: acceleration.y || 0, z: acceleration.z || 0 };
      const delta = Math.abs(current.x - previous.x) + Math.abs(current.y - previous.y) + Math.abs(current.z - previous.z);
      const now = Date.now();
      const triggered = delta > 22 && now - previous.lastShake > 900;
      motionRef.current = { ...current, lastShake: triggered ? now : previous.lastShake };
      if (triggered) { setTargetOpen(false); dispatch({ type: 'ROLL' }); }
    };
    window.addEventListener('devicemotion', onMotion);
    return () => window.removeEventListener('devicemotion', onMotion);
  }, [ready, shakeReady]);

  useEffect(() => {
    if (rolling) navigator.vibrate?.([25, 30, 25]);
  }, [rolling]);

  useEffect(() => {
    // 只暴露可读快照供浏览器验收，不提供绕过规则修改金币或库存的入口。
    window.render_game_to_text = () => JSON.stringify({
      mode: game.stage, gameMode: game.match.mode, chapterIndex: game.match.chapterIndex,
      id: game.id, cycle: game.match.cycle || 1, throwCount: game.throwCount, forecasts: game.forecasts,
      playerCount: game.players.length, round: game.round, maxRounds: game.match.maxRounds, activeId: active.id,
      order: game.players.map(player => player.id), godQueue: game.godQueue, dice: game.dice,
      dicePresentation: { phase: presentation.phase, displayedDice: dice, rollingIndices: presentation.rollingIndices, revealedCount: presentation.revealedCount, candidateIndex: presentation.candidateIndex },
      players: game.players.map(player => ({ id: player.id, name: player.name, title: player.title, career: player.career, careerTier: player.careerTier, careerState: player.careerState, style: player.style, seat: player.seat, archetype: player.archetype, branch: player.branch, luck: player.luck, missStreak: player.missStreak, stolenCount: player.stolenCount, coins: player.coins, items: player.items, awards: player.awards, buffs: player.buffs, score: scoreOf(player), protected: player.protected })),
      pool: game.pool, field: game.field, diceCount: game.diceCount, fieldSubmissions: game.fieldSubmissions, event: game.event, visuals: game.visuals, speech,
      coordinateSystem: '屏幕左上为原点，x 向右，y 向下；从底部座位逆时针行动',
    });
    return () => { delete window.render_game_to_text; };
  }, [game, speech, presentation, dice]);

  /** iOS 需要用户点击后请求动作权限；拒绝时仍可使用掷骰按钮。 */
  const requestMotion = async () => {
    const MotionEvent = window.DeviceMotionEvent;
    if (typeof MotionEvent?.requestPermission === 'function') {
      try {
        if (await MotionEvent.requestPermission() !== 'granted') {
          setMotionMessage('动作权限未开启，请点击掷骰子');
          return;
        }
      } catch {
        setMotionMessage('无法开启动作权限，请点击掷骰子');
        return;
      }
    }
    setShakeReady(true);
    setMotionMessage('摇一摇已开启，在你的掷骰前生效');
  };

  const playItem = (item, targetId) => {
    setTargetOpen(false);
    dispatch({ type: 'USE_ITEM', item, targetId });
  };

  const restart = () => {
    setTargetOpen(false);
    motionRef.current = { x: 0, y: 0, z: 0, lastShake: 0 };
    dispatch({ type: 'RESTART' });
  };

  return <PaperGame
    game={game}
    archive={archive}
    rewards={rewards?.[game.id]}
    storageError={storageError}
    speech={speech}
    dispatch={dispatch}
    dice={dice}
    presentation={presentation}
    profile={profile}
    muted={muted}
    onToggleSound={() => setMuted(!muted)}
    targetOpen={targetOpen}
    setTargetOpen={setTargetOpen}
    shakeReady={shakeReady}
    requestMotion={requestMotion}
    motionMessage={motionMessage}
    rollButton={rollButton}
    playItem={playItem}
    onRestart={restart}
    onHome={onHome}
    onContinue={onContinue ? () => onContinue(game) : undefined}
  />;
}
