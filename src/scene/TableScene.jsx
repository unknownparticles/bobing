import { useMemo, useState } from 'react';
import Bowl from './Bowl.jsx';
import Die3D from './Die3D.jsx';
import Opponent from './Opponent.jsx';
import { expressionOf, pickLine } from './lines.js';
import { DICE_COUNT, tumbleMsOf, useRollSequence } from './useRollSequence.js';

/**
 * 整个骰宝桌面场景:对手、碗(含 6 颗 3D 骰子)。
 * 不可见的 button 接管点击,满足无障碍要求。
 * @param {object} props
 * @param {() => number} [props.rng] 可注入的 rng,主要用于测试与后续联机对战
 * @param {boolean} [props.reducedMotion] 减少动态效果(系统设置或用户手动开关)
 * @param {(result) => void} [props.onRollComplete] 摇碗完成(shown 时)触发
 */
export default function TableScene({ rng, reducedMotion, onRollComplete }) {
  const [opponentLine, setOpponentLine] = useState(pickLine('idle'));
  const [opponentExpr, setOpponentExpr] = useState('neutral');
  const [highlights, setHighlights] = useState([]);

  const { phase, dice, settled, busy, roll, skip } = useRollSequence({
    rng,
    reducedMotion,
    onStart: (result) => {
      setOpponentLine(pickLine('rolling', Math.random));
      setOpponentExpr('neutral');
      setHighlights([]);
    },
    onDieSettle: (index, value) => {
      if (value === 4) setHighlights((hs) => [...hs, index]);
    },
    onShown: (result) => {
      setOpponentLine(pickLine(result.tier, Math.random));
      setOpponentExpr(expressionOf(result.tier));
      onRollComplete?.(result);
    },
  });

  const diceElements = useMemo(
    () =>
      dice.map((value, i) => {
        const tumbling = phase === 'tossing';
        const settling = settled[i];
        return (
          <Die3D
            key={i}
            value={value}
            tumbling={tumbling && !settling}
            settling={settling}
            index={i}
            highlight={highlights.includes(i)}
            style={tumbling ? { animationDuration: `${tumbleMsOf(i)}ms` } : undefined}
          />
        );
      }),
    [dice, phase, settled, highlights],
  );

  return (
    <div className="table-scene">
      <Opponent expression={opponentExpr} line={opponentLine} />

      {/* 不可见按钮:覆盖碗的区域,响应键盘。点击时触发摇碗或跳过。 */}
      <button
        type="button"
        onClick={busy ? skip : roll}
        disabled={false}
        aria-label={busy ? '跳过动画' : '摇碗掷骰'}
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '200px',
          height: '200px',
          padding: 0,
          background: 'transparent',
          border: 'none',
          cursor: busy ? 'default' : 'pointer',
          zIndex: 10,
        }}
      />

      <Bowl phase={phase} dice={diceElements} disabled={false} />

      {/* 实时反馈读屏状态变化。台词已在 Opponent 里用 aria-live。 */}
      <div className="sr-only" role="status" aria-live="assertive">
        {phase === 'shown' && dice.length === DICE_COUNT && `摇碗结果:${dice.join(', ')}`}
      </div>
    </div>
  );
}
