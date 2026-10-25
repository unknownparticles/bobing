import { useEffect, useRef } from 'react';
import { getItem } from './catalog';
import { placeOf } from './modes';

function soundForVisual(event) {
  if (!event || event.kind === 'field') return null;
  if (event.outcome === 'blocked') return 'sfx.item.shield';
  if (event.kind === 'champion') return event.awardId === 'zhuangyuan' ? 'sfx.reward.champion' : 'sfx.blessing.activate';
  if (event.kind === 'transfer') return event.awardId && event.sourceId === event.targetId ? 'sfx.reward.win' : 'sfx.item.transfer';
  if (event.kind === 'attack') return 'sfx.item.attack';
  if (['shield', 'reflect', 'substitute'].includes(event.kind)) return 'sfx.item.shield';
  if (event.kind === 'bond') return 'sfx.item.transfer';
  if (event.kind === 'score') return 'sfx.blessing.activate';
  if (event.kind === 'skill') return getItem(event.icon)?.category === 'god' ? 'sfx.blessing.activate' : 'sfx.item.cast';
  return 'sfx.item.cast';
}

const shopCount = game => game.purchased?.you?.length || 0;
const refreshCount = game => game.shopRefreshes?.you || 0;

/** Maps committed game state and animation phases to audio without changing game rules. */
export function useGameAudio(game, presentation, audio) {
  const previous = useRef(null);
  const latestStage = useRef(game.stage);
  const delayedSounds = useRef(new Set());
  latestStage.current = game.stage;

  useEffect(() => {
    audio.setMusic(game.stage === 'shop' ? 'bgm.shop' : 'bgm.table');
  }, [audio, game.stage]);

  useEffect(() => () => {
    for (const timer of delayedSounds.current) window.clearTimeout(timer);
    delayedSounds.current.clear();
  }, []);

  useEffect(() => {
    const snapshot = {
      id: game.id,
      stage: game.stage,
      round: game.round,
      visualId: game.visuals?.[0]?.id || null,
      presentationPhase: presentation?.phase || 'idle',
      purchases: shopCount(game),
      refreshes: refreshCount(game),
    };
    const before = previous.current;
    previous.current = snapshot;
    if (!before || before.id !== game.id) return;

    const enteredFinished = game.stage === 'finished' && before.stage !== 'finished';
    if (enteredFinished) {
      audio.play(placeOf(game) === 1 ? 'sfx.result.victory' : 'sfx.result.defeat');
      return;
    }

    if (snapshot.presentationPhase === 'rolling' && before.presentationPhase !== 'rolling') audio.play('sfx.dice.roll');
    if (snapshot.presentationPhase === 'holding' && before.presentationPhase !== 'holding') audio.play('sfx.dice.settle');

    if (game.stage === 'shop' && before.stage !== 'shop') {
      audio.play('sfx.result.round');
      const timer = window.setTimeout(() => {
        delayedSounds.current.delete(timer);
        if (latestStage.current === 'shop') audio.play('sfx.shop.open');
      }, 1200);
      delayedSounds.current.add(timer);
    }
    if (game.round > before.round && game.field) audio.play('sfx.field.change');
    if (snapshot.purchases > before.purchases) audio.play('sfx.shop.buy');
    if (snapshot.refreshes > before.refreshes) audio.play('sfx.shop.refresh');

    const visual = game.visuals?.[0];
    if (snapshot.visualId && snapshot.visualId !== before.visualId) {
      const sound = soundForVisual(visual);
      if (sound) audio.play(sound);
    }
  }, [audio, game, presentation?.phase]);
}

export { soundForVisual };
