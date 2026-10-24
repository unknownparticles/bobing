import '../styles/opponent.css';

/**
 * 对手 NPC(陈主管)。
 * @param {object} props
 * @param {'neutral'|'smug'|'upset'} props.expression 表情
 * @param {string} props.line 台词(置空表示不显示)
 */
export default function Opponent({ expression, line }) {
  const avatarClass = ['opponent__avatar', `opponent__avatar--${expression}`].join(' ');
  return (
    <div className="opponent">
      <div className={avatarClass} role="img" aria-label={`对手表情:${expression}`}>
        {/* 占位色块,生产版里替换为贴图 */}
        <svg viewBox="0 0 80 80" className="opponent__placeholder">
          <circle cx="40" cy="40" r="38" fill="var(--color-muted)" />
          <text x="40" y="50" textAnchor="middle" fontSize="36" fill="var(--color-cream)">
            陈
          </text>
        </svg>
      </div>
      {line && (
        <div className="opponent__speech" role="status" aria-live="polite">
          <p className="opponent__line">{line}</p>
        </div>
      )}
    </div>
  );
}
