import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAudioEngine } from './audio';
import { soundForVisual } from './game/useGameAudio';

class MockAudio {
  static instances = [];

  constructor(src) {
    this.src = src;
    this.currentTime = 0;
    this.loop = false;
    this.preload = '';
    this.volume = 1;
    this.play = vi.fn(() => Promise.resolve());
    this.pause = vi.fn();
    this.addEventListener = vi.fn();
    MockAudio.instances.push(this);
  }
}

describe('audio engine', () => {
  beforeEach(() => {
    MockAudio.instances = [];
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('waits for interaction before starting looping background music', () => {
    const engine = createAudioEngine(MockAudio);
    engine.setMusic('bgm.home');

    expect(MockAudio.instances[0].src).toContain('audio/bgm-home.mp3');
    expect(MockAudio.instances[0].loop).toBe(true);
    expect(MockAudio.instances[0].play).not.toHaveBeenCalled();

    engine.unlock();
    expect(MockAudio.instances[0].play).toHaveBeenCalledOnce();
    engine.destroy();
  });

  it('switches music and applies mute to music and effects', () => {
    const engine = createAudioEngine(MockAudio);
    engine.setMusic('bgm.home');
    engine.unlock();
    engine.play('sfx.ui.click');
    const home = MockAudio.instances[0];
    const click = MockAudio.instances[1];

    expect(click.src).toContain('audio/ui-click.wav');
    expect(click.play).toHaveBeenCalledOnce();

    engine.setMusic('bgm.shop');
    const shop = MockAudio.instances[2];
    expect(shop.play).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(600);
    expect(home.pause).toHaveBeenCalled();

    engine.setMuted(true);
    expect(shop.pause).toHaveBeenCalled();
    engine.play('sfx.shop.buy');
    expect(MockAudio.instances).toHaveLength(3);
    engine.destroy();
  });
});

describe('game visual sound mapping', () => {
  it.each([
    [{ kind: 'champion', awardId: 'zhuangyuan' }, 'sfx.reward.champion'],
    [{ kind: 'transfer', awardId: 'sanhong', sourceId: 'you', targetId: 'you' }, 'sfx.reward.win'],
    [{ kind: 'transfer', awardId: 'sanhong', sourceId: 'bot', targetId: 'you' }, 'sfx.item.transfer'],
    [{ kind: 'attack' }, 'sfx.item.attack'],
    [{ kind: 'shield' }, 'sfx.item.shield'],
    [{ kind: 'skill', icon: 'reroll' }, 'sfx.item.cast'],
    [{ kind: 'score', icon: 'salary' }, 'sfx.blessing.activate'],
    [{ kind: 'field' }, null],
  ])('maps %j to %s', (visual, expected) => {
    expect(soundForVisual(visual)).toBe(expected);
  });
});
