/** 六类局部装饰只表现已发生事件，不绘制或改写实际骰点与奖项。 */
export default function SkillEffectScene({ theme, event, point, hostile = false }) {
  return <div className={`skill-effect-scene scene-${theme}`} style={{ left: point.x, top: point.y }} aria-hidden="true">
    <svg viewBox="0 0 200 200" fill="none">
      <circle className="skill-aura" cx="100" cy="100" r="73" />
      {theme === 'dice' && <g className="skill-dice-orbit">
        <ellipse cx="100" cy="100" rx="84" ry="49" className="skill-fine-line" />
        {[[-36, -10, -15], [5, -35, 12], [23, 14, 20]].map(([x, y, angle], index) => <g key={index} transform={`translate(${x} ${y}) rotate(${angle} 100 100)`}>
          <rect x="83" y="83" width="34" height="34" rx="6" className="skill-die-outline" />
          <path d="M92 92h16M92 100h16M92 108h16" className="skill-die-mark" />
        </g>)}
      </g>}
      {theme === 'transfer' && <g className="skill-transfer-burst">
        {hostile ? <path d="m77 56 49 47-18 7 14 34-49-48 20-5Z" className="skill-seal-fill" /> : <>
          <circle cx="100" cy="100" r="37" className="skill-medallion" />
          <rect x="89" y="89" width="22" height="22" rx="2" className="skill-fine-line" />
          <path d="m100 51 8 15 17 3-12 12 2 18-15-8-15 8 2-18-12-12 17-3Z" className="skill-medallion-star" />
        </>}
      </g>}
      {theme === 'guard' && <g className="skill-shield-form">
        <path d="M100 40c18 13 35 17 51 18v43c0 31-26 50-51 61-25-11-51-30-51-61V58c16-1 33-5 51-18Z" className="skill-shield-fill" />
        <path d="m77 100 16 16 31-35" className="skill-shield-check" />
        <path d="M39 67c-14 29-12 55 3 75m119-75c14 29 12 55-3 75" className="skill-fine-line" />
      </g>}
      {theme === 'redirect' && <g className="skill-redirect-loop">
        <path d="M55 93c0-46 76-58 94-10m0 0-3-23m3 23-23-1M145 107c0 46-76 58-94 10m0 0 3 23m-3-23 23 1" className="skill-loop-line" />
        {event.kind === 'substitute' ? <path d="M84 78h32v49H84Zm-12 8 12 7m32 0 12-7m-35 41-7 17m21-17 7 17" className="skill-fine-line" /> : <circle cx="100" cy="100" r="17" className="skill-medallion" />}
      </g>}
      {theme === 'blessing' && <g className="skill-blessing-seal">
        <rect x="51" y="51" width="98" height="98" rx="20" className="skill-seal-outline" />
        {event.kind === 'bond' ? <path d="M100 125c-57-30-40-65-19-57 8 3 13 11 19 17 6-6 11-14 19-17 21-8 38 27-19 57Z" className="skill-heart-line" /> : <>
          <path d="M100 63c27 22 27 51 0 73-27-22-27-51 0-73Z" className="skill-leaf" />
          <path d="M64 94c31-9 53 5 60 35-31 9-53-5-60-35Zm72 0c-31-9-53 5-60 35 31 9 53-5 60-35Z" className="skill-leaf" />
        </>}
      </g>}
      {theme === 'field' && <g className="skill-field-waves">
        {[42, 62, 82].map((radius, index) => <circle key={radius} cx="100" cy="100" r={radius} className={`skill-field-wave wave-${index}`} />)}
        <path d="M100 19v22m0 118v22M19 100h22m118 0h22M43 43l16 16m82 82 16 16M43 157l16-16m82-82 16-16" className="skill-fine-line" />
      </g>}
      <g className="skill-sparks">{[0, 60, 120, 180, 240, 300].map(angle => <path key={angle} d="M100 12v13m-5-6h10" transform={`rotate(${angle} 100 100)`} />)}</g>
    </svg>
  </div>;
}
