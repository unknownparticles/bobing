// @vitest-environment jsdom
import React from 'react';
import { it, expect, vi, afterEach } from 'vitest';
import { act, render, cleanup } from '@testing-library/react';
import { useGame } from './useGame';
import { COUNTERCLOCKWISE_SEATS } from './config';
import { VISUAL_DURATION_MS } from './visuals';

afterEach(() => { cleanup(); vi.useRealTimers(); });

it('动画队列播完后才推进机器人，清理后旧计时器不再结算', () => {
  vi.useFakeTimers();
  let current;
  const players = COUNTERCLOCKWISE_SEATS.map((seat, index) => ({ id: index ? `bot-${index}` : 'you', name: `玩家${index}`, seat }));
  const rng = () => .55;
  function Harness() { current = useGame(players, rng); return null; }
  const view = render(<Harness />);
  act(() => current.dispatch({ type: 'ROLL' }));
  act(() => vi.advanceTimersByTime(1120));
  expect(current.game.stage).toBe('review');
  act(() => current.dispatch({ type: 'CONFIRM' }));
  expect(current.game.visuals).toHaveLength(1); expect(current.game.turnIndex).toBe(0);
  act(() => vi.advanceTimersByTime(VISUAL_DURATION_MS - 1));
  expect(current.game.visuals).toHaveLength(1); expect(current.game.turnIndex).toBe(0);
  act(() => vi.advanceTimersByTime(1));
  expect(current.game.visuals).toHaveLength(0); expect(current.game.turnIndex).toBe(0);
  act(() => vi.advanceTimersByTime(1800));
  expect(current.game.turnIndex).toBe(1);
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
