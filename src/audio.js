import { useEffect } from 'react';

const AUDIO_FILES = {
  'bgm.home': 'bgm-home.mp3',
  'bgm.table': 'bgm-table.mp3',
  'bgm.shop': 'bgm-shop.mp3',
  'sfx.dice.roll': 'dice-roll.wav',
  'sfx.dice.settle': 'dice-settle.wav',
  'sfx.reward.win': 'reward-win.wav',
  'sfx.reward.champion': 'reward-champion.wav',
  'sfx.ui.click': 'ui-click.wav',
  'sfx.ui.confirm': 'ui-confirm.wav',
  'sfx.ui.back': 'ui-back.wav',
  'sfx.item.cast': 'item-cast.wav',
  'sfx.item.attack': 'item-attack.wav',
  'sfx.item.shield': 'item-shield.wav',
  'sfx.item.transfer': 'item-transfer.wav',
  'sfx.blessing.activate': 'blessing-activate.wav',
  'sfx.field.change': 'field-change.wav',
  'sfx.shop.open': 'shop-open.wav',
  'sfx.shop.buy': 'shop-buy.wav',
  'sfx.shop.refresh': 'shop-refresh.wav',
  'sfx.result.round': 'result-round.wav',
  'sfx.result.victory': 'result-victory.wav',
  'sfx.result.defeat': 'result-defeat.wav',
};

const MUSIC_VOLUME = 0.34;
const SFX_VOLUME = 0.72;
const MUSIC_FADE_MS = 500;
const baseUrl = import.meta.env.BASE_URL || '/';
const sourceOf = key => `${baseUrl}audio/${AUDIO_FILES[key]}`;

export function createAudioEngine(AudioConstructor = globalThis.Audio) {
  let muted = false;
  let unlocked = false;
  let musicKey = null;
  let music = null;
  let previousMusic = null;
  let fadeTimer = null;
  const activeEffects = new Set();

  const createAudio = key => {
    if (!AudioConstructor || !AUDIO_FILES[key]) return null;
    return new AudioConstructor(sourceOf(key));
  };

  const clearFade = () => {
    if (fadeTimer !== null) globalThis.clearInterval(fadeTimer);
    fadeTimer = null;
  };

  const stopPreviousMusic = () => {
    if (!previousMusic) return;
    previousMusic.pause();
    previousMusic.currentTime = 0;
    previousMusic = null;
  };

  const safelyPlay = audio => {
    if (!audio) return;
    try {
      const promise = audio.play();
      promise?.catch?.(() => {});
    } catch {
      // Audio playback is optional; unsupported media must not interrupt the game.
    }
  };

  const startCurrentMusic = (crossfade = false) => {
    if (!music || muted || !unlocked) return;
    safelyPlay(music);
    if (!crossfade || !previousMusic) {
      music.volume = MUSIC_VOLUME;
      stopPreviousMusic();
      return;
    }
    const startedAt = Date.now();
    clearFade();
    fadeTimer = globalThis.setInterval(() => {
      const progress = Math.min(1, (Date.now() - startedAt) / MUSIC_FADE_MS);
      music.volume = MUSIC_VOLUME * progress;
      if (previousMusic) previousMusic.volume = MUSIC_VOLUME * (1 - progress);
      if (progress < 1) return;
      clearFade();
      stopPreviousMusic();
    }, 40);
  };

  return {
    setMuted(nextMuted) {
      muted = Boolean(nextMuted);
      if (muted) {
        clearFade();
        music?.pause();
        stopPreviousMusic();
        for (const effect of activeEffects) effect.pause();
        activeEffects.clear();
      } else {
        startCurrentMusic();
      }
    },

    unlock() {
      if (unlocked) return;
      unlocked = true;
      startCurrentMusic();
    },

    setMusic(key) {
      if (key === musicKey || !key?.startsWith('bgm.') || !AUDIO_FILES[key]) return;
      clearFade();
      stopPreviousMusic();
      previousMusic = music;
      musicKey = key;
      music = createAudio(key);
      if (!music) return;
      music.loop = true;
      music.preload = 'auto';
      music.volume = previousMusic && unlocked && !muted ? 0 : MUSIC_VOLUME;
      if (muted || !unlocked) {
        previousMusic?.pause();
        stopPreviousMusic();
        return;
      }
      startCurrentMusic(Boolean(previousMusic));
    },

    play(key) {
      if (muted || !unlocked || !key?.startsWith('sfx.') || !AUDIO_FILES[key]) return;
      const effect = createAudio(key);
      if (!effect) return;
      effect.volume = SFX_VOLUME;
      effect.preload = 'auto';
      activeEffects.add(effect);
      const release = () => activeEffects.delete(effect);
      effect.addEventListener?.('ended', release, { once: true });
      effect.addEventListener?.('error', release, { once: true });
      safelyPlay(effect);
    },

    destroy() {
      clearFade();
      music?.pause();
      stopPreviousMusic();
      for (const effect of activeEffects) effect.pause();
      activeEffects.clear();
      music = null;
      musicKey = null;
      unlocked = false;
    },

    getState() {
      return { muted, unlocked, musicKey };
    },
  };
}

const engine = createAudioEngine();

export const audioController = Object.freeze({
  setMusic: key => engine.setMusic(key),
  play: key => engine.play(key),
});

function interfaceSound(button) {
  const label = `${button.getAttribute('aria-label') || ''} ${button.textContent || ''}`;
  if (/返回|回看|关闭|取消/.test(label)) return 'sfx.ui.back';
  if (button.classList.contains('paper-primary') || /确认|开始|入席|开启/.test(label)) return 'sfx.ui.confirm';
  return 'sfx.ui.click';
}

/** Keeps one audio engine alive across screens and unlocks playback on the first interaction. */
export function useAudio(muted) {
  useEffect(() => engine.setMuted(muted), [muted]);

  useEffect(() => {
    const unlock = event => {
      if (event.target.closest?.('[data-audio-toggle][aria-label="关闭声音"]')) return;
      engine.unlock();
    };
    const playInterfaceSound = event => {
      const button = event.target.closest?.('button:not(:disabled)');
      if (!button) return;
      if (button.hasAttribute('data-audio-toggle')) {
        if (button.getAttribute('aria-label') === '开启声音') engine.unlock();
        return;
      }
      engine.unlock();
      engine.play(interfaceSound(button));
    };
    document.addEventListener('pointerdown', unlock, true);
    document.addEventListener('keydown', unlock, true);
    document.addEventListener('click', playInterfaceSound);
    return () => {
      document.removeEventListener('pointerdown', unlock, true);
      document.removeEventListener('keydown', unlock, true);
      document.removeEventListener('click', playInterfaceSound);
      engine.destroy();
    };
  }, []);

  return audioController;
}
