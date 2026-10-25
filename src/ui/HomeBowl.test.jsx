// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HomeBowl from './HomeBowl.jsx';
import { totalDurationMs } from '../scene/useRollSequence.js';

// 3D 画布依赖 WebGL 与 ResizeObserver，测试里只验证交互与判奖文本。
vi.mock('../scene/bowl3d/BowlCanvas.jsx', () => ({ default: () => null }));

const caption = () => screen.getByRole('status');

/** 触发一次超过阈值的摇动；第一次只记录基准值。 */
const shake = (x, y, z) => act(() => {
  window.dispatchEvent(Object.assign(new Event('devicemotion'), { accelerationIncludingGravity: { x, y, z } }));
});

beforeEach(() => {
  vi.useFakeTimers();
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('首页骰碗', () => {
  it('默认展示六颗骰子与可访问的摇碗按钮', () => {
    const { container } = render(<HomeBowl />);
    expect(screen.getByRole('button', { name: /点击或摇动手机都可以博一次饼/ })).toBeInTheDocument();
    expect(container.querySelectorAll('.paper-die')).toHaveLength(6);
    expect(caption()).toHaveTextContent('点击骰碗或摇一摇，都能博一饼');
  });

  it('点击后开始摇碗，演出结束给出判奖结果', async () => {
    render(<HomeBowl />);
    fireEvent.click(screen.getByRole('button', { name: /博一次饼/ }));
    expect(caption()).toHaveTextContent('骰子落金盘 · 好运将至');
    expect(screen.getByRole('status').className).toContain('is-rolling');

    await act(async () => { vi.advanceTimersByTime(totalDurationMs() + 50); });
    expect(caption().textContent).toMatch(/(· \d+ 分|没中)$/);
    expect(caption().className).not.toContain('is-rolling');
  });

  it('摇动手机同样触发一次博饼', async () => {
    render(<HomeBowl />);
    shake(0, 0, 0);
    expect(caption()).toHaveTextContent('点击骰碗或摇一摇，都能博一饼');

    shake(30, 12, 4);
    expect(caption()).toHaveTextContent('骰子落金盘 · 好运将至');

    await act(async () => { vi.advanceTimersByTime(totalDurationMs() + 50); });
    expect(caption().textContent).toMatch(/(· \d+ 分|没中)$/);
  });

  it('演出进行中的重复触发被忽略，不会重启时间线', async () => {
    render(<HomeBowl />);
    fireEvent.click(screen.getByRole('button', { name: /博一次饼/ }));
    await act(async () => { vi.advanceTimersByTime(totalDurationMs() - 400); });
    fireEvent.click(screen.getByRole('button', { name: /博一次饼/ }));
    expect(caption()).toHaveTextContent('骰子落金盘 · 好运将至');

    await act(async () => { vi.advanceTimersByTime(500); });
    expect(caption().textContent).toMatch(/(· \d+ 分|没中)$/);
  });
});
