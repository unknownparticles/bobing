import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { botBeforeRoll, botAfterRoll } from './bots.js';
import { createGame, gameReducer } from './state.js';
import { resolveAction } from './rolls';
import { VISUAL_DURATION_MS } from './visuals';

/** 对局动画与回合节奏；每阶段一个可清理计时器，商店及终局不自动推进。 */
export function useGame(players, rng = Math.random) {
  const [game, rawDispatch] = useReducer(gameReducer, players, createGame);
  const current = useRef(game);
  current.current = game;
  const dispatch = useCallback(action => rawDispatch(resolveAction(current.current, action, rng)), [rng]);
  const [animatedDice, setAnimatedDice] = useState(game.dice);

  useEffect(() => {
    const visual = game.visuals?.[0];
    if (visual) {
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const timer = window.setTimeout(() => dispatch({ type: 'ACK_VISUAL', id: visual.id }), reduced ? 550 : VISUAL_DURATION_MS);
      return () => window.clearTimeout(timer);
    }
    const robot = game.players[game.turnIndex].id !== 'you';
    if (game.stage === 'rolling') {
      let tick = 0;
      const timer = window.setInterval(() => {
        const dice = Array.from({ length: game.diceCount }, () => 1 + Math.floor(rng() * 6));
        setAnimatedDice(dice);
        tick += 1;
        // 玩家保留摇碗手感，机器人只播放六帧，减少连续旁观五人的等待。
        if (tick === (robot ? 6 : 14)) {
          window.clearInterval(timer);
          dispatch({ type: 'SHOW_ROLL' });
        }
      }, 80);
      return () => window.clearInterval(timer);
    }

    let action;
    let delay;
    if (game.stage === 'ready' && game.players[game.turnIndex].id !== 'you') {
      action = botBeforeRoll(game);
      // 抢夺或保护已经生效，留出读完提示的时间再掷骰。
      delay = game.eventType === 'skill' ? 1100 : 250;
    } else if (game.stage === 'review') {
      // 玩家可连续改骰，必须自己确认，不能被自动计时器抢先发奖。
      if (!robot) return;
      action = botAfterRoll(game);
      delay = robot ? 350 : 900;
    } else if (game.stage === 'settled') {
      action = { type: 'ADVANCE' };
      delay = game.eventType === 'jackpot' ? 1800 : robot ? 250 : 800;
    }
    if (action) {
      const timer = window.setTimeout(() => dispatch(action), delay);
      return () => window.clearTimeout(timer);
    }
  }, [game, rng]);

  return { game, dispatch, dice: game.stage === 'rolling' ? animatedDice : game.dice };
}
