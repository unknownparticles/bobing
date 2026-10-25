import { useCallback, useEffect, useRef, useState } from 'react';
import { banterCue, chooseSpeech } from './banter';

const WAIT_MS = 10000;
const DISPLAY_MS = 4000;

/** 管理气泡期限和每回合一次的催促；离桌、商店及终局不会留下计时器。 */
export function useBanter(game) {
  const [speech, setSpeech] = useState(null);
  const previous = useRef(game);
  const current = useRef(null);
  const lastText = useRef('');
  const remindedTurn = useRef(null);
  const sequence = useRef(0);
  const active = game.players[game.turnIndex];

  const showSpeech = useCallback((cue, players) => {
    // 保留完整阅读时间，忽略期间发生的闲聊，不积压已经过时的台词。
    if (current.current && Date.now() < current.current.until) return false;
    const next = chooseSpeech(cue, players, lastText.current);
    if (!next) return false;
    lastText.current = next.text;
    current.current = { ...next, id: ++sequence.current, until: Date.now() + DISPLAY_MS };
    setSpeech(current.current);
    return true;
  }, []);

  useEffect(() => {
    const before = previous.current;
    previous.current = game;
    if (['shop', 'finished'].includes(game.stage) || before.stage === 'finished' || game.round < before.round) {
      current.current = null;
      remindedTurn.current = null;
      setSpeech(null);
      return;
    }
    // 玩家行动后马上撤掉催促；动画 ACK 不属于玩家的新操作。
    if (current.current?.kind === 'wait' && before.log !== game.log) {
      current.current = null;
      setSpeech(null);
    }
    const cue = banterCue(before, game);
    if (cue) showSpeech(cue, game.players);
  }, [game, showSpeech]);

  useEffect(() => {
    if (!speech) return undefined;
    const timer = window.setTimeout(() => {
      // 旧气泡的回调不能清除后来出现的新台词。
      if (current.current?.id === speech.id) {
        current.current = null;
        setSpeech(null);
      }
    }, Math.max(0, speech.until - Date.now()));
    return () => window.clearTimeout(timer);
  }, [speech]);

  useEffect(() => {
    const turnKey = `${game.round}:${active.id}`;
    if (active.id !== 'you' || !['ready', 'review'].includes(game.stage) || remindedTurn.current === turnKey) return undefined;
    const timer = window.setTimeout(() => {
      if (showSpeech({ kind: 'wait' }, game.players)) remindedTurn.current = turnKey;
    }, WAIT_MS);
    return () => window.clearTimeout(timer);
  }, [active.id, game.round, game.stage, game.log, showSpeech]);

  return ['shop', 'finished'].includes(game.stage) ? null : speech;
}
