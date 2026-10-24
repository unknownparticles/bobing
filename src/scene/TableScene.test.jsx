// @vitest-environment jsdom
import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Die3D from './Die3D.jsx';
import Bowl from './Bowl.jsx';
import Opponent from './Opponent.jsx';
import TableScene from './TableScene.jsx';

describe('骰子渲染', () => {
  it('显示正确的点数', () => {
    const { container } = render(<Die3D value={4} />);
    expect(container.querySelector('[aria-label="骰子 4 点"]')).toBeInTheDocument();
  });

  it('点数 1 与 4 含有红点样式类', () => {
    const { container: c1 } = render(<Die3D value={1} />);
    const { container: c4 } = render(<Die3D value={4} />);
    expect(c1.querySelector('.die__dot--red')).toBeInTheDocument();
    expect(c4.querySelector('.die__dot--red')).toBeInTheDocument();
  });

  it('highlight 时添加类名', () => {
    const { container } = render(<Die3D value={4} highlight />);
    expect(container.querySelector('.die--highlight')).toBeInTheDocument();
  });

  it('tumbling 时添加翻滚类', () => {
    const { container } = render(<Die3D value={3} tumbling index={0} />);
    expect(container.querySelector('.is-tumbling')).toBeInTheDocument();
  });

  it('settling 时添加落定类', () => {
    const { container } = render(<Die3D value={2} settling />);
    expect(container.querySelector('.is-settling')).toBeInTheDocument();
  });
});

describe('碗渲染', () => {
  it('需要 6 个骰子，数量不足时报错', () => {
    expect(() =>
      render(<Bowl phase="idle" dice={[<div key="1" />]} disabled={false} />),
    ).toThrow(/需要 6 个骰子/);
  });

  it('显示骰子数组与碗体', () => {
    const dice = Array.from({ length: 6 }, (_, i) => <div key={i} data-testid={`d${i}`} />);
    render(<Bowl phase="idle" dice={dice} disabled={false} />);
    for (let i = 0; i < 6; i += 1) expect(screen.getByTestId(`d${i}`)).toBeInTheDocument();
    expect(screen.getByLabelText(/碗与骰子/)).toBeInTheDocument();
  });

  it('shaking 时添加摇碗类', () => {
    const dice = Array.from({ length: 6 }, (_, i) => <div key={i} />);
    const { container } = render(<Bowl phase="shaking" dice={dice} disabled={false} />);
    expect(container.querySelector('.is-shaking')).toBeInTheDocument();
  });

  it('tossing 时添加抛出类', () => {
    const dice = Array.from({ length: 6 }, (_, i) => <div key={i} />);
    const { container } = render(<Bowl phase="tossing" dice={dice} disabled={false} />);
    expect(container.querySelector('.is-tossing')).toBeInTheDocument();
  });
});

describe('对手渲染', () => {
  it('显示台词', () => {
    render(<Opponent expression="neutral" line="摇碗前的台词" />);
    expect(screen.getByText('摇碗前的台词')).toBeInTheDocument();
  });

  it('不提供 line 时不显示气泡', () => {
    const { container } = render(<Opponent expression="neutral" line="" />);
    expect(container.querySelector('.opponent__speech')).not.toBeInTheDocument();
  });

  it('表情类名正确', () => {
    const { container: upset } = render(<Opponent expression="upset" line="" />);
    const { container: smug } = render(<Opponent expression="smug" line="" />);
    expect(upset.querySelector('.opponent__avatar--upset')).toBeInTheDocument();
    expect(smug.querySelector('.opponent__avatar--smug')).toBeInTheDocument();
  });
});

describe('TableScene 整体', () => {
  it('初始渲染包含对手与摇碗按钮', () => {
    const { container } = render(<TableScene />);
    expect(screen.getByRole('button', { name: /摇碗/ })).toBeInTheDocument();
    expect(container.querySelector('.table-scene')).toBeInTheDocument();
    expect(container.querySelector('.opponent')).toBeInTheDocument();
  });

  it('reducedMotion 时，摇碗直接展示结果(不经过 tossing)', async () => {
    const onRollComplete = vi.fn();
    const rng = () => 0.5;
    render(<TableScene rng={rng} reducedMotion onRollComplete={onRollComplete} />);
    
    const buttons = screen.getAllByRole('button', { name: /摇碗/ });
    buttons[buttons.length - 1].click(); // 取最后一个(最新渲染的)
    
    await waitFor(
      () => {
        expect(onRollComplete).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );
    
    expect(onRollComplete.mock.calls[0][0].dice).toEqual([4, 4, 4, 4, 4, 4]);
  });
});
