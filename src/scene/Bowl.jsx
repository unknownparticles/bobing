import '../styles/bowl.css';
import { DICE_COUNT } from './useRollSequence.js';

/**
 * 碗(含 6 颗骰子)。点击事件由父级处理。
 * @param {object} props
 * @param {'idle'|'shaking'|'tossing'} props.phase 摇碗阶段
 * @param {React.ReactNode[]} props.dice 6 个骰子组件
 * @param {boolean} props.disabled 禁止点击(用于 busy 状态)
 */
export default function Bowl({ phase, dice, disabled }) {
  if (dice.length !== DICE_COUNT) throw new Error(`Bowl 需要 6 个骰子,实际 ${dice.length}`);

  const containerClass = ['bowl__container', phase === 'tossing' && 'is-tossing'].filter(Boolean).join(' ');
  const bowlClass = ['bowl', phase === 'shaking' && 'is-shaking'].filter(Boolean).join(' ');

  return (
    <div className={containerClass}>
      <div className={bowlClass} role="group" aria-label="碗与骰子">
        {/* 后三颗放上层,前三颗放下层,用 order 控制堆叠 */}
        <div className="bowl__layer bowl__layer--upper">
          {dice.slice(3, 6).map((d, i) => (
            <div key={`u${i}`} className={`bowl__dice-item bowl__dice-item--${i + 3}`}>
              {d}
            </div>
          ))}
        </div>
        <div className="bowl__layer bowl__layer--lower">
          {dice.slice(0, 3).map((d, i) => (
            <div key={`l${i}`} className={`bowl__dice-item bowl__dice-item--${i}`}>
              {d}
            </div>
          ))}
        </div>
        <div className="bowl__body" aria-hidden="true">
          <svg viewBox="0 0 200 200" className="bowl__svg">
            <defs>
              <radialGradient id="bowl-grad">
                <stop offset="0%" stopColor="var(--color-porcelain-light)" />
                <stop offset="100%" stopColor="var(--color-porcelain)" />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="90" fill="url(#bowl-grad)" />
          </svg>
        </div>
      </div>
      {!disabled && (
        <div className="sr-only" role="status" aria-live="polite">
          {phase === 'shaking' ? '摇碗中……' : phase === 'tossing' ? '骰子翻滚中……' : ''}
        </div>
      )}
    </div>
  );
}
